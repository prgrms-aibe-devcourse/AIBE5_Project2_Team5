package com.example.pixel_project2.message.service;

import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.dto.ChatMessageResponse;
import com.example.pixel_project2.message.dto.CreateConversationRequest;
import com.example.pixel_project2.message.dto.CreateMessageReviewRequest;
import com.example.pixel_project2.message.dto.MessageConversationResponse;
import com.example.pixel_project2.message.dto.MessagePolicyResponse;
import com.example.pixel_project2.message.dto.MessageProcessResponse;
import com.example.pixel_project2.message.dto.MessageReadReceiptResponse;
import com.example.pixel_project2.message.dto.MessageUserResponse;
import com.example.pixel_project2.message.dto.SaveMessageProcessesRequest;
import com.example.pixel_project2.message.dto.SendMessageRequest;
import com.example.pixel_project2.message.dto.UpdateMessageProcessConfirmationRequest;
import com.example.pixel_project2.message.dto.UpdateMessageProcessTaskRequest;
import com.example.pixel_project2.profile.dto.ProfileReviewResponse;

import java.util.List;

public interface MessageService {
    MessagePolicyResponse getMessagePolicy();

    List<MessageUserResponse> getMessageUsers(AuthenticatedUser currentUser);

    List<MessageConversationResponse> getConversations(AuthenticatedUser currentUser);

    MessageConversationResponse createConversation(AuthenticatedUser currentUser, CreateConversationRequest request);

    List<ChatMessageResponse> getMessages(AuthenticatedUser currentUser, Long conversationId);

    ChatMessageResponse sendMessage(AuthenticatedUser currentUser, Long conversationId, SendMessageRequest request);

    MessageReadReceiptResponse markConversationRead(AuthenticatedUser currentUser, Long conversationId);

    List<MessageProcessResponse> getProcesses(AuthenticatedUser currentUser, Long conversationId);

    List<MessageProcessResponse> saveProcesses(
            AuthenticatedUser currentUser,
            Long conversationId,
            SaveMessageProcessesRequest request
    );

    MessageProcessResponse updateProcessTask(
            AuthenticatedUser currentUser,
            Long conversationId,
            Long processId,
            Long taskId,
            UpdateMessageProcessTaskRequest request
    );

    MessageProcessResponse updateProcessConfirmation(
            AuthenticatedUser currentUser,
            Long conversationId,
            Long processId,
            String role,
            UpdateMessageProcessConfirmationRequest request
    );

    ProfileReviewResponse createConversationReview(
            AuthenticatedUser currentUser,
            Long conversationId,
            CreateMessageReviewRequest request
    );

    boolean canAccessConversation(AuthenticatedUser currentUser, Long conversationId);
}
