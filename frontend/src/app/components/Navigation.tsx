import { Link, useLocation, useNavigate } from "react-router";
import {
  Bell,
  Bookmark,
  Briefcase,
  CheckCircle2,
  Heart,
  LogOut,
  MessageCircle,
  MessageSquare,
  Sparkles,
  User,
  UserPlus,
} from "lucide-react";
import { createElement, memo, useEffect, useState } from "react";
import { motion, LayoutGroup, AnimatePresence } from "motion/react";
import type { LucideIcon } from "lucide-react";
import { createNotificationSocket } from "../api/notificationSocket";
import type { NotificationResponse } from "../api/notificationApi";
import { applyLiveNotificationCreated, fetchUnreadCount, subscribeNotificationState, buildNotificationTitle } from "../utils/notificationState";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { clearAuthenticated, getCurrentUser, subscribeCurrentUser } from "../utils/auth";
import { DEFAULT_AVATAR } from "../utils/avatar";
import { logoutApi } from "../api/authApi";
import { DayNightSwitch } from "./DayNightSwitch";
import { useNightMode } from "../contexts/NightModeContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

type NavigationProps = {
  isNight?: boolean;
  onToggle?: () => void;
};

type NavAccent = "pick" | "sell" | null;

function notificationTypeIcon(
  type: NotificationResponse["type"],
): { Icon: LucideIcon; iconClass: string; label: string } {
  switch (type) {
    case "LIKE":
      return { Icon: Heart, iconClass: "text-rose-400", label: "좋아요" };
    case "FOLLOW":
      return { Icon: UserPlus, iconClass: "text-sky-400", label: "팔로우" };
    case "PROJECT_APPLY":
      return { Icon: Briefcase, iconClass: "text-amber-400", label: "지원" };
    case "PROJECT_ACCEPT":
      return { Icon: CheckCircle2, iconClass: "text-emerald-400", label: "수락" };
    case "MESSAGE":
      return { Icon: MessageCircle, iconClass: "text-cyan-400", label: "메시지" };
    case "COLLECTION":
      return { Icon: Bookmark, iconClass: "text-violet-400", label: "저장" };
    case "COMMENT":
      return { Icon: MessageSquare, iconClass: "text-indigo-400", label: "댓글" };
    default:
      return { Icon: Sparkles, iconClass: "text-[#00C9A7]", label: "알림" };
  }
}

type NavItemConfig = {
  path: string;
  label: string;
  microLabel?: string;
  accent?: NavAccent;
};

function Navigation({ isNight: isNightProp, onToggle: onToggleProp }: NavigationProps) {
  const ctx = useNightMode();
  const isNight = isNightProp ?? ctx.isNight;
  const onToggle = onToggleProp ?? ctx.toggle;
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());
  const [hasUnread, setHasUnread] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showMiniNotification, setShowMiniNotification] = useState(false);
  const [lastMiniNotification, setLastMiniNotification] = useState<{
    title: string;
    type: NotificationResponse["type"];
  } | null>(null);
  const profilePath = "/profile/me";

  const navItems: NavItemConfig[] = [
    { path: "/feed", label: "피드" },
    { path: "/explore", label: "탐색", microLabel: "PICK", accent: "pick" },
    { path: "/projects", label: "매칭", microLabel: "SELL", accent: "sell" },
    { path: "/messages", label: "메시지" },
    { path: "/collections", label: "컬렉션" },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  const handleLogout = async () => {
    try {
      await logoutApi();
    } catch {
      // 클라이언트 인증 정보는 서버 로그아웃 실패와 무관하게 정리합니다.
    } finally {
      clearAuthenticated();
      navigate("/", { replace: true });
    }
  };

  useEffect(() => {
    const refreshUnreadState = async () => {
      try {
        const unread = await fetchUnreadCount();
        setHasUnread(unread);
      } catch {
        // ignore
      }
    };
    refreshUnreadState();

    const unsubscribe = subscribeNotificationState(() => {
      void refreshUnreadState();
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser?.userId) {
      return;
    }

    const notificationSocket = createNotificationSocket({
      onEvent: (event) => {
        if (event.type === "notification.created") {
          applyLiveNotificationCreated(event.notification, event.unreadCount);
          setHasUnread(event.unreadCount > 0);

          // 종 아이콘 옆 미니 팝업 띄우기
          setLastMiniNotification({
            title: buildNotificationTitle(event.notification),
            type: event.notification.type,
          });
          setShowMiniNotification(true);

          // 5초 후 자동으로 닫기
          setTimeout(() => setShowMiniNotification(false), 5000);
        }
      },
    });

    notificationSocket.connect();
    return () => notificationSocket.close();
  }, [currentUser?.userId, navigate]);

  useEffect(() => {
    const refreshCurrentUser = () => setCurrentUserState(getCurrentUser());
    refreshCurrentUser();
    return subscribeCurrentUser(refreshCurrentUser);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const underlineClass = (accent: NavAccent | undefined) => {
    if (accent === "sell") {
      return "bg-gradient-to-r from-[#FF5C3A] via-[#FF6B48] to-[#FF8A6E] shadow-[0_0_14px_rgba(255,92,58,0.28)]";
    }
    return "bg-gradient-to-r from-[#00C9A7] via-[#00B896] to-[#00A88C] shadow-[0_0_12px_rgba(0,201,167,0.22)]";
  };

  const microLabelClass = (accent: NavAccent | undefined, active: boolean) => {
    if (accent === "pick") {
      if (active) {
        return isNight ? "text-[#7EE8D0]" : "text-[#00A88C]";
      }
      return isNight ? "text-white/40" : "text-gray-400";
    }
    if (accent === "sell") {
      if (active) {
        return isNight ? "text-[#FFAA95]" : "text-[#E94F2F]";
      }
      return isNight ? "text-white/40" : "text-gray-400";
    }
    return "";
  };

  const mainLabelClass = (accent: NavAccent | undefined, active: boolean) => {
    if (!active) {
      // 활성 전환 시 굵기 변화로 링크 너비가 바뀌면 layoutId 언더바가 흔들릴 수 있어 비활성도 semibold 유지
      return isNight
        ? "font-semibold text-white/40 hover:text-white/78"
        : "font-semibold text-gray-500 hover:text-gray-900";
    }
    if (accent === "pick") {
      return isNight ? "font-semibold text-[#B4F5E8]" : "font-semibold text-[#006B5C]";
    }
    if (accent === "sell") {
      return isNight ? "font-semibold text-[#FFC8BC]" : "font-semibold text-[#B13A21]";
    }
    return isNight ? "font-semibold text-[#00A88C]" : "font-semibold text-[#00A88C]";
  };

  const NavLinks = () => (
    <LayoutGroup id="nav-main-links">
      <nav
        aria-label="주요 메뉴"
        className="flex max-w-[100vw] flex-nowrap items-end gap-2 overflow-x-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden sm:gap-3 md:gap-4"
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          const accent = item.accent ?? null;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative inline-flex min-h-11 shrink-0 flex-col items-center justify-end gap-1 px-3.5 pb-2.5 pt-1 transition-colors duration-200 sm:min-h-[2.75rem] sm:px-5 sm:pb-3 md:px-6 ${
                isNight
                  ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C9A7]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C1222]"
                  : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C9A7]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              }`}
            >
              {item.microLabel ? (
                <span
                  className={`text-[10px] font-bold uppercase leading-none tracking-[0.12em] sm:text-[11px] ${microLabelClass(accent, active)}`}
                  aria-hidden
                >
                  {item.microLabel}
                </span>
              ) : (
                <span className="pointer-events-none h-[12px] shrink-0 sm:h-[13px]" aria-hidden />
              )}
              <span
                className={`relative z-[1] whitespace-nowrap text-[15px] leading-tight tracking-normal sm:text-base ${mainLabelClass(accent, active)}`}
              >
                {item.label}
              </span>
              {active && (
                <motion.span
                  layoutId="navUnderline"
                  className={`pointer-events-none absolute bottom-0 left-0 right-0 z-0 h-[3px] rounded-full ${underlineClass(accent)}`}
                  style={{ backfaceVisibility: "hidden" }}
                  transition={{
                    type: "tween",
                    duration: 0.32,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  aria-hidden
                />
              )}
            </Link>
          );
        })}
      </nav>
    </LayoutGroup>
  );

  const miniNotifVisual = lastMiniNotification ? notificationTypeIcon(lastMiniNotification.type) : null;

  return (
    <>
      <header
        className={`sticky top-0 z-50 min-h-[72px] h-[72px] sm:min-h-[76px] sm:h-[76px] backdrop-blur-sm transition-all duration-500 ${
          isNight
            ? scrolled
              ? "border-b border-white/5 bg-[#0C1222]/90 shadow-[0_1px_20px_rgba(0,0,0,0.3)]"
              : "border-b border-white/5 bg-[#0C1222]/80"
            : scrolled
              ? "border-b border-transparent bg-white/95 shadow-sm"
              : "border-b border-gray-100 bg-white/95"
        }`}
      >
        <div className="grid h-full w-full grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-2 px-4 sm:gap-3 sm:px-6 lg:px-8">
          {/* Logo */}
          <Link
            to="/"
            className="flex min-w-0 items-center justify-self-start gap-2.5 transition-opacity hover:opacity-70"
          >
            <div className="grid h-[24px] w-[24px] grid-cols-2 gap-[3px]">
              <div className="rounded-[2px] bg-[#00C9A7]" />
              <div className="rounded-[2px] bg-[#00C9A7] opacity-50" />
              <div className="rounded-[2px] bg-[#FF5C3A] opacity-60" />
              <div className="rounded-[2px] bg-[#FF5C3A]" />
            </div>
            <span
              className={`select-none text-xl font-bold leading-none tracking-tight transition-colors duration-500 ${
                isNight ? "text-white" : ""
              }`}
            >
              <span className="text-[#FF5C3A]">p</span>ick
              <span className="text-[#00C9A7]">x</span>el
              <span className="text-[#FF5C3A]">.</span>
            </span>
          </Link>

          {/* Center nav: 좌/우 1fr 대칭으로 auto 열(메뉴)이 뷰포트 정중앙에 옴 */}
          <div className="flex min-w-0 max-w-full justify-center justify-self-center">
            <NavLinks />
          </div>

          {/* Actions */}
          <div className="flex min-w-0 items-center justify-end justify-self-end gap-3.5 sm:gap-4">
            <DayNightSwitch isNight={isNight} onToggle={onToggle} />

            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <Link
                to="/notifications"
                className={`relative flex size-10 items-center justify-center rounded-full transition-colors ${
                  isNight
                    ? "text-white/50 hover:bg-white/10 hover:text-white"
                    : "text-gray-500 hover:bg-gray-100 hover:text-[#0F0F0F]"
                }`}
              >
                <Bell className="size-5" />
                {hasUnread && (
                  <span
                    className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-[#FF5C3A] ring-2 ${
                      isNight ? "ring-[#0C1222]" : "ring-white"
                    }`}
                  />
                )}
              </Link>

              {/* 미니 알림: 부모를 종 아이콘과 동일 40px로 고정해 left-1/2가 아이콘 중심과 일치하도록 함 */}
              <AnimatePresence>
                {showMiniNotification && lastMiniNotification && miniNotifVisual && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.96, filter: "blur(2px)" }}
                    animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
                    exit={{ opacity: 0, y: 6, scale: 0.98, filter: "blur(1px)" }}
                    transition={{ type: "spring", stiffness: 420, damping: 32, mass: 0.6 }}
                    className="pointer-events-none absolute right-0 top-full z-50 mt-2 w-[min(20.5rem,calc(100vw-0.75rem))] max-w-[calc(100vw-0.75rem)] origin-top-right sm:mt-2.5"
                  >
                    <div
                      className={`group/card relative overflow-hidden rounded-2xl border p-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.12)] backdrop-blur-2xl sm:p-4 ${
                        isNight
                          ? "border-white/15 bg-slate-950/50 ring-1 ring-white/10"
                          : "border-white/55 bg-white/40 ring-1 ring-black/[0.06]"
                      }`}
                    >
                      <div
                        className={`pointer-events-none absolute inset-0 rounded-2xl bg-gradient-to-br ${
                          isNight ? "from-white/[0.07] to-transparent" : "from-white/50 to-transparent"
                        }`}
                        aria-hidden
                      />

                      {/* 꼬리 — 카드와 동일 톤 유지 */}
                      <div
                        className={`absolute -top-1.5 right-[1.625rem] h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t ${
                          isNight
                            ? "border-white/15 bg-slate-950/50"
                            : "border-white/55 bg-white/40"
                        }`}
                      />

                      <div className="pointer-events-auto relative z-10 flex min-w-0 items-start gap-3">
                        <div
                          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                            isNight ? "bg-white/[0.08]" : "bg-white/55"
                          }`}
                        >
                          <span className="sr-only">{miniNotifVisual.label}</span>
                          {createElement(miniNotifVisual.Icon, {
                            className: `size-[1.35rem] ${miniNotifVisual.iconClass}`,
                            strokeWidth: 2,
                            "aria-hidden": true,
                          })}
                        </div>
                        <div className="min-w-0 flex-1 flex flex-col gap-2.5">
                          <p
                            className={`w-full min-w-0 text-left text-[0.8125rem] font-semibold leading-snug tracking-tight [overflow-wrap:anywhere] sm:text-sm ${
                              isNight ? "text-white/95" : "text-gray-900"
                            }`}
                          >
                            {lastMiniNotification.title}
                          </p>
                          <button
                            type="button"
                            onClick={() => navigate("/notifications")}
                            className="group/btn inline-flex w-fit items-center gap-0.5 text-left text-[0.7rem] font-bold uppercase tracking-wide text-[#00C9A7] transition-all duration-200 hover:gap-1.5 hover:text-[#00E0BA] sm:text-[11px] sm:tracking-wider"
                          >
                            자세히 보기
                            <span
                              aria-hidden
                              className="inline-block transition-transform duration-200 group-hover/btn:translate-x-0.5"
                            >
                              →
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <DropdownMenu modal={false}>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  aria-label="계정 메뉴"
                  className={`flex size-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#00C9A7] to-[#009E88] text-xs font-bold text-white shadow-sm shadow-[#00C9A7]/20 outline-none transition-shadow hover:shadow-md hover:shadow-[#00C9A7]/30 focus-visible:ring-2 focus-visible:ring-[#00C9A7] focus-visible:ring-offset-2 ${
                    isNight ? "focus-visible:ring-offset-[#0C1222]" : "focus-visible:ring-offset-white"
                  }`}
                >
                  <ImageWithFallback
                    src={currentUser?.profileImage || DEFAULT_AVATAR}
                    alt={currentUser?.nickname || currentUser?.name || "프로필"}
                    className="size-full object-cover"
                  />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                side="bottom"
                sideOffset={6}
                className={`z-[100] min-w-[10.5rem] overflow-y-visible overflow-x-hidden p-1 shadow-xl ${
                  isNight
                    ? "border border-white/10 bg-[#1A1F2E] text-white"
                    : "border border-gray-200 bg-white text-[#0F0F0F] shadow-lg"
                }`}
              >
                <DropdownMenuItem
                  className={
                    isNight
                      ? "cursor-pointer gap-2 text-white focus:bg-white/10 focus:text-white data-[highlighted]:bg-white/10 data-[highlighted]:text-white"
                      : "cursor-pointer gap-2 focus:bg-gray-100 focus:text-[#0F0F0F] data-[highlighted]:bg-gray-100"
                  }
                  onSelect={() => navigate(profilePath)}
                >
                  <User className="size-4 shrink-0" />
                  프로필 보기
                </DropdownMenuItem>
                <DropdownMenuSeparator
                  className={isNight ? "bg-white/10" : "bg-gray-200"}
                />
                <DropdownMenuItem
                  className={
                    isNight
                      ? "cursor-pointer gap-2 text-[#FF8A6E] focus:bg-[#FF5C3A]/15 focus:text-[#FFB6A6] data-[highlighted]:bg-[#FF5C3A]/15 data-[highlighted]:text-[#FFB6A6]"
                      : "cursor-pointer gap-2 text-[#B13A21] focus:bg-[#FFF7F4] focus:text-[#B13A21] data-[highlighted]:bg-[#FFF7F4]"
                  }
                  onSelect={() => {
                    void handleLogout();
                  }}
                >
                  <LogOut className="size-4 shrink-0" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
    </>
  );
}

export default memo(Navigation);
