package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.enums.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

// 피드공고 게시글 저장, 목록 조회, 상세 조회
public interface PostRepository extends JpaRepository<Post, Long> {
    Page<Post> findByPostType(PostType postType, Pageable pageable);

    Page<Post> findByUserIdAndPostType(Long userId, PostType postType, Pageable pageable);

    long countByUserIdAndPostType(Long userId, PostType postType);

    Optional<Post> findByIdAndPostType(Long id, PostType postType);
}
