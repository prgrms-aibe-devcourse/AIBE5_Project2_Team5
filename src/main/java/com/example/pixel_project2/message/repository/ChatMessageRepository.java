package com.example.pixel_project2.message.repository;

import com.example.pixel_project2.message.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("select m from ChatMessage m " +
            "join fetch m.sender s " +
            "where m.conversation.id = :conversationId " +
            "order by m.createdAt asc, m.id asc")
    List<ChatMessage> findAllByConversationId(@Param("conversationId") Long conversationId);

    @Query("select m from ChatMessage m " +
            "join fetch m.sender s " +
            "where m.conversation.id = :conversationId " +
            "and m.sender.id <> :readerUserId " +
            "and m.readAt is null " +
            "order by m.createdAt asc, m.id asc")
    List<ChatMessage> findUnreadByConversationIdForReader(
            @Param("conversationId") Long conversationId,
            @Param("readerUserId") Long readerUserId
    );

    @Query("select count(m) from ChatMessage m " +
            "where m.conversation.id = :conversationId " +
            "and m.sender.id <> :readerUserId " +
            "and m.readAt is null")
    int countUnreadByConversationIdForReader(
            @Param("conversationId") Long conversationId,
            @Param("readerUserId") Long readerUserId
    );
}
