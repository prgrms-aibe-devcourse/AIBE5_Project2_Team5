import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router";
import {
  Bell,
  Check,
  CheckCheck,
  CheckCircle,
  Clock3,
  Heart,
  MessageCircle,
  Sparkles,
  Upload,
} from "lucide-react";
import { motion } from "motion/react";
import Navigation from "../components/Navigation";
import {
  hydrateNotificationReadState,
  syncStoredNotifications,
} from "../utils/notificationBadge";

type NotificationTab = "all" | "proposal" | "activity" | "system";
type NotificationActionId = "view-proposal" | "upload-material" | "reply" | "save-for-later";

type NotificationItem = {
  id: number;
  category: Exclude<NotificationTab, "all">;
  title: string;
  subtitle?: string;
  quote?: string;
  time: string;
  isRead: boolean;
  iconBg: string;
  icon: JSX.Element;
  avatar?: boolean;
  primaryAction?: {
    id: NotificationActionId;
    label: string;
  };
  secondaryAction?: {
    id: NotificationActionId;
    label: string;
  };
};

const initialVisibleCount = 3;
const loadMoreCount = 4;
const listGap = 12;
const baseCardHeight = 168;
const averageCardHeight = 208;

const initialNotifications: NotificationItem[] = [
  {
    id: 1,
    category: "proposal",
    title: "'Studio A'에서 프로젝트 제안을 보냈습니다.",
    subtitle: "브랜드 아이덴티티 리뉴얼 프로젝트에 참여 제안을 받았습니다.",
    time: "방금 전",
    isRead: false,
    iconBg: "bg-[#4DD4AC]",
    icon: <Sparkles className="size-5 text-black" />,
    primaryAction: {
      id: "view-proposal",
      label: "제안 확인하기",
    },
  },
  {
    id: 2,
    category: "activity",
    title: "디자이너 12명이 'Neo-Vintage Brand Concept' 작업을 좋아합니다.",
    time: "2시간 전",
    isRead: true,
    iconBg: "bg-white border border-gray-300",
    icon: <Heart className="size-5" />,
    avatar: true,
  },
  {
    id: 3,
    category: "proposal",
    title: "프로젝트 'AI 서비스 소개서'에 보완 요청이 도착했습니다.",
    subtitle: "검토 후 자료를 다시 업로드하면 제안 심사가 재개됩니다.",
    time: "5시간 전",
    isRead: false,
    iconBg: "bg-white border border-gray-300",
    icon: <Upload className="size-5" />,
    primaryAction: {
      id: "upload-material",
      label: "자료 업로드하기",
    },
  },
  {
    id: 4,
    category: "activity",
    title: "김서영 님이 프로젝트 메시지에 답글을 남겼습니다.",
    quote:
      "레퍼런스 무드가 명확해서 좋았어요. 방향성에 맞는 시안 초안을 먼저 공유드릴게요.",
    time: "1일 전",
    isRead: false,
    iconBg: "bg-white border border-gray-300",
    icon: <MessageCircle className="size-5" />,
    primaryAction: {
      id: "reply",
      label: "답글 달기",
    },
    secondaryAction: {
      id: "save-for-later",
      label: "나중에 보기",
    },
  },
  {
    id: 5,
    category: "system",
    title: "이번 주 '주목받는 디자이너'로 선정되었습니다.",
    subtitle: "최근 활동과 프로젝트 반응을 기준으로 프로필 노출이 확대됩니다.",
    time: "2일 전",
    isRead: true,
    iconBg: "bg-[#4DD4AC]",
    icon: <CheckCircle className="size-5 text-black" />,
  },
  {
    id: 6,
    category: "proposal",
    title: "'Mono Lab'에서 추가 제안서를 보냈습니다.",
    subtitle: "원하는 납기와 예산 범위를 반영한 수정 제안이 도착했습니다.",
    time: "3일 전",
    isRead: false,
    iconBg: "bg-[#4DD4AC]",
    icon: <Sparkles className="size-5 text-black" />,
    primaryAction: {
      id: "view-proposal",
      label: "제안 확인하기",
    },
  },
  {
    id: 7,
    category: "activity",
    title: "포트폴리오 컬렉션에 새 저장이 8건 추가되었습니다.",
    subtitle: "브랜딩과 패키지 디자인 항목의 저장 수가 빠르게 늘고 있습니다.",
    time: "4일 전",
    isRead: true,
    iconBg: "bg-white border border-gray-300",
    icon: <Heart className="size-5" />,
  },
  {
    id: 8,
    category: "system",
    title: "알림 설정이 업데이트되었습니다.",
    subtitle: "프로젝트 제안과 활동 알림을 이메일과 앱 푸시로 모두 받습니다.",
    time: "5일 전",
    isRead: true,
    iconBg: "bg-[#4DD4AC]",
    icon: <Bell className="size-5 text-black" />,
  },
  {
    id: 9,
    category: "activity",
    title: "새 피드백 요청이 도착했습니다.",
    quote: "최종 시안 전에 무드보드와 컬러 방향을 한 번 더 맞춰보고 싶습니다.",
    time: "1주 전",
    isRead: false,
    iconBg: "bg-white border border-gray-300",
    icon: <MessageCircle className="size-5" />,
    primaryAction: {
      id: "reply",
      label: "답글 달기",
    },
  },
];

const tabs: { id: NotificationTab; label: string }[] = [
  { id: "all", label: "전체" },
  { id: "proposal", label: "프로젝트 제안" },
  { id: "activity", label: "활동 알림" },
  { id: "system", label: "시스템" },
];

function estimateNotificationHeight(notification: NotificationItem) {
  let height = baseCardHeight;

  if (notification.subtitle) {
    height += 20;
  }

  if (notification.quote) {
    height += 48;
  }

  if (notification.primaryAction || notification.secondaryAction) {
    height += 44;
  }

  if (notification.secondaryAction?.label === "저장됨") {
    height += 28;
  }

  return height;
}

function getAutoVisibleCount(notifications: NotificationItem[], availableHeight: number) {
  if (notifications.length === 0) {
    return 0;
  }

  if (availableHeight <= 0) {
    return initialVisibleCount;
  }

  const estimatedCountFromViewport = Math.max(
    initialVisibleCount,
    Math.floor((availableHeight + listGap) / (averageCardHeight + listGap)),
  );

  let usedHeight = 0;
  let count = 0;

  for (const notification of notifications) {
    const nextHeight = estimateNotificationHeight(notification) + (count > 0 ? listGap : 0);

    if (usedHeight + nextHeight > availableHeight) {
      break;
    }

    usedHeight += nextHeight;
    count += 1;
  }

  return Math.min(notifications.length, Math.max(initialVisibleCount, estimatedCountFromViewport, count));
}

export default function Notifications() {
  const navigate = useNavigate();
  const pageRef = useRef<HTMLDivElement | null>(null);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const tabsRef = useRef<HTMLDivElement | null>(null);
  const loadMoreRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLElement | null>(null);

  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState(() => hydrateNotificationReadState(initialNotifications));
  const [expandedCount, setExpandedCount] = useState(0);
  const [availableListHeight, setAvailableListHeight] = useState(0);

  const filteredNotifications = useMemo(() => {
    if (activeTab === "all") {
      return notifications;
    }

    return notifications.filter((notification) => notification.category === activeTab);
  }, [activeTab, notifications]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;
  const visibleUnreadCount = filteredNotifications.filter((notification) => !notification.isRead).length;
  const autoVisibleCount = useMemo(
    () => getAutoVisibleCount(filteredNotifications, availableListHeight),
    [availableListHeight, filteredNotifications],
  );
  const visibleCount = Math.min(filteredNotifications.length, autoVisibleCount + expandedCount);
  const visibleNotifications = filteredNotifications.slice(0, visibleCount);
  const hasMoreNotifications = visibleCount < filteredNotifications.length;

  useEffect(() => {
    syncStoredNotifications(notifications);
  }, [notifications]);

  useLayoutEffect(() => {
    const updateHeight = () => {
      const pageTop = pageRef.current?.getBoundingClientRect().top ?? 0;
      const headerHeight = headerRef.current?.offsetHeight ?? 0;
      const tabsHeight = tabsRef.current?.offsetHeight ?? 0;
      const loadMoreHeight = loadMoreRef.current?.offsetHeight ?? 0;
      const footerHeight = footerRef.current?.offsetHeight ?? 0;
      const containerVerticalPadding = 64;
      const sectionSpacing = 56;

      const nextHeight =
        window.innerHeight -
        pageTop -
        footerHeight -
        headerHeight -
        tabsHeight -
        loadMoreHeight -
        containerVerticalPadding -
        sectionSpacing;

      setAvailableListHeight(Math.max(240, nextHeight));
    };

    updateHeight();

    const resizeObserver = new ResizeObserver(updateHeight);

    if (headerRef.current) {
      resizeObserver.observe(headerRef.current);
    }

    if (tabsRef.current) {
      resizeObserver.observe(tabsRef.current);
    }

    if (loadMoreRef.current) {
      resizeObserver.observe(loadMoreRef.current);
    }

    if (footerRef.current) {
      resizeObserver.observe(footerRef.current);
    }

    window.addEventListener("resize", updateHeight);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener("resize", updateHeight);
    };
  }, [activeTab, filteredNotifications.length, hasMoreNotifications]);

  const markAsRead = (notificationId: number) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId
          ? {
              ...notification,
              isRead: true,
            }
          : notification,
      ),
    );
  };

  const markVisibleAsRead = () => {
    setNotifications((current) =>
      current.map((notification) =>
        activeTab === "all" || notification.category === activeTab
          ? {
              ...notification,
              isRead: true,
            }
          : notification,
      ),
    );
  };

  const handleAction = (notificationId: number, actionId: NotificationActionId) => {
    markAsRead(notificationId);

    if (actionId === "view-proposal") {
      navigate(`/proposals/${notificationId}`);
      return;
    }

    if (actionId === "upload-material") {
      navigate("/projects/new");
      return;
    }

    if (actionId === "reply") {
      navigate("/messages");
      return;
    }

    if (actionId === "save-for-later") {
      setNotifications((current) =>
        current.map((notification) =>
          notification.id === notificationId
            ? {
                ...notification,
                isRead: true,
                secondaryAction: {
                  id: "save-for-later",
                  label: "저장됨",
                },
              }
            : notification,
        ),
      );
    }
  };

  const handleTabChange = (tabId: NotificationTab) => {
    setActiveTab(tabId);
    setExpandedCount(0);
  };

  const handleLoadMore = () => {
    setExpandedCount((current) => current + loadMoreCount);
  };

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Navigation />

      <div ref={pageRef} className="flex-1 overflow-hidden">
        <div className="mx-auto flex h-full max-w-[900px] flex-col px-6 py-8">
          <div
            ref={headerRef}
            className="mb-8 flex shrink-0 flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h1 className="text-3xl font-bold">알림 센터</h1>
              <p className="mt-2 text-gray-600">
                프로젝트 제안, 활동 업데이트, 시스템 소식을 한곳에서 확인하세요.
              </p>
            </div>

            <button
              type="button"
              onClick={markVisibleAsRead}
              disabled={visibleUnreadCount === 0}
              className="inline-flex self-start items-center gap-2 rounded-lg border border-[#4DD4AC] px-4 py-2 text-sm font-medium text-[#158a72] transition-colors hover:bg-[#4DD4AC]/10 disabled:cursor-not-allowed disabled:border-gray-200 disabled:text-gray-400"
            >
              <CheckCheck className="size-4" />
              모두 읽음으로 표시
            </button>
          </div>

          <div ref={tabsRef} className="mb-6 flex shrink-0 flex-wrap items-center gap-3">
            <div className="inline-flex rounded-xl border border-gray-200 bg-white p-1">
              {tabs.map((tab) => {
                const isActive = activeTab === tab.id;

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className={`rounded-lg px-5 py-2 text-sm font-medium transition-colors ${
                      isActive ? "bg-black text-white" : "text-gray-600 hover:bg-gray-50"
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-4 py-2 text-sm text-gray-600">
              <Bell className="size-4 text-[#00A88C]" />
              읽지 않은 알림 {unreadCount}개
            </div>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto pr-1">
            <div className="space-y-3">
              {filteredNotifications.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white px-6 py-12 text-center text-gray-500">
                  현재 탭에 표시할 알림이 없습니다.
                </div>
              ) : (
                visibleNotifications.map((notification) => (
                  <div
                    key={notification.id}
                    className={`rounded-xl border bg-white p-6 transition-shadow hover:shadow-md ${
                      notification.isRead ? "border-gray-200" : "border-[#4DD4AC]"
                    }`}
                  >
                    <div className="flex gap-4">
                      <div
                        className={`${notification.iconBg} flex size-12 shrink-0 items-center justify-center rounded-full`}
                      >
                        {notification.avatar ? (
                          <div className="size-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500" />
                        ) : (
                          notification.icon
                        )}
                      </div>

                      <div className="flex-1">
                        <div className="mb-2 flex items-start justify-between gap-4">
                          <div>
                            <div className="mb-1 flex items-center gap-2">
                              <h3 className="font-semibold">{notification.title}</h3>
                              {!notification.isRead && (
                                <span className="inline-flex items-center rounded-full bg-[#4DD4AC]/15 px-2 py-0.5 text-[11px] font-medium text-[#158a72]">
                                  NEW
                                </span>
                              )}
                            </div>

                            {notification.subtitle && (
                              <p className="text-sm text-gray-600">{notification.subtitle}</p>
                            )}

                            {notification.quote && (
                              <div className="mt-2 border-l-4 border-gray-300 bg-gray-50 p-3 text-sm italic text-gray-700">
                                {notification.quote}
                              </div>
                            )}
                          </div>

                          <span className="whitespace-nowrap text-xs text-gray-500">{notification.time}</span>
                        </div>

                        {(notification.primaryAction || notification.secondaryAction) && (
                          <div className="mt-3 flex flex-wrap gap-2">
                            {notification.primaryAction && (
                              <button
                                type="button"
                                onClick={() => handleAction(notification.id, notification.primaryAction.id)}
                                className="rounded-lg bg-[#4DD4AC] px-4 py-2 text-sm font-medium text-black hover:bg-[#3BC99A]"
                              >
                                {notification.primaryAction.label}
                              </button>
                            )}

                            {notification.secondaryAction && (
                              <button
                                type="button"
                                onClick={() => handleAction(notification.id, notification.secondaryAction.id)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm hover:bg-gray-50"
                              >
                                {notification.secondaryAction.label}
                              </button>
                            )}

                            {!notification.isRead && (
                              <button
                                type="button"
                                onClick={() => markAsRead(notification.id)}
                                className="inline-flex items-center gap-1 rounded-lg px-3 py-2 text-sm text-gray-500 hover:bg-gray-50"
                              >
                                <Check className="size-4" />
                                읽음 처리
                              </button>
                            )}
                          </div>
                        )}

                        {notification.secondaryAction?.label === "저장됨" && (
                          <div className="mt-3 inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700">
                            <Clock3 className="size-3.5" />
                            나중에 볼 수 있도록 저장했습니다.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div ref={loadMoreRef} className="mt-6 shrink-0 text-center">
            {hasMoreNotifications && (
              <button
                type="button"
                onClick={handleLoadMore}
                className="text-sm text-gray-600 hover:text-black"
              >
                더 많은 알림 보기
              </button>
            )}
          </div>
        </div>
      </div>

      <footer ref={footerRef} className="shrink-0 border-t border-gray-200 bg-white py-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-[1400px] px-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="mb-2 text-xl font-bold">
                pick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
              </div>
              <p className="text-sm text-gray-600">© 2024 pickxel. Crafted for the creative elite.</p>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="transition-colors hover:text-black">
                이용약관
              </a>
              <a href="#" className="transition-colors hover:text-black">
                개인정보처리방침
              </a>
              <a href="#" className="transition-colors hover:text-black">
                고객센터
              </a>
              <a href="#" className="transition-colors hover:text-black">
                인재채용
              </a>
              <a href="#" className="transition-colors hover:text-black">
                비즈니스 문의
              </a>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
