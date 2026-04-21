package com.example.pixel_project2.common.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "comments")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Comment {
    @Id
    @SequenceGenerator(
            name = "Comment_SEQ_generator",
            sequenceName = "COMMENT_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "Comment_SEQ_generator")
    @Column(name = "comment_id")
    private Long comment_Id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post_id;

    @Builder.Default
    @Column(columnDefinition = "CLOB")
    private String description = "";

}
