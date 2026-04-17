import { Link, useLocation } from "react-router";
import { Bell } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import {
  hasUnreadNotifications,
  subscribeNotificationState,
} from "../utils/notificationState";

export default function Navigation() {
  const location = useLocation();
  const [hasUnread, setHasUnread] = useState(hasUnreadNotifications);
  const [scrolled, setScrolled] = useState(false);

  const navItems = [
    { path: "/feed", label: "피드" },
    { path: "/explore", label: "탐색" },
    { path: "/projects", label: "매칭" },
    { path: "/messages", label: "메시지" },
    { path: "/collections", label: "컬렉션" },
  ];

  const isActive = (path: string) => location.pathname.startsWith(path);

  useEffect(() => {
    const refreshUnreadState = () => setHasUnread(hasUnreadNotifications());
    refreshUnreadState();
    return subscribeNotificationState(refreshUnreadState);
  }, []);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 48);
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
      {/* ━━ 기본 헤더 (상단 고정, 스크롤 시 숨김) ━━ */}
      <motion.header
        initial={false}
        animate={{ y: scrolled ? -80 : 0, opacity: scrolled ? 0 : 1 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="sticky top-0 z-50 h-[68px] bg-white border-b border-gray-100"
      >
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
              to="/profile/jieun"
              className="size-9 rounded-full bg-gradient-to-br from-[#00C9A7] to-[#009E88] flex items-center justify-center text-white text-xs font-bold shadow-sm shadow-[#00C9A7]/20 hover:shadow-md hover:shadow-[#00C9A7]/30 transition-shadow"
            >
              J
            </Link>
          </div>
        </div>
      </motion.header>

      {/* ━━ 아일랜드 (스크롤 시 나타남) ━━ */}
      <AnimatePresence>
        {scrolled && (
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.95 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="fixed top-3 left-1/2 -translate-x-1/2 z-50"
          >
            <div className="flex items-center bg-white/85 backdrop-blur-2xl border border-gray-200/60 rounded-full pl-3 pr-1.5 py-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)]">

              {/* 로고 (아일랜드) */}
              <Link to="/" className="flex items-center hover:opacity-70 transition-opacity mr-1">
                <div className="grid grid-cols-2 gap-[2px] w-[18px] h-[18px]">
                  <div className="rounded-[2px] bg-[#00C9A7]" />
                  <div className="rounded-[2px] bg-[#00C9A7] opacity-50" />
                  <div className="rounded-[2px] bg-[#FF5C3A] opacity-60" />
                  <div className="rounded-[2px] bg-[#FF5C3A]" />
                </div>
              </Link>

              {/* 구분선 */}
              <div className="w-px h-5 bg-gray-200/80 mx-1" />

              {/* 메뉴 (아일랜드) */}
              <NavLinks compact />

              {/* 구분선 */}
              <div className="w-px h-5 bg-gray-200/80 mx-1" />

              {/* 알림 + 프로필 (아일랜드) */}
              <div className="flex items-center gap-1.5">
                <Link
                  to="/notifications"
                  className="relative size-8 rounded-full flex items-center justify-center hover:bg-gray-100/80 transition-colors text-gray-500 hover:text-[#0F0F0F]"
                >
                  <Bell className="size-[18px]" />
                  {hasUnread && (
                    <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#FF5C3A] rounded-full ring-2 ring-white" />
                  )}
                </Link>
                <Link
                  to="/profile/jieun"
                  className="size-8 rounded-full bg-gradient-to-br from-[#00C9A7] to-[#009E88] flex items-center justify-center text-white text-[11px] font-bold shadow-sm shadow-[#00C9A7]/20 hover:shadow-md transition-shadow"
                >
                  J
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
