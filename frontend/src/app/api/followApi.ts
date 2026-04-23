import { apiRequest } from "./apiClient";

export type FollowResponse = {
  targetUserId: number;
  following: boolean;
  followerCount: number;
  followingCount: number;
};

export type FollowingUserResponse = {
  userId: number;
  nickname: string;
  name: string | null;
  profileImage: string | null;
  role: "CLIENT" | "DESIGNER";
};

export async function followUserApi(userId: number) {
  return apiRequest<FollowResponse>(
    `/api/follows/${userId}`,
    { method: "POST" },
    "팔로우하지 못했습니다.",
  );
}

export async function unfollowUserApi(userId: number) {
  return apiRequest<FollowResponse>(
    `/api/follows/${userId}/unfollow`,
    { method: "DELETE" },
    "팔로우를 취소하지 못했습니다.",
  );
}

export async function getFollowingUsersApi() {
  return apiRequest<FollowingUserResponse[]>(
    "/api/follows/following",
    {},
    "팔로잉 목록을 불러오지 못했습니다.",
  );
}
