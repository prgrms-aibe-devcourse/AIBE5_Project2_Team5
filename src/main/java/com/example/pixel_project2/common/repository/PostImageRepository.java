package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.PostImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

//게시글 이미지 저장, 피드 이미지 목록 조회
public interface PostImageRepository extends JpaRepository<PostImage, Long> {
    List<PostImage> findByPost_IdOrderBySortOrderAsc(Long postId);

    @Modifying
    @Query("delete from PostImage i where i.post.id = :postId")
    void deleteByPostId(@Param("postId") Long postId);
}
