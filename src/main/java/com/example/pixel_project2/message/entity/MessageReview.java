package com.example.pixel_project2.message.entity;

import com.example.pixel_project2.common.entity.BaseTimeEntity;
import com.example.pixel_project2.common.entity.User;
import jakarta.persistence.AttributeOverride;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.SequenceGenerator;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(
        name = "message_reviews",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_message_review_conversation_reviewer",
                        columnNames = {"conversation_id", "reviewer_id"}
                )
        }
)
@AttributeOverride(
        name = "createdAt",
        column = @Column(name = "created_message_review", nullable = false, updatable = false)
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MessageReview extends BaseTimeEntity {
    @Id
    @SequenceGenerator(
            name = "message_review_seq_generator",
            sequenceName = "MESSAGE_REVIEW_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "message_review_seq_generator")
    @Column(name = "review_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "conversation_id", nullable = false)
    private MessageConversation conversation;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewer_id", nullable = false)
    private User reviewer;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "reviewee_id", nullable = false)
    private User reviewee;

    @Column(name = "project_title", nullable = false, length = 200)
    private String projectTitle;

    @Column(name = "rating", nullable = false)
    private Integer rating;

    @Lob
    @Column(name = "content", nullable = false)
    private String content;

    @Lob
    @Column(name = "work_categories_json")
    private String workCategoriesJson;

    @Lob
    @Column(name = "compliment_tags_json")
    private String complimentTagsJson;
}
