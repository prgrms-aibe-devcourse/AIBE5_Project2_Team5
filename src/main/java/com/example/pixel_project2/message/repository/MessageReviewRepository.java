package com.example.pixel_project2.message.repository;

import com.example.pixel_project2.message.entity.MessageReview;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface MessageReviewRepository extends JpaRepository<MessageReview, Long> {
    List<MessageReview> findByRevieweeIdOrderByCreatedMessageReviewDesc(Long revieweeId);

    Optional<MessageReview> findByConversationIdAndReviewerId(Long conversationId, Long reviewerId);

    @Query("select avg(m.rating) from MessageReview m where m.reviewee.id = :revieweeId")
    Double findAverageRatingByRevieweeId(@Param("revieweeId") Long revieweeId);
}
