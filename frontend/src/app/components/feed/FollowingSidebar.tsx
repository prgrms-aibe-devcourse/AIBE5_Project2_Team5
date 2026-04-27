import { ChevronDown, ChevronUp, Users, Eye } from "lucide-react";
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
  isNight?: boolean;
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
  isNight = false,
  onToggleOpen,
  onShowAllToggle,
}: FollowingSidebarProps) {
  const n = isNight;

  return (
    <div className="sticky top-24 max-h-[calc(100vh-7rem)] w-80 self-start overflow-y-auto">
      <div
        className={`overflow-hidden rounded-3xl transition-colors duration-500 ${
          n
            ? "bg-[#141925] shadow-[0_2px_16px_rgba(0,0,0,0.3)]"
            : "bg-white shadow-[0_2px_16px_rgba(0,0,0,0.04)]"
        }`}
      >
        {/* Header */}
        <button
          type="button"
          onClick={onToggleOpen}
          aria-expanded={isOpen}
          className={`flex w-full items-center justify-between px-5 py-4 text-left transition-colors ${
            n ? "hover:bg-white/[0.02]" : "hover:bg-black/[0.01]"
          }`}
        >
          <div className="flex items-center gap-3">
            <span
              className={`flex size-9 items-center justify-center rounded-xl ${
                n ? "bg-[#00C9A7]/10" : "bg-[#00C9A7]/8"
              }`}
            >
              <Users className="size-4 text-[#00C9A7]" />
            </span>
            <div>
              <h3
                className={`text-sm font-bold tracking-tight ${
                  n ? "text-white" : "text-[#1a1a1a]"
                }`}
              >
                팔로잉
              </h3>
              <p
                className={`text-[11px] ${n ? "text-white/30" : "text-[#aaa]"}`}
              >
                {profiles.length}명
              </p>
            </div>
          </div>
          <span
            className={`flex size-7 items-center justify-center rounded-lg transition-colors ${
              n
                ? "bg-white/5 text-white/40 hover:bg-white/10"
                : "bg-black/[0.03] text-[#aaa] hover:bg-black/[0.06]"
            }`}
          >
            {isOpen ? (
              <ChevronUp className="size-4" />
            ) : (
              <ChevronDown className="size-4" />
            )}
          </span>
        </button>

        {/* Collapsed preview */}
        {!isOpen && profiles.length > 0 && (
          <div className="px-5 pb-4">
            <button
              type="button"
              onClick={onToggleOpen}
              className={`flex w-full items-center gap-3 rounded-2xl border p-3 transition-all ${
                n
                  ? "border-white/[0.04] hover:border-[#00C9A7]/20 hover:bg-white/[0.02]"
                  : "border-black/[0.04] hover:border-[#00C9A7]/20 hover:bg-[#00C9A7]/[0.02]"
              }`}
            >
              <div className="flex -space-x-2.5">
                {profiles.slice(0, 3).map((profile) => (
                  <ImageWithFallback
                    key={profile.id}
                    src={profile.avatar}
                    alt={profile.name}
                    className={`size-8 rounded-full border-2 object-cover ${
                      n ? "border-[#141925]" : "border-white"
                    }`}
                  />
                ))}
              </div>
              <span
                className={`text-xs font-medium ${
                  n ? "text-white/35" : "text-[#999]"
                }`}
              >
                펼쳐보기
              </span>
            </button>
          </div>
        )}

        {/* Expanded list */}
        {isOpen && (
          <div className="px-3 pb-3">
            {/* Divider */}
            <div
              className={`mx-2 mb-3 h-px ${
                n ? "bg-white/[0.04]" : "bg-black/[0.04]"
              }`}
            />

            {isLoading && (
              <div
                className={`rounded-2xl px-4 py-8 text-center text-xs ${
                  n ? "text-white/25" : "text-[#bbb]"
                }`}
              >
                불러오는 중...
              </div>
            )}

            {!isLoading && error && (
              <div
                className={`rounded-2xl px-4 py-4 text-xs ${
                  n
                    ? "bg-[#FF5C3A]/5 text-[#FF8A70]/70"
                    : "bg-[#FF5C3A]/5 text-[#c44]"
                }`}
              >
                {error}
              </div>
            )}

            {!isLoading && !error && visibleProfiles.length === 0 && (
              <div
                className={`rounded-2xl px-4 py-8 text-center text-xs ${
                  n ? "text-white/25" : "text-[#bbb]"
                }`}
              >
                아직 팔로잉한 사용자가 없습니다.
              </div>
            )}

            {/* Profile cards */}
            <div className="space-y-1">
              {!isLoading &&
                !error &&
                visibleProfiles.map((profile) => (
                  <Link
                    to={`/profile/${encodeURIComponent(profile.username)}`}
                    key={profile.id}
                    className={`group flex items-center gap-3 rounded-2xl px-3 py-3 transition-all ${
                      n
                        ? "hover:bg-white/[0.03]"
                        : "hover:bg-black/[0.02]"
                    }`}
                  >
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <ImageWithFallback
                        src={profile.avatar}
                        alt={profile.name}
                        className="size-11 rounded-full object-cover transition-all group-hover:scale-105"
                      />
                      <div
                        className={`absolute -bottom-0.5 -right-0.5 size-3 rounded-full border-[1.5px] bg-[#00C9A7] ${
                          n ? "border-[#141925]" : "border-white"
                        }`}
                      />
                    </div>

                    {/* Info */}
                    <div className="min-w-0 flex-1">
                      <h4
                        title={profile.name}
                        className={`truncate text-[13px] font-semibold leading-tight transition-colors group-hover:text-[#00C9A7] ${
                          n ? "text-white/85" : "text-[#1a1a1a]"
                        }`}
                      >
                        {profile.name}
                      </h4>
                      <p
                        title={profile.role}
                        className={`truncate text-[11px] leading-tight ${
                          n ? "text-white/30" : "text-[#999]"
                        }`}
                      >
                        {profile.role}
                      </p>
                      <div className="mt-1 flex items-center gap-2.5">
                        <span
                          className={`text-[10px] font-medium ${
                            n ? "text-white/20" : "text-[#bbb]"
                          }`}
                        >
                          팔로워 {profile.followerCount}
                        </span>
                        <span
                          className={`text-[10px] font-medium ${
                            n ? "text-white/20" : "text-[#bbb]"
                          }`}
                        >
                          작품 {profile.feedCount}
                        </span>
                      </div>
                    </div>

                    {/* View icon */}
                    <span
                      className={`flex size-7 shrink-0 items-center justify-center rounded-lg opacity-0 transition-all group-hover:opacity-100 ${
                        n
                          ? "bg-white/5 text-[#00C9A7]"
                          : "bg-[#00C9A7]/8 text-[#00A88C]"
                      }`}
                    >
                      <Eye className="size-3.5" />
                    </span>
                  </Link>
                ))}
            </div>

            {/* Show more / less */}
            {hiddenCount > 0 && (
              <>
                <div
                  className={`mx-2 my-2 h-px ${
                    n ? "bg-white/[0.04]" : "bg-black/[0.04]"
                  }`}
                />
                <button
                  type="button"
                  onClick={onShowAllToggle}
                  className={`w-full rounded-xl px-4 py-2.5 text-xs font-medium transition-all ${
                    n
                      ? "text-[#00C9A7]/60 hover:bg-[#00C9A7]/5 hover:text-[#00C9A7]"
                      : "text-[#00A88C]/70 hover:bg-[#00C9A7]/5 hover:text-[#00A88C]"
                  }`}
                >
                  {showAll ? "3명만 보기" : `${hiddenCount}명 더 보기`}
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
