package com.example.pixel_project2.matching.repository;

import com.example.pixel_project2.common.entity.JobSkill;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface JobSkillRepository extends JpaRepository<JobSkill, Long> {
    @Query("SELECT js FROM JobSkill js WHERE js.project.post_id IN :postIds")
    List<JobSkill> findAllByProjectPostIds(List<Long> postIds);

    @Query("SELECT js FROM JobSkill js WHERE js.project.post_id = :postId")
    List<JobSkill> findAllByProjectPostId(Long postId);
}
