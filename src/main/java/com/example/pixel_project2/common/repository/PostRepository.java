package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.common.entity.enums.PostType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

// 피드공고 게시글 저장, 목록 조회, 상세 조회
public interface PostRepository extends JpaRepository<Post, Long> {
    // 피드 목록 조회 최적화 (User, Designer, Feed, Images 한꺼번에 가져오기)
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM Post p " +
            "JOIN FETCH p.user u " +
            "LEFT JOIN FETCH u.designer d " +
            "LEFT JOIN FETCH p.feed f " +
            "LEFT JOIN FETCH p.images i " +
            "WHERE p.postType = :postType " +
            "ORDER BY p.id DESC")
    List<Post> findAllByTypeWithDetails(@org.springframework.data.repository.query.Param("postType") PostType postType);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM Post p " +
            "JOIN FETCH p.user u " +
            "LEFT JOIN FETCH u.designer d " +
            "LEFT JOIN FETCH p.feed f " +
            "LEFT JOIN FETCH p.images i " +
            "WHERE p.postType = :postType AND p.category = :category " +
            "ORDER BY p.id DESC")
    List<Post> findByTypeAndCategoryWithDetails(
            @org.springframework.data.repository.query.Param("postType") PostType postType,
            @org.springframework.data.repository.query.Param("category") Category category);

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM Post p " +
            "JOIN FETCH p.user u " +
            "LEFT JOIN FETCH u.designer d " +
            "LEFT JOIN FETCH p.feed f " +
            "LEFT JOIN FETCH p.images i " +
            "WHERE u.id = :userId AND p.postType = :postType " +
            "ORDER BY p.id DESC")
    List<Post> findByUserIdAndTypeWithDetails(
            @org.springframework.data.repository.query.Param("userId") Long userId,
            @org.springframework.data.repository.query.Param("postType") PostType postType);

    // [NEW] 탐색 페이지 검색 및 페이징 조회
    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM Post p " +
            "JOIN FETCH p.user u " +
            "LEFT JOIN FETCH u.designer d " +
            "LEFT JOIN FETCH p.feed f " +
            "LEFT JOIN FETCH p.images i " +
            "WHERE p.postType = :postType " +
            "AND (:category IS NULL OR p.category = :category) " +
            "AND (:keyword IS NULL OR p.title LIKE %:keyword% OR u.nickname LIKE %:keyword%) " +
            "ORDER BY p.id DESC")
    List<Post> findExploreFeeds(
            @org.springframework.data.repository.query.Param("postType") PostType postType,
            @org.springframework.data.repository.query.Param("category") Category category,
            @org.springframework.data.repository.query.Param("keyword") String keyword,
            Pageable pageable);
}
