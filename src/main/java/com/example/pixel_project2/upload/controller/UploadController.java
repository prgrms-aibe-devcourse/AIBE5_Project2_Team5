package com.example.pixel_project2.upload.controller;

import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.upload.dto.FeedImagesUploadResponse;
import com.example.pixel_project2.upload.dto.ProfileImageUploadResponse;
import com.example.pixel_project2.upload.service.UploadService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/uploads")
@RequiredArgsConstructor
public class UploadController {
    private final UploadService uploadService;

    @PostMapping(value = "/profile-image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<ProfileImageUploadResponse> uploadProfileImage(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam("file") MultipartFile file
    ) {
        return ApiResponse.ok("Profile image uploaded.", uploadService.uploadProfileImage(currentUser, file));
    }

    @PostMapping(value = "/feed-images", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FeedImagesUploadResponse> uploadFeedImages(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam("postId") Long postId,
            @RequestParam("files") List<MultipartFile> files
    ) {
        return ApiResponse.ok("Feed images uploaded.", uploadService.uploadFeedImages(currentUser, postId, files));
    }

    @PostMapping(value = "/feed-images/replace", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ApiResponse<FeedImagesUploadResponse> replaceFeedImages(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @RequestParam("postId") Long postId,
            @RequestParam(value = "existingImageUrls", required = false) List<String> existingImageUrls,
            @RequestParam(value = "files", required = false) List<MultipartFile> files
    ) {
        return ApiResponse.ok(
                "Feed images replaced.",
                uploadService.replaceFeedImages(currentUser, postId, existingImageUrls, files)
        );
    }
}
