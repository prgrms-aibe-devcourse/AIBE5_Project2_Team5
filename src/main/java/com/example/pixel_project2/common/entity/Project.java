package com.example.pixel_project2.common.entity;

import com.example.pixel_project2.common.entity.enums.ExperienceLevel;
import com.example.pixel_project2.common.entity.enums.JobState;
import com.example.pixel_project2.common.entity.enums.ProjectState;
import jakarta.persistence.*;
import lombok.*;

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

    @Column(columnDefinition = "CLOB")
    private String responsibilities;

    @Column(columnDefinition = "CLOB")
    private String qualifications;

    private Integer budget;

    @Enumerated(EnumType.STRING)
    @Column(name = "project_state")
    private ProjectState projectState;

    @Enumerated(EnumType.STRING)
    @Column(name = "job_state")
    private JobState jobState;

    @Enumerated(EnumType.STRING)
    @Column(name = "experience_level")
    private ExperienceLevel experienceLevel;
}
