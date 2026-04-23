package com.example.pixel_project2.message.repository;

import com.example.pixel_project2.message.entity.ChatMessage;
import org.springframework.data.jpa.repository.JpaRepository;
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
}
