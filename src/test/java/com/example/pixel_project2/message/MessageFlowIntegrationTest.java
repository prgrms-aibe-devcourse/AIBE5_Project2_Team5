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
import org.springframework.test.context.TestPropertySource;

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
@TestPropertySource(properties = {
        "app.gemini.api-key=",
        "app.gemini.model=gemini-1.5-flash"
})
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
                "message", "hello 👍 from integration test",
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
                                "value", "👍"
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
                .andExpect(jsonPath("$.data.message").value("hello 👍 from integration test"))
                .andExpect(jsonPath("$.data.attachments[0].type").value("image"))
                .andExpect(jsonPath("$.data.attachments[0].src").value("https://cdn.pickxel.test/messages/sample.png"))
                .andExpect(jsonPath("$.data.attachments[0].uploadStatus").doesNotExist())
                .andExpect(jsonPath("$.data.attachments[1].type").value("file"))
                .andExpect(jsonPath("$.data.attachments[1].url").value("https://cdn.pickxel.test/messages/brief.pdf"))
                .andExpect(jsonPath("$.data.attachments[1].uploadStatus").doesNotExist())
                .andExpect(jsonPath("$.data.attachments[2].type").value("icon"))
                .andExpect(jsonPath("$.data.attachments[2].value").value("👍"))
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
                .andExpect(jsonPath("$.data[0].message").value("hello 👍 from integration test"))
                .andExpect(jsonPath("$.data[0].attachments[0].src").value("https://cdn.pickxel.test/messages/sample.png"))
                .andExpect(jsonPath("$.data[0].attachments[1].url").value("https://cdn.pickxel.test/messages/brief.pdf"))
                .andExpect(jsonPath("$.data[0].attachments[2].value").value("👍"));

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
    void usersCanCatchUpMissedMessagesAfterLastSeenMessageId() throws Exception {
        JsonNode firstUser = signUp("message-catchup-a@test.io", "Catchup A", "catchupA", "DESIGNER");
        JsonNode secondUser = signUp("message-catchup-b@test.io", "Catchup B", "catchupB", "CLIENT");

        String firstToken = login("message-catchup-a@test.io", "testPass1!");
        String secondToken = login("message-catchup-b@test.io", "testPass1!");

        long firstUserId = firstUser.path("userId").asLong();
        long secondUserId = secondUser.path("userId").asLong();

        MvcResult createConversationResult = mockMvc.perform(post("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("partnerUserId", secondUserId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.partnerUserId").value(secondUserId))
                .andReturn();

        long conversationId = readData(createConversationResult).path("id").asLong();

        mockMvc.perform(post("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("partnerUserId", firstUserId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.id").value(conversationId));

        MvcResult firstSendResult = mockMvc.perform(post("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "clientId", "catchup-message-1",
                                "message", "첫 번째 기준 메시지"
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        long firstMessageId = readData(firstSendResult).path("id").asLong();

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(1))
                .andExpect(jsonPath("$.data[0].id").value(firstMessageId));

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].readByPartner").value(true));

        MvcResult secondSendResult = mockMvc.perform(post("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "clientId", "catchup-message-2",
                                "message", "재연결 후 따라와야 하는 두 번째 메시지"
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        long secondMessageId = readData(secondSendResult).path("id").asLong();

        MvcResult thirdSendResult = mockMvc.perform(post("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "clientId", "catchup-message-3",
                                "message", "재연결 후 따라와야 하는 세 번째 메시지"
                        ))))
                .andExpect(status().isOk())
                .andReturn();

        long thirdMessageId = readData(thirdSendResult).path("id").asLong();

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .param("afterMessageId", String.valueOf(firstMessageId))
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.length()").value(2))
                .andExpect(jsonPath("$.data[0].id").value(secondMessageId))
                .andExpect(jsonPath("$.data[1].id").value(thirdMessageId));

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[1].readByPartner").value(false))
                .andExpect(jsonPath("$.data[2].readByPartner").value(false));

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/read", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.lastReadMessageId").value(thirdMessageId));

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[1].readByPartner").value(true))
                .andExpect(jsonPath("$.data[2].readByPartner").value(true));
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
                .andExpect(jsonPath("$.data.partnerAvailable").value(true))
                .andExpect(jsonPath("$.data.partnerTyping").value(false))
                .andExpect(jsonPath("$.data.partnerUserId").value(secondUserId));

        mockMvc.perform(delete("/api/messages/conversations/{conversationId}", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk());
    }

    @Test
    void usersCanSyncPresenceAndTypingThroughApis() throws Exception {
        String uniqueSuffix = String.valueOf(System.nanoTime());
        String shortSuffix = uniqueSuffix.substring(Math.max(0, uniqueSuffix.length() - 6));
        String firstLoginId = "pa" + shortSuffix + "@t.io";
        String secondLoginId = "pb" + shortSuffix + "@t.io";

        JsonNode firstUser = signUp(firstLoginId, "Presence API A", "pA" + shortSuffix, "DESIGNER");
        JsonNode secondUser = signUp(secondLoginId, "Presence API B", "pB" + shortSuffix, "CLIENT");

        String firstToken = login(firstLoginId, "testPass1!");
        String secondToken = login(secondLoginId, "testPass1!");

        long secondUserId = secondUser.path("userId").asLong();

        MvcResult createConversationResult = mockMvc.perform(post("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("partnerUserId", secondUserId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        long conversationId = readData(createConversationResult).path("id").asLong();

        mockMvc.perform(get("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/presence", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.partnerUserId").value(secondUserId))
                .andExpect(jsonPath("$.data.partnerAvailable").value(true))
                .andExpect(jsonPath("$.data.partnerTyping").value(false));

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/typing", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("isTyping", true))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.partnerAvailable").value(true))
                .andExpect(jsonPath("$.data.partnerTyping").value(false));

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/presence", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.partnerAvailable").value(true))
                .andExpect(jsonPath("$.data.partnerTyping").value(true));

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/typing", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("isTyping", false))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/messages/conversations/{conversationId}/presence", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.partnerAvailable").value(true))
                .andExpect(jsonPath("$.data.partnerTyping").value(false));
    }

    @Test
    void usersCanGetAssistantSuggestionsFromConversationContext() throws Exception {
        JsonNode firstUser = signUp("assistant-a@test.io", "Assistant A", "assistantA", "DESIGNER");
        JsonNode secondUser = signUp("assistant-b@test.io", "Assistant B", "assistantB", "CLIENT");

        String firstToken = login("assistant-a@test.io", "testPass1!");
        String secondToken = login("assistant-b@test.io", "testPass1!");

        long secondUserId = secondUser.path("userId").asLong();

        MvcResult createConversationResult = mockMvc.perform(post("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("partnerUserId", secondUserId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        long conversationId = readData(createConversationResult).path("id").asLong();

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "clientId", "assistant-message-1",
                                "message", "이번 시안에서 다음 단계는 어떤 식으로 진행하면 좋을까요?",
                                "attachments", List.of()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(put("/api/messages/conversations/{conversationId}/processes", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "processes", List.of(
                                        Map.of(
                                                "title", "시안 정리",
                                                "confirmations", Map.of(
                                                        "designer", false,
                                                        "client", false
                                                ),
                                                "tasks", List.of(
                                                        Map.of(
                                                                "text", "피드백 반영",
                                                                "completed", false
                                                        ),
                                                        Map.of(
                                                                "text", "2차 시안 공유",
                                                                "completed", false
                                                        )
                                                )
                                        )
                                )
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/assistant/suggestions", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "goal", "next_step",
                                "draft", "좋아요. 다음 단계 안내드릴게요."
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.goal").value("next_step"))
                .andExpect(jsonPath("$.data.usedAi").value(false))
                .andExpect(jsonPath("$.data.suggestions.length()").value(3))
                .andExpect(jsonPath("$.data.suggestions[0]").isString())
                .andExpect(jsonPath("$.data.suggestions[0]").value(org.hamcrest.Matchers.containsString("피드백 반영")));
    }

    @Test
    void assistantSuggestionsStayGroundedInLatestPartnerMessageAndNextTask() throws Exception {
        JsonNode firstUser = signUp("assistant-rag-a@test.io", "Assistant Rag A", "ragA", "DESIGNER");
        JsonNode secondUser = signUp("assistant-rag-b@test.io", "Assistant Rag B", "ragB", "CLIENT");

        String firstToken = login("assistant-rag-a@test.io", "testPass1!");
        String secondToken = login("assistant-rag-b@test.io", "testPass1!");

        long secondUserId = secondUser.path("userId").asLong();

        MvcResult createConversationResult = mockMvc.perform(post("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("partnerUserId", secondUserId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        long conversationId = readData(createConversationResult).path("id").asLong();

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "clientId", "assistant-rag-message-0",
                                "message", "I will prepare the first draft today.",
                                "attachments", List.of()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "clientId", "assistant-rag-message-1",
                                "message", "Can we review the deck tomorrow afternoon?",
                                "attachments", List.of()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(put("/api/messages/conversations/{conversationId}/processes", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "processes", List.of(
                                        Map.of(
                                                "title", "Design review",
                                                "confirmations", Map.of(
                                                        "designer", false,
                                                        "client", false
                                                ),
                                                "tasks", List.of(
                                                        Map.of(
                                                                "text", "review deck",
                                                                "completed", false
                                                        ),
                                                        Map.of(
                                                                "text", "share revision notes",
                                                                "completed", false
                                                        )
                                                )
                                        )
                                )
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/assistant/suggestions", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "goal", "reply",
                                "draft", ""
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.goal").value("reply"))
                .andExpect(jsonPath("$.data.usedAi").value(false))
                .andExpect(jsonPath("$.data.suggestions.length()").value(3))
                .andExpect(jsonPath("$.data.suggestions[0]").isString())
                .andExpect(jsonPath("$.data.suggestions[0]").value(org.hamcrest.Matchers.containsString("review deck")));
    }

    @Test
    void usersCanSendFallbackAssistantSuggestionWithoutTriggeringPreviewStorageError() throws Exception {
        String uniqueSuffix = String.valueOf(System.nanoTime());
        String shortSuffix = uniqueSuffix.substring(Math.max(0, uniqueSuffix.length() - 6));
        String firstLoginId = "fa" + shortSuffix + "@t.io";
        String secondLoginId = "fb" + shortSuffix + "@t.io";

        JsonNode firstUser = signUp(firstLoginId, "Fallback Sender", "fs" + shortSuffix, "CLIENT");
        JsonNode secondUser = signUp(secondLoginId, "Fallback Partner", "fp" + shortSuffix, "DESIGNER");

        String firstToken = login(firstLoginId, "testPass1!");
        String secondToken = login(secondLoginId, "testPass1!");

        long secondUserId = secondUser.path("userId").asLong();

        MvcResult createConversationResult = mockMvc.perform(post("/api/messages/conversations")
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("partnerUserId", secondUserId))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andReturn();

        long conversationId = readData(createConversationResult).path("id").asLong();

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + secondToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "clientId", "assistant-fallback-seed",
                                "message", "Can you send the Zoom link and confirm whether tomorrow at 3 PM still works?",
                                "attachments", List.of()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));

        MvcResult suggestionResult = mockMvc.perform(post("/api/messages/conversations/{conversationId}/assistant/suggestions", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "goal", "schedule_meeting",
                                "draft", ""
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.usedAi").value(false))
                .andExpect(jsonPath("$.data.suggestions.length()").value(3))
                .andReturn();

        String suggestion = readData(suggestionResult).path("suggestions").get(0).asText();

        mockMvc.perform(post("/api/messages/conversations/{conversationId}/messages", conversationId)
                        .header(HttpHeaders.AUTHORIZATION, BEARER + firstToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of(
                                "clientId", "assistant-fallback-send",
                                "message", suggestion,
                                "attachments", List.of()
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true))
                .andExpect(jsonPath("$.data.message").value(suggestion));
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
