package com.example.pixel_project2.common.entity;

import jakarta.persistence.*;
import lombok.*;


@Entity
@Table(name = "pick_count", uniqueConstraints = {
        @UniqueConstraint(columnNames = {"user_id", "post_id"})
})
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class PickCount {
    @Id
    @SequenceGenerator(
            name = "PickCount_SEQ_generator",
            sequenceName = "PICK_COUNT_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "PickCount_SEQ_generator")
    @Column(name = "pick_count_id")
    private Long pickCountId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

}
