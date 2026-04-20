package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

//유저 조회 로그인 id 중복 확인 닉네임 중복 확인
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    boolean existsByNickname(String nickname);
}
