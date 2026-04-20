package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

//게시글 이미지 저장, 피드 이미지 목록 조회
public interface PostImageRepository extends JpaRepository<PostImage, Long> {
    List<PostImage> findByPostIdOrderBySortOrderAsc(Long postId);
}
