package com.example.pixel_project2.explore.repository;

import com.example.pixel_project2.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import com.example.pixel_project2.explore.dto.DesignerPostCount;

public interface ExplorerRepository extends JpaRepository<User, Long> {
    @Query("SELECT new com.example.pixel_project2.explore.dto.DesignerPostCount(u.id, u.nickname, u.profileImage, d.job, u.followCount, COUNT(p)) " +
            "FROM User u " +
            "LEFT JOIN Designer d ON u.id = d.userId " +
            "LEFT JOIN Post p ON u.id = p.user.id AND p.postType = 'PORTFOLIO' " +
            "WHERE u.role = 'DESIGNER' " +
            "GROUP BY u.id, u.nickname, u.profileImage, d.job, u.followCount")
    List<DesignerPostCount> findDesignersWithPostCount();

    @Query("SELECT d.job FROM Designer d WHERE d.userId = :userId")
    String findDesignerJob(@org.springframework.data.repository.query.Param("userId") Long userId);
}
