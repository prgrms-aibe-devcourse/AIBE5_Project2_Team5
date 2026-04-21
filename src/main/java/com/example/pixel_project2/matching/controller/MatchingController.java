package com.example.pixel_project2.matching.controller;

import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.common.entity.enums.ExperienceLevel;
import com.example.pixel_project2.common.entity.enums.JobState;
import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.matching.dto.*;
import com.example.pixel_project2.matching.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
@CrossOrigin(origins = "http://localhost:5173")
public class MatchingController {
    private final MatchingService matchingService;

    // 매칭 페이지 조회(목록 All 조회)
    @GetMapping
    public ApiResponse<List<ProjectListItemResponse>> getProjects() {
        return ApiResponse.ok("프로젝트 목록을 조회했습니다.", matchingService.getProjects());
    }

    // 프로젝트 공고 상세페이지
    @GetMapping("/{postId}")
    public ApiResponse<ProjectDetailResponse> getProjectDetail(@PathVariable Long postId) {
        return ApiResponse.ok("프로젝트 상세를 조회했습니다.", matchingService.getProjectDetail(postId));
    }

    @GetMapping("/filtering")
    public ApiResponse<FilteringResponse> getFilterOptions() {
        List<String> jobStates = Arrays.stream(JobState.values()).map(JobState::getLabel).collect(Collectors.toList());
        List<String> experienceLevels = Arrays.stream(ExperienceLevel.values()).map(ExperienceLevel::getLabel).collect(Collectors.toList());
        List<String> categories = Arrays.stream(Category.values()).map(Category::getLabel).collect(Collectors.toList());

        FilteringResponse response = new FilteringResponse(jobStates, experienceLevels, categories);
        return ApiResponse.ok("필터 옵션을 조회했습니다.", response);
    }

    // 프로젝트 새로 등록
    @PostMapping("/new")
    public ApiResponse<ProjectDetailResponse> createProject(@RequestBody CreateProjectRequest request) {
        return ApiResponse.ok("프로젝트를 등록했습니다.", matchingService.createProject(request));
    }

    @PostMapping("/{postId}/apply")
    public ApiResponse<String> applyProject(@PathVariable Long postId, @RequestBody ApplyProjectRequest request) {
        return ApiResponse.ok("프로젝트 지원이 완료되었습니다.", matchingService.applyProject(postId, request));
    }

    @PostMapping("/{postId}/close")
    public ApiResponse<String> closeProject(@PathVariable Long postId) {
        return ApiResponse.ok("프로젝트 모집 상태를 변경했습니다.", matchingService.closeProject(postId));
    }

    @PatchMapping("/{postId}/edit")
    public ApiResponse<String> updateProject(@PathVariable Long postId, @RequestBody UpdateProjectRequest request) {
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

}
