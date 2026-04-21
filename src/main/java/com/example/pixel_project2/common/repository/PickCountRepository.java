package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.PickCount;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface PickCountRepository extends JpaRepository<PickCount, Long> {
    @Modifying
    @Query("delete from PickCount p where p.post_id.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
