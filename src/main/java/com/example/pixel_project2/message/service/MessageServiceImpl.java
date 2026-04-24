package com.example.pixel_project2.message.service;

import com.example.pixel_project2.common.entity.Designer;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.dto.ChatMessageResponse;
import com.example.pixel_project2.message.dto.CreateConversationRequest;
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
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataAccessException;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Slf4j
public class MessageServiceImpl implements MessageService {
    private final UserRepository userRepository;
    private final MessageConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ChatMessageReactionRepository chatMessageReactionRepository;
    private final MessageProcessRepository messageProcessRepository;
    private final ObjectMapper objectMapper;
    private final JdbcTemplate jdbcTemplate;
    private final MessagePresenceTracker messagePresenceTracker;

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
    public List<ChatMessageResponse> getMessages(AuthenticatedUser currentUser, Long conversationId) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());
        messagePresenceTracker.touchUser(currentUser.id());
        List<ChatMessage> messages = chatMessageRepository.findAllByConversationId(conversationId);
        Long partnerLastReadMessageId = conversation.getPartnerLastReadMessageId(currentUser.id());

        if (!messages.isEmpty()) {
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
        conversation.updateLastMessage(createPreview(message, attachments), messageCreatedAt);
        conversation.markRead(currentUser.id(), savedMessage.getId());

        return toChatMessageResponse(savedMessage, currentUser.id(), conversation.getPartnerLastReadMessageId(currentUser.id()));
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

    private String createPreview(String message, JsonNode attachments) {
        String preview = message.isBlank() ? "첨부파일" : message;
        if (preview.length() <= 500) {
            return MessageTextCodec.encode(preview);
        }
        return MessageTextCodec.encode(preview.substring(0, 500));
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

    private void putIfPresent(ObjectNode objectNode, String fieldName, String value) {
        if (value != null && !value.isBlank()) {
            objectNode.put(fieldName, value.trim());
        }
    }

    private void putIfPositiveNumber(ObjectNode objectNode, String fieldName, JsonNode value) {
        if (value != null && value.canConvertToLong() && value.asLong() > 0) {
            objectNode.put(fieldName, value.asLong());
        }
    }
}
