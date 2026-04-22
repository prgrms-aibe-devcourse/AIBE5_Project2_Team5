package com.example.pixel_project2.collection.controller;

import com.example.pixel_project2.collection.dto.CollectionFolderDetailResponse;
import com.example.pixel_project2.collection.dto.CollectionFolderResponse;
import com.example.pixel_project2.collection.dto.CollectionPolicyResponse;
import com.example.pixel_project2.collection.dto.CreateCollectionFolderRequest;
import com.example.pixel_project2.collection.dto.RenameCollectionFolderRequest;
import com.example.pixel_project2.collection.dto.SaveFeedToCollectionRequest;
import com.example.pixel_project2.collection.service.CollectionService;
import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {
    private final CollectionService collectionService;

    @GetMapping
    public ApiResponse<List<CollectionFolderResponse>> getMyFolders(
            @AuthenticationPrincipal AuthenticatedUser currentUser
    ) {
        return ApiResponse.ok("컬렉션 폴더 목록을 불러왔습니다.", collectionService.getMyFolders(currentUser));
    }

    @GetMapping("/policy")
    public ApiResponse<CollectionPolicyResponse> getCollectionPolicy() {
        return ApiResponse.ok("컬렉션 정책을 조회했습니다.", collectionService.getCollectionPolicy());
    }

    @GetMapping("/{folderId}")
    public ApiResponse<CollectionFolderDetailResponse> getFolder(
            @PathVariable Long folderId
    ) {
        return ApiResponse.ok("컬렉션 폴더를 불러왔습니다.", collectionService.getFolder(folderId));
    }

    @PostMapping("/folders")
    public ApiResponse<CollectionFolderResponse> createFolder(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @Valid @RequestBody CreateCollectionFolderRequest request
    ) {
        return ApiResponse.ok("컬렉션 폴더를 만들었습니다.", collectionService.createFolder(currentUser, request));
    }

    @PatchMapping("/folders/{folderId}")
    public ApiResponse<CollectionFolderResponse> renameFolder(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long folderId,
            @Valid @RequestBody RenameCollectionFolderRequest request
    ) {
        return ApiResponse.ok("컬렉션 폴더 이름을 바꿨습니다.", collectionService.renameFolder(currentUser, folderId, request));
    }

    @DeleteMapping("/folders/{folderId}")
    public ApiResponse<Void> deleteFolder(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long folderId
    ) {
        collectionService.deleteFolder(currentUser, folderId);
        return ApiResponse.ok("컬렉션 폴더를 삭제했습니다.", null);
    }

    @PostMapping("/{folderId}/feeds")
    public ApiResponse<CollectionFolderDetailResponse> saveFeed(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long folderId,
            @Valid @RequestBody SaveFeedToCollectionRequest request
    ) {
        return ApiResponse.ok("피드를 컬렉션에 저장했습니다.", collectionService.saveFeed(currentUser, folderId, request));
    }

    @DeleteMapping("/{folderId}/feeds/{postId}")
    public ApiResponse<CollectionFolderDetailResponse> removeFeed(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable Long folderId,
            @PathVariable Long postId
    ) {
        return ApiResponse.ok("컬렉션에서 피드를 제거했습니다.", collectionService.removeFeed(currentUser, folderId, postId));
    }
}

