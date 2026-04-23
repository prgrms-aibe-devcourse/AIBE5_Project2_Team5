package com.example.pixel_project2.message.repository;

import com.example.pixel_project2.message.entity.MessageReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageReviewRepository extends JpaRepository<MessageReview, Long> {
    @Query("select r from MessageReview r " +
            "join fetch r.conversation c " +
            "join fetch r.reviewer reviewer " +
            "join fetch r.reviewee reviewee " +
            "where r.reviewee.id = :revieweeId " +
            "order by r.createdAt desc, r.id desc")
    List<MessageReview> findAllByRevieweeIdWithUsers(@Param("revieweeId") Long revieweeId);

    @Query("select r from MessageReview r " +
            "join fetch r.conversation c " +
            "join fetch r.reviewer reviewer " +
            "join fetch r.reviewee reviewee " +
            "where r.conversation.id = :conversationId and r.reviewer.id = :reviewerId")
    Optional<MessageReview> findByConversationIdAndReviewerId(
            @Param("conversationId") Long conversationId,
            @Param("reviewerId") Long reviewerId
    );
}
