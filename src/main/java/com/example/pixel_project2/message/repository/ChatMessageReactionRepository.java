package com.example.pixel_project2.message.repository;

import com.example.pixel_project2.message.entity.ChatMessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatMessageReactionRepository extends JpaRepository<ChatMessageReaction, Long> {
    Optional<ChatMessageReaction> findByChatMessageIdAndUserIdAndEmoji(Long messageId, Long userId, String emoji);

    List<ChatMessageReaction> findAllByChatMessageIdAndUserId(Long messageId, Long userId);

    @Query("select r from ChatMessageReaction r " +
            "join fetch r.user u " +
            "where r.chatMessage.id in :messageIds " +
            "order by r.id asc")
    List<ChatMessageReaction> findAllByMessageIds(@Param("messageIds") List<Long> messageIds);
}
