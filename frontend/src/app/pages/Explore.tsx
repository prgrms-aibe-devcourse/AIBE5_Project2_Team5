import Navigation from "../components/Navigation";
import {
  Search, Sparkles, Heart, Eye, Users, UserSearch, ImageOff,
  LayoutGrid, Palette, Camera, PenTool, Box, Monitor, Building2,
  Shirt, Megaphone, Scissors, Brush, Package, Gamepad2, Music,
  ArrowRight, X, Plus, ChevronLeft, ChevronRight, Bookmark, Check, FolderPlus, Share2, MessageCircle, Send, MoreVertical, ExternalLink, Figma, Sparkles as SparklesIcon
} from "lucide-react";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { FeedDetailModal } from "../components/feed/FeedDetailModal";
import { useFeedComments } from "../hooks/useFeedComments";
import { matchingCategories, normalizeCategoryLabel, normalizePostTypeLabel } from "../utils/matchingCategories";
import {
  getExploreFeedsApi,
  type ExplorePostResponseDto,
  getExploreDesignersApi,
  type ExploreDesignerResponseDto,
  getExploreFeedDetailApi,
  type ExploreFeedDetailResponseDto,
  runAiSearchApi,
} from "../api/exploreApi";
import { useFeedDetail } from "../hooks/useFeedDetail";
import { toggleFeedPickApi } from "../api/feedApi";
import {
  getMyCollectionsApi,
  saveFeedToCollectionApi,
  createCollectionFolderApi,
  CollectionFolderResponse,
} from "../api/collectionApi";
import { createMessageConversationApi, sendConversationMessageApi } from "../api/messageApi";
import { getCurrentUser } from "../utils/auth";
import { getUserAvatar } from "../utils/avatar";
import Footer from "../components/Footer";
import type { FeedCardItem } from "../types/feed";

const creatorProfiles = [
  {
    id: 1,
    name: "김소연",
    role: "브랜딩 디자이너",
    category: "브랜딩",
    avatar: "https://i.pravatar.cc/150?img=1",
    banner: "https://images.unsplash.com/photo-1623932078839-44eb01fbee63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "4.2K",
    works: 78,
    bio: "브랜드 아이덴티티와 로고 시스템 작업을 주로 합니다.",
  },
  {
    id: 2,
    name: "박서준",
    role: "그래픽 디자이너",
    category: "그래픽",
    avatar: "https://i.pravatar.cc/150?img=2",
    banner: "https://images.unsplash.com/photo-1770581939371-326fc1537f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "3.5K",
    works: 92,
    bio: "타이포그래피와 포스터 디자인을 중심으로 작업합니다.",
  },
  {
    id: 3,
    name: "이하늘",
    role: "UI/UX 디자이너",
    category: "UI/UX",
    avatar: "https://i.pravatar.cc/150?img=3",
    banner: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "5.1K",
    works: 134,
    bio: "사용자 중심 인터페이스와 서비스 설계를 다룹니다.",
  },
  {
    id: 4,
    name: "최유진",
    role: "일러스트레이터",
    category: "일러스트",
    avatar: "https://i.pravatar.cc/150?img=4",
    banner: "https://images.unsplash.com/photo-1700605295478-2478ac29d2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "2.9K",
    works: 67,
    bio: "캐릭터와 에디토리얼 일러스트 작업을 합니다.",
  },
  {
    id: 5,
    name: "정재훈",
    role: "패키지 디자이너",
    category: "패키지",
    avatar: "https://i.pravatar.cc/150?img=5",
    banner: "https://images.unsplash.com/photo-1748765968965-7e18d4f7192b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "3.3K",
    works: 85,
    bio: "리테일 브랜드 패키지와 라벨 시스템을 설계합니다.",
  },
  {
    id: 6,
    name: "강민지",
    role: "사진작가",
    category: "포토그래피",
    avatar: "https://i.pravatar.cc/150?img=6",
    banner: "https://images.unsplash.com/photo-1646123202971-cb84915a4108?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "6.8K",
    works: 203,
    bio: "브랜드와 룩북 중심의 비주얼 촬영을 진행합니다.",
  },
];

const CATEGORY_ICONS: Record<string, (props: { className?: string }) => JSX.Element> = {
  "그래픽 디자인": Palette,
  "포토그래피": Camera,
  "일러스트레이션": PenTool,
  "3D Art": Box,
  "UI/UX": Monitor,
  "건축": Building2,
  "패션": Shirt,
  "광고": Megaphone,
  "공예": Scissors,
  "미술": Brush,
  "제품 디자인": Package,
  "게임 디자인": Gamepad2,
  "사운드": Music,
  "브랜딩": Palette,
  "패키지": Package,
};

// 탐색 페이지 컬렉션 저장용 타입
type SavedCollection = CollectionFolderResponse;

const fetchCollections = async (setCollections: React.Dispatch<React.SetStateAction<SavedCollection[]>>) => {
  try {
    const data = await getMyCollectionsApi();
    setCollections(data);
  } catch (error) {
    console.error("컬렉션 목록 로드 실패:", error);
  }
};

export default function Explore() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const categories = matchingCategories;
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "profile">("feed");

  // 서버 데이터 상태
  const [feeds, setFeeds] = useState<FeedCardItem[]>([]);
  const [isFeedsLoading, setIsFeedsLoading] = useState(true);
  const [designers, setDesigners] = useState<ExploreDesignerResponseDto[]>([]);
  const [isDesignersLoading, setIsDesignersLoading] = useState(false);

  // 상호작용 상태
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());

  // 모달 상태 (팀원분 최신 로직 통합)
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<ExplorePostResponseDto | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ExploreFeedDetailResponseDto | null>(null);
  const [isModalDetailLoading, setIsModalDetailLoading] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);

  const [selectedExploreFeed, setSelectedExploreFeed] = useState<FeedCardItem | null>(null);
  const [commentFeedItems, setCommentFeedItems] = useState<FeedCardItem[]>([]);
  const [startingProposalPostId, setStartingProposalPostId] = useState<number | null>(null);

  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [collectionModalProject, setCollectionModalProject] = useState<FeedCardItem | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collectionNotice, setCollectionNotice] = useState("");
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(false);

  // 컬렉션 목록 로드
  const loadCollections = useCallback(async () => {
    setIsCollectionsLoading(true);
    await fetchCollections(setCollections);
    setIsCollectionsLoading(false);
  }, []);

  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  // 저장 상태
  const [savedProjectIds, setSavedProjectIds] = useState<Set<number>>(new Set());

  // AI 검색 상태
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [isAiAssistantOpen, setIsAiAssistantOpen] = useState(false);
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "ai"; content: string; category?: string; keywords?: string[] }>>([
    { role: "ai", content: "안녕하세요! 저는 Pickxel AI 탐색 어시스턴트입니다. 어떤 디자인이나 디자이너를 찾으시나요?" }
  ]);
  const [aiInput, setAiInput] = useState("");
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  // 검색어 디바운스 처리
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const catScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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
    selectedFeedComments,
    handleSubmitComment,
    handleCommentKeyDown,
    startEditingComment,
    cancelEditingComment,
    handleUpdateComment,
    handleDeleteComment,
    toggleCommentLike,
    editingCommentId,
    editingCommentText,
    setEditingCommentText,
    isUpdatingComment,
    isDeletingCommentId,
  } = useFeedComments<FeedCardItem, FeedCardItem>({
    selectedFeed: selectedExploreFeed,
    currentUser,
    currentUserId: currentUser?.userId ?? null,
    setApiFeedItems: setCommentFeedItems,
    setSelectedFeed: setSelectedExploreFeed,
    toFeedCommentRole: toCommentAuthorRole,
  });

  // 상세 로딩 로직 (팀원분 최신 방식)
  useEffect(() => {
    if (!selectedProjectForModal) {
      setSelectedProjectDetail(null);
      setIsModalDetailLoading(false);
      setModalImageIndex(0);
      return;
    }

    let ignore = false;
    async function loadExploreFeedDetail() {
      try {
        setIsModalDetailLoading(true);
        const detail = await getExploreFeedDetailApi(selectedProjectForModal.postId);
        if (ignore) return;
        setSelectedProjectDetail(detail);
      } catch (error) {
        if (ignore) return;
        console.error("탐색 피드 상세 로딩 실패:", error);
        setSelectedProjectDetail(null);
      } finally {
        if (!ignore) {
          setIsModalDetailLoading(false);
        }
      }
    }
    void loadExploreFeedDetail();
    return () => { ignore = true; };
  }, [selectedProjectForModal?.postId]);

  const mappedSelectedExploreFeed = useMemo<FeedCardItem | null>(() => {
    if (!selectedProjectForModal) return null;
    const detail = selectedProjectDetail;
    const imageUrls = detail?.imageUrls?.filter(Boolean).length
        ? detail.imageUrls.filter(Boolean)
        : selectedProjectForModal.imageUrl ? [selectedProjectForModal.imageUrl] : [];
    const commentCount = selectedExploreFeed?.id === selectedProjectForModal.postId
        ? selectedExploreFeed.comments
        : detail?.commentCount ?? 0;

    return {
      id: selectedProjectForModal.postId,
      feedKey: selectedProjectForModal.postId,
      author: {
        userId: selectedProjectForModal.userId,
        name: detail?.nickname ?? selectedProjectForModal.nickname,
        role: detail?.job || selectedProjectForModal.job || "디자이너",
        avatar: getUserAvatar(detail?.profileImageUrl ?? selectedProjectForModal.profileImage, selectedProjectForModal.userId, selectedProjectForModal.nickname),
        profileKey: detail?.profileKey ?? String(selectedProjectForModal.userId),
      },
      title: detail?.title ?? selectedProjectForModal.title,
      description: detail?.description ?? selectedProjectForModal.description ?? "",
      image: imageUrls[0] ?? "",
      images: imageUrls,
      likes: (detail?.pickCount ?? selectedProjectForModal.pickCount) + (likedItems.has(selectedProjectForModal.postId) ? 1 : 0),
      comments: commentCount,
      tags: [normalizeCategoryLabel(detail?.category ?? selectedProjectForModal.category ?? ""), normalizePostTypeLabel(detail?.postType ?? "PORTFOLIO")].filter(Boolean) as string[],
      category: normalizeCategoryLabel(detail?.category ?? selectedProjectForModal.category ?? ""),
      integrations: detail?.portfolioUrl ? [{ provider: "figma", label: "Portfolio", url: detail.portfolioUrl }] : undefined,
      createdAt: detail?.createdAt,
      userId: selectedProjectForModal.userId,
      portfolioUrl: detail?.portfolioUrl ?? null,
      likedByMe: likedItems.has(selectedProjectForModal.postId),
      isMine: detail?.mine ?? currentUser?.userId === selectedProjectForModal.userId,
      isApiFeed: true,
    };
  }, [selectedProjectForModal, selectedProjectDetail, selectedExploreFeed, likedItems, currentUser?.userId]);

  useEffect(() => {
    if (!mappedSelectedExploreFeed) {
      setSelectedExploreFeed(null);
      setCommentFeedItems([]);
      return;
    }
    setSelectedExploreFeed(prev => (prev && prev.id === mappedSelectedExploreFeed.id) ? { ...mappedSelectedExploreFeed, comments: prev.comments } : mappedSelectedExploreFeed);
    setCommentFeedItems(prev => {
      const current = prev.find(item => item.id === mappedSelectedExploreFeed.id);
      return [current ? { ...mappedSelectedExploreFeed, comments: current.comments } : mappedSelectedExploreFeed];
    });
  }, [mappedSelectedExploreFeed]);

  // 핸들러 함수들 (UI 보존을 위해 기존 로직 그대로 유지)
  const toggleLike = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const response = await toggleFeedPickApi(id);
      setLikedItems(prev => {
        const newSet = new Set(prev);
        if (response.picked) newSet.add(id); else newSet.delete(id);
        return newSet;
      });
      setFeeds(prev => prev.map(f => f.id === id ? { ...f, likes: response.pickCount, likedByMe: response.picked } : f));
      if (selectedExploreFeed?.id === id) {
        setSelectedExploreFeed(prev => prev ? { ...prev, likes: response.pickCount, likedByMe: response.picked } : null);
      }
    } catch (error) { console.error("좋아요 오류:", error); }
  };

  const handleShare = (item: FeedCardItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (navigator.share) navigator.share({ title: item.title, text: item.description || "", url: window.location.href });
    else alert("공유 링크가 클립보드에 복사되었습니다.");
  };

  const openCollectionModal = (project: any, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCollectionModalProject(project);
    setCollectionNotice("");
    setNewCollectionName("");
    void loadCollections();
  };

  const saveToCollection = async (folderId: number) => {
    if (!collectionModalProject) return;
    try {
      await saveFeedToCollectionApi(folderId, collectionModalProject.id);
      setCollectionNotice("컬렉션에 저장되었습니다.");
      setSavedProjectIds(prev => new Set(prev).add(collectionModalProject.id));
      void loadCollections();
      setTimeout(() => setCollectionModalProject(null), 1000);
    } catch (error) { setCollectionNotice("저장에 실패했습니다."); }
  };

  const createCollectionAndSave = async () => {
    if (!newCollectionName.trim() || !collectionModalProject) return;
    try {
      const folder = await createCollectionFolderApi(newCollectionName.trim());
      if (folder?.folderId) { await saveToCollection(folder.folderId); setNewCollectionName(""); }
    } catch (error) { setCollectionNotice("생성 실패"); }
  };

  const moveModalCarousel = (dir: -1 | 1, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (!selectedExploreFeed) return;
    const images = selectedExploreFeed.images || [selectedExploreFeed.image];
    if (images.length <= 1) return;
    setModalImageIndex(prev => (prev + dir + images.length) % images.length);
  };

  const handleProposalClick = async (item: FeedCardItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (startingProposalPostId !== null) return;
    if (!item.author?.userId) { alert("상대방 정보를 찾을 수 없습니다."); return; }
    const now = Date.now();
    const proposalMessage = `안녕하세요. "${item.title}" 작업을 보고 프로젝트 제안을 드리고 싶어 연락드립니다.`;
    setStartingProposalPostId(item.id);
    try {
      const conversation = await createMessageConversationApi(item.author.userId);
      setSelectedProjectForModal(null);
      navigate(`/messages?conversationId=${conversation.id}`);
      void sendConversationMessageApi(conversation.id, {
        clientId: `explore-proposal-${item.id}-${now}`,
        message: proposalMessage,
        attachments: item.image ? [{ id: `explore-feed-${item.id}`, type: "image", src: item.image, name: item.title, uploadStatus: "ready" }] : [],
      });
    } catch (error) { alert("실패했습니다."); }
    finally { setStartingProposalPostId(null); }
  };

  // 피드 로딩 로직
  useEffect(() => {
    if (activeTab !== "feed") return;
    const fetchFeeds = async () => {
      try {
        setIsFeedsLoading(true);
        const data = await getExploreFeedsApi(selectedCategory || "all", debouncedSearchQuery);
        setFeeds(data.map(item => ({
          id: item.postId,
          author: { userId: item.userId, name: item.nickname, role: item.job || "디자이너", avatar: getUserAvatar(item.profileImage, item.userId, item.nickname), profileKey: String(item.userId) },
          title: item.title,
          description: item.description || "",
          image: item.imageUrl || "",
          images: item.imageUrl ? [item.imageUrl] : [],
          likes: item.pickCount,
          comments: 0,
          tags: [item.category].filter(Boolean) as string[],
          category: item.category || undefined,
          likedByMe: item.picked,
          isApiFeed: true
        })));
      } catch (error) { console.error("로딩 실패"); }
      finally { setIsFeedsLoading(false); }
    };
    fetchFeeds();
  }, [selectedCategory, debouncedSearchQuery, activeTab]);

  useEffect(() => {
    if (activeTab !== "profile") return;
    const fetchDesigners = async () => {
      try {
        setIsDesignersLoading(true);
        const data = await getExploreDesignersApi(debouncedSearchQuery);
        setDesigners(data);
      } catch (error) { console.error("로딩 실패"); }
      finally { setIsDesignersLoading(false); }
    };
    fetchDesigners();
  }, [debouncedSearchQuery, activeTab]);

  const filteredProjects = useMemo(() => feeds, [feeds]);
  const filteredDesigners = useMemo(() => designers, [designers]);

  // AI 검색 로직
  const handleAiSearch = async (e?: React.FormEvent, directQuery?: string) => {
    e?.preventDefault();
    const queryToUse = directQuery || aiInput.trim();
    if (!queryToUse || aiLoading) return;
    setAiMessages(prev => [...prev, { role: "user", content: queryToUse }]);
    if (!directQuery) setAiInput("");
    setAiLoading(true);
    try {
      const response = await runAiSearchApi(queryToUse);
      setAiMessages(prev => [...prev, { role: "ai", content: response.message, category: response.category || undefined, keywords: response.keywords }]);
      if (response.category) setSelectedCategory(response.category);
      if (response.keywords?.length) setSearchQuery(response.keywords[0]);
    } catch (error) { setAiMessages(prev => [...prev, { role: "ai", content: "오류가 발생했습니다." }]); }
    finally { setAiLoading(false); }
  };

  useEffect(() => { aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [aiMessages]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && aiMode) {
      e.preventDefault();
      if (searchQuery.trim()) { setIsAiAssistantOpen(true); handleAiSearch(undefined, searchQuery.trim()); }
    }
  };

  // UI 헬퍼
  const scrollCat = (dir: "left" | "right") => { catScrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" }); };
  const checkCatScroll = useCallback(() => {
    const el = catScrollRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 2);
    setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 2);
  }, []);

  useEffect(() => {
    const el = catScrollRef.current;
    if (!el) return;
    checkCatScroll();
    el.addEventListener("scroll", checkCatScroll, { passive: true });
    window.addEventListener("resize", checkCatScroll);
    return () => { el.removeEventListener("scroll", checkCatScroll); window.removeEventListener("resize", checkCatScroll); };
  }, [checkCatScroll, activeTab]);

  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);

  // JSX 렌더링 (aa0680d7 원본 디자인 100% 복구)
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F7F5]">
      <Navigation />

      {/* 탐색 검색바 + AI 검색 + 탭 전환 */}
      <section className="relative z-30 flex justify-center">
        <div className="bg-transparent w-full max-w-none px-0 pt-6 pb-2 mx-auto">
          <div className="mx-auto w-full max-w-[1800px] px-5">
            <div className="flex items-center gap-2.5">
            {/* 검색 인풋 */}
            <div className={`relative flex-1 rounded-xl transition-all duration-300 ${
              aiMode
                ? "bg-gradient-to-r from-[#00C9A7]/8 to-[#FF5C3A]/4 border-2 border-[#00C9A7]/30 shadow-[0_0_24px_rgba(0,201,167,0.1)]"
                : "bg-white border border-gray-200/80 shadow-sm hover:border-gray-300 focus-within:border-[#00C9A7]/40 focus-within:shadow-[0_0_0_3px_rgba(0,201,167,0.1)]"
            }`}>
              {aiMode ? (
                <Sparkles className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-[#00C9A7]" />
              ) : (
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              )}
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder={aiMode ? "어떤 디자이너를 찾고 계세요? AI가 추천해드릴게요..." : "pickxel에서 검색..."}
                className="w-full h-10 pl-10 pr-4 bg-transparent text-sm text-[#0F0F0F] placeholder:text-gray-400 focus:outline-none rounded-xl"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200/60 rounded-full transition-colors">
                  <X className="size-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* AI 버튼 */}
            <button
              onClick={() => setAiMode(!aiMode)}
              className={`flex items-center gap-2 h-10 px-4 rounded-xl font-medium text-sm transition-all duration-300 relative group overflow-hidden ${
                aiMode
                  ? "bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white shadow-[0_4px_12px_rgba(0,201,167,0.3)] scale-105"
                  : "bg-white border border-gray-200 text-gray-600 hover:border-[#00C9A7]/50 hover:text-[#00C9A7]"
              }`}
            >
              <div className={`absolute inset-0 bg-white/20 transition-transform duration-500 -translate-x-full group-hover:translate-x-full`} />
              <Sparkles className={`size-4 ${aiMode ? "animate-pulse" : "group-hover:rotate-12 transition-transform"}`} />
              <span className="relative z-10">AI 탐색</span>
            </button>
            </div>

            {/* 탭 전환 및 필터 */}
            <div className="flex items-center justify-between mt-5">
              <div className="flex items-center gap-1.5 p-1 bg-gray-200/50 rounded-xl w-fit">
                <button
                  onClick={() => setActiveTab("feed")}
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "feed" ? "bg-white text-[#00C9A7] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  피드
                </button>
                <button
                  onClick={() => setActiveTab("profile")}
                  className={`px-5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    activeTab === "profile" ? "bg-white text-[#00C9A7] shadow-sm" : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  디자이너
                </button>
              </div>

              <div className="flex items-center gap-4 text-[13px] font-medium text-gray-500">
                <button className="flex items-center gap-1.5 hover:text-[#0F0F0F] transition-colors"><LayoutGrid className="size-4" /> 갤러리형</button>
                <div className="w-px h-3.5 bg-gray-200" />
                <button className="flex items-center gap-1.5 hover:text-[#0F0F0F] transition-colors">최신순 <ChevronLeft className="size-4 rotate-270" /></button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 카테고리 슬라이더 */}
      <div className="sticky top-[64px] z-20 bg-[#F7F7F5]/80 backdrop-blur-md border-b border-gray-200/50">
        <div className="max-w-[1800px] mx-auto px-5 py-3 flex items-center gap-4">
          <div className="w-px h-6 bg-gray-200 mx-1" />
          <div className="relative flex-1 overflow-hidden flex items-center group">
            {canScrollLeft && (
              <button onClick={() => scrollCat("left")} className="absolute left-0 z-10 p-1.5 bg-white/90 rounded-full shadow-md border border-gray-100 text-gray-600 hover:bg-white transition-all"><ChevronLeft className="size-4" /></button>
            )}
            <div ref={catScrollRef} className="flex gap-2 overflow-x-auto scrollbar-hide px-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all border ${
                  !selectedCategory ? "bg-[#0F0F0F] text-white border-[#0F0F0F]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                }`}
              >
                전체
              </button>
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat];
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`whitespace-nowrap px-4 py-1.5 rounded-full text-xs font-medium transition-all border flex items-center gap-1.5 ${
                      selectedCategory === cat ? "bg-[#00C9A7] text-white border-[#00C9A7]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300"
                    }`}
                  >
                    {Icon && <Icon className="size-3" />}
                    {cat}
                  </button>
                );
              })}
            </div>
            {canScrollRight && (
              <button onClick={() => scrollCat("right")} className="absolute right-0 z-10 p-1.5 bg-white/90 rounded-full shadow-md border border-gray-100 text-gray-600 hover:bg-white transition-all"><ChevronRight className="size-4" /></button>
            )}
          </div>
        </div>
      </div>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 max-w-[1800px] mx-auto w-full px-5 py-8">
        {activeTab === "feed" ? (
          <>
            {isFeedsLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                  <div key={i} className="aspect-[4/3] bg-gray-200 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                <AnimatePresence mode="popLayout">
                  {filteredProjects.map((project) => (
                    <motion.div
                      key={project.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                      className="group relative bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100"
                    >
                      <div
                        onClick={() => setSelectedProjectForModal(project as any)}
                        className="aspect-[4/3] overflow-hidden cursor-pointer relative"
                      >
                        <ImageWithFallback
                          src={project.image}
                          alt={project.title}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-between p-4">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={(e) => toggleLike(project.id, e)}
                              className={`p-2 rounded-full backdrop-blur-md transition-all ${
                                likedItems.has(project.id) ? "bg-[#FF5C3A] text-white" : "bg-white/20 text-white hover:bg-white/40"
                              }`}
                            >
                              <Heart className={`size-4 ${likedItems.has(project.id) ? "fill-current" : ""}`} />
                            </button>
                            <button
                              onClick={(e) => openCollectionModal(project, e)}
                              className={`p-2 rounded-full backdrop-blur-md transition-all ${
                                savedProjectIds.has(project.id) ? "bg-[#00C9A7] text-white" : "bg-white/20 text-white hover:bg-white/40"
                              }`}
                            >
                              <Bookmark className={`size-4 ${savedProjectIds.has(project.id) ? "fill-current" : ""}`} />
                            </button>
                          </div>
                          <div className="flex items-center justify-between text-white">
                            <span className="text-sm font-medium truncate pr-4">{project.title}</span>
                            <div className="flex items-center gap-3 text-[10px] opacity-80">
                              <span className="flex items-center gap-1"><Eye className="size-3" /> 9.8k</span>
                              <span className="flex items-center gap-1"><MessageCircle className="size-3" /> {project.comments}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 flex items-center justify-between border-t border-gray-50">
                        <div className="flex items-center gap-2.5">
                          <img src={project.author.avatar} alt={project.author.name} className="size-7 rounded-full border border-gray-100 shadow-sm" />
                          <div className="flex flex-col min-w-0">
                            <span className="text-xs font-bold text-gray-900 leading-none mb-1 truncate">{project.author.name}</span>
                            <span className="text-[10px] text-gray-400 font-medium truncate">{project.author.role}</span>
                          </div>
                        </div>
                        {project.tags?.[0] && (
                          <span className="px-2 py-1 bg-gray-100 text-gray-500 text-[9px] font-bold rounded-md uppercase tracking-wider shrink-0">{project.tags[0]}</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="py-32 flex flex-col items-center justify-center text-gray-400">
                <ImageOff className="size-12 mb-4 opacity-20" />
                <p className="text-sm">검색 결과가 없습니다.</p>
              </div>
            )}
          </>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {isDesignersLoading ? (
              [1, 2, 3].map((i) => <div key={i} className="h-64 bg-gray-200 rounded-3xl animate-pulse" />)
            ) : filteredDesigners.map((designer) => (
              <motion.div
                key={designer.userId}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="group bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 border border-gray-100 p-6 relative"
              >
                <div className="absolute top-6 right-6 flex gap-2">
                  <button className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-[#00C9A7] hover:text-white transition-all"><Plus className="size-4" /></button>
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <img src={getUserAvatar(designer.profileImage, designer.userId, designer.nickname)} alt={designer.nickname} className="size-16 rounded-2xl object-cover shadow-md border-2 border-white" />
                  <div className="min-w-0">
                    <h3 className="text-lg font-bold text-gray-900 truncate">{designer.nickname}</h3>
                    <p className="text-sm text-[#00C9A7] font-semibold">{designer.job || "디자이너"}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-500 line-clamp-2 mb-6 min-h-[40px] leading-relaxed">{designer.introduction || "창의적인 디자인 솔루션을 제공하는 디자이너입니다."}</p>
                <div className="flex items-center gap-6 pt-6 border-t border-gray-50">
                  <div className="flex flex-col"><span className="text-sm font-bold text-gray-900">{designer.followCount}</span><span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Followers</span></div>
                  <div className="flex flex-col"><span className="text-sm font-bold text-gray-900">{designer.worksCount}</span><span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Works</span></div>
                  <div className="flex-1" />
                  <button onClick={() => navigate(`/profile/${designer.userId}`)} className="h-10 px-4 bg-[#0F0F0F] text-white text-xs font-bold rounded-xl hover:bg-[#00C9A7] transition-all flex items-center gap-2">프로필 <ArrowRight className="size-3.5" /></button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>

      {/* AI 어시스턴트 아이콘 (원본 디자인 복구) */}
      <button
        onClick={() => setIsAiAssistantOpen(true)}
        className="fixed bottom-8 right-8 z-[60] group"
      >
        <div className="absolute inset-0 bg-[#00C9A7] rounded-full blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
        <div className="relative size-16 bg-gradient-to-br from-[#00C9A7] to-[#00A88C] rounded-2xl flex items-center justify-center text-white shadow-2xl transition-all duration-500 hover:scale-110 hover:rotate-6">
          <SparklesIcon className="size-8" />
        </div>
      </button>

      {/* AI 사이드바 */}
      <AnimatePresence>
        {isAiAssistantOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAiAssistantOpen(false)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[70]" />
            <motion.div initial={{ x: "100%" }} animate={{ x: 0 }} exit={{ x: "100%" }} transition={{ type: "spring", damping: 25, stiffness: 200 }} className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-[-20px_0_60px_rgba(0,0,0,0.1)] z-[80] flex flex-col">
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 bg-[#00C9A7] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#00C9A7]/20"><SparklesIcon className="size-6" /></div>
                  <div><h2 className="text-lg font-bold text-[#0F0F0F]">AI 탐색 어시스턴트</h2><p className="text-[10px] text-[#00C9A7] font-bold uppercase tracking-wider">Beta Version</p></div>
                </div>
                <button onClick={() => setIsAiAssistantOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors"><X className="size-6 text-gray-400" /></button>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
                {aiMessages.map((msg, idx) => (
                  <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${msg.role === "user" ? "bg-[#0F0F0F] text-white shadow-lg" : "bg-gray-100 text-gray-700 shadow-sm"}`}>
                      {msg.content}
                      {msg.role === "ai" && (msg.category || (msg.keywords && msg.keywords.length > 0)) && (
                        <div className="mt-4 flex flex-wrap gap-2 pt-4 border-t border-gray-200/50">
                          {msg.category && <span className="px-2 py-1 bg-[#00C9A7]/10 text-[#00C9A7] text-[10px] font-bold rounded-lg border border-[#00C9A7]/20">{msg.category}</span>}
                          {msg.keywords?.map((k, i) => <span key={i} className="px-2 py-1 bg-white text-gray-500 text-[10px] font-bold rounded-lg border border-gray-200 shadow-sm">#{k}</span>)}
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
                <div ref={aiChatEndRef} />
              </div>
              <div className="p-6 border-t border-gray-100 bg-gray-50/50">
                <form onSubmit={handleAiSearch} className="relative">
                  <input value={aiInput} onChange={(e) => setAiInput(e.target.value)} placeholder="원하시는 스타일이나 키워드를 입력하세요..." className="w-full pl-5 pr-14 py-4 bg-white border border-gray-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]/50 shadow-sm transition-all" />
                  <button type="submit" disabled={!aiInput.trim() || aiLoading} className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-[#00C9A7] text-white rounded-xl shadow-lg shadow-[#00C9A7]/30 hover:scale-105 active:scale-95 transition-all disabled:opacity-50"><Send className="size-5" /></button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* 컬렉션 모달 (원본 디자인 복구) */}
      <AnimatePresence>
        {collectionModalProject && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => setCollectionModalProject(null)}>
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }} className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div><h3 className="font-bold text-lg text-[#0F0F0F]">컬렉션에 저장</h3><p className="text-xs text-gray-500 mt-0.5">{collectionModalProject.title}</p></div>
                <button onClick={() => setCollectionModalProject(null)} className="p-2 hover:bg-gray-100 rounded-full"><X className="size-5 text-gray-400" /></button>
              </div>
              <div className="p-5 space-y-2 max-h-[350px] overflow-y-auto">
                {collections.map(folder => (
                  <button key={folder.folderId} onClick={() => saveToCollection(folder.folderId)} className="w-full p-4 rounded-xl border border-gray-100 flex items-center justify-between hover:border-[#00C9A7] hover:bg-[#F2FFFC] transition-all group">
                    <span className="font-bold text-gray-700 group-hover:text-[#00C9A7]">{folder.folderName}</span>
                    {savedProjectIds.has(collectionModalProject.id) && <Check className="size-5 text-[#00C9A7]" />}
                  </button>
                ))}
              </div>
              <div className="p-5 border-t border-gray-100 bg-gray-50/50">
                <div className="flex gap-2">
                  <input value={newCollectionName} onChange={(e) => setNewCollectionName(e.target.value)} placeholder="새 컬렉션 이름..." className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]" />
                  <button onClick={createCollectionAndSave} className="px-5 py-3 bg-[#0F0F0F] text-white text-sm font-bold rounded-xl hover:bg-[#00C9A7] transition-all">생성</button>
                </div>
                {collectionNotice && <p className="text-xs text-center font-bold text-[#00C9A7] mt-3">{collectionNotice}</p>}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 피드 상세 모달 */}
      {selectedExploreFeed && (
        <FeedDetailModal
          selectedFeed={selectedExploreFeed}
          setSelectedFeed={setSelectedExploreFeed}
          commentFeedItems={commentFeedItems}
          setCommentFeedItems={setCommentFeedItems}
          modalImageIndex={modalImageIndex}
          setModalImageIndex={setModalImageIndex}
          moveModalCarousel={moveModalCarousel}
          toggleLike={toggleLike}
          handleShare={handleShare}
          openCollectionModal={openCollectionModal}
          handleProposalClick={handleProposalClick}
          startingProposalPostId={startingProposalPostId}
          commentText={commentText}
          setCommentText={setCommentText}
          handleSubmitComment={handleSubmitComment}
          handleCommentKeyDown={handleCommentKeyDown}
          isSubmittingComment={isSubmittingComment}
          selectedFeedComments={selectedFeedComments}
          editingCommentId={editingCommentId}
          editingCommentText={editingCommentText}
          setEditingCommentText={setEditingCommentText}
          startEditingComment={startEditingComment}
          cancelEditingComment={cancelEditingComment}
          handleUpdateComment={handleUpdateComment}
          handleDeleteComment={handleDeleteComment}
          toggleCommentLike={toggleCommentLike}
          isUpdatingComment={isUpdatingComment}
          isDeletingCommentId={isDeletingCommentId}
          isDetailLoading={isModalDetailLoading}
          onClose={() => setSelectedProjectForModal(null)}
        />
      )}

      <Footer />
    </div>
  );
}
