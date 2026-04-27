import { useEffect, useMemo, useState, useRef } from "react";
import { toast } from "sonner";
import { useNavigate } from "react-router";
import {
  Heart,
  MessageCircle,
  CheckCircle,
  Sparkles,
  Bell,
  ArrowRight,
  Briefcase,
  Calendar,
  UserRound,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { FeedDetailModal } from "../components/feed/FeedDetailModal";
import { useFeedComments } from "../hooks/useFeedComments";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import {
  getExploreFeedDetailApi,
  type ExplorePostResponseDto,
  type ExploreFeedDetailResponseDto
} from "../api/exploreApi";
import {
  getProjectApplicationsApi,
  getProjectDetailApi,
  type ProjectApplicationItemResponse,
} from "../api/projectApi";
import { createMessageConversationApi } from "../api/messageApi";
import { getCurrentUser } from "../utils/auth";
import { getUserAvatar } from "../utils/avatar";
import type { FeedCardItem } from "../types/feed";
import {
  type NotificationCategory,
  type NotificationItem,
  fetchNotifications,
  fetchUnreadCount,
  markAllNotificationsRead,
  markNotificationRead,
  subscribeNotificationState,
} from "../utils/notificationState";
import { useNightMode } from "../contexts/NightModeContext";

type NotificationTab = "all" | NotificationCategory;

type ProposalModalData = {
  postId: number;
  projectTitle: string;
  projectMeta: string;
  applications: ProjectApplicationItemResponse[];
};

const tabs: Array<{ key: NotificationTab; label: string }> = [
  { key: "all", label: "전체" },
  { key: "project", label: "프로젝트" },
  { key: "activity", label: "활동" },
  { key: "system", label: "시스템" },
];

/** 알림 유형별 아이콘·배지 스타일 (라이트/다크) */
const getTypeConfig = (notification: NotificationItem, isNight: boolean) => {
  switch (notification.type) {
    case "like":
      return {
        icon: <Heart className="size-4" />,
        iconBg: isNight ? "bg-rose-500/15 text-rose-300" : "bg-rose-50 text-rose-500",
        dotColor: "bg-rose-400",
        badge: isNight
          ? "bg-rose-500/15 text-rose-300 border-rose-500/35"
          : "bg-rose-50 text-rose-600 border-rose-200",
        btnClass: "bg-rose-500 hover:bg-rose-600 text-white",
        label: "좋아요",
      };
    case "message":
      return {
        icon: <MessageCircle className="size-4" />,
        iconBg: isNight ? "bg-blue-500/15 text-blue-300" : "bg-blue-50 text-blue-500",
        dotColor: "bg-blue-400",
        badge: isNight
          ? "bg-blue-500/15 text-blue-300 border-blue-500/35"
          : "bg-blue-50 text-blue-600 border-blue-200",
        btnClass: "bg-blue-500 hover:bg-blue-600 text-white",
        label: "메시지",
      };
    case "announcement":
      return {
        icon: <Sparkles className="size-4" />,
        iconBg: isNight ? "bg-[#00C9A7]/15 text-[#7ee8d3]" : "bg-[#EEF9F6] text-[#00A88C]",
        dotColor: "bg-[#00C9A7]",
        badge: isNight
          ? "bg-[#00C9A7]/15 text-[#7ee8d3] border-[#00C9A7]/35"
          : "bg-[#EEF9F6] text-[#00A88C] border-[#CDEFE6]",
        btnClass: isNight
          ? "bg-[#00C9A7] hover:bg-[#00A88C] text-[#0f172a]"
          : "bg-[#00C9A7] hover:bg-[#00A88C] text-black",
        label: "프로젝트",
      };
    case "complete":
      return {
        icon: <CheckCircle className="size-4" />,
        iconBg: isNight ? "bg-violet-500/15 text-violet-300" : "bg-violet-50 text-violet-500",
        dotColor: "bg-violet-400",
        badge: isNight
          ? "bg-violet-500/15 text-violet-300 border-violet-500/35"
          : "bg-violet-50 text-violet-600 border-violet-200",
        btnClass: "bg-violet-500 hover:bg-violet-600 text-white",
        label: "수락",
      };
    default:
      return {
        icon: <Bell className="size-4" />,
        iconBg: isNight ? "bg-white/10 text-gray-300" : "bg-gray-100 text-gray-500",
        dotColor: "bg-gray-400",
        badge: isNight
          ? "bg-white/10 text-gray-300 border-white/20"
          : "bg-gray-100 text-gray-600 border-gray-200",
        btnClass: isNight ? "bg-white/15 hover:bg-white/25 text-white" : "bg-gray-800 hover:bg-gray-700 text-white",
        label: "시스템",
      };
  }
};

const getInitials = (name?: string) => {
  if (!name) return "?";
  return name.slice(0, 1).toUpperCase();
};

const formatProposalBudget = (budget?: number | null) => {
  if (budget == null) return "협의 가능";
  return `${budget}만원`;
};

const formatProposalStartDate = (startDate?: string | null) => {
  return startDate || "협의 가능";
};

const getPortfolioLabel = (portfolioUrl?: string | null) => {
  if (!portfolioUrl) return "포트폴리오 미첨부";

  try {
    const host = new URL(portfolioUrl).hostname.replace(/^www\./, "");
    return `${host} 포트폴리오`;
  } catch {
    return "포트폴리오 링크 첨부";
  }
};

const buildProposalProjectMeta = (
  detail: { category?: string; categories?: string[]; jobState?: string },
  applicationsCount: number,
) => {
  const categories = detail.categories?.length
    ? detail.categories
    : detail.category
      ? [detail.category]
      : [];

  return [...categories.slice(0, 2), detail.jobState, `${applicationsCount}명 지원`]
    .filter(Boolean)
    .join(" · ");
};

export default function Notifications() {
  const navigate = useNavigate();
  const { isNight } = useNightMode();
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [selectedProposalNotification, setSelectedProposalNotification] = useState<NotificationItem | null>(null);
  const [proposalModalData, setProposalModalData] = useState<ProposalModalData | null>(null);
  const [isProposalLoading, setIsProposalLoading] = useState(false);
  const [proposalLoadError, setProposalLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 피드 모달 관련 상태
  const [selectedFeedForModal, setSelectedFeedForModal] = useState<number | null>(null);
  const [selectedExploreFeed, setSelectedExploreFeed] = useState<FeedCardItem | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ExploreFeedDetailResponseDto | null>(null);
  const [isModalDetailLoading, setIsModalDetailLoading] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [commentFeedItems, setCommentFeedItems] = useState<FeedCardItem[]>([]);
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  const currentUserAvatar = getUserAvatar(
    currentUser?.profileImage,
    currentUser?.userId,
    currentUser?.nickname,
  );
  const currentUserName = currentUser?.nickname || currentUser?.name || "프로필";

  function toCommentAuthorRole(role: string) {
    if (role === "CLIENT") return "프로젝트 클라이언트";
    if (role === "DESIGNER") return "디자이너";
    return role;
  }

  const {
    commentText,
    setCommentText,
    commentSubmitError,
    isSubmittingComment,
    isCommentsLoading,
    commentLoadError,
    editingCommentId,
    editingCommentText,
    setEditingCommentText,
    isUpdatingComment,
    isDeletingCommentId,
    selectedFeedComments,
    handleSubmitComment,
    handleCommentKeyDown,
    startEditingComment,
    cancelEditingComment,
    handleUpdateComment,
    handleDeleteComment,
  } = useFeedComments<FeedCardItem, FeedCardItem>({
    selectedFeed: selectedExploreFeed,
    currentUser,
    currentUserId: currentUser?.userId ?? null,
    apiFeedItems: commentFeedItems,
    setApiFeedItems: setCommentFeedItems,
    setSelectedFeed: setSelectedExploreFeed,
    toFeedCommentRole: toCommentAuthorRole,
  });

  // 피드 상세 로딩
  useEffect(() => {
    if (!selectedFeedForModal) {
      setSelectedProjectDetail(null);
      setSelectedExploreFeed(null);
      setIsModalDetailLoading(false);
      setModalImageIndex(0);
      return;
    }

    async function loadFeedDetail() {
      try {
        setIsModalDetailLoading(true);
        const detail = await getExploreFeedDetailApi(selectedFeedForModal!);
        setSelectedProjectDetail(detail);

        // FeedCardItem으로 매핑
        const imageUrls = detail.imageUrls?.filter(Boolean) || [];
        const mapped: FeedCardItem = {
          id: detail.postId,
          feedKey: detail.postId,
          author: {
            userId: detail.userId,
            name: detail.nickname,
            role: detail.job || "디자이너",
            avatar: getUserAvatar(detail.profileImageUrl, detail.userId, detail.nickname),
            profileKey: detail.profileKey || String(detail.userId),
          },
          title: detail.title,
          description: detail.description || "",
          image: imageUrls[0] || "",
          images: imageUrls,
          likes: detail.pickCount,
          comments: detail.commentCount,
          tags: [detail.category, detail.postType].filter(Boolean) as string[],
          category: detail.category,
          createdAt: detail.createdAt,
          userId: detail.userId,
          isApiFeed: true,
          likedByMe: likedItems.has(detail.postId),
          isMine: detail.mine
        };
        setSelectedExploreFeed(mapped);
      } catch (error) {
        console.error("피드 상세 로드 실패:", error);
      } finally {
        setIsModalDetailLoading(false);
      }
    }

    void loadFeedDetail();
  }, [selectedFeedForModal, likedItems]);

  const loadNotifications = async () => {
    try {
      const items = await fetchNotifications();
      const unread = await fetchUnreadCount();
      setNotifications(items);
      setHasUnread(unread);
    } catch (e) {
      console.error("Failed to fetch notifications", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  useEffect(() => {
    return subscribeNotificationState(() => {
      void loadNotifications();
    });
  }, []);

  const visibleNotifications = useMemo(() => {
    const filtered =
      activeTab === "all"
        ? notifications
        : notifications.filter((n) => n.category === activeTab);
    return filtered.filter((n) => !n.isSnoozed);
  }, [activeTab, notifications]);

  const unreadCount = visibleNotifications.filter((n) => !n.isRead).length;

  const tabUnreadCounts = useMemo(() => {
    const unread = notifications.filter((n) => !n.isSnoozed && !n.isRead);
    return {
      all: unread.length,
      project: unread.filter((n) => n.category === "project").length,
      activity: unread.filter((n) => n.category === "activity").length,
      system: unread.filter((n) => n.category === "system").length,
    };
  }, [notifications]);

  const handleMarkAllRead = async () => {
    await markAllNotificationsRead();
    setNotifications((prev) => prev.map((notification) => ({ ...notification, isRead: true })));
    setHasUnread(false);
    await loadNotifications();
  };

  const handleSnooze = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const closeProposalModal = () => {
    setSelectedProposalNotification(null);
    setProposalModalData(null);
    setProposalLoadError(null);
    setIsProposalLoading(false);
  };

  const openProposalModal = async (notification: NotificationItem) => {
    if (!notification.referenceId) {
      navigate("/projects");
      return;
    }

    const postId = Number(notification.referenceId);
    setSelectedProposalNotification(notification);
    setProposalModalData(null);
    setProposalLoadError(null);
    setIsProposalLoading(true);

    try {
      const [detail, applications] = await Promise.all([
        getProjectDetailApi(postId),
        getProjectApplicationsApi(postId),
      ]);

      setProposalModalData({
        postId,
        projectTitle: detail.title,
        projectMeta: buildProposalProjectMeta(detail, applications.length),
        applications,
      });
    } catch (error) {
      setProposalLoadError(error instanceof Error ? error.message : "제안 내역을 불러오지 못했어요.");
    } finally {
      setIsProposalLoading(false);
    }
  };

  const handleProposalMessage = async (designerId: number) => {
    try {
      const conversation = await createMessageConversationApi(designerId);
      closeProposalModal();
      navigate(`/messages?conversationId=${conversation.id}`);
    } catch (error) {
      console.error("Failed to create conversation from proposal modal", error);
    }
  };

  const handlePrimaryAction = async (notification: NotificationItem) => {
    await markNotificationRead(notification.id);

    if (notification.actionType === "proposal") {
      await openProposalModal(notification);
      await loadNotifications();
      return;
    }

    // 피드 관련 알림인 경우 모달 오픈
    if (notification.actionType === "feed" && notification.referenceId) {
      setSelectedFeedForModal(Number(notification.referenceId));
      await loadNotifications();
      return;
    }

    if (notification.navigatePath) {
      navigate(notification.navigatePath);
      return;
    }
    await loadNotifications();
  };

  const moveModalCarousel = (direction: -1 | 1, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const images = selectedExploreFeed?.images || [];
    if (images.length <= 1) return;
    setModalImageIndex(prev => (prev + direction + images.length) % images.length);
  };

  const handleToggleLike = (item: any) => {
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(item.id)) newSet.delete(item.id);
      else newSet.add(item.id);
      return newSet;
    });
  };

  const tabFocusRing = isNight
    ? "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C9A7]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#0C1222]"
    : "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#00C9A7]/45 focus-visible:ring-offset-2 focus-visible:ring-offset-[#f6f8fb]";

  return (
    <div
      className={`min-h-screen flex flex-col transition-colors duration-700 ${
        isNight ? "bg-[#0C1222] text-white" : "bg-[#f6f8fb] text-[#111827]"
      }`}
    >
      <Navigation />

      <main className="flex-1">
        <div className="pickxel-animate-page-in max-w-[860px] mx-auto px-6 py-10">

          {/* 헤더 */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-1.5 flex-wrap">
                <h1 className={`text-3xl font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>알림 센터</h1>
                {unreadCount > 0 && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                      isNight
                        ? "border-[#00C9A7]/35 bg-[#00C9A7]/15 text-[#7ee8d3]"
                        : "bg-[#EEF9F6] text-[#00A88C] border-[#CDEFE6]"
                    }`}
                  >
                    {unreadCount}개 미확인
                  </span>
                )}
              </div>
              <p className={`text-sm ${isNight ? "text-white/55" : "text-[#5F5E5A]"}`}>
                프로젝트 제안, 활동 소식, 시스템 알림을 분류해서 확인하세요.
              </p>
            </div>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className={`flex shrink-0 items-center gap-1.5 self-start text-sm transition-colors px-3 py-1.5 rounded-lg ${
                isNight
                  ? "text-[#7ee8d3] hover:text-[#9af5e0] hover:bg-[#00C9A7]/10"
                  : "text-[#00A88C] hover:text-[#007E68] hover:bg-[#EEF9F6]"
              }`}
            >
              <CheckCircle className="size-4" />
              {hasUnread ? "모두 읽음 처리" : "모두 읽음"}
            </button>
          </motion.div>

          {/* 탭 */}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            className={`flex gap-1 mb-6 p-1 rounded-xl shadow-sm border ${
              isNight ? "bg-[#141d30] border-white/10" : "bg-white/90 border-[#E5E7EB]"
            }`}
          >
            {tabs.map((tab) => {
              const tabUnread = tabUnreadCounts[tab.key];
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => setActiveTab(tab.key)}
                  className={`${tabFocusRing} flex flex-1 items-center justify-center gap-1.5 min-h-[2.5rem] px-2 sm:px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    activeTab === tab.key
                      ? "bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white shadow-sm"
                      : isNight
                        ? "text-white/55 hover:bg-white/5 hover:text-white/90"
                        : "text-gray-600 hover:bg-[#f1f5f4] hover:text-[#0f172a]"
                  }`}
                >
                  <span>{tab.label}</span>
                  {tabUnread > 0 && (
                    <span
                      className={`min-w-[1.125rem] rounded-full px-1 text-[10px] font-bold tabular-nums leading-none py-0.5 ${
                        activeTab === tab.key
                          ? "bg-white/25 text-white"
                          : isNight
                            ? "bg-[#00C9A7]/25 text-[#7ee8d3]"
                            : "bg-[#EEF9F6] text-[#00A88C]"
                      }`}
                    >
                      {tabUnread > 99 ? "99+" : tabUnread}
                    </span>
                  )}
                </button>
              );
            })}
          </motion.div>

          {/* 알림 목록 */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`h-24 rounded-2xl border animate-pulse ${
                    isNight ? "bg-[#141d30] border-white/10" : "bg-white border-[#EAEAE8]"
                  }`}
                />
              ))}
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {visibleNotifications.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 gap-4"
                >
                  <div
                    className={`w-16 h-16 rounded-2xl border flex items-center justify-center shadow-sm ${
                      isNight ? "bg-[#141d30] border-white/10" : "bg-white border-[#EAEAE8]"
                    }`}
                  >
                    <Bell className={`size-7 ${isNight ? "text-white/25" : "text-gray-300"}`} />
                  </div>
                  <p className={`text-sm ${isNight ? "text-white/45" : "text-[#5F5E5A]"}`}>표시할 알림이 없습니다.</p>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-3">
                  {visibleNotifications.map((notification, index) => {
                    const config = getTypeConfig(notification, isNight);
                    const cardBorder = !notification.isRead
                      ? isNight
                        ? "border-[#00C9A7]/35"
                        : "border-[#BDEFD8]"
                      : isNight
                        ? "border-white/10"
                        : "border-[#EAEAE8]";
                    const cardBg = isNight ? "bg-[#141d30]" : "bg-white";
                    const avatarRing = isNight ? "ring-white/15" : "ring-gray-200";
                    const miniIconBorder = isNight ? "border-[#141d30]" : "border-white";

                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
                        transition={{ duration: 0.28, delay: index * 0.04 }}
                        className={`relative rounded-2xl border overflow-hidden transition-shadow duration-200 group hover:shadow-md ${cardBg} ${cardBorder}`}
                      >
                        {!notification.isRead && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00C9A7]" />
                        )}

                        <div className="flex items-start gap-4 px-6 py-5">
                          <div className="flex-shrink-0 relative">
                            {notification.senderProfileImage ? (
                              <img
                                src={notification.senderProfileImage}
                                alt=""
                                className={`w-11 h-11 rounded-xl object-cover ring-1 ${avatarRing}`}
                              />
                            ) : (
                              <div className={`w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center font-bold text-base`}>
                                {getInitials(notification.subtitle)}
                              </div>
                            )}
                            <div
                              className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.iconBg} border-2 ${miniIconBorder} flex items-center justify-center`}
                            >
                              <span className="[&>svg]:size-2.5">{config.icon}</span>
                            </div>
                          </div>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 mb-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${config.badge}`}>
                                  {config.label}
                                </span>
                                {!notification.isRead && (
                                  <span className={`w-1.5 h-1.5 rounded-full ${config.dotColor}`} />
                                )}
                              </div>
                              <div className="flex items-center gap-2 flex-shrink-0">
                                <span className={`text-xs ${isNight ? "text-white/40" : "text-gray-400"}`}>
                                  {notification.time}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleSnooze(notification.id)}
                                  className={`opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-md flex items-center justify-center ${
                                    isNight ? "hover:bg-white/10" : "hover:bg-[#F1EFE8]"
                                  }`}
                                >
                                  <X className={`size-3 ${isNight ? "text-white/45" : "text-gray-400"}`} />
                                </button>
                              </div>
                            </div>

                            <p
                              className={`text-sm font-medium leading-snug mb-0.5 ${
                                isNight ? "text-white/90" : "text-[#0F0F0F]"
                              }`}
                            >
                              {notification.title}
                            </p>
                            {notification.subtitle && (
                              <p className={`text-xs ${isNight ? "text-white/40" : "text-[#8B8A84]"}`}>
                                @{notification.subtitle}
                              </p>
                            )}

                            {notification.action && (
                              <div className="mt-3">
                                <button
                                  type="button"
                                  onClick={() => handlePrimaryAction(notification)}
                                  className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 ${config.btnClass}`}
                                >
                                  {notification.action}
                                  <ArrowRight className="size-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </AnimatePresence>
          )}
        </div>
      </main>

      <Footer />

      {/* 지원 제안 모달 */}
      <AnimatePresence>
        {selectedProposalNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
            onClick={closeProposalModal}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className={`w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden ${
                isNight ? "bg-[#141d30] text-white" : "bg-white"
              }`}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className={`flex items-start justify-between border-b px-7 py-5 ${
                  isNight ? "border-white/10" : "border-gray-100"
                }`}
              >
                <div>
                  <p className={`text-sm font-semibold ${isNight ? "text-[#7ee8d3]" : "text-[#00A88C]"}`}>
                    제안 확인하기
                  </p>
                  <h2 className={`mt-1 text-2xl font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                    {proposalModalData?.projectTitle ?? "프로젝트 제안"}
                  </h2>
                  <p className={`mt-1 text-sm ${isNight ? "text-white/50" : "text-gray-500"}`}>
                    {proposalModalData?.projectMeta ?? "지원한 디자이너 제안을 확인하세요."}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={closeProposalModal}
                  className={`rounded-full border p-2 transition-colors ${
                    isNight
                      ? "border-white/15 text-white/50 hover:bg-white/10 hover:text-white"
                      : "border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-700"
                  }`}
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto px-7 py-5">
                <div
                  className={`mb-5 rounded-xl border px-4 py-3 text-sm ${
                    isNight
                      ? "border-white/10 bg-[#00C9A7]/10 text-white/70"
                      : "bg-[#F7F9FB] border-gray-100 text-[#5F5E5A]"
                  }`}
                >
                  내가 작성한 프로젝트 공고에 지원한 디자이너 목록입니다. 제안 내용을 검토하고 메시지로 바로 이어갈 수 있어요.
                </div>

                {isProposalLoading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2].map((item) => (
                      <div
                        key={item}
                        className={`rounded-2xl border p-5 ${
                          isNight ? "border-white/10" : "border-gray-200"
                        }`}
                      >
                        <div
                          className={`h-5 w-40 rounded animate-pulse ${
                            isNight ? "bg-white/10" : "bg-gray-100"
                          }`}
                        />
                        <div
                          className={`mt-4 h-16 rounded animate-pulse ${
                            isNight ? "bg-white/10" : "bg-gray-100"
                          }`}
                        />
                        <div
                          className={`mt-4 h-12 rounded animate-pulse ${
                            isNight ? "bg-white/10" : "bg-gray-100"
                          }`}
                        />
                      </div>
                    ))}
                  </div>
                ) : proposalLoadError ? (
                  <div
                    className={`rounded-2xl border px-4 py-4 text-sm ${
                      isNight
                        ? "border-red-500/30 bg-red-500/10 text-red-300"
                        : "border-red-100 bg-red-50 text-red-600"
                    }`}
                  >
                    {proposalLoadError}
                  </div>
                ) : !proposalModalData || proposalModalData.applications.length === 0 ? (
                  <div
                    className={`rounded-2xl border px-4 py-8 text-center text-sm ${
                      isNight
                        ? "border-white/10 bg-white/5 text-white/50"
                        : "border-gray-200 bg-gray-50 text-gray-500"
                    }`}
                  >
                    아직 확인할 지원 제안이 없어요.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {proposalModalData.applications.map((proposal) => (
                      <div
                        key={proposal.applicationId}
                        className={`rounded-2xl border p-5 transition-shadow hover:shadow-md ${
                          isNight ? "border-white/10 bg-white/[0.03]" : "border-gray-200 bg-white"
                        }`}
                      >
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                          <div className="flex items-center gap-4">
                            <ImageWithFallback
                              src={getUserAvatar(
                                proposal.designerProfileImage,
                                proposal.designerId,
                                proposal.designerNickname ?? proposal.designerName,
                              )}
                              alt={proposal.designerName}
                              className="w-12 h-12 rounded-xl object-cover"
                            />
                            <div>
                              <div className="flex flex-wrap items-center gap-2">
                                <h3 className={`font-bold ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                                  {proposal.designerName}
                                </h3>
                                <span
                                  className={`rounded-full border px-2 py-0.5 text-xs font-semibold ${
                                    isNight
                                      ? "border-[#00C9A7]/35 bg-[#00C9A7]/15 text-[#7ee8d3]"
                                      : "bg-[#EEF9F6] border-[#CDEFE6] text-[#00A88C]"
                                  }`}
                                >
                                  디자이너
                                </span>
                              </div>
                              <p className={`mt-0.5 text-xs ${isNight ? "text-white/45" : "text-gray-500"}`}>
                                @{proposal.designerNickname ?? proposal.designerName}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleProposalMessage(proposal.designerId)}
                            className={`inline-flex shrink-0 items-center gap-1.5 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                              isNight
                                ? "bg-[#00C9A7] text-[#0f172a] hover:bg-[#00A88C]"
                                : "bg-[#00C9A7] text-black hover:bg-[#00A88C]"
                            }`}
                          >
                            <MessageCircle className="size-3.5" />
                            메시지 보내기
                          </button>
                        </div>

                        {proposal.summary && (
                          <p
                            className={`mt-4 text-sm leading-relaxed ${
                              isNight ? "text-white/65" : "text-[#5F5E5A]"
                            }`}
                          >
                            {proposal.summary}
                          </p>
                        )}

                        {proposal.coverLetter && (
                          <div
                            className={`mt-3 rounded-xl border px-4 py-3 text-sm ${
                              isNight
                                ? "border-white/10 bg-white/5 text-white/75"
                                : "bg-[#FAFBFC] border-gray-100 text-gray-600"
                            }`}
                          >
                            {proposal.coverLetter}
                          </div>
                        )}

                        <div
                          className={`mt-4 grid grid-cols-1 gap-3 rounded-xl border p-3 md:grid-cols-3 ${
                            isNight ? "border-white/10 bg-white/5" : "bg-[#FAFBFC] border-gray-100"
                          }`}
                        >
                          <div
                            className={`flex items-center gap-2 text-xs ${
                              isNight ? "text-white/60" : "text-gray-600"
                            }`}
                          >
                            <Briefcase className={`size-3.5 ${isNight ? "text-[#7ee8d3]" : "text-[#00A88C]"}`} />
                            희망 예산 {formatProposalBudget(proposal.expectedBudget)}
                          </div>
                          <div
                            className={`flex items-center gap-2 text-xs ${
                              isNight ? "text-white/60" : "text-gray-600"
                            }`}
                          >
                            <Calendar className={`size-3.5 ${isNight ? "text-[#7ee8d3]" : "text-[#00A88C]"}`} />
                            시작 가능일 {formatProposalStartDate(proposal.startDate)}
                          </div>
                          <div
                            className={`flex items-center gap-2 text-xs ${
                              isNight ? "text-white/60" : "text-gray-600"
                            }`}
                          >
                            <UserRound className={`size-3.5 ${isNight ? "text-[#7ee8d3]" : "text-[#00A88C]"}`} />
                            {getPortfolioLabel(proposal.portfolioUrl)}
                          </div>
                        </div>

                        {proposal.portfolioUrl && (
                          <div className="mt-3">
                            <a
                              href={proposal.portfolioUrl}
                              target="_blank"
                              rel="noreferrer"
                              className={`inline-flex items-center gap-1.5 text-xs font-semibold ${
                                isNight
                                  ? "text-[#7ee8d3] hover:text-[#9af5e0]"
                                  : "text-[#00A88C] hover:text-[#007E68]"
                              }`}
                            >
                              포트폴리오 보기
                              <ArrowRight className="size-3" />
                            </a>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 피드 상세 모달 */}
      <AnimatePresence>
        {selectedExploreFeed && (
          <FeedDetailModal
            selectedFeed={selectedExploreFeed}
            activeModalImage={(selectedExploreFeed.images || [])[modalImageIndex] || selectedExploreFeed.image}
            selectedFeedImages={selectedExploreFeed.images || []}
            modalImageIndex={modalImageIndex}
            savedItemIds={new Set()}
            selectedFeedComments={selectedFeedComments}
            isFeedDetailLoading={isModalDetailLoading}
            feedDetailError={null}
            commentSubmitError={commentSubmitError}
            commentLoadError={commentLoadError}
            isCommentsLoading={isCommentsLoading}
            editingCommentId={editingCommentId}
            editingCommentText={editingCommentText}
            isUpdatingComment={isUpdatingComment}
            isDeletingCommentId={isDeletingCommentId}
            commentText={commentText}
            isSubmittingComment={isSubmittingComment}
            currentUserAvatar={currentUserAvatar}
            currentUserName={currentUserName}
            commentInputRef={commentInputRef}
            isNight={isNight}
            formatFeedDateTime={(val) => val ? new Date(val).toLocaleDateString() : null}
            isFeedLiked={(item) => likedItems.has(item.id)}
            getLikeCount={(item) => item.likes + (likedItems.has(item.id) ? 1 : 0)}
            getCommentCount={(item) => item.comments}
            onClose={() => setSelectedFeedForModal(null)}
            onMoveModalCarousel={moveModalCarousel}
            onSetModalImageIndex={(idx) => setModalImageIndex(idx)}
            onToggleLike={handleToggleLike}
            onOpenCollectionModal={() => toast.info("컬렉션 기능은 준비 중입니다.")}
            onShare={() => {
              navigator.clipboard
                .writeText(window.location.href)
                .then(() => toast.success("링크가 복사되었습니다."))
                .catch(() => toast.error("링크 복사에 실패했습니다."));
            }}
            onProposalClick={() => navigate("/messages")}
            onStartEditingComment={startEditingComment}
            onEditingCommentTextChange={setEditingCommentText}
            onUpdateComment={handleUpdateComment}
            onCancelEditingComment={cancelEditingComment}
            onDeleteComment={handleDeleteComment}
            onCommentTextChange={setCommentText}
            onCommentKeyDown={handleCommentKeyDown}
            onSubmitComment={handleSubmitComment}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

