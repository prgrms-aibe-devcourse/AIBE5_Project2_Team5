package com.example.pixel_project2.message.service;

import com.example.pixel_project2.common.entity.Designer;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.NotificationType;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.dto.ChatMessageResponse;
import com.example.pixel_project2.message.dto.CreateConversationRequest;
import com.example.pixel_project2.message.dto.MessageAssistantSuggestionRequest;
import com.example.pixel_project2.message.dto.MessageAssistantSuggestionResponse;
import com.example.pixel_project2.message.dto.MessageConversationPresenceResponse;
import com.example.pixel_project2.message.dto.MessageConversationResponse;
import com.example.pixel_project2.message.dto.MessageProcessConfirmationsRequest;
import com.example.pixel_project2.message.dto.MessageProcessConfirmationsResponse;
import com.example.pixel_project2.message.dto.MessageProcessRequest;
import com.example.pixel_project2.message.dto.MessageProcessResponse;
import com.example.pixel_project2.message.dto.MessageProcessTaskRequest;
import com.example.pixel_project2.message.dto.MessageProcessTaskResponse;
import com.example.pixel_project2.message.dto.MessagePolicyResponse;
import com.example.pixel_project2.message.dto.MessageReactionSummaryResponse;
import com.example.pixel_project2.message.dto.MessageReactionUpdateResponse;
import com.example.pixel_project2.message.dto.MessageReadReceiptResponse;
import com.example.pixel_project2.message.dto.MessageTypingRequest;
import com.example.pixel_project2.message.dto.SaveMessageProcessesRequest;
import com.example.pixel_project2.message.dto.SendMessageRequest;
import com.example.pixel_project2.message.dto.ToggleMessageReactionRequest;
import com.example.pixel_project2.message.entity.ChatMessage;
import com.example.pixel_project2.message.entity.ChatMessageReaction;
import com.example.pixel_project2.message.entity.MessageConversation;
import com.example.pixel_project2.message.entity.MessageProcess;
import com.example.pixel_project2.message.entity.MessageProcessTask;
import com.example.pixel_project2.message.repository.ChatMessageReactionRepository;
import com.example.pixel_project2.message.repository.ChatMessageRepository;
import com.example.pixel_project2.message.repository.MessageConversationRepository;
import com.example.pixel_project2.message.repository.MessageProcessRepository;
import com.example.pixel_project2.message.websocket.MessagePresenceTracker;
import com.example.pixel_project2.notification.service.NotificationService;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageServiceImpl implements MessageService {
    private static final HttpClient GEMINI_HTTP_CLIENT = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .build();
    private static final Duration GEMINI_REQUEST_TIMEOUT = Duration.ofSeconds(20);
    private static final int ASSISTANT_HISTORY_LIMIT = 12;
    private static final int ASSISTANT_SUGGESTION_LIMIT = 3;
    private static final int ASSISTANT_SUGGESTION_MAX_LENGTH = 320;

    private final UserRepository userRepository;
    private final MessageConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatMessageReactionRepository chatMessageReactionRepository;
    private final MessageProcessRepository messageProcessRepository;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private final MessagePresenceTracker messagePresenceTracker;
    private final NotificationService notificationService;

    @Value("${app.gemini.api-key:}")
    private String geminiApiKey;

    @Value("${app.gemini.model:gemini-2.5-flash}")
    private String geminiModel;

    @Override
    public MessagePolicyResponse getMessagePolicy() {
        return new MessagePolicyResponse(true, true, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageConversationResponse> getConversations(AuthenticatedUser currentUser) {
        messagePresenceTracker.touchUser(currentUser.id());
        return conversationRepository.findAllByParticipant(currentUser.id())
                .stream()
                .map(conversation -> toConversationResponse(conversation, currentUser.id(), conversation.getLastReadMessageId(currentUser.id())))
                .toList();
    }

    @Override
    @Transactional
    public MessageConversationResponse createConversation(
            AuthenticatedUser currentUser,
            CreateConversationRequest request
    ) {
        MessageConversation conversation = findOrCreateConversation(currentUser.id(), request.partnerUserId());
        return toConversationResponse(conversation, currentUser.id(), conversation.getLastReadMessageId(currentUser.id()));
    }

    @Override
    @Transactional(readOnly = true)
    public MessageConversationPresenceResponse getConversationPresence(AuthenticatedUser currentUser, Long conversationId) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());
        User partner = conversation.getOtherParticipant(currentUser.id());
        messagePresenceTracker.touchUser(currentUser.id());
        MessageConversationPresenceResponse response = new MessageConversationPresenceResponse(
                conversation.getId(),
                partner.getId(),
                messagePresenceTracker.isUserAvailable(partner.getId()),
                messagePresenceTracker.isTyping(conversation.getId(), partner.getId())
        );
        log.info(
                "message presence fetched conversationId={} requesterUserId={} partnerUserId={} partnerAvailable={} partnerTyping={}",
                conversationId,
                currentUser.id(),
                partner.getId(),
                response.partnerAvailable(),
                response.partnerTyping()
        );
        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public MessageConversationPresenceResponse updateConversationTyping(
            AuthenticatedUser currentUser,
            Long conversationId,
            MessageTypingRequest request
    ) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());
        User partner = conversation.getOtherParticipant(currentUser.id());
        messagePresenceTracker.touchUser(currentUser.id());
        messagePresenceTracker.updateTyping(conversationId, currentUser.id(), request.isTyping());
        MessageConversationPresenceResponse response = new MessageConversationPresenceResponse(
                conversation.getId(),
                partner.getId(),
                messagePresenceTracker.isUserAvailable(partner.getId()),
                messagePresenceTracker.isTyping(conversation.getId(), partner.getId())
        );
        log.info(
                "message typing updated via api conversationId={} senderUserId={} partnerUserId={} isTyping={} partnerAvailable={} partnerTyping={}",
                conversationId,
                currentUser.id(),
                partner.getId(),
                request.isTyping(),
                response.partnerAvailable(),
                response.partnerTyping()
        );
        return response;
    }

    @Override
    @Transactional
    public List<ChatMessageResponse> getMessages(
            AuthenticatedUser currentUser,
            Long conversationId,
            Long afterMessageId
    ) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());
        messagePresenceTracker.touchUser(currentUser.id());
        List<ChatMessage> messages = afterMessageId == null
                ? chatMessageRepository.findAllByConversationId(conversationId)
                : chatMessageRepository.findAllByConversationIdAfterMessageId(conversationId, afterMessageId);
        Long partnerLastReadMessageId = conversation.getPartnerLastReadMessageId(currentUser.id());

        if (afterMessageId == null && !messages.isEmpty()) {
            conversation.markRead(currentUser.id(), messages.get(messages.size() - 1).getId());
        }

        return toChatMessageResponses(messages, currentUser.id(), partnerLastReadMessageId);
    }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(
            AuthenticatedUser currentUser,
            Long conversationId,
            SendMessageRequest request
    ) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());
        messagePresenceTracker.touchUser(currentUser.id());
        User sender = userRepository.findById(currentUser.id())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        JsonNode attachments = sanitizeAttachments(normalizeAttachments(request.attachments()));
        String message = request.message() == null ? "" : request.message().trim();
        String storedMessage = MessageTextCodec.encode(message);
        String normalizedClientId = normalizeClientId(request.clientId());
        if (message.isBlank() && attachments.isEmpty()) {
            throw new IllegalArgumentException("메시지 내용 또는 첨부파일을 입력해주세요.");
        }

        if (normalizedClientId != null) {
            ChatMessage existingMessage = chatMessageRepository
                    .findByConversationIdAndSenderIdAndClientId(conversationId, currentUser.id(), normalizedClientId)
                    .orElse(null);
            if (existingMessage != null) {
                return toChatMessageResponse(
                        existingMessage,
                        currentUser.id(),
                        conversation.getPartnerLastReadMessageId(currentUser.id())
                );
            }
        }

        ChatMessage chatMessage = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .clientId(normalizedClientId)
                .message(storedMessage)
                .attachmentsJson(writeAttachments(attachments))
                .build();
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);

        LocalDateTime messageCreatedAt = savedMessage.getCreatedAt() == null
                ? LocalDateTime.now()
                : savedMessage.getCreatedAt();
        conversation.updateLastMessage(createStoredConversationPreview(message, attachments), messageCreatedAt);
        conversation.markRead(currentUser.id(), savedMessage.getId());

        // 알림 생성
        User receiver = conversation.getOtherParticipant(currentUser.id());
        notificationService.createNotification(
                receiver.getId(),
                sender.getId(),
                NotificationType.MESSAGE,
                savedMessage.getId(),
                createNotificationPreview(message, attachments)
        );

        return toChatMessageResponse(savedMessage, currentUser.id(), conversation.getPartnerLastReadMessageId(currentUser.id()));
    }

    @Override
    @Transactional(readOnly = true)
    public MessageAssistantSuggestionResponse getAssistantSuggestions(
            AuthenticatedUser currentUser,
            Long conversationId,
            MessageAssistantSuggestionRequest request
    ) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());
        messagePresenceTracker.touchUser(currentUser.id());

        List<ChatMessage> messages = chatMessageRepository.findAllByConversationId(conversationId);
        List<MessageProcess> processes = messageProcessRepository.findAllByConversationId(conversationId);
        String goal = normalizeAssistantGoal(request.goal());
        String draft = request.draft() == null ? "" : request.draft().trim();

        List<String> fallbackSuggestions = buildFallbackAssistantSuggestions(
                goal,
                currentUser,
                conversation,
                messages,
                processes,
                draft
        );
        List<String> aiSuggestions = requestGeminiSuggestions(
                goal,
                currentUser,
                conversation,
                messages,
                processes,
                draft
        );
        List<String> suggestions = normalizeAssistantSuggestions(aiSuggestions, fallbackSuggestions);

        return new MessageAssistantSuggestionResponse(
                goal,
                suggestions,
                !aiSuggestions.isEmpty()
        );
    }

    @Override
    @Transactional
    public MessageReadReceiptResponse markConversationRead(AuthenticatedUser currentUser, Long conversationId) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());
        messagePresenceTracker.touchUser(currentUser.id());
        List<ChatMessage> messages = chatMessageRepository.findAllByConversationId(conversationId);

        Long lastReadMessageId = messages.isEmpty() ? null : messages.get(messages.size() - 1).getId();
        conversation.markRead(currentUser.id(), lastReadMessageId);

        return new MessageReadReceiptResponse(conversationId, currentUser.id(), lastReadMessageId);
    }

    @Override
    @Transactional
    public MessageReactionUpdateResponse toggleReaction(
            AuthenticatedUser currentUser,
            Long conversationId,
            Long messageId,
            ToggleMessageReactionRequest request
    ) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());
        ChatMessage message = chatMessageRepository.findByIdWithConversationAndSender(messageId)
                .orElseThrow(() -> new IllegalArgumentException("Message not found."));

        if (!message.getConversation().getId().equals(conversation.getId())) {
            throw new IllegalArgumentException("Message does not belong to the conversation.");
        }

        User user = userRepository.findById(currentUser.id())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        String reactionKey = MessageReactionEmojiCodec.toStorageKey(request.emoji());
        chatMessageReactionRepository.findAllByChatMessageIdAndUserId(messageId, currentUser.id())
                .stream()
                .filter(reaction -> MessageReactionEmojiCodec.matchesStoredReaction(reaction.getEmoji(), reactionKey))
                .findFirst()
                .ifPresentOrElse(
                        chatMessageReactionRepository::delete,
                        () -> chatMessageReactionRepository.save(
                                ChatMessageReaction.builder()
                                        .chatMessage(message)
                                        .user(user)
                                        .emoji(reactionKey)
                                        .build()
                        )
                );
        chatMessageReactionRepository.flush();

        return new MessageReactionUpdateResponse(
                messageId,
                buildReactionSummaries(List.of(message), currentUser.id()).getOrDefault(messageId, List.of())
        );
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageProcessResponse> getProcesses(AuthenticatedUser currentUser, Long conversationId) {
        findConversationForUser(conversationId, currentUser.id());
        return messageProcessRepository.findAllByConversationId(conversationId)
                .stream()
                .map(this::toProcessResponse)
                .toList();
    }

    @Override
    @Transactional
    public List<MessageProcessResponse> saveProcesses(
            AuthenticatedUser currentUser,
            Long conversationId,
            SaveMessageProcessesRequest request
    ) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());
        List<MessageProcessRequest> processRequests = request.processes() == null ? List.of() : request.processes();

        messageProcessRepository.deleteAllByConversationId(conversationId);

        List<MessageProcess> nextProcesses = new ArrayList<>();
        for (int processIndex = 0; processIndex < processRequests.size(); processIndex++) {
            MessageProcessRequest processRequest = processRequests.get(processIndex);
            MessageProcessConfirmationsRequest confirmations = processRequest.confirmations() == null
                    ? new MessageProcessConfirmationsRequest(false, false)
                    : processRequest.confirmations();

            List<MessageProcessTask> tasks = new ArrayList<>();
            List<MessageProcessTaskRequest> taskRequests = processRequest.tasks() == null ? List.of() : processRequest.tasks();

            MessageProcess process = MessageProcess.builder()
                    .conversation(conversation)
                    .title(processRequest.title().trim())
                    .status(calculateProcessStatus(taskRequests, confirmations))
                    .sortOrder(processIndex)
                    .designerConfirmed(confirmations.designer())
                    .clientConfirmed(confirmations.client())
                    .build();

            for (int taskIndex = 0; taskIndex < taskRequests.size(); taskIndex++) {
                MessageProcessTaskRequest taskRequest = taskRequests.get(taskIndex);
                tasks.add(MessageProcessTask.builder()
                        .process(process)
                        .taskText(taskRequest.text().trim())
                        .completed(taskRequest.completed())
                        .sortOrder(taskIndex)
                        .build());
            }

            process.replaceTasks(tasks);
            nextProcesses.add(process);
        }

        return messageProcessRepository.saveAll(nextProcesses)
                .stream()
                .map(this::toProcessResponse)
                .toList();
    }

    @Override
    @Transactional
    public void deleteConversation(AuthenticatedUser currentUser, Long conversationId) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());

        deleteOptionalConversationChildren(conversationId);
        chatMessageRepository.deleteAllByConversationId(conversationId);
        conversationRepository.delete(conversation);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canAccessConversation(AuthenticatedUser currentUser, Long conversationId) {
        return conversationRepository.findByIdWithParticipants(conversationId)
                .map(conversation -> conversation.hasParticipant(currentUser.id()))
                .orElse(false);
    }

    @Override
    @Transactional(readOnly = true)
    public Set<Long> getConversationParticipantIds(Long conversationId) {
        return conversationRepository.findByIdWithParticipants(conversationId)
                .map(conversation -> Set.of(
                        conversation.getUserOne().getId(),
                        conversation.getUserTwo().getId()
                ))
                .orElse(Set.of());
    }

    @Override
    @Transactional(readOnly = true)
    public Set<Long> getConversationIdsForUser(Long userId) {
        return Set.copyOf(conversationRepository.findIdsByParticipant(userId));
    }

    private MessageConversation findOrCreateConversation(Long currentUserId, Long partnerUserId) {
        if (currentUserId.equals(partnerUserId)) {
            throw new IllegalArgumentException("자기 자신과는 대화를 만들 수 없습니다.");
        }

        User currentUser = userRepository.findById(currentUserId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        User partner = userRepository.findById(partnerUserId)
                .orElseThrow(() -> new IllegalArgumentException("대화 상대를 찾을 수 없습니다."));

        User userOne = currentUser.getId() < partner.getId() ? currentUser : partner;
        User userTwo = currentUser.getId() < partner.getId() ? partner : currentUser;

        return conversationRepository.findByUserPair(userOne.getId(), userTwo.getId())
                .orElseGet(() -> conversationRepository.save(
                        MessageConversation.builder()
                                .userOne(userOne)
                                .userTwo(userTwo)
                                .build()
                ));
    }

    private MessageConversation findConversationForUser(Long conversationId, Long userId) {
        MessageConversation conversation = conversationRepository.findByIdWithParticipants(conversationId)
                .orElseThrow(() -> new IllegalArgumentException("대화를 찾을 수 없습니다."));

        if (!conversation.hasParticipant(userId)) {
            throw new IllegalArgumentException("대화에 접근할 권한이 없습니다.");
        }

        return conversation;
    }

    private MessageConversationResponse toConversationResponse(
            MessageConversation conversation,
            Long currentUserId,
            Long lastReadMessageId
    ) {
        User partner = conversation.getOtherParticipant(currentUserId);
        Designer designer = partner.getDesigner();

        return new MessageConversationResponse(
                conversation.getId(),
                partner.getId(),
                partner.getLoginId(),
                partner.getName(),
                partner.getNickname(),
                partner.getProfileImage(),
                partner.getRole(),
                designer == null ? null : designer.getJob(),
                designer == null ? null : designer.getIntroduction(),
                partner.getUrl(),
                MessageTextCodec.decode(conversation.getLastMessagePreview()),
                conversation.getLastMessageAt(),
                chatMessageRepository.countUnreadMessages(conversation.getId(), currentUserId, lastReadMessageId),
                messagePresenceTracker.isUserAvailable(partner.getId()),
                messagePresenceTracker.isTyping(conversation.getId(), partner.getId())
        );
    }

    private List<ChatMessageResponse> toChatMessageResponses(
            List<ChatMessage> messages,
            Long currentUserId,
            Long partnerLastReadMessageId
    ) {
        Map<Long, List<MessageReactionSummaryResponse>> reactionSummaries = buildReactionSummaries(messages, currentUserId);

        return messages.stream()
                .map(message -> toChatMessageResponse(
                        message,
                        currentUserId,
                        partnerLastReadMessageId,
                        reactionSummaries.getOrDefault(message.getId(), List.of())
                ))
                .toList();
    }

    private ChatMessageResponse toChatMessageResponse(
            ChatMessage message,
            Long currentUserId,
            Long partnerLastReadMessageId
    ) {
        return toChatMessageResponse(
                message,
                currentUserId,
                partnerLastReadMessageId,
                buildReactionSummaries(List.of(message), currentUserId).getOrDefault(message.getId(), List.of())
        );
    }

    private ChatMessageResponse toChatMessageResponse(
            ChatMessage message,
            Long currentUserId,
            Long partnerLastReadMessageId,
            List<MessageReactionSummaryResponse> reactions
    ) {
        boolean readByPartner = message.getSender().getId().equals(currentUserId)
                && partnerLastReadMessageId != null
                && message.getId() <= partnerLastReadMessageId;

        return new ChatMessageResponse(
                message.getId(),
                message.getClientId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getNickname(),
                MessageTextCodec.decode(message.getMessage()),
                readAttachments(message.getAttachmentsJson()),
                message.getCreatedAt() == null ? LocalDateTime.now() : message.getCreatedAt(),
                reactions,
                readByPartner
        );
    }

    private Map<Long, List<MessageReactionSummaryResponse>> buildReactionSummaries(
            List<ChatMessage> messages,
            Long currentUserId
    ) {
        if (messages.isEmpty()) {
            return Map.of();
        }

        List<Long> messageIds = messages.stream()
                .map(ChatMessage::getId)
                .toList();
        List<ChatMessageReaction> reactions = chatMessageReactionRepository.findAllByMessageIds(messageIds);

        Map<Long, LinkedHashMap<String, MessageReactionSummaryAccumulator>> groupedReactions = new LinkedHashMap<>();
        for (ChatMessageReaction reaction : reactions) {
            String displayEmoji = MessageReactionEmojiCodec.toDisplayEmoji(reaction.getEmoji());
            LinkedHashMap<String, MessageReactionSummaryAccumulator> emojiMap = groupedReactions
                    .computeIfAbsent(reaction.getChatMessage().getId(), ignored -> new LinkedHashMap<>());
            MessageReactionSummaryAccumulator currentSummary = emojiMap
                    .getOrDefault(displayEmoji, new MessageReactionSummaryAccumulator());
            emojiMap.put(
                    displayEmoji,
                    currentSummary.accumulate(reaction.getUser().getId().equals(currentUserId))
            );
        }

        Map<Long, List<MessageReactionSummaryResponse>> summaries = new LinkedHashMap<>();
        groupedReactions.forEach((messageId, emojiMap) -> summaries.put(
                messageId,
                emojiMap.entrySet().stream()
                        .map(entry -> new MessageReactionSummaryResponse(
                                entry.getKey(),
                                entry.getValue().count(),
                                entry.getValue().reactedByMe()
                        ))
                        .toList()
        ));
        return summaries;
    }

    private MessageProcessResponse toProcessResponse(MessageProcess process) {
        return new MessageProcessResponse(
                process.getId(),
                process.getTitle(),
                process.getStatus(),
                process.getTasks().stream()
                        .map(task -> new MessageProcessTaskResponse(
                                task.getId(),
                                task.getTaskText(),
                                task.isCompleted()
                        ))
                        .toList(),
                new MessageProcessConfirmationsResponse(
                        process.isDesignerConfirmed(),
                        process.isClientConfirmed()
                )
        );
    }

    private JsonNode normalizeAttachments(JsonNode attachments) {
        if (attachments == null || attachments.isNull() || attachments.isMissingNode()) {
            return objectMapper.createArrayNode();
        }

        if (!attachments.isArray()) {
            throw new IllegalArgumentException("attachments는 배열이어야 합니다.");
        }

        return attachments;
    }

    private JsonNode sanitizeAttachments(JsonNode attachments) {
        ArrayNode sanitizedAttachments = objectMapper.createArrayNode();

        attachments.forEach(attachment -> {
            if (!attachment.isObject()) {
                return;
            }

            String type = jsonText(attachment, "type");
            if (type == null) {
                return;
            }

            switch (type) {
                case "image" -> {
                    String src = firstNonBlank(
                            jsonText(attachment, "src"),
                            jsonText(attachment, "uploadedUrl"),
                            jsonText(attachment, "url")
                    );
                    if (src == null) {
                        return;
                    }

                    ObjectNode imageAttachment = objectMapper.createObjectNode();
                    putIfPresent(imageAttachment, "id", jsonText(attachment, "id"));
                    imageAttachment.put("type", "image");
                    imageAttachment.put("name", defaultAttachmentName(jsonText(attachment, "name"), "image"));
                    imageAttachment.put("src", src);
                    putIfPresent(imageAttachment, "mimeType", jsonText(attachment, "mimeType"));
                    putIfPositiveNumber(imageAttachment, "size", attachment.path("size"));
                    sanitizedAttachments.add(imageAttachment);
                }
                case "file" -> {
                    String url = firstNonBlank(
                            jsonText(attachment, "url"),
                            jsonText(attachment, "uploadedUrl")
                    );
                    if (url == null) {
                        return;
                    }

                    ObjectNode fileAttachment = objectMapper.createObjectNode();
                    putIfPresent(fileAttachment, "id", jsonText(attachment, "id"));
                    fileAttachment.put("type", "file");
                    fileAttachment.put("name", defaultAttachmentName(jsonText(attachment, "name"), "file"));
                    fileAttachment.put("url", url);
                    fileAttachment.put(
                            "mimeType",
                            firstNonBlank(jsonText(attachment, "mimeType"), "application/octet-stream")
                    );
                    putIfPositiveNumber(fileAttachment, "size", attachment.path("size"));
                    sanitizedAttachments.add(fileAttachment);
                }
                case "integration" -> {
                    String provider = jsonText(attachment, "provider");
                    String url = jsonText(attachment, "url");
                    if (provider == null || url == null) {
                        return;
                    }

                    ObjectNode integrationAttachment = objectMapper.createObjectNode();
                    putIfPresent(integrationAttachment, "id", jsonText(attachment, "id"));
                    integrationAttachment.put("type", "integration");
                    integrationAttachment.put("provider", provider);
                    integrationAttachment.put("url", url);
                    integrationAttachment.put(
                            "name",
                            defaultAttachmentName(jsonText(attachment, "name"), provider + "-link")
                    );
                    putIfPresent(integrationAttachment, "previewTitle", jsonText(attachment, "previewTitle"));
                    putIfPresent(integrationAttachment, "previewDescription", jsonText(attachment, "previewDescription"));
                    putIfPresent(integrationAttachment, "host", jsonText(attachment, "host"));
                    sanitizedAttachments.add(integrationAttachment);
                }
                case "icon" -> {
                    String value = jsonText(attachment, "value");
                    if (value == null) {
                        return;
                    }

                    ObjectNode iconAttachment = objectMapper.createObjectNode();
                    putIfPresent(iconAttachment, "id", jsonText(attachment, "id"));
                    iconAttachment.put("type", "icon");
                    iconAttachment.put("value", MessageAttachmentIconCodec.toStorageValue(value));
                    iconAttachment.put("name", defaultAttachmentName(jsonText(attachment, "name"), "message-icon"));
                    sanitizedAttachments.add(iconAttachment);
                }
                default -> {
                }
            }
        });

        return sanitizedAttachments;
    }

    private String normalizeClientId(String clientId) {
        if (clientId == null || clientId.isBlank()) {
            return null;
        }
        return clientId.trim();
    }

    private String writeAttachments(JsonNode attachments) {
        try {
            return objectMapper.writeValueAsString(attachments);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("첨부파일 정보를 저장할 수 없습니다.");
        }
    }

    private JsonNode readAttachments(String attachmentsJson) {
        if (attachmentsJson == null || attachmentsJson.isBlank()) {
            return objectMapper.createArrayNode();
        }

        try {
            JsonNode parsed = objectMapper.readTree(attachmentsJson);
            if (!parsed.isArray()) {
                return objectMapper.createArrayNode();
            }

            ArrayNode decodedAttachments = objectMapper.createArrayNode();
            parsed.forEach(attachment -> {
                if (!attachment.isObject()) {
                    return;
                }

                ObjectNode normalizedAttachment = ((ObjectNode) attachment).deepCopy();
                String type = jsonText(normalizedAttachment, "type");
                if ("icon".equals(type)) {
                    String value = jsonText(normalizedAttachment, "value");
                    if (value != null) {
                        normalizedAttachment.put("value", MessageAttachmentIconCodec.toDisplayEmoji(value));
                    }
                }
                decodedAttachments.add(normalizedAttachment);
            });

            return decodedAttachments;
        } catch (JsonProcessingException e) {
            return objectMapper.createArrayNode();
        }
    }

    private String createStoredConversationPreview(String message, JsonNode attachments) {
        String preview = message.isBlank() ? "첨부파일" : message;
        return MessageTextCodec.encodeWithinStoredLength(createPlainPreview(message, attachments), 500);
    }

    private String createNotificationPreview(String message, JsonNode attachments) {
        String preview = stripNonBmpCharacters(createPlainPreview(message, attachments));
        String truncatedPreview = preview.length() > 80 ? preview.substring(0, 80) : preview;
        return "새로운 메시지가 도착했습니다: " + truncatedPreview;
    }

    private String createPlainPreview(String message, JsonNode attachments) {
        return message.isBlank() ? "첨부파일" : message;
    }

    private String stripNonBmpCharacters(String value) {
        return value.codePoints()
                .filter(Character::isBmpCodePoint)
                .collect(StringBuilder::new, StringBuilder::appendCodePoint, StringBuilder::append)
                .toString();
    }

    private List<String> requestGeminiSuggestions(
            String goal,
            AuthenticatedUser currentUser,
            MessageConversation conversation,
            List<ChatMessage> messages,
            List<MessageProcess> processes,
            String draft
    ) {
        if (geminiApiKey == null || geminiApiKey.isBlank()) {
            return List.of();
        }

        try {
            RetrievedAssistantContext retrievedContext = retrieveAssistantContext(
                    goal,
                    currentUser,
                    conversation,
                    messages,
                    processes,
                    draft
            );
            ObjectNode requestBody = objectMapper.createObjectNode();
            ArrayNode contents = requestBody.putArray("contents");
            ObjectNode content = contents.addObject();
            ArrayNode parts = content.putArray("parts");
            parts.addObject().put(
                    "text",
                    buildAssistantPrompt(goal, currentUser, conversation, retrievedContext, draft)
            );

            ObjectNode generationConfig = requestBody.putObject("generationConfig");
            generationConfig.put("temperature", 0.8);
            generationConfig.put("responseMimeType", "application/json");

            HttpRequest httpRequest = HttpRequest.newBuilder()
                    .uri(URI.create(
                            "https://generativelanguage.googleapis.com/v1beta/models/"
                                    + geminiModel
                                    + ":generateContent?key="
                                    + URLEncoder.encode(geminiApiKey, StandardCharsets.UTF_8)
                    ))
                    .timeout(GEMINI_REQUEST_TIMEOUT)
                    .header("Content-Type", "application/json")
                    .header("x-goog-api-key", geminiApiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(objectMapper.writeValueAsString(requestBody)))
                    .build();

            HttpResponse<String> response = GEMINI_HTTP_CLIENT.send(
                    httpRequest,
                    HttpResponse.BodyHandlers.ofString()
            );
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                log.warn("gemini suggestions failed with status={} body={}", response.statusCode(), response.body());
                return List.of();
            }

            JsonNode responseJson = objectMapper.readTree(response.body());
            String candidateText = responseJson.at("/candidates/0/content/parts/0/text").asText("");
            if (candidateText.isBlank()) {
                return List.of();
            }

            String normalizedJson = candidateText
                    .replace("```json", "")
                    .replace("```", "")
                    .trim();
            JsonNode suggestionJson = objectMapper.readTree(normalizedJson);
            JsonNode suggestionsNode = suggestionJson.path("suggestions");
            if (!suggestionsNode.isArray()) {
                return List.of();
            }

            List<String> suggestions = new ArrayList<>();
            suggestionsNode.forEach(node -> {
                String value = node.asText("").trim();
                if (!value.isBlank()) {
                    suggestions.add(value);
                }
            });
            return suggestions;
        } catch (IOException | InterruptedException exception) {
            if (exception instanceof InterruptedException) {
                Thread.currentThread().interrupt();
            }
            log.warn("gemini suggestions unavailable: {}", exception.getMessage());
            return List.of();
        }
    }

    private String buildAssistantPrompt(
            String goal,
            AuthenticatedUser currentUser,
            MessageConversation conversation,
            RetrievedAssistantContext retrievedContext,
            String draft
    ) {
        User partner = conversation.getOtherParticipant(currentUser.id());

        StringBuilder prompt = new StringBuilder();
        prompt.append("You are a Korean messaging assistant for a creative collaboration chat.\n");
        prompt.append("Use the retrieved context below as your grounding context.\n");
        prompt.append("Return JSON only in this format: {\"suggestions\":[\"...\",\"...\",\"...\"]}\n");
        prompt.append("Rules:\n");
        prompt.append("- Write exactly 3 Korean message suggestions.\n");
        prompt.append("- Each suggestion should be ready to paste into a 1:1 chat.\n");
        prompt.append("- Keep each suggestion to 1 or 2 short sentences.\n");
        prompt.append("- No markdown, no bullet points, no emoji.\n");
        prompt.append("- Make the next action clear and practical.\n");
        prompt.append("- Ground every suggestion in the latest meaningful partner context, not just the general project context.\n");
        prompt.append("- The first suggestion should respond most directly to the latest meaningful partner context.\n");
        prompt.append("- Reuse concrete details from the retrieved context when available, such as time, date, deck, draft, link, revision, or task name.\n");
        prompt.append("- If the latest partner message is short or referential, use the previous thread message to infer what it refers to.\n");
        prompt.append("- If the latest partner message is unclear, playful, or low-signal, do not treat it as a concrete task by itself.\n");
        prompt.append("- In that case, rely on the previous thread message and current process, then ask a short clarification question if needed.\n");
        prompt.append("- Do not invent schedules, files, links, or commitments that are not present in the retrieved context.\n");

        switch (goal) {
            case "schedule_meeting" -> prompt.append("- Focus on proposing or confirming a meeting time.\n");
            case "share_document" -> prompt.append("- Focus on sharing a document or asking the partner to review it.\n");
            case "next_step" -> prompt.append("- Focus on the next concrete work step based on the current process.\n");
            default -> {
                prompt.append("- Focus on a natural reply to the partner's latest message.\n");
                prompt.append("- Acknowledge the partner's latest point first, then suggest the next move.\n");
                prompt.append("- If the partner asked a question, answer it clearly in the reply.\n");
            }
        }

        prompt.append("\nCurrent user:\n");
        prompt.append("- Name: ").append(displayUserName(currentUser.name(), currentUser.nickname())).append('\n');
        prompt.append("- Role: ").append(toRoleLabel(currentUser.role())).append('\n');
        prompt.append("Partner user:\n");
        prompt.append("- Name: ").append(displayUserName(partner.getName(), partner.getNickname())).append('\n');
        prompt.append("- Role: ").append(toRoleLabel(partner.getRole())).append('\n');

        if (!draft.isBlank()) {
            prompt.append("\nCurrent draft from the user:\n");
            prompt.append(draft).append('\n');
        }

        if (!retrievedContext.latestPartnerMessage().isBlank()) {
            if (retrievedContext.latestPartnerMessageLowSignal()) {
                prompt.append("\nLatest partner message (unclear or low-signal; do not treat it as a concrete task on its own):\n");
            } else {
                prompt.append("\nLatest partner message to respond to:\n");
            }
            prompt.append(retrievedContext.latestPartnerMessage()).append('\n');
        }
        if (!retrievedContext.previousThreadMessage().isBlank()) {
            prompt.append("\nPrevious thread message for context:\n");
            prompt.append(retrievedContext.previousThreadMessage()).append('\n');
        }
        if (!retrievedContext.referenceMessage().isBlank()
                && !retrievedContext.referenceMessage().equals(retrievedContext.latestPartnerMessage())
                && !retrievedContext.referenceMessage().equals(retrievedContext.previousThreadMessage())) {
            prompt.append("\nReference message for grounding:\n");
            prompt.append(retrievedContext.referenceMessage()).append('\n');
        }

        prompt.append("\nAssistant focus:\n");
        prompt.append("- Partner topic: ").append(retrievedContext.partnerTopic()).append('\n');
        prompt.append("- Recommended focus: ").append(retrievedContext.responseFocus()).append('\n');
        prompt.append("- Current active process: ").append(retrievedContext.activeProcessTitle()).append('\n');
        prompt.append("- Next recommended task: ").append(retrievedContext.nextTask()).append('\n');
        prompt.append("- Partner asked question: ").append(retrievedContext.partnerAskedQuestion()).append('\n');
        prompt.append("- Latest message low signal: ").append(retrievedContext.latestPartnerMessageLowSignal()).append('\n');

        prompt.append("\nRetrieved conversation context:\n");
        if (retrievedContext.messageFacts().isEmpty()) {
            prompt.append("- No relevant conversation context retrieved.\n");
        } else {
            for (String messageFact : retrievedContext.messageFacts()) {
                prompt.append("- ").append(messageFact).append('\n');
            }
        }

        prompt.append("\nRetrieved process context:\n");
        if (retrievedContext.processFacts().isEmpty()) {
            prompt.append("- No relevant process context retrieved.\n");
        } else {
            for (String processFact : retrievedContext.processFacts()) {
                prompt.append("- ").append(processFact).append('\n');
            }
        }

        prompt.append("\nReturn only valid JSON.");
        return prompt.toString();
    }

    private List<String> buildFallbackAssistantSuggestions(
            String goal,
            AuthenticatedUser currentUser,
            MessageConversation conversation,
            List<ChatMessage> messages,
            List<MessageProcess> processes,
            String draft
    ) {
        User partner = conversation.getOtherParticipant(currentUser.id());
        RetrievedAssistantContext retrievedContext = retrieveAssistantContext(
                goal,
                currentUser,
                conversation,
                messages,
                processes,
                draft
        );
        String partnerName = displayUserName(partner.getName(), partner.getNickname());
        String nextTask = buildTaskLabel(
                retrievedContext.nextTask(),
                retrievedContext.referenceMessage(),
                retrievedContext.latestPartnerMessage()
        );
        String activeProcess = retrievedContext.activeProcessTitle().isBlank()
                ? "current work"
                : retrievedContext.activeProcessTitle();
        String lastPartnerMessage = retrievedContext.latestPartnerMessage();
        String partnerContext = buildPartnerContextPrefix(retrievedContext.referenceMessage());
        String partnerTopic = retrievedContext.partnerTopic();
        boolean partnerAskedQuestion = retrievedContext.partnerAskedQuestion();
        boolean latestPartnerMessageLowSignal = retrievedContext.latestPartnerMessageLowSignal();

        List<String> suggestions = new ArrayList<>();

        switch (goal) {
            case "schedule_meeting" -> {
                suggestions.add(partnerContext + partnerName + "님, 이번 주에 20~30분 정도 짧게 미팅 잡아서 방향을 맞춰보면 좋을 것 같아요. 가능하신 시간대 알려주실 수 있을까요?");
                suggestions.add(partnerContext + "일정만 정해지면 바로 진행할 수 있어요. 편하신 날짜 두세 개만 보내주시면 맞춰볼게요.");
                suggestions.add(partnerContext + "미팅에서 우선순위랑 일정만 함께 정리하면 작업이 훨씬 빨라질 것 같아요. 괜찮으신 시간 알려주세요.");
            }
            case "share_document" -> {
                suggestions.add(partnerContext + "관련 문서 먼저 공유드릴게요. 확인해보시고 수정이나 보완이 필요한 부분 있으면 말씀해주세요.");
                suggestions.add(partnerContext + "작업 참고용 문서를 첨부했어요. 방향 괜찮으면 다음 단계로 바로 이어서 진행하겠습니다.");
                suggestions.add(partnerContext + "필요한 내용 정리한 문서 전달드립니다. 확인만 주시면 이어서 작업 시작할게요.");
            }
            case "next_step" -> {
                suggestions.add(partnerContext + "다음 단계는 " + nextTask + "부터 진행하면 될 것 같아요. 이 방향으로 바로 이어가도 괜찮을까요?");
                suggestions.add(partnerContext + activeProcess + " 쪽부터 먼저 정리해서 공유드릴게요. 확인해주시면 다음 작업까지 바로 이어가겠습니다.");
                suggestions.add(partnerContext + "지금 흐름상 " + nextTask + "를 먼저 맞추면 전체 진행이 훨씬 매끄러울 것 같아요. 편하게 의견 주세요.");
            }
            default -> {
                if (!lastPartnerMessage.isBlank()) {
                    suggestions.add(buildReplySuggestionForLatestMessage(
                            partnerContext,
                            partnerTopic,
                            partnerAskedQuestion,
                            nextTask,
                            latestPartnerMessageLowSignal
                    ));
                    suggestions.add(partnerContext + "우선 " + nextTask + "부터 정리해서 바로 공유드릴게요. 진행하면서 필요한 부분은 바로 반영하겠습니다.");
                    suggestions.add(partnerContext + "말씀 주신 방향 기준으로 " + activeProcess + " 진행 준비해둘게요. 추가로 원하시는 점 있으면 편하게 말씀해주세요.");
                } else {
                    suggestions.add("좋아요. 지금 기준으로는 " + nextTask + "부터 차근차근 진행하면 될 것 같아요. 확인 부탁드릴게요.");
                    suggestions.add("내용 잘 받았습니다. 필요한 부분 정리해서 다시 공유드릴게요. 추가로 원하시는 점 있으면 편하게 말씀해주세요.");
                    suggestions.add(activeProcess + " 진행하면서 바로 반영할 수 있게 준비해둘게요. 우선순위만 맞으면 바로 시작하겠습니다.");
                }
            }
        }

        return suggestions;
    }

    private RetrievedAssistantContext retrieveAssistantContext(
            String goal,
            AuthenticatedUser currentUser,
            MessageConversation conversation,
            List<ChatMessage> messages,
            List<MessageProcess> processes,
            String draft
    ) {
        User partner = conversation.getOtherParticipant(currentUser.id());
        int latestPartnerMessageIndex = findLastPartnerMessageIndex(messages, currentUser.id());
        String latestPartnerMessage = latestPartnerMessageIndex < 0
                ? ""
                : decodeMessageText(messages.get(latestPartnerMessageIndex));
        boolean latestPartnerMessageReferential = isReferentialAcknowledgement(latestPartnerMessage);
        boolean latestPartnerMessageLowSignal = isLowSignalMessage(latestPartnerMessage);
        String previousThreadMessage = findPreviousThreadMessage(messages, latestPartnerMessageIndex);
        String referenceMessage = resolveReferenceMessage(
                latestPartnerMessage,
                previousThreadMessage,
                latestPartnerMessageReferential,
                latestPartnerMessageLowSignal
        );
        String partnerTopic = detectPartnerTopic(referenceMessage);
        boolean partnerAskedQuestion = isQuestionMessage(latestPartnerMessage)
                || ((latestPartnerMessageReferential || latestPartnerMessageLowSignal) && isQuestionMessage(previousThreadMessage));
        String nextTask = findNextPendingTask(processes);
        String activeProcessTitle = findActiveProcessTitle(processes);
        Set<String> queryKeywords = buildAssistantQueryKeywords(
                goal,
                draft,
                latestPartnerMessage,
                referenceMessage,
                nextTask,
                activeProcessTitle,
                latestPartnerMessageLowSignal
        );
        String responseFocus = buildAssistantResponseFocus(
                goal,
                partnerTopic,
                partnerAskedQuestion,
                nextTask,
                activeProcessTitle,
                latestPartnerMessageLowSignal
        );

        List<String> latestThreadFacts = buildLatestThreadFacts(messages, currentUser, partner, latestPartnerMessageIndex);
        List<String> recentExchangeFacts = buildLatestExchangeFacts(messages, currentUser, partner, 4);
        List<String> scoredMessageFacts = buildRetrievedMessageFacts(
                messages,
                currentUser,
                partner,
                latestPartnerMessage,
                queryKeywords
        );
        List<String> messageFacts = mergeRetrievedFacts(
                latestThreadFacts,
                mergeRetrievedFacts(recentExchangeFacts, scoredMessageFacts, 8),
                8
        );
        List<String> processFacts = buildRetrievedProcessFacts(processes, queryKeywords, nextTask, activeProcessTitle);

        return new RetrievedAssistantContext(
                latestPartnerMessage,
                previousThreadMessage,
                referenceMessage,
                latestPartnerMessageLowSignal,
                latestPartnerMessageReferential,
                partnerTopic,
                partnerAskedQuestion,
                nextTask,
                activeProcessTitle,
                responseFocus,
                messageFacts,
                processFacts
        );
    }

    private Set<String> buildAssistantQueryKeywords(
            String goal,
            String draft,
            String latestPartnerMessage,
            String referenceMessage,
            String nextTask,
            String activeProcessTitle,
            boolean latestPartnerMessageLowSignal
    ) {
        Set<String> keywords = new LinkedHashSet<>();
        if (!latestPartnerMessageLowSignal) {
            keywords.addAll(tokenizeForRetrieval(latestPartnerMessage));
        }
        keywords.addAll(tokenizeForRetrieval(referenceMessage));
        keywords.addAll(tokenizeForRetrieval(draft));
        keywords.addAll(tokenizeForRetrieval(nextTask));
        keywords.addAll(tokenizeForRetrieval(activeProcessTitle));

        switch (goal) {
            case "schedule_meeting" -> {
                keywords.add("일정");
                keywords.add("미팅");
                keywords.add("회의");
                keywords.add("시간");
            }
            case "share_document" -> {
                keywords.add("문서");
                keywords.add("자료");
                keywords.add("첨부");
                keywords.add("링크");
            }
            case "next_step" -> {
                keywords.add("다음");
                keywords.add("단계");
                keywords.add("진행");
                keywords.add("프로세스");
            }
            default -> {
                keywords.add("답장");
                keywords.add("확인");
                keywords.add("반영");
            }
        }

        return keywords;
    }

    private List<String> buildRetrievedMessageFacts(
            List<ChatMessage> messages,
            AuthenticatedUser currentUser,
            User partner,
            String latestPartnerMessage,
            Set<String> queryKeywords
    ) {
        if (messages.isEmpty()) {
            return List.of();
        }

        String currentUserName = displayUserName(currentUser.name(), currentUser.nickname());
        String partnerName = displayUserName(partner.getName(), partner.getNickname());

        List<RetrievedMessageCandidate> candidates = new ArrayList<>();
        for (int index = 0; index < messages.size(); index++) {
            ChatMessage message = messages.get(index);
            String text = MessageTextCodec.decode(message.getMessage());
            if ((text == null || text.isBlank()) && readAttachments(message.getAttachmentsJson()).isEmpty()) {
                continue;
            }

            String normalizedText = (text == null || text.isBlank()) ? "Attachment shared" : text.trim();
            int attachmentCount = readAttachments(message.getAttachmentsJson()).size();
            if (attachmentCount > 0) {
                normalizedText = normalizedText + " (attachments: " + attachmentCount + ")";
            }

            boolean fromCurrentUser = message.getSender().getId().equals(currentUser.id());
            String speaker = fromCurrentUser ? currentUserName : partnerName;
            int score = scoreMessageForRetrieval(
                    normalizedText,
                    index,
                    messages.size(),
                    fromCurrentUser,
                    latestPartnerMessage,
                    queryKeywords
            );

            candidates.add(new RetrievedMessageCandidate(
                    score,
                    speaker + ": " + truncateForPrompt(normalizedText, 180),
                    fromCurrentUser,
                    message.getCreatedAt()
            ));
        }

        return candidates.stream()
                .sorted(Comparator
                        .comparingInt(RetrievedMessageCandidate::score).reversed()
                        .thenComparing(RetrievedMessageCandidate::createdAt, Comparator.nullsLast(Comparator.reverseOrder())))
                .limit(5)
                .map(RetrievedMessageCandidate::content)
                .collect(Collectors.toList());
    }

    private List<String> buildLatestExchangeFacts(
            List<ChatMessage> messages,
            AuthenticatedUser currentUser,
            User partner,
            int limit
    ) {
        if (messages.isEmpty() || limit <= 0) {
            return List.of();
        }

        String currentUserName = displayUserName(currentUser.name(), currentUser.nickname());
        String partnerName = displayUserName(partner.getName(), partner.getNickname());
        List<String> facts = new ArrayList<>();

        for (int index = Math.max(0, messages.size() - limit); index < messages.size(); index++) {
            ChatMessage message = messages.get(index);
            String text = MessageTextCodec.decode(message.getMessage());
            int attachmentCount = readAttachments(message.getAttachmentsJson()).size();
            if ((text == null || text.isBlank()) && attachmentCount == 0) {
                continue;
            }

            String normalizedText = (text == null || text.isBlank()) ? "Attachment shared" : text.trim();
            if (attachmentCount > 0) {
                normalizedText = normalizedText + " (attachments: " + attachmentCount + ")";
            }

            String speaker = message.getSender().getId().equals(currentUser.id())
                    ? currentUserName
                    : partnerName;
            facts.add(speaker + ": " + truncateForPrompt(normalizedText, 180));
        }

        return facts;
    }

    private List<String> buildLatestThreadFacts(
            List<ChatMessage> messages,
            AuthenticatedUser currentUser,
            User partner,
            int latestPartnerMessageIndex
    ) {
        if (messages.isEmpty() || latestPartnerMessageIndex < 0) {
            return List.of();
        }

        String currentUserName = displayUserName(currentUser.name(), currentUser.nickname());
        String partnerName = displayUserName(partner.getName(), partner.getNickname());
        List<String> facts = new ArrayList<>();

        for (int index = Math.max(0, latestPartnerMessageIndex - 2); index <= latestPartnerMessageIndex; index++) {
            ChatMessage message = messages.get(index);
            String normalizedText = summarizeMessageForPrompt(message);
            if (normalizedText.isBlank()) {
                continue;
            }

            String speaker = message.getSender().getId().equals(currentUser.id())
                    ? currentUserName
                    : partnerName;
            facts.add("Recent thread - " + speaker + ": " + truncateForPrompt(normalizedText, 180));
        }

        return facts;
    }

    private int scoreMessageForRetrieval(
            String messageText,
            int index,
            int totalMessages,
            boolean fromCurrentUser,
            String latestPartnerMessage,
            Set<String> queryKeywords
    ) {
        int score = 0;
        int recencyDistance = totalMessages - index - 1;
        score += Math.max(0, 34 - recencyDistance * 3);
        if (!fromCurrentUser) {
            score += 18;
        } else {
            score += 6;
        }
        if (recencyDistance <= 2) {
            score += 12;
        }
        if (messageText.equals(latestPartnerMessage)) {
            score += 120;
        }
        if (isQuestionMessage(messageText)) {
            score += 14;
        }

        String normalized = messageText.toLowerCase(Locale.ROOT);
        for (String keyword : queryKeywords) {
            if (keyword.length() >= 2 && normalized.contains(keyword.toLowerCase(Locale.ROOT))) {
                score += 8;
            }
        }

        return score;
    }

    private List<String> buildRetrievedProcessFacts(
            List<MessageProcess> processes,
            Set<String> queryKeywords,
            String nextTask,
            String activeProcessTitle
    ) {
        if (processes.isEmpty()) {
            return List.of();
        }

        List<String> overviewFacts = new ArrayList<>();
        if (activeProcessTitle != null && !activeProcessTitle.isBlank()) {
            overviewFacts.add("Current active process: " + truncateForPrompt(activeProcessTitle, 120));
        }
        if (nextTask != null && !nextTask.isBlank()) {
            overviewFacts.add("Next pending task: " + truncateForPrompt(nextTask, 120));
        }

        List<RetrievedProcessCandidate> candidates = new ArrayList<>();
        for (MessageProcess process : processes) {
            String processTitle = process.getTitle() == null ? "" : process.getTitle().trim();
            int processScore = process.getStatus().equals("in-progress") ? 25 : 10;
            if (process.getStatus().equals("pending")) {
                processScore += 18;
            }
            processScore += keywordMatchScore(processTitle, queryKeywords);

            String processSummary = "Process " + processTitle
                    + " [" + process.getStatus() + "]"
                    + ", designerConfirmed=" + process.isDesignerConfirmed()
                    + ", clientConfirmed=" + process.isClientConfirmed();
            candidates.add(new RetrievedProcessCandidate(processScore, processSummary));

            for (MessageProcessTask task : process.getTasks()) {
                String taskText = task.getTaskText() == null ? "" : task.getTaskText().trim();
                int taskScore = task.isCompleted() ? 8 : 30;
                taskScore += keywordMatchScore(taskText, queryKeywords);
                if (!task.isCompleted()) {
                    taskScore += 10;
                }
                candidates.add(new RetrievedProcessCandidate(
                        taskScore,
                        "Task " + (task.isCompleted() ? "done" : "pending") + " - " + truncateForPrompt(taskText, 120)
                ));
            }
        }

        List<String> rankedFacts = candidates.stream()
                .sorted(Comparator.comparingInt(RetrievedProcessCandidate::score).reversed())
                .limit(5)
                .map(RetrievedProcessCandidate::content)
                .collect(Collectors.toCollection(ArrayList::new));

        return mergeRetrievedFacts(overviewFacts, rankedFacts, 6);
    }

    private List<String> mergeRetrievedFacts(List<String> priorityFacts, List<String> rankedFacts, int limit) {
        LinkedHashSet<String> merged = new LinkedHashSet<>();
        priorityFacts.stream()
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .forEach(merged::add);
        rankedFacts.stream()
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .forEach(merged::add);

        List<String> facts = new ArrayList<>();
        for (String fact : merged) {
            facts.add(fact);
            if (facts.size() >= limit) {
                break;
            }
        }
        return facts;
    }

    private String buildAssistantResponseFocus(
            String goal,
            String partnerTopic,
            boolean partnerAskedQuestion,
            String nextTask,
            String activeProcessTitle,
            boolean latestPartnerMessageLowSignal
    ) {
        String questionHint = partnerAskedQuestion
                ? "Answer the partner's question clearly first. "
                : "";
        String lowSignalHint = latestPartnerMessageLowSignal
                ? "The latest partner message is unclear or non-actionable, so ask for a short clarification while staying aligned with the current thread context. "
                : "";

        return switch (goal) {
            case "schedule_meeting" -> questionHint + lowSignalHint + "Propose concrete meeting times and confirm availability before moving to " + nextTask + ".";
            case "share_document" -> questionHint + lowSignalHint + "Share or request the right document, then connect it to the current process " + activeProcessTitle + ".";
            case "next_step" -> questionHint + lowSignalHint + "Guide the conversation toward the next concrete task: " + nextTask + ".";
            default -> switch (partnerTopic) {
                case "schedule" -> questionHint + lowSignalHint + "Reply to the schedule request first, then suggest the next practical coordination step.";
                case "document" -> questionHint + lowSignalHint + "Reply with the document or material context first, then explain the next action.";
                case "feedback" -> questionHint + lowSignalHint + "Acknowledge the feedback and explain how it will be reflected in " + nextTask + ".";
                case "next_step" -> questionHint + lowSignalHint + "Confirm the direction and move the chat toward " + nextTask + ".";
                case "confirmation" -> questionHint + lowSignalHint + "Give a clear confirmation, then state the next action.";
                default -> questionHint + lowSignalHint + "Reply naturally to the latest meaningful partner context and make the next action explicit.";
            };
        };
    }

    private int keywordMatchScore(String source, Set<String> queryKeywords) {
        if (source == null || source.isBlank()) {
            return 0;
        }

        int score = 0;
        String normalized = source.toLowerCase(Locale.ROOT);
        for (String keyword : queryKeywords) {
            if (keyword.length() >= 2 && normalized.contains(keyword.toLowerCase(Locale.ROOT))) {
                score += 7;
            }
        }
        return score;
    }

    private String decodeMessageText(ChatMessage message) {
        String text = MessageTextCodec.decode(message.getMessage());
        return text == null ? "" : text.trim();
    }

    private String summarizeMessageForPrompt(ChatMessage message) {
        String text = decodeMessageText(message);
        int attachmentCount = readAttachments(message.getAttachmentsJson()).size();
        if (text.isBlank() && attachmentCount == 0) {
            return "";
        }

        String normalizedText = text.isBlank() ? "Attachment shared" : text;
        if (attachmentCount > 0) {
            normalizedText = normalizedText + " (attachments: " + attachmentCount + ")";
        }
        return normalizedText;
    }

    private Set<String> tokenizeForRetrieval(String text) {
        if (text == null || text.isBlank()) {
            return Set.of();
        }

        String normalized = text
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^0-9a-zA-Z가-힣\\s]", " ")
                .replaceAll("\\s+", " ")
                .trim();
        if (normalized.isBlank()) {
            return Set.of();
        }

        Set<String> stopWords = Set.of(
                "그냥", "이거", "저거", "이번", "지금", "먼저", "바로", "이제", "정도",
                "하고", "해서", "그러면", "그리고", "해주세요", "부탁", "확인", "내용"
        );
        Set<String> tokens = new HashSet<>();
        for (String token : normalized.split(" ")) {
            if (token.length() < 2 || stopWords.contains(token)) {
                continue;
            }
            tokens.add(token);
        }
        return tokens;
    }

    private List<String> normalizeAssistantSuggestions(List<String> primary, List<String> fallback) {
        LinkedHashSet<String> merged = new LinkedHashSet<>();
        primary.stream()
                .map(this::sanitizeAssistantSuggestion)
                .filter(value -> !value.isBlank())
                .forEach(merged::add);
        fallback.stream()
                .map(this::sanitizeAssistantSuggestion)
                .filter(value -> !value.isBlank())
                .forEach(merged::add);

        List<String> suggestions = new ArrayList<>();
        for (String suggestion : merged) {
            suggestions.add(suggestion);
            if (suggestions.size() >= ASSISTANT_SUGGESTION_LIMIT) {
                break;
            }
        }
        return suggestions;
    }

    private String sanitizeAssistantSuggestion(String suggestion) {
        if (suggestion == null || suggestion.isBlank()) {
            return "";
        }

        String normalized = suggestion
                .replace('\n', ' ')
                .replace('\r', ' ')
                .replace('\t', ' ')
                .replaceAll("\\s+", " ")
                .trim();

        if (normalized.startsWith("\"") && normalized.endsWith("\"") && normalized.length() >= 2) {
            normalized = normalized.substring(1, normalized.length() - 1).trim();
        }

        if (normalized.length() > ASSISTANT_SUGGESTION_MAX_LENGTH) {
            normalized = normalized.substring(0, ASSISTANT_SUGGESTION_MAX_LENGTH).trim();
        }

        return normalized;
    }

    private String normalizeAssistantGoal(String goal) {
        if (goal == null || goal.isBlank()) {
            return "reply";
        }

        String normalized = goal.trim().toLowerCase(Locale.ROOT);
        String compact = normalized.replace(" ", "").replace("-", "").replace("_", "");

        if ("reply".equals(normalized) || compact.contains("답장추천")) {
            return "reply";
        }
        if ("schedule_meeting".equals(normalized) || compact.contains("미팅") || compact.contains("일정")) {
            return "schedule_meeting";
        }
        if ("share_document".equals(normalized) || compact.contains("문서") || compact.contains("전달")) {
            return "share_document";
        }
        if ("next_step".equals(normalized) || compact.contains("다음단계")) {
            return "next_step";
        }
        return "reply";
    }

    private String displayUserName(String name, String nickname) {
        if (nickname != null && !nickname.isBlank()) {
            return nickname.trim();
        }
        if (name != null && !name.isBlank()) {
            return name.trim();
        }
        return "사용자";
    }

    private String toRoleLabel(UserRole role) {
        return role == UserRole.DESIGNER ? "디자이너" : "클라이언트";
    }

    private String findNextPendingTask(List<MessageProcess> processes) {
        for (MessageProcess process : processes) {
            for (MessageProcessTask task : process.getTasks()) {
                if (!task.isCompleted() && task.getTaskText() != null && !task.getTaskText().isBlank()) {
                    return task.getTaskText().trim();
                }
            }
        }
        return "다음 작업 단계";
    }

    private String findActiveProcessTitle(List<MessageProcess> processes) {
        for (MessageProcess process : processes) {
            if (process.getTitle() != null && !process.getTitle().isBlank()) {
                return process.getTitle().trim();
            }
        }
        return "현재 작업";
    }

    private String findLastPartnerMessage(List<ChatMessage> messages, Long currentUserId) {
        for (int index = messages.size() - 1; index >= 0; index--) {
            ChatMessage message = messages.get(index);
            if (message.getSender().getId().equals(currentUserId)) {
                continue;
            }

            String text = MessageTextCodec.decode(message.getMessage());
            if (text != null && !text.isBlank()) {
                return text.trim();
            }
        }
        return "";
    }

    private int findLastPartnerMessageIndex(List<ChatMessage> messages, Long currentUserId) {
        for (int index = messages.size() - 1; index >= 0; index--) {
            ChatMessage message = messages.get(index);
            if (message.getSender().getId().equals(currentUserId)) {
                continue;
            }

            String text = decodeMessageText(message);
            if (!text.isBlank()) {
                return index;
            }
        }
        return -1;
    }

    private String findPreviousThreadMessage(List<ChatMessage> messages, int latestPartnerMessageIndex) {
        if (latestPartnerMessageIndex <= 0) {
            return "";
        }

        for (int index = latestPartnerMessageIndex - 1; index >= 0; index--) {
            String text = decodeMessageText(messages.get(index));
            if (!text.isBlank()) {
                return text;
            }
        }
        return "";
    }

    private String resolveReferenceMessage(
            String latestPartnerMessage,
            String previousThreadMessage,
            boolean latestPartnerMessageReferential,
            boolean latestPartnerMessageLowSignal
    ) {
        if ((latestPartnerMessageReferential || latestPartnerMessageLowSignal)
                && previousThreadMessage != null
                && !previousThreadMessage.isBlank()) {
            return previousThreadMessage;
        }
        return latestPartnerMessage == null ? "" : latestPartnerMessage;
    }

    private String buildPartnerContextPrefix(String lastPartnerMessage) {
        if (lastPartnerMessage.isBlank()) {
            return "";
        }

        String summary = truncateForPrompt(lastPartnerMessage, 22);
        if (summary.isBlank()) {
            return "";
        }

        return "\"" + summary + "\" 말씀 주신 내용 기준으로 ";
    }

    private boolean isReferentialAcknowledgement(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }

        String normalized = message.trim().toLowerCase(Locale.ROOT);
        return normalized.length() <= 30
                && containsAny(normalized, "좋아요", "좋습니다", "그렇게", "그때", "그걸로", "확인", "부탁", "네", "넵", "ok", "sounds good");
    }

    private boolean isLowSignalMessage(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }

        String normalized = message.trim().toLowerCase(Locale.ROOT);
        if (isReferentialAcknowledgement(message)) {
            return false;
        }
        if (normalized.matches("^[\\p{Punct}\\s~]+$")) {
            return true;
        }
        if (normalized.matches("^[ㅋㅎㅠㅜ]+$")) {
            return true;
        }
        if (isQuestionMessage(message)
                || normalized.matches(".*\\d.*")
                || normalized.contains("http")
                || normalized.contains("@")
                || hasMeaningfulSignalKeyword(normalized)
                || normalized.contains(" ")) {
            return false;
        }
        if (normalized.matches(".*(요|다|죠|까|네|나요|입니다|합니다|할게요|드릴게요|보낼게요)$")) {
            return false;
        }
        return normalized.length() <= 8;
    }

    private boolean hasMeaningfulSignalKeyword(String normalized) {
        return containsAny(
                normalized,
                "가능",
                "확인",
                "링크",
                "link",
                "zoom",
                "줌",
                "자료",
                "문서",
                "파일",
                "file",
                "draft",
                "초안",
                "시안",
                "수정",
                "피드백",
                "리뷰",
                "review",
                "deck",
                "일정",
                "meeting",
                "미팅",
                "내일",
                "오늘",
                "오후",
                "오전",
                "공유",
                "보내",
                "반영",
                "진행",
                "작업"
        );
    }

    private boolean isQuestionMessage(String message) {
        if (message == null || message.isBlank()) {
            return false;
        }

        return message.contains("?")
                || message.contains("어떻게")
                || message.contains("언제")
                || message.contains("가능")
                || message.contains("괜찮")
                || message.contains("될까요")
                || message.contains("해주실")
                || message.contains("확인");
    }

    private String detectPartnerTopic(String message) {
        if (message == null || message.isBlank()) {
            return "general";
        }

        String normalized = message.toLowerCase(Locale.ROOT);
        if (containsAny(normalized, "일정", "미팅", "회의", "시간", "날짜", "가능 시간")) {
            return "schedule";
        }
        if (containsAny(normalized, "문서", "파일", "링크", "첨부", "자료")) {
            return "document";
        }
        if (containsAny(normalized, "수정", "피드백", "반영", "시안", "디자인")) {
            return "feedback";
        }
        if (containsAny(normalized, "다음 단계", "진행", "순서", "프로세스")) {
            return "next_step";
        }
        if (containsAny(normalized, "확인", "가능", "괜찮", "맞나요")) {
            return "confirmation";
        }
        return "general";
    }

    private boolean containsAny(String source, String... keywords) {
        for (String keyword : keywords) {
            if (source.contains(keyword)) {
                return true;
            }
        }
        return false;
    }

    private String buildTaskLabel(String nextTask, String... contextMessages) {
        String normalizedTask = nextTask == null ? "" : nextTask.trim();
        StringBuilder combined = new StringBuilder(normalizedTask);
        for (String contextMessage : contextMessages) {
            if (contextMessage == null || contextMessage.isBlank()) {
                continue;
            }
            combined.append(' ').append(contextMessage);
        }

        String normalized = combined.toString().toLowerCase(Locale.ROOT);
        if (containsAny(normalized, "zoom", "줌") && containsAny(normalized, "link", "링크")) {
            return "줌 링크";
        }
        if (normalizedTask.matches(".*[가-힣].*")) {
            return normalizedTask;
        }
        if (containsAny(normalized, "draft", "시안")) {
            return "시안";
        }
        if (containsAny(normalized, "revision note", "revision notes", "수정사항", "피드백")) {
            return "수정 사항";
        }
        if (containsAny(normalized, "document", "문서", "자료", "file", "파일")) {
            return "자료";
        }
        if (normalizedTask.isBlank()) {
            return "다음 작업";
        }
        return normalizedTask;
    }

    private String buildReplySuggestionForLatestMessage(
            String partnerContext,
            String partnerTopic,
            boolean partnerAskedQuestion,
            String nextTask,
            boolean latestPartnerMessageLowSignal
    ) {
        if (latestPartnerMessageLowSignal) {
            return partnerContext + "방금 보내주신 내용이 어느 부분을 말씀하신 건지 한 번만 더 알려주시면 바로 맞춰서 진행할게요. 일단은 "
                    + nextTask
                    + " 기준으로 준비해둘게요.";
        }

        return switch (partnerTopic) {
            case "schedule" -> partnerContext + "일정 관련해서는 바로 맞춰볼 수 있어요. 가능하신 시간대 주시면 " + nextTask + "까지 이어서 정리하겠습니다.";
            case "document" -> partnerContext + "자료 기준으로 바로 정리해볼게요. 문서 확인 후 " + nextTask + "까지 이어서 진행하겠습니다.";
            case "feedback" -> partnerContext + "피드백 주신 부분 반영해서 수정해볼게요. 우선 " + nextTask + "부터 정리해서 다시 공유드리겠습니다.";
            case "next_step" -> partnerContext + "다음 단계는 " + nextTask + "부터 진행하면 좋을 것 같아요. 이 흐름으로 바로 이어가보겠습니다.";
            case "confirmation" -> partnerContext + (partnerAskedQuestion
                    ? "네, 이 방향으로 진행 가능합니다. 우선 " + nextTask + "부터 정리해서 공유드릴게요."
                    : "확인했습니다. 우선 " + nextTask + "부터 정리해서 바로 이어가겠습니다.");
            default -> partnerContext + (partnerAskedQuestion
                    ? "말씀 주신 내용 기준으로 바로 답변드리면, " + nextTask + "부터 정리해서 진행하는 게 좋을 것 같아요."
                    : nextTask + " 방향으로 반영해서 이어서 진행해볼게요.");
        };
    }

    private String normalizeDraftSuggestion(String draft) {
        if (draft == null || draft.isBlank()) {
            return "";
        }

        String normalized = draft.trim().replaceAll("\\s+", " ");
        if (normalized.length() > 180) {
            return normalized.substring(0, 180).trim();
        }
        return normalized;
    }

    private String truncateForPrompt(String value, int maxLength) {
        if (value == null) {
            return "";
        }
        String normalized = value.trim().replaceAll("\\s+", " ");
        if (normalized.length() <= maxLength) {
            return normalized;
        }
        return normalized.substring(0, maxLength - 1) + "…";
    }

    private void deleteOptionalConversationChildren(Long conversationId) {
        tryDeleteConversationChild(
                "delete from chat_message_reactions where message_id in (select message_id from chat_messages where conversation_id = ?)",
                conversationId
        );
        tryDeleteConversationChild(
                "delete from message_process_tasks where process_id in (select process_id from message_processes where conversation_id = ?)",
                conversationId
        );
        tryDeleteConversationChild(
                "delete from message_processes where conversation_id = ?",
                conversationId
        );
        tryDeleteConversationChild(
                "delete from message_reviews where conversation_id = ?",
                conversationId
        );
    }

    private void tryDeleteConversationChild(String sql, Long conversationId) {
        try {
            jdbcTemplate.update(sql, conversationId);
        } catch (DataAccessException ignored) {
            // Some environments do not have the optional message process/review tables yet.
        }
    }

    private String calculateProcessStatus(
            List<MessageProcessTaskRequest> tasks,
            MessageProcessConfirmationsRequest confirmations
    ) {
        if (tasks == null || tasks.isEmpty()) {
            return "pending";
        }

        long completedTaskCount = tasks.stream()
                .filter(MessageProcessTaskRequest::completed)
                .count();

        if (completedTaskCount == tasks.size() && confirmations.designer() && confirmations.client()) {
            return "completed";
        }
        if (completedTaskCount > 0 || confirmations.designer() || confirmations.client()) {
            return "in-progress";
        }
        return "pending";
    }

    private record RetrievedAssistantContext(
            String latestPartnerMessage,
            String previousThreadMessage,
            String referenceMessage,
            boolean latestPartnerMessageLowSignal,
            boolean latestPartnerMessageReferential,
            String partnerTopic,
            boolean partnerAskedQuestion,
            String nextTask,
            String activeProcessTitle,
            String responseFocus,
            List<String> messageFacts,
            List<String> processFacts
    ) {
    }

    private record RetrievedMessageCandidate(
            int score,
            String content,
            boolean fromCurrentUser,
            LocalDateTime createdAt
    ) {
    }

    private record RetrievedProcessCandidate(
            int score,
            String content
    ) {
    }

    private record MessageReactionSummaryAccumulator(long count, boolean reactedByMe) {
        private MessageReactionSummaryAccumulator() {
            this(0, false);
        }

        private MessageReactionSummaryAccumulator accumulate(boolean reactedByCurrentUser) {
            return new MessageReactionSummaryAccumulator(count + 1, reactedByMe || reactedByCurrentUser);
        }
    }

    private String jsonText(JsonNode node, String fieldName) {
        JsonNode value = node.path(fieldName);
        if (value.isMissingNode() || value.isNull()) {
            return null;
        }

        String text = value.asText();
        return text == null || text.isBlank() ? null : text.trim();
    }

    private String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value.trim();
            }
        }
        return null;
    }

    private String defaultAttachmentName(String value, String fallback) {
        return value == null || value.isBlank() ? fallback : value.trim();
    }

    private void putIfPresent(ObjectNode node, String fieldName, String value) {
        if (value != null) {
            node.put(fieldName, value);
        }
    }

    private void putIfPositiveNumber(ObjectNode node, String fieldName, JsonNode value) {
        if (value.isNumber() && value.asLong() > 0) {
            node.put(fieldName, value.asLong());
        }
    }
}
