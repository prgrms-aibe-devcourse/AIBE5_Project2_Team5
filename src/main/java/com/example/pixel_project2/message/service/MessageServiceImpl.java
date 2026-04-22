package com.example.pixel_project2.message.service;

import com.example.pixel_project2.common.entity.Designer;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.dto.ChatMessageResponse;
import com.example.pixel_project2.message.dto.CreateConversationRequest;
import com.example.pixel_project2.message.dto.MessageConversationResponse;
import com.example.pixel_project2.message.dto.MessagePolicyResponse;
import com.example.pixel_project2.message.dto.MessageUserResponse;
import com.example.pixel_project2.message.dto.SendMessageRequest;
import com.example.pixel_project2.message.entity.ChatMessage;
import com.example.pixel_project2.message.entity.MessageConversation;
import com.example.pixel_project2.message.repository.ChatMessageRepository;
import com.example.pixel_project2.message.repository.MessageConversationRepository;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MessageServiceImpl implements MessageService {
    private final UserRepository userRepository;
    private final MessageConversationRepository conversationRepository;
    private final ChatMessageRepository chatMessageRepository;
    private final ObjectMapper objectMapper;

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

        return toChatMessageResponse(savedMessage);
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
                0
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

    private ChatMessageResponse toChatMessageResponse(ChatMessage message) {
        return new ChatMessageResponse(
                message.getId(),
                message.getClientId(),
                message.getConversation().getId(),
                message.getSender().getId(),
                message.getSender().getNickname(),
                message.getMessage() == null ? "" : message.getMessage(),
                readAttachments(message.getAttachmentsJson()),
                message.getCreatedAt() == null ? LocalDateTime.now() : message.getCreatedAt()
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
