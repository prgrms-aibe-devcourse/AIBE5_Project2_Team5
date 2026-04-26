package com.example.pixel_project2.message.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.dto.ChatMessageResponse;
import com.example.pixel_project2.message.dto.CreateConversationRequest;
import com.example.pixel_project2.message.dto.MessageConversationResponse;
import com.example.pixel_project2.message.dto.MessageConversationPresenceResponse;
import com.example.pixel_project2.message.dto.MessagePolicyResponse;
import com.example.pixel_project2.message.dto.MessageAssistantSuggestionRequest;
import com.example.pixel_project2.message.dto.MessageAssistantSuggestionResponse;
import com.example.pixel_project2.message.dto.MessageProcessResponse;
import com.example.pixel_project2.message.dto.MessageReactionUpdateResponse;
import com.example.pixel_project2.message.dto.MessageReadReceiptResponse;
import com.example.pixel_project2.message.dto.MessageTypingRequest;
import com.example.pixel_project2.message.dto.SaveMessageProcessesRequest;
import com.example.pixel_project2.message.dto.SendMessageRequest;
import com.example.pixel_project2.message.dto.ToggleMessageReactionRequest;
import com.example.pixel_project2.message.service.MessageService;
import com.example.pixel_project2.message.websocket.MessageSocketHandler;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;
    private final MessageSocketHandler messageSocketHandler;

    @GetMapping
    public ApiResponse<MessagePolicyResponse> getMessages() {
        return ApiResponse.ok("Message policy loaded.", messageService.getMessagePolicy());
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

    @GetMapping("/conversations/{conversationId}/messages")
    public ApiResponse<List<ChatMessageResponse>> getConversationMessages(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId,
            @RequestParam(required = false) Long afterMessageId
    ) {
        return ApiResponse.ok(
                "Messages loaded.",
                messageService.getMessages(currentUser, conversationId, afterMessageId)
        );
    }

    @GetMapping("/conversations/{conversationId}/presence")
    public ApiResponse<MessageConversationPresenceResponse> getConversationPresence(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId
    ) {
        return ApiResponse.ok(
                "Conversation presence loaded.",
                messageService.getConversationPresence(currentUser, conversationId)
        );
    }

    @PostMapping("/conversations/{conversationId}/typing")
    public ApiResponse<MessageConversationPresenceResponse> updateConversationTyping(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId,
            @RequestBody MessageTypingRequest request
    ) {
        MessageConversationPresenceResponse response = messageService.updateConversationTyping(
                currentUser,
                conversationId,
                request
        );
        messageSocketHandler.broadcastTyping(conversationId, currentUser.id(), request.isTyping());
        return ApiResponse.ok(
                "Conversation typing updated.",
                response
        );
    }

    @PostMapping("/conversations/{conversationId}/messages")
    public ApiResponse<ChatMessageResponse> sendMessage(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId,
            @Valid @RequestBody SendMessageRequest request
    ) {
        ChatMessageResponse savedMessage = messageService.sendMessage(currentUser, conversationId, request);
        messageSocketHandler.broadcastChatMessage(savedMessage);
        return ApiResponse.ok("Message sent.", savedMessage);
    }

    @PostMapping("/conversations/{conversationId}/assistant/suggestions")
    public ApiResponse<MessageAssistantSuggestionResponse> getAssistantSuggestions(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId,
            @Valid @RequestBody MessageAssistantSuggestionRequest request
    ) {
        return ApiResponse.ok(
                "Message assistant suggestions loaded.",
                messageService.getAssistantSuggestions(currentUser, conversationId, request)
        );
    }

    @PostMapping("/conversations/{conversationId}/read")
    public ApiResponse<MessageReadReceiptResponse> markConversationRead(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId
    ) {
        MessageReadReceiptResponse readReceipt = messageService.markConversationRead(currentUser, conversationId);
        messageSocketHandler.broadcastConversationRead(readReceipt);
        return ApiResponse.ok(
                "Conversation marked as read.",
                readReceipt
        );
    }

    @PostMapping("/conversations/{conversationId}/messages/{messageId}/reactions/toggle")
    public ApiResponse<MessageReactionUpdateResponse> toggleReaction(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId,
            @PathVariable Long messageId,
            @Valid @RequestBody ToggleMessageReactionRequest request
    ) {
        MessageReactionUpdateResponse reactionUpdate = messageService.toggleReaction(
                currentUser,
                conversationId,
                messageId,
                request
        );
        messageSocketHandler.broadcastReactionUpdate(conversationId, reactionUpdate);
        return ApiResponse.ok(
                "Message reaction updated.",
                reactionUpdate
        );
    }

    @GetMapping("/conversations/{conversationId}/processes")
    public ApiResponse<List<MessageProcessResponse>> getProcesses(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId
    ) {
        return ApiResponse.ok(
                "Message processes loaded.",
                messageService.getProcesses(currentUser, conversationId)
        );
    }

    @PutMapping("/conversations/{conversationId}/processes")
    public ApiResponse<List<MessageProcessResponse>> saveProcesses(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId,
            @Valid @RequestBody SaveMessageProcessesRequest request
    ) {
        List<MessageProcessResponse> savedProcesses = messageService.saveProcesses(currentUser, conversationId, request);
        messageSocketHandler.broadcastProcessUpdate(conversationId, savedProcesses);
        return ApiResponse.ok(
                "Message processes saved.",
                savedProcesses
        );
    }

    @DeleteMapping("/conversations/{conversationId}")
    public ApiResponse<Void> deleteConversation(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long conversationId
    ) {
        messageService.deleteConversation(currentUser, conversationId);
        return ApiResponse.ok("Message conversation deleted.", null);
    }
}
