import { ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router";
import { ImageWithFallback } from "../figma/ImageWithFallback";
import type { FollowingSidebarProfile } from "../../hooks/useFollowingSidebar";

type FollowingSidebarProps = {
  isOpen: boolean;
  profiles: FollowingSidebarProfile[];
  visibleProfiles: FollowingSidebarProfile[];
  hiddenCount: number;
  showAll: boolean;
  isLoading: boolean;
  error: string | null;
  onToggleOpen: () => void;
  onShowAllToggle: () => void;
};

export function FollowingSidebar({
  isOpen,
  profiles,
  visibleProfiles,
  hiddenCount,
  showAll,
  isLoading,
  error,
  onToggleOpen,
  onShowAllToggle,
}: FollowingSidebarProps) {
  return (
    <div className="sticky top-24 max-h-[calc(100vh-7rem)] w-80 space-y-4 self-start overflow-y-auto">
      <button
        type="button"
        onClick={onToggleOpen}
        aria-expanded={isOpen}
        className="flex w-full items-center justify-between gap-4 rounded-xl border border-white/20 bg-gradient-to-br from-[#00C9A7]/90 to-[#00A88C]/90 p-5 text-left shadow-md transition-all hover:shadow-lg"
      >
        <div>
          <h3 className="text-xl font-bold text-white">팔로잉한 사람</h3>
          <p className="mt-1 text-sm text-white/80">{profiles.length}명 팔로잉 중</p>
        </div>
        <span className="flex size-9 shrink-0 items-center justify-center rounded-lg border border-white/25 bg-white/15 text-white">
          {isOpen ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
        </span>
      </button>

      {!isOpen && (
        <button
          type="button"
          onClick={onToggleOpen}
          className="flex w-full items-center justify-between gap-3 rounded-xl border border-[#00C9A7]/20 bg-white p-4 shadow-sm transition-all hover:border-[#00C9A7] hover:shadow-md"
        >
          <div className="flex -space-x-2">
            {profiles.slice(0, 3).map((profile) => (
              <ImageWithFallback
                key={profile.id}
                src={profile.avatar}
                alt={profile.name}
                className="size-9 rounded-full border-2 border-white object-cover"
              />
            ))}
          </div>
          <span className="text-sm font-semibold text-[#00A88C]">목록 펼치기</span>
        </button>
      )}

      {isOpen && (
        <div className="space-y-3 pb-4">
          {isLoading && (
            <div className="rounded-xl border border-dashed border-[#BDEFD8] bg-white px-4 py-6 text-center text-sm text-gray-500">
              팔로잉 목록을 불러오는 중입니다.
            </div>
          )}
          {!isLoading && error && (
            <div className="rounded-xl border border-[#FFB9AA] bg-[#FFF7F4] px-4 py-4 text-sm text-[#B13A21]">
              {error}
            </div>
          )}
          {!isLoading && !error && visibleProfiles.length === 0 && (
            <div className="rounded-xl border border-dashed border-[#BDEFD8] bg-white px-4 py-6 text-center text-sm text-gray-500">
              아직 팔로잉한 사용자가 없습니다.
            </div>
          )}

          {!isLoading &&
            !error &&
            visibleProfiles.map((profile) => (
              <Link
                to={`/profile/${encodeURIComponent(profile.username)}`}
                key={profile.id}
                className="group block rounded-xl border-2 border-transparent bg-white p-4 shadow-sm transition-all hover:border-[#00C9A7] hover:shadow-lg"
              >
                <div className="mb-3 flex items-start gap-3">
                  <div className="relative shrink-0">
                    <ImageWithFallback
                      src={profile.avatar}
                      alt={profile.name}
                      className="size-12 rounded-full object-cover ring-2 ring-[#00C9A7]/40 transition-all group-hover:ring-[#00C9A7]"
                    />
                    <div className="absolute bottom-0 right-0 size-3.5 rounded-full border-2 border-white bg-[#00C9A7] shadow-sm"></div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4
                      title={profile.name}
                      className="truncate text-base font-bold text-[#0F0F0F] transition-colors group-hover:text-[#00A88C]"
                    >
                      {profile.name}
                    </h4>
                    <p title={profile.role} className="truncate text-sm text-gray-500">
                      {profile.role}
                    </p>
                    <div className="mt-2 inline-flex items-center rounded-full bg-[#E7FAF6] px-3 py-1.5 text-xs font-semibold text-[#007D69]">
                      팔로워 {profile.followerCount}
                    </div>
                  </div>
                </div>
                <div className="mb-3 flex items-center justify-between px-2">
                  <div className="text-center">
                    <p className="text-base font-bold leading-none text-[#0F0F0F]">{profile.followerCount}</p>
                    <p className="mt-1 text-xs font-medium text-gray-500">팔로워</p>
                  </div>
                  <div className="h-8 w-px bg-gray-200"></div>
                  <div className="text-center">
                    <p className="text-base font-bold leading-none text-[#0F0F0F]">{profile.feedCount}</p>
                    <p className="mt-1 text-xs font-medium text-gray-500">작품</p>
                  </div>
                </div>
                <div className="w-full rounded-lg border border-white/30 bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 py-2.5 text-center text-sm font-semibold text-white transition-all group-hover:scale-[1.02] group-hover:shadow-lg">
                  <span>프로필 보기</span>
                </div>
              </Link>
            ))}

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={onShowAllToggle}
              className="w-full rounded-lg border border-[#00C9A7]/25 bg-white px-4 py-3 text-sm font-semibold text-[#00A88C] transition-all hover:border-[#00C9A7] hover:bg-[#E7FAF6]"
            >
              {showAll ? "3명만 보기" : `팔로잉 ${hiddenCount}명 더 보기`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
