import { Link, useLocation, useNavigate } from "react-router";
import { Bell, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, LayoutGroup } from "motion/react";
import { createNotificationSocket } from "../api/notificationSocket";
import { applyLiveNotificationCreated, fetchUnreadCount, subscribeNotificationState } from "../utils/notificationState";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { clearAuthenticated, getCurrentUser, subscribeCurrentUser } from "../utils/auth";
import { DEFAULT_AVATAR } from "../utils/avatar";
import { logoutApi } from "../api/authApi";
import { DayNightSwitch } from "./DayNightSwitch";
import { useNightMode } from "../contexts/NightModeContext";

type NavigationProps = {
  isNight?: boolean;
  onToggle?: () => void;
};

export default function Navigation({ isNight: isNightProp, onToggle: onToggleProp }: NavigationProps) {
  const ctx = useNightMode();
  const isNight = isNightProp ?? ctx.isNight;
  const onToggle = onToggleProp ?? ctx.toggle;
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());
  const [hasUnread, setHasUnread] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profilePath = "/profile/me";

  const navItems = [
    { path: "/feed", label: "피드" },
    { path: "/explore", label: "탐색" },
    { path: "/projects", label: "매칭" },
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
        }
      },
    });

    notificationSocket.connect();
    return () => notificationSocket.close();
  }, [currentUser?.userId]);

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

  const NavLinks = () => (
    <LayoutGroup>
      <div className="flex items-center gap-1">
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className="relative px-4 py-2 transition-colors duration-200"
            >
              <span
                className={`relative z-[1] text-sm ${
                  active
                    ? "font-semibold text-[#00A88C]"
                    : isNight
                      ? "font-medium text-white/50 hover:text-white/80"
                      : "font-medium text-gray-500 hover:text-[#0F0F0F]"
                }`}
              >
                {item.label}
              </span>
              {active && (
                <motion.span
                  layoutId="navUnderline"
                  className="absolute bottom-0 left-1/2 h-[2px] w-5 -translate-x-1/2 rounded-full bg-[#00C9A7]"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          );
        })}
      </div>
    </LayoutGroup>
  );

  return (
    <>
      <header
        className={`sticky top-0 z-50 h-[68px] backdrop-blur-sm transition-all duration-500 ${
          isNight
            ? scrolled
              ? "border-b border-white/5 bg-[#0C1222]/90 shadow-[0_1px_20px_rgba(0,0,0,0.3)]"
              : "border-b border-white/5 bg-[#0C1222]/80"
            : scrolled
              ? "border-b border-transparent bg-white/95 shadow-sm"
              : "border-b border-gray-100 bg-white/95"
        }`}
      >
        <div className="grid h-full w-full grid-cols-[auto_1fr_auto] items-center px-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 transition-opacity hover:opacity-70">
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

          {/* Center nav */}
          <div className="flex justify-center">
            <NavLinks />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2.5">
            <DayNightSwitch isNight={isNight} onToggle={onToggle} />

            <button
              type="button"
              onClick={handleLogout}
              className={`hidden h-9 items-center gap-1.5 rounded-lg border px-3 text-sm font-semibold transition-colors md:flex ${
                isNight
                  ? "border-white/10 text-white/50 hover:border-[#FF5C3A]/40 hover:bg-[#FF5C3A]/10 hover:text-[#FF5C3A]"
                  : "border-gray-200 text-gray-600 hover:border-[#FF5C3A]/40 hover:bg-[#FFF7F4] hover:text-[#FF5C3A]"
              }`}
            >
              <LogOut className="size-4" />
              로그아웃
            </button>

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

            <Link
              to={profilePath}
              className="flex size-9 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#00C9A7] to-[#009E88] text-xs font-bold text-white shadow-sm shadow-[#00C9A7]/20 transition-shadow hover:shadow-md hover:shadow-[#00C9A7]/30"
            >
              <ImageWithFallback
                src={currentUser?.profileImage || DEFAULT_AVATAR}
                alt={currentUser?.nickname || currentUser?.name || "프로필"}
                className="size-full object-cover"
              />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
