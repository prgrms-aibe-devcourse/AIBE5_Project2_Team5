export type FeedCatalogItem = {
  id: number;
  title: string;
  description: string;
  image: string;
  tags: string[];
  author: {
    name: string;
    role: string;
    avatar: string;
  };
  likes: number;
};

export type CollectionRecord = {
  id: string;
  title: string;
  description: string;
  feedIds: number[];
  createdAt: string;
  updatedAt: string;
  featured?: boolean;
};

export type CollectionFilter = "all" | "recent" | "most-items" | "empty";

export const SAVED_FEED_IDS_KEY = "pickxel-saved-feed-ids";
export const COLLECTIONS_STORAGE_KEY = "pickxel-collections";

export const feedCatalog: FeedCatalogItem[] = [
  {
    id: 1,
    title: "Electric Mint 브랜드 프로젝트",
    description: "미니멀하고 실험적인 감각의 브랜드 아이덴티티 작업",
    image:
      "https://images.unsplash.com/photo-1623932078839-44eb01fbee63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHdvcmt8ZW58MXx8fHwxNzc1NjAzODU5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["브랜딩", "로고", "아이덴티티"],
    author: {
      name: "김지우",
      role: "브랜드 디자이너",
      avatar: "https://i.pravatar.cc/150?img=1",
    },
    likes: 234,
  },
  {
    id: 2,
    title: "타이포그래피 포스터 시리즈",
    description: "실험적인 타이포그래피와 컬러 조합",
    image:
      "https://images.unsplash.com/photo-1770581939371-326fc1537f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0eXBvZ3JhcGh5JTIwcG9zdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3NTU5Nzc3Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["타이포그래피", "포스터", "그래픽"],
    author: {
      name: "박서준",
      role: "그래픽 디자이너",
      avatar: "https://i.pravatar.cc/150?img=2",
    },
    likes: 189,
  },
  {
    id: 3,
    title: "모바일 뱅킹 앱 리디자인",
    description: "사용자 경험 중심으로 재설계한 모바일 인터페이스",
    image:
      "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXNpZ24lMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzc1NTg0MDgxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["UI/UX", "모바일", "앱디자인"],
    author: {
      name: "이도윤",
      role: "UI/UX 디자이너",
      avatar: "https://i.pravatar.cc/150?img=3",
    },
    likes: 456,
  },
  {
    id: 4,
    title: "여행 일러스트 컬렉션",
    description: "자연과 도시에서 영감을 받은 일러스트레이션",
    image:
      "https://images.unsplash.com/photo-1700605295478-2478ac29d2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbGx1c3RyYXRpb24lMjBhcnR3b3JrfGVufDF8fHx8MTc3NTYzNzc0Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["일러스트", "여행", "아트"],
    author: {
      name: "최수연",
      role: "일러스트레이터",
      avatar: "https://i.pravatar.cc/150?img=4",
    },
    likes: 312,
  },
  {
    id: 5,
    title: "프리미엄 화장품 패키지",
    description: "럭셔리 브랜드를 위한 패키지 디자인 제안",
    image:
      "https://images.unsplash.com/photo-1748765968965-7e18d4f7192b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNrYWdpbmclMjBkZXNpZ24lMjBjcmVhdGl2ZXxlbnwxfHx8fDE3NzU2MDE3MTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["패키지", "뷰티", "브랜딩"],
    author: {
      name: "정재민",
      role: "패키지 디자이너",
      avatar: "https://i.pravatar.cc/150?img=5",
    },
    likes: 278,
  },
  {
    id: 6,
    title: "현대 건축 포트폴리오",
    description: "도시 공간과 구조를 담은 건축 사진 시리즈",
    image:
      "https://images.unsplash.com/photo-1646123202971-cb84915a4108?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBhcmNoaXRlY3R1cmUlMjBwaG90b2dyYXBoeXxlbnwxfHx8fDE3NzU2MzEyNzV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["건축", "사진", "포트폴리오"],
    author: {
      name: "강하진",
      role: "건축 포토그래퍼",
      avatar: "https://i.pravatar.cc/150?img=6",
    },
    likes: 523,
  },
  {
    id: 7,
    title: "컬러 추상 작품",
    description: "감정의 흐름을 색으로 표현한 추상 작품",
    image:
      "https://images.unsplash.com/photo-1705254613735-1abb457f8a60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNvbG9yZnVsJTIwYXJ0fGVufDF8fHx8MTc3NTU4Njc1OHww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["추상", "컬러", "아트"],
    author: {
      name: "한서윤",
      role: "추상 아티스트",
      avatar: "https://i.pravatar.cc/150?img=7",
    },
    likes: 401,
  },
  {
    id: 8,
    title: "스튜디오 제품 촬영",
    description: "제품의 질감과 빛을 살린 스튜디오 촬영",
    image:
      "https://images.unsplash.com/photo-1682078234868-412ec5566118?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9kdWN0JTIwcGhvdG9ncmFwaHklMjBzdHVkaW98ZW58MXx8fHwxNzc1NjM1MTU3fDA&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["제품", "사진", "스튜디오"],
    author: {
      name: "송예준",
      role: "제품 포토그래퍼",
      avatar: "https://i.pravatar.cc/150?img=8",
    },
    likes: 367,
  },
  {
    id: 9,
    title: "3D 캐릭터 일러스트",
    description: "입체적인 스타일로 제작한 캐릭터 비주얼",
    image:
      "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3NTU1ODM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
    tags: ["3D", "캐릭터", "일러스트"],
    author: {
      name: "오현우",
      role: "디지털 아티스트",
      avatar: "https://i.pravatar.cc/150?img=9",
    },
    likes: 289,
  },
];

const defaultCollections: CollectionRecord[] = [
  {
    id: "ui-moodboard",
    title: "2024 UI 레퍼런스",
    description: "모바일 UI와 프로덕트 감각을 모아둔 컬렉션",
    feedIds: [1, 3, 8, 9],
    createdAt: "2026-04-01T09:00:00.000Z",
    updatedAt: "2026-04-15T12:30:00.000Z",
    featured: true,
  },
  {
    id: "branding-notes",
    title: "브랜딩 인터페이스",
    description: "브랜드 톤과 패키지 무드를 함께 보는 보드",
    feedIds: [1, 2, 5],
    createdAt: "2026-03-22T12:00:00.000Z",
    updatedAt: "2026-04-14T16:10:00.000Z",
  },
  {
    id: "visual-playground",
    title: "비주얼 실험실",
    description: "일러스트, 컬러, 아트 중심으로 저장한 무드 모음",
    feedIds: [4, 7, 9],
    createdAt: "2026-03-05T08:20:00.000Z",
    updatedAt: "2026-04-10T10:40:00.000Z",
  },
];

export function getFeedById(feedId: number) {
  return feedCatalog.find((feed) => feed.id === feedId);
}

export function getSavedFeedIds() {
  if (typeof window === "undefined") {
    return [];
  }

  const rawValue = window.localStorage.getItem(SAVED_FEED_IDS_KEY);

  if (!rawValue) {
    return [];
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    return Array.isArray(parsedValue)
      ? parsedValue.map((value) => Number(value)).filter((value) => Number.isInteger(value))
      : [];
  } catch {
    return [];
  }
}

export function setSavedFeedIds(feedIds: number[]) {
  if (typeof window === "undefined") {
    return;
  }

  const normalizedFeedIds = [...new Set(feedIds)];
  window.localStorage.setItem(SAVED_FEED_IDS_KEY, JSON.stringify(normalizedFeedIds));
}

export function getStoredCollections() {
  if (typeof window === "undefined") {
    return defaultCollections;
  }

  const rawValue = window.localStorage.getItem(COLLECTIONS_STORAGE_KEY);

  if (!rawValue) {
    window.localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(defaultCollections));
    return defaultCollections;
  }

  try {
    const parsedValue = JSON.parse(rawValue);

    return Array.isArray(parsedValue) ? parsedValue : defaultCollections;
  } catch {
    return defaultCollections;
  }
}

export function setStoredCollections(collections: CollectionRecord[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(COLLECTIONS_STORAGE_KEY, JSON.stringify(collections));
}
