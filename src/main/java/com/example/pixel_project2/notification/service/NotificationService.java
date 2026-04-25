package com.example.pixel_project2.notification.service;

import com.example.pixel_project2.common.entity.enums.NotificationType;
import com.example.pixel_project2.notification.dto.NotificationResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface NotificationService {
    // 알림 생성 (다른 서비스에서 호출)
    void createNotification(Long receiverId, Long senderId, NotificationType type, Long referenceId, String message);
    
    // 사용자 알림 목록 조회
    Page<NotificationResponseDto> getNotifications(Long userId, Pageable pageable);
    
    // 안 읽은 알림 개수 조회
    long getUnreadCount(Long userId);
    
    // 특정 알림 읽음 처리
    void markAsRead(Long notificationId, Long userId);
    
    // 모든 알림 읽음 처리
    void markAllAsRead(Long userId);
}
