package com.example.pixel_project2.matching.repository;

import com.example.pixel_project2.common.entity.Project;
import com.example.pixel_project2.common.entity.enums.PostType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ProjectRepository extends JpaRepository<Project, Long> {
    @Query("SELECT DISTINCT p FROM Project p " +
            "JOIN FETCH p.post po " +
            "LEFT JOIN FETCH po.images i " +
            "JOIN FETCH po.user u " +
            "LEFT JOIN FETCH u.client c " +
            "ORDER BY po.id DESC")
    List<Project> findAllWithDetails();

    @Query("SELECT DISTINCT p FROM Project p " +
            "JOIN FETCH p.post po " +
            "LEFT JOIN FETCH po.images i " +
            "JOIN FETCH po.user u " +
            "LEFT JOIN FETCH u.client c " +
            "WHERE po.postType = :postType " +
            "ORDER BY po.id DESC")
    List<Project> findAllByPostTypeWithDetails(PostType postType);

    @Query("SELECT p FROM Project p " +
            "JOIN FETCH p.post po " +
            "LEFT JOIN FETCH po.images i " +
            "WHERE po.user.id = :userId AND po.postType = :postType " +
            "ORDER BY po.id DESC")
    List<Project> findAllByUserIdAndPostType(
            @Param("userId") Long userId,
            @Param("postType") PostType postType
    );

    @Query("SELECT DISTINCT p FROM Project p " +
            "JOIN FETCH p.post po " +
            "LEFT JOIN FETCH po.images i " +
            "JOIN FETCH po.user u " +
            "LEFT JOIN FETCH u.client c " +
            "WHERE po.id = :postId")
    java.util.Optional<Project> findByPostIdWithDetails(@Param("postId") Long postId);
}
