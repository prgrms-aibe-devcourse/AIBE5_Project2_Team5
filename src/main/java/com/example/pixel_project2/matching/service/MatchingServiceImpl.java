package com.example.pixel_project2.matching.service;

import com.example.pixel_project2.common.entity.JobSkill;
import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.PostImage;
import com.example.pixel_project2.common.entity.Project;
import com.example.pixel_project2.common.entity.Application;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.common.entity.enums.ExperienceLevel;
import com.example.pixel_project2.common.entity.enums.JobState;
import com.example.pixel_project2.common.entity.enums.NotificationType;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.common.entity.enums.ProjectState;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.repository.ApplicationRepository;
import com.example.pixel_project2.common.repository.CollectionRepository;
import com.example.pixel_project2.common.repository.CommentRepository;
import com.example.pixel_project2.common.repository.PostRepository;
import com.example.pixel_project2.common.repository.PickCountRepository;
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
import com.example.pixel_project2.notification.repository.NotificationRepository;
import com.example.pixel_project2.notification.service.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.text.NumberFormat;
import java.time.LocalDateTime;
import java.util.Comparator;
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
    private final ApplicationRepository applicationRepository;
    private final CommentRepository commentRepository;
    private final CollectionRepository collectionRepository;
    private final PickCountRepository pickCountRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public List<ProjectListItemResponse> getProjects() {
        List<Project> projects = projectRepository.findAllByPostTypeWithDetails(PostType.JOB_POST);

        return projects.stream()
                .map(project -> {
                    Post post = project.getPost();
                    User user = post != null ? post.getUser() : null;
                    List<String> imageUrls = getPostImageUrls(post);
                    List<String> categoryLabels = getProjectCategories(project);

                    String nickname = user != null ? user.getNickname() : null;
                    String companyName = user != null && user.getClient() != null
                            ? user.getClient().getCompanyName()
                            : null;
                    String categoryLabel = categoryLabels.isEmpty() ? null : categoryLabels.get(0);
                    String title = post != null ? post.getTitle() : null;

                    return new ProjectListItemResponse(
                            project.getPost_id(),
                            user != null ? user.getId() : null,
                            nickname,
                            user != null ? user.getProfileImage() : null,
                            companyName,
                            categoryLabel,
                            categoryLabels,
                            title,
                            project.getOverview(),
                            formatBudget(project.getBudget()),
                            project.getExperienceLevel() != null ? project.getExperienceLevel().getLabel() : null,
                            project.getJobState() != null ? project.getJobState().getLabel() : null,
                            project.getDeadline() != null ? project.getDeadline().toString() : null,
                            imageUrls.isEmpty() ? null : imageUrls.get(0),
                            imageUrls
                    );
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ProjectDetailResponse getProjectDetail(Long postId) {
        Project project = projectRepository.findByPostIdWithDetails(postId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + postId));

        return toProjectDetailResponse(project);
    }

    @Override
    @Transactional
    public ProjectDetailResponse createProject(Long userId, CreateProjectRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + userId));
        if (user.getRole() != UserRole.CLIENT) {
            throw new IllegalArgumentException("클라이언트만 프로젝트를 등록할 수 있습니다.");
        }
        List<String> categories = normalizeProjectCategories(request.categories(), request.category());

        Post post = postRepository.save(Post.builder()
                .user(user)
                .title(request.title())
                .postType(parsePostType(request.postType()))
                .category(parseCategory(categories.get(0)))
                .build());

        Project project = projectRepository.save(Project.builder()
                .post(post)
                .overview(request.overview())
                .budget(request.budget())
                .fullDescription(request.fullDescription())
                .responsibilities(sanitizeStringList(request.responsibilities()))
                .qualifications(sanitizeStringList(request.qualifications()))
                .categories(categories)
                .projectState(parseProjectState(request.state()))
                .jobState(parseJobState(request.jobState()))
                .experienceLevel(parseExperienceLevel(request.experienceLevel()))
                .deadline(request.deadline())
                .build());

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
        List<String> imageUrls = getPostImageUrls(project.getPost());
        List<String> categories = getProjectCategories(project);
        String primaryCategory = categories.isEmpty() ? null : categories.get(0);

        return new ProjectDetailResponse(
                project.getPost_id(),
                project.getPost().getUser() != null ? project.getPost().getUser().getId() : null,
                project.getPost().getPostType().name(),
                project.getPost().getUser() != null ? project.getPost().getUser().getProfileImage() : null,
                primaryCategory,
                categories,
                project.getPost().getTitle(),
                project.getBudget(),
                project.getOverview(),
                project.getFullDescription(),
                project.getResponsibilities(),
                project.getQualifications(),
                skills,
                project.getExperienceLevel() != null ? project.getExperienceLevel().getLabel() : null,
                project.getJobState() != null ? project.getJobState().getLabel() : null,
                project.getDeadline() != null ? project.getDeadline().toString() : null,
                imageUrls.isEmpty() ? null : imageUrls.get(0),
                imageUrls
        );
    }

    private List<String> getPostImageUrls(Post post) {
        if (post == null || post.getImages() == null) {
            return List.of();
        }

        return post.getImages().stream()
                .sorted(Comparator.comparing(
                        PostImage::getSortOrder,
                        Comparator.nullsLast(Integer::compareTo)
                ))
                .map(PostImage::getImageUrl)
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .toList();
    }

    private List<String> sanitizeStringList(List<String> list) {
        if (list == null) {
            return List.of();
        }

        return list.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .filter(value -> !value.isBlank())
                .distinct()
                .toList();
    }

    private List<String> getProjectCategories(Project project) {
        List<String> categories = sanitizeStringList(project.getCategories());
        String primaryCategory = project.getPost() != null && project.getPost().getCategory() != null
                ? project.getPost().getCategory().getLabel()
                : null;

        if (primaryCategory == null || primaryCategory.isBlank()) {
            return categories;
        }

        if (categories.isEmpty()) {
            return List.of(primaryCategory);
        }

        if (categories.contains(primaryCategory)) {
            return categories;
        }

        java.util.ArrayList<String> normalized = new java.util.ArrayList<>();
        normalized.add(primaryCategory);
        normalized.addAll(categories);
        return normalized;
    }

    private List<String> normalizeProjectCategories(List<String> categories, String legacyCategory) {
        List<String> rawCategories = sanitizeStringList(categories);
        if (rawCategories.isEmpty() && legacyCategory != null && !legacyCategory.isBlank()) {
            rawCategories = List.of(legacyCategory);
        }

        List<String> normalized = rawCategories.stream()
                .map(this::parseCategory)
                .map(Category::getLabel)
                .distinct()
                .toList();

        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("At least one category is required.");
        }

        return normalized;
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
    @Transactional
    public String applyProject(Long postId, ApplyProjectRequest request) {
        AuthenticatedUser currentUser = getCurrentUser();
        User applicant = userRepository.findById(currentUser.id())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + currentUser.id()));
        Project project = projectRepository.findByPostIdWithDetails(postId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + postId));
        Post post = project.getPost();
        User poster = post.getUser();

        validateApplicationRequest(request);

        if (project.getProjectState() == ProjectState.CLOSED) {
            throw new IllegalArgumentException("Closed projects cannot receive new applications.");
        }
        if (poster != null && Objects.equals(poster.getId(), applicant.getId())) {
            throw new IllegalArgumentException("You cannot apply to your own project.");
        }
        if (applicationRepository.existsByApplicant_IdAndPost_Id(applicant.getId(), postId)) {
            throw new IllegalArgumentException("You have already applied to this project.");
        }

        applicationRepository.save(Application.builder()
                .applicant(applicant)
                .poster(poster)
                .post(post)
                .coverLetter(normalizeNullableText(request.coverLetter()))
                .summary(normalizeNullableText(request.summary()))
                .expectedBudget(request.expectedBudget())
                .portfolioUrl(normalizeNullableText(request.portfolioUrl()))
                .startDate(request.startDate() == null ? null : request.startDate().atStartOfDay())
                .build());

        if (poster != null) {
            String applicantLabel = normalizeNullableText(applicant.getNickname());
            if (applicantLabel == null) {
                applicantLabel = normalizeNullableText(applicant.getName());
            }
            notificationService.createNotification(
                    poster.getId(),
                    applicant.getId(),
                    NotificationType.PROJECT_APPLY,
                    postId,
                    (applicantLabel == null ? "새 지원자" : applicantLabel) + "님이 프로젝트에 지원했습니다."
            );
        }

        return "postId=" + postId + " application submitted.";
    }

    @Override
    @Transactional
    public String updateProjectApplication(Long postId, ApplyProjectRequest request) {
        AuthenticatedUser currentUser = getCurrentUser();
        Application application = applicationRepository.findByApplicantIdAndPostIdWithDetails(currentUser.id(), postId)
                .orElseThrow(() -> new EntityNotFoundException("Application not found for post: " + postId));

        validateApplicationRequest(request);

        application.setCoverLetter(normalizeNullableText(request.coverLetter()));
        application.setSummary(normalizeNullableText(request.summary()));
        application.setExpectedBudget(request.expectedBudget());
        application.setPortfolioUrl(normalizeNullableText(request.portfolioUrl()));
        application.setStartDate(request.startDate() == null ? null : request.startDate().atStartOfDay());

        return "postId=" + postId + " application updated.";
    }

    @Override
    @Transactional
    public String deleteProjectApplication(Long postId) {
        AuthenticatedUser currentUser = getCurrentUser();
        Application application = applicationRepository.findByApplicantIdAndPostIdWithDetails(currentUser.id(), postId)
                .orElseThrow(() -> new EntityNotFoundException("Application not found for post: " + postId));

        applicationRepository.delete(application);
        return "postId=" + postId + " application deleted.";
    }

    @Override
    @Transactional(readOnly = true)
    public List<MyApplicationItemResponse> getMyApplications() {
        AuthenticatedUser currentUser = getCurrentUser();

        return applicationRepository.findAllByApplicantIdWithPost(currentUser.id()).stream()
                .map(application -> {
                    Post post = application.getPost();
                    Project project = projectRepository.findByPostIdWithDetails(post.getId()).orElse(null);
                    List<String> imageUrls = getPostImageUrls(post);
                    List<String> categoryLabels = project == null ? List.of() : getProjectCategories(project);

                    return new MyApplicationItemResponse(
                            application.getApplication_id(),
                            post.getId(),
                            post.getUser() != null ? post.getUser().getId() : null,
                            post.getTitle(),
                            project != null ? project.getOverview() : null,
                            post.getUser() != null ? post.getUser().getProfileImage() : null,
                            application.getExpectedBudget(),
                            application.getSummary(),
                            application.getCoverLetter(),
                            application.getPortfolioUrl(),
                            application.getStartDate() != null ? application.getStartDate().toLocalDate().toString() : null,
                            project != null ? project.getProjectState().name() : null,
                            project != null && project.getJobState() != null ? project.getJobState().getLabel() : null,
                            categoryLabels.isEmpty() ? null : categoryLabels.get(0),
                            categoryLabels,
                            project != null && project.getDeadline() != null ? project.getDeadline().toString() : null,
                            imageUrls.stream().findFirst().orElse(null),
                            imageUrls
                    );
                })
                .toList();
    }

    @Override
    @Transactional
    public List<MyPostItemResponse> getMyPosts() {
        AuthenticatedUser user = (AuthenticatedUser) SecurityContextHolder.getContext()
                .getAuthentication().getPrincipal();
        Long userId = user.id();

        List<Project> myProjects = projectRepository.findAllByUserIdAndPostType(userId, PostType.JOB_POST);

        return myProjects.stream()
                .map(project -> {
                    List<String> imageUrls = getPostImageUrls(project.getPost());
                    List<String> categoryLabels = getProjectCategories(project);
                    return new MyPostItemResponse(
                            project.getPost_id(),
                            project.getPost().getUser() != null ? project.getPost().getUser().getId() : null,
                            project.getPost().getTitle(),
                            project.getOverview(),
                            project.getPost().getUser() != null ? project.getPost().getUser().getProfileImage() : null,
                            categoryLabels.isEmpty() ? null : categoryLabels.get(0),
                            categoryLabels,
                            project.getProjectState().name(),
                            project.getJobState().getLabel(),
                            project.getDeadline().toString(),
                            imageUrls.stream().findFirst().orElse(null),
                            imageUrls
                    );
                })
                .collect(Collectors.toList());
    }

    @Override
    public String closeProject(Long postId) {
        return "postId=" + postId + " closed.";
    }

    @Override
    @Transactional
    public ProjectDetailResponse updateProject(Long postId, UpdateProjectRequest request) {
        AuthenticatedUser currentUser = getCurrentUser();
        Project project = projectRepository.findByPostIdWithDetails(postId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + postId));
        User poster = project.getPost() != null ? project.getPost().getUser() : null;

        if (poster == null || !Objects.equals(poster.getId(), currentUser.id())) {
            throw new IllegalArgumentException("본인 공고만 수정할 수 있습니다.");
        }

        if (poster.getRole() != UserRole.CLIENT) {
            throw new IllegalArgumentException("클라이언트만 프로젝트를 수정할 수 있습니다.");
        }

        Post post = project.getPost();
        if (request.title() != null && !request.title().isBlank()) {
            post.setTitle(request.title().trim());
        }

        List<String> categories = request.categories() != null || (request.category() != null && !request.category().isBlank())
                ? normalizeProjectCategories(request.categories(), request.category())
                : getProjectCategories(project);
        if (!categories.isEmpty()) {
            post.setCategory(parseCategory(categories.get(0)));
            project.setCategories(categories);
        }

        if (request.jobState() != null && !request.jobState().isBlank()) {
            project.setJobState(parseJobState(request.jobState()));
        }
        if (request.experienceLevel() != null && !request.experienceLevel().isBlank()) {
            project.setExperienceLevel(parseExperienceLevel(request.experienceLevel()));
        }
        if (request.budget() != null) {
            project.setBudget(request.budget());
        }
        if (request.overview() != null) {
            project.setOverview(normalizeNullableText(request.overview()));
        }
        if (request.fullDescription() != null) {
            project.setFullDescription(normalizeNullableText(request.fullDescription()));
        }
        if (request.responsibilities() != null) {
            project.setResponsibilities(sanitizeStringList(request.responsibilities()));
        }
        if (request.qualifications() != null) {
            project.setQualifications(sanitizeStringList(request.qualifications()));
        }
        if (request.state() != null && !request.state().isBlank()) {
            project.setProjectState(parseProjectState(request.state()));
        }
        if (request.deadline() != null) {
            project.setDeadline(request.deadline());
        }

        if (request.skills() != null) {
            jobSkillRepository.deleteByProjectPostId(postId);
            List<String> sanitizedSkills = sanitizeStringList(request.skills());
            if (!sanitizedSkills.isEmpty()) {
                jobSkillRepository.saveAll(sanitizedSkills.stream()
                        .map(skill -> JobSkill.builder()
                                .project(project)
                                .skillName(skill)
                                .build())
                        .toList());
            }
        }

        return toProjectDetailResponse(project);
    }

    @Override
    @Transactional
    public String deleteProject(Long postId) {
        AuthenticatedUser currentUser = getCurrentUser();
        Project project = projectRepository.findByPostIdWithDetails(postId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + postId));
        Post post = project.getPost();
        User poster = post != null ? post.getUser() : null;

        if (poster == null || !Objects.equals(poster.getId(), currentUser.id())) {
            throw new IllegalArgumentException("본인 공고만 삭제할 수 있습니다.");
        }

        if (poster.getRole() != UserRole.CLIENT) {
            throw new IllegalArgumentException("클라이언트만 프로젝트를 삭제할 수 있습니다.");
        }

        applicationRepository.deleteByPostId(postId);
        jobSkillRepository.deleteByProjectPostId(postId);
        commentRepository.deleteByPostId(postId);
        collectionRepository.deleteByPostId(postId);
        pickCountRepository.deleteByPostId(postId);
        notificationRepository.deleteByReferenceIdAndType(postId, NotificationType.PROJECT_APPLY);
        projectRepository.delete(project);
        postRepository.delete(post);

        return "postId=" + postId + " deleted.";
    }

    @Override
    public String createInquiry(Long postId, ProjectInquiryRequest request) {
        return "postId=" + postId + " inquiry created.";
    }

    @Override
    @Transactional(readOnly = true)
    public List<ProjectApplicationItemResponse> getProjectApplications(Long postId) {
        AuthenticatedUser currentUser = getCurrentUser();
        Project project = projectRepository.findByPostIdWithDetails(postId)
                .orElseThrow(() -> new EntityNotFoundException("Project not found: " + postId));
        User poster = project.getPost() != null ? project.getPost().getUser() : null;

        if (poster == null || !Objects.equals(poster.getId(), currentUser.id())) {
            throw new IllegalArgumentException("본인 공고의 지원 내역만 볼 수 있습니다.");
        }

        return applicationRepository.findAllByPostIdWithApplicant(postId).stream()
                .map(application -> new ProjectApplicationItemResponse(
                        application.getApplication_id(),
                        application.getApplicant().getId(),
                        application.getApplicant().getName(),
                        application.getApplicant().getNickname(),
                        application.getApplicant().getProfileImage(),
                        application.getExpectedBudget(),
                        application.getSummary(),
                        application.getCoverLetter(),
                        application.getPortfolioUrl(),
                        application.getStartDate() != null ? application.getStartDate().toLocalDate().toString() : null
                ))
                .toList();
    }

    private AuthenticatedUser getCurrentUser() {
        return (AuthenticatedUser) SecurityContextHolder.getContext()
                .getAuthentication()
                .getPrincipal();
    }

    private void validateApplicationRequest(ApplyProjectRequest request) {
        if (request == null) {
            throw new IllegalArgumentException("Application request is required.");
        }
        if (normalizeNullableText(request.coverLetter()) == null) {
            throw new IllegalArgumentException("Cover letter is required.");
        }
        if (normalizeNullableText(request.summary()) == null) {
            throw new IllegalArgumentException("Summary is required.");
        }
        if (request.expectedBudget() != null && request.expectedBudget() < 0) {
            throw new IllegalArgumentException("Expected budget cannot be negative.");
        }
        if (request.startDate() != null) {
            LocalDateTime requestedStartAt = request.startDate().atStartOfDay();
            if (requestedStartAt.isBefore(LocalDateTime.now().minusDays(1))) {
                throw new IllegalArgumentException("Start date cannot be in the past.");
            }
        }
    }

    private String normalizeNullableText(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isBlank() ? null : trimmed;
    }
}
