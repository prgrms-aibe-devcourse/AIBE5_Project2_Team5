package com.example.pixel_project2.feed.service;

import com.example.pixel_project2.common.entity.Comment;
import com.example.pixel_project2.common.entity.Feed;
import com.example.pixel_project2.common.entity.PickCount;
import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.PostImage;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.common.entity.enums.NotificationType;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.repository.CollectionRepository;
import com.example.pixel_project2.common.repository.CommentRepository;
import com.example.pixel_project2.common.repository.FeedRepository;
import com.example.pixel_project2.common.repository.FollowRepository;
import com.example.pixel_project2.common.repository.PickCountRepository;
import com.example.pixel_project2.common.repository.PostImageRepository;
import com.example.pixel_project2.common.repository.PostRepository;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.feed.dto.CommentItemResponse;
import com.example.pixel_project2.feed.dto.CommentListResponse;
import com.example.pixel_project2.feed.dto.CreateCommentRequest;
import com.example.pixel_project2.feed.dto.CreateCommentResponse;
import com.example.pixel_project2.feed.dto.CreateFeedRequest;
import com.example.pixel_project2.feed.dto.CreateFeedResponse;
import com.example.pixel_project2.feed.dto.DeleteCommentResponse;
import com.example.pixel_project2.feed.dto.DeleteFeedResponse;
import com.example.pixel_project2.feed.dto.FeedDetailResponse;
import com.example.pixel_project2.feed.dto.FeedItemResponse;
import com.example.pixel_project2.feed.dto.FeedListResponse;
import com.example.pixel_project2.feed.dto.FeedPickResponse;
import com.example.pixel_project2.feed.dto.UpdateCommentResponse;
import com.example.pixel_project2.notification.service.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.PageRequest;

import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Optional;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class FeedServiceImpl implements FeedService {
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final FeedRepository feedRepository;
    private final CommentRepository commentRepository;
    private final PickCountRepository pickCountRepository;
    private final PostImageRepository postImageRepository;
    private final CollectionRepository collectionRepository;
    private final FollowRepository followRepository;
    private final NotificationService notificationService;

    @Override
    @Transactional(readOnly = true)
    public FeedListResponse getFeeds(PostType postType, Long cursor, int size, Long userId) {
        PostType resolvedPostType = postType == null ? PostType.PORTFOLIO : postType;
        List<Long> followingUserIds = followRepository.findFollowingUserIds(userId);

        // size+1 조회로 hasNext 판단 (No-Offset 커서 기반)
        PageRequest pageable = PageRequest.of(0, size + 1);
        List<Long> postIds;

        if (followingUserIds.isEmpty()) {
            postIds = cursor == null
                    ? postRepository.findTopIdsByType(resolvedPostType, pageable)
                    : postRepository.findNextIdsByType(resolvedPostType, cursor, pageable);
        } else {
            Set<Long> userIds = new HashSet<>(followingUserIds);
            userIds.add(userId);
            postIds = cursor == null
                    ? postRepository.findTopIdsByTypeAndUsers(resolvedPostType, userIds, pageable)
                    : postRepository.findNextIdsByTypeAndUsers(resolvedPostType, userIds, cursor, pageable);
        }

        boolean hasNext = postIds.size() > size;
        List<Long> pageIds = hasNext ? postIds.subList(0, size) : postIds;

        if (pageIds.isEmpty()) {
            return new FeedListResponse(List.of(), null, false);
        }

        // ID 목록으로 상세 일괄 조회 (컬렉션 fetch join은 Pageable 없이 사용해야 in-memory 페이징 회피)
        List<Post> posts = postRepository.findAllByIdsWithDetails(pageIds);
        posts.sort(Comparator.comparing(Post::getId).reversed());

        List<FeedItemResponse> feeds = posts.stream()
                .map(post -> toFeedItemResponse(post, userId))
                .toList();

        Long nextCursor = hasNext ? pageIds.get(pageIds.size() - 1) : null;
        return new FeedListResponse(feeds, nextCursor, hasNext);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedDetailResponse getFeedDetail(Long feedId, Long userId) {
        Post post = postRepository.findByIdWithDetails(feedId)
                .orElseThrow(() -> new IllegalArgumentException("피드를 찾을 수 없습니다."));

        Feed feed = post.getFeed();
        List<String> imageUrls = post.getImages().stream()
                .sorted(Comparator.comparing(image -> image.getSortOrder() == null ? Integer.MAX_VALUE : image.getSortOrder()))
                .map(PostImage::getImageUrl)
                .toList();

        return new FeedDetailResponse(
                post.getId(),
                post.getUser().getId(),
                post.getTitle(),
                feed != null && feed.getDescription() != null ? feed.getDescription() : "",
                post.getUser().getNickname(),
                resolveProfileKey(post.getUser()),
                post.getUser().getProfileImage(),
                resolveDisplayJob(post),
                post.getUser().getRole().name(),
                post.getPostType().name(),
                post.getCategory().name(),
                post.getPickCount(),
                commentRepository.countByPostId(post.getId()),
                feed != null ? feed.getPortfolioUrl() : null,
                post.getCreatedAt(),
                imageUrls,
                pickCountRepository.existsByUserIdAndPostId(userId, post.getId()),
                post.getUser().getId().equals(userId)
        );
    }

    @Override
    @Transactional
    public FeedPickResponse toggleFeedPick(Long feedId, Long userId) {
        Post post = postRepository.findById(feedId)
                .orElseThrow(() -> new IllegalArgumentException("Feed not found."));
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        Optional<PickCount> existingPick = pickCountRepository.findByUserIdAndPostId(userId, feedId);
        int currentPickCount = post.getPickCount() == null ? 0 : post.getPickCount();
        boolean picked;

        if (existingPick.isPresent()) {
            pickCountRepository.delete(existingPick.get());
            post.setPickCount(Math.max(0, currentPickCount - 1));
            picked = false;
        } else {
            pickCountRepository.save(PickCount.builder()
                    .user(user)
                    .post(post)
                    .build());
            post.setPickCount(currentPickCount + 1);
            picked = true;

            if (!post.getUser().getId().equals(userId)) {
                notificationService.createNotification(
                        post.getUser().getId(),
                        userId,
                        NotificationType.LIKE,
                        post.getId(),
                        user.getNickname() + "님이 회원님의 게시물을 좋아합니다."
                );
            }
        }

        postRepository.save(post);
        return new FeedPickResponse(post.getId(), picked, post.getPickCount());
    }

    @Override
    @Transactional(readOnly = true)
    public CommentListResponse getComments(Long postId, Long userId) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("게시글을 찾을 수 없습니다.");
        }

        List<CommentItemResponse> comments = commentRepository.findAllByPostId(postId).stream()
                .map(comment -> new CommentItemResponse(
                        comment.getCommentId(),
                        comment.getUser().getId(),
                        comment.getUser().getNickname(),
                        comment.getUser().getProfileImage(),
                        comment.getUser().getRole().name(),
                        comment.getDescription(),
                        comment.getUser().getId().equals(userId)
                ))
                .toList();

        return new CommentListResponse(comments);
    }

    @Override
    public CreateCommentResponse createComment(Long postId, Long userId, CreateCommentRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("게시글을 찾을 수 없습니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .description(request.description().trim())
                .build();

        Comment savedComment = commentRepository.save(comment);

        if (!post.getUser().getId().equals(userId)) {
            notificationService.createNotification(
                    post.getUser().getId(),
                    userId,
                    NotificationType.COMMENT,
                    post.getId(),
                    user.getNickname() + "님이 회원님의 게시물에 댓글을 남겼습니다. " + savedComment.getDescription()
            );
        }

        return new CreateCommentResponse(
                savedComment.getCommentId(),
                post.getId(),
                user.getId(),
                user.getNickname(),
                user.getProfileImage(),
                savedComment.getDescription()
        );
    }

    @Override
    @Transactional
    public UpdateCommentResponse updateComment(Long postId, Long commentId, Long userId, CreateCommentRequest request) {
        Comment comment = getOwnedComment(postId, commentId, userId);
        comment.setDescription(request.description().trim());

        return new UpdateCommentResponse(
                comment.getCommentId(),
                comment.getPost().getId(),
                comment.getDescription()
        );
    }

    @Override
    @Transactional
    public DeleteCommentResponse deleteComment(Long postId, Long commentId, Long userId) {
        Comment comment = getOwnedComment(postId, commentId, userId);
        commentRepository.delete(comment);

        return new DeleteCommentResponse(commentId, postId);
    }

    @Override
    @Transactional
    public CreateFeedResponse createPortfolioFeed(AuthenticatedUser currentUser, CreateFeedRequest request) {
        if (currentUser.role() != UserRole.DESIGNER) {
            throw new IllegalArgumentException("Only designers can create portfolio feeds.");
        }

        User user = userRepository.findById(currentUser.id())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));
        Category category = resolveCategory(request.category());

        Post post = Post.builder()
                .user(user)
                .title(request.title().trim())
                .pickCount(0)
                .postType(PostType.PORTFOLIO)
                .category(category)
                .build();
        Post savedPost = postRepository.save(post);

        Feed feed = Feed.builder()
                .post(savedPost)
                .description(request.description().trim())
                .portfolioUrl(normalizePortfolioUrl(request.portfolioUrl()))
                .build();
        Feed savedFeed = feedRepository.save(feed);

        return CreateFeedResponse.builder()
                .postId(savedPost.getId())
                .title(savedPost.getTitle())
                .description(savedFeed.getDescription())
                .pickCount(savedPost.getPickCount())
                .commentCount(0L)
                .category(category.getLabel())
                .categoryCode(category.name())
                .portfolioUrl(savedFeed.getPortfolioUrl())
                .createdAt(savedPost.getCreatedAt())
                .build();
    }

    @Override
    @Transactional
    public CreateFeedResponse updatePortfolioFeed(AuthenticatedUser currentUser, Long postId, CreateFeedRequest request) {
        Post post = findOwnedPortfolioPost(currentUser, postId);
        Category category = resolveCategory(request.category());

        post.setTitle(request.title().trim());
        post.setCategory(category);

        Feed feed = feedRepository.findById(post.getId())
                .orElseGet(() -> Feed.builder()
                        .post(post)
                        .build());
        feed.setDescription(request.description().trim());
        feed.setPortfolioUrl(normalizePortfolioUrl(request.portfolioUrl()));

        Post savedPost = postRepository.save(post);
        Feed savedFeed = feedRepository.save(feed);

        return toResponse(savedPost, savedFeed, commentRepository.countByPostId(savedPost.getId()));
    }

    @Override
    @Transactional
    public DeleteFeedResponse deletePortfolioFeed(AuthenticatedUser currentUser, Long postId) {
        Post post = findOwnedPortfolioPost(currentUser, postId);

        collectionRepository.deleteByPostId(post.getId());
        pickCountRepository.deleteByPostId(post.getId());
        commentRepository.deleteByPostId(post.getId());
        postImageRepository.deleteByPostId(post.getId());
        feedRepository.deleteById(post.getId());
        postRepository.delete(post);

        return new DeleteFeedResponse(postId);
    }

    private Comment getOwnedComment(Long postId, Long commentId, Long userId) {
        Comment comment = commentRepository.findByIdWithUserAndPost(commentId, postId)
                .orElseThrow(() -> new IllegalArgumentException("댓글을 찾을 수 없습니다."));

        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 수정하거나 삭제할 수 있습니다.");
        }

        return comment;
    }

    private Post findOwnedPortfolioPost(AuthenticatedUser currentUser, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Feed not found."));

        if (post.getPostType() != PostType.PORTFOLIO) {
            throw new IllegalArgumentException("Only portfolio feeds can be changed here.");
        }
        if (!post.getUser().getId().equals(currentUser.id())) {
            throw new IllegalArgumentException("You can only change your own feeds.");
        }

        return post;
    }

    private CreateFeedResponse toResponse(Post post, Feed feed, Long commentCount) {
        return CreateFeedResponse.builder()
                .postId(post.getId())
                .title(post.getTitle())
                .description(feed.getDescription())
                .pickCount(post.getPickCount())
                .commentCount(commentCount)
                .category(post.getCategory().getLabel())
                .categoryCode(post.getCategory().name())
                .portfolioUrl(feed.getPortfolioUrl())
                .createdAt(post.getCreatedAt())
                .build();
    }

    private Category resolveCategory(String value) {
        Category category = Category.fromLabel(value);
        if (category != null) {
            return category;
        }

        try {
            return Category.valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Unknown category.");
        }
    }

    private String normalizePortfolioUrl(String portfolioUrl) {
        if (portfolioUrl == null || portfolioUrl.isBlank()) {
            return null;
        }
        return portfolioUrl.trim();
    }

    private FeedItemResponse toFeedItemResponse(Post post, Long userId) {
        String thumbnailUrl = post.getImages().stream()
                .filter(image -> image.getSortOrder() != null && image.getSortOrder() == 1)
                .map(PostImage::getImageUrl)
                .findFirst()
                .orElse(post.getImages().isEmpty() ? null : post.getImages().get(0).getImageUrl());

        return new FeedItemResponse(
                post.getId(),
                post.getUser().getId(),
                post.getTitle(),
                post.getUser().getNickname(),
                resolveProfileKey(post.getUser()),
                post.getUser().getProfileImage(),
                resolveDisplayJob(post),
                post.getUser().getRole().name(),
                thumbnailUrl,
                post.getPickCount(),
                Math.toIntExact(commentRepository.countByPostId(post.getId())),
                post.getPostType().name(),
                post.getCategory().name(),
                pickCountRepository.existsByUserIdAndPostId(userId, post.getId())
        );
    }

    private String resolveDisplayJob(Post post) {
        if (post.getUser().getDesigner() != null) {
            String job = post.getUser().getDesigner().getJob();
            if (job != null && !job.isBlank()) {
                return job;
            }
        }
        return post.getUser().getRole().name();
    }

    private String resolveProfileKey(User user) {
        if (user.getLoginId() != null && !user.getLoginId().isBlank()) {
            return user.getLoginId();
        }
        if (user.getNickname() != null && !user.getNickname().isBlank()) {
            return user.getNickname();
        }
        return String.valueOf(user.getId());
    }
}
