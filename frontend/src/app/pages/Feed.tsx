import Navigation from "../components/Navigation";
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  X,
  Send,
  MoreVertical,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Check,
  FolderPlus,
  Figma,
  Sparkles,
  ExternalLink,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { apiRequest } from "../api/apiClient";
import {
  createMessageConversationApi,
  sendConversationMessageApi,
} from "../api/messageApi";
import { getCurrentUser } from "../utils/auth";
import {
  getMyCollectionsApi,
  saveFeedToCollectionApi,
  createCollectionFolderApi,
  type CollectionFolderResponse,
} from "../api/collectionApi";

type FeedAuthor = {
  userId?: number;
  name: string;
  role: string;
  avatar: string;
};

type FeedIntegration = {
  provider: "figma" | "adobe";
  label: string;
  url: string;
};

type BaseFeedItem = {
  id: number;
  author: FeedAuthor;
  title: string;
  description: string;
  image: string;
  images?: string[];
  likes: number;
  comments: number;
  tags: string[];
  category?: string;
  integrations?: FeedIntegration[];
  createdAt?: string;
  userId?: number;
  portfolioUrl?: string | null;
  isMine?: boolean;
  isApiFeed?: boolean;
};

type FeedApiItem = {
  postId: number;
  userId: number;
  title: string;
  nickname: string;
  thumbnailUrl: string | null;
  pickCount: number;
  commentCount: number;
  postType: string;
  category: string;
};

type FeedListApiData = {
  feeds: FeedApiItem[];
};

type FeedDetailApiData = {
  postId: number;
  userId: number;
  title: string;
  description: string;
  nickname: string;
  profileImageUrl: string | null;
  role: string;
  postType: string;
  category: string;
  pickCount: number;
  commentCount: number;
  portfolioUrl: string | null;
  createdAt: string;
  imageUrls: string[];
  mine: boolean;
};

type CreateCommentApiData = {
  commentId: number;
  postId: number;
  userId: number;
  nickname: string;
  description: string;
};

type CommentApiItem = {
  commentId: number;
  userId: number;
  nickname: string;
  profileImageUrl: string | null;
  role: string;
  description: string;
  timeText: string;
  mine: boolean;
};

type CommentListApiData = {
  comments: CommentApiItem[];
};

const feedItems: BaseFeedItem[] = [
  {
    id: 1,
    author: {
      name: "김지은",
      role: "브랜드 디자이너",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    title: "Electric Mint 브랜딩 프로젝트",
    description: "미니멀하고 현대적인 감각의 브랜드 아이덴티티 작업",
    image: "https://images.unsplash.com/photo-1623932078839-44eb01fbee63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHdvcmt8ZW58MXx8fHwxNzc1NjAzODU5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 234,
    comments: 45,
    category: "그래픽 디자인",
    tags: ["#브랜딩", "#로고", "#아이덴티티"],
  },
  {
    id: 2,
    author: {
      name: "박서준",
      role: "그래픽 디자이너",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    title: "타이포그래피 포스터 시리즈",
    description: "실험적인 타이포그래피와 컬러 조합",
    image: "https://images.unsplash.com/photo-1770581939371-326fc1537f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0eXBvZ3JhcGh5JTIwcG9zdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3NTU5Nzc3Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 189,
    comments: 32,
    category: "그래픽 디자인",
    tags: ["#타이포그래피", "#포스터", "#그래픽"],
  },
  {
    id: 3,
    author: {
      name: "이민호",
      role: "UI/UX 디자이너",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    title: "모바일 뱅킹 앱 리디자인",
    description: "사용자 경험을 중심으로 한 인터페이스 개선",
    image: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXNpZ24lMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzc1NTg0MDgxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 456,
    comments: 78,
    category: "UI/UX",
    tags: ["#앱디자인", "#와이어프레임", "#프로토타입"],
  },
  {
    id: 4,
    author: {
      name: "최유나",
      role: "일러스트레이터",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    title: "디지털 일러스트 컬렉션",
    description: "자연에서 영감을 받은 일러스트레이션 작업",
    image: "https://images.unsplash.com/photo-1700605295478-2478ac29d2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbGx1c3RyYXRpb24lMjBhcnR3b3JrfGVufDF8fHx8MTc3NTYzNzc0Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 312,
    comments: 56,
    category: "일러스트레이션",
    tags: ["#캐릭터", "#디지털아트", "#러프"],
  },
  {
    id: 5,
    author: {
      name: "정재현",
      role: "패키지 디자이너",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    title: "프리미엄 화장품 패키지",
    description: "럭셔리 브랜드를 위한 패키지 디자인",
    image: "https://images.unsplash.com/photo-1748765968965-7e18d4f7192b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNrYWdpbmclMjBkZXNpZ24lMjBjcmVhdGl2ZXxlbnwxfHx8fDE3NzU2MDE3MTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 278,
    comments: 41,
    category: "제품 디자인",
    tags: ["#패키지", "#프리미엄", "#화장품"],
  },
  {
    id: 6,
    author: {
      name: "강민지",
      role: "건축 사진작가",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
    title: "현대 건축 포트폴리오",
    description: "도시 속 건축물의 기하학적 아름다움",
    image: "https://images.unsplash.com/photo-1646123202971-cb84915a4108?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBwaG90b2dyYXBoeXxlbnwxfHx8fDE3NzU2MzEyNzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 523,
    comments: 92,
    category: "건축",
    tags: ["#건축", "#공간", "#도시"],
  },
  {
    id: 7,
    author: {
      name: "윤서아",
      role: "추상 아티스트",
      avatar: "https://i.pravatar.cc/150?img=7",
    },
    title: "컬러풀 추상 작품",
    description: "감정을 색으로 표현한 추상 아트",
    image: "https://images.unsplash.com/photo-1705254613735-1abb457f8a60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNvbG9yZnVsJTIwYXJ0fGVufDF8fHx8MTc3NTU4Njc1OHww&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 401,
    comments: 67,
    category: "미술",
    tags: ["#추상", "#페인팅", "#컬러"],
  },
  {
    id: 8,
    author: {
      name: "한지훈",
      role: "제품 사진작가",
      avatar: "https://i.pravatar.cc/150?img=8",
    },
    title: "스튜디오 제품 촬영",
    description: "프리미엄 제품 사진 촬영 및 리터칭",
    image: "https://images.unsplash.com/photo-1682078234868-412ec5566118?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwcGhvdG9ncmFwaHklMjBzdHVkaW98ZW58MXx8fHwxNzc1NjM1MTU3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 367,
    comments: 53,
    category: "포토그래피",
    tags: ["#제품촬영", "#스튜디오", "#리터칭"],
  },
  {
    id: 9,
    author: {
      name: "송혜교",
      role: "디지털 아티스트",
      avatar: "https://i.pravatar.cc/150?img=9",
    },
    title: "3D 캐릭터 일러스트",
    description: "독창적인 스타일의 3D 캐릭터 디자인",
    image: "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3NTU1ODM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 289,
    comments: 44,
    category: "3D Art",
    tags: ["#3D", "#캐릭터", "#렌더링"],
  },
  {
    id: 10,
    author: {
      name: "오하준",
      role: "사운드 디자이너",
      avatar: "https://i.pravatar.cc/150?img=10",
    },
    title: "브랜드 무드 BGM 사운드팩",
    description: "앱 전환음과 짧은 루프 BGM을 함께 구성한 사운드 디자인",
    image: "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1080&q=80",
    likes: 246,
    comments: 38,
    category: "사운드",
    tags: ["#BGM", "#효과음", "#믹싱"],
  },
];

type FeedCardItem = BaseFeedItem & {
  feedKey: number;
  page: number;
};

type Collection = {
  collectionId: number;
  collectionName: string;
  itemCount: number;
  thumbnailUrl: string;
};

type FeedComment = {
  id: string;
  author: {
    name: string;
    avatar: string;
    role: string;
  };
  content: string;
  time: string;
  likes: number;
  likedByMe?: boolean;
  isMine?: boolean;
};

const collectionStorageKey = "pickxel-feed-collections";
const profileFeedStoragePrefix = "pickxel:profile-feed:";

const extraFeedImages: Record<number, string[]> = {
  1: [
    "https://images.unsplash.com/photo-1618556450994-a6a128ef0d9d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
  2: [
    "https://images.unsplash.com/photo-1586717799252-bd134ad00e26?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1613909207039-6b173b755cc1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
  3: [
    "https://images.unsplash.com/photo-1551650975-87deedd944c3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1581291518857-4e27b48ff24e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
  4: [
    "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1618331835717-801e976710b2?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
  5: [
    "https://images.unsplash.com/photo-1608755728617-aefab37d2edd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1556228578-8c89e6adf883?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
  6: [
    "https://images.unsplash.com/photo-1518005020951-eccb494ad742?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1494526585095-c41746248156?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
  7: [
    "https://images.unsplash.com/photo-1541961017774-22349e4a1262?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1579541591970-e5d5ea951761?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
  8: [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
  9: [
    "https://images.unsplash.com/photo-1635322966219-b75ed372eb01?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    "https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
  ],
};

const defaultCollections: SavedCollection[] = [
  {
    id: "collection-brand-reference",
    name: "브랜딩 레퍼런스",
    itemIds: [],
    updatedAt: "2026-04-16T00:00:00.000Z",
  },
  {
    id: "collection-ui-inspiration",
    name: "UI 아이디어",
    itemIds: [],
    updatedAt: "2026-04-16T00:00:00.000Z",
  },
];

const getFeedImages = (item: BaseFeedItem) => {
  if (item.images?.length) return item.images;
  return [item.image, ...(extraFeedImages[item.id] ?? [])].filter(Boolean);
};

const getProfileNameFromStorageKey = (key: string) => {
  const rawName = key.slice(profileFeedStoragePrefix.length);

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName || "프로필 작성자";
  }
};

const loadProfileFeedItems = (): BaseFeedItem[] => {
  if (typeof window === "undefined") return [];

  const loadedItems: BaseFeedItem[] = [];

  for (let index = 0; index < window.localStorage.length; index += 1) {
    const storageKey = window.localStorage.key(index);
    if (!storageKey?.startsWith(profileFeedStoragePrefix)) continue;

    try {
      const parsedProjects = JSON.parse(window.localStorage.getItem(storageKey) || "[]");
      if (!Array.isArray(parsedProjects)) continue;

      const fallbackName = getProfileNameFromStorageKey(storageKey);

      parsedProjects.forEach((project: any, projectIndex: number) => {
        const images = Array.isArray(project.images)
          ? project.images.filter(Boolean)
          : project.imageUrl
            ? [project.imageUrl]
            : [];

        if (!project.title || !project.description || images.length === 0) return;

        loadedItems.push({
          id:
            typeof project.id === "number"
              ? project.id
              : Date.now() + index * 100 + projectIndex,
          author: {
            name: project.author?.name || fallbackName,
            role: project.author?.role || "디자이너",
            avatar: project.author?.avatar || "https://i.pravatar.cc/150?img=20",
          },
          title: project.title,
          description: project.description,
          image: images[0],
          images,
          likes: typeof project.likes === "number" ? project.likes : 0,
          comments: typeof project.comments === "number" ? project.comments : 0,
          tags: Array.isArray(project.tags) ? project.tags : [],
          category: project.category,
          integrations: Array.isArray(project.integrations) ? project.integrations : [],
          createdAt: project.createdAt,
        });
      });
    } catch {
      // Ignore malformed local profile feed entries.
    }
  }

  return loadedItems.sort((a, b) => {
    const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return dateB - dateA;
  });
};

const loadSavedCollections = () => {
  if (typeof window === "undefined") return defaultCollections;

  try {
    const savedCollections = window.localStorage.getItem(collectionStorageKey);
    if (!savedCollections) return defaultCollections;

    const parsedCollections = JSON.parse(savedCollections) as SavedCollection[];
    if (!Array.isArray(parsedCollections)) return defaultCollections;

    return parsedCollections
      .filter((collection) => collection.id && collection.name && Array.isArray(collection.itemIds))
      .map((collection) => ({
        ...collection,
        itemIds: collection.itemIds.filter((itemId) => typeof itemId === "number"),
      }));
  } catch {
    return defaultCollections;
  }
};

const trendingTags = [
  "브랜딩",
  "UI/UX",
  "일러스트",
  "패키지",
  "로고",
  "타이포그래피",
  "모바일",
  "웹디자인",
];

const followingProfiles = [
  {
    id: 1,
    name: "김지은",
    role: "브랜드 디자이너",
    avatar: "https://i.pravatar.cc/150?img=1",
    followers: "4.2K",
    works: 78,
    lastActive: "방금 전",
  },
  {
    id: 2,
    name: "박서준",
    role: "그래픽 디자이너",
    avatar: "https://i.pravatar.cc/150?img=2",
    followers: "3.5K",
    works: 92,
    lastActive: "10분 전",
  },
  {
    id: 3,
    name: "이민호",
    role: "UI/UX 디자이너",
    avatar: "https://i.pravatar.cc/150?img=3",
    followers: "5.1K",
    works: 134,
    lastActive: "1시간 전",
  },
  {
    id: 4,
    name: "최유나",
    role: "일러스트레이터",
    avatar: "https://i.pravatar.cc/150?img=4",
    followers: "2.9K",
    works: 67,
    lastActive: "2시간 전",
  },
  {
    id: 5,
    name: "정재현",
    role: "패키지 디자이너",
    avatar: "https://i.pravatar.cc/150?img=5",
    followers: "3.3K",
    works: 85,
    lastActive: "어제",
  },
];

const mockComments = [
  {
    id: 1,
    author: {
      name: "김태영",
      avatar: "https://i.pravatar.cc/150?img=11",
      role: "일러스트레이터"
    },
    content: "정말 멋진 작업이네요! 컬러 조합이 특히 인상적입니다 👍",
    time: "2시간 전",
    likes: 12,
  },
  {
    id: 2,
    author: {
      name: "이수진",
      avatar: "https://i.pravatar.cc/150?img=12",
      role: "브랜드 디자이너"
    },
    content: "이런 스타일 정말 좋아요. 클라이언트 반응도 궁금하네요!",
    time: "5시간 전",
    likes: 8,
  },
  {
    id: 3,
    author: {
      name: "박준서",
      avatar: "https://i.pravatar.cc/150?img=13",
      role: "UI 디자이너"
    },
    content: "영감 받고 갑니다. 감사합니다! 🔥",
    time: "1일 전",
    likes: 15,
  },
];

const createInitialFeedComments = (): Record<number, FeedComment[]> => ({});

export default function Feed() {
  const navigate = useNavigate();
  const [selectedFeed, setSelectedFeed] = useState<FeedCardItem | null>(null);
  const [commentText, setCommentText] = useState("");
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const [apiFeedItems, setApiFeedItems] = useState<BaseFeedItem[]>([]);
  const [isFeedLoading, setIsFeedLoading] = useState(true);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isFeedDetailLoading, setIsFeedDetailLoading] = useState(false);
  const [feedDetailError, setFeedDetailError] = useState<string | null>(null);
  const [commentSubmitError, setCommentSubmitError] = useState<string | null>(null);
  const [isSubmittingComment, setIsSubmittingComment] = useState(false);
  const [isCommentsLoading, setIsCommentsLoading] = useState(false);
  const [commentLoadError, setCommentLoadError] = useState<string | null>(null);
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [isUpdatingComment, setIsUpdatingComment] = useState(false);
  const [isDeletingCommentId, setIsDeletingCommentId] = useState<string | null>(null);
  const [feedComments, setFeedComments] = useState<Record<number, FeedComment[]>>(
    createInitialFeedComments
  );
  const [isFollowingOpen, setIsFollowingOpen] = useState(true);
  const [showAllFollowing, setShowAllFollowing] = useState(false);
  const [carouselIndexes, setCarouselIndexes] = useState<Record<number, number>>({});
  const [modalImageIndex, setModalImageIndex] = useState(0);
  const [collections, setCollections] = useState<CollectionFolderResponse[]>([]);
  const [collectionModalFeed, setCollectionModalFeed] = useState<FeedCardItem | null>(null);
  const [newCollectionName, setNewCollectionName] = useState("");
  const [collectionSavedNotice, setCollectionSavedNotice] = useState("");
  const [profileFeedItems] = useState<BaseFeedItem[]>(loadProfileFeedItems);
  const commentInputRef = useRef<HTMLInputElement | null>(null);
  const shouldFocusCommentRef = useRef(false);

  const visibleFeedItems = useMemo(
    () => {
      const generatedFeedItems = apiFeedItems.map((item, index) => ({
        ...item,
        feedKey: item.id * 1000 + index,
        page: 0,
      }));

      return [
        ...profileFeedItems.map((item, index) => ({
          ...item,
          feedKey: -100000 - index,
          page: 0,
        })),
        ...generatedFeedItems,
      ];
    },
    [apiFeedItems, profileFeedItems]
  );

  const savedItemIds = useMemo(() => {
    // Note: Since server response doesn't have all itemIds,
    // we use a simplified version or fetch details if needed.
    // For now, we rely on the modal fetch to show accurate saved status.
    return new Set<number>();
  }, []);

  const visibleFollowingProfiles = showAllFollowing ? followingProfiles : followingProfiles.slice(0, 3);
  const hiddenFollowingCount = Math.max(followingProfiles.length - 3, 0);
  const currentUser = getCurrentUser();
  const currentUserId = currentUser?.userId ?? null;

  const selectedFeedImages = selectedFeed ? getFeedImages(selectedFeed) : [];
  const activeModalImage = selectedFeedImages[modalImageIndex] ?? selectedFeed?.image ?? "";
  const selectedFeedComments = selectedFeed ? feedComments[selectedFeed.id] ?? [] : [];

  const toCommentAuthorRole = (role: string) => {
    if (role === "CLIENT") return "프로젝트 클라이언트";
    if (role === "DESIGNER") return "디자이너";
    return role;
  };

  const toFeedAuthorRole = (role: string, postType?: string) => {
    if (role === "CLIENT") return "프로젝트 클라이언트";
    if (role === "DESIGNER") return postType ?? "디자이너";
    return role || postType || "";
  };

  const toFeedComment = (comment: CommentApiItem): FeedComment => ({
    id: String(comment.commentId),
    author: {
      name: comment.nickname,
      avatar:
        comment.profileImageUrl ||
        `https://i.pravatar.cc/150?u=comment-${comment.userId}`,
      role: toCommentAuthorRole(comment.role),
    },
    content: comment.description,
    time: comment.timeText || "작성됨",
    likes: 0,
    likedByMe: false,
    isMine: comment.mine,
  });

  useEffect(() => {
    // Removed localStorage sync
  }, []);

  useEffect(() => {
    let mounted = true;

    async function loadFeeds() {
      try {
        setIsFeedLoading(true);
        setFeedError(null);

        const feedData = await apiRequest<FeedListApiData>(
          "/api/feeds",
          {},
          "피드 목록을 불러오지 못했습니다."
        );

        if (!mounted) return;

        setApiFeedItems(
          (feedData?.feeds ?? []).map((feedItem) => ({
            id: feedItem.postId,
            author: {
              userId: feedItem.userId,
              name: feedItem.nickname,
              role: toFeedAuthorRole("", feedItem.postType),
              avatar: `https://i.pravatar.cc/150?u=feed-${feedItem.postId}`,
            },
            title: feedItem.title,
            description: `${feedItem.category} · ${feedItem.postType}`,
            image:
              feedItem.thumbnailUrl ??
              "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
            likes: feedItem.pickCount,
            comments: feedItem.commentCount,
            tags: [feedItem.category, feedItem.postType],
            category: feedItem.category,
            isApiFeed: true,
          }))
        );
      } catch (error) {
        if (!mounted) return;
        setFeedError(error instanceof Error ? error.message : "피드 목록을 불러오지 못했습니다.");
        setApiFeedItems([]);
      } finally {
        if (mounted) {
          setIsFeedLoading(false);
        }
      }
    }

    void loadFeeds();
    void loadCollections();

    return () => {
      mounted = false;
    };
  }, []);

  async function loadCollections() {
    try {
      const data = await getMyCollectionsApi();
      setCollections(data);
    } catch (error) {
      console.error("컬렉션 로딩 실패:", error);
    }
  }

  useEffect(() => {
    let mounted = true;

    async function loadFeedDetail(feedId: number) {
      try {
        setIsFeedDetailLoading(true);
        setFeedDetailError(null);

        const detail = await apiRequest<FeedDetailApiData>(
          `/api/feeds/${feedId}`,
          {},
          "피드 상세를 불러오지 못했습니다."
        );

        if (!mounted) return;

        const detailImages =
          detail.imageUrls?.filter(Boolean).length > 0
            ? detail.imageUrls.filter(Boolean)
            : [
                selectedFeed?.image ??
                  "https://images.unsplash.com/photo-1516321497487-e288fb19713f?auto=format&fit=crop&w=1200&q=80",
              ];

        const updatedFeed: Partial<BaseFeedItem> = {
          id: detail.postId,
          author: {
            name: detail.nickname,
            role: toFeedAuthorRole(detail.role, detail.postType),
            avatar:
              detail.profileImageUrl ||
              `https://i.pravatar.cc/150?u=feed-${detail.postId}`,
          },
          title: detail.title,
          description: detail.description || "",
          image: detailImages[0],
          images: detailImages,
          likes: detail.pickCount,
          comments: detail.commentCount,
          tags: [detail.category, detail.postType].filter(Boolean),
          category: detail.category,
          createdAt: detail.createdAt,
          userId: detail.userId,
          portfolioUrl: detail.portfolioUrl,
          isMine: detail.mine,
          isApiFeed: true,
        };

        setApiFeedItems((prev) =>
          prev.map((item) =>
            item.id === feedId ? { ...item, ...updatedFeed } : item
          )
        );
        setSelectedFeed((prev) =>
          prev && prev.id === feedId ? { ...prev, ...updatedFeed } : prev
        );
      } catch (error) {
        if (!mounted) return;
        setFeedDetailError(
          error instanceof Error ? error.message : "피드 상세를 불러오지 못했습니다."
        );
      } finally {
        if (mounted) {
          setIsFeedDetailLoading(false);
        }
      }
    }

    if (!selectedFeed) {
      setFeedDetailError(null);
      setIsFeedDetailLoading(false);
      return () => {
        mounted = false;
      };
    }

    if (!selectedFeed.isApiFeed) {
      setFeedDetailError(null);
      setIsFeedDetailLoading(false);
      return () => {
        mounted = false;
      };
    }

    void loadFeedDetail(selectedFeed.id);

    return () => {
      mounted = false;
    };
  }, [selectedFeed?.id]);

  useEffect(() => {
    if (!selectedFeed || !shouldFocusCommentRef.current) return;

    window.setTimeout(() => {
      commentInputRef.current?.focus();
      shouldFocusCommentRef.current = false;
    }, 80);
  }, [selectedFeed]);

  useEffect(() => {
    setFeedComments({});
    setEditingCommentId(null);
    setEditingCommentText("");
    setCommentLoadError(null);
    setCommentSubmitError(null);
  }, [currentUserId]);

  useEffect(() => {
    let mounted = true;

    async function loadComments(postId: number) {
      try {
        setIsCommentsLoading(true);
        setCommentLoadError(null);

        const commentData = await apiRequest<CommentListApiData>(
          `/api/posts/${postId}/comments`,
          {},
          "댓글 목록을 불러오지 못했습니다."
        );

        if (!mounted) return;

        const comments = (commentData?.comments ?? []).map(toFeedComment);

        setFeedComments((prev) => ({
          ...prev,
          [postId]: comments,
        }));
        setApiFeedItems((prev) =>
          prev.map((item) =>
            item.id === postId ? { ...item, comments: comments.length } : item
          )
        );
        setSelectedFeed((prev) =>
          prev && prev.id === postId ? { ...prev, comments: comments.length } : prev
        );
      } catch (error) {
        if (!mounted) return;
        setCommentLoadError(
          error instanceof Error ? error.message : "댓글 목록을 불러오지 못했습니다."
        );
      } finally {
        if (mounted) {
          setIsCommentsLoading(false);
        }
      }
    }

    if (!selectedFeed) {
      setCommentLoadError(null);
      setCommentSubmitError(null);
      setEditingCommentId(null);
      setEditingCommentText("");
      return () => {
        mounted = false;
      };
    }

    if (!apiFeedItems.some((item) => item.id === selectedFeed.id)) {
      setCommentLoadError(null);
      return () => {
        mounted = false;
      };
    }

    void loadComments(selectedFeed.id);

    return () => {
      mounted = false;
    };
  }, [selectedFeed?.id, currentUserId]);

  const getCompactName = (name: string) => {
    if (name.length <= 7) return name;
    return `${name.slice(0, 7)}...`;
  };

  const toggleLike = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setLikedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const getLikeCount = (item: BaseFeedItem) =>
    item.likes + (likedItems.has(item.id) ? 1 : 0);

  const getCommentCount = (item: BaseFeedItem) => {
    const comments = feedComments[item.id];
    return comments ? comments.length : item.comments;
  };

  const formatFeedDateTime = (value?: string) => {
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
  };

  const toggleCommentLike = (feedId: number, commentId: string) => {
    setFeedComments((prev) => ({
      ...prev,
      [feedId]: (prev[feedId] ?? []).map((comment) =>
        comment.id === commentId
          ? {
              ...comment,
              likedByMe: !comment.likedByMe,
              likes: comment.likedByMe
                ? Math.max(0, comment.likes - 1)
                : comment.likes + 1,
            }
          : comment
      ),
    }));
  };

  const handleSubmitComment = async () => {
    if (!selectedFeed) return;

    const trimmedComment = commentText.trim();
    if (!trimmedComment) return;

    try {
      setIsSubmittingComment(true);
      setCommentSubmitError(null);

      const savedComment = await apiRequest<CreateCommentApiData>(
        `/api/posts/${selectedFeed.id}/comments`,
        {
          method: "POST",
          body: JSON.stringify({
            description: trimmedComment,
          }),
        },
        "댓글 등록에 실패했습니다."
      );

      const newComment: FeedComment = {
        id: String(savedComment.commentId),
        author: {
          name: savedComment.nickname || currentUser?.nickname || "나",
          avatar: "https://i.pravatar.cc/150?img=20",
          role: currentUser?.role === "client" ? "프로젝트 클라이언트" : "디자이너",
        },
        content: savedComment.description,
        time: "방금 전",
        likes: 0,
        likedByMe: false,
        isMine: true,
      };

      setFeedComments((prev) => ({
        ...prev,
        [selectedFeed.id]: [...(prev[selectedFeed.id] ?? []), newComment],
      }));
      setApiFeedItems((prev) =>
        prev.map((item) =>
          item.id === selectedFeed.id ? { ...item, comments: item.comments + 1 } : item
        )
      );
      setSelectedFeed((prev) =>
        prev ? { ...prev, comments: prev.comments + 1 } : prev
      );
      setCommentText("");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "댓글 등록 중 오류가 발생했습니다.";
      setCommentSubmitError(message);
    } finally {
      setIsSubmittingComment(false);
    }
  };

  const handleCommentKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter" || event.nativeEvent.isComposing) return;

    event.preventDefault();
    handleSubmitComment();
  };

  const startEditingComment = (comment: FeedComment) => {
    setCommentSubmitError(null);
    setEditingCommentId(comment.id);
    setEditingCommentText(comment.content);
  };

  const cancelEditingComment = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  const handleUpdateComment = async () => {
    if (!selectedFeed || !editingCommentId) return;

    const trimmedComment = editingCommentText.trim();
    if (!trimmedComment) return;

    try {
      setIsUpdatingComment(true);
      setCommentSubmitError(null);

      const updatedComment = await apiRequest<{
        commentId: number;
        postId: number;
        description: string;
      }>(
        `/api/posts/${selectedFeed.id}/comments/${editingCommentId}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            description: trimmedComment,
          }),
        },
        "댓글 수정에 실패했습니다."
      );

      setFeedComments((prev) => ({
        ...prev,
        [selectedFeed.id]: (prev[selectedFeed.id] ?? []).map((comment) =>
          comment.id === String(updatedComment.commentId)
            ? {
                ...comment,
                content: updatedComment.description,
                time: "방금 수정됨",
              }
            : comment
        ),
      }));
      cancelEditingComment();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "댓글 수정 중 오류가 발생했습니다.";
      setCommentSubmitError(message);
    } finally {
      setIsUpdatingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!selectedFeed) return;

    try {
      setIsDeletingCommentId(commentId);
      setCommentSubmitError(null);

      await apiRequest<{ commentId: number; postId: number }>(
        `/api/posts/${selectedFeed.id}/comments/${commentId}`,
        {
          method: "DELETE",
        },
        "댓글 삭제에 실패했습니다."
      );

      setFeedComments((prev) => ({
        ...prev,
        [selectedFeed.id]: (prev[selectedFeed.id] ?? []).filter(
          (comment) => comment.id !== commentId
        ),
      }));
      setApiFeedItems((prev) =>
        prev.map((item) =>
          item.id === selectedFeed.id
            ? { ...item, comments: Math.max(0, item.comments - 1) }
            : item
        )
      );
      setSelectedFeed((prev) =>
        prev ? { ...prev, comments: Math.max(0, prev.comments - 1) } : prev
      );

      if (editingCommentId === commentId) {
        cancelEditingComment();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "댓글 삭제 중 오류가 발생했습니다.";
      setCommentSubmitError(message);
    } finally {
      setIsDeletingCommentId(null);
    }
  };

  const moveCarousel = (item: FeedCardItem, direction: -1 | 1, e?: React.MouseEvent) => {
    e?.stopPropagation();
    const images = getFeedImages(item);
    if (images.length <= 1) return;

    setCarouselIndexes((prev) => {
      const currentIndex = prev[item.feedKey] ?? 0;
      return {
        ...prev,
        [item.feedKey]: (currentIndex + direction + images.length) % images.length,
      };
    });
  };

  const moveModalCarousel = (direction: -1 | 1, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (selectedFeedImages.length <= 1) return;
    setModalImageIndex((prev) => (prev + direction + selectedFeedImages.length) % selectedFeedImages.length);
  };

  const openFeedDetail = (item: FeedCardItem, focusComment = false) => {
    shouldFocusCommentRef.current = focusComment;
    setSelectedFeed(item);
    setModalImageIndex(carouselIndexes[item.feedKey] ?? 0);
  };

  const openCollectionModal = (item: FeedCardItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setCollectionModalFeed(item);
    setCollectionSavedNotice("");
    setNewCollectionName("");
    void loadCollections(); // 모달 열 때마다 최신화
  };

  const saveToCollection = async (folderId: number) => {
    if (!collectionModalFeed) return;

    try {
      await saveFeedToCollectionApi(folderId, collectionModalFeed.id);
      const selectedFolder = collections.find((c) => c.folderId === folderId);
      setCollectionSavedNotice(`${selectedFolder?.folderName ?? "컬렉션"}에 저장했어요.`);
      void loadCollections();
    } catch (error) {
      setCollectionSavedNotice("이미 저장되어 있거나 오류가 발생했습니다.");
    }
  };

  const createCollectionAndSave = async () => {
    if (!collectionModalFeed) return;
    const folderName = newCollectionName.trim();
    if (!folderName) return;

    try {
      const newFolder = await createCollectionFolderApi(folderName);
      await saveFeedToCollectionApi(newFolder.folderId, collectionModalFeed.id);
      setCollectionSavedNotice(`${folderName} 컬렉션을 만들고 저장했어요.`);
      setNewCollectionName("");
      void loadCollections();
    } catch (error) {
      setCollectionSavedNotice("컬렉션 생성 또는 저장 중 오류가 발생했습니다.");
    }
  };

  const handleShare = (item: BaseFeedItem, e?: React.MouseEvent) => {
    e?.stopPropagation();
    if (navigator.share) {
      navigator.share({
        title: item.title,
        text: item.description,
        url: window.location.href,
      });
    } else {
      alert('공유 링크가 클립보드에 복사되었습니다!');
    }
  };

  const handleProposalClick = async (item: FeedCardItem, e?: React.MouseEvent) => {
    e?.stopPropagation();

    if (!item.author.userId) {
      alert("대화 상대 정보를 찾을 수 없습니다.");
      return;
    }

    if (currentUser?.userId === item.author.userId) {
      alert("내 피드에는 제안을 보낼 수 없습니다.");
      return;
    }

    const now = Date.now();
    const proposalMessage = `안녕하세요. "${item.title}" 작업을 보고 프로젝트 제안을 드리고 싶어 연락드렸어요. 작업 가능 여부와 예상 일정, 견적을 이야기해보고 싶습니다.`;

    try {
      const conversation = await createMessageConversationApi(item.author.userId);
      await sendConversationMessageApi(conversation.id, {
        clientId: `feed-proposal-${item.id}-${now}`,
        message: proposalMessage,
        attachments: [
          {
            id: `feed-${item.id}`,
            type: "image",
            src: getFeedImages(item)[0] ?? item.image,
            name: item.title,
            uploadStatus: "ready",
          },
        ],
      });

      navigate(`/messages?conversationId=${conversation.id}`);
    } catch (error) {
      alert(error instanceof Error ? error.message : "대화를 시작하지 못했습니다.");
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navigation />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Main Feed */}
          <div className="flex-1">
            {isFeedLoading && (
              <div className="mb-6 rounded-xl border border-dashed border-[#A8F0E4] bg-white px-6 py-10 text-center text-sm font-medium text-gray-500">
                피드 목록을 불러오는 중입니다.
              </div>
            )}

            {!isFeedLoading && feedError && (
              <div className="mb-6 rounded-xl border border-[#FFB9AA] bg-[#FFF7F4] px-6 py-10 text-center text-sm font-medium text-[#B13A21]">
                {feedError}
              </div>
            )}

            {!isFeedLoading && !feedError && visibleFeedItems.length === 0 && (
              <div className="mb-6 rounded-xl border border-dashed border-[#A8F0E4] bg-white px-6 py-10 text-center text-sm font-medium text-gray-500">
                아직 표시할 피드가 없습니다.
              </div>
            )}

            {/* Feed Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {visibleFeedItems.map((item) => {
                const images = getFeedImages(item);
                const activeImageIndex = carouselIndexes[item.feedKey] ?? 0;
                const isSaved = savedItemIds.has(item.id);

                return (
                  <div
                    key={item.feedKey}
                    onClick={() => openFeedDetail(item)}
                    className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-100 hover:border-[#A8F0E4] cursor-pointer animate-in fade-in slide-in-from-bottom-4 duration-500"
                    style={{ animationDelay: `${Math.min(item.page * 80 + (item.id % 3) * 45, 360)}ms` }}
                  >
                    {/* Image */}
                    <div className="relative aspect-[4/3] overflow-hidden bg-[#EAF7F4]">
                      <ImageWithFallback
                        src={images[activeImageIndex]}
                        alt={item.title}
                        className="w-full h-full object-cover hover:scale-105 transition-all duration-500"
                      />

                      {images.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={(e) => moveCarousel(item, -1, e)}
                            className="absolute left-3 top-1/2 -translate-y-1/2 size-9 rounded-lg bg-black/40 text-white backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 transition-all"
                            aria-label="이전 이미지"
                          >
                            <ChevronLeft className="size-5" />
                          </button>
                          <button
                            type="button"
                            onClick={(e) => moveCarousel(item, 1, e)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 size-9 rounded-lg bg-black/40 text-white backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-black/60 transition-all"
                            aria-label="다음 이미지"
                          >
                            <ChevronRight className="size-5" />
                          </button>
                          <div className="absolute top-3 right-3 px-2.5 py-1 rounded-lg bg-black/45 text-white text-xs font-semibold backdrop-blur-md border border-white/15">
                            {activeImageIndex + 1}/{images.length}
                          </div>
                          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                            {images.map((image, index) => (
                              <button
                                key={`${item.feedKey}-${image}`}
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setCarouselIndexes((prev) => ({ ...prev, [item.feedKey]: index }));
                                }}
                                className={`h-1.5 rounded-full transition-all ${
                                  activeImageIndex === index ? "w-5 bg-white" : "w-1.5 bg-white/55"
                                }`}
                                aria-label={`${index + 1}번째 이미지 보기`}
                              />
                            ))}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      {/* Author */}
                      <div className="flex items-center gap-3 mb-3">
                        <ImageWithFallback
                          src={item.author.avatar}
                          alt={item.author.name}
                          className="size-10 rounded-full ring-2 ring-[#A8F0E4]/30"
                        />
                        <div>
                          <h4 className="font-semibold text-sm">{item.author.name}</h4>
                          <p className="text-xs text-gray-500">{item.author.role}</p>
                        </div>
                      </div>

                      {/* Title & Description */}
                      <h3 className="font-bold text-lg mb-2">{item.title}</h3>
                      <p className="text-sm text-gray-600 mb-4">{item.description}</p>

                      {/* Tags */}
                      {item.category && (
                        <div className="mb-3">
                          <span className="rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-3 py-1.5 text-xs font-bold text-[#B13A21]">
                            {item.category}
                          </span>
                        </div>
                      )}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {item.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-3 py-1 bg-[#A8F0E4]/20 text-[#00A88C] rounded-full text-xs font-medium hover:bg-[#00C9A7] hover:text-[#0F0F0F] cursor-pointer transition-all"
                          >
                            {tag.startsWith("#") ? tag : `#${tag}`}
                          </span>
                        ))}
                      </div>

                      {item.integrations && item.integrations.length > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                          {item.integrations.map((integration) => (
                            <a
                              key={`${item.feedKey}-${integration.provider}`}
                              href={integration.url}
                              target="_blank"
                              rel="noreferrer"
                              onClick={(event) => event.stopPropagation()}
                              className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-colors ${
                                integration.provider === "figma"
                                  ? "border-[#BDEFD8] bg-[#F5FFFB] text-[#007E68]"
                                  : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                              }`}
                            >
                              {integration.provider === "figma" ? (
                                <Figma className="size-3.5" />
                              ) : (
                                <Sparkles className="size-3.5" />
                              )}
                              {integration.label}
                              <ExternalLink className="size-3" />
                            </a>
                          ))}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <div className="flex items-center gap-4">
                          <button
                            type="button"
                            onClick={(e) => toggleLike(item.id, e)}
                            className={`flex items-center gap-2 transition-colors ${
                              likedItems.has(item.id) ? "text-[#FF5C3A]" : "text-gray-600 hover:text-[#FF5C3A]"
                            }`}
                            aria-pressed={likedItems.has(item.id)}
                          >
                            <Heart className={`size-5 ${likedItems.has(item.id) ? "fill-[#FF5C3A]" : ""}`} />
                            <span className="text-sm">{getLikeCount(item)}</span>
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openFeedDetail(item, true);
                            }}
                            className="flex items-center gap-2 text-gray-600 hover:text-[#00C9A7] transition-colors"
                          >
                            <MessageCircle className="size-5" />
                            <span className="text-sm">{getCommentCount(item)}</span>
                          </button>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={(e) => openCollectionModal(item, e)}
                            className={`p-2 rounded-lg transition-all ${
                              isSaved
                                ? "bg-[#00C9A7]/90 backdrop-blur-md text-white border border-white/30"
                                : "hover:bg-[#A8F0E4]/20 text-gray-600 hover:text-[#00A88C]"
                            }`}
                            aria-label="컬렉션에 저장"
                            title="컬렉션에 저장"
                          >
                            <Bookmark className={`size-5 ${isSaved ? "fill-white" : ""}`} />
                          </button>
                          <button
                            onClick={(e) => handleShare(item, e)}
                            className="p-2 hover:bg-[#A8F0E4]/20 rounded-lg text-gray-600 hover:text-[#00A88C] transition-colors"
                          >
                            <Share2 className="size-5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {false && (
            <div className="flex justify-center py-8">
              <div className="min-h-12 px-5 py-3 rounded-lg bg-white border border-[#A8F0E4]/60 text-sm font-semibold text-[#00A88C] shadow-sm flex items-center gap-2">
                {isLoadingMore ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    새 작업 불러오는 중
                  </>
                ) : (
                  <>
                    <Plus className="size-4" />
                    아래로 내리면 새 작업이 더 나와요
                  </>
                )}
              </div>
            </div>
            )}
          </div>

          {/* Right Sidebar - Following Profiles */}
          <div className="w-80 space-y-4 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
            {/* Header */}
            <button
              type="button"
              onClick={() => setIsFollowingOpen((prev) => !prev)}
              aria-expanded={isFollowingOpen}
              className="w-full bg-gradient-to-br from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-lg rounded-xl p-5 shadow-md border border-white/20 text-left flex items-center justify-between gap-4 hover:shadow-lg transition-all"
            >
              <div>
                <h3 className="font-bold text-xl text-white">팔로우한 사람</h3>
                <p className="text-sm text-white/80 mt-1">
                  {followingProfiles.length}명 팔로우 중
                </p>
              </div>
              <span className="size-9 rounded-lg bg-white/15 border border-white/25 flex items-center justify-center text-white shrink-0">
                {isFollowingOpen ? <ChevronUp className="size-5" /> : <ChevronDown className="size-5" />}
              </span>
            </button>

            {!isFollowingOpen && (
              <button
                type="button"
                onClick={() => setIsFollowingOpen(true)}
                className="w-full bg-white rounded-xl p-4 shadow-sm border border-[#00C9A7]/20 flex items-center justify-between gap-3 hover:border-[#00C9A7] hover:shadow-md transition-all"
              >
                <div className="flex -space-x-2">
                  {followingProfiles.slice(0, 3).map((profile) => (
                    <ImageWithFallback
                      key={profile.id}
                      src={profile.avatar}
                      alt={profile.name}
                      className="size-9 rounded-full border-2 border-white object-cover"
                    />
                  ))}
                </div>
                <span className="text-sm font-semibold text-[#00A88C]">목록 펼치기</span>
              </button>
            )}

            {/* Profiles Content */}
            {isFollowingOpen && (
              <div className="space-y-3 pb-4">
                {visibleFollowingProfiles.map((profile) => (
                  <div
                    key={profile.id}
                    className="bg-white rounded-xl p-4 shadow-sm border-2 border-transparent hover:border-[#00C9A7] hover:shadow-lg transition-all group"
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <div className="relative shrink-0">
                        <ImageWithFallback
                          src={profile.avatar}
                          alt={profile.name}
                          className="size-12 rounded-full ring-2 ring-[#00C9A7]/40 group-hover:ring-[#00C9A7] transition-all object-cover"
                        />
                        <div className="absolute bottom-0 right-0 size-3.5 bg-[#00C9A7] border-2 border-white rounded-full shadow-sm"></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4
                          title={profile.name}
                          className="font-bold text-sm text-[#0F0F0F] group-hover:text-[#00A88C] transition-colors truncate max-w-[150px]"
                        >
                          {getCompactName(profile.name)}
                        </h4>
                        <p title={profile.role} className="text-xs text-gray-500 truncate max-w-[160px]">
                          {profile.role}
                        </p>
                        <p className="text-[10px] text-[#00C9A7] font-medium mt-0.5 flex items-center gap-1">
                          <span className="size-1.5 bg-[#00C9A7] rounded-full inline-block"></span>
                          {profile.lastActive}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs mb-3 px-2">
                      <div className="text-center">
                        <p className="font-bold text-[#0F0F0F]">{profile.followers}</p>
                        <p className="text-gray-500 text-[10px]">팔로워</p>
                      </div>
                      <div className="w-px h-8 bg-gray-200"></div>
                      <div className="text-center">
                        <p className="font-bold text-[#0F0F0F]">{profile.works}</p>
                        <p className="text-gray-500 text-[10px]">작품</p>
                      </div>
                    </div>
                    <Link
                      to={`/profile/${profile.name}`}
                      className="w-full block"
                    >
                      <button className="w-full bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-md text-white py-2.5 rounded-lg text-sm font-semibold hover:shadow-lg hover:scale-[1.02] transition-all border border-white/30">
                        프로필 보기
                      </button>
                    </Link>
                  </div>
                ))}
                {hiddenFollowingCount > 0 && (
                  <button
                    type="button"
                    onClick={() => setShowAllFollowing((prev) => !prev)}
                    className="w-full bg-white rounded-lg border border-[#00C9A7]/25 px-4 py-3 text-sm font-semibold text-[#00A88C] hover:bg-[#E7FAF6] hover:border-[#00C9A7] transition-all"
                  >
                    {showAllFollowing ? "3명만 보기" : `팔로우 ${hiddenFollowingCount}명 더 보기`}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Feed Detail Modal */}
      {selectedFeed && (
        <div 
          className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedFeed(null)}
        >
          <div 
            className="bg-white rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex h-[90vh]">
              {/* Left Side - Image */}
              <div className="flex-1 bg-[#0F0F0F] flex items-center justify-center relative">
                <ImageWithFallback
                  src={activeModalImage}
                  alt={selectedFeed.title}
                  className="max-w-full max-h-full object-contain"
                />

                {selectedFeedImages.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={(e) => moveModalCarousel(-1, e)}
                      className="absolute left-4 top-1/2 -translate-y-1/2 size-11 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all"
                      aria-label="이전 이미지"
                    >
                      <ChevronLeft className="size-6" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => moveModalCarousel(1, e)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 size-11 rounded-lg bg-black/50 hover:bg-black/70 backdrop-blur-md text-white border border-white/20 flex items-center justify-center transition-all"
                      aria-label="다음 이미지"
                    >
                      <ChevronRight className="size-6" />
                    </button>
                    <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-2 px-3 py-2 rounded-lg bg-black/45 backdrop-blur-md border border-white/15">
                      {selectedFeedImages.map((image, index) => (
                        <button
                          key={`modal-${selectedFeed.feedKey}-${image}`}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setModalImageIndex(index);
                          }}
                          className={`h-2 rounded-full transition-all ${
                            modalImageIndex === index ? "w-6 bg-white" : "w-2 bg-white/50"
                          }`}
                          aria-label={`${index + 1}번째 이미지 보기`}
                        />
                      ))}
                    </div>
                    <div className="absolute top-4 right-4 px-3 py-1.5 rounded-lg bg-black/50 text-white text-sm font-semibold backdrop-blur-md border border-white/15">
                      {modalImageIndex + 1}/{selectedFeedImages.length}
                    </div>
                  </>
                )}

                {/* Close Button */}
                <button
                  onClick={() => setSelectedFeed(null)}
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
                      to={`/profile/${selectedFeed.author.name}`}
                      className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <ImageWithFallback
                        src={selectedFeed.author.avatar}
                        alt={selectedFeed.author.name}
                        className="size-12 rounded-full ring-2 ring-[#00C9A7]"
                      />
                      <div>
                        <h4 className="font-bold text-sm">{selectedFeed.author.name}</h4>
                        <p className="text-xs text-gray-500">{selectedFeed.author.role}</p>
                        {formatFeedDateTime(selectedFeed.createdAt) && (
                          <p className="mt-1 text-[11px] text-gray-400">
                            {formatFeedDateTime(selectedFeed.createdAt)}
                          </p>
                        )}
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(event) => handleProposalClick(selectedFeed, event)}
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
                  <h2 className="font-bold text-xl mb-2">{selectedFeed.title}</h2>
                  <p className="text-sm text-gray-600 mb-3">
                    {selectedFeed.description || "등록된 상세 설명이 없습니다."}
                  </p>

                  {/* Tags */}
                  {selectedFeed.category && (
                    <div className="mb-3">
                      <span className="rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-3 py-1.5 text-xs font-bold text-[#B13A21]">
                        {selectedFeed.category}
                      </span>
                    </div>
                  )}
                  <div className="flex flex-wrap gap-2">
                    {selectedFeed.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#A8F0E4]/30 backdrop-blur-sm text-[#00A88C] rounded-full text-xs font-medium hover:bg-[#00C9A7]/90 hover:backdrop-blur-md hover:text-white cursor-pointer transition-all border border-[#00C9A7]/20"
                      >
                        {tag.startsWith("#") ? tag : `#${tag}`}
                      </span>
                    ))}
                  </div>
                  {selectedFeed.integrations && selectedFeed.integrations.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-2">
                      {selectedFeed.integrations.map((integration) => (
                        <a
                          key={`${selectedFeed.feedKey}-${integration.provider}`}
                          href={integration.url}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(event) => event.stopPropagation()}
                          className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-xs font-semibold transition-colors ${
                            integration.provider === "figma"
                              ? "border-[#BDEFD8] bg-[#F5FFFB] text-[#007E68]"
                              : "border-[#FFB9AA] bg-[#FFF7F4] text-[#B13A21]"
                          }`}
                        >
                          {integration.provider === "figma" ? (
                            <Figma className="size-4" />
                          ) : (
                            <Sparkles className="size-4" />
                          )}
                          {integration.label} 연동
                          <ExternalLink className="size-3.5" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* Actions Bar */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={(e) => toggleLike(selectedFeed.id, e)}
                        className={`flex items-center gap-2 transition-colors ${
                          likedItems.has(selectedFeed.id) ? "text-[#FF5C3A]" : "text-gray-600 hover:text-[#FF5C3A]"
                        }`}
                        aria-pressed={likedItems.has(selectedFeed.id)}
                      >
                        <Heart className={`size-6 ${likedItems.has(selectedFeed.id) ? "fill-[#FF5C3A]" : ""}`} />
                        <span className="font-semibold">{getLikeCount(selectedFeed)}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => commentInputRef.current?.focus()}
                        className="flex items-center gap-2 text-gray-600 hover:text-[#00C9A7] transition-colors"
                      >
                        <MessageCircle className="size-6" />
                        <span className="font-semibold">{getCommentCount(selectedFeed)}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={(e) => openCollectionModal(selectedFeed, e)}
                        className={`p-2 rounded-lg transition-all ${
                          savedItemIds.has(selectedFeed.id)
                            ? "bg-[#00C9A7]/90 backdrop-blur-md text-white border border-white/30"
                            : "hover:bg-[#A8F0E4]/20 text-gray-600 hover:text-[#00A88C]"
                        }`}
                        aria-label="컬렉션에 저장"
                        title="컬렉션에 저장"
                      >
                        <Bookmark className={`size-5 ${savedItemIds.has(selectedFeed.id) ? "fill-white" : ""}`} />
                      </button>
                      <button
                        onClick={(e) => handleShare(selectedFeed, e)}
                        className="p-2 hover:bg-[#A8F0E4]/20 rounded-lg text-gray-600 hover:text-[#00A88C] transition-colors"
                      >
                        <Share2 className="size-5" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Comments Section */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {isFeedDetailLoading && (
                    <div className="rounded-lg bg-[#F7F7F5] px-3 py-2 text-sm text-gray-500">
                      피드 상세를 불러오는 중입니다...
                    </div>
                  )}
                  {feedDetailError && (
                    <div className="rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-3 py-2 text-sm text-[#B13A21]">
                      {feedDetailError}
                    </div>
                  )}
                  {commentSubmitError && (
                    <div className="rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-3 py-2 text-sm text-[#B13A21]">
                      {commentSubmitError}
                    </div>
                  )}
                  {commentLoadError && (
                    <div className="rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] px-3 py-2 text-sm text-[#B13A21]">
                      {commentLoadError}
                    </div>
                  )}
                  {isCommentsLoading && (
                    <div className="rounded-lg bg-[#F7F7F5] px-3 py-2 text-sm text-gray-500">
                      댓글 목록을 불러오는 중입니다...
                    </div>
                  )}
                  {!isCommentsLoading && !commentLoadError && selectedFeedComments.length === 0 && (
                    <div className="rounded-lg bg-[#F7F7F5] px-3 py-2 text-sm text-gray-500">
                      첫 댓글을 남겨보세요.
                    </div>
                  )}
                  {selectedFeedComments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <ImageWithFallback
                        src={comment.author.avatar}
                        alt={comment.author.name}
                        className="size-10 rounded-full ring-2 ring-[#A8F0E4]/30 flex-shrink-0"
                      />
                      <div className="flex-1">
                        <div className="bg-[#F7F7F5] rounded-lg p-3">
                          <div className="flex items-center justify-between mb-1">
                            <h5 className="font-semibold text-sm">{comment.author.name}</h5>
                            <span className="text-[10px] text-gray-500">{comment.time}</span>
                          </div>
                          <p className="text-xs text-gray-500 mb-2">{comment.author.role}</p>
                          {editingCommentId === comment.id ? (
                            <div className="space-y-2">
                              <input
                                type="text"
                                value={editingCommentText}
                                onChange={(e) => setEditingCommentText(e.target.value)}
                                className="w-full rounded-lg border border-[#BDEFD8] bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7]"
                              />
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={handleUpdateComment}
                                  disabled={!editingCommentText.trim() || isUpdatingComment}
                                  className="rounded-md bg-[#00C9A7] px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                                >
                                  저장
                                </button>
                                <button
                                  type="button"
                                  onClick={cancelEditingComment}
                                  className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600"
                                >
                                  취소
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-gray-800">{comment.content}</p>
                          )}
                        </div>
                        <div className="mt-1 ml-3 flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggleCommentLike(selectedFeed.id, comment.id)}
                            className={`text-xs transition-colors ${
                              comment.likedByMe
                                ? "text-[#FF5C3A] font-semibold"
                                : "text-gray-500 hover:text-[#00C9A7]"
                            }`}
                            aria-pressed={Boolean(comment.likedByMe)}
                          >
                            좋아요 {comment.likes}개
                          </button>
                          {comment.isMine && editingCommentId !== comment.id && (
                            <>
                              <button
                                type="button"
                                onClick={() => startEditingComment(comment)}
                                className="text-xs text-gray-500 hover:text-[#00A88C]"
                              >
                                수정
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteComment(comment.id)}
                                disabled={isDeletingCommentId === comment.id}
                                className="text-xs text-gray-500 hover:text-[#FF5C3A] disabled:opacity-50"
                              >
                                삭제
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
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
                        ref={commentInputRef}
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        onKeyDown={handleCommentKeyDown}
                        placeholder="댓글을 입력하세요..."
                        className="w-full px-4 py-3 pr-12 bg-[#F7F7F5] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7] transition-all"
                      />
                      <button 
                        type="button"
                        onClick={handleSubmitComment}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-md text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/30"
                        disabled={!commentText.trim() || isSubmittingComment}
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

      {/* Collection Save Modal */}
      {collectionModalFeed && (
        <div
          className="fixed inset-0 bg-black/55 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
          onClick={() => setCollectionModalFeed(null)}
        >
          <div
            className="bg-white rounded-xl w-full max-w-md shadow-2xl border border-white/40 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-5 border-b border-gray-100 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold text-[#00A88C] mb-1">컬렉션 저장</p>
                <h3 className="font-bold text-xl text-[#0F0F0F]">어디에 저장할까요?</h3>
                <p className="text-sm text-gray-500 mt-1 line-clamp-1">{collectionModalFeed.title}</p>
              </div>
              <button
                type="button"
                onClick={() => setCollectionModalFeed(null)}
                className="size-9 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-500 hover:text-[#0F0F0F] transition-colors"
                aria-label="닫기"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="space-y-2">
                {collections.map((collection) => {
                  // Note: In API mode, we don't know for sure if it's saved without details.
                  // But we can assume it's NOT saved unless the user just saved it in this session,
                  // or we can just show the list and handle it via API response.
                  const isSavedInCollection = false;

                  return (
                    <button
                      key={collection.folderId}
                      type="button"
                      onClick={() => saveToCollection(collection.folderId)}
                      className={`w-full p-3 rounded-lg border flex items-center justify-between gap-3 text-left transition-all ${
                        isSavedInCollection
                          ? "bg-[#E7FAF6] border-[#00C9A7] text-[#007D69]"
                          : "bg-white border-gray-200 hover:border-[#00C9A7] hover:bg-[#F2FFFC]"
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`size-11 rounded-lg flex items-center justify-center shrink-0 ${
                            isSavedInCollection ? "bg-[#00C9A7] text-white" : "bg-[#F7F7F5] text-[#00A88C]"
                          }`}
                        >
                          {isSavedInCollection ? <Check className="size-5" /> : <Bookmark className="size-5" />}
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-sm truncate">{collection.folderName}</p>
                          <p className="text-xs text-gray-500">{collection.itemCount}개 저장됨</p>
                        </div>
                      </div>
                      {isSavedInCollection && (
                        <span className="text-xs font-bold text-[#00A88C] shrink-0">저장됨</span>
                      )}
                    </button>
                  );
                })}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  createCollectionAndSave();
                }}
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

              {collectionSavedNotice && (
                <p className="px-3 py-2 rounded-lg bg-[#E7FAF6] text-[#007D69] text-sm font-semibold">
                  {collectionSavedNotice}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
