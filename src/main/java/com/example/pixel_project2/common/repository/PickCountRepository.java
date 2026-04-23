package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.PickCount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;

public interface PickCountRepository extends JpaRepository<PickCount, Long> {
    @Query("select p from PickCount p where p.user_id.id = :userId and p.post_id.id = :postId")
    Optional<PickCount> findByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    @Query("select count(p) > 0 from PickCount p where p.user_id.id = :userId and p.post_id.id = :postId")
    boolean existsByUserIdAndPostId(@Param("userId") Long userId, @Param("postId") Long postId);

    @Modifying
    @Query("delete from PickCount p where p.post_id.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
