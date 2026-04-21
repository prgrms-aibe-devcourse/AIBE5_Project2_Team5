package com.example.pixel_project2.feed.service;

import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.PostImage;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.common.repository.CommentRepository;
import com.example.pixel_project2.common.repository.PostImageRepository;
import com.example.pixel_project2.common.repository.PostRepository;
import com.example.pixel_project2.feed.dto.FeedItemResponse;
import com.example.pixel_project2.feed.dto.FeedListResponse;
import com.example.pixel_project2.feed.dto.FeedPolicyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class FeedServiceImpl implements FeedService {
    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final CommentRepository commentRepository;

    @Override
    public FeedListResponse getFeeds(PostType postType, int page, int size) {
        PageRequest pageRequest = PageRequest.of(page, size);
        Page<Post> posts = postType == null
                ? postRepository.findAll(pageRequest)
                : postRepository.findByPostType(postType, pageRequest);

        List<FeedItemResponse> feeds = posts.getContent().stream()
                .map(this::toFeedItemResponse)
                .toList();

        return new FeedListResponse(feeds, page, size, posts.hasNext());
    }

    @Override
    public FeedPolicyResponse getFeedDetailPolicy() {
        return new FeedPolicyResponse(true, true, true);
    }

    private FeedItemResponse toFeedItemResponse(Post post) {
        List<PostImage> postImages = postImageRepository.findByPostIdOrderBySortOrderAsc(post.getId());
        String thumbnailUrl = postImages.isEmpty() ? null : postImages.get(0).getImageUrl();

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
