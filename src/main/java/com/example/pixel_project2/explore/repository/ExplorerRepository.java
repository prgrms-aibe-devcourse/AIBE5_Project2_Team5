package com.example.pixel_project2.explore.repository;

import com.example.pixel_project2.common.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;
import com.example.pixel_project2.explore.dto.DesignerPostCount;

public interface ExplorerRepository extends JpaRepository<User, Long> {
    @Query("SELECT new com.example.pixel_project2.explore.dto.DesignerPostCount(u.id, u.nickname, COUNT(p)) " +
            "FROM User u " +
            "LEFT JOIN Post p ON u.id = p.user.id AND p.postType = 'PORTFOLIO' " +
            "WHERE u.role = 'DESIGNER' " +
            "GROUP BY u.id, u.nickname")
    List<DesignerPostCount> findDesignersWithPostCount();
}
