import Navigation from "../components/Navigation";
import {
  Plus,
  Search,
  SlidersHorizontal,
  ImageOff,
  LayoutGrid,
  Users,
  UserSearch,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { Link } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { ToggleGroup, ToggleGroupItem } from "../components/ui/toggle-group";
import CategoryButtons from "../components/CategoryButtons";
import ProjectsGrid from "../components/ProjectsGrid";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { matchingCategories } from "../utils/matchingCategories";

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

export default function Explore() {
  const categories = matchingCategories;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("feed");
  const [visibleProjects, setVisibleProjects] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);
  const profileGridRef = useRef<HTMLDivElement>(null);
  const profileCardsRef = useRef<(HTMLDivElement | null)[]>([]);

  const filteredProjects = useMemo(() => {
    return projects
      .filter((project) => {
        const matchesSearch =
          project.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          project.author.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory =
          !selectedCategory || project.category === selectedCategory;
        return matchesSearch && matchesCategory;
      })
      .sort((a, b) => b.likes - a.likes);
  }, [searchQuery, selectedCategory]);

  const filteredProfiles = useMemo(() => {
    return creatorProfiles.filter((profile) => {
      const q = searchQuery.toLowerCase();
      return (
        profile.name.toLowerCase().includes(q) ||
        profile.role.toLowerCase().includes(q) ||
        profile.category.toLowerCase().includes(q)
      );
    });
  }, [searchQuery]);

  const displayedProjects = useMemo(() => {
    return filteredProjects.slice(0, visibleProjects);
  }, [filteredProjects, visibleProjects]);

  const hasMore = visibleProjects < filteredProjects.length;

  // Infinite scroll with Intersection Observer
  useEffect(() => {
    if (!loadMoreRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoading && hasMore) {
          setIsLoading(true);
          // Simulate loading delay
          setTimeout(() => {
            setVisibleProjects((prev) => prev + 5);
            setIsLoading(false);
          }, 500);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [hasMore, isLoading]);

  // Reset visible projects when filter changes
  useEffect(() => {
    setVisibleProjects(10);
  }, [searchQuery, selectedCategory]);

  // 프로필 카드 - ProjectsGrid와 완전히 동일한 패턴
  useEffect(() => {
    if (!profileGridRef.current || activeTab !== "profile") return;

    const cards = profileCardsRef.current.filter(Boolean) as HTMLDivElement[];
    const animations = cards.map((card, index) => {
      card.style.opacity = "0";
      card.style.transform = "translateY(16px)";

      const animation = card.animate(
        [
          { opacity: 0, transform: "translateY(16px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 500,
          delay: index * 60,
          easing: "cubic-bezier(0.22, 1, 0.36, 1)",
          fill: "forwards",
        }
      );

      animation.onfinish = () => {
        card.style.opacity = "1";
        card.style.transform = "translateY(0)";
      };

      return animation;
    });

    return () => animations.forEach((animation) => animation.cancel());
  }, [activeTab, filteredProfiles]);


  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navigation />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="mb-5 rounded-2xl border border-[#E6E8EB] bg-white px-3 py-3 shadow-[0_12px_30px_-22px_rgba(15,23,42,0.35)]">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              className="h-10 rounded-lg border-[#E6E8EB] bg-[#FAFBFC] px-3 text-sm text-[#1F2328] hover:bg-[#F3F6F9]"
            >
              <SlidersHorizontal className="size-4" />
              필터
            </Button>
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#98A2B3]" />
              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                className="h-10 rounded-lg border-[#E6E8EB] bg-[#FAFBFC] pl-9 pr-3 text-sm placeholder:text-[#98A2B3]"
                placeholder="Behance에서 검색..."
              />
            </div>
            <ToggleGroup
              type="single"
              value={activeTab}
              onValueChange={(value) => value && setActiveTab(value)}
              className="rounded-xl border-2 border-[#E6E8EB] bg-[#F3F6F9] p-1 gap-1"
            >
              <ToggleGroupItem
                value="feed"
                className="h-9 rounded-lg px-4 text-sm font-medium text-[#6B7280] flex items-center gap-1.5 transition-all data-[state=on]:bg-gradient-to-r data-[state=on]:from-[#00C9A7] data-[state=on]:to-[#00A88C] data-[state=on]:text-white data-[state=on]:shadow-md data-[state=on]:font-semibold"
              >
                <LayoutGrid className="size-3.5" />
                피드
              </ToggleGroupItem>
              <ToggleGroupItem
                value="profile"
                className="h-9 rounded-lg px-4 text-sm font-medium text-[#6B7280] flex items-center gap-1.5 transition-all data-[state=on]:bg-gradient-to-r data-[state=on]:from-[#00C9A7] data-[state=on]:to-[#00A88C] data-[state=on]:text-white data-[state=on]:shadow-md data-[state=on]:font-semibold"
              >
                <Users className="size-3.5" />
                프로필
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        </div>

        {activeTab === "feed" && (
          <CategoryButtons 
            categories={categories} 
            selectedCategory={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        )}

        {/* 피드 탭: Projects Grid */}
        {activeTab === "feed" && (
          filteredProjects.length > 0 ? (
            <>
              <ProjectsGrid projects={displayedProjects} />
              <div ref={loadMoreRef} className="flex justify-center py-8">
                {isLoading && hasMore && (
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-5 h-5 border-2 border-gray-300 border-t-[#00C9A7] rounded-full animate-spin" />
                    <span className="text-sm">더 불러오는 중...</span>
                  </div>
                )}
                {!hasMore && displayedProjects.length > 0 && (
                  <p className="text-sm text-gray-400">모든 작품을 불러왔습니다</p>
                )}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <ImageOff className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {selectedCategory 
                  ? `"${selectedCategory}" 카테고리의 작품이 없습니다`
                  : searchQuery 
                    ? `"${searchQuery}" 검색 결과가 없습니다`
                    : "표시할 작품이 없습니다"
                }
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                {selectedCategory 
                  ? "다른 카테고리를 선택하시거나, 검색어를 변경해보세요."
                  : "다른 검색어를 입력하거나, 필터를 초기화해보세요."
                }
              </p>
              {(selectedCategory || searchQuery) && (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSelectedCategory(null);
                    setSearchQuery("");
                  }}
                  className="rounded-full border-[#00C9A7] text-[#00A88C] hover:bg-[#00C9A7]/10"
                >
                  필터 초기화
                </Button>
              )}
            </div>
          )
        )}

        {/* 프로필 탭: Creator Profiles Grid */}
        {activeTab === "profile" && (
          filteredProfiles.length > 0 ? (
            <>
              <div className="mb-4 flex items-center gap-2">
                <Users className="size-4 text-[#00C9A7]" />
                <span className="text-sm font-semibold text-[#374151]">
                  크리에이터 {filteredProfiles.length}명
                </span>
                {searchQuery && (
                  <span className="text-sm text-gray-500">
                    — &quot;{searchQuery}&quot; 검색 결과
                  </span>
                )}
              </div>
              <div ref={profileGridRef} className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 mb-8">
                {filteredProfiles.map((profile, index) => (
                  <div
                    key={profile.id}
                    ref={(el) => { profileCardsRef.current[index] = el; }}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-[#00C9A7] will-change-transform"
                  >
                    {/* 배너 */}
                    <div className="h-24 relative overflow-hidden">
                      <ImageWithFallback
                        src={profile.banner}
                        alt={profile.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/30" />
                    </div>
                    {/* 아바타 */}
                    <div className="relative px-4 pb-4">
                      <div className="-mt-7 mb-3">
                        <ImageWithFallback
                          src={profile.avatar}
                          alt={profile.name}
                          className="size-14 rounded-full ring-4 ring-white shadow-md group-hover:ring-[#00C9A7]/40 transition-all"
                        />
                      </div>
                      <div className="mb-2">
                        <h3 className="font-bold text-[#0F0F0F] text-sm group-hover:text-[#00A88C] transition-colors">
                          {profile.name}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">{profile.role}</p>
                        <span className="inline-block mt-1.5 text-[10px] font-semibold bg-[#A8F0E4]/30 text-[#00A88C] px-2 py-0.5 rounded-full">
                          {profile.category}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 line-clamp-2 mb-3 leading-relaxed">
                        {profile.bio}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-600 mb-3 px-1">
                        <div className="text-center">
                          <p className="font-bold text-[#0F0F0F] text-sm">{profile.followers}</p>
                          <p className="text-[10px] text-gray-400">팔로워</p>
                        </div>
                        <div className="w-px h-6 bg-gray-200" />
                        <div className="text-center">
                          <p className="font-bold text-[#0F0F0F] text-sm">{profile.works}</p>
                          <p className="text-[10px] text-gray-400">작품</p>
                        </div>
                      </div>
                      <Link to={`/profile/${profile.name}`}>
                        <button className="w-full bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white py-2 rounded-xl text-xs font-semibold hover:shadow-lg hover:scale-[1.02] transition-all">
                          프로필 보기
                        </button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 px-4">
              <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <UserSearch className="w-10 h-10 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">
                {searchQuery ? `"${searchQuery}"에 해당하는 크리에이터가 없습니다` : "크리에이터를 찾을 수 없습니다"}
              </h3>
              <p className="text-sm text-gray-500 text-center max-w-md mb-4">
                다른 이름이나 전문 분야로 검색해보세요.
              </p>
              {searchQuery && (
                <Button 
                  variant="outline" 
                  onClick={() => setSearchQuery("")}
                  className="rounded-full border-[#00C9A7] text-[#00A88C] hover:bg-[#00C9A7]/10"
                >
                  검색 초기화
                </Button>
              )}
            </div>
          )
        )}
      </div>

      {/* Floating Add Button */}
      <Button className="fixed bottom-8 right-8 bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white size-14 rounded-full hover:shadow-2xl hover:scale-110 transition-all shadow-lg">
        <Plus className="size-6" />
      </Button>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xl mb-2">
                <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
              </div>
              <p className="text-sm text-gray-600">
                창작은 진 세계 창작들의 영감을 연결하고
                <br />
                새로운 시각적 커뮤니티 출현하는 프리미엄 크리에이터를 돕고
                <br />
                즐깁니다.
              </p>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-[#00A88C] transition-colors">이용약관</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">고객센터</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">인재채용</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">비즈니스 문의</a>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            © 2024 pickxel. Crafted for the creative elite.
          </p>
        </div>
      </footer>
    </div>
  );
}
