package com.example.pixel_project2.common.repository;

import com.example.pixel_project2.common.entity.Application;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface ApplicationRepository extends JpaRepository<Application, Long> {
    boolean existsByApplicant_IdAndPost_Id(Long applicantId, Long postId);

    @Query("""
            SELECT a
            FROM Application a
            JOIN FETCH a.post p
            JOIN FETCH p.user
            WHERE a.applicant.id = :applicantId
            ORDER BY a.application_id DESC
            """)
    List<Application> findAllByApplicantIdWithPost(@Param("applicantId") Long applicantId);

    @Query("""
            SELECT a
            FROM Application a
            JOIN FETCH a.applicant applicant
            JOIN FETCH a.post p
            WHERE p.id = :postId
            ORDER BY a.application_id DESC
            """)
    List<Application> findAllByPostIdWithApplicant(@Param("postId") Long postId);
}
