package com.example.pixel_project2.common.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "job_skills")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder

// 매칭 페이지에서 클라이언트가 기술스택을 작성할 때, 분류
public class JobSkill {
    @Id
    @SequenceGenerator(
            name = "JobSkill_SEQ_generator",
            sequenceName = "JOB_SKILL_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "JobSkill_SEQ_generator")
    @Column(name = "jobskill_id")
    private Long jobskill_id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "post_id", nullable = false)
    private Project project;

    // 요구하는 기술스택의 이름
    @Column(name = "skill_name", nullable = false, length = 100)
    private String skillName;
}
