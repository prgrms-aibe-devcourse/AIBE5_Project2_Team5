package com.example.pixel_project2.notification.repository;

import com.example.pixel_project2.common.entity.Notification;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    
    // 특정 사용자가 받은 알림 목록 조회
    Page<Notification> findByReceiverIdOrderByCreatedAtDesc(Long receiverId, Pageable pageable);
    
    // 안 읽은 알림 개수 조회
    long countByReceiverIdAndIsReadFalse(Long receiverId);
    
    // 특정 알림 읽음 처리
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.id = :id AND n.receiver.id = :receiverId")
    void markAsRead(@Param("id") Long id, @Param("receiverId") Long receiverId);

    // 사용자의 모든 알림 읽음 처리
    @Modifying
    @Query("UPDATE Notification n SET n.isRead = true WHERE n.receiver.id = :receiverId AND n.isRead = false")
    void markAllAsRead(@Param("receiverId") Long receiverId);

    @Modifying
    @Query("delete from Notification n where n.referenceId = :referenceId and n.type = :type")
    void deleteByReferenceIdAndType(@Param("referenceId") Long referenceId, @Param("type") com.example.pixel_project2.common.entity.enums.NotificationType type);
}
