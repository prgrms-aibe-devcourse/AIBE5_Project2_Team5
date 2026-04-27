package com.example.pixel_project2.common.entity;

import com.example.pixel_project2.common.entity.enums.ExperienceLevel;
import com.example.pixel_project2.common.entity.enums.JobState;
import com.example.pixel_project2.common.entity.enums.ProjectState;
import com.example.pixel_project2.matching.controller.StringListConverter;
import jakarta.persistence.Column;
import jakarta.persistence.Convert;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.FetchType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Lob;
import jakarta.persistence.MapsId;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

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

    @Lob
    @Column(name = "QUALIFICATIONS", columnDefinition = "CLOB")
    @Convert(converter = StringListConverter.class)
    @Builder.Default
    private List<String> qualifications = new ArrayList<>();

    @Lob
    @Column(name = "RESPONSIBILITIES", columnDefinition = "CLOB")
    @Convert(converter = StringListConverter.class)
    @Builder.Default
    private List<String> responsibilities = new ArrayList<>();

    @Lob
    @Column(name = "CATEGORIES", columnDefinition = "CLOB")
    @Convert(converter = StringListConverter.class)
    @Builder.Default
    private List<String> categories = new ArrayList<>();

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
