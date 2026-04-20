package com.example.pixel_project2.common.entity;

import com.example.pixel_project2.common.entity.enums.Provider;
import com.example.pixel_project2.common.entity.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User extends BaseTimeEntity {
    @Id
    @SequenceGenerator(
            name = "user_seq_generator",
            sequenceName = "USER_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq_generator")
    private Long id;

    @Column(nullable = false, length = 30, unique = true)
    private String loginId;

    @Column(nullable = false)
    private String password;

    @Column(nullable = false, length = 30)
    private String name;

    @Column(nullable = false, length = 10)
    private String nickname;

    private String profileImage;

    @Enumerated(EnumType.STRING)
    private UserRole role;

    @Builder.Default
    private Integer followCount = 0;

    private String url;

    @Enumerated(EnumType.STRING)
    private Provider provider;

    @Column(length = 100)
    private String providerId;
}
