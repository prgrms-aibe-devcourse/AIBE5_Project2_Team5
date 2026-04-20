package com.example.pixel_project2.common.entity;

import com.example.pixel_project2.common.entity.enums.WorkStatus;
import com.example.pixel_project2.common.entity.enums.WorkType;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "designers")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class Designer {
    @Id
    @Column(name = "user_id")
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    @Column(length = 50)
    private String job;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    private Float rating;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_status")
    private WorkStatus workStatus;

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type")
    private WorkType workType;
}
