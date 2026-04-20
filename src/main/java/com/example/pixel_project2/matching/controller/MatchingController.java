package com.example.pixel_project2.matching.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.matching.dto.ApplyProjectRequest;
import com.example.pixel_project2.matching.dto.CreateProjectRequest;
import com.example.pixel_project2.matching.dto.MyApplicationItemResponse;
import com.example.pixel_project2.matching.dto.MyPostItemResponse;
import com.example.pixel_project2.matching.dto.ProjectApplicationItemResponse;
import com.example.pixel_project2.matching.dto.ProjectDetailResponse;
import com.example.pixel_project2.matching.dto.ProjectInquiryRequest;
import com.example.pixel_project2.matching.dto.ProjectListItemResponse;
import com.example.pixel_project2.matching.dto.UpdateProjectRequest;
import com.example.pixel_project2.matching.service.MatchingService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/projects")
@RequiredArgsConstructor
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

    @PostMapping("/new")
    public ApiResponse<ProjectDetailResponse> createProject(@RequestBody CreateProjectRequest request) {
        return ApiResponse.ok("프로젝트를 등록했습니다.", matchingService.createProject(request));
    }

    @PostMapping("/{postId}/apply")
    public ApiResponse<String> applyProject(@PathVariable Long postId, @RequestBody ApplyProjectRequest request) {
        return ApiResponse.ok("프로젝트 지원이 완료되었습니다.", matchingService.applyProject(postId, request));
    }

    @GetMapping("/my_applications")
    public ApiResponse<List<MyApplicationItemResponse>> getMyApplications() {
        return ApiResponse.ok("내 지원 현황을 조회했습니다.", matchingService.getMyApplications());
    }

    @GetMapping("/my_posts")
    public ApiResponse<List<MyPostItemResponse>> getMyPosts() {
        return ApiResponse.ok("내가 등록한 공고를 조회했습니다.", matchingService.getMyPosts());
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
