package com.example.pixel_project2.explore.repository;

import com.example.pixel_project2.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import com.example.pixel_project2.explore.dto.ExploreDesignerResponseDto;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface ExplorerRepository extends JpaRepository<User, Long> {
    @Query("SELECT new com.example.pixel_project2.explore.dto.ExploreDesignerResponseDto(u.id, u.nickname, u.profileImage, d.job, u.followCount, COUNT(p), d.introduction) " +
            "FROM User u " +
            "LEFT JOIN Designer d ON u.id = d.userId " +
            "LEFT JOIN Post p ON u.id = p.user.id AND p.postType = 'PORTFOLIO' " +
            "WHERE u.role = 'DESIGNER' " +
            "AND (:keyword IS NULL OR u.nickname LIKE %:keyword% OR d.job LIKE %:keyword%) " +
            "GROUP BY u.id, u.nickname, u.profileImage, d.job, u.followCount, d.introduction")
    Page<ExploreDesignerResponseDto> findExploreDesigners(@org.springframework.data.repository.query.Param("keyword") String keyword, Pageable pageable);

    @Query("SELECT d.job FROM Designer d WHERE d.userId = :userId")
    String findDesignerJob(@org.springframework.data.repository.query.Param("userId") Long userId);

    @Query(value = "SELECT pi.image_url FROM post_images pi JOIN posts p ON pi.post_id = p.post_id WHERE p.user_id = :userId ORDER BY p.post_id DESC FETCH FIRST 1 ROWS ONLY", nativeQuery = true)
    String findLatestPostImageByUserId(@org.springframework.data.repository.query.Param("userId") Long userId);
}
