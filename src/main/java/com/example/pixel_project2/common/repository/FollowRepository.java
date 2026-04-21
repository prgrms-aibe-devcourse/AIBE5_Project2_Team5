package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    @Query("select count(f) from Follow f where f.following.id = :userId")
    long countFollowers(@Param("userId") Long userId);

    @Query("select count(f) from Follow f where f.follower.id = :userId")
    long countFollowing(@Param("userId") Long userId);
}
