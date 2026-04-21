package com.example.pixel_project2.common.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "follows")
@AttributeOverride(name = "createdAt", column = @Column(name = "created_follow", nullable = false, updatable = false))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Follow extends BaseTimeEntity {
    @Id
    @SequenceGenerator(
            name = "Follow_SEQ_generator",
            sequenceName = "FOLLOW_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "Follow_SEQ_generator")
    @Column(name = "follow_id")
    private Long follow_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "follower_id", nullable = false)
    private User follower; // 팔로우하는 쪽 (클라이언트)

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "following_id", nullable = false)
    private User following; // 팔로우 당하는 사람 (디자이너)


}
