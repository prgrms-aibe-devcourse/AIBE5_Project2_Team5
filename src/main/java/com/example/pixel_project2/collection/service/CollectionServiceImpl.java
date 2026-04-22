package com.example.pixel_project2.collection.service;

import com.example.pixel_project2.collection.dto.CollectionPolicyResponse;
import com.example.pixel_project2.collection.dto.CollectionFolderResponseDto;
import com.example.pixel_project2.common.entity.Collection;
import com.example.pixel_project2.common.entity.CollectionFolder;
import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.repository.CollectionFolderRepository;
import com.example.pixel_project2.common.repository.CollectionRepository;
import com.example.pixel_project2.common.repository.PostRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

import java.util.Map;
import java.util.Collections;

@Service
@RequiredArgsConstructor
public class CollectionServiceImpl implements CollectionService {

    private final CollectionFolderRepository collectionFolderRepository;
    private final CollectionRepository collectionRepository;
    private final PostRepository postRepository;

    @Override
    public CollectionPolicyResponse getCollectionPolicy() {
        return new CollectionPolicyResponse(true, true);
    }

    @Override
    @Transactional(readOnly = true)
    public List<CollectionFolderResponseDto> getCollectionFolders(Long userId) {
        List<CollectionFolder> folders = collectionFolderRepository.findByUserId(userId);
        
        List<Collection> allUserCollections = collectionRepository.findByFolder_User_Id(userId);
        
        Map<Long, List<Long>> folderItemIdsMap = allUserCollections.stream()
                .collect(Collectors.groupingBy(
                        c -> c.getFolder().getFolder_id(),
                        Collectors.mapping(c -> c.getPost().getId(), Collectors.toList())
                ));

        return folders.stream()
                .map(folder -> new CollectionFolderResponseDto(
                        folder.getFolder_id(),
                        folder.getFolderName(),
                        folderItemIdsMap.getOrDefault(folder.getFolder_id(), Collections.emptyList())
                ))
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public void saveFeedToFolder(Long folderId, Long postId, Long userId) {
        // 1. 해당 폴더가 내 폴더인지 확인
        CollectionFolder folder = collectionFolderRepository.findById(folderId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 폴더입니다."));
        
        if (!folder.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("해당 폴더에 접근할 권한이 없습니다.");
        }

        // 2. 포스트 존재 확인
        Post post = postRepository.findById(postId)
                .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 포스트입니다."));

        // 3. 중복 저장 확인
        if (collectionRepository.existsByFolder_Folder_idAndPost_Id(folderId, postId)) {
            throw new IllegalArgumentException("이미 해당 폴더에 저장된 피드입니다.");
        }

        // 4. 저장
        Collection collection = Collection.builder()
                .folder(folder)
                .post(post)
                .build();
        collectionRepository.save(collection);
    }
}
