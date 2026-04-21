package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    long countByPost_Id(Long postId);
}
