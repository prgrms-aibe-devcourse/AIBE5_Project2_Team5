package com.example.pixel_project2.upload.service;

import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.upload.dto.FeedImagesUploadResponse;
import com.example.pixel_project2.upload.dto.ProfileImageUploadResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface UploadService {
    ProfileImageUploadResponse uploadProfileImage(AuthenticatedUser currentUser, MultipartFile file);

    FeedImagesUploadResponse uploadFeedImages(AuthenticatedUser currentUser, Long postId, List<MultipartFile> files);

    FeedImagesUploadResponse replaceFeedImages(
            AuthenticatedUser currentUser,
            Long postId,
            List<String> existingImageUrls,
            List<MultipartFile> files
    );
}
