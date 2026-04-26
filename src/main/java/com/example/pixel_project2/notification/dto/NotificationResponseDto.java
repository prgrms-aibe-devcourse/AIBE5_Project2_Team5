package com.example.pixel_project2.notification.dto;

import com.example.pixel_project2.common.entity.Notification;
import com.example.pixel_project2.common.entity.enums.NotificationType;
import lombok.Builder;
import lombok.Getter;

import java.time.LocalDateTime;

@Getter
@Builder
public class NotificationResponseDto {
    private Long id;
    private NotificationType type;
    private String message;
    private Long referenceId;
    private Boolean isRead;
    private LocalDateTime createdAt;
    private String senderNickname;
    private String senderProfileImage;

    public static NotificationResponseDto from(Notification notification) {
        return NotificationResponseDto.builder()
                .id(notification.getId())
                .type(notification.getType())
                .message(notification.getMessage())
                .referenceId(notification.getReferenceId())
                .isRead(notification.getIsRead())
                .createdAt(notification.getCreatedAt())
                .senderNickname(notification.getSender() != null ? notification.getSender().getNickname() : null)
                .senderProfileImage(notification.getSender() != null ? notification.getSender().getProfileImage() : null)
                .build();
    }
}
