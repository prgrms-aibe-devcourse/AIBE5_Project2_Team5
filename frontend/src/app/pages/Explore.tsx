import Navigation from "../components/Navigation";
import { apiRequest } from "../api/apiClient";
import {
  Search, Sparkles, Heart, Users, UserSearch, ImageOff,
  Palette, Camera, Box, Monitor,
  ArrowRight, X, Bookmark, MessageCircle, Send,
  ArrowUpDown,
  Brush,
  Building2,
  Check,
  Clock,
  FolderPlus,
  Gamepad2,
  LayoutGrid,
  Megaphone,
  Music,
  Package,
  PenTool,
  Scissors,
  Shirt,
  Star,
  TrendingUp,
  type LucideIcon
} from "lucide-react";
import { useMemo, useState, useEffect, useRef, useCallback, JSX } from "react";
import { Link, useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { FeedDetailModal } from "../components/feed/FeedDetailModal";
import { useFeedComments } from "../hooks/useFeedComments";
import { useFeedCollections } from "../hooks/useFeedCollections";
import { matchingCategories } from "../utils/matchingCategories";
import {
  getExploreFeedsApi,
  getExploreDesignersApi,
  type ExploreDesignerResponseDto,
} from "../api/exploreApi";
import { useFeedDetail } from "../hooks/useFeedDetail";
import { toggleFeedPickApi } from "../api/feedApi";
import type { CollectionFolderResponse } from "../api/collectionApi";
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

// 카테고리 카드 버튼용 배경 이미지 (Unsplash CDN, 작은 사이즈로 최적화)
const CATEGORY_IMAGES: Record<string, string> = {
  "그래픽 디자인": "https://images.unsplash.com/photo-1561070791-2526d30994b8?w=240&q=70&auto=format&fit=crop",
  "포토그래피": "https://images.unsplash.com/photo-1502920917128-1aa500764cbd?w=240&q=70&auto=format&fit=crop",
  "일러스트레이션": "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=240&q=70&auto=format&fit=crop",
  "3D Art": "https://images.unsplash.com/photo-1633957897986-70e83293f3ff?w=240&q=70&auto=format&fit=crop",
  "UI/UX": "https://images.unsplash.com/photo-1551650975-87deedd944c3?w=240&q=70&auto=format&fit=crop",
  "건축": "https://images.unsplash.com/photo-1487958449943-2429e8be8625?w=240&q=70&auto=format&fit=crop",
  "패션": "https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=240&q=70&auto=format&fit=crop",
  "광고": "https://images.unsplash.com/photo-1567446537708-ac4aa75c9c28?w=240&q=70&auto=format&fit=crop",
  "공예": "https://images.unsplash.com/photo-1452860606245-08befc0ff44b?w=240&q=70&auto=format&fit=crop",
  "미술": "https://images.unsplash.com/photo-1547891654-e66ed7ebb968?w=240&q=70&auto=format&fit=crop",
  "제품 디자인": "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=240&q=70&auto=format&fit=crop",
  "게임 디자인": "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=240&q=70&auto=format&fit=crop",
  "사운드": "https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=240&q=70&auto=format&fit=crop",
};

const CATEGORY_ICONS: Record<string, LucideIcon> = {
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
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "profile">("feed");
  // ?뺣젹 ?곹깭: 異붿쿇(?쒕쾭 湲곕낯) | 理쒖떊(id ?대┝李⑥닚) | ?멸린(醫뗭븘???대┝李⑥닚)
  const [sortBy, setSortBy] = useState<"recommended" | "latest" | "popular">("recommended");
  const [isSortOpen, setIsSortOpen] = useState(false);

  // ?쒕쾭 ?곗씠???곹깭
  const [feeds, setFeeds] = useState<FeedCardItem[]>([]);
  const [isFeedsLoading, setIsFeedsLoading] = useState(true);
  const [designers, setDesigners] = useState<ExploreDesignerResponseDto[]>([]);
  const [isDesignersLoading, setIsDesignersLoading] = useState(false);

  // ?섏씠吏??곹깭
  const [feedPage, setFeedPage] = useState(0);
  const [hasMoreFeeds, setHasMoreFeeds] = useState(true);
  const [isFetchingMoreFeeds, setIsFetchingMoreFeeds] = useState(false);
  const [designerPage, setDesignerPage] = useState(0);
  const [hasMoreDesigners, setHasMoreDesigners] = useState(true);
  const [isFetchingMoreDesigners, setIsFetchingMoreDesigners] = useState(false);

  const observerRef = useRef<HTMLDivElement>(null);

  // ?곹샇?묒슜 ?곹깭
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const commentInputRef = useRef<HTMLInputElement | null>(null);

  // 紐⑤떖 ?곹깭
  const [selectedExploreFeed, setSelectedExploreFeed] = useState<FeedCardItem | null>(null);
  const [commentFeedItems, setCommentFeedItems] = useState<FeedCardItem[]>([]);
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [startingProposalPostId, setStartingProposalPostId] = useState<number | null>(null);



  const {
    collections,
    collectionPostIdsByFolder,
    collectionModalFeed: collectionModalProject,
    newCollectionName,
    collectionSavedNotice: collectionNotice,
    isCollectionSaving,
    savedItemIds: savedProjectIds,
    setNewCollectionName,
    openCollectionModal,
    closeCollectionModal,
    saveToCollection,
    createCollectionAndSave,
  } = useFeedCollections<FeedCardItem>();

  // 寃?됱뼱 ?붾컮?댁뒪 泥섎━
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchRef = useRef<HTMLInputElement>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

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

  // useFeedDetail ???곸슜 (?쇰뱶 ?섏씠吏? ?숈씪???곸꽭 濡쒕뵫 濡쒖쭅)
  const { isLoading: isFeedDetailLoading } = useFeedDetail({
    selectedFeed: selectedExploreFeed,
    setApiFeedItems: setFeeds as React.Dispatch<React.SetStateAction<FeedCardItem[]>>,
    setSelectedFeed: setSelectedExploreFeed,
  });

  const openFeedDetail = (project: FeedCardItem) => {
    setSelectedExploreFeed(project);
    setModalImageIndex(0);
  };

  // ?쇰뱶 ?≪뀡 ?ы띁
  const toggleLike = async (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    try {
      // ?쒕쾭??醫뗭븘???붿껌 ?꾩넚
      const response = await toggleFeedPickApi(id);

      // 1. ?섑듃 ?쒖꽦???곹깭 ?낅뜲?댄듃 (Set)
      setLikedItems(prev => {
        const newSet = new Set(prev);
        if (response.picked) newSet.add(id);
        else newSet.delete(id);
        return newSet;
      });

      // 2. ?쇰뱶 紐⑸줉(feeds) ?곗씠?곗쓽 醫뗭븘?????숆린??
      setFeeds(prevFeeds =>
        prevFeeds.map(feed =>
          feed.id === id
            ? { ...feed, likes: response.pickCount, likedByMe: response.picked }
            : feed
        )
      );

      // 3. 留뚯빟 ?곸꽭 紐⑤떖???대젮?덈떎硫??곸꽭 ?곗씠?곕룄 ?숆린??
      if (selectedExploreFeed && selectedExploreFeed.id === id) {
        setSelectedExploreFeed(prev =>
          prev ? { ...prev, likes: response.pickCount, likedByMe: response.picked } : null
        );
      }
    } catch (error) {
      console.error("醫뗭븘??泥섎━ 以??ㅻ쪟 諛쒖깮:", error);
      alert("醫뗭븘??泥섎━???ㅽ뙣?덉뒿?덈떎. ?ㅼ떆 ?쒕룄?댁＜?몄슂.");
    }
  };

  const handleShare = (item: FeedCardItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const copyToClipboard = () => {
      navigator.clipboard
        .writeText(window.location.href)
        .then(() => alert("怨듭쑀 留곹겕媛 ?대┰蹂대뱶??蹂듭궗?섏뿀?듬땲??"))
        .catch(() => alert("留곹겕 蹂듭궗???ㅽ뙣?덉뒿?덈떎."));
    };
    if (navigator.share) {
      navigator
        .share({ title: item.title, text: item.description || "", url: window.location.href })
        .catch(() => copyToClipboard());
    } else {
      copyToClipboard();
    }
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

    if (!item.author?.userId) {
      alert("?곷?諛??뺣낫瑜?李얠쓣 ???놁뒿?덈떎.");
      return;
    }

    if (currentUser?.userId === item.author.userId) {
      alert("???쇰뱶?먮뒗 ?쒖븞??蹂대궪 ???놁뒿?덈떎.");
      return;
    }

    const now = Date.now();
    const proposalMessage = `?덈뀞?섏꽭?? "${item.title}" ?묒뾽??蹂닿퀬 ?꾨줈?앺듃 ?쒖븞???쒕━怨??띠뼱 ?곕씫?쒕┰?덈떎. ?묒뾽 媛???щ?? ?쇱젙, 寃ъ쟻???④퍡 ?댁빞湲고빐蹂닿퀬 ?띠뒿?덈떎.`;

    setStartingProposalPostId(item.id);
    try {
      const conversation = await createMessageConversationApi(item.author.userId);
      await sendConversationMessageApi(conversation.id, {
        clientId: `explore-proposal-${item.id}-${now}`,
        message: proposalMessage,
        attachments: item.image
          ? [
              {
                id: `explore-feed-${item.id}`,
                type: "image",
                src: item.image,
                name: item.title,
                uploadStatus: "ready",
              },
            ]
          : [],
      });

      navigate(`/messages?conversationId=${conversation.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "??붾? ?쒖옉?섏? 紐삵뻽?듬땲??");
    } finally {
      setStartingProposalPostId(null);
    }
  };

  // Lenis smooth scroll ?ㅼ젙
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
    const el = catScrollRef.current;
    if (!el) return;
    // 媛???곸뿭??80% ?뺣룄??遺?쒕읇寃??대룞
    const amount = Math.max(240, el.clientWidth * 0.8);
    el.scrollBy({ left: dir === "left" ? -amount : amount, behavior: "smooth" });
  };

  // ?섏쭅 ?????섑룊 ?ㅽ겕濡?蹂??(移댄뀒怨좊━ ?됱슜)
  const handleCatWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      const el = catScrollRef.current;
      if (el) {
        el.scrollLeft += e.deltaY;
      }
    }
  };

  // ?덉씠??而⑤뵒??諛⑹?瑜??꾪븳 ?붿껌 ID 愿由?
  const lastFeedsRequestId = useRef(0);
  const lastDesignersRequestId = useRef(0);

  // ?쇰뱶 紐⑸줉 議고쉶 (珥덇린??諛?臾댄븳 ?ㅽ겕濡?蹂묓빀)
  const fetchFeeds = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    const requestId = ++lastFeedsRequestId.current;
    try {
      if (isInitial) setIsFeedsLoading(true);
      else setIsFetchingMoreFeeds(true);

      const data = await getExploreFeedsApi(selectedCategory || "all", debouncedSearchQuery, pageNum, 20);
      
      // 理쒖떊 ?붿껌???꾨땲硫??곹깭 ?낅뜲?댄듃 臾댁떆
      if (requestId !== lastFeedsRequestId.current) return;

      const mappedFeeds: FeedCardItem[] = data.map(item => ({
        id: item.postId,
        feedKey: item.postId,
        author: {
          userId: item.userId,
          name: item.nickname,
          role: item.job || "?붿옄?대꼫",
          avatar: getUserAvatar(item.profileImage, item.userId, item.nickname),
          profileKey: String(item.userId),
        },
        title: item.title,
        description: item.description || "",
        image: item.imageUrl || "",
        images: item.imageUrl ? [item.imageUrl] : [],
        likes: item.pickCount,
        comments: item.commentCount ?? 0,
        tags: [item.category].filter(Boolean) as string[],
        category: item.category || undefined,
        likedByMe: item.picked,
        isApiFeed: true
      }));

      if (isInitial) {
        setFeeds(mappedFeeds);
        const initiallyLiked = new Set<number>();
        data.forEach(feed => { if (feed.picked) initiallyLiked.add(feed.postId); });
        setLikedItems(initiallyLiked);
      } else {
        setFeeds(prev => [...prev, ...mappedFeeds]);
        setLikedItems(prev => {
          const newSet = new Set(prev);
          data.forEach(feed => { if (feed.picked) newSet.add(feed.postId); });
          return newSet;
        });
      }

      setHasMoreFeeds(data.length === 20);
    } catch (error) {
      if (requestId === lastFeedsRequestId.current) {
        console.error("?쇰뱶 濡쒕뵫 以??ㅻ쪟:", error);
      }
    } finally {
      if (requestId === lastFeedsRequestId.current) {
        setIsFeedsLoading(false);
        setIsFetchingMoreFeeds(false);
      }
    }
  }, [selectedCategory, debouncedSearchQuery]);

  // ?붿옄?대꼫 紐⑸줉 議고쉶
  const fetchDesigners = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    const requestId = ++lastDesignersRequestId.current;
    try {
      if (isInitial) setIsDesignersLoading(true);
      else setIsFetchingMoreDesigners(true);

      const data = await getExploreDesignersApi(debouncedSearchQuery, pageNum, 20);
      
      // 理쒖떊 ?붿껌???꾨땲硫??곹깭 ?낅뜲?댄듃 臾댁떆
      if (requestId !== lastDesignersRequestId.current) return;

      if (isInitial) {
        setDesigners(data);
      } else {
        setDesigners(prev => [...prev, ...data]);
      }

      setHasMoreDesigners(data.length === 20);
    } catch (error) {
      if (requestId === lastDesignersRequestId.current) {
        console.error("?붿옄?대꼫 濡쒕뵫 以??ㅻ쪟:", error);
      }
    } finally {
      if (requestId === lastDesignersRequestId.current) {
        setIsDesignersLoading(false);
        setIsFetchingMoreDesigners(false);
      }
    }
  }, [debouncedSearchQuery]);

  // 寃??議곌굔 蹂寃???珥덇린??諛?泥??섏씠吏 濡쒕뱶
  useEffect(() => {
    setFeedPage(0);
    setDesignerPage(0);
    setHasMoreFeeds(true);
    setHasMoreDesigners(true);

    if (activeTab === "feed") {
      fetchFeeds(0, true);
    } else {
      fetchDesigners(0, true);
    }
  }, [selectedCategory, debouncedSearchQuery, activeTab, fetchFeeds, fetchDesigners]);

  // ?섏씠吏 踰덊샇 利앷? ??異붽? ?곗씠??濡쒕뱶
  useEffect(() => {
    if (feedPage > 0 && activeTab === "feed") {
      fetchFeeds(feedPage);
    }
  }, [feedPage, activeTab, fetchFeeds]);

  useEffect(() => {
    if (designerPage > 0 && activeTab === "profile") {
      fetchDesigners(designerPage);
    }
  }, [designerPage, activeTab, fetchDesigners]);

  // 臾댄븳 ?ㅽ겕濡?Observer ?ㅼ젙
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const first = entries[0];
        if (first.isIntersecting) {
          if (activeTab === "feed" && hasMoreFeeds && !isFeedsLoading && !isFetchingMoreFeeds) {
            setFeedPage(prev => prev + 1);
          } else if (activeTab === "profile" && hasMoreDesigners && !isDesignersLoading && !isFetchingMoreDesigners) {
            setDesignerPage(prev => prev + 1);
          }
        }
      },
      { threshold: 0.1 }
    );

    const currentRef = observerRef.current;
    if (currentRef) observer.observe(currentRef);
    return () => { if (currentRef) observer.unobserve(currentRef); };
  }, [activeTab, hasMoreFeeds, isFeedsLoading, isFetchingMoreFeeds, hasMoreDesigners, isDesignersLoading, isFetchingMoreDesigners]);

  const filteredProjects = useMemo(() => {
    const list = [...feeds];
    if (sortBy === "latest") {
      // createdAt ??遺????id ?대┝李⑥닚?쇰줈 ?대갚
      list.sort((a, b) => (b.id ?? 0) - (a.id ?? 0));
    } else if (sortBy === "popular") {
      list.sort((a, b) => (b.likes ?? 0) - (a.likes ?? 0));
    }
    return list;
  }, [feeds, sortBy]);

  const sortLabel: Record<typeof sortBy, string> = {
    recommended: "異붿쿇",
    latest: "理쒖떊",
    popular: "?멸린",
  };

  const filteredDesigners = useMemo(() => designers, [designers]);

  // AI 梨꾪똿 ?섎떒 ?ㅽ겕濡?


  // ?볤? 紐⑤떖 ?낅젰??onCommentKeyDown?쇰줈 ?꾨떖?섎뒗 ?뱀븘???몃뱾??(?꾩옱??no-op)
  const handleSearchKeyDown = (_e: React.KeyboardEvent) => {};

  return (
    <div className="min-h-screen flex flex-col bg-[#FAFAF8]">
      <Navigation />

      {/* ?먯깋 寃?됰컮 (?⑥씪 capsule pill) */}
      <section className="relative z-30">
        <div className="max-w-[1800px] mx-auto px-5 pt-7 pb-3">
          <div className="flex items-center h-12 rounded-full bg-white border border-gray-200/70 shadow-sm hover:border-gray-300 focus-within:border-[#00C9A7]/40 focus-within:shadow-[0_0_0_3px_rgba(0,201,167,0.1)] transition-all duration-300">
            {/* 寃???명뭼 */}
            <div className="relative flex-1 min-w-0 flex items-center pl-5 pr-2">
              <Search className="size-4 text-gray-400 shrink-0" />
              <input
                ref={searchRef}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="pickxel?먯꽌 寃??.."
                className="w-full h-12 pl-3 pr-2 bg-transparent text-[14px] text-[#0F0F0F] placeholder:text-gray-400 focus:outline-none"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="p-0.5 hover:bg-gray-100 rounded-full transition-colors shrink-0" aria-label="寃?됱뼱 吏?곌린">
                  <X className="size-3.5 text-gray-400" />
                </button>
              )}
            </div>

            <div className="w-px h-6 bg-gray-200 shrink-0" />

            {/* ??segmented (?쇰뱶/?꾨줈?? */}
            <div className="relative flex items-center px-1.5 shrink-0">
              <button
                onClick={() => setActiveTab("feed")}
                className={`relative flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-bold transition-colors z-[1] ${
                  activeTab === "feed" ? "text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {activeTab === "feed" && (
                  <motion.div
                    layoutId="explore-active-pill"
                    className="absolute inset-0 bg-[#00C9A7] rounded-full shadow-sm z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <LayoutGrid className={`relative z-[2] size-3.5 transition-colors ${activeTab === "feed" ? "text-white" : "text-gray-400"}`} />
                <span className="relative z-[2]">?쇰뱶</span>
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`relative flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-bold transition-colors z-[1] ${
                  activeTab === "profile" ? "text-white" : "text-gray-500 hover:text-gray-800"
                }`}
              >
                {activeTab === "profile" && (
                  <motion.div
                    layoutId="explore-active-pill"
                    className="absolute inset-0 bg-[#FF5C3A] rounded-full shadow-sm z-0"
                    transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                  />
                )}
                <span className="relative z-[2]">프로필</span>
              </button>
            </div>

            {/* ?뺣젹 ??됲꽣 (?묒そ ??怨듯넻 ?몄텧, jitter ?쒓굅) */}
            <div className="w-px h-6 bg-gray-200 shrink-0" />
            <div className="relative shrink-0 pr-2">
                  <button
                    onClick={() => setIsSortOpen((v) => !v)}
                    className="flex items-center gap-1.5 h-9 px-3 rounded-full text-[13px] font-medium text-gray-700 hover:bg-gray-50 transition-all"
                  >
                    <ArrowUpDown className="size-3.5 text-gray-400" />
                    <span>{sortLabel[sortBy]}</span>
                  </button>
                  <AnimatePresence>
                    {isSortOpen && (
                      <>
                        <div className="fixed inset-0 z-30" onClick={() => setIsSortOpen(false)} />
                        <motion.div
                          initial={{ opacity: 0, y: -6, scale: 0.98 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -6, scale: 0.98 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 z-40 w-44 rounded-xl bg-white border border-gray-200 shadow-xl py-1.5 overflow-hidden"
                        >
                          {([
                            { key: "recommended", icon: Star, label: "추천", desc: "Pickxel 큐레이션" },
                            { key: "latest", icon: Clock, label: "최신", desc: "최근 등록된 순" },
                            { key: "popular", icon: TrendingUp, label: "인기", desc: "좋아요 많은 순" },
                          ] as const).map(({ key, icon: Icon, label, desc }) => (
                            <button
                              key={key}
                              onClick={() => { setSortBy(key); setIsSortOpen(false); }}
                              className={`w-full flex items-start gap-2.5 px-3 py-2 text-left hover:bg-gray-50 transition-colors ${
                                sortBy === key ? "bg-[#00C9A7]/5" : ""
                              }`}
                            >
                              <Icon className={`size-3.5 mt-1 shrink-0 ${sortBy === key ? "text-[#00A88C]" : "text-gray-400"}`} />
                              <div className="min-w-0">
                                <p className={`text-[13px] font-semibold ${sortBy === key ? "text-[#00A88C]" : "text-gray-800"}`}>{label}</p>
                                <p className="text-[11px] text-gray-400 truncate">{desc}</p>
                              </div>
                              {sortBy === key && <Check className="ml-auto size-3.5 text-[#00A88C] mt-1" />}
                            </button>
                          ))}
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* ?먯깋 移댄뀒怨좊━ ?꾪꽣 (??以?洹좊벑 遺꾨같, ?쒕늿???몄텧) */}
      {activeTab === "feed" && (
        <section className="bg-transparent pb-3">
          <div className="max-w-[1800px] mx-auto px-5">
            <div className="flex items-stretch gap-1.5 py-3 px-1">
                  {/* ?꾩껜 踰꾪듉 (?붾━??洹몃씪?붿뼵?? */}
                  <button
                    onClick={() => setSelectedCategory(null)}
                    className={`relative h-[52px] flex-1 basis-0 min-w-0 rounded-md overflow-visible transition-all duration-200 ${
                      !selectedCategory ? "scale-[1.03] shadow-lg shadow-[#00C9A7]/30" : "hover:-translate-y-0.5 hover:shadow-md"
                    }`}
                  >
                    {/* 諛곌꼍 (overflow-hidden???덉そ span?쇰줈 寃⑸━) */}
                    <span className="absolute inset-0 rounded-md overflow-hidden">
                      <span className="absolute inset-0 bg-gradient-to-br from-[#00C9A7] via-[#00A88C] to-[#008F77]" />
                    </span>
                    {/* 議곕챸 耳쒖???湲濡쒖슦 bloom */}
                    <AnimatePresence>
                      {!selectedCategory && (
                        <motion.span
                          key="all-active"
                          className="absolute inset-0 rounded-md pointer-events-none"
                          initial={{ opacity: 0, boxShadow: "0 0 0 2px rgba(0,201,167,0), 0 0 0 0px rgba(0,201,167,0), 0 0 0px rgba(0,201,167,0)" }}
                          animate={{ opacity: 1, boxShadow: "0 0 0 2.5px #00C9A7, 0 0 0 6px rgba(0,201,167,0.2), 0 4px 22px rgba(0,201,167,0.4)" }}
                          exit={{ opacity: 0, boxShadow: "0 0 0 2px rgba(0,201,167,0), 0 0 0 0px rgba(0,201,167,0), 0 0 0px rgba(0,201,167,0)" }}
                          transition={{ duration: 0.28, ease: "easeOut" }}
                        />
                      )}
                    </AnimatePresence>
                    <span className="relative z-[1] flex items-center justify-center gap-1 h-full px-1 text-white">
                      <LayoutGrid className="size-3.5 shrink-0" strokeWidth={2.2} />
                      <span className="text-[12.5px] font-bold tracking-tight">?꾩껜</span>
                    </span>
                  </button>

                  {categories.map((cat) => {
                    const Icon = CATEGORY_ICONS[cat] || Palette;
                    const image = CATEGORY_IMAGES[cat];
                    const isActive = selectedCategory === cat;
                    return (
                      <button
                        key={cat}
                        onClick={() => setSelectedCategory(isActive ? null : cat)}
                        className={`relative h-[52px] flex-1 basis-0 min-w-0 rounded-md overflow-visible bg-gray-800 transition-all duration-200 ${
                          isActive ? "scale-[1.03] shadow-lg shadow-[#00C9A7]/25" : "hover:-translate-y-0.5 hover:shadow-md"
                        }`}
                      >
                        {/* ?대?吏 + ?ㅻ쾭?덉씠 (overflow-hidden 寃⑸━) */}
                        <span className="absolute inset-0 rounded-md overflow-hidden">
                          {image && (
                            <img
                              src={image}
                              alt=""
                              loading="lazy"
                              className={`absolute inset-0 w-full h-full object-cover transition-transform duration-500 ${
                                isActive ? "scale-110" : "scale-100"
                              }`}
                              onError={(e) => {
                                (e.currentTarget as HTMLImageElement).style.display = "none";
                              }}
                            />
                          )}
                          <span
                            className={`absolute inset-0 transition-opacity duration-200 ${
                              isActive
                                ? "bg-gradient-to-t from-black/65 via-black/45 to-black/25"
                                : "bg-gradient-to-t from-black/80 via-black/60 to-black/40"
                            }`}
                          />
                        </span>

                        {/* 議곕챸 耳쒖???湲濡쒖슦 bloom */}
                        <AnimatePresence>
                          {isActive && (
                            <motion.span
                              key={`active-${cat}`}
                              className="absolute inset-0 rounded-md pointer-events-none"
                              initial={{ opacity: 0, boxShadow: "0 0 0 2px rgba(0,201,167,0), 0 0 0 0px rgba(0,201,167,0), 0 0 0px rgba(0,201,167,0)" }}
                              animate={{ opacity: 1, boxShadow: "0 0 0 2.5px #00C9A7, 0 0 0 6px rgba(0,201,167,0.2), 0 4px 22px rgba(0,201,167,0.4)" }}
                              exit={{ opacity: 0, boxShadow: "0 0 0 2px rgba(0,201,167,0), 0 0 0 0px rgba(0,201,167,0), 0 0 0px rgba(0,201,167,0)" }}
                              transition={{ duration: 0.28, ease: "easeOut" }}
                            />
                          )}
                        </AnimatePresence>

                        {/* 肄섑뀗痢?*/}
                        <span className="relative z-[1] flex items-center justify-center gap-1.5 h-full px-2 text-white">
                          <Icon className="size-3.5 shrink-0" />
                          <span
                            className="text-[13px] font-bold tracking-tight text-center leading-tight whitespace-nowrap"
                            style={{ textShadow: "0 1px 4px rgba(0,0,0,0.85), 0 0 2px rgba(0,0,0,0.6)" }}
                          >
                            {cat}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
            </div>
        </section>
      )}

      {/* ?먯깋 硫붿씤 肄섑뀗痢?*/}
      <div className="flex-1">
        {/* ?쇰뱶 移대뱶 洹몃━??*/}
        {activeTab === "feed" && (
          <section className="max-w-[1800px] mx-auto px-5 pt-1 pb-16">
            {isFeedsLoading ? (
              // 濡쒕뵫 ?ㅽ뵾??
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C9A7]"></div>
              </div>
            ) : filteredProjects.length > 0 ? (
              <>
                {/* 洹좎씪 洹몃━?? 紐⑤뱺 移대뱶 4:3 ?숈씪 ?ъ씠利?*/}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-5">
                  {filteredProjects.map((project, index) => {
                    const isSaved = savedProjectIds.has(project.id);
                    const isLiked = likedItems.has(project.id) || project.likedByMe;
                    return (
                      <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 24 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-60px" }}
                        transition={{ delay: (index % 5) * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                        className="group cursor-pointer"
                        onClick={() => openFeedDetail(project)}
                      >
                        {/* ?대?吏 移대뱶 (4:3 怨좎젙) */}
                        <div className="relative aspect-[4/3] rounded-xl overflow-hidden bg-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.14)] transition-shadow duration-500">
                          <ImageWithFallback
                            src={project.image || ""}
                            alt={project.title}
                            className="w-full h-full object-cover block group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                          />

                          {/* 移댄뀒怨좊━ 諛곗? (醫뚯긽?? ?몃쾭 ???몄텧) */}
                          {project.category && (
                            <div className="absolute top-3 left-3 opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all duration-300 z-10">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-semibold text-[#0F0F0F] shadow-sm">
                                {project.category}
                              </span>
                            </div>
                          )}

                          <button
                            onClick={(e) => { e.stopPropagation(); openCollectionModal(project, e); }}
                            title="컬렉션에 저장"
                            className={`absolute top-0 right-3 z-10 flex flex-col items-center justify-center gap-0.5 w-9 pt-2.5 pb-4 opacity-0 group-hover:opacity-100 transition-all duration-300 active:brightness-90 ${
                              isSaved
                                ? "bg-[#FF5C3A]"
                                : "bg-[#1C1C1C] hover:bg-[#333]"
                            }`}
                            style={{
                              clipPath: "polygon(0 0, 100% 0, 100% 100%, 50% calc(100% - 11px), 0 100%)",
                              boxShadow: "0 4px 10px rgba(0,0,0,0.3)"
                            }}
                          >
                            <Bookmark className={`size-3.5 text-white ${isSaved ? "fill-white" : ""}`} />
                            <span className="text-[10px] font-bold text-white tracking-tight leading-none">
                              {isSaved ? "저장됨" : "저장"}
                            </span>
                          </button>

                          {/* ?섎떒 ?댁쭩 洹몃씪?붿뼵???몃쾭 ??移댄뀒怨좊━/???諛곗? 媛?낆꽦?? */}
                          <div className="absolute inset-x-0 top-0 h-1/3 bg-gradient-to-b from-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                        </div>

                        {/* 移대뱶 ?몃? 罹≪뀡 (Behance ?? ?쒕ぉ / ?묎? + 醫뗭븘?붋룸뙎湲) */}
                        <div className="pt-2.5 px-0.5 pb-2">
                          <h3 className="font-semibold text-[13.5px] text-[#0F0F0F] truncate group-hover:text-[#00A88C] transition-colors duration-300 leading-snug">
                            {project.title}
                          </h3>
                          <div className="mt-1 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-1.5 min-w-0 flex-1">
                              <ImageWithFallback
                                src={project.author.avatar}
                                alt={project.author.name}
                                className="size-4 rounded-full ring-1 ring-gray-100 shrink-0 object-cover"
                              />
                              <p className="text-[11.5px] text-gray-500 font-medium truncate">{project.author.name}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 text-[11px] text-gray-400 font-medium">
                              <span className="flex items-center gap-0.5">
                                <Heart className={`size-3 ${isLiked ? "fill-[#FF5C3A] text-[#FF5C3A]" : ""}`} />
                                {project.likes}
                              </span>
                              <span className="flex items-center gap-0.5">
                                <MessageCircle className="size-3" />
                                {project.comments ?? 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* 臾댄븳 ?ㅽ겕濡?媛먯? 諛?濡쒕뵫 ?쒖떆 */}
                <div ref={observerRef} className="h-20 flex items-center justify-center mt-10">
                  {isFetchingMoreFeeds && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C9A7]"></div>
                      <p className="text-xs text-gray-400 font-medium">새로운 피드를 불러오는 중...</p>
                    </div>
                  )}
                  {!hasMoreFeeds && filteredProjects.length > 0 && (
                    <p className="text-sm text-gray-400 font-medium">모든 피드를 확인했습니다.</p>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center py-32">
                <div className="w-24 h-24 rounded-full bg-gray-100 flex items-center justify-center mb-5 animate-pulse">
                  <ImageOff className="size-12 text-gray-300" />
                </div>
                <h3 className="text-lg font-semibold text-gray-700 mb-1">
                  {selectedCategory ? `"${selectedCategory}" 移댄뀒怨좊━???묓뭹???놁뒿?덈떎` : searchQuery ? `"${searchQuery}" 寃??寃곌낵媛 ?놁뒿?덈떎` : "?쒖떆???묓뭹???놁뒿?덈떎"}
                </h3>
                <p className="text-sm text-gray-400 mb-5">?ㅻⅨ 移댄뀒怨좊━瑜??좏깮?섍굅??寃?됱뼱瑜?蹂寃쏀빐蹂댁꽭??</p>
                {(selectedCategory || searchQuery) && (
                  <motion.button whileTap={{ scale: 0.95 }} onClick={() => { setSelectedCategory(null); setSearchQuery(""); }} className="px-6 py-2.5 rounded-lg bg-[#0F0F0F] text-white text-sm font-medium hover:bg-gray-800 transition-colors">
                    ?꾪꽣 珥덇린??
                  </motion.button>
                )}
              </div>
            )}
          </section>
        )}

        {/* ?붿옄?대꼫 紐⑸줉 */}
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
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-5">
                  {filteredDesigners.map((profile, index) => (
                    <motion.div
                      key={profile.userId}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-40px" }}
                      transition={{ delay: (index % 5) * 0.06, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                      className="group"
                    >
                      <Link
                        to={`/profile/${profile.nickname}`}
                        className="block bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_1px_3px_rgba(0,0,0,0.04)] group-hover:border-[#00C9A7]/40 group-hover:shadow-[0_18px_40px_rgba(0,0,0,0.1)] group-hover:-translate-y-1 transition-all duration-500"
                      >
                        {/* ?곷떒 諛곕꼫 (16:9) */}
                        <div className="relative aspect-[16/9] overflow-hidden bg-[#F9FAFB]">
                          {profile.bannerImage ? (
                            <>
                              <ImageWithFallback
                                src={profile.bannerImage}
                                alt={profile.nickname}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent" />
                            </>
                          ) : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-gray-50 to-gray-100/50 border-b border-gray-100">
                              <ImageOff className="size-6 text-gray-300 group-hover:scale-110 transition-transform duration-500" />
                              <span className="text-[9px] font-bold text-gray-300 uppercase tracking-[0.2em] px-2 text-center leading-tight">
                                대표 이미지가 없습니다
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 蹂몃Ц ?곸뿭 */}
                        <div className="px-4 pb-4 pt-0 -mt-8 relative">
                          {/* ???꾨컮? (諛곕꼫??嫄몄묠) */}
                          <ImageWithFallback
                            src={profile.profileImage || `https://i.pravatar.cc/150?u=${profile.userId}`}
                            alt={profile.nickname}
                            className="size-16 rounded-full ring-4 ring-white shadow-md object-cover mb-3"
                          />
                          <h3 className="font-bold text-[15px] text-[#0F0F0F] group-hover:text-[#00A88C] transition-colors truncate leading-tight">
                            {profile.nickname}
                          </h3>
                          <p className="text-[12px] text-gray-500 mt-0.5 truncate">
                            {profile.job || "디자이너"}
                          </p>
                          <p className="text-[12px] text-gray-400 mt-2 line-clamp-2 leading-relaxed min-h-[34px]">
                            {profile.introduction || "멋진 작업을 만들어가는 디자이너입니다."}
                          </p>

                          {/* 硫뷀? ??*/}
                          <div className="mt-3 pt-3 border-t border-gray-100 flex items-center justify-between text-[12px]">
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500">
                                <strong className="text-[#0F0F0F] text-[13px] font-bold">{profile.followCount}</strong>{" "}
                                <span className="text-[11px]">팔로워</span>
                              </span>
                              <span className="w-px h-3 bg-gray-200" />
                              <span className="text-gray-500">
                                <strong className="text-[#0F0F0F] text-[13px] font-bold">{profile.postCount}</strong>{" "}
                                <span className="text-[11px]">?묓뭹</span>
                              </span>
                            </div>
                            <ArrowRight className="size-3.5 text-gray-300 group-hover:text-[#00A88C] group-hover:translate-x-0.5 transition-all" />
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>

                {/* 臾댄븳 ?ㅽ겕濡?媛먯? 諛?濡쒕뵫 ?쒖떆 (?붿옄?대꼫) */}
                <div ref={observerRef} className="h-20 flex items-center justify-center mt-10">
                  {isFetchingMoreDesigners && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#00C9A7]"></div>
                      <p className="text-xs text-gray-400 font-medium">디자이너를 불러오는 중...</p>
                    </div>
                  )}
                  {!hasMoreDesigners && filteredDesigners.length > 0 && (
                    <p className="text-sm text-gray-400 font-medium">모든 디자이너를 확인했습니다.</p>
                  )}
                </div>
              </>
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


      {selectedExploreFeed && (
        <FeedDetailModal
          selectedFeed={selectedExploreFeed}
          activeModalImage={
            (selectedExploreFeed.images ?? [selectedExploreFeed.image])[modalImageIndex] ??
            selectedExploreFeed.image
          }
          selectedFeedImages={selectedExploreFeed.images ?? [selectedExploreFeed.image]}
          modalImageIndex={modalImageIndex}
          savedItemIds={savedProjectIds}
          selectedFeedComments={selectedFeedComments}
          isFeedDetailLoading={isFeedDetailLoading}
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
          isFeedLiked={() => Boolean(selectedExploreFeed.likedByMe)}
          getLikeCount={() => selectedExploreFeed.likes}
          getCommentCount={() => selectedExploreFeed.comments}
          onClose={() => {
            setSelectedExploreFeed(null);
            setCommentFeedItems([]);
            setModalImageIndex(0);
          }}
          onMoveModalCarousel={moveModalCarousel}
          onSetModalImageIndex={(index, e) => {
            e.stopPropagation();
            setModalImageIndex(index);
          }}
          onToggleLike={(_, e) => toggleLike(selectedExploreFeed.id, e)}
          onOpenCollectionModal={(_, e) => openCollectionModal(selectedExploreFeed, e)}
          onShare={(_, e) => handleShare(selectedExploreFeed, e)}
          onProposalClick={(_, e) => handleProposalClick(selectedExploreFeed, e)}
          onStartEditingComment={startEditingComment}
          onEditingCommentTextChange={setEditingCommentText}
          onUpdateComment={handleUpdateComment}
          onCancelEditingComment={cancelEditingComment}
          onDeleteComment={handleDeleteComment}
          onCommentTextChange={setCommentText}
          onCommentKeyDown={handleSearchKeyDown}
          onSubmitComment={handleSubmitComment}
        />
      )}



      {/* 而щ젆?????紐⑤떖 */}
      <AnimatePresence>
        {collectionModalProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => closeCollectionModal()}
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
                <button onClick={() => closeCollectionModal()} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                  <X className="size-5 text-gray-400" />
                </button>
              </div>

              <div className="p-5 space-y-2 max-h-[400px] overflow-y-auto">
                {collections.map((col) => {
                  const isSaved = (collectionPostIdsByFolder[col.folderId] ?? []).includes(collectionModalProject?.id ?? -1);

                  return (
                    <button
                      key={col.folderId}
                      onClick={() => saveToCollection(col.folderId)}
                      className={`w-full p-3 rounded-lg border flex items-center justify-between gap-3 text-left transition-all ${
                        isSaved ? "bg-[#F5FFFB] border-[#00C9A7] text-[#007E68]" : "bg-white border-gray-200 hover:border-[#00C9A7] hover:bg-[#F5FFFB]"
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
                    placeholder="예) 메인 페이지 레퍼런스"
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
