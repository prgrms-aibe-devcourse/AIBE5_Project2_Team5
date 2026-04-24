package com.example.pixel_project2.matching.service;

import com.example.pixel_project2.common.entity.JobSkill;
import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.Project;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.common.entity.enums.ExperienceLevel;
import com.example.pixel_project2.common.entity.enums.JobState;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.common.entity.enums.ProjectState;
import com.example.pixel_project2.common.repository.PostRepository;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.matching.dto.ApplyProjectRequest;
import com.example.pixel_project2.matching.dto.CreateProjectRequest;
import com.example.pixel_project2.matching.dto.MyApplicationItemResponse;
import com.example.pixel_project2.matching.dto.MyPostItemResponse;
import com.example.pixel_project2.matching.dto.ProjectApplicationItemResponse;
import com.example.pixel_project2.matching.dto.ProjectDetailResponse;
import com.example.pixel_project2.matching.dto.ProjectInquiryRequest;
import com.example.pixel_project2.matching.dto.ProjectListItemResponse;
import com.example.pixel_project2.matching.dto.UpdateProjectRequest;
import com.example.pixel_project2.matching.repository.JobSkillRepository;
import com.example.pixel_project2.matching.repository.ProjectRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MatchingServiceImpl implements MatchingService {
    private final ProjectRepository projectRepository;
    private final JobSkillRepository jobSkillRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public List<ProjectListItemResponse> getProjects() {
        List<Project> projects = projectRepository.findAllByPostTypeWithDetails(PostType.JOB_POST);

        return projects.stream()
                .map(project -> {
                    // 1. Post와 User에 대한 안전한 Null Check
                    Post post = project.getPost();
                    User user = (post != null) ? post.getUser() : null;

                    // 2. 안전하게 데이터 추출
                    String nickname = (user != null) ? user.getNickname() : null;
                    String companyName = (user != null && user.getClient() != null)
                            ? user.getClient().getCompanyName() : null;
                    String categoryLabel = (post != null && post.getCategory() != null)
                            ? post.getCategory().getLabel() : null;
                    String title = (post != null) ? post.getTitle() : null;

                    // 3. DTO 반환
                    return new ProjectListItemResponse(
                            project.getPost_id(),
                            nickname,
                            companyName,
                            categoryLabel,
                            title,
                            project.getOverview(),
                            formatBudget(project.getBudget()),
                            project.getExperienceLevel() != null ? project.getExperienceLevel().getLabel() : null,
                            project.getJobState() != null ? project.getJobState().getLabel() : null,
                            project.getDeadline() != null ? project.getDeadline().toString() : null
                    );
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDetailResponse getProjectDetail(Long postId) {
        Project project = projectRepository.findById(postId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + postId));

        return toProjectDetailResponse(project);
    }

    @Override
    @Transactional
    public ProjectDetailResponse createProject(Long userId, CreateProjectRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));

        Post post = postRepository.save(Post.builder()
                .user(user)
                .title(request.title())
                .postType(parsePostType(request.postType()))
                .category(parseCategory(request.category()))
                .build());

        // 수정 포인트 1: 별도의 반복문 삽입(addAll)을 제거하고 builder에 바로 String List를 넣어줍니다.
        Project project = projectRepository.save(Project.builder()
                .post(post)
                .overview(request.overview())
                .budget(request.budget())
                .fullDescription(request.fullDescription())
                .responsibilities(sanitizeStringList(request.responsibilities())) // CLOB 필드 매핑
                .qualifications(sanitizeStringList(request.qualifications()))     // CLOB 필드 매핑
                .projectState(parseProjectState(request.state()))
                .jobState(parseJobState(request.jobState()))
                .experienceLevel(parseExperienceLevel(request.experienceLevel()))
                .deadline(request.deadline())
                .build());

        // 기존에 있던 Responsibilities, Qualifications 객체 생성 로직 완전 제거

        List<String> sanitizedSkills = sanitizeStringList(request.skills());
        if (!sanitizedSkills.isEmpty()) {
            jobSkillRepository.saveAll(sanitizedSkills.stream()
                    .map(skill -> JobSkill.builder()
                            .project(project)
                            .skillName(skill)
                            .build())
                    .toList());
        }

        return toProjectDetailResponse(project);
    }

    private ProjectDetailResponse toProjectDetailResponse(Project project) {
        List<String> skills = jobSkillRepository.findAllByProjectPostId(project.getPost_id()).stream()
                .map(JobSkill::getSkillName)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
        return new ProjectDetailResponse(
                project.getPost_id(),
                project.getPost().getPostType().name(),
                project.getPost().getCategory().name(),
                project.getPost().getTitle(),
                project.getBudget(),
                project.getOverview(),
                project.getFullDescription(),
                // 수정 포인트 2: 엔티티 객체에서 꺼낼 필요 없이 바로 List<String>을 반환합니다.
                project.getResponsibilities(),
                project.getQualifications(),
                skills,
                project.getExperienceLevel() != null ? project.getExperienceLevel().getLabel() : null,
                project.getJobState() != null ? project.getJobState().getLabel() : null,
                project.getDeadline() != null ? project.getDeadline().toString() : null
        );
    }

    // 수정 포인트 3: Skill뿐만 아니라 Responsibilities, Qualifications에도 사용할 수 있도록 공통화 처리
    private List<String> sanitizeStringList(List<String> list) {
        if (list == null) {
            return List.of();
        }

        return list.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct() // 중복 방지
                .toList();
    }

    private String formatBudget(Integer budget) {
        if (budget == null) {
            return null;
        }
        return NumberFormat.getNumberInstance(Locale.KOREA).format(budget) + "\uC6D0";
    }

    private PostType parsePostType(String value) {
        if (value == null || value.isBlank()) {
            return PostType.JOB_POST;
        }
        return PostType.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }

    private Category parseCategory(String value) {
        Category category = Category.fromLabel(value);
        if (category != null) {
            return category;
        }
        return Category.valueOf(value.trim().toUpperCase(Locale.ROOT));
    }

    private JobState parseJobState(String value) {
        for (JobState jobState : JobState.values()) {
            if (jobState.name().equalsIgnoreCase(value) || jobState.getLabel().equals(value)) {
                return jobState;
            }
        }
        throw new IllegalArgumentException("Unsupported jobState: " + value);
    }

    private ExperienceLevel parseExperienceLevel(String value) {
        for (ExperienceLevel experienceLevel : ExperienceLevel.values()) {
            if (experienceLevel.name().equalsIgnoreCase(value) || experienceLevel.getLabel().equals(value)) {
                return experienceLevel;
            }
        }
        throw new IllegalArgumentException("Unsupported experienceLevel: " + value);
    }

    private ProjectState parseProjectState(String value) {
        if (value == null || value.isBlank()) {
            return ProjectState.OPEN;
        }
        for (ProjectState projectState : ProjectState.values()) {
            if (projectState.name().equalsIgnoreCase(value) || projectState.getLabel().equals(value)) {
                return projectState;
            }
        }
        throw new IllegalArgumentException("Unsupported projectState: " + value);
    }

    @Override
    public String applyProject(Long postId, ApplyProjectRequest request) {
        return "postId=" + postId + " application submitted.";
    }

    @Override
    public List<MyApplicationItemResponse> getMyApplications() {
        return List.of(
                new MyApplicationItemResponse(1L, 101L, "Application 1", 2800000, "OPEN", "2026-05-15T18:00:00"),
                new MyApplicationItemResponse(2L, 102L, "Application 2", 1800000, "CLOSED", "2026-04-30T18:00:00")
        );
    }

    @Override
    @Transactional
    public List<MyPostItemResponse> getMyPosts() {
        // 1. 현재 인증된 사용자 ID 추출 (SecurityContextHolder 활용 가정)
        AuthenticatedUser user = (AuthenticatedUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        Long userId = user.id();

        // 2. 리포지토리에서 해당 유저의 프로젝트 공고 조회
        // PostType.java에 정의된 JOB_POST(매칭공고) 타입을 기준으로 조회합니다.
        List<Project> myProjects = projectRepository.findAllByUserIdAndPostType(userId, PostType.JOB_POST);

        // 3. MyPostItemResponse DTO로 매핑하여 반환
        return myProjects.stream()
                .map(project -> new MyPostItemResponse(
                        project.getPost_id(),                  // postId (PK)
                        project.getPost().getTitle(),          // 제목 (Post 엔티티)
                        project.getOverview(),                 // 프로젝트 개요
                        project.getPost().getCategory().getLabel(),// 카테고리 (Post 엔티티)
                        project.getProjectState().name(),      // 모집상태 (OPEN/CLOSED)
                        project.getJobState().getLabel(),      // 기간 (단기/중기/장기)
                        project.getDeadline().toString()       // 마감일
                ))
                .collect(Collectors.toList());
    }

    @Override
    public String closeProject(Long postId) {
        return "postId=" + postId + " closed.";
    }

    @Override
    public String updateProject(Long postId, UpdateProjectRequest request) {
        return "postId=" + postId + " updated.";
    }

    @Override
    public String deleteProject(Long postId) {
        return "postId=" + postId + " deleted.";
    }

    @Override
    public String createInquiry(Long postId, ProjectInquiryRequest request) {
        return "postId=" + postId + " inquiry created.";
    }

    @Override
    public List<ProjectApplicationItemResponse> getProjectApplications(Long postId) {
        return List.of(
                new ProjectApplicationItemResponse(1L, 210L, "ApplicantA", 2500000, "Portfolio submitted."),
                new ProjectApplicationItemResponse(2L, 211L, "ApplicantB", 2700000, "Relevant experience included.")
        );
    }
}
