package com.example.pixel_project2.message.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.message.dto.MessagePolicyResponse;
import com.example.pixel_project2.message.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/messages")
@RequiredArgsConstructor
public class MessageController {
    private final MessageService messageService;

    @GetMapping
    public ApiResponse<MessagePolicyResponse> getMessages() {
        return ApiResponse.ok("메시지 정책을 조회했습니다.", messageService.getMessagePolicy());
    }
}
