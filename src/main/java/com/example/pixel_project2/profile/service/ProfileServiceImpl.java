package com.example.pixel_project2.profile.service;

import com.example.pixel_project2.common.entity.Designer;
import com.example.pixel_project2.common.entity.Feed;
import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.PostImage;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.entity.enums.WorkStatus;
import com.example.pixel_project2.common.entity.enums.WorkType;
import com.example.pixel_project2.common.repository.CommentRepository;
import com.example.pixel_project2.common.repository.DesignerRepository;
import com.example.pixel_project2.common.repository.FollowRepository;
import com.example.pixel_project2.common.repository.PostRepository;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.message.entity.MessageReview;
import com.example.pixel_project2.message.repository.MessageReviewRepository;
import com.example.pixel_project2.profile.dto.ProfileFeedResponse;
import com.example.pixel_project2.profile.dto.ProfileResponse;
import com.example.pixel_project2.profile.dto.ProfileReviewResponse;
import com.example.pixel_project2.profile.dto.UpdateDesignerProfileRequest;
import com.example.pixel_project2.profile.dto.UpdateProfileRequest;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ProfileServiceImpl implements ProfileService {
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final FollowRepository followRepository;
    private final DesignerRepository designerRepository;
    private final MessageReviewRepository messageReviewRepository;
    private final ObjectMapper objectMapper;

    @Override
    public ProfileResponse getMyProfile(AuthenticatedUser currentUser) {
        User user = findUserById(currentUser.id());
        return toProfileResponse(user, currentUser);
    }

    @Override
    public ProfileResponse getProfile(String profileKey, AuthenticatedUser currentUser) {
        User user = resolveProfileUser(profileKey, currentUser);
        return toProfileResponse(user, currentUser);
    }

    @Override
    public List<ProfileFeedResponse> getMyProfileFeeds(AuthenticatedUser currentUser) {
        return getPortfolioFeeds(findUserById(currentUser.id()));
    }

    @Override
    public List<ProfileFeedResponse> getProfileFeeds(String profileKey, AuthenticatedUser currentUser) {
        return getPortfolioFeeds(resolveProfileUser(profileKey, currentUser));
    }

    @Override
    public List<ProfileReviewResponse> getMyProfileReviews(AuthenticatedUser currentUser) {
        return getProjectReviews(findUserById(currentUser.id()));
    }

    @Override
    public List<ProfileReviewResponse> getProfileReviews(String profileKey, AuthenticatedUser currentUser) {
        return getProjectReviews(resolveProfileUser(profileKey, currentUser));
    }

    @Override
    @Transactional
    public ProfileResponse updateMyProfile(AuthenticatedUser currentUser, UpdateProfileRequest request) {
        User user = findUserById(currentUser.id());
        String nickname = request.nickname().trim();

        if (userRepository.countByNicknameAndIdNot(nickname, user.getId()) > 0) {
            throw new IllegalArgumentException("이미 사용 중인 닉네임입니다.");
        }

        user.setName(request.name().trim());
        user.setNickname(nickname);
        user.setUrl(normalizeOptionalValue(request.url()));
        user.setLocation(normalizeOptionalValue(request.location()));

        return toProfileResponse(userRepository.save(user), currentUser);
    }

    @Override
    @Transactional
    public ProfileResponse updateMyDesignerProfile(AuthenticatedUser currentUser, UpdateDesignerProfileRequest request) {
        User user = findUserById(currentUser.id());
        if (user.getRole() != UserRole.DESIGNER) {
            throw new IllegalArgumentException("디자이너만 디자이너 프로필을 수정할 수 있습니다.");
        }

        Designer designer = designerRepository.findById(user.getId())
                .orElseGet(() -> Designer.builder()
                        .user(user)
                        .rating(0.0F)
                        .build());

        designer.setJob(normalizeOptionalValue(request.job()));
        designer.setIntroduction(normalizeOptionalValue(request.introduction()));
        designer.setWorkStatus(resolveWorkStatus(request.workStatus()));
        designer.setWorkType(resolveWorkType(request.workType()));
        designer.setFigmaUrl(normalizeOptionalValue(request.figmaUrl()));
        designer.setPhotoshopUrl(normalizeOptionalValue(request.photoshopUrl()));
        designer.setAdobeUrl(normalizeOptionalValue(request.adobeUrl()));

        Designer savedDesigner = designerRepository.save(designer);
        user.setDesigner(savedDesigner);

        return toProfileResponse(user, currentUser);
    }

    private List<ProfileFeedResponse> getPortfolioFeeds(User user) {
        return postRepository.findByUserIdAndTypeWithDetails(user.getId(), PostType.PORTFOLIO)
                .stream()
                .map(this::toFeedResponse)
                .toList();
    }

    private List<ProfileReviewResponse> getProjectReviews(User user) {
        return messageReviewRepository.findAllByRevieweeIdWithUsers(user.getId())
                .stream()
                .map(this::toReviewResponse)
                .toList();
    }

    private ProfileResponse toProfileResponse(User user, AuthenticatedUser currentUser) {
        Designer designer = user.getDesigner();
        boolean owner = user.getId().equals(currentUser.id());

        return ProfileResponse.builder()
                .userId(user.getId())
                .loginId(user.getLoginId())
                .name(user.getName())
                .nickname(user.getNickname())
                .role(user.getRole().name())
                .profileImage(user.getProfileImage())
                .url(user.getUrl())
                .location(user.getLocation())
                .followCount(user.getFollowCount())
                .followerCount(followRepository.countFollowers(user.getId()))
                .followingCount(followRepository.countFollowing(user.getId()))
                .job(designer == null ? null : designer.getJob())
                .introduction(designer == null ? null : designer.getIntroduction())
                .rating(designer == null ? null : designer.getRating())
                .workStatus(designer == null || designer.getWorkStatus() == null ? null : designer.getWorkStatus().name())
                .workType(designer == null || designer.getWorkType() == null ? null : designer.getWorkType().name())
                .figmaUrl(designer == null ? null : designer.getFigmaUrl())
                .photoshopUrl(designer == null ? null : designer.getPhotoshopUrl())
                .adobeUrl(designer == null ? null : designer.getAdobeUrl())
                .owner(owner)
                .following(!owner && followRepository.countRelation(currentUser.id(), user.getId()) > 0)
                .build();
    }

    private ProfileFeedResponse toFeedResponse(Post post) {
        List<PostImage> images = post.getImages().stream()
                .sorted(Comparator
                        .comparing((PostImage image) -> image.getSortOrder() == null ? Integer.MAX_VALUE : image.getSortOrder())
                        .thenComparing(PostImage::getImage_id))
                .toList();
        List<String> imageUrls = images.stream()
                .map(PostImage::getImageUrl)
                .toList();
        Feed feed = post.getFeed();
        String categoryLabel = post.getCategory() == null ? null : post.getCategory().getLabel();

        return ProfileFeedResponse.builder()
                .postId(post.getId())
                .title(post.getTitle())
                .description(feed == null ? null : feed.getDescription())
                .pickCount(post.getPickCount())
                .commentCount(commentRepository.countByPostId(post.getId()))
                .category(categoryLabel)
                .categoryCode(post.getCategory() == null ? null : post.getCategory().name())
                .portfolioUrl(feed == null ? null : feed.getPortfolioUrl())
                .imageUrls(imageUrls)
                .thumbnailImageUrl(imageUrls.isEmpty() ? null : imageUrls.get(0))
                .tags(categoryLabel == null ? List.of() : List.of("#" + categoryLabel))
                .createdAt(post.getCreatedAt())
                .build();
    }

    private ProfileReviewResponse toReviewResponse(MessageReview review) {
        User reviewer = review.getReviewer();
        return ProfileReviewResponse.builder()
                .reviewId(review.getId())
                .projectId(review.getConversation().getId())
                .projectTitle(review.getProjectTitle())
                .reviewerId(reviewer.getId())
                .reviewerName(reviewer.getName())
                .reviewerNickname(reviewer.getNickname())
                .reviewerProfileImage(reviewer.getProfileImage())
                .rating(review.getRating())
                .content(review.getContent())
                .workCategories(readStringList(review.getWorkCategoriesJson()))
                .complimentTags(readStringList(review.getComplimentTagsJson()))
                .createdAt(review.getCreatedAt())
                .build();
    }

    private List<String> readStringList(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }

        try {
            return objectMapper.readValue(
                    json,
                    objectMapper.getTypeFactory().constructCollectionType(List.class, String.class)
            );
        } catch (JsonProcessingException e) {
            return List.of();
        }
    }

    private User resolveProfileUser(String profileKey, AuthenticatedUser currentUser) {
        if (profileKey == null || profileKey.isBlank() || "me".equalsIgnoreCase(profileKey)) {
            return findUserById(currentUser.id());
        }

        String trimmedProfileKey = profileKey.trim();
        Optional<User> numericUser = parseUserId(trimmedProfileKey).flatMap(userRepository::findById);
        if (numericUser.isPresent()) {
            return numericUser.get();
        }

        return userRepository.findByNickname(trimmedProfileKey)
                .or(() -> userRepository.findByloginId(trimmedProfileKey))
                .orElseThrow(() -> new IllegalArgumentException("프로필 사용자를 찾을 수 없습니다."));
    }

    private Optional<Long> parseUserId(String profileKey) {
        try {
            return Optional.of(Long.parseLong(profileKey));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private User findUserById(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("프로필 사용자를 찾을 수 없습니다."));
    }

    private String normalizeOptionalValue(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }

    private WorkStatus resolveWorkStatus(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return WorkStatus.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("알 수 없는 작업 상태입니다.");
        }
    }

    private WorkType resolveWorkType(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }

        try {
            return WorkType.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("알 수 없는 작업 형태입니다.");
        }
    }
}
