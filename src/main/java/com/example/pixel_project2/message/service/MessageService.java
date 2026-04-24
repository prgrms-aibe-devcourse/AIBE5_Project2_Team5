package com.example.pixel_project2.message.service;

import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.dto.ChatMessageResponse;
import com.example.pixel_project2.message.dto.CreateConversationRequest;
import com.example.pixel_project2.message.dto.MessageConversationResponse;
import com.example.pixel_project2.message.dto.MessagePolicyResponse;
import com.example.pixel_project2.message.dto.MessageProcessResponse;
import com.example.pixel_project2.message.dto.MessageReactionUpdateResponse;
import com.example.pixel_project2.message.dto.MessageReadReceiptResponse;
import com.example.pixel_project2.message.dto.SaveMessageProcessesRequest;
import com.example.pixel_project2.message.dto.SendMessageRequest;
import com.example.pixel_project2.message.dto.ToggleMessageReactionRequest;

import java.util.List;
import java.util.Set;

public interface MessageService {
    MessagePolicyResponse getMessagePolicy();

    List<MessageConversationResponse> getConversations(AuthenticatedUser currentUser);

    MessageConversationResponse createConversation(AuthenticatedUser currentUser, CreateConversationRequest request);

    List<ChatMessageResponse> getMessages(AuthenticatedUser currentUser, Long conversationId);

    ChatMessageResponse sendMessage(AuthenticatedUser currentUser, Long conversationId, SendMessageRequest request);

    MessageReadReceiptResponse markConversationRead(AuthenticatedUser currentUser, Long conversationId);

    MessageReactionUpdateResponse toggleReaction(
            AuthenticatedUser currentUser,
            Long conversationId,
            Long messageId,
            ToggleMessageReactionRequest request
    );

    List<MessageProcessResponse> getProcesses(AuthenticatedUser currentUser, Long conversationId);

    List<MessageProcessResponse> saveProcesses(
            AuthenticatedUser currentUser,
            Long conversationId,
            SaveMessageProcessesRequest request
    );

    void deleteConversation(AuthenticatedUser currentUser, Long conversationId);

    boolean canAccessConversation(AuthenticatedUser currentUser, Long conversationId);

    Set<Long> getConversationParticipantIds(Long conversationId);
}
