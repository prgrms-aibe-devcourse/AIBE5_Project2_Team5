package com.example.pixel_project2.explore.service;

import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.PostImage;
import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.common.repository.PostRepository;
import com.example.pixel_project2.explore.dto.ExplorePostResponseDto;
import com.example.pixel_project2.explore.dto.ExplorePolicyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExploreServiceImpl implements ExploreService {

    private final PostRepository postRepository;

    @Override
    public List<ExplorePostResponseDto> getExploreFeeds(String categoryName) {
        List<Post> posts;

        if (categoryName == null || categoryName.equalsIgnoreCase("all") || categoryName.isBlank()) {
            posts = postRepository.findByPostType(PostType.PORTFOLIO, null).getContent();
        } else {
            Category category;
            try {
                category = Category.valueOf(categoryName);
            } catch (IllegalArgumentException e) {
                return List.of();
            }
            posts = postRepository.findByPostTypeAndCategory(PostType.PORTFOLIO, category);
        }

        return posts.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public ExplorePolicyResponse getExplorePolicy() {
        // 기존 코드 유지
        return new ExplorePolicyResponse(true, true, true);
    }

    private ExplorePostResponseDto convertToDto(Post post) {
        String firstImageUrl = post.getImages().stream()
                .filter(img -> img.getSortOrder() != null && img.getSortOrder() == 1)
                .map(PostImage::getImageUrl)
                .findFirst()
                .orElse(post.getImages().isEmpty() ? null : post.getImages().get(0).getImageUrl());

        return ExplorePostResponseDto.builder()
                .postId(post.getId())
                .title(post.getTitle())
                .nickname(post.getUser().getNickname())
                .pickCount(post.getPickCount())
                .imageUrl(firstImageUrl)
                .build();
    }
}
