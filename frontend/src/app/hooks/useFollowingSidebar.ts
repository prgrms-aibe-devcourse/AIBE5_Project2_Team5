import { useEffect, useState } from "react";
import { getFollowingUsersApi } from "../api/followApi";
import { getProfileApi, getProfileFeedsApi } from "../api/profileApi";
import { normalizeDesignerJobLabel } from "../utils/matchingCategories";
import { getUserAvatar } from "../utils/avatar";

export type FollowingSidebarProfile = {
  id: number;
  name: string;
  role: string;
  avatar: string;
  username: string;
  followerCount: number;
  feedCount: number;
};

function toFollowingRole(role: "CLIENT" | "DESIGNER") {
  if (role === "CLIENT") return "프로젝트 클라이언트";
  return "디자이너";
}

export function useFollowingSidebar() {
  const [profiles, setProfiles] = useState<FollowingSidebarProfile[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadFollowingProfiles() {
      try {
        setIsLoading(true);
        setError(null);

        const users = await getFollowingUsersApi();
        if (!mounted) return;

        const sidebarProfiles = await Promise.all(
          (users ?? []).map(async (user) => {
            const profileKey = user.nickname || String(user.userId);
            const profile = await getProfileApi(profileKey).catch(() => null);
            const feeds = await getProfileFeedsApi(profileKey).catch(() => []);

            return {
              id: user.userId,
              name: user.nickname || user.name || `User ${user.userId}`,
              role:
                normalizeDesignerJobLabel(profile?.job) ||
                toFollowingRole(user.role),
              avatar: getUserAvatar(
                profile?.profileImage ?? user.profileImage,
                user.userId,
                user.nickname || user.name,
              ),
              username: profileKey,
              followerCount: profile?.followerCount ?? 0,
              feedCount: Array.isArray(feeds) ? feeds.length : 0,
            };
          })
        );

        if (!mounted) return;
        setProfiles(sidebarProfiles);
      } catch (error) {
        if (!mounted) return;
        setProfiles([]);
        setError(
          error instanceof Error ? error.message : "팔로잉 목록을 불러오지 못했습니다."
        );
      } finally {
        if (mounted) {
          setIsLoading(false);
        }
      }
    }

    void loadFollowingProfiles();

    return () => {
      mounted = false;
    };
  }, []);

  return {
    profiles,
    isLoading,
    error,
  };
}
