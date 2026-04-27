package com.example.pixel_project2.notification.service;

import com.example.pixel_project2.common.entity.Notification;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.NotificationType;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.notification.dto.NotificationResponseDto;
import com.example.pixel_project2.notification.repository.NotificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class NotificationServiceImpl implements NotificationService {

    private final NotificationRepository notificationRepository;
    private final UserRepository userRepository;
    private final com.example.pixel_project2.message.repository.ChatMessageRepository chatMessageRepository;

    @Override
    @Transactional
    public void createNotification(Long receiverId, Long senderId, NotificationType type, Long referenceId, String message) {
        // 자기 자신에게는 알림을 보내지 않음
        if (receiverId.equals(senderId)) {
            return;
        }

        User receiver = userRepository.findById(receiverId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + receiverId));
        
        User sender = null;
        if (senderId != null) {
            sender = userRepository.findById(senderId).orElse(null);
        }

        Notification notification = Notification.builder()
                .receiver(receiver)
                .sender(sender)
                .type(type)
                .referenceId(referenceId)
                .message(message)
                .isRead(false)
                .build();

        notificationRepository.save(notification);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<NotificationResponseDto> getNotifications(Long userId, Pageable pageable) {
        Page<Notification> notifications = notificationRepository.findByReceiverIdOrderByCreatedAtDesc(userId, pageable);
        return notifications.map(n -> {
            NotificationResponseDto dto = NotificationResponseDto.from(n);
            
            // 기존에 메시지 ID로 저장된 알림들을 대화방 ID로 변환 (하위 호환성)
            if (n.getType() == NotificationType.MESSAGE && n.getReferenceId() != null) {
                // 이 ID가 실제로 대화방 ID인지 메시지 ID인지 확인이 필요할 수 있으나,
                // 메시지 ID인 경우 대화방 ID로 교체해줌
                chatMessageRepository.findById(n.getReferenceId()).ifPresent(messageEntity -> {
                    dto.setReferenceId(messageEntity.getConversation().getId());
                });
            }
            
            return dto;
        });
    }

    @Override
    @Transactional(readOnly = true)
    public long getUnreadCount(Long userId) {
        return notificationRepository.countByReceiverIdAndIsReadFalse(userId);
    }

    @Override
    @Transactional
    public void markAsRead(Long notificationId, Long userId) {
        notificationRepository.markAsRead(notificationId, userId);
    }

    @Override
    @Transactional
    public void markAllAsRead(Long userId) {
        notificationRepository.markAllAsRead(userId);
    }
}
