package com.example.pixel_project2.message.service;

import com.example.pixel_project2.common.entity.Designer;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.repository.DesignerRepository;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.dto.ChatMessageResponse;
import com.example.pixel_project2.message.dto.CreateConversationRequest;
import com.example.pixel_project2.message.dto.CreateMessageReviewRequest;
import com.example.pixel_project2.message.dto.MessageConversationResponse;
import com.example.pixel_project2.message.dto.MessagePolicyResponse;
import com.example.pixel_project2.message.dto.MessageProcessConfirmationsRequest;
import com.example.pixel_project2.message.dto.MessageProcessConfirmationsResponse;
import com.example.pixel_project2.message.dto.MessageProcessRequest;
import com.example.pixel_project2.message.dto.MessageProcessResponse;
import com.example.pixel_project2.message.dto.MessageProcessTaskRequest;
import com.example.pixel_project2.message.dto.MessageProcessTaskResponse;
import com.example.pixel_project2.message.dto.MessageReadReceiptResponse;
import com.example.pixel_project2.message.dto.MessageUserResponse;
import com.example.pixel_project2.message.dto.SaveMessageProcessesRequest;
import com.example.pixel_project2.message.dto.SendMessageRequest;
import com.example.pixel_project2.message.dto.UpdateMessageProcessConfirmationRequest;
import com.example.pixel_project2.message.dto.UpdateMessageProcessTaskRequest;
import com.example.pixel_project2.message.entity.ChatMessage;
import com.example.pixel_project2.message.entity.MessageConversation;
import com.example.pixel_project2.message.entity.MessageProcess;
import com.example.pixel_project2.message.entity.MessageProcessTask;
import com.example.pixel_project2.message.entity.MessageReview;
import com.example.pixel_project2.message.event.ChatMessageSentEvent;
import com.example.pixel_project2.message.event.MessageReadReceiptEvent;
import com.example.pixel_project2.message.event.MessageProcessesUpdatedEvent;
import com.example.pixel_project2.message.repository.ChatMessageRepository;
import com.example.pixel_project2.message.repository.MessageConversationRepository;
import com.example.pixel_project2.message.repository.MessageProcessRepository;
import com.example.pixel_project2.message.repository.MessageReviewRepository;
import com.example.pixel_project2.profile.dto.ProfileReviewResponse;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {
    private final UserRepository userRepository;
    private final DesignerRepository designerRepository;
    private final MessageConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final MessageProcessRepository messageProcessRepository;
    private final MessageReviewRepository messageReviewRepository;
    private final ObjectMapper objectMapper;
    private final ApplicationEventPublisher eventPublisher;

    @Override
    public MessagePolicyResponse getMessagePolicy() {
        return new MessagePolicyResponse(true, true, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageUserResponse> getMessageUsers(AuthenticatedUser currentUser) {
        return userRepository.findMessageUsers(currentUser.id())
                .stream()
                .map(this::toMessageUserResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageConversationResponse> getConversations(AuthenticatedUser currentUser) {
        return conversationRepository.findAllByParticipant(currentUser.id())
                .stream()
                .map(conversation -> toConversationResponse(conversation, currentUser.id()))
                .toList();
    }

    @Override
    @Transactional
    public MessageConversationResponse createConversation(
            AuthenticatedUser currentUser,
            CreateConversationRequest request
    ) {
        MessageConversation conversation = findOrCreateConversation(currentUser.id(), request.partnerUserId());
        return toConversationResponse(conversation, currentUser.id());
    }

    @Override
    @Transactional(readOnly = true)
    public List<ChatMessageResponse> getMessages(AuthenticatedUser currentUser, Long conversationId) {
        findConversationForUser(conversationId, currentUser.id());
        return chatMessageRepository.findAllByConversationId(conversationId)
                .stream()
                .map(this::toChatMessageResponse)
                .toList();
    }

    @Override
    @Transactional
    public ChatMessageResponse sendMessage(
            AuthenticatedUser currentUser,
            Long conversationId,
            SendMessageRequest request
    ) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());
        User sender = userRepository.findById(currentUser.id())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        JsonNode attachments = normalizeAttachments(request.attachments());
        String message = request.message() == null ? "" : request.message().trim();
        if (message.isBlank() && attachments.isEmpty()) {
            throw new IllegalArgumentException("메시지 내용 또는 첨부파일을 입력해주세요.");
        }

        ChatMessage chatMessage = ChatMessage.builder()
                .conversation(conversation)
                .sender(sender)
                .clientId(normalizeClientId(request.clientId()))
                .message(message)
                .attachmentsJson(writeAttachments(attachments))
                .build();
        ChatMessage savedMessage = chatMessageRepository.save(chatMessage);

        LocalDateTime messageCreatedAt = savedMessage.getCreatedAt() == null
                ? LocalDateTime.now()
                : savedMessage.getCreatedAt();
        conversation.updateLastMessage(createPreview(message, attachments), messageCreatedAt);

        ChatMessageResponse response = toChatMessageResponse(savedMessage);
        eventPublisher.publishEvent(new ChatMessageSentEvent(response));
        return response;
    }

    @Override
    @Transactional
    public MessageReadReceiptResponse markConversationRead(AuthenticatedUser currentUser, Long conversationId) {
        findConversationForUser(conversationId, currentUser.id());
        List<ChatMessage> unreadMessages = chatMessageRepository.findUnreadByConversationIdForReader(
                conversationId,
                currentUser.id()
        );
        LocalDateTime readAt = LocalDateTime.now();

        unreadMessages.forEach(message -> message.setReadAt(readAt));

        MessageReadReceiptResponse response = new MessageReadReceiptResponse(
                conversationId,
                currentUser.id(),
                currentUser.nickname(),
                unreadMessages.stream()
                        .map(ChatMessage::getId)
                        .toList(),
                unreadMessages.stream()
                        .map(ChatMessage::getClientId)
                        .filter(clientId -> clientId != null && !clientId.isBlank())
                        .toList(),
                readAt
        );

        if (!unreadMessages.isEmpty()) {
            eventPublisher.publishEvent(new MessageReadReceiptEvent(response));
        }

        return response;
    }

    @Override
    @Transactional(readOnly = true)
    public List<MessageProcessResponse> getProcesses(AuthenticatedUser currentUser, Long conversationId) {
        findConversationForUser(conversationId, currentUser.id());
        return messageProcessRepository.findAllByConversationIdWithTasks(conversationId)
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
        List<MessageProcessRequest> requestedProcesses = request == null ? null : request.processes();
        if (requestedProcesses == null || requestedProcesses.isEmpty()) {
            throw new IllegalArgumentException("At least one process is required.");
        }

        List<MessageProcess> previousProcesses =
                messageProcessRepository.findAllByConversationIdWithTasks(conversationId);
        messageProcessRepository.deleteAll(previousProcesses);
        messageProcessRepository.flush();

        List<MessageProcess> nextProcesses = new ArrayList<>();
        for (int index = 0; index < requestedProcesses.size(); index += 1) {
            nextProcesses.add(toProcessEntity(conversation, requestedProcesses.get(index), index));
        }

        List<MessageProcessResponse> response = messageProcessRepository.saveAll(nextProcesses)
                .stream()
                .map(this::toProcessResponse)
                .toList();
        eventPublisher.publishEvent(new MessageProcessesUpdatedEvent(conversationId, response));
        return response;
    }

    @Override
    @Transactional
    public MessageProcessResponse updateProcessTask(
            AuthenticatedUser currentUser,
            Long conversationId,
            Long processId,
            Long taskId,
            UpdateMessageProcessTaskRequest request
    ) {
        if (request == null || request.completed() == null) {
            throw new IllegalArgumentException("Task completion is required.");
        }
        findConversationForUser(conversationId, currentUser.id());
        MessageProcess process = findProcessForConversation(conversationId, processId);
        MessageProcessTask task = process.getTasks()
                .stream()
                .filter(candidate -> candidate.getId().equals(taskId))
                .findFirst()
                .orElseThrow(() -> new IllegalArgumentException("Process task not found."));

        task.setCompleted(Boolean.TRUE.equals(request.completed()));
        refreshProcessStatus(process);
        MessageProcessResponse response = toProcessResponse(process);
        publishProcessesUpdated(conversationId);
        return response;
    }

    @Override
    @Transactional
    public MessageProcessResponse updateProcessConfirmation(
            AuthenticatedUser currentUser,
            Long conversationId,
            Long processId,
            String role,
            UpdateMessageProcessConfirmationRequest request
    ) {
        if (request == null || request.confirmed() == null) {
            throw new IllegalArgumentException("Confirmation value is required.");
        }
        findConversationForUser(conversationId, currentUser.id());
        MessageProcess process = findProcessForConversation(conversationId, processId);
        boolean confirmed = Boolean.TRUE.equals(request.confirmed());

        if ("designer".equalsIgnoreCase(role)) {
            process.setDesignerConfirmed(confirmed);
        } else if ("client".equalsIgnoreCase(role)) {
            process.setClientConfirmed(confirmed);
        } else {
            throw new IllegalArgumentException("Unknown confirmation role.");
        }

        refreshProcessStatus(process);
        MessageProcessResponse response = toProcessResponse(process);
        publishProcessesUpdated(conversationId);
        return response;
    }

    @Override
    @Transactional
    public ProfileReviewResponse createConversationReview(
            AuthenticatedUser currentUser,
            Long conversationId,
            CreateMessageReviewRequest request
    ) {
        MessageConversation conversation = findConversationForUser(conversationId, currentUser.id());
        List<MessageProcess> processes = messageProcessRepository.findAllByConversationIdWithTasks(conversationId);
        if (processes.isEmpty() || processes.stream().anyMatch(process -> !"completed".equals(process.getStatus()))) {
            throw new IllegalArgumentException("All message processes must be completed before writing a review.");
        }

        User reviewer = userRepository.findById(currentUser.id())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        User reviewee = conversation.getOtherParticipant(currentUser.id());

        MessageReview review = messageReviewRepository.findByConversationIdAndReviewerId(
                        conversationId,
                        currentUser.id()
                )
                .orElseGet(() -> MessageReview.builder()
                        .conversation(conversation)
                        .reviewer(reviewer)
                        .reviewee(reviewee)
                        .build());

        review.setProjectTitle(normalizeRequiredText(request.projectTitle(), "Project title", 200));
        review.setRating(normalizeRating(request.rating()));
        review.setContent(normalizeRequiredText(request.content(), "Review content", 2000));
        review.setWorkCategoriesJson(writeStringList(normalizeStringList(request.workCategories(), 8, 100)));
        review.setComplimentTagsJson(writeStringList(normalizeStringList(request.complimentTags(), 12, 100)));

        MessageReview savedReview = messageReviewRepository.save(review);
        refreshDesignerRating(reviewee.getId());
        return toProfileReviewResponse(savedReview);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean canAccessConversation(AuthenticatedUser currentUser, Long conversationId) {
        return conversationRepository.findByIdWithParticipants(conversationId)
                .map(conversation -> conversation.hasParticipant(currentUser.id()))
                .orElse(false);
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

    private MessageProcess findProcessForConversation(Long conversationId, Long processId) {
        return messageProcessRepository.findByIdAndConversationIdWithTasks(processId, conversationId)
                .orElseThrow(() -> new IllegalArgumentException("Process not found."));
    }

    private void publishProcessesUpdated(Long conversationId) {
        List<MessageProcessResponse> processes = messageProcessRepository.findAllByConversationIdWithTasks(conversationId)
                .stream()
                .map(this::toProcessResponse)
                .toList();
        eventPublisher.publishEvent(new MessageProcessesUpdatedEvent(conversationId, processes));
    }

    private MessageProcess toProcessEntity(
            MessageConversation conversation,
            MessageProcessRequest request,
            int sortOrder
    ) {
        if (request == null) {
            throw new IllegalArgumentException("Process is required.");
        }

        String title = normalizeRequiredText(request.title(), "Process title", 200);
        List<MessageProcessTaskRequest> requestedTasks = request.tasks();
        if (requestedTasks == null || requestedTasks.isEmpty()) {
            throw new IllegalArgumentException("At least one process task is required.");
        }

        MessageProcessConfirmationsRequest confirmations = request.confirmations();
        MessageProcess process = MessageProcess.builder()
                .conversation(conversation)
                .title(title)
                .status("pending")
                .sortOrder(sortOrder)
                .designerConfirmed(confirmations != null && Boolean.TRUE.equals(confirmations.designer()))
                .clientConfirmed(confirmations != null && Boolean.TRUE.equals(confirmations.client()))
                .build();

        for (int taskIndex = 0; taskIndex < requestedTasks.size(); taskIndex += 1) {
            MessageProcessTaskRequest taskRequest = requestedTasks.get(taskIndex);
            if (taskRequest == null) {
                throw new IllegalArgumentException("Process task is required.");
            }
            process.addTask(MessageProcessTask.builder()
                    .text(normalizeRequiredText(taskRequest.text(), "Process task", 500))
                    .completed(Boolean.TRUE.equals(taskRequest.completed()))
                    .sortOrder(taskIndex)
                    .build());
        }

        refreshProcessStatus(process);
        return process;
    }

    private void refreshProcessStatus(MessageProcess process) {
        process.setStatus(resolveProcessStatus(
                process.getTasks(),
                Boolean.TRUE.equals(process.getDesignerConfirmed()),
                Boolean.TRUE.equals(process.getClientConfirmed())
        ));
    }

    private String resolveProcessStatus(
            List<MessageProcessTask> tasks,
            boolean designerConfirmed,
            boolean clientConfirmed
    ) {
        boolean hasTasks = tasks != null && !tasks.isEmpty();
        boolean allTasksCompleted = hasTasks && tasks.stream()
                .allMatch(task -> Boolean.TRUE.equals(task.getCompleted()));
        boolean hasAnyProgress = hasTasks && tasks.stream()
                .anyMatch(task -> Boolean.TRUE.equals(task.getCompleted()));

        if (allTasksCompleted && designerConfirmed && clientConfirmed) {
            return "completed";
        }
        if (hasAnyProgress || designerConfirmed || clientConfirmed) {
            return "in-progress";
        }
        return "pending";
    }

    private String normalizeRequiredText(String value, String fieldName, int maxLength) {
        if (value == null || value.isBlank()) {
            throw new IllegalArgumentException(fieldName + " is required.");
        }

        String normalized = value.trim();
        if (normalized.length() > maxLength) {
            throw new IllegalArgumentException(fieldName + " is too long.");
        }
        return normalized;
    }

    private Integer normalizeRating(Integer rating) {
        if (rating == null || rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Review rating must be between 1 and 5.");
        }
        return rating;
    }

    private List<String> normalizeStringList(List<String> values, int maxItems, int maxLength) {
        if (values == null) {
            return List.of();
        }

        return values.stream()
                .filter(value -> value != null && !value.isBlank())
                .map(String::trim)
                .distinct()
                .limit(maxItems)
                .map(value -> value.length() > maxLength ? value.substring(0, maxLength) : value)
                .toList();
    }

    private String writeStringList(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values);
        } catch (JsonProcessingException e) {
            throw new IllegalArgumentException("Review tags could not be saved.");
        }
    }

    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(
                    json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private void refreshDesignerRating(Long userId) {
        designerRepository.findById(userId).ifPresent(designer -> {
            List<MessageReview> reviews = messageReviewRepository.findAllByRevieweeIdWithUsers(userId);
            if (reviews.isEmpty()) {
                return;
            }

            double averageRating = reviews.stream()
                    .mapToInt(MessageReview::getRating)
                    .average()
                    .orElse(0.0);
            designer.setRating((float) (Math.round(averageRating * 10.0) / 10.0));
        });
    }

    private MessageConversationResponse toConversationResponse(MessageConversation conversation, Long currentUserId) {
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
                conversation.getLastMessagePreview(),
                conversation.getLastMessageAt(),
                chatMessageRepository.countUnreadByConversationIdForReader(conversation.getId(), currentUserId)
        );
    }

    private MessageUserResponse toMessageUserResponse(User user) {
        Designer designer = user.getDesigner();

        return new MessageUserResponse(
                user.getId(),
                user.getLoginId(),
                user.getName(),
                user.getNickname(),
                user.getProfileImage(),
                user.getRole(),
                designer == null ? null : designer.getJob(),
                designer == null ? null : designer.getIntroduction(),
                user.getUrl()
        );
    }

    private MessageProcessResponse toProcessResponse(MessageProcess process) {
        return new MessageProcessResponse(
                process.getId(),
                process.getTitle(),
                process.getStatus(),
                new MessageProcessConfirmationsResponse(
                        Boolean.TRUE.equals(process.getDesignerConfirmed()),
                        Boolean.TRUE.equals(process.getClientConfirmed())
                ),
                process.getTasks()
                        .stream()
                        .map(task -> new MessageProcessTaskResponse(
                                task.getId(),
                                task.getText(),
                                Boolean.TRUE.equals(task.getCompleted())
                        ))
                        .toList()
        );
    }

    private ProfileReviewResponse toProfileReviewResponse(MessageReview review) {
        User reviewer = review.getReviewer();
        return ProfileReviewResponse.builder()
                .reviewId(review.getId())
                .projectId(review.getConversation().getId())
                .projectTitle(review.getProjectTitle())
                .reviewerId(reviewer.getId())
                .reviewerName(reviewer.getName())
                .reviewerNickname(reviewer.getNickname())
                .reviewerProfileImage(reviewer.getProfileImage())
                .rating(review.getRating())
                .content(review.getContent())
                .workCategories(readStringList(review.getWorkCategoriesJson()))
                .complimentTags(readStringList(review.getComplimentTagsJson()))
                .createdAt(review.getCreatedAt())
                .build();
    }

    private ChatMessageResponse toChatMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getClientId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getNickname(),
                message.getMessage() == null ? "" : message.getMessage(),
                readAttachments(message.getAttachmentsJson()),
                message.getCreatedAt() == null ? LocalDateTime.now() : message.getCreatedAt(),
                message.getReadAt()
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
            return objectMapper.readTree(attachmentsJson);
        } catch (JsonProcessingException e) {
            return objectMapper.createArrayNode();
        }
    }

    private String createPreview(String message, JsonNode attachments) {
        String preview = message.isBlank() ? "첨부파일" : message;
        if (preview.length() <= 500) {
            return preview;
        }
        return preview.substring(0, 500);
    }
}
