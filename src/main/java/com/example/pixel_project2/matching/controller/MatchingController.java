package com.example.pixel_project2.matching.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.common.entity.enums.ExperienceLevel;
import com.example.pixel_project2.common.entity.enums.JobState;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.matching.dto.*;
import com.example.pixel_project2.matching.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MatchingController {
    private final MatchingService matchingService;

    @GetMapping
    public ApiResponse<List<ProjectListItemResponse>> getProjects() {
        return ApiResponse.ok("프로젝트 목록을 조회했습니다.", matchingService.getProjects());
    }

    @GetMapping("/{postId}")
    public ApiResponse<ProjectDetailResponse> getProjectDetail(@PathVariable Long postId) {
        return ApiResponse.ok("프로젝트 상세를 조회했습니다.", matchingService.getProjectDetail(postId));
    }

    @GetMapping("/filtering")
    public ApiResponse<FilteringResponse> getFilterOptions() {
        List<String> jobStates = Arrays.stream(JobState.values()).map(JobState::getLabel).collect(Collectors.toList());
        List<String> experienceLevels = Arrays.stream(ExperienceLevel.values()).map(ExperienceLevel::getLabel).collect(Collectors.toList());
        List<String> categories = Arrays.stream(Category.values()).map(Category::getLabel).collect(Collectors.toList());

        return ApiResponse.ok("필터 옵션을 조회했습니다.", new FilteringResponse(jobStates, experienceLevels, categories));
    }

    @PostMapping("/create")
    public ApiResponse<ProjectDetailResponse> createProject(
            @AuthenticationPrincipal AuthenticatedUser user,
            @RequestBody CreateProjectRequest request
    ) {
        return ApiResponse.ok("프로젝트를 등록했습니다.", matchingService.createProject(user.id(), request));
    }

    @PostMapping("/{postId}/apply")
    public ApiResponse<String> applyProject(@PathVariable Long postId, @RequestBody ApplyProjectRequest request) {
        return ApiResponse.ok("프로젝트 지원이 완료되었습니다.", matchingService.applyProject(postId, request));
    }

    @PatchMapping("/{postId}/apply")
    public ApiResponse<String> updateProjectApplication(@PathVariable Long postId, @RequestBody ApplyProjectRequest request) {
        return ApiResponse.ok("지원서를 수정했습니다.", matchingService.updateProjectApplication(postId, request));
    }

    @DeleteMapping("/{postId}/apply")
    public ApiResponse<String> deleteProjectApplication(@PathVariable Long postId) {
        return ApiResponse.ok("지원을 취소했습니다.", matchingService.deleteProjectApplication(postId));
    }

    @PostMapping("/{postId}/close")
    public ApiResponse<String> closeProject(@PathVariable Long postId) {
        return ApiResponse.ok("프로젝트 모집 상태를 변경했습니다.", matchingService.closeProject(postId));
    }

    @PatchMapping("/{postId}/edit")
    public ApiResponse<ProjectDetailResponse> updateProject(@PathVariable Long postId, @RequestBody UpdateProjectRequest request) {
        return ApiResponse.ok("프로젝트를 수정했습니다.", matchingService.updateProject(postId, request));
    }

    @DeleteMapping("/{postId}/delete")
    public ApiResponse<String> deleteProject(@PathVariable Long postId) {
        return ApiResponse.ok("프로젝트를 삭제했습니다.", matchingService.deleteProject(postId));
    }

    @PostMapping("/{postId}/inquiry")
    public ApiResponse<String> createInquiry(@PathVariable Long postId, @RequestBody ProjectInquiryRequest request) {
        return ApiResponse.ok("문의가 등록되었습니다.", matchingService.createInquiry(postId, request));
    }

    @GetMapping("/{postId}/applications")
    public ApiResponse<List<ProjectApplicationItemResponse>> getProjectApplications(@PathVariable Long postId) {
        return ApiResponse.ok("지원서 목록을 조회했습니다.", matchingService.getProjectApplications(postId));
    }

    @GetMapping("/my-posts")
    public ApiResponse<List<MyPostItemResponse>> getMyPosts() {
        return ApiResponse.ok("내가 등록한 공고 목록을 조회했습니다.", matchingService.getMyPosts());
    }

    @GetMapping("/my-applications")
    public ApiResponse<List<MyApplicationItemResponse>> getMyApplications() {
        return ApiResponse.ok("내가 지원한 공고 목록을 조회했습니다.", matchingService.getMyApplications());
    }
}
