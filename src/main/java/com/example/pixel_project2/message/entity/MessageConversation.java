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

import java.time.LocalDateTime;

@Entity
@Table(
        name = "message_conversations",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_message_conversation_users",
                        columnNames = {"user_one_id", "user_two_id"}
                )
        }
)
@AttributeOverride(
        name = "createdAt",
        column = @Column(name = "created_message_conversation", nullable = false, updatable = false)
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MessageConversation extends BaseTimeEntity {
    @Id
    @SequenceGenerator(
            name = "message_conversation_seq_generator",
            sequenceName = "MESSAGE_CONVERSATION_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "message_conversation_seq_generator")
    @Column(name = "conversation_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_one_id", nullable = false)
    private User userOne;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_two_id", nullable = false)
    private User userTwo;

    @Column(name = "last_message_at")
    private LocalDateTime lastMessageAt;

    @Column(name = "last_message_preview", length = 500)
    private String lastMessagePreview;

    @Column(name = "user_one_last_read_message_id")
    private Long userOneLastReadMessageId;

    @Column(name = "user_two_last_read_message_id")
    private Long userTwoLastReadMessageId;

    public boolean hasParticipant(Long userId) {
        return userOne.getId().equals(userId) || userTwo.getId().equals(userId);
    }

    public User getOtherParticipant(Long userId) {
        if (userOne.getId().equals(userId)) {
            return userTwo;
        }
        if (userTwo.getId().equals(userId)) {
            return userOne;
        }
        throw new IllegalArgumentException("Conversation participant not found.");
    }

    public void updateLastMessage(String preview, LocalDateTime createdAt) {
        this.lastMessagePreview = preview;
        this.lastMessageAt = createdAt;
    }

    public void markRead(Long userId, Long messageId) {
        if (messageId == null) {
            return;
        }

        if (userOne.getId().equals(userId)) {
            userOneLastReadMessageId = maxMessageId(userOneLastReadMessageId, messageId);
            return;
        }
        if (userTwo.getId().equals(userId)) {
            userTwoLastReadMessageId = maxMessageId(userTwoLastReadMessageId, messageId);
            return;
        }

        throw new IllegalArgumentException("Conversation participant not found.");
    }

    public Long getLastReadMessageId(Long userId) {
        if (userOne.getId().equals(userId)) {
            return userOneLastReadMessageId;
        }
        if (userTwo.getId().equals(userId)) {
            return userTwoLastReadMessageId;
        }

        throw new IllegalArgumentException("Conversation participant not found.");
    }

    public Long getPartnerLastReadMessageId(Long userId) {
        if (userOne.getId().equals(userId)) {
            return userTwoLastReadMessageId;
        }
        if (userTwo.getId().equals(userId)) {
            return userOneLastReadMessageId;
        }

        throw new IllegalArgumentException("Conversation participant not found.");
    }

    private Long maxMessageId(Long currentMessageId, Long nextMessageId) {
        if (currentMessageId == null) {
            return nextMessageId;
        }
        return Math.max(currentMessageId, nextMessageId);
    }
}
