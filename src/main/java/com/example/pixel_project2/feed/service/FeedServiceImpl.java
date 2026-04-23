package com.example.pixel_project2.feed.service;

import com.example.pixel_project2.common.entity.Comment;
import com.example.pixel_project2.common.entity.Feed;
import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.PostImage;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.common.entity.enums.UserRole;
import com.example.pixel_project2.common.repository.CollectionRepository;
import com.example.pixel_project2.common.repository.CommentRepository;
import com.example.pixel_project2.common.repository.FeedRepository;
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
import com.example.pixel_project2.feed.dto.UpdateCommentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;

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

    @Override
    public FeedListResponse getFeeds(PostType postType) {
        PostType resolvedPostType = postType == null ? PostType.PORTFOLIO : postType;
        List<Post> posts = postRepository.findAllByTypeWithDetails(resolvedPostType);
        List<FeedItemResponse> feeds = posts.stream()
                .map(this::toFeedItemResponse)
                .toList();

        return new FeedListResponse(feeds);
    }

    @Override
    @Transactional(readOnly = true)
    public FeedDetailResponse getFeedDetail(Long feedId, Long userId) {
        Post post = postRepository.findByIdWithDetails(feedId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 피드입니다."));

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
                post.getUser().getProfileImage(),
                post.getUser().getRole().name(),
                post.getPostType().name(),
                post.getCategory().name(),
                post.getPickCount(),
                commentRepository.countByPostId(post.getId()),
                feed != null ? feed.getPortfolioUrl() : null,
                post.getCreatedAt(),
                imageUrls,
                post.getUser().getId().equals(userId)
        );
    }

    @Override
    @Transactional(readOnly = true)
    public CommentListResponse getComments(Long postId, Long userId) {
        if (!postRepository.existsById(postId)) {
            throw new IllegalArgumentException("존재하지 않는 게시글입니다.");
        }

        List<CommentItemResponse> comments = commentRepository.findAllByPostId(postId).stream()
                .map(comment -> new CommentItemResponse(
                        comment.getCommentId(),
                        comment.getUser().getId(),
                        comment.getUser().getNickname(),
                        comment.getUser().getProfileImage(),
                        comment.getUser().getRole().name(),
                        comment.getDescription(),
                        "작성됨",
                        comment.getUser().getId().equals(userId)
                ))
                .toList();

        return new CommentListResponse(comments);
    }

    @Override
    public CreateCommentResponse createComment(Long postId, Long userId, CreateCommentRequest request) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 게시글입니다."));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 사용자입니다."));

        Comment comment = Comment.builder()
                .post(post)
                .user(user)
                .description(request.description().trim())
                .build();

        Comment savedComment = commentRepository.save(comment);

        return new CreateCommentResponse(
                savedComment.getCommentId(),
                post.getId(),
                user.getId(),
                user.getNickname(),
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
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 댓글입니다."));

        if (!comment.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("본인이 작성한 댓글만 수정 또는 삭제할 수 있습니다.");
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

    private FeedItemResponse toFeedItemResponse(Post post) {
        String thumbnailUrl = post.getImages().stream()
                .filter(image -> image.getSortOrder() != null && image.getSortOrder() == 1)
                .map(PostImage::getImageUrl)
                .findFirst()
                .orElse(post.getImages().isEmpty() ? null : post.getImages().get(0).getImageUrl());

        return new FeedItemResponse(
                post.getId(),
                post.getTitle(),
                post.getUser().getNickname(),
                thumbnailUrl,
                post.getPickCount(),
                Math.toIntExact(commentRepository.countByPostId(post.getId())),
                post.getPostType().name(),
                post.getCategory().name()
        );
    }
}
