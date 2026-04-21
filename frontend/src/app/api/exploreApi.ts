import { apiRequest } from "./apiClient";

export type ExplorePostResponseDto = {
  postId: number;
  title: string;
  nickname: string;
  pickCount: number;
  imageUrl: string | null;
};

// 탐색 피드 목록 조회 (인증이 필요하므로 apiRequest 사용)
export async function getExploreFeedsApi(category?: string) {
  const path = category && category !== "all" 
    ? `/api/explore?category=${encodeURIComponent(category)}` 
    : "/api/explore";
    
  return apiRequest<ExplorePostResponseDto[]>(path, {}, "탐색 피드를 불러오는데 실패했습니다.");
}
