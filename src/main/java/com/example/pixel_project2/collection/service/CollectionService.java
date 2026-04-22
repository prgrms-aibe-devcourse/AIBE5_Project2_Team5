package com.example.pixel_project2.collection.service;

import com.example.pixel_project2.collection.dto.CollectionPolicyResponse;
import com.example.pixel_project2.collection.dto.CollectionFolderResponseDto;
import java.util.List;

public interface CollectionService {
    CollectionPolicyResponse getCollectionPolicy();
    
    List<CollectionFolderResponseDto> getCollectionFolders(Long userId);
    void saveFeedToFolder(Long folderId, Long postId, Long userId);
}
