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
import com.example.pixel_project2.feed.dto.CreateCommentRequest;
import com.example.pixel_project2.feed.dto.CreateCommentResponse;
import com.example.pixel_project2.feed.dto.CreateFeedRequest;
import com.example.pixel_project2.feed.dto.CreateFeedResponse;
import com.example.pixel_project2.feed.dto.DeleteFeedResponse;
import com.example.pixel_project2.feed.dto.FeedItemResponse;
import com.example.pixel_project2.feed.dto.FeedListResponse;
import com.example.pixel_project2.feed.dto.FeedPolicyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

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
    public FeedPolicyResponse getFeedDetailPolicy() {
        return new FeedPolicyResponse(true, true, true);
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
                post.getUser().getId(),
                post.getTitle(),
                post.getUser().getNickname(),
                thumbnailUrl,
                post.getPickCount(),
                Math.toIntExact(commentRepository.countByPost_Id(post.getId())),
                post.getPostType().name(),
                post.getCategory().name()
        );
    }
}
