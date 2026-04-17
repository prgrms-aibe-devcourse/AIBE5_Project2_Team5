export type SavedCollection = {
  id: string;
  name: string;
  itemIds: number[];
  updatedAt: string;
};

export type CollectionFeedItem = {
  id: number;
  title: string;
  description: string;
  image: string;
  category?: string;
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  likes: number;
  comments: number;
  createdAt?: string;
};

export const collectionStorageKey = "pickxel-feed-collections";
const profileFeedStoragePrefix = "pickxel:profile-feed:";

const defaultCollections: SavedCollection[] = [
  {
    id: "collection-brand-reference",
    name: "브랜드 레퍼런스",
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

const defaultFeedCatalog: CollectionFeedItem[] = [
  {
    id: 1,
    title: "Electric Mint 브랜딩 프로젝트",
    description: "미니멀하고 미래적인 감각의 브랜딩 아이덴티티 작업",
    image:
      "https://images.unsplash.com/photo-1623932078839-44eb01fbee63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "그래픽 디자인",
    author: {
      name: "김지은",
      role: "브랜드 디자이너",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    likes: 234,
    comments: 45,
  },
  {
    id: 2,
    title: "타이포그래피 포스터 시리즈",
    description: "실험적인 타이포그래피와 컬러 조합",
    image:
      "https://images.unsplash.com/photo-1770581939371-326fc1537f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "그래픽 디자인",
    author: {
      name: "박서준",
      role: "그래픽 디자이너",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    likes: 189,
    comments: 32,
  },
  {
    id: 3,
    title: "모바일 뱅킹 앱 리디자인",
    description: "사용자 경험을 중심으로 한 인터페이스 개선",
    image:
      "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "UI/UX",
    author: {
      name: "이민호",
      role: "UI/UX 디자이너",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    likes: 456,
    comments: 78,
  },
  {
    id: 4,
    title: "봄빛 일러스트 컬렉션",
    description: "자연에서 영감을 받은 따뜻한 톤의 일러스트",
    image:
      "https://images.unsplash.com/photo-1700605295478-2478ac29d2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "일러스트",
    author: {
      name: "최수아",
      role: "일러스트레이터",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    likes: 312,
    comments: 56,
  },
  {
    id: 5,
    title: "프리미엄 패키지 디자인",
    description: "뷰티 브랜드를 위한 패키지 비주얼 작업",
    image:
      "https://images.unsplash.com/photo-1748765968965-7e18d4f7192b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "패키지",
    author: {
      name: "정재현",
      role: "패키지 디자이너",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    likes: 278,
    comments: 41,
  },
  {
    id: 6,
    title: "도시 건축 포트폴리오",
    description: "현대 건축 공간을 담은 사진 작업",
    image:
      "https://images.unsplash.com/photo-1646123202971-cb84915a4108?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "사진",
    author: {
      name: "강민지",
      role: "건축 포토그래퍼",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
    likes: 523,
    comments: 92,
  },
  {
    id: 7,
    title: "컬러 추상 아트워크",
    description: "감정을 색감과 형태로 표현한 추상 아트",
    image:
      "https://images.unsplash.com/photo-1705254613735-1abb457f8a60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "아트",
    author: {
      name: "서연우",
      role: "비주얼 아티스트",
      avatar: "https://i.pravatar.cc/150?img=7",
    },
    likes: 401,
    comments: 67,
  },
  {
    id: 8,
    title: "스튜디오 제품 촬영",
    description: "프리미엄 제품 사진 촬영 및 리터칭",
    image:
      "https://images.unsplash.com/photo-1682078234868-412ec5566118?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "포토그래피",
    author: {
      name: "유지원",
      role: "제품 포토그래퍼",
      avatar: "https://i.pravatar.cc/150?img=8",
    },
    likes: 367,
    comments: 53,
  },
  {
    id: 9,
    title: "3D 캐릭터 일러스트",
    description: "입체적인 스타일의 3D 캐릭터 비주얼",
    image:
      "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&q=80&w=1080",
    category: "3D Art",
    author: {
      name: "홍시우",
      role: "3D 아티스트",
      avatar: "https://i.pravatar.cc/150?img=9",
    },
    likes: 289,
    comments: 44,
  },
  {
    id: 10,
    title: "브랜드 무드 BGM 사운드팩",
    description: "브랜드 무드에 맞춘 루프형 BGM 사운드 디자인",
    image:
      "https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&w=1080&q=80",
    category: "사운드",
    author: {
      name: "최하준",
      role: "사운드 디자이너",
      avatar: "https://i.pravatar.cc/150?img=10",
    },
    likes: 246,
    comments: 38,
  },
];

const getProfileNameFromStorageKey = (key: string) => {
  const rawName = key.slice(profileFeedStoragePrefix.length);

  try {
    return decodeURIComponent(rawName);
  } catch {
    return rawName || "프로필 작성자";
  }
};

const loadProfileFeedItems = (): CollectionFeedItem[] => {
  if (typeof window === "undefined") return [];

  const loadedItems: CollectionFeedItem[] = [];

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
          title: project.title,
          description: project.description,
          image: images[0],
          category: project.category,
          author: {
            name: project.author?.name || fallbackName,
            role: project.author?.role || "디자이너",
            avatar: project.author?.avatar || "https://i.pravatar.cc/150?img=20",
          },
          likes: typeof project.likes === "number" ? project.likes : 0,
          comments: typeof project.comments === "number" ? project.comments : 0,
          createdAt: project.createdAt,
        });
      });
    } catch {
      // Ignore malformed local profile feed entries.
    }
  }

  return loadedItems;
};

export const loadSavedCollections = () => {
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
        updatedAt:
          typeof collection.updatedAt === "string"
            ? collection.updatedAt
            : new Date().toISOString(),
      }));
  } catch {
    return defaultCollections;
  }
};

export const saveCollections = (collections: SavedCollection[]) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(collectionStorageKey, JSON.stringify(collections));
};

export const loadCollectibleFeedItems = () => {
  const profileItems = loadProfileFeedItems();
  const uniqueItems = new Map<number, CollectionFeedItem>();

  [...defaultFeedCatalog, ...profileItems].forEach((item) => {
    if (!uniqueItems.has(item.id)) {
      uniqueItems.set(item.id, item);
    }
  });

  return Array.from(uniqueItems.values());
};
