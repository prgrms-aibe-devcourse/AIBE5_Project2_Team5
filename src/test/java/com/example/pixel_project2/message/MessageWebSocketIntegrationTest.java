package com.example.pixel_project2.message;

import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Provider;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.config.jwt.JwtTokenProvider;
import com.example.pixel_project2.message.dto.CreateConversationRequest;
import com.example.pixel_project2.message.dto.MessageConversationResponse;
import com.example.pixel_project2.message.dto.SendMessageRequest;
import com.example.pixel_project2.message.service.MessageService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.concurrent.CompletableFuture;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class MessageWebSocketIntegrationTest {
    @LocalServerPort
    private int port;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private JwtTokenProvider jwtTokenProvider;

    @Autowired
    private MessageService messageService;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void restMessageSendIsBroadcastToConnectedParticipantSocket() throws Exception {
        User sender = userRepository.saveAndFlush(testUser("socket-sender@test.io", "소켓발신", "발신"));
        User receiver = userRepository.saveAndFlush(testUser("socket-receiver@test.io", "소켓수신", "수신"));

        AuthenticatedUser senderPrincipal = new AuthenticatedUser(
                sender.getId(),
                sender.getLoginId(),
                sender.getName(),
                sender.getNickname(),
                sender.getRole()
        );
        MessageConversationResponse conversation = messageService.createConversation(
                senderPrincipal,
                new CreateConversationRequest(receiver.getId())
        );

        CompletableFuture<String> receivedMessage = new CompletableFuture<>();
        WebSocketSession receiverSession = connectReceiver(receiver, conversation.id(), receivedMessage);

        messageService.sendMessage(
                senderPrincipal,
                conversation.id(),
                new SendMessageRequest(
                        "integration-client-message",
                        "실시간 도착 확인",
                        objectMapper.createArrayNode()
                )
        );

        assertThat(receivedMessage.get(5, TimeUnit.SECONDS)).isEqualTo("실시간 도착 확인");
        receiverSession.close();
    }

    private WebSocketSession connectReceiver(
            User receiver,
            Long conversationId,
            CompletableFuture<String> receivedMessage
    ) throws Exception {
        String token = jwtTokenProvider.createAccessToken(receiver);
        String uri = "ws://localhost:" + port + "/ws/messages?token=" + token;
        StandardWebSocketClient client = new StandardWebSocketClient();

        return client.execute(new TextWebSocketHandler() {
            @Override
            public void afterConnectionEstablished(WebSocketSession session) throws Exception {
                session.sendMessage(new TextMessage("""
                        {"type":"subscribe","conversationIds":[%d]}
                        """.formatted(conversationId)));
            }

            @Override
            protected void handleTextMessage(WebSocketSession session, TextMessage message) throws Exception {
                String type = objectMapper.readTree(message.getPayload()).path("type").asText();
                if (!"chat.message".equals(type)) {
                    return;
                }
                receivedMessage.complete(objectMapper.readTree(message.getPayload()).path("message").asText());
            }
        }, uri).get(5, TimeUnit.SECONDS);
    }

    private User testUser(String loginId, String name, String nickname) {
        return User.builder()
                .loginId(loginId)
                .password("encoded-password")
                .name(name)
                .nickname(nickname)
                .role(UserRole.DESIGNER)
                .followCount(0)
                .provider(Provider.LOCAL)
                .build();
    }
}
