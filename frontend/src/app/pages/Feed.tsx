import Navigation from "../components/Navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import { apiRequest } from "../api/apiClient";
import { CollectionSaveModal } from "../components/feed/CollectionSaveModal";
import { FeedCard } from "../components/feed/FeedCard";
import { FeedDetailModal } from "../components/feed/FeedDetailModal";
import { FollowingSidebar } from "../components/feed/FollowingSidebar";
import { useFeedCollections } from "../hooks/useFeedCollections";
import { useFeedComments } from "../hooks/useFeedComments";
import { useFeedDetail } from "../hooks/useFeedDetail";
import { useFollowingSidebar } from "../hooks/useFollowingSidebar";
import {
  createMessageConversationApi,
  sendConversationMessageApi,
} from "../api/messageApi";
import { getCurrentUser } from "../utils/auth";
import { getUserAvatar } from "../utils/avatar";
import { normalizeCategoryLabel, normalizePostTypeLabel } from "../utils/matchingCategories";
import { useNightMode } from "../contexts/NightModeContext";
import type {
  BaseFeedItem,
  FeedCardItem,
  FeedComment,
  FeedListApiData,
  FeedPickApiData,
} from "../types/feed";

export default function Feed() {
  const navigate = useNavigate();
  const { isNight } = useNightMode();
  const [selectedFeed, setSelectedFeed] = useState<FeedCardItem | null>(null);
  const [apiFeedItems, setApiFeedItems] = useState<BaseFeedItem[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isFollowingOpen, setIsFollowingOpen] = useState(true);
  const [showAllFollowing, setShowAllFollowing] = useState(false);
  const [carouselIndexes, setCarouselIndexes] = useState<Record<number, number>>({});
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [isStartingProposal, setIsStartingProposal] = useState(false);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [hasNext, setHasNext] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const shouldFocusCommentRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadMoreRef = useRef<() => void>(() => undefined);

  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.userId ?? null;
  const currentUserAvatar = getUserAvatar(
    currentUser?.profileImage,
    currentUser?.userId,
    currentUser?.nickname,
  );
  const currentUserName = currentUser?.nickname || currentUser?.name || "내 프로필";

  function toCommentAuthorRole(role: string) {
    if (role === "CLIENT") return "프로젝트 클라이언트";
    if (role === "DESIGNER") return "디자이너";
    return role;
  }

  function toFeedAuthorRole(role: string, postType?: string) {
    if (role === "CLIENT") return "프로젝트 클라이언트";
    if (role === "DESIGNER") return postType ?? "디자이너";
    return role || postType || "";
  }

  const {
    profiles: followingSidebarProfiles,
    isLoading: isFollowingLoading,
    error: followingError,
  } = useFollowingSidebar();

  const {
    collections,
    collectionPostIdsByFolder,
    collectionModalFeed,
    newCollectionName,
    collectionSavedNotice,
    isCollectionSaving,
    savedItemIds,
    setNewCollectionName,
    openCollectionModal,
    closeCollectionModal,
    saveToCollection,
    createCollectionAndSave,
  } = useFeedCollections<FeedCardItem>();

  const {
    commentText,
    setCommentText,
    commentSubmitError,
    isSubmittingComment,
    isCommentsLoading,
    commentLoadError,
    editingCommentId,
    editingCommentText,
    setEditingCommentText,
    isUpdatingComment,
    isDeletingCommentId,
    selectedFeedComments,
    handleSubmitComment,
    handleCommentKeyDown,
    startEditingComment,
    cancelEditingComment,
    handleUpdateComment,
    handleDeleteComment,
  } = useFeedComments<BaseFeedItem, FeedCardItem>({
    selectedFeed,
    apiFeedItems,
    currentUser,
    currentUserId,
    setApiFeedItems,
    setSelectedFeed,
    toFeedCommentRole: toCommentAuthorRole,
  });

  const selectedFeedImages = selectedFeed ? getFeedImages(selectedFeed) : [];
  const activeModalImage = selectedFeedImages[modalImageIndex] ?? selectedFeed?.image ?? "";

  const {
    isLoading: isFeedDetailLoading,
    error: feedDetailError,
  } = useFeedDetail<FeedCardItem>({
    selectedFeed,
    setApiFeedItems,
    setSelectedFeed,
  });

  const visibleFeedItems = useMemo(
    () =>
      apiFeedItems.map((item, index) => ({
        ...item,
        feedKey: item.id * 1000 + index,
      })),
    [apiFeedItems]
  );

  const visibleFollowingProfiles = showAllFollowing
    ? followingSidebarProfiles
    : followingSidebarProfiles.slice(0, 3);
  const hiddenFollowingCount = Math.max(followingSidebarProfiles.length - 3, 0);

  function mapFeedItem(feedItem: FeedApiItem): BaseFeedItem {
    return {
      id: feedItem.postId,
      author: {
        userId: feedItem.userId,
        name: feedItem.nickname,
        role: feedItem.job || toFeedAuthorRole(feedItem.role),
        avatar: getUserAvatar(feedItem.profileImageUrl, feedItem.userId, feedItem.nickname),
        profileKey: feedItem.profileKey,
      },
      title: feedItem.title,
      description: feedItem.description ?? "",
      image: feedItem.thumbnailUrl ?? "",
      likes: feedItem.pickCount,
      comments: feedItem.commentCount,
      tags: feedItem.tags?.length
        ? feedItem.tags
        : [normalizeCategoryLabel(feedItem.category)].filter(Boolean),
      category: normalizeCategoryLabel(feedItem.category),
      likedByMe: feedItem.picked,
      isApiFeed: true,
    };
  }

  useEffect(() => {
    let mounted = true;

    async function loadFeeds() {
      try {
        setIsFeedLoading(true);
        setFeedError(null);

        const feedData = await apiRequest<FeedListApiData>(
          "/api/feeds",
          {},
          "피드 목록을 불러오지 못했습니다."
        );

        if (!mounted) return;

        setApiFeedItems((feedData?.feeds ?? []).map(mapFeedItem));
        setNextCursor(feedData?.nextCursor ?? null);
        setHasNext(feedData?.hasNext ?? false);
      } catch (error) {
        if (!mounted) return;
        setFeedError(error instanceof Error ? error.message : "피드 목록을 불러오지 못했습니다.");
        setApiFeedItems([]);
      } finally {
        if (mounted) {
          setIsFeedLoading(false);
        }
      }
    }

    void loadFeeds();

    return () => {
      mounted = false;
    };
  }, []);

  const loadMoreFeeds = useCallback(async () => {
    if (!hasNext || isLoadingMore || nextCursor === null) return;

    try {
      setIsLoadingMore(true);

      const feedData = await apiRequest<FeedListApiData>(
        `/api/feeds?cursor=${nextCursor}`,
        {},
        "피드를 더 불러오지 못했습니다."
      );

      setApiFeedItems((prev) => [...prev, ...(feedData?.feeds ?? []).map(mapFeedItem)]);
      setNextCursor(feedData?.nextCursor ?? null);
      setHasNext(feedData?.hasNext ?? false);
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : "피드를 더 불러오지 못했습니다.");
    } finally {
      setIsLoadingMore(false);
    }
  }, [hasNext, isLoadingMore, nextCursor]);

  useEffect(() => {
    loadMoreRef.current = loadMoreFeeds;
  });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          void loadMoreRef.current();
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!selectedFeed || !shouldFocusCommentRef.current) return;

    window.setTimeout(() => {
      commentInputRef.current?.focus();
      shouldFocusCommentRef.current = false;
    }, 80);
  }, [selectedFeed]);

  function updateFeedPickState(postId: number, picked: boolean, pickCount: number) {
    setApiFeedItems((prev) =>
      prev.map((item) =>
        item.id === postId ? { ...item, likedByMe: picked, likes: pickCount } : item
      )
    );
    setSelectedFeed((prev) =>
      prev && prev.id === postId ? { ...prev, likedByMe: picked, likes: pickCount } : prev
    );
  }

  const toggleLike = async (item: BaseFeedItem, e?: React.MouseEvent) => {
    e?.stopPropagation();

    try {
      const result = await apiRequest<FeedPickApiData>(
        `/api/feeds/${item.id}/like`,
        { method: "POST" },
        "피드 좋아요 처리에 실패했습니다."
      );
      updateFeedPickState(result.postId, result.picked, result.pickCount);
    } catch (error) {
      setFeedError(error instanceof Error ? error.message : "피드 좋아요 처리에 실패했습니다.");
    }
  };

  function isFeedLiked(item: BaseFeedItem) {
    return Boolean(item.likedByMe);
  }

  function getLikeCount(item: BaseFeedItem) {
    return item.likes;
  }

  function getCommentCount(item: BaseFeedItem) {
    return item.comments;
  }

  function getFeedImages(item: BaseFeedItem) {
    const mergedImages = [
      ...(item.images ?? []),
      item.image,
    ].filter((image): image is string => Boolean(image));

    return Array.from(new Set(mergedImages));
  }

  function formatFeedDateTime(value?: string) {
    if (!value) return null;

    const parsedDate = new Date(value);
    if (Number.isNaN(parsedDate.getTime())) return null;

    return parsedDate.toLocaleString("ko-KR", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  const moveCarousel = (item: FeedCardItem, direction: -1 | 1, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const images = getFeedImages(item);
    if (images.length <= 1) return;

    setCarouselIndexes((prev) => {
      const currentIndex = prev[item.feedKey] ?? 0;
      return {
        ...prev,
        [item.feedKey]: (currentIndex + direction + images.length) % images.length,
      };
    });
  };

  const moveModalCarousel = (direction: -1 | 1, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedFeedImages.length <= 1) return;
    setModalImageIndex((prev) => (prev + direction + selectedFeedImages.length) % selectedFeedImages.length);
  };

  const openFeedDetail = (item: FeedCardItem, focusComment = false) => {
    shouldFocusCommentRef.current = focusComment;
    setSelectedFeed(item);
    setModalImageIndex(carouselIndexes[item.feedKey] ?? 0);
  };

  const handleShare = (item: BaseFeedItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const copyToClipboard = () => {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => alert("공유 링크가 클립보드에 복사되었습니다."))
        .catch(() => alert("링크 복사에 실패했습니다."));
    };
    if (navigator.share) {
      navigator
        .share({ title: item.title, text: item.description, url: window.location.href })
        .catch(() => copyToClipboard());
    } else {
      copyToClipboard();
    }
  };

  const handleProposalClick = async (item: FeedCardItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (isStartingProposal) return;

    if (!item.author.userId) {
      alert("상대 프로필 정보를 찾을 수 없습니다.");
      return;
    }

    if (currentUser?.userId === item.author.userId) {
      alert("내 피드에는 제안 메시지를 보낼 수 없습니다.");
      return;
    }

    const now = Date.now();
    const proposalMessage = `안녕하세요. "${item.title}" 작업을 보고 프로젝트 제안을 드리고 싶어 연락드렸습니다. 작업 가능 여부와 일정, 견적을 이야기해보고 싶습니다.`;

    setIsStartingProposal(true);
    try {
      const conversation = await createMessageConversationApi(item.author.userId);
      setSelectedFeed(null);
      navigate(`/messages?conversationId=${conversation.id}`);
      void sendConversationMessageApi(conversation.id, {
        clientId: `feed-proposal-${item.id}-${now}`,
        message: proposalMessage,
        attachments: (getFeedImages(item)[0] ?? item.image)
          ? [
              {
                id: `feed-${item.id}`,
                type: "image",
                src: getFeedImages(item)[0] ?? item.image,
                name: item.title,
                uploadStatus: "ready",
              },
            ]
          : [],
      }).catch((error) => {
        console.error("제안 메시지 자동 전송 실패:", error);
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "대화를 시작하지 못했습니다.");
    } finally {
      setIsStartingProposal(false);
    }
  };

  function handleSelectCarouselImage(
    feedKey: number,
    index: number,
    e: React.MouseEvent
  ) {
    e.stopPropagation();
    setCarouselIndexes((prev) => ({ ...prev, [feedKey]: index }));
  }

  return (
    <div
      className={`min-h-screen transition-colors duration-500 ${
        isNight ? "bg-[#0C1222]" : "bg-[#FBF9F6]"
      }`}
    >
      <Navigation />

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex gap-8">
          {/* Main Feed */}
          <div className="flex-1">
            {isFeedLoading && (
              <div
                className={`mb-6 rounded-xl border border-dashed px-6 py-10 text-center text-sm font-medium transition-colors duration-500 ${
                  isNight
                    ? "border-white/10 bg-[#1a1f2e] text-white/40"
                    : "border-[#BDEFD8] bg-white text-gray-500"
                }`}
              >
                피드 목록을 불러오는 중입니다.
              </div>
            )}

            {!isFeedLoading && feedError && (
              <div
                className={`mb-6 rounded-xl border px-6 py-10 text-center text-sm font-medium transition-colors duration-500 ${
                  isNight
                    ? "border-[#FF5C3A]/30 bg-[#FF5C3A]/10 text-[#FF8A70]"
                    : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                }`}
              >
                {feedError}
              </div>
            )}

            {!isFeedLoading && !feedError && visibleFeedItems.length === 0 && (
              <div
                className={`mb-6 rounded-xl border border-dashed px-6 py-10 text-center text-sm font-medium transition-colors duration-500 ${
                  isNight
                    ? "border-white/10 bg-[#1a1f2e] text-white/40"
                    : "border-[#BDEFD8] bg-white text-gray-500"
                }`}
              >
                아직 표시할 피드가 없습니다.
              </div>
            )}

            {/* Feed Grid */}
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
              {visibleFeedItems.map((item) => {
                const images = getFeedImages(item);
                const activeImageIndex = carouselIndexes[item.feedKey] ?? 0;
                const isSaved = savedItemIds.has(item.id);

                return (
                  <FeedCard
                    key={item.feedKey}
                    item={item}
                    images={images}
                    activeImageIndex={activeImageIndex}
                    isSaved={isSaved}
                    isNight={isNight}
                    onOpenDetail={openFeedDetail}
                    onMoveCarousel={moveCarousel}
                    onSelectImage={handleSelectCarouselImage}
                    onToggleLike={toggleLike}
                    isFeedLiked={isFeedLiked}
                    getLikeCount={getLikeCount}
                    getCommentCount={getCommentCount}
                    onOpenCollectionModal={openCollectionModal}
                    onShare={handleShare}
                  />
                );
              })}
            </div>

            {/* Infinite scroll sentinel */}
            <div ref={sentinelRef} className="h-4" />

            {isLoadingMore && (
              <div
                className={`py-6 text-center text-sm transition-colors duration-500 ${
                  isNight ? "text-white/30" : "text-gray-500"
                }`}
              >
                피드를 더 불러오는 중입니다...
              </div>
            )}

            {!isFeedLoading && !hasNext && visibleFeedItems.length > 0 && (
              <div
                className={`py-6 text-center text-sm transition-colors duration-500 ${
                  isNight ? "text-white/20" : "text-gray-400"
                }`}
              >
                모든 피드를 불러왔습니다.
              </div>
            )}

          </div>

          <FollowingSidebar
            isOpen={isFollowingOpen}
            profiles={followingSidebarProfiles}
            visibleProfiles={visibleFollowingProfiles}
            hiddenCount={hiddenFollowingCount}
            showAll={showAllFollowing}
            isLoading={isFollowingLoading}
            error={followingError}
            isNight={isNight}
            onToggleOpen={() => setIsFollowingOpen((prev) => !prev)}
            onShowAllToggle={() => setShowAllFollowing((prev) => !prev)}
          />
        </div>
      </div>

      {selectedFeed && (
        <FeedDetailModal
          selectedFeed={selectedFeed}
          activeModalImage={activeModalImage}
          selectedFeedImages={selectedFeedImages}
          modalImageIndex={modalImageIndex}
          savedItemIds={savedItemIds}
          selectedFeedComments={selectedFeedComments}
          isFeedDetailLoading={isFeedDetailLoading}
          feedDetailError={feedDetailError}
          commentSubmitError={commentSubmitError}
          commentLoadError={commentLoadError}
          isCommentsLoading={isCommentsLoading}
          editingCommentId={editingCommentId}
          editingCommentText={editingCommentText}
          isUpdatingComment={isUpdatingComment}
          isDeletingCommentId={isDeletingCommentId}
          commentText={commentText}
          isSubmittingComment={isSubmittingComment}
          currentUserAvatar={currentUserAvatar}
          currentUserName={currentUserName}
          commentInputRef={commentInputRef}
          isNight={isNight}
          formatFeedDateTime={formatFeedDateTime}
          isFeedLiked={isFeedLiked}
          getLikeCount={getLikeCount}
          getCommentCount={getCommentCount}
          onClose={() => setSelectedFeed(null)}
          onMoveModalCarousel={moveModalCarousel}
          onSetModalImageIndex={(index, e) => {
            e.stopPropagation();
            setModalImageIndex(index);
          }}
          onToggleLike={toggleLike}
          onOpenCollectionModal={openCollectionModal}
          onShare={handleShare}
          onProposalClick={handleProposalClick}

          onStartEditingComment={startEditingComment}
          onEditingCommentTextChange={setEditingCommentText}
          onUpdateComment={handleUpdateComment}
          onCancelEditingComment={cancelEditingComment}
          onDeleteComment={handleDeleteComment}
          onCommentTextChange={setCommentText}
          onCommentKeyDown={handleCommentKeyDown}
          onSubmitComment={handleSubmitComment}
        />
      )}

      {collectionModalFeed && (
        <CollectionSaveModal
          feed={collectionModalFeed}
          collections={collections}
          collectionPostIdsByFolder={collectionPostIdsByFolder}
          isCollectionSaving={isCollectionSaving}
          newCollectionName={newCollectionName}
          collectionSavedNotice={collectionSavedNotice}
          onClose={closeCollectionModal}
          onNewCollectionNameChange={setNewCollectionName}
          onSaveToCollection={saveToCollection}
          onCreateCollectionAndSave={createCollectionAndSave}
        />
      )}
    </div>
  );
}
