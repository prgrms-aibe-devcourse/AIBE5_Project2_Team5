package com.example.pixel_project2.collection.controller;

import com.example.pixel_project2.collection.dto.CollectionFolderResponse;
import com.example.pixel_project2.collection.service.CollectionService;
import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class ProfileCollectionController {
    private final CollectionService collectionService;

    @GetMapping("/api/profiles/{profileKey}/collections")
    public ApiResponse<List<CollectionFolderResponse>> getProfileCollections(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable String profileKey
    ) {
        return ApiResponse.ok("프로필 컬렉션을 불러왔습니다.", collectionService.getProfileFolders(profileKey, currentUser));
    }

    @GetMapping("/api/designerPages/{profileKey}/collections")
    public ApiResponse<List<CollectionFolderResponse>> getDesignerPageCollections(
            @AuthenticationPrincipal AuthenticatedUser currentUser,
            @PathVariable String profileKey
    ) {
        return ApiResponse.ok("프로필 컬렉션을 불러왔습니다.", collectionService.getProfileFolders(profileKey, currentUser));
    }
}
