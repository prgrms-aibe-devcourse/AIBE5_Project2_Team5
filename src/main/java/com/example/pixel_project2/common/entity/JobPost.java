package com.example.pixel_project2.common.entity;

import com.example.pixel_project2.common.entity.enums.JobPostState;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "job_posts")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class JobPost {
    @Id
    private Long postId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "post_id")
    private Post post;

    private Integer budget;

    @Enumerated(EnumType.STRING)
    private JobPostState state;

    private LocalDateTime deadline;
}
