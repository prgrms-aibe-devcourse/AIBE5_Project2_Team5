import { apiRequest } from "./apiClient";

export type CreateFeedResponse = {
  postId: number;
  title: string;
  description: string;
  pickCount: number;
  commentCount: number;
  category: string;
  categoryCode: string;
  portfolioUrl: string | null;
  createdAt: string | null;
};

export async function createFeedApi(params: {
  title: string;
  description: string;
  category: string;
  portfolioUrl?: string;
  tags?: string[];
}) {
  return apiRequest<CreateFeedResponse>(
    "/api/feeds/new",
    {
      method: "POST",
      body: JSON.stringify(params),
    },
    "Failed to create feed.",
  );
}

export async function updateFeedApi(
  postId: number,
  params: {
    title: string;
    description: string;
    category: string;
    portfolioUrl?: string;
    tags?: string[];
  },
) {
  return apiRequest<CreateFeedResponse>(
    `/api/feeds/${postId}`,
    {
      method: "PATCH",
      body: JSON.stringify(params),
    },
    "Failed to update feed.",
  );
}

export async function deleteFeedApi(postId: number) {
  return apiRequest<{ postId: number }>(
    `/api/feeds/${postId}`,
    {
      method: "DELETE",
    },
    "Failed to delete feed.",
  );
}
export async function toggleFeedPickApi(feedId: number) {
  return apiRequest<{ postId: number; picked: boolean; pickCount: number }>(
    `/api/feeds/${feedId}/like`,
    {
      method: "POST",
    },
    "좋아요 상태를 변경하는 데 실패했습니다.",
  );
}
