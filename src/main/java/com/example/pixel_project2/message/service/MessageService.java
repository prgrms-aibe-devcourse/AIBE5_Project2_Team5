package com.example.pixel_project2.message.service;

import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.dto.ChatMessageResponse;
import com.example.pixel_project2.message.dto.CreateConversationRequest;
import com.example.pixel_project2.message.dto.MessageConversationResponse;
import com.example.pixel_project2.message.dto.MessagePolicyResponse;
import com.example.pixel_project2.message.dto.SendMessageRequest;

import java.util.List;

public interface MessageService {
    MessagePolicyResponse getMessagePolicy();

    List<MessageConversationResponse> getConversations(AuthenticatedUser currentUser);

    MessageConversationResponse createConversation(AuthenticatedUser currentUser, CreateConversationRequest request);

    List<ChatMessageResponse> getMessages(AuthenticatedUser currentUser, Long conversationId);

    ChatMessageResponse sendMessage(AuthenticatedUser currentUser, Long conversationId, SendMessageRequest request);

    boolean canAccessConversation(AuthenticatedUser currentUser, Long conversationId);
}
