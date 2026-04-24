package com.example.pixel_project2.message.entity;

import com.example.pixel_project2.common.entity.User;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Entity
@Table(name = "message_reviews")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MessageReview {
    @Id
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "message_review_seq_gen")
    @SequenceGenerator(
            name = "message_review_seq_gen",
            sequenceName = "message_review_seq",
            allocationSize = 1
    )
    @Column(name = "review_id")
    private Long reviewId;

    @Column(name = "conversation_id", nullable = false)
    private Long conversationId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reviewee_id", nullable = false)
    private User reviewee;

    @Column(name = "project_title", nullable = false, length = 200)
    private String projectTitle;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Column(name = "content", nullable = false, columnDefinition = "CLOB")
    private String content;

    @Column(name = "work_categories_json", columnDefinition = "CLOB")
    private String workCategoriesJson;

    @Column(name = "compliment_tags_json", columnDefinition = "CLOB")
    private String complimentTagsJson;

    @Column(name = "created_message_review", nullable = false)
    private LocalDateTime createdMessageReview;
}
