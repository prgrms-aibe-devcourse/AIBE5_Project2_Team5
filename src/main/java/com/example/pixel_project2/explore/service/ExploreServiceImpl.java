package com.example.pixel_project2.explore.service;

import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.PostImage;
import com.example.pixel_project2.common.entity.enums.Category;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.common.repository.PostRepository;
import com.example.pixel_project2.explore.dto.ExploreDesignerResponseDto;
import com.example.pixel_project2.explore.dto.ExplorePostResponseDto;
import com.example.pixel_project2.explore.dto.ExplorePolicyResponse;
import com.example.pixel_project2.explore.repository.ExplorerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class ExploreServiceImpl implements ExploreService {

    private final PostRepository postRepository;
    private final ExplorerRepository explorerRepository;

    @Override
    public List<ExplorePostResponseDto> getExploreFeeds(String categoryName, int page, int size, String keyword) {
        Pageable pageable = PageRequest.of(page, size);
        
        Category category = null;
        if (categoryName != null && 
            !categoryName.equalsIgnoreCase("all") && 
            !categoryName.equalsIgnoreCase("전체") && 
            !categoryName.isBlank()) {
            category = Category.fromLabel(categoryName);
        }

        List<Post> posts = postRepository.findExploreFeeds(PostType.PORTFOLIO, category, keyword, pageable);

        return posts.stream()
                .map(this::convertToDto)
                .collect(Collectors.toList());
    }

    @Override
    public ExplorePolicyResponse getExplorePolicy() {
        return new ExplorePolicyResponse(true, true, true);
    }

    @Override
    public List<ExploreDesignerResponseDto> getExploreDesigners(String keyword, int page, int size) {
        Pageable pageable = PageRequest.of(page, size);
        
        // 1. 디자이너 기본 정보 및 작품 개수 조회 (페이징/검색 적용)
        List<ExploreDesignerResponseDto> designers = explorerRepository.findExploreDesigners(keyword, pageable).getContent();

        // 2. 각 디자이너별 가장 최근 작업물 이미지를 배너로 세팅
        designers.forEach(designer -> {
            String latestImageUrl = explorerRepository.findLatestPostImageByUserId(designer.getUserId());
            designer.setBannerImage(latestImageUrl);
        });

        return designers;
    }

    private ExplorePostResponseDto convertToDto(Post post) {
        String firstImageUrl = post.getImages().stream()
                .filter(img -> img.getSortOrder() != null && img.getSortOrder() == 1)
                .map(PostImage::getImageUrl)
                .findFirst()
                .orElse(post.getImages().isEmpty() ? null : post.getImages().get(0).getImageUrl());

        String job = (post.getUser().getDesigner() != null) ? post.getUser().getDesigner().getJob() : null;
        String description = (post.getFeed() != null) ? post.getFeed().getDescription() : null;

        return ExplorePostResponseDto.builder()
                .postId(post.getId())
                .title(post.getTitle())
                .nickname(post.getUser().getNickname())
                .pickCount(post.getPickCount())
                .imageUrl(firstImageUrl)
                .profileImage(post.getUser().getProfileImage())
                .category(post.getCategory() != null ? post.getCategory().getLabel() : null)
                .job(job)
                .description(description)
                .build();
    }
}

