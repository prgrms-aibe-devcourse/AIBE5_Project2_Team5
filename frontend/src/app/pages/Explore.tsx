import Navigation from "../components/Navigation";
import {
  Search, Sparkles, Heart, Eye, Users, UserSearch, ImageOff,
  LayoutGrid, Palette, Camera, PenTool, Box, Monitor, Building2,
  Shirt, Megaphone, Scissors, Brush, Package, Gamepad2, Music,
  ArrowRight, X, Plus, ChevronLeft, ChevronRight, Bookmark, Check, FolderPlus, Share2, MessageCircle, Send, MoreVertical, ExternalLink, Figma
} from "lucide-react";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence, LayoutGroup } from "motion/react";
import Lenis from "lenis";
import "lenis/dist/lenis.css";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { matchingCategories } from "../utils/matchingCategories";
import { getExploreFeedsApi, ExplorePostResponseDto } from "../api/exploreApi";
import Footer from "../components/Footer";

const creatorProfiles = [
  {
    id: 1,
    name: "김지은",
    role: "브랜드 디자이너",
    category: "브랜딩",
    avatar: "https://i.pravatar.cc/150?img=1",
    banner: "https://images.unsplash.com/photo-1623932078839-44eb01fbee63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "4.2K",
    works: 78,
    bio: "브랜드 아이덴티티와 로고 디자인 전문",
  },
  {
    id: 2,
    name: "박서준",
    role: "그래픽 디자이너",
    category: "그래픽 디자인",
    avatar: "https://i.pravatar.cc/150?img=2",
    banner: "https://images.unsplash.com/photo-1770581939371-326fc1537f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "3.5K",
    works: 92,
    bio: "타이포그래피와 포스터 디자인을 사랑합니다",
  },
  {
    id: 3,
    name: "이민호",
    role: "UI/UX 디자이너",
    category: "UI/UX",
    avatar: "https://i.pravatar.cc/150?img=3",
    banner: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "5.1K",
    works: 134,
    bio: "사용자 중심 인터페이스 설계 전문가",
  },
  {
    id: 4,
    name: "최유나",
    role: "일러스트레이터",
    category: "일러스트레이션",
    avatar: "https://i.pravatar.cc/150?img=4",
    banner: "https://images.unsplash.com/photo-1700605295478-2478ac29d2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "2.9K",
    works: 67,
    bio: "자연에서 영감을 받은 디지털 일러스트",
  },
  {
    id: 5,
    name: "정재현",
    role: "패키지 디자이너",
    category: "브랜딩",
    avatar: "https://i.pravatar.cc/150?img=5",
    banner: "https://images.unsplash.com/photo-1748765968965-7e18d4f7192b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "3.3K",
    works: 85,
    bio: "럭셔리 브랜드 패키지 디자인 전문",
  },
  {
    id: 6,
    name: "강민지",
    role: "건축 사진작가",
    category: "포토그래피",
    avatar: "https://i.pravatar.cc/150?img=6",
    banner: "https://images.unsplash.com/photo-1646123202971-cb84915a4108?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "6.8K",
    works: 203,
    bio: "도시 건축의 기하학적 아름다움을 담습니다",
  },
  {
    id: 7,
    name: "윤서아",
    role: "추상 아티스트",
    category: "미술",
    avatar: "https://i.pravatar.cc/150?img=7",
    banner: "https://images.unsplash.com/photo-1705254613735-1abb457f8a60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "4.7K",
    works: 119,
    bio: "감정을 색과 형태로 표현하는 추상 작가",
  },
  {
    id: 8,
    name: "한지훈",
    role: "제품 사진작가",
    category: "포토그래피",
    avatar: "https://i.pravatar.cc/150?img=8",
    banner: "https://images.unsplash.com/photo-1682078234868-412ec5566118?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "3.1K",
    works: 58,
    bio: "프리미엄 제품 사진 및 리터칭 전문",
  },
  {
    id: 9,
    name: "송혜교",
    role: "3D 아티스트",
    category: "3D Art",
    avatar: "https://i.pravatar.cc/150?img=9",
    banner: "https://images.unsplash.com/photo-1595411425732-e69c1abe2763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "2.4K",
    works: 44,
    bio: "독창적인 3D 캐릭터와 환경 디자인",
  },
  {
    id: 10,
    name: "오준혁",
    role: "모션 그래픽 디자이너",
    category: "그래픽 디자인",
    avatar: "https://i.pravatar.cc/150?img=10",
    banner: "https://images.unsplash.com/photo-1740174459691-5b93c2fa0592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "5.6K",
    works: 156,
    bio: "브랜드 스토리를 모션으로 전달합니다",
  },
  {
    id: 11,
    name: "임나영",
    role: "패션 디자이너",
    category: "패션",
    avatar: "https://i.pravatar.cc/150?img=20",
    banner: "https://images.unsplash.com/photo-1633533451997-8b6079082e3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "7.2K",
    works: 88,
    bio: "미래 지향적 패션과 텍스타일 디자인",
  },
  {
    id: 12,
    name: "조현우",
    role: "게임 아트 디렉터",
    category: "게임 디자인",
    avatar: "https://i.pravatar.cc/150?img=15",
    banner: "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    followers: "8.3K",
    works: 231,
    bio: "게임 세계관과 캐릭터 아트 전문가",
  },
];

const projects = [
  {
    id: 1,
    title: "Fluid Geometry Study",
    author: "Alex Rivera",
    badge: "NEW",
    category: "그래픽 디자인",
    likes: 1420,
    views: 9800,
    tags: ["3D", "추상", "브랜딩"],
    imageUrl: "https://images.unsplash.com/photo-1595411425732-e69c1abe2763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdlb21ldHJpYyUyMHNoYXBlc3xlbnwxfHx8fDE3NzU2MzMzODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 2,
    title: "Glassmorphism UI Kit",
    author: "Elena Choi",
    category: "UI/UX",
    likes: 2310,
    views: 14500,
    tags: ["UI", "모바일", "프로토타입"],
    imageUrl: "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMHV4JTIwZGVzaWduJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3NTU0MTE1MXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 3,
    title: "Vibrant Patterns",
    author: "Marc Chen",
    category: "일러스트레이션",
    likes: 980,
    views: 7600,
    tags: ["패턴", "컬러", "텍스타일"],
    imageUrl: "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3NTU1ODM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 4,
    title: "Organic Flow Series",
    author: "Sarah Jenkins",
    category: "미술",
    likes: 1240,
    views: 8900,
    tags: ["유기적", "페인팅", "실험"],
    imageUrl: "https://images.unsplash.com/photo-1633533451997-8b6079082e3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFuZCUyMGlkZW50aXR5JTIwZGVzaWdufGVufDF8fHx8MTc3NTU2NDQ1MXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 5,
    title: "Monochrome Branding",
    author: "David Park",
    category: "브랜딩",
    likes: 1680,
    views: 11200,
    tags: ["브랜드", "타이포", "미니멀"],
    imageUrl: "https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzc1NTU1MzcxfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 6,
    title: "Neon Flora Study",
    author: "Ji-won Lee",
    category: "포토그래피",
    likes: 2050,
    views: 13000,
    tags: ["네온", "플로라", "매크로"],
    imageUrl: "https://images.unsplash.com/photo-1623932078839-44eb01fbee63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHdvcmt8ZW58MXx8fHwxNzc1NjAzODU5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 7,
    title: "Gradient Dream",
    author: "Sofi Kim",
    category: "그래픽 디자인",
    likes: 1520,
    views: 10100,
    tags: ["그라디언트", "포스터", "실험"],
    imageUrl: "https://images.unsplash.com/photo-1740174459691-5b93c2fa0592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3Rpb24lMjBncmFwaGljcyUyMGFuaW1hdGlvbnxlbnwxfHx8fDE3NzU1OTI4Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 8,
    title: "Arch Theory",
    author: "Tom Brooks",
    category: "건축",
    likes: 1100,
    views: 7200,
    tags: ["건축", "렌더", "구조"],
    imageUrl: "https://images.unsplash.com/photo-1595411425732-e69c1abe2763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdlb21ldHJpYyUyMHNoYXBlc3xlbnwxfHx8fDE3NzU2MzMzODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 9,
    title: "Deep Ocean UI",
    author: "Luna Sky",
    category: "UI/UX",
    likes: 1870,
    views: 12600,
    tags: ["다크모드", "대시보드", "컴포넌트"],
    imageUrl: "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMHV4JTIwZGVzaWduJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3NTU0MTE1MXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 10,
    title: "Core Fusion",
    author: "Ian Smith",
    category: "제품 디자인",
    likes: 1340,
    views: 8700,
    tags: ["제품", "컨셉", "렌더링"],
    imageUrl: "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3NTU1ODM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

// ── 카테고리 아이콘 매핑 ──
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
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
};

// ── AI 검색 mock 응답 ──
const AI_MOCK_RESPONSES: Record<string, { summary: string; designers: typeof creatorProfiles; tags: string[] }> = {
  default: {
    summary: "요청하신 키워드와 관련된 디자이너를 분석했어요. 아래 크리에이터들이 잘 맞을 것 같습니다!",
    designers: creatorProfiles.slice(0, 3),
    tags: ["브랜딩", "UI/UX", "일러스트레이션"],
  },
};

// ── 컬렉션 관련 ──
type SavedCollection = { id: string; name: string; itemIds: number[]; updatedAt: string };
const COLLECTION_KEY = "pickxel-explore-collections";
const defaultCollections: SavedCollection[] = [
  { id: "col-inspiration", name: "영감 모음", itemIds: [], updatedAt: new Date().toISOString() },
  { id: "col-reference", name: "레퍼런스", itemIds: [], updatedAt: new Date().toISOString() },
];
const loadCollections = (): SavedCollection[] => {
  try {
    const raw = localStorage.getItem(COLLECTION_KEY);
    if (!raw) return defaultCollections;
    const parsed = JSON.parse(raw) as SavedCollection[];
    return Array.isArray(parsed) ? parsed : defaultCollections;
  } catch { return defaultCollections; }
};

export default function Explore() {
  const categories = matchingCategories;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"feed" | "profile">("feed");

  // 실제 서버 데이터 상태
  const [feeds, setFeeds] = useState<ExplorePostResponseDto[]>([]);
  const [isFeedsLoading, setIsFeedsLoading] = useState(false);

  // 컬렉션
  const [collections, setCollections] = useState<SavedCollection[]>(loadCollections);
  const [collectionModalProject, setCollectionModalProject] = useState<typeof projects[0] | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collectionNotice, setCollectionNotice] = useState("");

  useEffect(() => { localStorage.setItem(COLLECTION_KEY, JSON.stringify(collections)); }, [collections]);

  const savedProjectIds = useMemo(() => new Set(collections.flatMap(c => c.itemIds)), [collections]);

  const openCollectionModal = (project: typeof projects[0], e: React.MouseEvent) => {
    e.stopPropagation();
    setCollectionModalProject(project);
    setCollectionNotice("");
    setNewCollectionName("");
  };

  const saveToCollection = (colId: string) => {
    if (!collectionModalProject) return;
    const col = collections.find(c => c.id === colId);
    setCollections(prev => prev.map(c => {
      if (c.id !== colId || c.itemIds.includes(collectionModalProject.id)) return c;
      return { ...c, itemIds: [collectionModalProject.id, ...c.itemIds], updatedAt: new Date().toISOString() };
    }));
    setCollectionNotice(`${col?.name ?? "컬렉션"}에 저장했어요.`);
  };

  const createCollectionAndSave = () => {
    if (!collectionModalProject) return;
    const name = newCollectionName.trim();
    if (!name) return;
    const newCol: SavedCollection = { id: `col-${Date.now()}`, name, itemIds: [collectionModalProject.id], updatedAt: new Date().toISOString() };
    setCollections(prev => [newCol, ...prev]);
    setCollectionNotice(`${name} 컬렉션을 만들고 저장했어요.`);
    setNewCollectionName("");
  };

  // AI 검색
  const [aiMode, setAiMode] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<typeof AI_MOCK_RESPONSES["default"] | null>(null);
  const [aiTypedText, setAiTypedText] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const catScrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  
  // 선택된 피드 모달 상태
  const [selectedProjectForModal, setSelectedProjectForModal] = useState<any>(null);

  // ── lenis smooth scroll ──
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

  // 피드 데이터 가져오기 (실제 API 호출)
  useEffect(() => {
    if (activeTab !== "feed") return;

    const fetchFeeds = async () => {
      try {
        setIsFeedsLoading(true);
        // 카테고리가 null이면 "all"로 처리 (API 상의 약속)
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

  const filteredProjects = useMemo(() => {
    // 검색어가 있을 때만 프론트엔드에서 필터링하거나, 
    // 나중에 검색 API가 생기면 서버로 요청하도록 할 예정입니다.
    if (!searchQuery.trim()) return feeds;
    
    return feeds.filter((p) => {
      const q = searchQuery.toLowerCase();
      return p.title.toLowerCase().includes(q) || p.nickname.toLowerCase().includes(q);
    });
  }, [feeds, searchQuery]);

  const filteredProfiles = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return creatorProfiles.filter(
      (p) => p.name.toLowerCase().includes(q) || p.role.toLowerCase().includes(q) || p.category.toLowerCase().includes(q),
    );
  }, [searchQuery]);

  // AI 검색 실행
  const runAiSearch = useCallback(() => {
    if (!searchQuery.trim()) return;
    setAiLoading(true);
    setAiResult(null);
    setAiTypedText("");
    // mock: 1.2초 후 결과
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

      {/* ━━ 검색바 + AI 토글 + 탭 ━━ */}
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
                placeholder={aiMode ? "어떤 디자이너를 찾고 계세요? AI가 도와드릴게요..." : "pickxel에서 검색..."}
                className="w-full h-10 pl-10 pr-4 bg-transparent text-sm text-[#0F0F0F] placeholder:text-gray-400 focus:outline-none rounded-xl"
              />
              {searchQuery && (
                <button onClick={() => { setSearchQuery(""); setAiResult(null); }} className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 hover:bg-gray-200/60 rounded-full transition-colors">
                  <X className="size-3.5 text-gray-400" />
                </button>
              )}
            </div>

            {/* AI 토글 */}
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

            {/* 탭 토글 */}
            <div className="flex rounded-lg bg-white border border-gray-200/80 shadow-sm p-0.5 shrink-0">
              <button
                onClick={() => setActiveTab("feed")}
                className={`flex items-center gap-1.5 px-3.5 h-9 rounded-md text-sm font-medium transition-all ${
                  activeTab === "feed" ? "bg-[#00C9A7] text-white shadow-md shadow-[#00C9A7]/20" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <LayoutGrid className="size-3.5" /> 피드
              </button>
              <button
                onClick={() => setActiveTab("profile")}
                className={`flex items-center gap-1.5 px-3.5 h-9 rounded-md text-sm font-medium transition-all ${
                  activeTab === "profile" ? "bg-[#00C9A7] text-white shadow-md shadow-[#00C9A7]/20" : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
                }`}
              >
                <Users className="size-3.5" /> 프로필
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
                        <p className="text-xs text-gray-400">최적의 디자이너를 찾고 있습니다</p>
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

      {/* ━━ 카테고리 필터 ━━ */}
      {activeTab === "feed" && (
        <section className="bg-transparent pb-3">
          <div className="max-w-[1800px] mx-auto px-5 relative">
            {/* 좌측 페이드 + 화살표 */}
            {canScrollLeft && (
              <div className="absolute left-0 top-0 bottom-0 z-10 flex items-center">
                <div className="w-20 h-full bg-gradient-to-r from-[#F7F7F5] via-[#F7F7F5]/80 to-transparent pointer-events-none absolute left-0" />
                <button onClick={() => scrollCat("left")} className="relative z-10 ml-2 size-8 rounded-full bg-white/80 backdrop-blur-sm border border-gray-200 shadow-sm flex items-center justify-center text-gray-500 hover:bg-white hover:text-gray-700 transition-all">
                  <ChevronLeft className="size-4" />
                </button>
              </div>
            )}
            {/* 우측 페이드 + 화살표 */}
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

      {/* ━━ 메인 콘텐츠 (flex-1로 푸터 하단 고정) ━━ */}
      <div className="flex-1">
        {/* ━━ 피드 탭: 균일 그리드 ━━ */}
        {activeTab === "feed" && (
          <section className="max-w-[1800px] mx-auto px-5 pt-1 pb-16">
            {isFeedsLoading ? (
              // 로딩 중일 때 표시할 스켈레톤이나 로퍼 (기존 디자인 유지)
              <div className="flex justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#00C9A7]"></div>
              </div>
            ) : filteredProjects.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {filteredProjects.map((project, index) => (
                  <motion.div
                    key={project.postId} // project.id 대신 postId 사용
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ delay: (index % 4) * 0.08, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="group cursor-pointer pb-2"
                    onClick={() => setSelectedProjectForModal(project)}
                  >
                    <div className="relative rounded-2xl overflow-hidden bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06)] group-hover:shadow-[0_20px_50px_rgba(0,0,0,0.12)] group-hover:-translate-y-2 transition-all duration-500 ease-out">
                      {/* 이미지 (고정 비율) */}
                      <div className="relative aspect-[4/3] overflow-hidden">
                        <ImageWithFallback
                          src={project.imageUrl || ""} // null 처리
                          alt={project.title}
                          className="w-full h-full object-cover group-hover:scale-[1.08] transition-transform duration-700 ease-out"
                        />
                        {/* 호버 오버레이: 상단 비네팅 + 하단 그라디언트 */}
                        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 pointer-events-none" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-400 pointer-events-none" />

                        {/* 우상단: 저장 버튼 (pill) */}
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
                      {/* 하단 정보 */}
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

        {/* ━━ 프로필 탭 ━━ */}
        {activeTab === "profile" && (
          <section className="max-w-[1800px] mx-auto px-5 py-6">
            <div className="mb-5 flex items-center gap-2">
              <Users className="size-4 text-[#00C9A7]" />
              <span className="text-sm font-semibold text-[#374151]">크리에이터 {filteredProfiles.length}명</span>
              {searchQuery && <span className="text-sm text-gray-400">— "{searchQuery}"</span>}
            </div>
            {filteredProfiles.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredProfiles.map((profile, index) => (
                  <motion.div
                    key={profile.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-40px" }}
                    transition={{ delay: (index % 4) * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                    className="group pb-2"
                  >
                    <Link to={`/profile/${profile.name}`} className="flex h-[156px] bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-[0_2px_8px_rgba(0,0,0,0.04)] group-hover:border-[#00C9A7]/40 group-hover:shadow-[0_16px_40px_rgba(0,0,0,0.1)] group-hover:-translate-y-1 transition-all duration-500">
                      {/* 좌측: 배너 */}
                      <div className="w-32 shrink-0 relative overflow-hidden">
                        <ImageWithFallback
                          src={profile.banner}
                          alt={profile.name}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent to-black/10" />
                      </div>
                      {/* 우측: 정보 */}
                      <div className="flex-1 p-3.5 flex flex-col justify-between min-w-0">
                        <div>
                          <div className="flex items-center gap-2 mb-1.5">
                            <ImageWithFallback src={profile.avatar} alt={profile.name} className="size-9 rounded-full ring-2 ring-[#00C9A7]/15 shadow-sm shrink-0" />
                            <div className="min-w-0">
                              <h3 className="font-bold text-sm text-[#0F0F0F] group-hover:text-[#00A88C] transition-colors truncate leading-tight">{profile.name}</h3>
                              <p className="text-[11px] text-gray-500 truncate">{profile.role}</p>
                            </div>
                          </div>
                          <span className="inline-block text-[10px] font-semibold bg-[#A8F0E4]/25 text-[#00A88C] px-2 py-0.5 rounded-full mb-1.5">{profile.category}</span>
                          <p className="text-[11px] text-gray-400 line-clamp-1 leading-relaxed">{profile.bio}</p>
                        </div>
                        <div className="flex items-center gap-3 mt-auto pt-2 border-t border-gray-50 text-[10px]">
                          <span className="text-gray-500"><strong className="text-[#0F0F0F] text-xs">{profile.followers}</strong> 팔로워</span>
                          <span className="text-gray-500"><strong className="text-[#0F0F0F] text-xs">{profile.works}</strong> 작품</span>
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
                  {searchQuery ? `"${searchQuery}"에 해당하는 크리에이터가 없습니다` : "크리에이터를 찾을 수 없습니다"}
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

      {/* ── 피드 상세 모달 ── */}
      <AnimatePresence>
        {selectedProjectForModal && (
          <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            onClick={() => setSelectedProjectForModal(null)}
          >
            <div 
              className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex h-[90vh]">
                {/* Left Side - Image */}
                <div className="flex-1 bg-[#0F0F0F] flex items-center justify-center relative">
                  <ImageWithFallback
                    src={selectedProjectForModal.imageUrl}
                    alt={selectedProjectForModal.title}
                    className="max-w-full max-h-full object-contain"
                  />

                  {/* Close Button */}
                  <button
                    onClick={() => setSelectedProjectForModal(null)}
                    className="absolute top-4 left-4 p-2 bg-black/50 hover:bg-black/70 backdrop-blur-md text-white rounded-full transition-all border border-white/20"
                  >
                    <X className="size-6" />
                  </button>
                </div>

                {/* Right Side - Details & Comments */}
                <div className="w-[400px] flex flex-col bg-white">
                  {/* Author Header */}
                  <div className="p-5 border-b border-gray-200">
                    <div className="flex items-center justify-between mb-4">
                      <Link 
                        to={`/profile/${selectedProjectForModal.nickname}`}
                        className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <ImageWithFallback
                          src={selectedProjectForModal.profileImage || ""}
                          alt={selectedProjectForModal.nickname}
                          className="size-12 rounded-full ring-2 ring-[#00C9A7]"
                        />
                        <div>
                          <h4 className="font-bold text-sm">{selectedProjectForModal.nickname}</h4>
                          <p className="text-xs text-gray-500">{selectedProjectForModal.job || "크리에이터"}</p>
                        </div>
                      </Link>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[#FFB6A6] bg-[#FF5C3A] px-3.5 text-[0px] font-bold text-white shadow-[0_8px_18px_rgba(255,92,58,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#E94F2F] hover:shadow-[0_10px_22px_rgba(255,92,58,0.28)] focus:outline-none focus:ring-2 focus:ring-[#FFB6A6] focus:ring-offset-2 [&>span]:text-xs"
                        >
                          <Send className="size-3.5" />
                          <span>프로젝트 제안</span>
                          제안하기
                        </button>
                        <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                          <MoreVertical className="size-5 text-gray-600" />
                        </button>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h2 className="font-bold text-xl mb-2">{selectedProjectForModal.title}</h2>
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">{selectedProjectForModal.description || "상세 설명이 없는 게시글입니다."}</p>

                    {/* Tags */}
                      {selectedProjectForModal.category && (
                        <div className="mb-3">
                          <span className="rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-3 py-1.5 text-xs font-bold text-[#B13A21]">
                            {selectedProjectForModal.category}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2">
                        {selectedProjectForModal.tags?.map((tag: string, index: number) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-[#A8F0E4]/30 backdrop-blur-sm text-[#00A88C] rounded-full text-xs font-medium hover:bg-[#00C9A7]/90 hover:backdrop-blur-md hover:text-white cursor-pointer transition-all border border-[#00C9A7]/20"
                          >
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="p-4 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            className={`flex items-center gap-2 transition-colors text-gray-600 hover:text-[#FF5C3A]`}
                          >
                            <Heart className="size-6" />
                            <span className="font-semibold">{selectedProjectForModal.likes}</span>
                          </button>
                          <button
                            type="button"
                            className="flex items-center gap-2 text-gray-600 hover:text-[#00C9A7] transition-colors"
                          >
                            <MessageCircle className="size-6" />
                            <span className="font-semibold">24</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className="p-2 hover:bg-[#A8F0E4]/20 rounded-lg text-gray-600 hover:text-[#00A88C] transition-colors"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCollectionModalProject(selectedProjectForModal);
                              setSelectedProjectForModal(null);
                            }}
                          >
                            <Bookmark className="size-5" />
                          </button>
                          <button
                            className="p-2 hover:bg-[#A8F0E4]/20 rounded-lg text-gray-600 hover:text-[#00A88C] transition-colors"
                          >
                            <Share2 className="size-5" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comments Section */}
                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                      <div className="flex gap-3">
                        <ImageWithFallback
                          src="https://i.pravatar.cc/150?img=33"
                          alt="Commenter"
                          className="size-10 rounded-full ring-2 ring-[#A8F0E4]/30 flex-shrink-0"
                        />
                        <div className="flex-1">
                          <div className="bg-[#F7F7F5] rounded-lg p-3">
                            <div className="flex items-center justify-between mb-1">
                              <h5 className="font-semibold text-sm">김지호</h5>
                              <span className="text-[10px] text-gray-500">2시간 전</span>
                            </div>
                            <p className="text-xs text-gray-500 mb-2">프론트엔드 개발자</p>
                            <p className="text-sm text-gray-800">정말 놀라운 작업물이네요! 컬러 조합이 환상적입니다.</p>
                          </div>
                          <button
                            type="button"
                            className="text-xs mt-1 ml-3 transition-colors text-gray-500 hover:text-[#00C9A7]"
                          >
                            좋아요 5개
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Comment Input */}
                    <div className="p-4 border-t border-gray-200">
                      <div className="flex items-center gap-3">
                        <ImageWithFallback
                          src="https://i.pravatar.cc/150?img=20"
                          alt="My Avatar"
                          className="size-10 rounded-full ring-2 ring-[#00C9A7]"
                        />
                        <div className="flex-1 relative">
                          <input
                            type="text"
                            placeholder="댓글을 입력하세요..."
                            className="w-full px-4 py-3 pr-12 bg-[#F7F7F5] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7] transition-all"
                          />
                          <button 
                            type="button"
                            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-md text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/30"
                          >
                            <Send className="size-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </AnimatePresence>

      {/* Floating Add */}
      <motion.div whileHover={{ scale: 1.1, rotate: 45 }} whileTap={{ scale: 0.9 }} className="fixed bottom-8 right-8 z-50">
        <Link to="/projects/new" className="bg-gradient-to-br from-[#00C9A7] to-[#00A88C] text-white size-14 rounded-full shadow-xl flex items-center justify-center ring-4 ring-white">
          <Plus className="size-6" />
        </Link>
      </motion.div>

      <Footer />

      {/* ━━ 컬렉션 저장 모달 ━━ */}
      <AnimatePresence>
        {collectionModalProject && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setCollectionModalProject(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="bg-white rounded-2xl w-full max-w-md shadow-2xl border border-white/40 overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 헤더 */}
              <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold text-[#00A88C] mb-1">컬렉션 저장</p>
                  <h3 className="font-bold text-xl text-[#0F0F0F]">어디에 저장할까요?</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-1">{collectionModalProject.title}</p>
                </div>
                <button
                  onClick={() => setCollectionModalProject(null)}
                  className="size-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-[#0F0F0F] transition-colors"
                >
                  <X className="size-5" />
                </button>
              </div>

              {/* 컬렉션 목록 */}
              <div className="p-5 space-y-4">
                <div className="space-y-2 max-h-[240px] overflow-y-auto">
                  {collections.map((col) => {
                    const isSaved = col.itemIds.includes(collectionModalProject.id);
                    return (
                      <button
                        key={col.id}
                        onClick={() => saveToCollection(col.id)}
                        className={`w-full p-3 rounded-xl border flex items-center justify-between gap-3 text-left transition-all ${
                          isSaved
                            ? "bg-[#E7FAF6] border-[#00C9A7] text-[#007D69]"
                            : "bg-white border-gray-200 hover:border-[#00C9A7] hover:bg-[#F2FFFC]"
                        }`}
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div className={`size-11 rounded-lg flex items-center justify-center shrink-0 ${
                            isSaved ? "bg-[#00C9A7] text-white" : "bg-[#F7F7F5] text-[#00A88C]"
                          }`}>
                            {isSaved ? <Check className="size-5" /> : <Bookmark className="size-5" />}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-sm truncate">{col.name}</p>
                            <p className="text-xs text-gray-500">{col.itemIds.length}개 저장됨</p>
                          </div>
                        </div>
                        {isSaved && <span className="text-xs font-bold text-[#00A88C] shrink-0">저장됨</span>}
                      </button>
                    );
                  })}
                </div>

                {/* 새 컬렉션 만들기 */}
                <form
                  onSubmit={(e) => { e.preventDefault(); createCollectionAndSave(); }}
                  className="pt-4 border-t border-gray-100"
                >
                  <label className="text-sm font-bold text-[#0F0F0F] mb-2 block">새 컬렉션 만들기</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newCollectionName}
                      onChange={(e) => setNewCollectionName(e.target.value)}
                      placeholder="예: 메인페이지 레퍼런스"
                      className="flex-1 px-3 py-2.5 rounded-lg bg-[#F7F7F5] border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7] focus:border-transparent"
                    />
                    <button
                      type="submit"
                      disabled={!newCollectionName.trim()}
                      className="px-4 py-2.5 rounded-lg bg-[#0F0F0F] text-white text-sm font-semibold hover:bg-[#00A88C] transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      <FolderPlus className="size-4" />
                      만들기
                    </button>
                  </div>
                </form>

                {/* 저장 완료 알림 */}
                {collectionNotice && (
                  <motion.p
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="px-3 py-2 rounded-lg bg-[#E7FAF6] text-[#007D69] text-sm font-semibold"
                  >
                    {collectionNotice}
                  </motion.p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
