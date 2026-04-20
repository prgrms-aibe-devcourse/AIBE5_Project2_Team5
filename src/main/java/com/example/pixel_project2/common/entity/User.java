package com.example.pixel_project2.common.entity;

import com.example.pixel_project2.common.entity.enums.Provider;
import com.example.pixel_project2.common.entity.enums.UserRole;
import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "users")
@AttributeOverride(name = "createdAt", column = @Column(name = "created_user", nullable = false, updatable = false))
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@AllArgsConstructor
@Builder
public class User extends BaseTimeEntity {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "user_id")
    private Long id;

    @Column(name = "login_id", nullable = false, length = 30, unique = true)
    private String loginId;

    @Column(nullable = false)
    private String password;

    @Column(name = "nickname", nullable = false, length = 10)
    private String nickname;

    @Column(name = "profile_image", length = 255)
    private String profileImage;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private UserRole role;

    @Builder.Default
    @Column(name = "follow_count")
    private Integer followCount = 0;

    @Column(length = 255)
    private String url;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Provider provider;
}
