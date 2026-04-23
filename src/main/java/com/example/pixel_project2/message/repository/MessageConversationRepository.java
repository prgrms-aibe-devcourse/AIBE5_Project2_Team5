package com.example.pixel_project2.message.repository;

import com.example.pixel_project2.message.entity.MessageConversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageConversationRepository extends JpaRepository<MessageConversation, Long> {
    @Query("select c from MessageConversation c " +
            "join fetch c.userOne u1 " +
            "left join fetch u1.designer d1 " +
            "join fetch c.userTwo u2 " +
            "left join fetch u2.designer d2 " +
            "where c.userOne.id = :userId or c.userTwo.id = :userId " +
            "order by coalesce(c.lastMessageAt, c.createdAt) desc, c.id desc")
    List<MessageConversation> findAllByParticipant(@Param("userId") Long userId);

    @Query("select c from MessageConversation c " +
            "join fetch c.userOne u1 " +
            "left join fetch u1.designer d1 " +
            "join fetch c.userTwo u2 " +
            "left join fetch u2.designer d2 " +
            "where c.id = :conversationId")
    Optional<MessageConversation> findByIdWithParticipants(@Param("conversationId") Long conversationId);

    @Query("select c from MessageConversation c " +
            "where c.userOne.id = :userOneId and c.userTwo.id = :userTwoId")
    Optional<MessageConversation> findByUserPair(
            @Param("userOneId") Long userOneId,
            @Param("userTwoId") Long userTwoId
    );
}
