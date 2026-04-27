package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.common.entity.enums.PostType;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

public interface PostRepository extends JpaRepository<Post, Long> {
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

    @org.springframework.data.jpa.repository.Query("SELECT DISTINCT p FROM Post p " +
            "JOIN FETCH p.user u " +
            "LEFT JOIN FETCH u.designer d " +
            "LEFT JOIN FETCH p.feed f " +
            "LEFT JOIN FETCH p.images i " +
            "WHERE p.id = :postId")
    Optional<Post> findByIdWithDetails(@org.springframework.data.repository.query.Param("postId") Long postId);

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

    // ── 커서 기반 피드 목록 (No-Offset) ──────────────────────────────────────

    /** 첫 페이지: cursor 없이 최신 postId size+1개 조회 (전체 사용자) */
    @Query("SELECT p.id FROM Post p WHERE p.postType = :postType ORDER BY p.id DESC")
    List<Long> findTopIdsByType(@Param("postType") PostType postType, Pageable pageable);

    /** 다음 페이지: cursor보다 작은 postId size+1개 조회 (전체 사용자) */
    @Query("SELECT p.id FROM Post p WHERE p.postType = :postType AND p.id < :cursor ORDER BY p.id DESC")
    List<Long> findNextIdsByType(@Param("postType") PostType postType, @Param("cursor") Long cursor, Pageable pageable);

    /** 첫 페이지: cursor 없이 최신 postId size+1개 조회 (팔로우 사용자 필터) */
    @Query("SELECT p.id FROM Post p WHERE p.postType = :postType AND p.user.id IN :userIds ORDER BY p.id DESC")
    List<Long> findTopIdsByTypeAndUsers(@Param("postType") PostType postType, @Param("userIds") Collection<Long> userIds, Pageable pageable);

    /** 다음 페이지: cursor보다 작은 postId size+1개 조회 (팔로우 사용자 필터) */
    @Query("SELECT p.id FROM Post p WHERE p.postType = :postType AND p.user.id IN :userIds AND p.id < :cursor ORDER BY p.id DESC")
    List<Long> findNextIdsByTypeAndUsers(@Param("postType") PostType postType, @Param("userIds") Collection<Long> userIds, @Param("cursor") Long cursor, Pageable pageable);

    /** ID 목록으로 Post 상세 일괄 조회 (컬렉션 fetch join — Pageable 없이 사용해야 in-memory 페이징 회피) */
    @Query("SELECT DISTINCT p FROM Post p " +
            "JOIN FETCH p.user u " +
            "LEFT JOIN FETCH u.designer " +
            "LEFT JOIN FETCH p.feed " +
            "LEFT JOIN FETCH p.images " +
            "WHERE p.id IN :ids")
    List<Post> findAllByIdsWithDetails(@Param("ids") Collection<Long> ids);
}
