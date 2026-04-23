package com.example.pixel_project2.common.entity;

import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.entity.enums.Provider;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotBlank;
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
    @SequenceGenerator(
            name = "user_seq_generator",
            sequenceName = "USER_SEQ",
            allocationSize = 1
    )
    @GeneratedValue(strategy = GenerationType.SEQUENCE, generator = "user_seq_generator")
    private Long id;

    @Column(name = "login_id", nullable = false, length = 30, unique = true)
    private String loginId;

    @Column(name = "password", nullable = false)
    private String password;

    @Column(name = "nickname", nullable = false, length = 10)
    private String nickname;

    @Column(name = "name")
    private String name;

    @Column(name = "profile_image", length = 255)
    private String profileImage;

    @Enumerated(EnumType.STRING)
    @Column(name = "role", nullable = false)
    private UserRole role;

    @Builder.Default
    @Column(name = "follow_count")
    private Integer followCount = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Provider provider;

    @Column(length = 100)
    private String providerId;

    @Column(name = "url", length = 255)
    private String url;

    @Column(name = "location", length = 100)
    private String location;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private Designer designer;

    @OneToOne(mappedBy = "user", fetch = FetchType.LAZY)
    private Client client;
}
