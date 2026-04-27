package com.example.pixel_project2.common.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "feeds")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Feed {
    @Id
    @Column(name = "post_id")
    private Long post_id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(columnDefinition = "CLOB")
    private String description;

    @Column(name = "portfolio_url", length = 200)
    private String portfolioUrl;

    @Column(name = "tags", length = 500)
    private String tags;
}
