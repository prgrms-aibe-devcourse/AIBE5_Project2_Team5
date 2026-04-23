package com.example.pixel_project2.message.repository;

import com.example.pixel_project2.message.entity.MessageReaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface MessageReactionRepository extends JpaRepository<MessageReaction, Long> {
    Optional<MessageReaction> findByMessageIdAndUserIdAndEmojiCode(
            Long messageId,
            Long userId,
            String emojiCode
    );

    @Query("select r from MessageReaction r " +
            "join fetch r.user u " +
            "join fetch r.message m " +
            "where m.id in :messageIds " +
            "order by r.createdAt asc, r.id asc")
    List<MessageReaction> findAllByMessageIds(@Param("messageIds") Collection<Long> messageIds);

    @Modifying(clearAutomatically = true, flushAutomatically = true)
    @Query("delete from MessageReaction r where r.message.id in (" +
            "select m.id from ChatMessage m where m.conversation.id = :conversationId)")
    void deleteAllByConversationId(@Param("conversationId") Long conversationId);
}
