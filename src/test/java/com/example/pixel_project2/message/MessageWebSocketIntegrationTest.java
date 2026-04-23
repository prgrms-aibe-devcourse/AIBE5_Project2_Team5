package com.example.pixel_project2.message;

import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Provider;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.config.jwt.JwtTokenProvider;
import com.example.pixel_project2.message.dto.CreateConversationRequest;
import com.example.pixel_project2.message.dto.CreateMessageReviewRequest;
import com.example.pixel_project2.message.dto.MessageConversationResponse;
import com.example.pixel_project2.message.dto.MessageProcessConfirmationsRequest;
import com.example.pixel_project2.message.dto.MessageProcessResponse;
import com.example.pixel_project2.message.dto.MessageProcessRequest;
import com.example.pixel_project2.message.dto.MessageProcessTaskRequest;
import com.example.pixel_project2.message.dto.MessageReadReceiptResponse;
import com.example.pixel_project2.message.dto.SendMessageRequest;
import com.example.pixel_project2.message.dto.SaveMessageProcessesRequest;
import com.example.pixel_project2.message.dto.UpdateMessageProcessConfirmationRequest;
import com.example.pixel_project2.message.dto.UpdateMessageProcessTaskRequest;
import com.example.pixel_project2.message.service.MessageService;
import com.example.pixel_project2.profile.dto.ProfileReviewResponse;
import com.example.pixel_project2.profile.service.ProfileService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;
import org.springframework.web.socket.client.standard.StandardWebSocketClient;
import org.springframework.web.socket.handler.TextWebSocketHandler;

import java.util.List;
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
    private ProfileService profileService;

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

    @Test
    void messageAttachmentsAreStoredAndBroadcastToConnectedParticipantSocket() throws Exception {
        User sender = userRepository.saveAndFlush(testUser("attach-sender@test.io", "Attach Sender", "att-send"));
        User receiver = userRepository.saveAndFlush(testUser("attach-receiver@test.io", "Attach Receiver", "att-recv"));

        MessageConversationResponse conversation = messageService.createConversation(
                principal(sender),
                new CreateConversationRequest(receiver.getId())
        );

        CompletableFuture<JsonNode> receivedEvent = new CompletableFuture<>();
        WebSocketSession receiverSession = connectSocket(receiver, conversation.id(), "chat.message", receivedEvent);

        ArrayNode attachments = sampleAttachments();
        messageService.sendMessage(
                principal(sender),
                conversation.id(),
                new SendMessageRequest("attachment-client-message", "", attachments)
        );

        JsonNode event = receivedEvent.get(5, TimeUnit.SECONDS);
        assertThat(event.path("attachments")).hasSize(3);
        assertThat(event.path("attachments").get(0).path("type").asText()).isEqualTo("image");
        assertThat(event.path("attachments").get(0).path("src").asText()).isEqualTo("https://cdn.pickxel.test/messages/sample.png");
        assertThat(event.path("attachments").get(1).path("type").asText()).isEqualTo("integration");
        assertThat(event.path("attachments").get(1).path("provider").asText()).isEqualTo("figma");
        assertThat(event.path("attachments").get(1).path("url").asText()).isEqualTo("https://www.figma.com/file/test");
        assertThat(event.path("attachments").get(2).path("type").asText()).isEqualTo("file");
        assertThat(event.path("attachments").get(2).path("uploadedUrl").asText()).isEqualTo("https://cdn.pickxel.test/messages/sample.pdf");
        assertThat(event.path("attachments").get(2).has("dataUrl")).isFalse();

        JsonNode storedAttachments = messageService.getMessages(principal(receiver), conversation.id())
                .getFirst()
                .attachments();
        assertThat(storedAttachments).hasSize(3);
        assertThat(storedAttachments.get(1).path("provider").asText()).isEqualTo("figma");
        assertThat(storedAttachments.get(2).path("uploadedUrl").asText()).isEqualTo("https://cdn.pickxel.test/messages/sample.pdf");
        assertThat(storedAttachments.get(2).has("dataUrl")).isFalse();

        receiverSession.close();
    }

    @Test
    void socketMessageWithAttachmentsIsPersistedAndBroadcast() throws Exception {
        User sender = userRepository.saveAndFlush(testUser("ws-attach-sender@test.io", "Ws Attach Sender", "ws-att-s"));
        User receiver = userRepository.saveAndFlush(testUser("ws-attach-receiver@test.io", "Ws Attach Receiver", "ws-att-r"));

        MessageConversationResponse conversation = messageService.createConversation(
                principal(sender),
                new CreateConversationRequest(receiver.getId())
        );

        CompletableFuture<JsonNode> receivedEvent = new CompletableFuture<>();
        WebSocketSession receiverSession = connectSocket(receiver, conversation.id(), "chat.message", receivedEvent);
        WebSocketSession senderSession = connectSocket(sender, conversation.id(), "chat.message", new CompletableFuture<>());

        ObjectNode socketPayload = objectMapper.createObjectNode();
        socketPayload.put("type", "chat.message");
        socketPayload.put("clientId", "socket-attachment-client-message");
        socketPayload.put("conversationId", conversation.id());
        socketPayload.put("message", "");
        socketPayload.set("attachments", sampleAttachments());
        senderSession.sendMessage(new TextMessage(objectMapper.writeValueAsString(socketPayload)));

        JsonNode event = receivedEvent.get(5, TimeUnit.SECONDS);
        assertThat(event.path("attachments")).hasSize(3);
        assertThat(event.path("attachments").get(0).path("type").asText()).isEqualTo("image");
        assertThat(event.path("attachments").get(1).path("provider").asText()).isEqualTo("figma");
        assertThat(event.path("attachments").get(2).path("uploadedUrl").asText()).isEqualTo("https://cdn.pickxel.test/messages/sample.pdf");
        assertThat(event.path("attachments").get(2).has("dataUrl")).isFalse();

        JsonNode storedAttachments = messageService.getMessages(principal(receiver), conversation.id())
                .getFirst()
                .attachments();
        assertThat(storedAttachments).hasSize(3);

        senderSession.close();
        receiverSession.close();
    }

    @Test
    void typingEventIsBroadcastToConnectedParticipantSocket() throws Exception {
        User sender = userRepository.saveAndFlush(testUser("typing-sender@test.io", "Typing Sender", "ty-sender"));
        User receiver = userRepository.saveAndFlush(testUser("typing-receiver@test.io", "Typing Receiver", "ty-recv"));

        MessageConversationResponse conversation = messageService.createConversation(
                principal(sender),
                new CreateConversationRequest(receiver.getId())
        );

        CompletableFuture<JsonNode> receivedEvent = new CompletableFuture<>();
        WebSocketSession receiverSession = connectSocket(receiver, conversation.id(), "typing", receivedEvent);
        WebSocketSession senderSession = connectSocket(sender, conversation.id(), "typing", new CompletableFuture<>());

        senderSession.sendMessage(new TextMessage("""
                {"type":"typing","conversationId":%d,"isTyping":true}
                """.formatted(conversation.id())));

        JsonNode event = receivedEvent.get(5, TimeUnit.SECONDS);
        assertThat(event.path("conversationId").asLong()).isEqualTo(conversation.id());
        assertThat(event.path("senderUserId").asLong()).isEqualTo(sender.getId());
        assertThat(event.path("isTyping").asBoolean()).isTrue();

        senderSession.close();
        receiverSession.close();
    }

    @Test
    void reactionEventIsBroadcastToConnectedParticipantSocket() throws Exception {
        User sender = userRepository.saveAndFlush(testUser("reaction-sender@test.io", "Reaction Sender", "rx-sender"));
        User receiver = userRepository.saveAndFlush(testUser("reaction-receiver@test.io", "Reaction Receiver", "rx-recv"));

        MessageConversationResponse conversation = messageService.createConversation(
                principal(sender),
                new CreateConversationRequest(receiver.getId())
        );

        CompletableFuture<JsonNode> receivedEvent = new CompletableFuture<>();
        WebSocketSession receiverSession = connectSocket(receiver, conversation.id(), "message.reaction", receivedEvent);
        WebSocketSession senderSession = connectSocket(sender, conversation.id(), "message.reaction", new CompletableFuture<>());

        senderSession.sendMessage(new TextMessage("""
                {"type":"message.reaction","conversationId":%d,"messageClientId":"client-123","emoji":"thumb","action":"add"}
                """.formatted(conversation.id())));

        JsonNode event = receivedEvent.get(5, TimeUnit.SECONDS);
        assertThat(event.path("conversationId").asLong()).isEqualTo(conversation.id());
        assertThat(event.path("messageClientId").asText()).isEqualTo("client-123");
        assertThat(event.path("emoji").asText()).isEqualTo("thumb");
        assertThat(event.path("action").asText()).isEqualTo("add");
        assertThat(event.path("senderUserId").asLong()).isEqualTo(sender.getId());

        senderSession.close();
        receiverSession.close();
    }

    @Test
    void messageReadReceiptIsPersistedAndBroadcastToConnectedParticipantSocket() throws Exception {
        User sender = userRepository.saveAndFlush(testUser("read-sender@test.io", "Read Sender", "read-send"));
        User receiver = userRepository.saveAndFlush(testUser("read-receiver@test.io", "Read Receiver", "read-recv"));

        MessageConversationResponse conversation = messageService.createConversation(
                principal(sender),
                new CreateConversationRequest(receiver.getId())
        );

        messageService.sendMessage(
                principal(sender),
                conversation.id(),
                new SendMessageRequest("read-client-message", "읽음 처리 테스트", objectMapper.createArrayNode())
        );

        CompletableFuture<JsonNode> receivedEvent = new CompletableFuture<>();
        WebSocketSession senderSession = connectSocket(sender, conversation.id(), "message.read", receivedEvent);

        MessageReadReceiptResponse receipt = messageService.markConversationRead(
                principal(receiver),
                conversation.id()
        );

        assertThat(receipt.readerUserId()).isEqualTo(receiver.getId());
        assertThat(receipt.clientIds()).containsExactly("read-client-message");

        JsonNode event = receivedEvent.get(5, TimeUnit.SECONDS);
        assertThat(event.path("conversationId").asLong()).isEqualTo(conversation.id());
        assertThat(event.path("readerUserId").asLong()).isEqualTo(receiver.getId());
        assertThat(event.path("clientIds").get(0).asText()).isEqualTo("read-client-message");
        assertThat(event.path("readAt").asText()).isNotBlank();

        assertThat(messageService.getMessages(principal(sender), conversation.id()).getFirst().readAt())
                .isNotNull();

        senderSession.close();
    }

    @Test
    void messageProcessesAreStoredAndCanBeUpdatedByConversationParticipant() {
        User sender = userRepository.saveAndFlush(testUser("process-sender@test.io", "Process Sender", "pr-sender"));
        User receiver = userRepository.saveAndFlush(testUser("process-receiver@test.io", "Process Receiver", "pr-recv"));

        MessageConversationResponse conversation = messageService.createConversation(
                principal(sender),
                new CreateConversationRequest(receiver.getId())
        );

        List<MessageProcessResponse> savedProcesses = messageService.saveProcesses(
                principal(sender),
                conversation.id(),
                new SaveMessageProcessesRequest(List.of(
                        new MessageProcessRequest(
                                null,
                                "Design draft",
                                new MessageProcessConfirmationsRequest(false, false),
                                List.of(
                                        new MessageProcessTaskRequest(null, "Wireframe", false),
                                        new MessageProcessTaskRequest(null, "Visual design", false)
                                )
                        )
                ))
        );

        assertThat(savedProcesses).hasSize(1);
        assertThat(savedProcesses.getFirst().status()).isEqualTo("pending");

        MessageProcessResponse firstTaskUpdated = messageService.updateProcessTask(
                principal(receiver),
                conversation.id(),
                savedProcesses.getFirst().id(),
                savedProcesses.getFirst().tasks().getFirst().id(),
                new UpdateMessageProcessTaskRequest(true)
        );
        assertThat(firstTaskUpdated.status()).isEqualTo("in-progress");

        MessageProcessResponse secondTaskUpdated = messageService.updateProcessTask(
                principal(receiver),
                conversation.id(),
                savedProcesses.getFirst().id(),
                savedProcesses.getFirst().tasks().get(1).id(),
                new UpdateMessageProcessTaskRequest(true)
        );
        assertThat(secondTaskUpdated.status()).isEqualTo("in-progress");

        MessageProcessResponse designerConfirmed = messageService.updateProcessConfirmation(
                principal(sender),
                conversation.id(),
                savedProcesses.getFirst().id(),
                "designer",
                new UpdateMessageProcessConfirmationRequest(true)
        );
        assertThat(designerConfirmed.status()).isEqualTo("in-progress");

        MessageProcessResponse clientConfirmed = messageService.updateProcessConfirmation(
                principal(receiver),
                conversation.id(),
                savedProcesses.getFirst().id(),
                "client",
                new UpdateMessageProcessConfirmationRequest(true)
        );
        assertThat(clientConfirmed.status()).isEqualTo("completed");

        List<MessageProcessResponse> loadedProcesses = messageService.getProcesses(principal(sender), conversation.id());
        assertThat(loadedProcesses.getFirst().tasks()).allMatch(task -> task.completed());
        assertThat(loadedProcesses.getFirst().confirmations().designer()).isTrue();
        assertThat(loadedProcesses.getFirst().confirmations().client()).isTrue();
    }

    @Test
    void messageProcessUpdatesAreBroadcastToConnectedParticipantSocket() throws Exception {
        User sender = userRepository.saveAndFlush(testUser("process-ws-sender@test.io", "Process Ws Sender", "pr-ws-s"));
        User receiver = userRepository.saveAndFlush(testUser("process-ws-receiver@test.io", "Process Ws Receiver", "pr-ws-r"));

        MessageConversationResponse conversation = messageService.createConversation(
                principal(sender),
                new CreateConversationRequest(receiver.getId())
        );

        CompletableFuture<JsonNode> receivedEvent = new CompletableFuture<>();
        WebSocketSession receiverSession = connectSocket(receiver, conversation.id(), "process.updated", receivedEvent);

        messageService.saveProcesses(
                principal(sender),
                conversation.id(),
                new SaveMessageProcessesRequest(List.of(
                        new MessageProcessRequest(
                                null,
                                "Socket synced process",
                                new MessageProcessConfirmationsRequest(false, false),
                                List.of(new MessageProcessTaskRequest(null, "First task", false))
                        )
                ))
        );

        JsonNode event = receivedEvent.get(5, TimeUnit.SECONDS);
        assertThat(event.path("conversationId").asLong()).isEqualTo(conversation.id());
        assertThat(event.path("processes")).hasSize(1);
        assertThat(event.path("processes").get(0).path("title").asText()).isEqualTo("Socket synced process");

        receiverSession.close();
    }

    @Test
    void completedConversationReviewIsStoredAndReturnedFromProfileReviews() {
        User reviewer = userRepository.saveAndFlush(testUser("review-writer@test.io", "Review Writer", "rv-writer"));
        User reviewee = userRepository.saveAndFlush(testUser("review-target@test.io", "Review Target", "rv-target"));

        MessageConversationResponse conversation = messageService.createConversation(
                principal(reviewer),
                new CreateConversationRequest(reviewee.getId())
        );

        List<MessageProcessResponse> processes = messageService.saveProcesses(
                principal(reviewer),
                conversation.id(),
                new SaveMessageProcessesRequest(List.of(
                        new MessageProcessRequest(
                                null,
                                "Reviewable work",
                                new MessageProcessConfirmationsRequest(true, true),
                                List.of(new MessageProcessTaskRequest(null, "Final delivery", true))
                        )
                ))
        );
        assertThat(processes.getFirst().status()).isEqualTo("completed");

        ProfileReviewResponse savedReview = messageService.createConversationReview(
                principal(reviewer),
                conversation.id(),
                new CreateMessageReviewRequest(
                        "프로필 연결 테스트 프로젝트",
                        5,
                        "작업 프로세스가 완료된 뒤 작성한 후기 내용이 프로필 후기 탭에 그대로 연결되는지 확인합니다.",
                        List.of("브랜드 디자인", "피그마 시안"),
                        List.of("답장이 빨라요", "결과물이 예뻐요")
                )
        );

        assertThat(savedReview.projectId()).isEqualTo(conversation.id());
        assertThat(savedReview.reviewerId()).isEqualTo(reviewer.getId());
        assertThat(savedReview.rating()).isEqualTo(5);

        List<ProfileReviewResponse> profileReviews =
                profileService.getProfileReviews(reviewee.getLoginId(), principal(reviewer));
        assertThat(profileReviews)
                .extracting(ProfileReviewResponse::reviewId)
                .contains(savedReview.reviewId());
        ProfileReviewResponse profileReview = profileReviews.stream()
                .filter(review -> review.reviewId().equals(savedReview.reviewId()))
                .findFirst()
                .orElseThrow();
        assertThat(profileReview.projectTitle()).isEqualTo("프로필 연결 테스트 프로젝트");
        assertThat(profileReview.content()).contains("프로필 후기 탭");
        assertThat(profileReview.workCategories()).containsExactly("브랜드 디자인", "피그마 시안");
        assertThat(profileReview.complimentTags()).containsExactly("답장이 빨라요", "결과물이 예뻐요");
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

    private WebSocketSession connectSocket(
            User user,
            Long conversationId,
            String expectedType,
            CompletableFuture<JsonNode> receivedEvent
    ) throws Exception {
        String token = jwtTokenProvider.createAccessToken(user);
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
                JsonNode payload = objectMapper.readTree(message.getPayload());
                if (!expectedType.equals(payload.path("type").asText())) {
                    return;
                }
                receivedEvent.complete(payload);
            }
        }, uri).get(5, TimeUnit.SECONDS);
    }

    private AuthenticatedUser principal(User user) {
        return new AuthenticatedUser(
                user.getId(),
                user.getLoginId(),
                user.getName(),
                user.getNickname(),
                user.getRole()
        );
    }

    private ArrayNode sampleAttachments() {
        ArrayNode attachments = objectMapper.createArrayNode();

        ObjectNode imageAttachment = objectMapper.createObjectNode();
        imageAttachment.put("id", "image-1");
        imageAttachment.put("type", "image");
        imageAttachment.put("name", "sample.png");
        imageAttachment.put("src", "https://cdn.pickxel.test/messages/sample.png");
        attachments.add(imageAttachment);

        ObjectNode figmaAttachment = objectMapper.createObjectNode();
        figmaAttachment.put("id", "figma-1");
        figmaAttachment.put("type", "integration");
        figmaAttachment.put("provider", "figma");
        figmaAttachment.put("name", "Figma design link");
        figmaAttachment.put("url", "https://www.figma.com/file/test");
        figmaAttachment.put("host", "figma.com");
        figmaAttachment.put("previewTitle", "Figma design file");
        figmaAttachment.put("previewDescription", "Open the shared Figma file.");
        attachments.add(figmaAttachment);

        ObjectNode fileAttachment = objectMapper.createObjectNode();
        fileAttachment.put("id", "file-1");
        fileAttachment.put("type", "file");
        fileAttachment.put("name", "sample.pdf");
        fileAttachment.put("size", 11);
        fileAttachment.put("mimeType", "application/pdf");
        fileAttachment.put("uploadedUrl", "https://cdn.pickxel.test/messages/sample.pdf");
        attachments.add(fileAttachment);

        return attachments;
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
