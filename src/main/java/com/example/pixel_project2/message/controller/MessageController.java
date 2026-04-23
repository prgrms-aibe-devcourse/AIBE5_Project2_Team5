package com.example.pixel_project2.message.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
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
import com.example.pixel_project2.message.service.MessageService;
import com.example.pixel_project2.profile.dto.ProfileReviewResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    @GetMapping
    public ApiResponse<MessagePolicyResponse> getMessages() {
        return ApiResponse.ok("Message policy loaded.", messageService.getMessagePolicy());
    }

    @GetMapping("/users")
    public ApiResponse<List<MessageUserResponse>> getMessageUsers(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.ok("Message users loaded.", messageService.getMessageUsers(currentUser));
    }

    @GetMapping("/conversations")
    public ApiResponse<List<MessageConversationResponse>> getConversations(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.ok("Message conversations loaded.", messageService.getConversations(currentUser));
    }

    @PostMapping("/conversations")
    public ApiResponse<MessageConversationResponse> createConversation(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody CreateConversationRequest request
    ) {
        return ApiResponse.ok("Message conversation created.", messageService.createConversation(currentUser, request));
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ApiResponse<Void> deleteConversation(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId
    ) {
        messageService.deleteConversation(currentUser, conversationId);
        return ApiResponse.ok("Message conversation deleted.", null);
    }

    @GetMapping("/conversations/{conversationId}/messages")
    public ApiResponse<List<ChatMessageResponse>> getConversationMessages(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId
    ) {
        return ApiResponse.ok("Messages loaded.", messageService.getMessages(currentUser, conversationId));
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ApiResponse<ChatMessageResponse> sendMessage(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        return ApiResponse.ok("Message sent.", messageService.sendMessage(currentUser, conversationId, request));
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ApiResponse<MessageReadReceiptResponse> markConversationRead(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId
    ) {
        return ApiResponse.ok("Conversation marked as read.", messageService.markConversationRead(currentUser, conversationId));
    }

    @GetMapping("/conversations/{conversationId}/processes")
    public ApiResponse<List<MessageProcessResponse>> getProcesses(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId
    ) {
        return ApiResponse.ok("Message processes loaded.", messageService.getProcesses(currentUser, conversationId));
    }

    @PutMapping("/conversations/{conversationId}/processes")
    public ApiResponse<List<MessageProcessResponse>> saveProcesses(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId,
            @RequestBody SaveMessageProcessesRequest request
    ) {
        return ApiResponse.ok("Message processes saved.", messageService.saveProcesses(currentUser, conversationId, request));
    }

    @PatchMapping("/conversations/{conversationId}/processes/{processId}/tasks/{taskId}")
    public ApiResponse<MessageProcessResponse> updateProcessTask(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId,
            @PathVariable Long processId,
            @PathVariable Long taskId,
            @RequestBody UpdateMessageProcessTaskRequest request
    ) {
        return ApiResponse.ok(
                "Message process task updated.",
                messageService.updateProcessTask(currentUser, conversationId, processId, taskId, request)
        );
    }

    @PatchMapping("/conversations/{conversationId}/processes/{processId}/confirmations/{role}")
    public ApiResponse<MessageProcessResponse> updateProcessConfirmation(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId,
            @PathVariable Long processId,
            @PathVariable String role,
            @RequestBody UpdateMessageProcessConfirmationRequest request
    ) {
        return ApiResponse.ok(
                "Message process confirmation updated.",
                messageService.updateProcessConfirmation(currentUser, conversationId, processId, role, request)
        );
    }

    @PostMapping("/conversations/{conversationId}/review")
    public ApiResponse<ProfileReviewResponse> createConversationReview(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId,
            @RequestBody CreateMessageReviewRequest request
    ) {
        return ApiResponse.ok(
                "Message review saved.",
                messageService.createConversationReview(currentUser, conversationId, request)
        );
    }
}
