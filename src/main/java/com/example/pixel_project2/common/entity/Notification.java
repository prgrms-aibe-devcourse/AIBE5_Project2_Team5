package com.example.pixel_project2.common.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "notifications")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Notification extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "receiver_id")
    private User receiver;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Builder.Default
    private Boolean isRead = false;

    private String notificationType; // POST, MESSAGE 등

    private Long targetId; // 이동할 대상의 ID
}
