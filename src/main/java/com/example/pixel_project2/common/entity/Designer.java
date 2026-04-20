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
    private User user; // user Table이 부모 Entity라는 증거

    @Column(length = 50)
    private String job; // 직업

    @Column(columnDefinition = "CLOB")
    private String introduction; // 자기소개

    private Float rating; // 별점

    @Enumerated(EnumType.STRING)
    @Column(name = "work_status")
    private WorkStatus workStatus; // 작업 상태

    @Enumerated(EnumType.STRING)
    @Column(name = "work_type")
    private WorkType workType;
}
