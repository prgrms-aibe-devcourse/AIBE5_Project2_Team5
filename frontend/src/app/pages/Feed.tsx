import Navigation from "../components/Navigation";
import { Heart, MessageCircle, Bookmark, Share2, X, Send, MoreVertical } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useState } from "react";
import { Link } from "react-router";

const feedItems = [
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
    tags: ["브랜딩", "로고", "아이덴티티"],
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
    tags: ["타이포그래피", "포스터", "그래픽"],
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
    tags: ["UI/UX", "모바일", "앱디자인"],
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
    tags: ["일러스트", "디지털아트", "자연"],
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
    tags: ["패키지", "프리미엄", "화장품"],
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
    tags: ["건축", "사진", "도시"],
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
    tags: ["추상", "아트", "컬러"],
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
    tags: ["제품", "사진", "스튜디오"],
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
    tags: ["3D", "캐릭터", "디지털"],
  },
];

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

export default function Feed() {
  const [selectedFeed, setSelectedFeed] = useState<typeof feedItems[0] | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [likedItems, setLikedItems] = useState<Set<number>>(new Set());
  const [bookmarkedItems, setBookmarkedItems] = useState<Set<number>>(new Set());

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

  const toggleBookmark = (id: number, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setBookmarkedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleShare = (item: typeof feedItems[0], e?: React.MouseEvent) => {
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

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navigation />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Main Feed */}
          <div className="flex-1">
            {/* Feed Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {feedItems.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedFeed(item)}
                  className="bg-white rounded-xl overflow-hidden hover:shadow-xl transition-all border border-gray-100 hover:border-[#A8F0E4] cursor-pointer"
                >
                  {/* Image */}
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <ImageWithFallback
                      src={item.image}
                      alt={item.title}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
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
                    <div className="flex flex-wrap gap-2 mb-4">
                      {item.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-3 py-1 bg-[#A8F0E4]/20 text-[#00A88C] rounded-full text-xs font-medium hover:bg-[#00C9A7] hover:text-[#0F0F0F] cursor-pointer transition-all"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-4">
                        <button
                          onClick={(e) => toggleLike(item.id, e)}
                          className={`flex items-center gap-2 transition-colors ${
                            likedItems.has(item.id) ? "text-[#FF5C3A]" : "text-gray-600 hover:text-[#FF5C3A]"
                          }`}
                        >
                          <Heart className={`size-5 ${likedItems.has(item.id) ? "fill-[#FF5C3A]" : ""}`} />
                          <span className="text-sm">{item.likes + (likedItems.has(item.id) ? 1 : 0)}</span>
                        </button>
                        <button className="flex items-center gap-2 text-gray-600 hover:text-[#00C9A7] transition-colors">
                          <MessageCircle className="size-5" />
                          <span className="text-sm">{item.comments}</span>
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => toggleBookmark(item.id, e)}
                          className={`p-2 rounded-lg transition-all ${
                            bookmarkedItems.has(item.id)
                              ? "bg-[#00C9A7]/90 backdrop-blur-md text-white border border-white/30"
                              : "hover:bg-[#A8F0E4]/20 text-gray-600 hover:text-[#00A88C]"
                          }`}
                        >
                          <Bookmark className={`size-5 ${bookmarkedItems.has(item.id) ? "fill-white" : ""}`} />
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
              ))}
            </div>
          </div>

          {/* Right Sidebar - Following Profiles */}
          <div className="w-80 space-y-4 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto">
            {/* Header */}
            <div className="bg-gradient-to-br from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-lg rounded-xl p-5 shadow-md border border-white/20">
              <h3 className="font-bold text-xl text-white">팔로우한 사람</h3>
              <p className="text-sm text-white/80 mt-1">내가 팔로우 중인 크리에이터</p>
            </div>

            {/* Profiles Content */}
            <div className="space-y-3 pb-4">
              {followingProfiles.map((profile) => (
                <div
                  key={profile.id}
                  className="bg-white rounded-xl p-4 shadow-sm border-2 border-transparent hover:border-[#00C9A7] hover:shadow-lg transition-all group"
                >
                  <div className="flex items-start gap-3 mb-3">
                    <div className="relative">
                      <ImageWithFallback
                        src={profile.avatar}
                        alt={profile.name}
                        className="size-12 rounded-full ring-2 ring-[#00C9A7]/40 group-hover:ring-[#00C9A7] transition-all"
                      />
                      <div className="absolute bottom-0 right-0 size-3.5 bg-[#00C9A7] border-2 border-white rounded-full shadow-sm"></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="font-bold text-sm text-[#0F0F0F] group-hover:text-[#00A88C] transition-colors">{profile.name}</h4>
                      <p className="text-xs text-gray-500">{profile.role}</p>
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
            </div>
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
                  src={selectedFeed.image}
                  alt={selectedFeed.title}
                  className="max-w-full max-h-full object-contain"
                />
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
                      </div>
                    </Link>
                    <div className="flex items-center gap-2">
                      <Link
                        to="/messages"
                        className="bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-md text-white px-4 py-2 rounded-lg text-xs font-semibold hover:shadow-lg transition-all border border-white/30"
                      >
                        제안하기
                      </Link>
                      <button className="p-2 hover:bg-gray-100 rounded-full transition-colors">
                        <MoreVertical className="size-5 text-gray-600" />
                      </button>
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h2 className="font-bold text-xl mb-2">{selectedFeed.title}</h2>
                  <p className="text-sm text-gray-600 mb-3">{selectedFeed.description}</p>

                  {/* Tags */}
                  <div className="flex flex-wrap gap-2">
                    {selectedFeed.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-3 py-1 bg-[#A8F0E4]/30 backdrop-blur-sm text-[#00A88C] rounded-full text-xs font-medium hover:bg-[#00C9A7]/90 hover:backdrop-blur-md hover:text-white cursor-pointer transition-all border border-[#00C9A7]/20"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Actions Bar */}
                <div className="p-4 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <button
                        onClick={(e) => toggleLike(selectedFeed.id, e)}
                        className={`flex items-center gap-2 transition-colors ${
                          likedItems.has(selectedFeed.id) ? "text-[#FF5C3A]" : "text-gray-600 hover:text-[#FF5C3A]"
                        }`}
                      >
                        <Heart className={`size-6 ${likedItems.has(selectedFeed.id) ? "fill-[#FF5C3A]" : ""}`} />
                        <span className="font-semibold">{selectedFeed.likes + (likedItems.has(selectedFeed.id) ? 1 : 0)}</span>
                      </button>
                      <button className="flex items-center gap-2 text-gray-600 hover:text-[#00C9A7] transition-colors">
                        <MessageCircle className="size-6" />
                        <span className="font-semibold">{selectedFeed.comments}</span>
                      </button>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={(e) => toggleBookmark(selectedFeed.id, e)}
                        className={`p-2 rounded-lg transition-all ${
                          bookmarkedItems.has(selectedFeed.id)
                            ? "bg-[#00C9A7]/90 backdrop-blur-md text-white border border-white/30"
                            : "hover:bg-[#A8F0E4]/20 text-gray-600 hover:text-[#00A88C]"
                        }`}
                      >
                        <Bookmark className={`size-5 ${bookmarkedItems.has(selectedFeed.id) ? "fill-white" : ""}`} />
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
                  {mockComments.map((comment) => (
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
                          <p className="text-sm text-gray-800">{comment.content}</p>
                        </div>
                        <button className="text-xs text-gray-500 hover:text-[#00C9A7] mt-1 ml-3 transition-colors">
                          좋아요 {comment.likes}개
                        </button>
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
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder="댓글을 입력하세요..."
                        className="w-full px-4 py-3 pr-12 bg-[#F7F7F5] rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-[#00C9A7] transition-all"
                      />
                      <button 
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-2 bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-md text-white rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed border border-white/30"
                        disabled={!commentText.trim()}
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
    </div>
  );
}