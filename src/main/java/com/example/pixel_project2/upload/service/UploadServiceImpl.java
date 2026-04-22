package com.example.pixel_project2.upload.service;

import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.PostImage;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.entity.enums.PostType;
import com.example.pixel_project2.common.repository.PostImageRepository;
import com.example.pixel_project2.common.repository.PostRepository;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.upload.dto.FeedImagesUploadResponse;
import com.example.pixel_project2.upload.dto.ProfileImageUploadResponse;
import com.example.pixel_project2.upload.dto.StoredImage;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class UploadServiceImpl implements UploadService {
    private static final int MAX_FEED_IMAGES = 4;

    private final R2StorageService r2StorageService;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;

    @Override
    @Transactional
    public ProfileImageUploadResponse uploadProfileImage(AuthenticatedUser currentUser, MultipartFile file) {
        User user = userRepository.findById(currentUser.id())
                .orElseThrow(() -> new IllegalArgumentException("User not found."));

        StoredImage storedImage = r2StorageService.uploadImage(file, "profiles/" + user.getId());
        user.setProfileImage(storedImage.url());
        userRepository.save(user);

        return new ProfileImageUploadResponse(storedImage.url());
    }

    @Override
    @Transactional
    public FeedImagesUploadResponse uploadFeedImages(AuthenticatedUser currentUser, Long postId, List<MultipartFile> files) {
        if (postId == null) {
            throw new IllegalArgumentException("Feed id is required.");
        }
        if (files == null || files.isEmpty()) {
            throw new IllegalArgumentException("At least one image file is required.");
        }

        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Feed not found."));
        if (post.getPostType() != PostType.PORTFOLIO) {
            throw new IllegalArgumentException("Only portfolio feeds can have feed images.");
        }
        if (!post.getUser().getId().equals(currentUser.id())) {
            throw new IllegalArgumentException("You can only upload images to your own feeds.");
        }

        List<PostImage> existingImages = postImageRepository.findByPost_IdOrderBySortOrderAsc(post.getId());
        if (existingImages.size() + files.size() > MAX_FEED_IMAGES) {
            throw new IllegalArgumentException("Feed images can be up to 4 files.");
        }

        int nextSortOrder = existingImages.stream()
                .map(PostImage::getSortOrder)
                .filter(sortOrder -> sortOrder != null)
                .max(Comparator.naturalOrder())
                .orElse(0) + 1;

        List<PostImage> savedImages = new ArrayList<>();
        for (MultipartFile file : files) {
            StoredImage storedImage = r2StorageService.uploadImage(file, "feeds/" + post.getId());
            PostImage postImage = PostImage.builder()
                    .post(post)
                    .imageUrl(storedImage.url())
                    .sortOrder(nextSortOrder++)
                    .build();
            savedImages.add(postImageRepository.save(postImage));
        }

        List<String> imageUrls = new ArrayList<>();
        existingImages.stream()
                .map(PostImage::getImageUrl)
                .forEach(imageUrls::add);
        savedImages.stream()
                .map(PostImage::getImageUrl)
                .forEach(imageUrls::add);

        String thumbnailImageUrl = imageUrls.isEmpty() ? null : imageUrls.get(0);
        return new FeedImagesUploadResponse(post.getId(), imageUrls, thumbnailImageUrl);
    }
}
