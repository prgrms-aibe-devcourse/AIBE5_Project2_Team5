package com.example.pixel_project2.matching.service;

import com.example.pixel_project2.matching.dto.ApplyProjectRequest;
import com.example.pixel_project2.matching.dto.CreateProjectRequest;
import com.example.pixel_project2.matching.dto.MyApplicationItemResponse;
import com.example.pixel_project2.matching.dto.MyPostItemResponse;
import com.example.pixel_project2.matching.dto.ProjectApplicationItemResponse;
import com.example.pixel_project2.matching.dto.ProjectDetailResponse;
import com.example.pixel_project2.matching.dto.ProjectInquiryRequest;
import com.example.pixel_project2.matching.dto.ProjectListItemResponse;
import com.example.pixel_project2.matching.dto.UpdateProjectRequest;

import java.util.List;

public interface MatchingService {
    List<ProjectListItemResponse> getProjects();

    ProjectDetailResponse getProjectDetail(Long postId);

    ProjectDetailResponse createProject(Long userId, CreateProjectRequest request);

    String applyProject(Long postId, ApplyProjectRequest request);

    List<MyApplicationItemResponse> getMyApplications();

    List<MyPostItemResponse> getMyPosts();

    String closeProject(Long postId);

    String updateProject(Long postId, UpdateProjectRequest request);

    String deleteProject(Long postId);

    String createInquiry(Long postId, ProjectInquiryRequest request);

    List<ProjectApplicationItemResponse> getProjectApplications(Long postId);
}
