package com.example.pixel_project2.message.repository;

import com.example.pixel_project2.message.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("select m from ChatMessage m " +
            "join fetch m.sender s " +
            "where m.conversation.id = :conversationId " +
            "order by m.createdAt asc, m.id asc")
    List<ChatMessage> findAllByConversationId(@Param("conversationId") Long conversationId);

    @Query("select m from ChatMessage m " +
            "join fetch m.sender s " +
            "where m.conversation.id = :conversationId " +
            "and m.sender.id = :senderId " +
            "and m.clientId = :clientId")
    Optional<ChatMessage> findByConversationIdAndSenderIdAndClientId(
            @Param("conversationId") Long conversationId,
            @Param("senderId") Long senderId,
            @Param("clientId") String clientId
    );

    @Query("select m from ChatMessage m " +
            "join fetch m.conversation c " +
            "join fetch m.sender s " +
            "where m.id = :messageId")
    Optional<ChatMessage> findByIdWithConversationAndSender(@Param("messageId") Long messageId);

    @Query("select count(m) from ChatMessage m " +
            "where m.conversation.id = :conversationId " +
            "and m.sender.id <> :currentUserId " +
            "and (:lastReadMessageId is null or m.id > :lastReadMessageId)")
    int countUnreadMessages(
            @Param("conversationId") Long conversationId,
            @Param("currentUserId") Long currentUserId,
            @Param("lastReadMessageId") Long lastReadMessageId
    );

    @Modifying
    @Query("delete from ChatMessage m where m.conversation.id = :conversationId")
    void deleteAllByConversationId(@Param("conversationId") Long conversationId);
}
