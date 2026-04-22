package com.example.pixel_project2.collection.controller;

import com.example.pixel_project2.collection.service.CollectionService;
import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.collection.dto.CollectionPolicyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import com.example.pixel_project2.collection.dto.CollectionFolderResponseDto;
import com.example.pixel_project2.collection.dto.SaveFeedRequestDto;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {
    private final CollectionService collectionService;

    @GetMapping("/policy")
    public ApiResponse<CollectionPolicyResponse> getCollectionPolicy() {
        return ApiResponse.ok("컬렉션 정책을 조회했습니다.", collectionService.getCollectionPolicy());
    }

    // 19. 컬렉션 폴더 목록 조회
    @GetMapping
    public ApiResponse<List<CollectionFolderResponseDto>> getCollectionFolders(@AuthenticationPrincipal AuthenticatedUser user) {
        // user가 null일 수 있는 상황 처리 (인증되지 않은 접근)
        if (user == null) {
            return ApiResponse.error("인증 정보가 없습니다. (토큰 확인 필요)");
        }
        List<CollectionFolderResponseDto> folders = collectionService.getCollectionFolders(user.id());
        return ApiResponse.ok("컬렉션 폴더 목록을 조회했습니다.", folders);
    }

    // 20. 컬렉션에 피드 저장
    @PostMapping("/{folderId}/feeds")
    public ApiResponse<Map<String, String>> saveFeedToFolder(
            @PathVariable Long folderId,
            @RequestBody SaveFeedRequestDto requestDto,
            @AuthenticationPrincipal AuthenticatedUser user) {
        
        if (user == null) {
            return ApiResponse.error("인증 정보가 없습니다. (토큰 확인 필요)");
        }
        
        collectionService.saveFeedToFolder(folderId, requestDto.postId(), user.id());
        
        return ApiResponse.ok("성공", Map.of("message", "저장 완료"));
    }
}
