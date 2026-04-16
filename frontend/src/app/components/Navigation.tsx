import { Link, useLocation } from "react-router";
import { Search, Bell, User, X } from "lucide-react";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import {
  hasUnreadNotifications,
  subscribeNotificationState,
} from "../utils/notificationState";

export default function Navigation() {
  const location = useLocation();
  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasUnread, setHasUnread] = useState(hasUnreadNotifications);

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

  useEffect(() => {
    const refreshUnreadState = () => setHasUnread(hasUnreadNotifications());
    refreshUnreadState();
    return subscribeNotificationState(refreshUnreadState);
  }, []);

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
              <button
                  onClick={() => setShowSearch(true)}
                  className="p-2 hover:bg-[#A8F0E4]/20 rounded-full transition-colors text-[#444441] hover:text-[#00A88C]"
              >
                <Search className="size-5" />
              </button>
              <Link to="/notifications" className="p-2 hover:bg-[#A8F0E4]/20 rounded-full transition-colors text-[#444441] hover:text-[#00A88C] relative">
                <Bell className="size-5" />
                {hasUnread && (
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

        {/* Search Modal */}
        {showSearch && (
            <div
                className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-start justify-center pt-20"
                onClick={() => setShowSearch(false)}
            >
              <div
                  className="bg-[#F7F7F5] rounded-2xl w-full max-w-2xl shadow-2xl"
                  onClick={(e) => e.stopPropagation()}
              >
                {/* Search Input */}
                <div className="p-6 border-b border-[#EAEAE8]">
                  <div className="flex items-center gap-3">
                    <Search className="size-5 text-[#888780]" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="작품, 디자이너, 태그를 검색하세요..."
                        className="flex-1 text-lg outline-none"
                        autoFocus
                    />
                    <button
                        onClick={() => setShowSearch(false)}
                        className="p-2 hover:bg-[#F1EFE8] rounded-full transition-colors"
                    >
                      <X className="size-5 text-[#5F5E5A]" />
                    </button>
                  </div>
                </div>

                {/* Search Results */}
                <div className="p-4 max-h-[60vh] overflow-y-auto">
                  {searchQuery === "" ? (
                      <>
                        <h3 className="text-sm font-semibold text-[#717182] mb-3 px-2">인기 태그</h3>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {searchSuggestions.filter(s => s.type === "tag").map((suggestion, idx) => (
                              <button
                                  key={idx}
                                  className="px-4 py-2 bg-[#A8F0E4]/20 text-[#00A88C] rounded-full text-sm font-medium hover:bg-[#00C9A7]/90 hover:backdrop-blur-md hover:text-white transition-all border border-[#00C9A7]/20"
                              >
                                #{suggestion.text}
                              </button>
                          ))}
                        </div>

                        <h3 className="text-sm font-semibold text-[#717182] mb-3 px-2">추천 디자이너</h3>
                        <div className="space-y-2">
                          {searchSuggestions.filter(s => s.type === "profile").map((suggestion, idx) => (
                              <Link
                                  key={idx}
                                  to={`/profile/${suggestion.name}`}
                                  onClick={() => setShowSearch(false)}
                                  className="flex items-center gap-3 p-3 rounded-lg hover:bg-[#F7F7F5] transition-colors"
                              >
                                <ImageWithFallback
                                    src={suggestion.avatar!}
                                    alt={suggestion.name!}
                                    className="size-12 rounded-full ring-2 ring-[#00C9A7]/30"
                                />
                                <div>
                                  <h4 className="font-semibold text-sm">{suggestion.name}</h4>
                                  <p className="text-xs text-[#717182]">{suggestion.role}</p>
                                </div>
                              </Link>
                          ))}
                        </div>
                      </>
                  ) : (
                      <div className="text-center py-12 text-[#717182]">
                        <Search className="size-12 mx-auto mb-3 opacity-30" />
                        <p>"{searchQuery}"에 대한 검색 결과</p>
                        <p className="text-sm mt-2">실제 검색 기능은 백엔드 연동 후 작동합니다.</p>
                      </div>
                  )}
                </div>
              </div>
            </div>
        )}
      </>
  );
}
