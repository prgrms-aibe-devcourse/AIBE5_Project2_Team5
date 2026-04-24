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
    private Long userId;

    @OneToOne(fetch = FetchType.LAZY)
    @MapsId
    @JoinColumn(name = "user_id")
    private User user;

    private String job;

    @Column(columnDefinition = "TEXT")
    private String introduction;

    private String location;

    @Enumerated(EnumType.STRING)
    private WorkStatus workStatus;

    @Enumerated(EnumType.STRING)
    private WorkType workType;
}
