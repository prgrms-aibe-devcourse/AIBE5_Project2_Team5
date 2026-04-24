package com.example.pixel_project2.collection.controller;

import com.example.pixel_project2.collection.service.CollectionService;
import com.example.pixel_project2.common.dto.ApiResponse;
import com.example.pixel_project2.collection.dto.CollectionPolicyResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/collections")
@RequiredArgsConstructor
public class CollectionController {
    private final CollectionService collectionService;

    @GetMapping("/policy")
    public ApiResponse<CollectionPolicyResponse> getCollectionPolicy() {
        return ApiResponse.ok("컬렉션 정책을 조회했습니다.", collectionService.getCollectionPolicy());
    }
}
