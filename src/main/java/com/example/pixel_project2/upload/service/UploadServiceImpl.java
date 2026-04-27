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
import com.example.pixel_project2.upload.dto.MessageAttachmentUploadItemResponse;
import com.example.pixel_project2.upload.dto.MessageAttachmentsUploadResponse;
import com.example.pixel_project2.upload.dto.ProfileImageUploadResponse;
import com.example.pixel_project2.upload.dto.StoredFile;
import com.example.pixel_project2.upload.dto.StoredImage;
import com.example.pixel_project2.message.service.MessageService;
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
    private static final int MAX_MESSAGE_ATTACHMENTS = 8;

    private final R2StorageService r2StorageService;
    private final UserRepository userRepository;
    private final PostRepository postRepository;
    private final PostImageRepository postImageRepository;
    private final MessageService messageService;

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
        List<MultipartFile> imageFiles = normalizeImageFiles(files);
        if (imageFiles.isEmpty()) {
            throw new IllegalArgumentException("At least one image file is required.");
        }

        Post post = getOwnedPostWithImagesPermission(currentUser, postId);

        List<PostImage> existingImages = postImageRepository.findByPost_IdOrderBySortOrderAsc(post.getId());
        if (existingImages.size() + imageFiles.size() > MAX_FEED_IMAGES) {
            throw new IllegalArgumentException("Feed images can be up to " + MAX_FEED_IMAGES + " files.");
        }

        int nextSortOrder = existingImages.stream()
                .map(PostImage::getSortOrder)
                .filter(sortOrder -> sortOrder != null)
                .max(Comparator.naturalOrder())
                .orElse(0) + 1;

        List<PostImage> savedImages = new ArrayList<>();
        for (MultipartFile file : imageFiles) {
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

    @Override
    @Transactional
    public FeedImagesUploadResponse replaceFeedImages(
            AuthenticatedUser currentUser,
            Long postId,
            List<String> existingImageUrls,
            List<MultipartFile> files
    ) {
        if (postId == null) {
            throw new IllegalArgumentException("Feed id is required.");
        }

        Post post = getOwnedPostWithImagesPermission(currentUser, postId);
        List<PostImage> existingImages = postImageRepository.findByPost_IdOrderBySortOrderAsc(post.getId());
        List<String> keptImageUrls = normalizeExistingImageUrls(existingImageUrls, existingImages);
        List<MultipartFile> imageFiles = normalizeImageFiles(files);

        if (keptImageUrls.size() + imageFiles.size() > MAX_FEED_IMAGES) {
            throw new IllegalArgumentException("Feed images can be up to " + MAX_FEED_IMAGES + " files.");
        }

        postImageRepository.deleteByPostId(post.getId());
        postImageRepository.flush();

        List<String> imageUrls = new ArrayList<>();
        int sortOrder = 1;
        for (String imageUrl : keptImageUrls) {
            PostImage postImage = PostImage.builder()
                    .post(post)
                    .imageUrl(imageUrl)
                    .sortOrder(sortOrder++)
                    .build();
            imageUrls.add(postImageRepository.save(postImage).getImageUrl());
        }

        for (MultipartFile file : imageFiles) {
            StoredImage storedImage = r2StorageService.uploadImage(file, "feeds/" + post.getId());
            PostImage postImage = PostImage.builder()
                    .post(post)
                    .imageUrl(storedImage.url())
                    .sortOrder(sortOrder++)
                    .build();
            imageUrls.add(postImageRepository.save(postImage).getImageUrl());
        }

        String thumbnailImageUrl = imageUrls.isEmpty() ? null : imageUrls.get(0);
        return new FeedImagesUploadResponse(post.getId(), imageUrls, thumbnailImageUrl);
    }

    @Override
    @Transactional(readOnly = true)
    public MessageAttachmentsUploadResponse uploadMessageAttachments(
            AuthenticatedUser currentUser,
            Long conversationId,
            List<MultipartFile> files
    ) {
        if (conversationId == null) {
            throw new IllegalArgumentException("Conversation id is required.");
        }
        if (!messageService.canAccessConversation(currentUser, conversationId)) {
            throw new IllegalArgumentException("대화에 접근할 권한이 없습니다.");
        }

        List<MultipartFile> attachmentFiles = normalizeFiles(files);
        if (attachmentFiles.isEmpty()) {
            throw new IllegalArgumentException("At least one attachment file is required.");
        }
        if (attachmentFiles.size() > MAX_MESSAGE_ATTACHMENTS) {
            throw new IllegalArgumentException("Message attachments can be up to " + MAX_MESSAGE_ATTACHMENTS + " files.");
        }

        List<MessageAttachmentUploadItemResponse> attachments = new ArrayList<>();
        String prefix = "messages/" + conversationId + "/" + currentUser.id();

        for (MultipartFile file : attachmentFiles) {
            String contentType = file.getContentType() == null ? "" : file.getContentType().trim().toLowerCase();
            String fileName = normalizeFileName(file.getOriginalFilename());

            if (contentType.startsWith("image/")) {
                StoredImage storedImage = r2StorageService.uploadImage(file, prefix);
                attachments.add(new MessageAttachmentUploadItemResponse(
                        "image",
                        fileName,
                        storedImage.url(),
                        storedImage.contentType(),
                        storedImage.size()
                ));
                continue;
            }

            StoredFile storedFile = r2StorageService.uploadFile(file, prefix);
            attachments.add(new MessageAttachmentUploadItemResponse(
                    "file",
                    fileName,
                    storedFile.url(),
                    storedFile.contentType(),
                    storedFile.size()
            ));
        }

        return new MessageAttachmentsUploadResponse(conversationId, attachments);
    }

    private Post getOwnedPostWithImagesPermission(AuthenticatedUser currentUser, Long postId) {
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("Feed not found."));
        if (post.getPostType() != PostType.PORTFOLIO && post.getPostType() != PostType.JOB_POST) {
            throw new IllegalArgumentException("Only portfolio feeds and job posts can have images.");
        }
        if (!post.getUser().getId().equals(currentUser.id())) {
            throw new IllegalArgumentException("You can only upload images to your own feeds.");
        }

        return post;
    }

    private List<MultipartFile> normalizeImageFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        return files.stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();
    }

    private List<MultipartFile> normalizeFiles(List<MultipartFile> files) {
        if (files == null || files.isEmpty()) {
            return List.of();
        }

        return files.stream()
                .filter(file -> file != null && !file.isEmpty())
                .toList();
    }

    private List<String> normalizeExistingImageUrls(List<String> existingImageUrls, List<PostImage> existingImages) {
        if (existingImageUrls == null || existingImageUrls.isEmpty()) {
            return List.of();
        }

        List<String> allowedUrls = existingImages.stream()
                .map(PostImage::getImageUrl)
                .toList();
        List<String> imageUrls = new ArrayList<>();
        for (String existingImageUrl : existingImageUrls) {
            if (existingImageUrl == null || existingImageUrl.isBlank()) {
                continue;
            }

            String imageUrl = existingImageUrl.trim();
            if (!allowedUrls.contains(imageUrl)) {
                throw new IllegalArgumentException("Unknown feed image.");
            }
            if (!imageUrls.contains(imageUrl)) {
                imageUrls.add(imageUrl);
            }
        }

        return imageUrls;
    }

    private String normalizeFileName(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "attachment";
        }

        String normalized = originalFilename.trim();
        return normalized.length() > 200 ? normalized.substring(normalized.length() - 200) : normalized;
    }
}
