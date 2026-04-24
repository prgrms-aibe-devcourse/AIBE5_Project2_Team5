import { apiRequest } from "./apiClient";

export type ProfileResponse = {
  userId: number;
  loginId: string;
  name: string | null;
  nickname: string;
  role: "CLIENT" | "DESIGNER";
  profileImage: string | null;
  url: string | null;
  location: string | null;
  followCount: number | null;
  followerCount: number;
  followingCount: number;
  job: string | null;
  introduction: string | null;
  rating: number | null;
  workStatus: string | null;
  workType: string | null;
  figmaUrl: string | null;
  photoshopUrl: string | null;
  adobeUrl: string | null;
  owner: boolean;
  following: boolean;
};

export type ProfileFeedResponse = {
  postId: number;
  title: string;
  description: string | null;
  pickCount: number | null;
  commentCount: number;
  category: string | null;
  categoryCode: string | null;
  portfolioUrl: string | null;
  imageUrls: string[];
  thumbnailImageUrl: string | null;
  tags: string[];
  createdAt: string | null;
};

export type ProfileReviewResponse = {
  reviewId: number;
  projectId: number | null;
  projectTitle: string;
  reviewerId: number | null;
  reviewerName: string | null;
  reviewerNickname: string;
  reviewerProfileImage: string | null;
  rating: number;
  content: string;
  workCategories: string[];
  complimentTags: string[];
  createdAt: string | null;
};

export type CreateProfileReviewRequest = {
  conversationId: number;
  revieweeId: number;
  projectTitle: string;
  rating: number;
  content: string;
  workCategories: string[];
  complimentTags: string[];
};

export async function getMyProfileApi() {
  return apiRequest<ProfileResponse>("/api/profiles/me", {}, "Failed to load profile.");
}

export async function getProfileApi(profileKey: string) {
  return apiRequest<ProfileResponse>(
    `/api/profiles/${encodeURIComponent(profileKey)}`,
    {},
    "Failed to load profile.",
  );
}

export async function getMyProfileFeedsApi() {
  return apiRequest<ProfileFeedResponse[]>(
    "/api/profiles/me/feeds",
    {},
    "Failed to load profile feeds.",
  );
}

export async function getProfileFeedsApi(profileKey: string) {
  return apiRequest<ProfileFeedResponse[]>(
    `/api/profiles/${encodeURIComponent(profileKey)}/feeds`,
    {},
    "Failed to load profile feeds.",
  );
}

export async function getMyProfileReviewsApi() {
  return apiRequest<ProfileReviewResponse[]>(
    "/api/profiles/me/reviews",
    {},
    "Failed to load profile reviews.",
  );
}

export async function getProfileReviewsApi(profileKey: string) {
  return apiRequest<ProfileReviewResponse[]>(
    `/api/profiles/${encodeURIComponent(profileKey)}/reviews`,
    {},
    "Failed to load profile reviews.",
  );
}

export async function createProfileReviewApi(params: CreateProfileReviewRequest) {
  return apiRequest<ProfileReviewResponse>(
    "/api/profiles/reviews",
    {
      method: "POST",
      body: JSON.stringify(params),
    },
    "Failed to create profile review.",
  );
}

export async function updateMyProfileApi(params: {
  name: string;
  nickname: string;
  url?: string;
  location?: string;
}) {
  return apiRequest<ProfileResponse>(
    "/api/profiles/me",
    {
      method: "PATCH",
      body: JSON.stringify(params),
    },
    "Failed to update profile.",
  );
}

export async function updateMyDesignerProfileApi(params: {
  job?: string;
  introduction?: string;
  workStatus?: string;
  workType?: string;
  figmaUrl?: string;
  photoshopUrl?: string;
  adobeUrl?: string;
}) {
  return apiRequest<ProfileResponse>(
    "/api/profiles/me/designer",
    {
      method: "PUT",
      body: JSON.stringify(params),
    },
    "Failed to update designer profile.",
  );
}
