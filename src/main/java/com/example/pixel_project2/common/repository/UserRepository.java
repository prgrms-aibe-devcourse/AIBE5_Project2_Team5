package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Provider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

//유저 조회 로그인 id 중복 확인 닉네임 중복 확인
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByloginId(String email);

    Optional<User> findByProviderAndProviderId(Provider provider, String providerId);

    boolean existsByloginId(String email);

    @Query("select count(u.id) from User u where u.loginId = :loginId")
    long countByLoginId(@Param("loginId") String loginId);

    @Query("select count(u.id) from User u where u.nickname = :nickname")
    long countByNickname(@Param("nickname") String nickname);
}
