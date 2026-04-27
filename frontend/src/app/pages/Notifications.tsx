import { useEffect, useMemo, useState, useRef } from "react";
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

// ?뚮┝ ??낅퀎 ?됱긽쨌?꾩씠肄??ㅼ젙 (?쇱씠???뚮쭏 湲곗?)
const getTypeConfig = (notification: NotificationItem) => {
  switch (notification.type) {
    case "like":
      return {
        icon: <Heart className="size-4" />,
        iconBg: "bg-rose-50 text-rose-500",
        dotColor: "bg-rose-400",
        badge: "bg-rose-50 text-rose-600 border-rose-200",
        btnClass: "bg-rose-500 hover:bg-rose-600 text-white",
        label: "좋아요",
      };
    case "message":
      return {
        icon: <MessageCircle className="size-4" />,
        iconBg: "bg-blue-50 text-blue-500",
        dotColor: "bg-blue-400",
        badge: "bg-blue-50 text-blue-600 border-blue-200",
        btnClass: "bg-blue-500 hover:bg-blue-600 text-white",
        label: "메시지",
      };
    case "announcement":
      return {
        icon: <Sparkles className="size-4" />,
        iconBg: "bg-[#EEF9F6] text-[#00A88C]",
        dotColor: "bg-[#00C9A7]",
        badge: "bg-[#EEF9F6] text-[#00A88C] border-[#CDEFE6]",
        btnClass: "bg-[#00C9A7] hover:bg-[#00A88C] text-black",
        label: "프로젝트",
      };
    case "complete":
      return {
        icon: <CheckCircle className="size-4" />,
        iconBg: "bg-violet-50 text-violet-500",
        dotColor: "bg-violet-400",
        badge: "bg-violet-50 text-violet-600 border-violet-200",
        btnClass: "bg-violet-500 hover:bg-violet-600 text-white",
        label: "수락",
      };
    default:
      return {
        icon: <Bell className="size-4" />,
        iconBg: "bg-gray-100 text-gray-500",
        dotColor: "bg-gray-400",
        badge: "bg-gray-100 text-gray-600 border-gray-200",
        btnClass: "bg-gray-800 hover:bg-gray-700 text-white",
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
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [selectedProposalNotification, setSelectedProposalNotification] = useState<NotificationItem | null>(null);
  const [proposalModalData, setProposalModalData] = useState<ProposalModalData | null>(null);
  const [isProposalLoading, setIsProposalLoading] = useState(false);
  const [proposalLoadError, setProposalLoadError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ?쇰뱶 紐⑤떖 愿???곹깭
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

  // ?쇰뱶 ?곸꽭 濡쒕뵫
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

        // FeedCardItem?쇰줈 留ㅽ븨
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

    // ?쇰뱶 愿???뚮┝??寃쎌슦 紐⑤떖 ?ㅽ뵂
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5]">
      <Navigation />

      <main className="flex-1">
        <div className="max-w-[860px] mx-auto px-6 py-10">

          {/* ?ㅻ뜑 */}
          <motion.div
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="flex items-start justify-between mb-8"
          >
            <div>
              <div className="flex items-center gap-3 mb-1.5">
                <h1 className="text-3xl font-bold text-[#0F0F0F]">알림 센터</h1>
                {unreadCount > 0 && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-[#EEF9F6] text-[#00A88C] border border-[#CDEFE6]">
                    {unreadCount}개 미확인
                  </span>
                )}
              </div>
              <p className="text-sm text-[#5F5E5A]">
                프로젝트 제안, 활동 소식, 시스템 알림을 분류해서 확인해보세요.
              </p>
            </div>
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 text-sm text-[#00A88C] hover:text-[#007E68] transition-colors px-3 py-1.5 rounded-lg hover:bg-[#EEF9F6]"
            >
              <CheckCircle className="size-4" />
              {hasUnread ? "모두 읽음 처리" : "모두 읽음"}
            </button>
          </motion.div>

          {/* ??*/}
          <motion.div
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.06 }}
            className="flex gap-1 mb-6 p-1 bg-white rounded-xl border border-[#EAEAE8] shadow-sm"
          >
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  activeTab === tab.key
                    ? "bg-black text-white shadow-sm"
                    : "text-[#5F5E5A] hover:bg-[#F1EFE8] hover:text-[#0F0F0F]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </motion.div>

          {/* ?뚮┝ 紐⑸줉 */}
          {isLoading ? (
            <div className="flex flex-col gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 rounded-2xl bg-white border border-[#EAEAE8] animate-pulse" />
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
                  <div className="w-16 h-16 rounded-2xl bg-white border border-[#EAEAE8] flex items-center justify-center shadow-sm">
                    <Bell className="size-7 text-gray-300" />
                  </div>
                  <p className="text-[#5F5E5A] text-sm">표시할 알림이 없습니다.</p>
                </motion.div>
              ) : (
                <div className="flex flex-col gap-3">
                  {visibleNotifications.map((notification, index) => {
                    const config = getTypeConfig(notification);
                    return (
                      <motion.div
                        key={notification.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -16, transition: { duration: 0.18 } }}
                        transition={{ duration: 0.28, delay: index * 0.04 }}
                        className={`relative bg-white rounded-2xl border overflow-hidden transition-shadow duration-200 group hover:shadow-md ${
                          !notification.isRead
                            ? "border-[#BDEFD8]"
                            : "border-[#EAEAE8]"
                        }`}
                      >
                        {/* 誘몄씫??醫뚯륫 媛뺤“??*/}
                        {!notification.isRead && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00C9A7]" />
                        )}

                        <div className="flex items-start gap-4 px-6 py-5">
                          {/* ?꾨컮? */}
                          <div className="flex-shrink-0 relative">
                            {notification.senderProfileImage ? (
                              <img
                                src={notification.senderProfileImage}
                                alt=""
                                className="w-11 h-11 rounded-xl object-cover ring-1 ring-gray-200"
                              />
                            ) : (
                              <div className={`w-11 h-11 rounded-xl ${config.iconBg} flex items-center justify-center font-bold text-base`}>
                                {getInitials(notification.subtitle)}
                              </div>
                            )}
                            {/* ???誘몃땲 ?꾩씠肄?*/}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.iconBg} border-2 border-white flex items-center justify-center`}>
                              <span className="[&>svg]:size-2.5">{config.icon}</span>
                            </div>
                          </div>

                          {/* ?댁슜 */}
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
                                <span className="text-xs text-gray-400">{notification.time}</span>
                                <button
                                  onClick={() => handleSnooze(notification.id)}
                                  className="opacity-0 group-hover:opacity-100 transition-opacity w-5 h-5 rounded-md hover:bg-[#F1EFE8] flex items-center justify-center"
                                >
                                  <X className="size-3 text-gray-400" />
                                </button>
                              </div>
                            </div>

                            <p className="text-sm text-[#0F0F0F] font-medium leading-snug mb-0.5">
                              {notification.title}
                            </p>
                            {notification.subtitle && (
                              <p className="text-xs text-[#8B8A84]">@{notification.subtitle}</p>
                            )}

                            {/* ?≪뀡 踰꾪듉 */}
                            {notification.action && (
                              <div className="mt-3">
                                <button
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
              className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between border-b border-gray-100 px-7 py-5">
                <div>
                  <p className="text-sm font-semibold text-[#00A88C]">제안 확인하기</p>
                  <h2 className="mt-1 text-2xl font-bold text-[#0F0F0F]">
                    {proposalModalData?.projectTitle ?? "프로젝트 제안"}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {proposalModalData?.projectMeta ?? "지원한 디자이너 제안을 확인하세요."}
                  </p>
                </div>
                <button
                  onClick={closeProposalModal}
                  className="rounded-full border border-gray-200 p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="max-h-[65vh] overflow-y-auto px-7 py-5">
                <div className="mb-5 rounded-xl bg-[#F7F9FB] border border-gray-100 px-4 py-3 text-sm text-[#5F5E5A]">
                  내가 작성한 프로젝트 공고에 지원한 디자이너 목록입니다. 제안 내용을 검토하고 메시지로 바로 이어갈 수 있어요.
                </div>

                {isProposalLoading ? (
                  <div className="flex flex-col gap-4">
                    {[1, 2].map((item) => (
                      <div key={item} className="rounded-2xl border border-gray-200 p-5">
                        <div className="h-5 w-40 rounded bg-gray-100 animate-pulse" />
                        <div className="mt-4 h-16 rounded bg-gray-100 animate-pulse" />
                        <div className="mt-4 h-12 rounded bg-gray-100 animate-pulse" />
                      </div>
                    ))}
                  </div>
                ) : proposalLoadError ? (
                  <div className="rounded-2xl border border-red-100 bg-red-50 px-4 py-4 text-sm text-red-600">
                    {proposalLoadError}
                  </div>
                ) : !proposalModalData || proposalModalData.applications.length === 0 ? (
                  <div className="rounded-2xl border border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-500">
                    아직 확인할 지원 제안이 없어요.
                  </div>
                ) : (
                  <div className="flex flex-col gap-4">
                    {proposalModalData.applications.map((proposal) => (
                      <div
                        key={proposal.applicationId}
                        className="rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between gap-4">
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
                              <div className="flex items-center gap-2">
                                <h3 className="font-bold text-[#0F0F0F]">{proposal.designerName}</h3>
                                <span className="rounded-full bg-[#EEF9F6] border border-[#CDEFE6] px-2 py-0.5 text-xs font-semibold text-[#00A88C]">
                                  디자이너
                                </span>
                              </div>
                              <p className="mt-0.5 text-xs text-gray-500">
                                @{proposal.designerNickname ?? proposal.designerName}
                              </p>
                            </div>
                          </div>
                          <button
                            onClick={() => handleProposalMessage(proposal.designerId)}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-[#00C9A7] px-4 py-2 text-sm font-semibold text-black hover:bg-[#00A88C] transition-colors"
                          >
                            <MessageCircle className="size-3.5" />
                            메시지 보내기
                          </button>
                        </div>

                        {proposal.summary && (
                          <p className="mt-4 text-sm leading-relaxed text-[#5F5E5A]">{proposal.summary}</p>
                        )}

                        {proposal.coverLetter && (
                          <div className="mt-3 rounded-xl bg-[#FAFBFC] border border-gray-100 px-4 py-3 text-sm text-gray-600">
                            {proposal.coverLetter}
                          </div>
                        )}

                        <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl bg-[#FAFBFC] border border-gray-100 p-3 md:grid-cols-3">
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Briefcase className="size-3.5 text-[#00A88C]" />
                            희망 예산 {formatProposalBudget(proposal.expectedBudget)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <Calendar className="size-3.5 text-[#00A88C]" />
                            시작 가능일 {formatProposalStartDate(proposal.startDate)}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-600">
                            <UserRound className="size-3.5 text-[#00A88C]" />
                            {getPortfolioLabel(proposal.portfolioUrl)}
                          </div>
                        </div>

                        {proposal.portfolioUrl && (
                          <div className="mt-3">
                            <a
                              href={proposal.portfolioUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A88C] hover:text-[#007E68]"
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

      {/* ?쇰뱶 ?곸꽭 紐⑤떖 */}
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
            formatFeedDateTime={(val) => val ? new Date(val).toLocaleDateString() : null}
            isFeedLiked={(item) => likedItems.has(item.id)}
            getLikeCount={(item) => item.likes + (likedItems.has(item.id) ? 1 : 0)}
            getCommentCount={(item) => item.comments}
            onClose={() => setSelectedFeedForModal(null)}
            onMoveModalCarousel={moveModalCarousel}
            onSetModalImageIndex={(idx) => setModalImageIndex(idx)}
            onToggleLike={handleToggleLike}
            onOpenCollectionModal={() => alert("컬렉션 기능은 준비 중입니다.")}
            onShare={() => alert("링크가 복사되었습니다.")}
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

