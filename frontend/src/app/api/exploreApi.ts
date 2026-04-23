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
};

// 탐색 피드 목록 조회 (인증이 필요하므로 apiRequest 사용)
export async function getExploreFeedsApi(category?: string) {
  const path = category && category !== "all" 
    ? `/api/explore?category=${encodeURIComponent(category)}` 
    : "/api/explore";
    
  return apiRequest<ExplorePostResponseDto[]>(path, {}, "탐색 피드를 불러오는데 실패했습니다.");
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

// 디자이너 목록 조회
export async function getExploreDesignersApi(keyword?: string) {
  const path = keyword && keyword.trim() !== ""
    ? `/api/explore/designers?keyword=${encodeURIComponent(keyword)}`
    : "/api/explore/designers";

  return apiRequest<ExploreDesignerResponseDto[]>(path, {}, "디자이너 목록을 불러오는데 실패했습니다.");
}
