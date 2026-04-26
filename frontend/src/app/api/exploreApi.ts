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

export async function getExploreFeedsApi(category?: string) {
  const path =
    category && category !== "all"
      ? `/api/explore?category=${encodeURIComponent(category)}`
      : "/api/explore";

  return apiRequest<ExplorePostResponseDto[]>(
    path,
    {},
    "?먯깋 ?쇰뱶瑜?遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎."
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
    "?붿옄?대꼫 紐⑸줉??遺덈윭?ㅻ뒗???ㅽ뙣?덉뒿?덈떎."
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
    "?곸꽭 ?쇰뱶瑜?遺덈윭?ㅻ뒗 ???ㅽ뙣?덉뒿?덈떎."
  );
}
