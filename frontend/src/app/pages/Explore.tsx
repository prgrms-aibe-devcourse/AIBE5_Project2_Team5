import Navigation from "../components/Navigation";
import { apiRequest } from "../api/apiClient";
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
} from "../api/exploreApi";
import { getMyCollectionsApi, saveFeedToCollectionApi, createCollectionFolderApi, CollectionFolderResponse } from "../api/collectionApi";
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

const AI_MOCK_RESPONSES: Record<string, { summary: string; designers: typeof creatorProfiles; tags: string[] }> = {
  default: {
    summary: "요청하신 키워드와 잘 맞는 디자이너와 작업 스타일을 정리해봤습니다.",
    designers: creatorProfiles.slice(0, 3),
    tags: ["브랜딩", "UI/UX", "포트폴리오"],
  },
  branding: {
    summary: "브랜드 아이덴티티와 비주얼 시스템을 잘 다루는 디자이너를 우선 추천합니다.",
    designers: creatorProfiles.filter((profile) => [1, 2, 5].includes(profile.id)),
    tags: ["브랜딩", "로고", "패키지"],
  },
  ui: {
    summary: "서비스 설계와 화면 구조에 강한 UI/UX 디자이너를 중심으로 묶었습니다.",
    designers: creatorProfiles.filter((profile) => [2, 3].includes(profile.id)),
    tags: ["UI", "UX", "프로토타입"],
  },
  photo: {
    summary: "비주얼 촬영과 룩북 스타일에 가까운 작업자를 우선 배치했습니다.",
    designers: creatorProfiles.filter((profile) => profile.category === "포토그래피"),
    tags: ["포토그래피", "룩북", "캠페인"],
  },
};
// 탐색 페이지 컬렉션 저장용 타입
type SavedCollection = CollectionFolderResponse;

const COLLECTION_KEY = "pickxel-explore-collections";

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
  const currentUserAvatar = getUserAvatar(
    currentUser?.profileImage,
    currentUser?.userId,
    currentUser?.nickname,
  );
  const currentUserName = currentUser?.nickname || currentUser?.name || "내 프로필";
  const categories = matchingCategories;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "profile">("feed");

  // 서버 데이터 상태
  const [feeds, setFeeds] = useState<ExplorePostResponseDto[]>([]);
  const [isFeedsLoading, setIsFeedsLoading] = useState(false);
  const [designers, setDesigners] = useState<ExploreDesignerResponseDto[]>([]);
  const [isDesignersLoading, setIsDesignersLoading] = useState(false);

  // 상호작용 상태
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  // 모달 상태
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<ExplorePostResponseDto | null>(null);
  const [selectedProjectDetail, setSelectedProjectDetail] = useState<ExploreFeedDetailResponseDto | null>(null);
  const [selectedExploreFeed, setSelectedExploreFeed] = useState<FeedCardItem | null>(null);
  const [commentFeedItems, setCommentFeedItems] = useState<FeedCardItem[]>([]);
  const [isModalDetailLoading, setIsModalDetailLoading] = useState(false);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [startingProposalPostId, setStartingProposalPostId] = useState<number | null>(null);

  const [collections, setCollections] = useState<SavedCollection[]>([]);
  const [collectionModalProject, setCollectionModalProject] = useState<ExplorePostResponseDto | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collectionNotice, setCollectionNotice] = useState("");
  const [isCollectionsLoading, setIsCollectionsLoading] = useState(false);

  // 컬렉션 목록 로드
  const loadCollections = useCallback(async () => {
    setIsCollectionsLoading(true);
    await fetchCollections(setCollections);
    setIsCollectionsLoading(false);
  }, []);

  // 초기 컬렉션 로드
  useEffect(() => {
    void loadCollections();
  }, [loadCollections]);

  // 저장 상태는 우선 프론트 로컬 상태로 관리
  const [savedProjectIds, setSavedProjectIds] = useState<Set<number>>(new Set());

  // AI 검색 상태
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<typeof AI_MOCK_RESPONSES["default"] | null>(null);
  const [aiTypedText, setAiTypedText] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
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
    setApiFeedItems: setCommentFeedItems,
    setSelectedFeed: setSelectedExploreFeed,
    toFeedCommentRole: toCommentAuthorRole,
  });

  // 피드 액션 헬퍼
  const toggleLike = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      const result = await apiRequest<{ postId: number; picked: boolean; pickCount: number }>(
        `/api/feeds/${id}/like`,
        { method: "POST" },
        "좋아요 처리에 실패했습니다.",
      );
      setFeeds((prev) =>
        prev.map((item) =>
          item.postId === result.postId ? { ...item, pickCount: result.pickCount } : item,
        ),
      );
      setLikedItems((prev) => {
        const newSet = new Set(prev);
        if (result.picked) newSet.add(result.postId);
        else newSet.delete(result.postId);
        return newSet;
      });
    } catch {
      // 실패 시 낙관적 업데이트 없이 무시
    }
  };

  const handleShare = (item: ExplorePostResponseDto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const copyToClipboard = () => {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => alert("공유 링크가 클립보드에 복사되었습니다."))
        .catch(() => alert("링크 복사에 실패했습니다."));
    };
    if (navigator.share) {
      navigator
        .share({ title: item.title, text: item.description || "", url: window.location.href })
        .catch(() => copyToClipboard());
    } else {
      copyToClipboard();
    }
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
      await saveFeedToCollectionApi(folderId, collectionModalProject.postId);
      setCollectionNotice("컬렉션에 저장되었습니다.");
      setSavedProjectIds(prev => new Set(prev).add(collectionModalProject.postId));
      void loadCollections();
      setTimeout(() => setCollectionModalProject(null), 1000);
    } catch (error) {
      setCollectionNotice("저장에 실패했습니다. 이미 저장된 항목일 수 있습니다.");
    }
  };

  const createCollectionAndSave = async () => {
    if (!newCollectionName.trim() || !collectionModalProject) return;
    
    try {
      const newFolder = await createCollectionFolderApi(newCollectionName.trim());
      if (newFolder && newFolder.folderId) {
        await saveToCollection(newFolder.folderId);
        setNewCollectionName("");
      }
    } catch (error) {
      setCollectionNotice("컬렉션 생성 또는 저장에 실패했습니다.");
    }
  };

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

    return () => {
      ignore = true;
    };
  }, [selectedProjectForModal?.postId]);

  const mappedSelectedExploreFeed = useMemo<FeedCardItem | null>(() => {
    if (!selectedProjectForModal) return null;

    const detail = selectedProjectDetail;
    const imageUrls =
      detail?.imageUrls?.filter(Boolean).length
        ? detail.imageUrls.filter(Boolean)
        : selectedProjectForModal.imageUrl
          ? [selectedProjectForModal.imageUrl]
          : [];
    const commentCount =
      selectedExploreFeed?.id === selectedProjectForModal.postId
        ? selectedExploreFeed.comments
        : detail?.commentCount ?? 0;

    return {
      id: selectedProjectForModal.postId,
      feedKey: selectedProjectForModal.postId,
      author: {
        userId: selectedProjectForModal.userId,
        name: detail?.nickname ?? selectedProjectForModal.nickname,
        role: detail?.job || selectedProjectForModal.job || "디자이너",
        avatar: getUserAvatar(
          detail?.profileImageUrl ?? selectedProjectForModal.profileImage,
          selectedProjectForModal.userId,
          selectedProjectForModal.nickname,
        ),
        profileKey: detail?.profileKey ?? String(selectedProjectForModal.userId),
      },
      title: detail?.title ?? selectedProjectForModal.title,
      description: detail?.description ?? selectedProjectForModal.description ?? "",
      image: imageUrls[0] ?? "",
      images: imageUrls,
      likes:
        (detail?.pickCount ?? selectedProjectForModal.pickCount) +
        (likedItems.has(selectedProjectForModal.postId) ? 1 : 0),
      comments: commentCount,
      tags: [
        normalizeCategoryLabel(detail?.category ?? selectedProjectForModal.category ?? ""),
        normalizePostTypeLabel(detail?.postType ?? "PORTFOLIO"),
      ].filter(
        Boolean,
      ) as string[],
      category: normalizeCategoryLabel(detail?.category ?? selectedProjectForModal.category ?? ""),
      integrations: detail?.portfolioUrl
        ? [{ provider: "figma", label: "Portfolio", url: detail.portfolioUrl }]
        : undefined,
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

    setSelectedExploreFeed((prev) =>
      prev && prev.id === mappedSelectedExploreFeed.id
        ? { ...mappedSelectedExploreFeed, comments: prev.comments }
        : mappedSelectedExploreFeed,
    );

    setCommentFeedItems((prev) => {
      const current = prev.find((item) => item.id === mappedSelectedExploreFeed.id);
      const nextItem =
        current && current.id === mappedSelectedExploreFeed.id
          ? { ...mappedSelectedExploreFeed, comments: current.comments }
          : mappedSelectedExploreFeed;

      return [nextItem];
    });
  }, [mappedSelectedExploreFeed]);

  const moveModalCarousel = (direction: -1 | 1, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const images = mappedSelectedExploreFeed?.images ?? [];
    if (images.length <= 1) return;
    setModalImageIndex(prev => (prev + direction + images.length) % images.length);
  };

  const handleProposalClick = async (item: ExplorePostResponseDto, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (startingProposalPostId !== null) return;

    if (!item.userId) {
      alert("상대방 정보를 찾을 수 없습니다.");
      return;
    }

    if (currentUser?.userId === item.userId) {
      alert("내 피드에는 제안을 보낼 수 없습니다.");
      return;
    }

    const now = Date.now();
    const proposalMessage = `안녕하세요. "${item.title}" 작업을 보고 프로젝트 제안을 드리고 싶어 연락드립니다. 작업 가능 여부와 일정, 견적을 함께 이야기해보고 싶습니다.`;

    setStartingProposalPostId(item.postId);
    try {
      const conversation = await createMessageConversationApi(item.userId);
      setSelectedProjectForModal(null);
      navigate(`/messages?conversationId=${conversation.id}`);
      void sendConversationMessageApi(conversation.id, {
        clientId: `explore-proposal-${item.postId}-${now}`,
        message: proposalMessage,
        attachments: item.imageUrl
          ? [
              {
                id: `explore-feed-${item.postId}`,
                type: "image",
                src: item.imageUrl,
                name: item.title,
                uploadStatus: "ready",
              },
            ]
          : [],
      }).catch((error) => {
        console.error("제안 메시지 자동 전송 실패:", error);
      });
    } catch (error) {
      alert(error instanceof Error ? error.message : "대화를 시작하지 못했습니다.");
    } finally {
      setStartingProposalPostId(null);
    }
  };

  // Lenis smooth scroll 설정
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.08, smoothWheel: true });
    
    const raf = (time: number) => { lenis.raf(time); requestAnimationFrame(raf); };
    requestAnimationFrame(raf);
    return () => lenis.destroy();
  }, []);


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

  const scrollCat = (dir: "left" | "right") => {
    catScrollRef.current?.scrollBy({ left: dir === "left" ? -200 : 200, behavior: "smooth" });
  };

  // 피드 목록 조회
  useEffect(() => {
    if (activeTab !== "feed") return;

    const fetchFeeds = async () => {
      try {
        setIsFeedsLoading(true);
        // 선택 카테고리가 없으면 all로 조회
        const data = await getExploreFeedsApi(selectedCategory || "all");
        setFeeds(data);
      } catch (error) {
        console.error("피드 로딩 중 오류:", error);
      } finally {
        setIsFeedsLoading(false);
      }
    };

    fetchFeeds();
  }, [selectedCategory, activeTab]);

  // 디자이너 목록 조회
  useEffect(() => {
    if (activeTab !== "profile") return;

    const fetchDesigners = async () => {
      try {
        setIsDesignersLoading(true);
        const data = await getExploreDesignersApi();
        setDesigners(data);
      } catch (error) {
        console.error("디자이너 로딩 중 오류:", error);
      } finally {
        setIsDesignersLoading(false);
      }
    };

    fetchDesigners();
  }, [activeTab]);

  const filteredProjects = useMemo(() => {
    // 검색어가 있으면 클라이언트에서 제목/닉네임 기준 필터링
    if (!searchQuery.trim()) return feeds;
    
    return feeds.filter((p) => {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.nickname.toLowerCase().includes(q);
    });
  }, [feeds, searchQuery]);

  const filteredDesigners = useMemo(() => {
    if (!searchQuery.trim()) return designers;
    const q = searchQuery.toLowerCase();
    return designers.filter(
      (d) => 
        d.nickname.toLowerCase().includes(q) || 
        (d.job && d.job.toLowerCase().includes(q))
    );
  }, [designers, searchQuery]);

  // AI 검색 실행
  const runAiSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    setAiTypedText("");
      // mock 응답 딜레이
    setTimeout(() => {
      const mock = AI_MOCK_RESPONSES.default;
      setAiResult(mock);
      setAiLoading(false);
      // 타이핑 애니메이션
      let i = 0;
      const txt = mock.summary;
      const interval = setInterval(() => {
        i++;
        setAiTypedText(txt.slice(0, i));
        if (i >= txt.length) clearInterval(interval);
      }, 25);
    }, 1200);
  }, [searchQuery]);

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && aiMode) {
      e.preventDefault();
      runAiSearch();
    }
  };

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
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => { setSearchQuery(e.target.value); if (aiResult) setAiResult(null); }}
                onKeyDown={handleSearchKeyDown}
                placeholder={aiMode ? "어떤 디자이너를 찾고 계세요? AI가 추천해드릴게요..." : "pickxel에서 검색..."}
                className="w-full h-10 pl-10 pr-4 bg-transparent text-sm text-[#0F0F0F] placeholder:text-gray-400 focus:outline-none rounded-xl"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setAiResult(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200/60 rounded-full transition-colors">
                  <X className="size-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* AI 버튼 */}
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => { setAiMode(!aiMode); setAiResult(null); }}
              className={`flex items-center gap-1.5 h-10 px-4 rounded-xl text-sm font-semibold transition-all shrink-0 ${
                aiMode
                  ? "bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white shadow-lg shadow-[#00C9A7]/20"
                  : "bg-white border border-gray-200/80 shadow-sm text-gray-600 hover:bg-gray-50 hover:text-[#00A88C]"
              }`}
            >
              <Sparkles className="size-3.5" />
              AI
            </motion.button>

            <div className="w-px h-6 bg-gray-200 shrink-0" />

            {/* 탭 전환 */}
            <div className="flex rounded-lg bg-white border border-gray-200/80 shadow-sm p-0.5 shrink-0">
              <button
                onClick={() => setActiveTab("feed")}
                className={`flex items-center gap-1.5 px-3.5 h-9 rounded-md text-sm font-medium transition-all ${
                  activeTab === "feed" ? "bg-[#00C9A7] text-white shadow-md shadow-[#00C9A7]/20" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <LayoutGrid className="size-3.5" />
                <span>피드</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-1.5 px-3.5 h-9 rounded-md text-sm font-medium transition-all ${
                  activeTab === "profile" ? "bg-[#00C9A7] text-white shadow-md shadow-[#00C9A7]/20" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <Users className="size-3.5" />
                <span>프로필</span>
              </button>
            </div>
          </div>

          {/* AI 결과 패널 */}
          <AnimatePresence>
            {aiMode && (aiLoading || aiResult) && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="mt-3 p-5 bg-gradient-to-br from-white to-[#F0FDF9] rounded-2xl border border-[#00C9A7]/15 shadow-lg">
                  {aiLoading ? (
                    <div className="flex items-center gap-3">
                      <div className="relative size-8">
                        <div className="absolute inset-0 rounded-full border-2 border-[#00C9A7]/30 border-t-[#00C9A7] animate-spin" />
                        <Sparkles className="absolute inset-1.5 size-5 text-[#00C9A7]" />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#0F0F0F]">AI가 분석 중이에요...</p>
                        <p className="text-xs text-gray-400">조건에 맞는 디자이너를 찾고 있습니다.</p>
                      </div>
                    </div>
                  ) : aiResult && (
                    <div>
                      <div className="flex items-start gap-2.5 mb-4">
                        <div className="size-7 rounded-full bg-gradient-to-br from-[#00C9A7] to-[#00A88C] flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                          <Sparkles className="size-3.5 text-white" />
                        </div>
                        <p className="text-sm text-gray-700 leading-relaxed">{aiTypedText}<span className="animate-pulse text-[#00C9A7]">|</span></p>
                      </div>
                      <div className="grid grid-cols-3 gap-3 mb-4">
                        {aiResult.designers.map((d) => (
                          <Link key={d.id} to={`/profile/${d.name}`} className="flex items-center gap-3 p-3 rounded-xl bg-white hover:bg-[#00C9A7]/5 border border-gray-100 hover:border-[#00C9A7]/30 transition-all group/ai shadow-sm">
                            <ImageWithFallback src={d.avatar} alt={d.name} className="size-10 rounded-full ring-2 ring-white shadow-sm" />
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-[#0F0F0F] group-hover/ai:text-[#00A88C] transition-colors truncate">{d.name}</p>
                              <p className="text-xs text-gray-500 truncate">{d.role}</p>
                            </div>
                          </Link>
                        ))}
                      </div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] text-gray-400 font-medium">추천 카테고리</span>
                        {aiResult.tags.map((t) => (
                          <button key={t} onClick={() => { setSelectedCategory(t); setAiResult(null); setAiMode(false); }} className="text-xs px-2.5 py-1 rounded-full bg-[#00C9A7]/10 text-[#00A88C] font-medium hover:bg-[#00C9A7]/20 transition-colors">
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          </div>
        </div>
      </section>

      {/* 탐색 카테고리 필터 */}
      {activeTab === "feed" && (
        <section className="bg-transparent pb-3">
          <div className="max-w-[1800px] mx-auto px-5 relative">
            {/* 왼쪽 스크롤 버튼 */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
                <div className="w-20 h-full bg-gradient-to-r from-[#F7F7F5] via-[#F7F7F5]/80 to-transparent pointer-events-none absolute left-0" />
                <button onClick={() => scrollCat("left")} className="relative z-10 ml-2 size-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-700 transition-all">
                  <ChevronLeft className="size-4" />
                </button>
              </div>
            )}
            {/* 오른쪽 스크롤 버튼 */}
            {canScrollRight && (
              <div className="absolute right-0 top-0 bottom-0 z-10 flex items-center">
                <div className="w-20 h-full bg-gradient-to-l from-[#F7F7F5] via-[#F7F7F5]/80 to-transparent pointer-events-none absolute right-0" />
                <button onClick={() => scrollCat("right")} className="relative z-10 mr-2 ml-auto size-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-700 transition-all">
                  <ChevronRight className="size-4" />
                </button>
              </div>
            )}
            <LayoutGroup>
            <div
              ref={catScrollRef}
              data-cat-scroll
              className="flex items-center gap-2 py-4 px-1 overflow-x-auto [&::-webkit-scrollbar]:hidden"
              style={{ scrollbarWidth: "none" }}
            >
              {/* 전체 버튼 */}
              <button
                onClick={() => setSelectedCategory(null)}
                className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors duration-200 z-[1] ${
                  !selectedCategory ? "text-white" : "text-gray-600 bg-white border border-gray-200/80 shadow-sm hover:bg-gray-50"
                }`}
              >
                {!selectedCategory && (
                  <motion.div
                    layoutId="catIndicator"
                    className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#FF5C3A] to-[#00C9A7] shadow-lg shadow-[#FF5C3A]/20"
                    transition={{ type: "spring", stiffness: 350, damping: 30 }}
                  />
                )}
                <span className="relative z-[1]">전체</span>
              </button>
              {categories.map((cat) => {
                const Icon = CATEGORY_ICONS[cat] || Palette;
                const isActive = selectedCategory === cat;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(isActive ? null : cat)}
                    className={`relative flex items-center gap-2 px-5 py-2.5 rounded-lg text-[13px] font-semibold whitespace-nowrap shrink-0 transition-colors duration-200 z-[1] ${
                      isActive ? "text-white" : "text-gray-600 bg-white border border-gray-200/80 shadow-sm hover:bg-gray-50"
                    }`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="catIndicator"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-[#FF5C3A] to-[#00C9A7] shadow-lg shadow-[#FF5C3A]/20"
                        transition={{ type: "spring", stiffness: 350, damping: 30 }}
                      />
                    )}
                    <Icon className="relative z-[1] size-4" />
                    <span className="relative z-[1]">{cat}</span>
                  </button>
                );
              })}
            </div>
            </LayoutGroup>
          </div>
        </section>
      )}

      {/* 탐색 메인 콘텐츠 */}
      <div className="flex-1">
        {/* 피드 카드 그리드 */}
        {activeTab === "feed" && (
          <section className="max-w-[1800px] mx-auto px-5 pt-1 pb-16">
            {isFeedsLoading ? (
              // 로딩 스피너
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C9A7]"></div>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.postId}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: (index % 4) * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="group cursor-pointer pb-2"
                    onClick={() => setSelectedProjectForModal(project)}
                  >
                    <div className="relative rounded-2xl overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 transition-all duration-500 ease-out">
                      {/* 이미지 영역 */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <ImageWithFallback
                          src={project.imageUrl || ""}
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-700 ease-out"
                        />
                        {/* hover 오버레이 */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 pointer-events-none" />

                        {/* 저장 버튼 */}
                        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-300 z-10">
                          <button
                            onClick={(e) => { e.stopPropagation(); openCollectionModal(project, e); }}
                            className={`flex items-center gap-1.5 h-8 px-3.5 rounded-full text-xs font-semibold shadow-lg cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 ${
                              savedProjectIds.has(project.postId)
                                ? "bg-[#00C9A7] text-white shadow-[#00C9A7]/30 hover:bg-[#00b89a]"
                                : "bg-black/60 backdrop-blur-xl text-white hover:bg-black/80 border border-white/15"
                            }`}
                            title="컬렉션에 저장"
                          >
                            <Bookmark className={`size-3.5 ${savedProjectIds.has(project.postId) ? "fill-white" : ""}`} />
                            {savedProjectIds.has(project.postId) ? "저장됨" : "저장"}
                          </button>
                        </div>

                        {/* 하단 정보 오버레이 */}
                        <div className="absolute inset-x-0 bottom-0 flex flex-col justify-end p-4">
                          <div className="translate-y-3 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-400 delay-75">
                            <div className="flex items-end justify-between">
                              <div className="min-w-0 flex-1">
                                <p className="text-white font-bold text-[15px] leading-tight mb-1 truncate" style={{ textShadow: "0 1px 8px rgba(0,0,0,0.5)" }}>{project.title}</p>
                                <p className="text-white/80 text-sm" style={{ textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}>{project.nickname}</p>
                              </div>
                              <div className="flex gap-1.5 shrink-0 ml-3">
                                <span className="flex items-center gap-1 bg-black/40 backdrop-blur-xl text-white text-[11px] px-2.5 py-1 rounded-full font-medium">
                                  <Heart className="size-3 fill-white" />{project.pickCount}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      {/* 카드 하단 정보 */}
                      <div className="px-4 py-3.5">
                        <div className="flex items-center justify-between gap-2">
                          <div className="min-w-0">
                            <h3 className="font-semibold text-sm text-[#0F0F0F] truncate group-hover:text-[#00A88C] transition-colors duration-300">{project.title}</h3>
                            <p className="text-xs text-gray-400 mt-1">{project.nickname}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-5 animate-pulse">
                  <ImageOff className="size-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  {selectedCategory ? `"${selectedCategory}" 카테고리의 작품이 없습니다` : searchQuery ? `"${searchQuery}" 검색 결과가 없습니다` : "표시할 작품이 없습니다"}
                </h3>
                <p className="text-sm text-gray-400 mb-5">다른 카테고리를 선택하거나 검색어를 변경해보세요.</p>
                {(selectedCategory || searchQuery) && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setSelectedCategory(null); setSearchQuery(""); }} className="px-6 py-2.5 rounded-lg bg-[#0F0F0F] text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                    필터 초기화
                  </motion.button>
                )}
              </div>
            )}
          </section>
        )}

        {/* 디자이너 목록 */}
        {activeTab === "profile" && (
          <section className="max-w-[1800px] mx-auto px-5 py-6">
            <div className="mb-5 flex items-center gap-2">
              <Users className="size-4 text-[#00C9A7]" />
              <span className="text-sm font-semibold text-[#374151]">디자이너 {filteredDesigners.length}명</span>
              {searchQuery && <span className="text-sm text-gray-400">검색어 "{searchQuery}"</span>}
            </div>
            {isDesignersLoading ? (
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C9A7]"></div>
              </div>
            ) : filteredDesigners.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredDesigners.map((profile, index) => (
                  <motion.div
                    key={profile.userId}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: (index % 4) * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="group pb-2"
                  >
                    <Link to={`/profile/${profile.nickname}`} className="flex h-[156px] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] group-hover:border-[#00C9A7]/40 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] group-hover:-translate-y-1 transition-all duration-500">
                      {/* 왼쪽 배너 */}
                      <div className="w-32 shrink-0 relative overflow-hidden">
                        <ImageWithFallback
                          src={profile.bannerImage || "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400"}
                          alt={profile.nickname}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                      </div>
                      {/* 오른쪽 정보 */}
                      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <ImageWithFallback src={getUserAvatar(profile.profileImage)} alt={profile.nickname} className="size-9 rounded-full ring-2 ring-[#00C9A7]/15 shadow-sm shrink-0" />
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-[#0F0F0F] group-hover:text-[#00A88C] transition-colors truncate leading-tight">{profile.nickname}</h3>
                              <p className="text-[11px] text-gray-500 truncate">{profile.job}</p>
                            </div>
                          </div>
                          <span className="inline-block text-[10px] font-semibold bg-[#A8F0E4]/25 text-[#00A88C] px-2 py-0.5 rounded-full mb-1.5">{profile.job || "디자이너"}</span>
                          <p className="text-[11px] text-gray-400 line-clamp-1 leading-relaxed">{profile.introduction || "멋진 작업을 만드는 디자이너입니다."}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-gray-50 text-[10px]">
                          <span className="text-gray-500"><strong className="text-[#0F0F0F] text-xs">{profile.followCount}</strong> 팔로우</span>
                          <span className="text-gray-500"><strong className="text-[#0F0F0F] text-xs">{profile.postCount}</strong> 작품</span>
                          <ArrowRight className="ml-auto size-3 text-gray-300 group-hover:text-[#00A88C] transition-colors" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-5 animate-pulse">
                  <UserSearch className="size-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  {searchQuery ? `"${searchQuery}"에 해당하는 디자이너가 없습니다` : "디자이너를 찾을 수 없습니다"}
                </h3>
                <p className="text-sm text-gray-400 mb-5">다른 이름이나 분야로 검색해보세요.</p>
                {searchQuery && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => setSearchQuery("")} className="px-6 py-2.5 rounded-lg bg-[#0F0F0F] text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                    검색 초기화
                  </motion.button>
                )}
              </div>
            )}
          </section>
        )}
      </div>


      {selectedProjectForModal && mappedSelectedExploreFeed && (
        <FeedDetailModal
          selectedFeed={mappedSelectedExploreFeed}
          activeModalImage={
            (mappedSelectedExploreFeed.images ?? [mappedSelectedExploreFeed.image])[modalImageIndex] ??
            mappedSelectedExploreFeed.image
          }
          selectedFeedImages={mappedSelectedExploreFeed.images ?? [mappedSelectedExploreFeed.image]}
          modalImageIndex={modalImageIndex}
          savedItemIds={savedProjectIds}
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
          formatFeedDateTime={(value?: string) => {
            if (!value) return null;
            const parsedDate = new Date(value);
            if (Number.isNaN(parsedDate.getTime())) return null;
            return parsedDate.toLocaleString("ko-KR", {
              year: "numeric",
              month: "2-digit",
              day: "2-digit",
              hour: "2-digit",
              minute: "2-digit",
            });
          }}
          isFeedLiked={() => likedItems.has(selectedProjectForModal.postId)}
          getLikeCount={() => mappedSelectedExploreFeed.likes}
          getCommentCount={() => selectedExploreFeed?.comments ?? selectedFeedComments.length}
          onClose={() => {
            setSelectedProjectForModal(null);
            setSelectedProjectDetail(null);
            setSelectedExploreFeed(null);
            setCommentFeedItems([]);
            setModalImageIndex(0);
          }}
          onMoveModalCarousel={moveModalCarousel}
          onSetModalImageIndex={(index, e) => {
            e.stopPropagation();
            setModalImageIndex(index);
          }}
          onToggleLike={(_, e) => toggleLike(selectedProjectForModal.postId, e)}
          onOpenCollectionModal={(_, e) => openCollectionModal(selectedProjectForModal, e)}
          onShare={(_, e) => handleShare(selectedProjectForModal, e)}
          onProposalClick={(_, e) => handleProposalClick(selectedProjectForModal, e)}
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

      {/* Floating Action Button */}
      <motion.div whileHover={{ scale: 1.1, rotate: 45 }} whileTap={{ scale: 0.9 }} className="fixed bottom-8 right-8 z-40">
        <Link to="/projects/new" className="bg-gradient-to-br from-[#00C9A7] to-[#00A88C] text-white size-14 rounded-full shadow-xl flex items-center justify-center ring-4 ring-white">
          <Plus className="size-6" />
        </Link>
      </motion.div>

      {/* 컬렉션 저장 모달 */}
      <AnimatePresence>
        {collectionModalProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setCollectionModalProject(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-5 border-b border-gray-100 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-[#0F0F0F]">컬렉션에 저장</h3>
                  <p className="text-xs text-gray-500 mt-0.5 truncate max-w-[280px]">{collectionModalProject.title}</p>
                </div>
                <button onClick={() => setCollectionModalProject(null)} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="size-5 text-gray-400" />
                </button>
              </div>

              <div className="p-5 space-y-2 max-h-[400px] overflow-y-auto">
                {collections.map((col) => {
                  const isSaved = savedProjectIds.has(collectionModalProject.postId);

                  return (
                    <button
                      key={col.folderId}
                      onClick={() => saveToCollection(col.folderId)}
                      className={`w-full p-3 rounded-lg border flex items-center justify-between gap-3 text-left transition-all ${
                        isSaved ? "bg-[#E7FAF6] border-[#00C9A7] text-[#007D69]" : "bg-white border-gray-200 hover:border-[#00C9A7] hover:bg-[#F2FFFC]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`size-11 rounded-lg flex items-center justify-center shrink-0 ${isSaved ? "bg-[#00C9A7] text-white" : "bg-[#F7F7F5] text-[#00A88C]"}`}>
                          {isSaved ? <Check className="size-5" /> : <Bookmark className="size-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{col.folderName}</p>
                          <p className="text-xs text-gray-500">{col.itemCount}개 저장됨</p>
                        </div>
                      </div>
                      {isSaved && <span className="text-xs font-bold text-[#00A88C] shrink-0">저장됨</span>}
                    </button>
                  );
                })}
              </div>

              <div className="p-5 border-t border-gray-100">
                <label className="text-sm font-bold text-[#0F0F0F] mb-2 block">새 컬렉션 만들기</label>
                <form 
                  onSubmit={(e) => { e.preventDefault(); createCollectionAndSave(); }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    placeholder="예: 메인 페이지 레퍼런스"
                    className="flex-1 px-3 py-2.5 rounded-lg bg-[#F7F7F5] border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                  />
                  <button
                    type="submit"
                    disabled={!newCollectionName.trim()}
                    className="px-4 py-2.5 bg-[#0F0F0F] text-white rounded-lg text-sm font-bold hover:bg-[#00A88C] disabled:opacity-30 transition-all flex items-center gap-2"
                  >
                    <FolderPlus className="size-4" />
                    만들기
                  </button>
                </form>
                {collectionNotice && (
                  <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-center text-sm font-semibold text-[#00C9A7] mt-4 bg-[#E7FAF6] py-2 rounded-lg">
                    {collectionNotice}
                  </motion.p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
    </div>
  );
}
