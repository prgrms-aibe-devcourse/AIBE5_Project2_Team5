import { apiRequest } from "./apiClient";

export type ExplorePostResponseDto = {
  postId: number;
  userId: number;
  title: string;
  nickname: string;
  pickCount: number;
  imageUrl: string | null;
  profileImage: string | null;
  category: string | null;
  job: string | null;
  description: string | null;
  picked: boolean;
};

export async function getExploreFeedsApi(category?: string, keyword?: string) {
  const params = new URLSearchParams();
  if (category && category !== "all" && category !== "전체") {
    params.append("category", category);
  }
  if (keyword && keyword.trim() !== "") {
    params.append("keyword", keyword.trim());
  }

  const queryString = params.toString();
  const path = queryString ? `/api/explore?${queryString}` : "/api/explore";

  return apiRequest<ExplorePostResponseDto[]>(
    path,
    {},
    "탐색 피드를 불러오는 데 실패했습니다."
  );
}

export type ExploreDesignerResponseDto = {
  userId: number;
  nickname: string;
  profileImage: string | null;
  job: string | null;
  followCount: number;
  postCount: number;
  introduction: string | null;
  bannerImage: string | null;
};

export async function getExploreDesignersApi(keyword?: string) {
  const path =
    keyword && keyword.trim() !== ""
      ? `/api/explore/designers?keyword=${encodeURIComponent(keyword)}`
      : "/api/explore/designers";

  return apiRequest<ExploreDesignerResponseDto[]>(
    path,
    {},
    "디자이너 목록을 불러오는 데 실패했습니다."
  );
}

export type ExploreFeedDetailResponseDto = {
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
};

export async function getExploreFeedDetailApi(postId: number) {
  return apiRequest<ExploreFeedDetailResponseDto>(
    `/api/feeds/${postId}`,
    {},
    "상세 피드를 불러오는 데 실패했습니다."
  );
}

export type AiSearchResponseDto = {
  category: string | null;
  keywords: string[];
  message: string;
};

export async function runAiSearchApi(query: string) {
  return apiRequest<AiSearchResponseDto>(
    "/api/explore/ai/search",
    {
      method: "POST",
      body: JSON.stringify({ query }),
    },
    "AI 검색 분석에 실패했습니다."
  );
}
