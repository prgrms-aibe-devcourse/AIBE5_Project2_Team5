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
                new ProjectListItemResponse(
                        1L,
                        "핀테크 모바일 앱 UI/UX 고도화 프로젝트",
                        "기존 금융 서비스의 사용자 경험을 개선할 UI/UX 디자이너를 찾고 있습니다.",
                        "대시보드 UI 개선, 다크 모드 지원, 접근성 기준 반영까지 포함된 모바일 앱 UX 고도화 프로젝트입니다.",
                        "UI/UX",
                        List.of("Figma", "Prototyping", "User Research"),
                        "1,200만 ~ 1,800만 원",
                        "2026-04-20",
                        "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                        "단기",
                        "3년 이상"
                ),
                new ProjectListItemResponse(
                        2L,
                        "글로벌 SaaS 브랜딩 리뉴얼",
                        "B2B SaaS 브랜드 아이덴티티를 글로벌 시장에 맞게 리뉴얼합니다.",
                        "로고, 컬러 시스템, 타이포그래피, 브랜드 가이드라인까지 포함하는 브랜딩 프로젝트입니다.",
                        "브랜딩",
                        List.of("Brand Identity", "Illustrator", "Typography"),
                        "800만 ~ 1,200만 원",
                        "2026-05-10",
                        "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                        "단기",
                        "5년 이상"
                ),
                new ProjectListItemResponse(
                        3L,
                        "제품 글로벌 런칭 3D 모션 영상 제작",
                        "신제품 런칭 캠페인을 위한 3D 모션 그래픽 영상을 제작합니다.",
                        "Cinema 4D와 After Effects 기반으로 4K 모션 그래픽 영상을 제작하는 프로젝트입니다.",
                        "모션/영상",
                        List.of("Cinema 4D", "After Effects", "3D Modeling"),
                        "1,500만 ~ 2,500만 원",
                        "2026-06-30",
                        "https://images.unsplash.com/photo-1740174459691-5b93c2fa0592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                        "중기",
                        "5년 이상"
                ),
                new ProjectListItemResponse(
                        4L,
                        "이커머스 메인 배너 일러스트 시리즈",
                        "시즌 캠페인용 감성 일러스트 배너 시리즈를 제작합니다.",
                        "메인 배너 12종과 모바일 변형 시안을 포함한 일러스트 중심 캠페인 프로젝트입니다.",
                        "일러스트",
                        List.of("Illustration", "Procreate", "Adobe Fresco"),
                        "500만 ~ 700만 원",
                        "2026-04-22",
                        "https://images.unsplash.com/photo-1618004912476-29818d81ae2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                        "단기",
                        "신입 가능"
                ),
                new ProjectListItemResponse(
                        5L,
                        "엔터프라이즈 대시보드 UI 컴포넌트 라이브러리",
                        "복잡한 데이터 시각화를 지원하는 디자인 시스템을 구축합니다.",
                        "Figma와 Storybook 기반으로 대시보드용 디자인 시스템과 컴포넌트 라이브러리를 정리합니다.",
                        "UI/UX",
                        List.of("Design System", "Figma", "Storybook"),
                        "2,000만 ~ 3,000만 원",
                        "2026-05-25",
                        "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                        "장기",
                        "5년 이상"
                ),
                new ProjectListItemResponse(
                        6L,
                        "패션 브랜드 룩북 포토그래피 리터칭",
                        "시즌 룩북 촬영과 리터칭 작업을 진행할 포토그래퍼를 찾고 있습니다.",
                        "스튜디오 촬영, 라이트룸 보정, 고급 리터칭까지 포함된 룩북 프로젝트입니다.",
                        "포토그래피",
                        List.of("Photography", "Lightroom", "Retouching"),
                        "400만 ~ 600만 원",
                        "2026-05-05",
                        "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
                        "단기",
                        "3년 이상"
                )
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
