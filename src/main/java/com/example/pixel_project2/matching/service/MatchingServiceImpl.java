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
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class MatchingServiceImpl implements MatchingService {
    @Override
    public List<ProjectListItemResponse> getProjects() {
        return List.of(
                new ProjectListItemResponse(101L, "UI_UX", "OPEN", "핀테크 서비스 UX 디자이너 모집"),
                new ProjectListItemResponse(102L, "GRAPHIC_DESIGN", "CLOSED", "브랜드 리뉴얼 그래픽 디자이너 모집")
        );
    }

    @Override
    public ProjectDetailResponse getProjectDetail(Long postId) {
        return new ProjectDetailResponse(
                postId,
                "PROJECT",
                "UI_UX",
                "핀테크 서비스 UX 디자이너 모집",
                3000000,
                "신규 금융 서비스 런칭을 위한 UX 개선 프로젝트입니다.",
                "사용자 흐름 설계, 와이어프레임 제작, 협업 문서화",
                "Figma 사용 경험, 모바일 앱 UX 경험",
                "OPEN",
                "2026-05-15T18:00:00"
        );
    }

    @Override
    public ProjectDetailResponse createProject(CreateProjectRequest request) {
        return new ProjectDetailResponse(
                999L,
                request.postType(),
                request.category(),
                request.title(),
                request.budget(),
                request.overview(),
                request.responsibilities(),
                request.qualifications(),
                request.state(),
                request.deadline()
        );
    }

    @Override
    public String applyProject(Long postId, ApplyProjectRequest request) {
        return "postId=" + postId + " 지원이 접수되었습니다.";
    }

    @Override
    public List<MyApplicationItemResponse> getMyApplications() {
        return List.of(
                new MyApplicationItemResponse(1L, 101L, "핀테크 서비스 UX 디자이너 모집", 2800000, "OPEN", "2026-05-15T18:00:00"),
                new MyApplicationItemResponse(2L, 102L, "브랜드 리뉴얼 그래픽 디자이너 모집", 1800000, "CLOSED", "2026-04-30T18:00:00")
        );
    }

    @Override
    public List<MyPostItemResponse> getMyPosts() {
        return List.of(
                new MyPostItemResponse(101L, "핀테크 서비스 UX 디자이너 모집", 3000000, "OPEN", "2026-05-15T18:00:00"),
                new MyPostItemResponse(103L, "이커머스 상세페이지 디자이너 모집", 1500000, "OPEN", "2026-05-03T18:00:00")
        );
    }

    @Override
    public String closeProject(Long postId) {
        return "postId=" + postId + " 상태가 CLOSED로 변경되었습니다.";
    }

    @Override
    public String updateProject(Long postId, UpdateProjectRequest request) {
        return "postId=" + postId + " 수정이 완료되었습니다.";
    }

    @Override
    public String deleteProject(Long postId) {
        return "postId=" + postId + " 삭제가 완료되었습니다.";
    }

    @Override
    public String createInquiry(Long postId, ProjectInquiryRequest request) {
        return "postId=" + postId + " 문의가 등록되었습니다.";
    }

    @Override
    public List<ProjectApplicationItemResponse> getProjectApplications(Long postId) {
        return List.of(
                new ProjectApplicationItemResponse(1L, 210L, "디자이너A", 2500000, "포트폴리오 링크와 함께 제안드립니다."),
                new ProjectApplicationItemResponse(2L, 211L, "디자이너B", 2700000, "금융 서비스 UX 경험이 있습니다.")
        );
    }
}
