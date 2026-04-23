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

@Entity
@Table(
        name = "message_reactions",
        uniqueConstraints = {
                @UniqueConstraint(
                        name = "uk_msg_react_msg_user_emoji",
                        columnNames = {"message_id", "user_id", "emoji_code"}
                )
        }
)
@AttributeOverride(
        name = "createdAt",
        column = @Column(name = "created_message_reaction", nullable = false, updatable = false)
)
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class MessageReaction extends BaseTimeEntity {
    @Id
    @SequenceGenerator(
            name = "message_reaction_seq_generator",
            sequenceName = "MESSAGE_REACTION_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "message_reaction_seq_generator")
    @Column(name = "reaction_id")
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "message_id", nullable = false)
    private ChatMessage message;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "emoji_code", nullable = false, length = 120)
    private String emojiCode;
}
