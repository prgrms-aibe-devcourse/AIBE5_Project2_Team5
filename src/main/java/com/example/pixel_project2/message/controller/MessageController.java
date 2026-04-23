package com.example.pixel_project2.message.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.dto.ChatMessageResponse;
import com.example.pixel_project2.message.dto.CreateConversationRequest;
import com.example.pixel_project2.message.dto.MessageConversationResponse;
import com.example.pixel_project2.message.dto.MessagePolicyResponse;
import com.example.pixel_project2.message.dto.SendMessageRequest;
import com.example.pixel_project2.message.service.MessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
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
}
