import { useEffect, useState } from "react";
import { apiRequest } from "../api/apiClient";
import { getUserAvatar } from "../utils/avatar";
import { getFeedIntegrationLabel, parseFeedIntegrations } from "../utils/feedIntegrations";
import { normalizeCategoryLabel, normalizePostTypeLabel } from "../utils/matchingCategories";

type FeedAuthor = {
  userId?: number;
  name: string;
  role: string;
  avatar: string;
  profileKey?: string;
};

type BaseFeedItem = {
  id: number;
  author: FeedAuthor;
  title: string;
  description: string;
  image: string;
  images?: string[];
  likes: number;
  comments: number;
  tags: string[];
  category?: string;
  integrations?: Array<{
    provider: "figma" | "adobe";
    label: string;
    url: string;
  }>;
  createdAt?: string;
  userId?: number;
  portfolioUrl?: string | null;
  likedByMe?: boolean;
  isMine?: boolean;
  isApiFeed?: boolean;
};

type FeedDetailApiData = {
  postId: number;
  userId: number;
  title: string;
  description: string;
  nickname: string;
  profileKey: string;
  profileImageUrl: string | null;
  job: string | null;
  role: string;
  postType: string;
  category: string;
  pickCount: number;
  commentCount: number;
  portfolioUrl: string | null;
  createdAt: string;
  imageUrls: string[];
  picked: boolean;
  mine: boolean;
  tags: string[];
};

type Params<TFeed extends BaseFeedItem> = {
  selectedFeed: TFeed | null;
  setApiFeedItems: React.Dispatch<React.SetStateAction<TFeed[]>>;
  setSelectedFeed: React.Dispatch<React.SetStateAction<TFeed | null>>;
};

function resolveFeedAuthorRole(role: string, postType?: string) {
  if (role === "CLIENT") return "프로젝트 클라이언트";
  if (role === "DESIGNER") return postType ?? "디자이너";
  return role || postType || "";
}

export function useFeedDetail<TFeed extends BaseFeedItem>({
  selectedFeed,
  setApiFeedItems,
  setSelectedFeed,
}: Params<TFeed>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedFeedDetailIds, setLoadedFeedDetailIds] = useState<Record<number, true>>({});

  useEffect(() => {
    let mounted = true;

    async function loadFeedDetail(feedId: number) {
      try {
        setIsLoading(true);
        setError(null);

        const detail = await apiRequest<FeedDetailApiData>(
          `/api/feeds/${feedId}`,
          {},
          "피드 상세를 불러오지 못했습니다.",
        );

        if (!mounted) return;

        const fallbackImages = (selectedFeed?.images ?? []).filter(Boolean);
        const fallbackImage = selectedFeed?.image ?? fallbackImages[0] ?? "";
        const detailImages =
          detail.imageUrls?.filter(Boolean).length > 0
            ? detail.imageUrls.filter(Boolean)
            : fallbackImage
              ? Array.from(new Set([fallbackImage, ...fallbackImages]))
              : [];

        const updatedFeed = {
          id: detail.postId,
          author: {
            userId: detail.userId,
            name: detail.nickname,
            role: detail.job || resolveFeedAuthorRole(detail.role, detail.postType),
            profileKey: detail.profileKey,
            avatar: getUserAvatar(detail.profileImageUrl, detail.userId, detail.nickname),
          },
          title: detail.title,
          description: detail.description || "",
          image: detailImages[0] ?? "",
          images: detailImages,
          likes: detail.pickCount,
          comments: detail.commentCount,
          tags: detail.tags?.length
            ? detail.tags
            : [normalizeCategoryLabel(detail.category)].filter(Boolean),
          category: normalizeCategoryLabel(detail.category),
          integrations: parseFeedIntegrations(detail.portfolioUrl).map((integration) => ({
            ...integration,
            label: getFeedIntegrationLabel(integration.provider),
          })),
          createdAt: detail.createdAt,
          userId: detail.userId,
          portfolioUrl: detail.portfolioUrl,
          likedByMe: detail.picked,
          isMine: detail.mine,
          isApiFeed: true,
        } satisfies Partial<TFeed>;

        setApiFeedItems((prev) =>
          prev.map((item) =>
            item.id === feedId ? ({ ...item, ...updatedFeed } as TFeed) : item,
          ),
        );
        setSelectedFeed((prev) =>
          prev && prev.id === feedId ? ({ ...prev, ...updatedFeed } as TFeed) : prev,
        );
        setLoadedFeedDetailIds((prev) => ({
          ...prev,
          [feedId]: true,
        }));
      } catch (nextError) {
        if (!mounted) return;
        setError(nextError instanceof Error ? nextError.message : "피드 상세를 불러오지 못했습니다.");
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    if (!selectedFeed || !selectedFeed.isApiFeed) {
      setError(null);
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    if (loadedFeedDetailIds[selectedFeed.id]) {
      setError(null);
      setIsLoading(false);
      return () => {
        mounted = false;
      };
    }

    void loadFeedDetail(selectedFeed.id);

    return () => {
      mounted = false;
    };
  }, [
    loadedFeedDetailIds,
    selectedFeed,
    setApiFeedItems,
    setSelectedFeed,
  ]);

  return {
    isLoading,
    error,
  };
}
