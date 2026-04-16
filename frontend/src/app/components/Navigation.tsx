import { Link, useLocation } from "react-router";
import { Search, Bell, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  getStoredNotificationUnreadCount,
  subscribeToNotificationBadge,
} from "../utils/notificationBadge";

export default function Navigation() {
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCount, setUnreadCount] = useState(() => getStoredNotificationUnreadCount());

  useEffect(() => {
    setUnreadCount(getStoredNotificationUnreadCount());

    return subscribeToNotificationBadge(() => {
      setUnreadCount(getStoredNotificationUnreadCount());
    });
  }, [location.pathname]);

  const navItems = [
    { path: "/feed", label: "피드" },
    { path: "/explore", label: "탐색" },
    { path: "/projects", label: "매칭" },
    { path: "/messages", label: "메시지" },
    { path: "/collections", label: "컬렉션" },
  ];

  const searchSuggestions = [
    { type: "tag", text: "브랜딩" },
    { type: "tag", text: "UI/UX" },
    { type: "tag", text: "일러스트" },
    { type: "profile", name: "김지은", role: "브랜드 디자이너", avatar: "https://i.pravatar.cc/150?img=1" },
    { type: "profile", name: "박서준", role: "그래픽 디자이너", avatar: "https://i.pravatar.cc/150?img=2" },
  ];

  const isActive = (path: string) => {
    if (path === "/") return location.pathname === "/";
    return location.pathname.startsWith(path);
  };

  return (
      <>
        <nav className="border-b border-[#EAEAE8] bg-white sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-8">{/* Pickxel Logo with Branding */}
              <Link to="/" className="flex items-center gap-2">
                {/* Pixel Grid Symbol */}
                <div className="grid grid-cols-2 gap-[3px] w-[28px] h-[28px]">
                  <div className="rounded-[2px] bg-[#00C9A7]"></div>
                  <div className="rounded-[2px] bg-[#00C9A7] opacity-50"></div>
                  <div className="rounded-[2px] bg-[#FF5C3A] opacity-60"></div>
                  <div className="rounded-[2px] bg-[#FF5C3A]"></div>
                </div>
                {/* Wordmark */}
                <span className="text-2xl font-bold tracking-tight">
                <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A] text-[28px]">.</span>
              </span>
              </Link>
              <div className="hidden md:flex items-center gap-6">
                {navItems.map((item) => (
                    <Link
                        key={item.path}
                        to={item.path}
                        className={`text-sm transition-all ${
                            isActive(item.path)
                                ? "text-[#00C9A7] font-semibold border-b-2 border-[#00C9A7] pb-1"
                                : "text-[#5F5E5A] hover:text-[#00A88C]"
                        }`}
                    >
                      {item.label}
                    </Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link to="/notifications" className="p-2 hover:bg-[#A8F0E4]/20 rounded-full transition-colors text-[#444441] hover:text-[#00A88C] relative">
                <Bell className="size-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#FF5C3A] rounded-full"></span>
                )}
              </Link>
              <Link to="/profile/jieun" className="flex items-center gap-2 bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-md text-white px-4 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:scale-105 transition-all border border-white/30">
                <User className="size-4" />
                프로필
              </Link>
            </div>
          </div>
        </nav>
      </>
  );
}
