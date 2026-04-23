package com.example.pixel_project2.collection.service;

import com.example.pixel_project2.collection.dto.CollectionFeedResponse;
import com.example.pixel_project2.collection.dto.CollectionFolderDetailResponse;
import com.example.pixel_project2.collection.dto.CollectionFolderResponse;
import com.example.pixel_project2.collection.dto.CollectionPolicyResponse;
import com.example.pixel_project2.collection.dto.CreateCollectionFolderRequest;
import com.example.pixel_project2.collection.dto.RenameCollectionFolderRequest;
import com.example.pixel_project2.collection.dto.ReorderFoldersRequest;
import com.example.pixel_project2.collection.dto.SaveFeedToCollectionRequest;
import com.example.pixel_project2.common.entity.Collection;
import com.example.pixel_project2.common.entity.CollectionFolder;
import com.example.pixel_project2.common.entity.Feed;
import com.example.pixel_project2.common.entity.Post;
import com.example.pixel_project2.common.entity.PostImage;
import com.example.pixel_project2.common.entity.User;
import com.example.pixel_project2.common.repository.CollectionFolderRepository;
import com.example.pixel_project2.common.repository.CollectionRepository;
import com.example.pixel_project2.common.repository.CommentRepository;
import com.example.pixel_project2.common.repository.PostRepository;
import com.example.pixel_project2.common.repository.UserRepository;
import com.example.pixel_project2.config.jwt.AuthenticatedUser;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Comparator;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CollectionServiceImpl implements CollectionService {
    private static final int PREVIEW_LIMIT = 4;

    private final CollectionFolderRepository collectionFolderRepository;
    private final CollectionRepository collectionRepository;
    private final PostRepository postRepository;
    private final UserRepository userRepository;
    private final CommentRepository commentRepository;

    @Override
    public CollectionPolicyResponse getCollectionPolicy() {
        return new CollectionPolicyResponse(true, true);
    }

    @Override
    public List<CollectionFolderResponse> getMyFolders(AuthenticatedUser currentUser) {
        return getFoldersForUser(currentUser.id());
    }

    @Override
    public List<CollectionFolderResponse> getProfileFolders(String profileKey, AuthenticatedUser currentUser) {
        return getFoldersForUser(resolveUser(profileKey, currentUser).getId());
    }

    @Override
    public CollectionFolderDetailResponse getFolder(Long folderId) {
        CollectionFolder folder = findFolder(folderId);
        return toFolderDetailResponse(folder);
    }

    @Override
    @Transactional
    public CollectionFolderResponse createFolder(AuthenticatedUser currentUser, CreateCollectionFolderRequest request) {
        User user = findUser(currentUser.id());
        String folderName = normalizeFolderName(request.folderName());
        ensureUniqueFolderName(user.getId(), null, folderName);

        int currentCount = collectionFolderRepository.findByUserId(user.getId()).size();

        CollectionFolder folder = collectionFolderRepository.save(CollectionFolder.builder()
                .user(user)
                .folderName(folderName)
                .sortOrder(currentCount + 1)
                .build());

        return toFolderResponse(folder);
    }

    @Override
    @Transactional
    public CollectionFolderResponse renameFolder(AuthenticatedUser currentUser, Long folderId, RenameCollectionFolderRequest request) {
        CollectionFolder folder = findOwnedFolder(currentUser, folderId);
        String folderName = normalizeFolderName(request.folderName());
        ensureUniqueFolderName(currentUser.id(), folder.getFolder_id(), folderName);
        folder.setFolderName(folderName);
        return toFolderResponse(folder);
    }

    @Override
    @Transactional
    public void deleteFolder(AuthenticatedUser currentUser, Long folderId) {
        CollectionFolder folder = findOwnedFolder(currentUser, folderId);
        collectionFolderRepository.delete(folder);
    }

    @Override
    @Transactional
    public void reorderFolders(AuthenticatedUser currentUser, ReorderFoldersRequest request) {
        List<Long> folderIds = request.folderIds();
        System.out.println("Reordering folders for user " + currentUser.id() + ": " + folderIds);
        for (int i = 0; i < folderIds.size(); i++) {
            Long folderId = folderIds.get(i);
            CollectionFolder folder = findOwnedFolder(currentUser, folderId);
            folder.setSortOrder(i + 1);
            System.out.println("Folder ID " + folderId + " set to sortOrder " + (i + 1));
        }
    }

    @Override
    @Transactional
    public CollectionFolderDetailResponse saveFeed(AuthenticatedUser currentUser, Long folderId, SaveFeedToCollectionRequest request) {
        CollectionFolder folder = findOwnedFolder(currentUser, folderId);
        Post post = postRepository.findById(request.postId())
                .orElseThrow(() -> new IllegalArgumentException("피드를 찾을 수 없습니다."));

        if (collectionRepository.countByFolderIdAndPostId(folder.getFolder_id(), post.getId()) == 0) {
            collectionRepository.save(Collection.builder()
                    .folder(folder)
                    .post(post)
                    .build());
        }

        return toFolderDetailResponse(folder);
    }

    @Override
    @Transactional
    public CollectionFolderDetailResponse removeFeed(AuthenticatedUser currentUser, Long folderId, Long postId) {
        CollectionFolder folder = findOwnedFolder(currentUser, folderId);
        collectionRepository.deleteByFolderIdAndPostId(folder.getFolder_id(), postId);
        return toFolderDetailResponse(folder);
    }

    private List<CollectionFolderResponse> getFoldersForUser(Long userId) {
        return collectionFolderRepository.findByUserId(userId).stream()
                .map(this::toFolderResponse)
                .toList();
    }

    private CollectionFolderResponse toFolderResponse(CollectionFolder folder) {
        List<CollectionFeedResponse> feeds = findFolderFeeds(folder).stream()
                .map(Collection::getPost)
                .map(this::toFeedResponse)
                .toList();
        List<String> previewImageUrls = feeds.stream()
                .map(CollectionFeedResponse::thumbnailImageUrl)
                .filter(url -> url != null && !url.isBlank())
                .limit(PREVIEW_LIMIT)
                .toList();

        return CollectionFolderResponse.builder()
                .folderId(folder.getFolder_id())
                .folderName(folder.getFolderName())
                .ownerId(folder.getUser().getId())
                .ownerNickname(folder.getUser().getNickname())
                .itemCount((long) feeds.size())
                .previewImageUrls(previewImageUrls)
                .createdAt(folder.getCreatedAt())
                .build();
    }

    private CollectionFolderDetailResponse toFolderDetailResponse(CollectionFolder folder) {
        List<CollectionFeedResponse> feeds = findFolderFeeds(folder).stream()
                .map(Collection::getPost)
                .map(this::toFeedResponse)
                .toList();

        return CollectionFolderDetailResponse.builder()
                .folderId(folder.getFolder_id())
                .folderName(folder.getFolderName())
                .ownerId(folder.getUser().getId())
                .ownerNickname(folder.getUser().getNickname())
                .createdAt(folder.getCreatedAt())
                .feeds(feeds)
                .build();
    }

    private CollectionFeedResponse toFeedResponse(Post post) {
        List<String> imageUrls = post.getImages().stream()
                .sorted(Comparator
                        .comparing((PostImage image) -> image.getSortOrder() == null ? Integer.MAX_VALUE : image.getSortOrder())
                        .thenComparing(PostImage::getImage_id))
                .map(PostImage::getImageUrl)
                .toList();
        Feed feed = post.getFeed();
        String categoryLabel = post.getCategory() == null ? null : post.getCategory().getLabel();

        return CollectionFeedResponse.builder()
                .postId(post.getId())
                .authorId(post.getUser().getId())
                .authorNickname(post.getUser().getNickname())
                .authorProfileImage(post.getUser().getProfileImage())
                .title(post.getTitle())
                .description(feed == null ? null : feed.getDescription())
                .category(categoryLabel)
                .categoryCode(post.getCategory() == null ? null : post.getCategory().name())
                .pickCount(post.getPickCount())
                .commentCount(commentRepository.countByPostId(post.getId()))
                .thumbnailImageUrl(imageUrls.isEmpty() ? null : imageUrls.get(0))
                .imageUrls(imageUrls)
                .createdAt(post.getCreatedAt())
                .build();
    }

    private List<Collection> findFolderFeeds(CollectionFolder folder) {
        return collectionRepository.findByFolderIdWithPostDetails(folder.getFolder_id());
    }

    private CollectionFolder findOwnedFolder(AuthenticatedUser currentUser, Long folderId) {
        CollectionFolder folder = findFolder(folderId);
        if (!folder.getUser().getId().equals(currentUser.id())) {
            throw new IllegalArgumentException("내 컬렉션 폴더만 변경할 수 있습니다.");
        }
        return folder;
    }

    private CollectionFolder findFolder(Long folderId) {
        return collectionFolderRepository.findByIdWithUser(folderId)
                .orElseThrow(() -> new IllegalArgumentException("컬렉션 폴더를 찾을 수 없습니다."));
    }

    private User resolveUser(String profileKey, AuthenticatedUser currentUser) {
        if (profileKey == null || profileKey.isBlank() || "me".equalsIgnoreCase(profileKey)) {
            return findUser(currentUser.id());
        }

        String trimmedProfileKey = profileKey.trim();
        Optional<User> numericUser = parseUserId(trimmedProfileKey).flatMap(userRepository::findById);
        if (numericUser.isPresent()) {
            return numericUser.get();
        }

        return userRepository.findByNickname(trimmedProfileKey)
                .or(() -> userRepository.findByloginId(trimmedProfileKey))
                .orElseThrow(() -> new IllegalArgumentException("프로필 사용자를 찾을 수 없습니다."));
    }

    private Optional<Long> parseUserId(String profileKey) {
        try {
            return Optional.of(Long.parseLong(profileKey));
        } catch (NumberFormatException e) {
            return Optional.empty();
        }
    }

    private User findUser(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    }

    private String normalizeFolderName(String folderName) {
        if (folderName == null || folderName.isBlank()) {
            throw new IllegalArgumentException("폴더 이름을 입력해주세요.");
        }
        String normalized = folderName.trim();
        if (normalized.length() > 100) {
            throw new IllegalArgumentException("폴더 이름은 100자 이하로 입력해주세요.");
        }
        return normalized;
    }

    private void ensureUniqueFolderName(Long userId, Long folderId, String folderName) {
        collectionFolderRepository.findByUserIdAndFolderName(userId, folderName)
                .filter(existing -> folderId == null || !existing.getFolder_id().equals(folderId))
                .ifPresent(existing -> {
                    throw new IllegalArgumentException("이미 사용 중인 컬렉션 폴더 이름입니다.");
                });
    }
}
