package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.Follow;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface FollowRepository extends JpaRepository<Follow, Long> {
    @Query("select count(f) from Follow f where f.following.id = :userId")
    long countFollowers(@Param("userId") Long userId);

    @Query("select count(f) from Follow f where f.follower.id = :userId")
    long countFollowing(@Param("userId") Long userId);

    @Query("select count(f) from Follow f where f.follower.id = :followerId and f.following.id = :followingId")
    long countRelation(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    @Query("select f from Follow f where f.follower.id = :followerId and f.following.id = :followingId")
    Optional<Follow> findRelation(@Param("followerId") Long followerId, @Param("followingId") Long followingId);

    @Query("select f from Follow f join fetch f.following u where f.follower.id = :userId order by f.createdAt desc")
    List<Follow> findFollowingByFollowerId(@Param("userId") Long userId);

    @Query("select f.following.id from Follow f where f.follower.id = :userId")
    List<Long> findFollowingUserIds(@Param("userId") Long userId);
}
