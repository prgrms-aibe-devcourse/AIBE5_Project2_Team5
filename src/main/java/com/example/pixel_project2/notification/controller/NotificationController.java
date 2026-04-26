package com.example.pixel_project2.notification.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.notification.dto.NotificationResponseDto;
import com.example.pixel_project2.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public ApiResponse<Page<NotificationResponseDto>> getNotifications(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size
    ) {
        Pageable pageable = PageRequest.of(page, size);
        return ApiResponse.ok("알림 목록을 불러왔습니다.", notificationService.getNotifications(currentUser.id(), pageable));
    }

    @GetMapping("/unread-count")
    public ApiResponse<Long> getUnreadCount(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.ok("안 읽은 알림 개수를 불러왔습니다.", notificationService.getUnreadCount(currentUser.id()));
    }

    @PutMapping("/{notificationId}/read")
    public ApiResponse<Void> markAsRead(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long notificationId
    ) {
        notificationService.markAsRead(notificationId, currentUser.id());
        return ApiResponse.ok("알림을 읽음 처리했습니다.", null);
    }

    @PutMapping("/read-all")
    public ApiResponse<Void> markAllAsRead(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        notificationService.markAllAsRead(currentUser.id());
        return ApiResponse.ok("모든 알림을 읽음 처리했습니다.", null);
    }
}
