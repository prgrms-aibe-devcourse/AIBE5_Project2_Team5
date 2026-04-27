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
} from "../utils/notificationState";

type NotificationTab = "all" | NotificationCategory;

type ProjectProposal = {
  id: number;
  projectTitle: string;
  projectMeta: string;
  designerName: string;
  designerRole: string;
  designerAvatar: string;
  summary: string;
  budget: string;
  startDate: string;
  skills: string[];
  portfolioLabel: string;
};

const tabs: Array<{ key: NotificationTab; label: string }> = [
  { key: "all", label: "전체" },
  { key: "project", label: "프로젝트" },
  { key: "activity", label: "활동" },
  { key: "system", label: "시스템" },
];

const proposalInbox: ProjectProposal[] = [
  {
    id: 1,
    projectTitle: "브랜드 리뉴얼 프로젝트",
    projectMeta: "브랜딩 · 모집중 · 지원 3명",
    designerName: "김지은",
    designerRole: "브랜드 디자이너",
    designerAvatar: "https://i.pravatar.cc/80?img=1",
    summary: "기존 브랜드의 강점을 유지하면서 디지털 접점을 강화하는 방향으로 리브랜딩 제안을 드립니다.",
    budget: "900만원",
    startDate: "즉시 가능",
    skills: ["Brand Identity", "Figma", "Illustrator"],
    portfolioLabel: "F&B 브랜딩 리뉴얼 4건",
  },
  {
    id: 2,
    projectTitle: "브랜드 리뉴얼 프로젝트",
    projectMeta: "브랜딩 · 모집중 · 지원 3명",
    designerName: "박서준",
    designerRole: "그래픽 디자이너",
    designerAvatar: "https://i.pravatar.cc/80?img=2",
    summary: "브랜드 시스템과 디지털 콘텐츠 운영을 함께 고려한 제안이 가능합니다.",
    budget: "1,050만원",
    startDate: "1주 이내 가능",
    skills: ["Visual System", "Typography", "Guide Document"],
    portfolioLabel: "SaaS 브랜드 시스템 구축 경험",
  },
];

// 알림 타입별 색상·아이콘 설정 (라이트 테마 기준)
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

export default function Notifications() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [selectedProposalNotification, setSelectedProposalNotification] = useState<NotificationItem | null>(null);
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
  const currentUserName = currentUser?.nickname || currentUser?.name || "내 프로필";

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
    await loadNotifications();
  };

  const handleSnooze = (id: number) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handlePrimaryAction = async (notification: NotificationItem) => {
    await markNotificationRead(notification.id);

    if (notification.actionType === "proposal") {
      setSelectedProposalNotification(notification);
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

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5]">
      <Navigation />

      <main className="flex-1">
        <div className="max-w-[860px] mx-auto px-6 py-10">

          {/* 헤더 */}
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
                프로젝트 제안, 활동 소식, 시스템 알림을 분류해서 확인하세요.
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

          {/* 탭 */}
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

          {/* 알림 목록 */}
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
                        {/* 미읽음 좌측 강조선 */}
                        {!notification.isRead && (
                          <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-[#00C9A7]" />
                        )}

                        <div className="flex items-start gap-4 px-6 py-5">
                          {/* 아바타 */}
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
                            {/* 타입 미니 아이콘 */}
                            <div className={`absolute -bottom-1 -right-1 w-5 h-5 rounded-full ${config.iconBg} border-2 border-white flex items-center justify-center`}>
                              <span className="[&>svg]:size-2.5">{config.icon}</span>
                            </div>
                          </div>

                          {/* 내용 */}
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

                            {/* 액션 버튼 */}
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

      {/* 제안 확인 모달 */}
      <AnimatePresence>
        {selectedProposalNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/55"
            onClick={() => setSelectedProposalNotification(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 12 }}
              transition={{ type: "spring", damping: 22, stiffness: 300 }}
              className="w-full max-w-3xl rounded-3xl bg-white shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 모달 헤더 */}
              <div className="flex items-start justify-between border-b border-gray-100 px-7 py-5">
                <div>
                  <p className="text-sm font-semibold text-[#00A88C]">제안 확인하기</p>
                  <h2 className="mt-1 text-2xl font-bold text-[#0F0F0F]">{proposalInbox[0].projectTitle}</h2>
                  <p className="mt-1 text-sm text-gray-500">{proposalInbox[0].projectMeta}</p>
                </div>
                <button
                  onClick={() => setSelectedProposalNotification(null)}
                  className="rounded-full border border-gray-200 p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* 모달 본문 */}
              <div className="max-h-[65vh] overflow-y-auto px-7 py-5">
                <div className="mb-5 rounded-xl bg-[#F7F9FB] border border-gray-100 px-4 py-3 text-sm text-[#5F5E5A]">
                  내가 작성한 프로젝트 공고에 지원한 디자이너 목록입니다. 제안 내용을 검토하고 메시지로 이어갈 수 있습니다.
                </div>

                <div className="flex flex-col gap-4">
                  {proposalInbox.map((proposal) => (
                    <div
                      key={proposal.id}
                      className="rounded-2xl border border-gray-200 p-5 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex items-center gap-4">
                          <img
                            src={proposal.designerAvatar}
                            alt={proposal.designerName}
                            className="w-12 h-12 rounded-xl object-cover"
                          />
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="font-bold text-[#0F0F0F]">{proposal.designerName}</h3>
                              <span className="rounded-full bg-[#EEF9F6] border border-[#CDEFE6] px-2 py-0.5 text-xs font-semibold text-[#00A88C]">
                                {proposal.designerRole}
                              </span>
                            </div>
                            <p className="mt-0.5 text-xs text-gray-500">{proposal.portfolioLabel}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => navigate("/messages")}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-[#00C9A7] px-4 py-2 text-sm font-semibold text-black hover:bg-[#00A88C] transition-colors"
                        >
                          <MessageCircle className="size-3.5" />
                          메시지 보기
                        </button>
                      </div>

                      <p className="mt-4 text-sm leading-relaxed text-[#5F5E5A]">{proposal.summary}</p>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {proposal.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full border border-[#CDEFE6] bg-[#F3FCF8] px-2.5 py-0.5 text-xs font-medium text-[#008F78]"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-3 gap-3 rounded-xl bg-[#FAFBFC] border border-gray-100 p-3">
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Briefcase className="size-3.5 text-[#00A88C]" />
                          제안 예산 {proposal.budget}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <Calendar className="size-3.5 text-[#00A88C]" />
                          시작 가능 {proposal.startDate}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-gray-600">
                          <UserRound className="size-3.5 text-[#00A88C]" />
                          적합도 높음
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
