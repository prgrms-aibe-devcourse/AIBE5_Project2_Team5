package com.example.pixel_project2.collection.service;

import com.example.pixel_project2.collection.dto.CollectionFolderDetailResponse;
import com.example.pixel_project2.collection.dto.CollectionFolderResponse;
import com.example.pixel_project2.collection.dto.CollectionPolicyResponse;
import com.example.pixel_project2.collection.dto.CreateCollectionFolderRequest;
import com.example.pixel_project2.collection.dto.RenameCollectionFolderRequest;
import com.example.pixel_project2.collection.dto.ReorderFoldersRequest;
import com.example.pixel_project2.collection.dto.SaveFeedToCollectionRequest;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;

import java.util.List;

public interface CollectionService {
    CollectionPolicyResponse getCollectionPolicy();

    List<CollectionFolderResponse> getMyFolders(AuthenticatedUser currentUser);

    List<CollectionFolderResponse> getProfileFolders(String profileKey, AuthenticatedUser currentUser);

    CollectionFolderDetailResponse getFolder(Long folderId);

    CollectionFolderResponse createFolder(AuthenticatedUser currentUser, CreateCollectionFolderRequest request);

    CollectionFolderResponse renameFolder(AuthenticatedUser currentUser, Long folderId, RenameCollectionFolderRequest request);

    void reorderFolders(AuthenticatedUser currentUser, ReorderFoldersRequest request);

    void deleteFolder(AuthenticatedUser currentUser, Long folderId);

    CollectionFolderDetailResponse saveFeed(AuthenticatedUser currentUser, Long folderId, SaveFeedToCollectionRequest request);

    CollectionFolderDetailResponse removeFeed(AuthenticatedUser currentUser, Long folderId, Long postId);
}

