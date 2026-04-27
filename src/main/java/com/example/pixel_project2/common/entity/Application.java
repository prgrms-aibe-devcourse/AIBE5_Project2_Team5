package com.example.pixel_project2.common.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

// Project에 지원하는 양식
@Entity
@Table(name = "applications")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Application {
    @Id
    @SequenceGenerator(
            name = "Application_SEQ_generator",
            sequenceName = "APPLICATION_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "Application_SEQ_generator")
    @Column(name = "application_id")
    private Long application_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "applicant_id", nullable = false)
    private User applicant;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "poster_id", nullable = false)
    private User poster;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Post post;

    @Column(name = "cover_letter", columnDefinition = "CLOB")
    private String coverLetter; // 지원 메시지

    @Column(columnDefinition = "CLOB")
    private String summary; // 관련 경험 요약

    @Column(name = "expected_budget")
    private Integer expectedBudget; // 희망하는 착수금

    @Column(name = "portfolio_url", length = 500)
    private String portfolioUrl;

    @Column(name = "start_date")
    private LocalDateTime startDate; // 시작 가능일
}
