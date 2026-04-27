import { Link, useLocation, useNavigate } from "react-router";
import { Bell, LogOut } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, LayoutGroup } from "motion/react";
import { fetchUnreadCount } from "../utils/notificationState";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { clearAuthenticated, getCurrentUser, subscribeCurrentUser } from "../utils/auth";
import { DEFAULT_AVATAR } from "../utils/avatar";
import { logoutApi } from "../api/authApi";

export default function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUserState] = useState(() => getCurrentUser());
  const [hasUnread, setHasUnread] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const profilePath = "/profile/me";
  const profileInitial = (currentUser?.nickname || currentUser?.name || "J").slice(0, 1).toUpperCase();

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
  }, []);

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
  /* ── 메뉴 링크 (공통) ── */
  const NavLinks = ({ compact = false }: { compact?: boolean }) => (
    <LayoutGroup>
      <div className={`flex items-center ${compact ? "gap-0" : "gap-1"}`}>
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`relative transition-colors duration-200 ${
                compact ? "px-3 py-2" : "px-4 py-2"
              }`}
            >
              <span
                className={`relative z-[1] ${compact ? "text-[13px]" : "text-sm"} ${
                  active
                    ? "text-[#00A88C] font-semibold"
                    : "text-gray-500 hover:text-[#0F0F0F] font-medium"
                }`}
              >
                {item.label}
              </span>
              {active && (
                <motion.span
                  layoutId="navUnderline"
                  className="absolute bottom-0 left-1/2 -translate-x-1/2 w-5 h-[2px] rounded-full bg-[#00C9A7]"
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
      {/* ━━ 기본 헤더 (상단 고정, 스크롤 시 그림자) ━━ */}
      <header className={`sticky top-0 z-50 h-[68px] bg-white/95 backdrop-blur-sm transition-all duration-300 ${scrolled ? "shadow-sm border-b-transparent" : "border-b border-gray-100"}`}>
        <div className="w-full h-full px-8 grid grid-cols-[auto_1fr_auto] items-center">

          {/* 좌: 로고 */}
          <Link to="/" className="flex items-center gap-2.5 hover:opacity-70 transition-opacity">
            <div className="grid grid-cols-2 gap-[3px] w-[24px] h-[24px]">
              <div className="rounded-[2px] bg-[#00C9A7]" />
              <div className="rounded-[2px] bg-[#00C9A7] opacity-50" />
              <div className="rounded-[2px] bg-[#FF5C3A] opacity-60" />
              <div className="rounded-[2px] bg-[#FF5C3A]" />
            </div>
            <span className="text-xl font-bold tracking-tight leading-none select-none">
              <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
            </span>
          </Link>

          {/* 중앙: 메뉴 */}
          <div className="flex justify-center">
            <NavLinks />
          </div>

          {/* 우: 액션 */}
          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handleLogout}
              className="hidden h-9 items-center gap-1.5 rounded-lg border border-gray-200 px-3 text-sm font-semibold text-gray-600 transition-colors hover:border-[#FF5C3A]/40 hover:bg-[#FFF7F4] hover:text-[#FF5C3A] md:flex"
            >
              <LogOut className="size-4" />
              로그아웃
            </button>
            <Link
              to="/notifications"
              className="relative size-10 rounded-full flex items-center justify-center hover:bg-gray-100 transition-colors text-gray-500 hover:text-[#0F0F0F]"
            >
              <Bell className="size-5" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#FF5C3A] rounded-full ring-2 ring-white" />
              )}
            </Link>
            <Link
              to={profilePath}
              className="size-9 overflow-hidden rounded-full bg-gradient-to-br from-[#00C9A7] to-[#009E88] flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-[#00C9A7]/20 hover:shadow-md hover:shadow-[#00C9A7]/30 transition-shadow"
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
