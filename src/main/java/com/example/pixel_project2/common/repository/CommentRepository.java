package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    @Query("select count(c) from Comment c where c.post_id.id = :postId")
    long countByPostId(@Param("postId") Long postId);

    @Modifying
    @Query("delete from Comment c where c.post_id.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
