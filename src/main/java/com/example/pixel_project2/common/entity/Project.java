package com.example.pixel_project2.common.entity;

import com.example.pixel_project2.common.entity.enums.ExperienceLevel;
import com.example.pixel_project2.common.entity.enums.JobState;
import com.example.pixel_project2.common.entity.enums.ProjectState;
import com.example.pixel_project2.matching.controller.StringListConverter;
import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Project {
    @Id
    @Column(name = "post_id")
    private Long post_id;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "post_id")
    private Post post;

    @Column(columnDefinition = "CLOB")
    private String overview;

    @Column(name = "full_description", columnDefinition = "CLOB")
    private String fullDescription;

    @Column(name = "deadline")
    private LocalDate deadline;

    @Lob // 데이터베이스의 큰 텍스트(CLOB) 타입과 매핑
    @Column(name = "QUALIFICATIONS", columnDefinition = "CLOB") // Oracle 등에서 확실하게 CLOB으로 지정
    @Convert(converter = StringListConverter.class) // 아래에서 만들 변환기 장착!
    private List<String> qualifications = new ArrayList<>();

    @Lob // 데이터베이스의 큰 텍스트(CLOB) 타입과 매핑
    @Column(name = "RESPONSIBILITIES", columnDefinition = "CLOB") // Oracle 등에서 확실하게 CLOB으로 지정
    @Convert(converter = StringListConverter.class) // 아래에서 만들 변환기 장착!
    private List<String> responsibilities = new ArrayList<>();

    private Integer budget;

    @Enumerated(EnumType.STRING)
    @Column(name = "project_state")
    private ProjectState projectState; // 모집중, 마감

    @Enumerated(EnumType.STRING)
    @Column(name = "job_state")
    private JobState jobState; // 단기, 중기, 장기

    @Enumerated(EnumType.STRING)
    @Column(name = "experience_level")
    private ExperienceLevel experienceLevel; // 신입, 3년차, 시니어
}
