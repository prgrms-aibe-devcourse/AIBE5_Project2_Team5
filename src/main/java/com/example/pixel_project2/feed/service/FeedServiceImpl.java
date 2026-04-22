package com.example.pixel_project2.feed.service;

import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.PostImage;
import com.example.pixel_project2.common.entity.Comment;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.common.repository.CommentRepository;
import com.example.pixel_project2.common.repository.PostRepository;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.feed.dto.CreateCommentRequest;
import com.example.pixel_project2.feed.dto.CreateCommentResponse;
import com.example.pixel_project2.feed.dto.FeedItemResponse;
import com.example.pixel_project2.feed.dto.FeedListResponse;
import com.example.pixel_project2.feed.dto.FeedPolicyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedServiceImpl implements FeedService {
    private final PostRepository postRepository;
    private final CommentRepository commentRepository;
    private final UserRepository userRepository;

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
                Math.toIntExact(commentRepository.countByPost_Id(post.getId())),
                post.getPostType().name(),
                post.getCategory().name()
        );
    }
}
