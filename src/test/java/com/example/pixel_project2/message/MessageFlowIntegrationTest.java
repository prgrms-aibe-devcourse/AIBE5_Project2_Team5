package com.example.pixel_project2.message;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.example.pixel_project2.message.websocket.MessagePresenceTracker;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Map;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class MessageFlowIntegrationTest {
    private static final String BEARER = "Bearer ";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private MessagePresenceTracker messagePresenceTracker;

    @Test
    void usersCanCreateSendFetchAndDeleteConversation() throws Exception {
        JsonNode firstUser = signUp("message-a@test.io", "Message A", "messageA", "DESIGNER");
        JsonNode secondUser = signUp("message-b@test.io", "Message B", "messageB", "CLIENT");

        String firstToken = login("message-a@test.io", "testPass1!");
        String secondToken = login("message-b@test.io", "testPass1!");

        long firstUserId = firstUser.path("userId").asLong();
        long secondUserId = secondUser.path("userId").asLong();

        MvcResult createConversationResult = mockMvc.perform(post("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("partnerUserId", secondUserId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.partnerUserId").value(secondUserId))
                .andReturn();

        long conversationId = readData(createConversationResult).path("id").asLong();

        mockMvc.perform(post("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("partnerUserId", firstUserId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(conversationId));

        Map<String, Object> messageRequest = Map.of(
                "clientId", "message-client-1",
                "message", "hello from integration test",
                "attachments", List.of(
                        Map.of(
                                "id", "image-1",
                                "type", "image",
                                "name", "sample.png",
                                "src", "https://cdn.pickxel.test/messages/sample.png",
                                "uploadedUrl", "https://temporary.invalid/uploaded.png",
                                "mimeType", "image/png",
                                "size", 128,
                                "uploadStatus", "ready"
                        ),
                        Map.of(
                                "id", "file-1",
                                "type", "file",
                                "name", "brief.pdf",
                                "url", "https://cdn.pickxel.test/messages/brief.pdf",
                                "mimeType", "application/pdf",
                                "size", 256,
                                "uploadStatus", "ready"
                        ),
                        Map.of(
                                "id", "icon-1",
                                "type", "icon",
                                "name", "thumbs-up",
                                "value", ":thumbs_up:"
                        ),
                        Map.of(
                                "id", "figma-1",
                                "type", "integration",
                                "provider", "figma",
                                "url", "https://figma.com/file/abc123",
                                "name", "Figma link",
                                "previewTitle", "Preview title",
                                "previewDescription", "Preview description",
                                "host", "figma.com",
                                "uploadStatus", "ready"
                        )
                )
        );

        MvcResult firstSendResult = mockMvc.perform(post("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(messageRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.clientId").value("message-client-1"))
                .andExpect(jsonPath("$.data.message").value("hello from integration test"))
                .andExpect(jsonPath("$.data.attachments[0].type").value("image"))
                .andExpect(jsonPath("$.data.attachments[0].src").value("https://cdn.pickxel.test/messages/sample.png"))
                .andExpect(jsonPath("$.data.attachments[0].uploadStatus").doesNotExist())
                .andExpect(jsonPath("$.data.attachments[1].type").value("file"))
                .andExpect(jsonPath("$.data.attachments[1].url").value("https://cdn.pickxel.test/messages/brief.pdf"))
                .andExpect(jsonPath("$.data.attachments[1].uploadStatus").doesNotExist())
                .andExpect(jsonPath("$.data.attachments[2].type").value("icon"))
                .andExpect(jsonPath("$.data.attachments[2].value").value(":thumbs_up:"))
                .andExpect(jsonPath("$.data.attachments[3].type").value("integration"))
                .andExpect(jsonPath("$.data.attachments[3].provider").value("figma"))
                .andReturn();

        long messageId = readData(firstSendResult).path("id").asLong();

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(messageRequest)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(messageId));

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(messageId))
                .andExpect(jsonPath("$.data[0].senderUserId").value(firstUserId))
                .andExpect(jsonPath("$.data[0].attachments[0].src").value("https://cdn.pickxel.test/messages/sample.png"))
                .andExpect(jsonPath("$.data[0].attachments[1].url").value("https://cdn.pickxel.test/messages/brief.pdf"));

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/messages/{messageId}/reactions/toggle",
                        conversationId, messageId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("emoji", "👍"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.messageId").value(messageId))
                .andExpect(jsonPath("$.data.reactions[0].emoji").value("👍"))
                .andExpect(jsonPath("$.data.reactions[0].count").value(1))
                .andExpect(jsonPath("$.data.reactions[0].reactedByMe").value(true));

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/read", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.conversationId").value(conversationId))
                .andExpect(jsonPath("$.data.readerUserId").value(secondUserId))
                .andExpect(jsonPath("$.data.lastReadMessageId").value(messageId));

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].readByPartner").value(true))
                .andExpect(jsonPath("$.data[0].reactions[0].emoji").value("👍"))
                .andExpect(jsonPath("$.data[0].reactions[0].count").value(1))
                .andExpect(jsonPath("$.data[0].reactions[0].reactedByMe").value(false));

        mockMvc.perform(put("/api/messages/conversations/{conversationId}/processes", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "processes", List.of(
                                        Map.of(
                                                "title", "킥오프",
                                                "confirmations", Map.of(
                                                        "designer", true,
                                                        "client", false
                                                ),
                                                "tasks", List.of(
                                                        Map.of(
                                                                "text", "요구사항 정리",
                                                                "completed", true
                                                        ),
                                                        Map.of(
                                                                "text", "작업 범위 확인",
                                                                "completed", false
                                                        )
                                                )
                                        )
                                )
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].title").value("킥오프"))
                .andExpect(jsonPath("$.data[0].status").value("in-progress"))
                .andExpect(jsonPath("$.data[0].confirmations.designer").value(true))
                .andExpect(jsonPath("$.data[0].tasks.length()").value(2));

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/processes", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].title").value("킥오프"))
                .andExpect(jsonPath("$.data[0].tasks[0].text").value("요구사항 정리"))
                .andExpect(jsonPath("$.data[0].tasks[0].completed").value(true));

        mockMvc.perform(delete("/api/messages/conversations/{conversationId}", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(get("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));

        mockMvc.perform(get("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(0));
    }

    @Test
    void conversationPresenceReflectsAvailabilityAndTyping() throws Exception {
        JsonNode firstUser = signUp("presence-a@test.io", "Presence A", "presenceA", "DESIGNER");
        JsonNode secondUser = signUp("presence-b@test.io", "Presence B", "presenceB", "CLIENT");

        String firstToken = login("presence-a@test.io", "testPass1!");
        String secondToken = login("presence-b@test.io", "testPass1!");

        long firstUserId = firstUser.path("userId").asLong();
        long secondUserId = secondUser.path("userId").asLong();

        MvcResult createConversationResult = mockMvc.perform(post("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("partnerUserId", secondUserId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        long conversationId = readData(createConversationResult).path("id").asLong();

        messagePresenceTracker.connectUser(secondUserId, "presence-session");
        messagePresenceTracker.updateTyping(conversationId, secondUserId, true);

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/presence", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.conversationId").value(conversationId))
                .andExpect(jsonPath("$.data.partnerUserId").value(secondUserId))
                .andExpect(jsonPath("$.data.partnerAvailable").value(true))
                .andExpect(jsonPath("$.data.partnerTyping").value(true));

        mockMvc.perform(get("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].partnerUserId").value(secondUserId))
                .andExpect(jsonPath("$.data[0].partnerAvailable").value(true))
                .andExpect(jsonPath("$.data[0].partnerTyping").value(true));

        messagePresenceTracker.updateTyping(conversationId, secondUserId, false);
        messagePresenceTracker.disconnectUser(secondUserId, "presence-session");

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/presence", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.partnerAvailable").value(false))
                .andExpect(jsonPath("$.data.partnerTyping").value(false));

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/read", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.readerUserId").value(secondUserId));

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/presence", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.partnerAvailable").value(false))
                .andExpect(jsonPath("$.data.partnerTyping").value(false))
                .andExpect(jsonPath("$.data.partnerUserId").value(secondUserId));

        mockMvc.perform(delete("/api/messages/conversations/{conversationId}", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk());
    }

    private JsonNode signUp(String loginId, String name, String nickname, String role) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/signup")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "loginId", loginId,
                                "password", "testPass1!",
                                "name", name,
                                "nickname", nickname,
                                "role", role
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.loginId").value(loginId))
                .andReturn();

        return readData(result);
    }

    private String login(String loginId, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "loginId", loginId,
                                "password", password
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.accessToken").isString())
                .andReturn();

        return readData(result).path("accessToken").asText();
    }

    private JsonNode readData(MvcResult result) throws Exception {
        return objectMapper.readTree(result.getResponse().getContentAsString()).path("data");
    }

    private String json(Object value) throws Exception {
        return objectMapper.writeValueAsString(value);
    }
}
