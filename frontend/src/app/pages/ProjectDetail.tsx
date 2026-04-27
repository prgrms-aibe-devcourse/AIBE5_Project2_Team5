import { useState } from "react";
import { Link, useParams } from "react-router";
import {
  FileText,
  Users,
  Briefcase,
  CheckCircle,
  Star,
  Search,
  TrendingUp,
  MessageSquare,
  Plus,
  Sparkles,
  ChevronRight
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import Navigation from "../components/Navigation";

const styleReferences = [
  {
    id: 1,
    title: "Vibrant Madness",
    artist: "일혁의 디자인",
    image: "https://images.unsplash.com/photo-1705254613735-1abb457f8a60?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGNvbG9yZnVsJTIwYXJ0fGVufDF8fHx8MTc3NTcwMTMyNHww&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "PICKED"
  },
  {
    id: 2,
    title: "Vibrant Glass",
    artist: "렘런더 스튜디오",
    image: "https://images.unsplash.com/photo-1763615445655-5e1fc4c549d4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYXN0ZWwlMjBncmFkaWVudCUyMGRlc2lnbnxlbnwxfHx8fDE3NzU3MjEyMzl8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 3,
    title: "Quiet Luxury",
    artist: "가윤아트 스튜디오",
    image: "https://images.unsplash.com/photo-1639405069836-f82aa6dcb900?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBibGFjayUyMGx1eHVyeXxlbnwxfHx8fDE3NzU3MjEyNDB8MA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "RECENT"
  },
  {
    id: 4,
    title: "Neo Minimalism",
    artist: "레이디 디자인랩",
    image: "https://images.unsplash.com/photo-1602128110234-2d11c0aaadfe?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsaXN0JTIwYXJjaGl0ZWN0dXJlfGVufDF8fHx8MTc3NTcxNzU3MXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

const categories = [
  { id: "branding", label: "브랜딩", color: "bg-[#4DD4AC] text-black" },
  { id: "uiux", label: "UI/UX 디자인", color: "bg-gray-100 text-gray-700" },
  { id: "typography", label: "타이포그래피", color: "bg-gray-100 text-gray-700" },
  { id: "motion", label: "모션 그래픽스", color: "bg-gray-100 text-gray-700" },
  { id: "illustration", label: "일러스트", color: "bg-gray-100 text-gray-700" },
];

export default function ProjectDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState("details");

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="pickxel-animate-page-in max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Left Sidebar */}
          <aside className="w-64 flex-shrink-0">
            <div className="bg-white rounded-2xl p-4 shadow-sm sticky top-8">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-200">
                <div className="w-12 h-12 bg-[#4DD4AC] rounded-lg flex items-center justify-center">
                  <FileText className="size-6 text-black" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">New Project</h3>
                  <p className="text-xs text-gray-500">진행 중</p>
                </div>
              </div>

              <nav className="space-y-1">
                <button
                  onClick={() => setActiveTab("details")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "details"
                      ? "bg-gray-100 text-black font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <FileText className="size-5" />
                  <span className="text-sm">Project Details</span>
                </button>
                <button
                  onClick={() => setActiveTab("team")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "team"
                      ? "bg-gray-100 text-black font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Users className="size-5" />
                  <span className="text-sm">Team</span>
                </button>
                <button
                  onClick={() => setActiveTab("brief")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "brief"
                      ? "bg-gray-100 text-black font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Briefcase className="size-5" />
                  <span className="text-sm">Creative Brief</span>
                </button>
                <button
                  onClick={() => setActiveTab("milestones")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "milestones"
                      ? "bg-gray-100 text-black font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <CheckCircle className="size-5" />
                  <span className="text-sm">Milestones</span>
                </button>
                <button
                  onClick={() => setActiveTab("reviews")}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "reviews"
                      ? "bg-gray-100 text-black font-medium"
                      : "text-gray-600 hover:bg-gray-50"
                  }`}
                >
                  <Star className="size-5" />
                  <span className="text-sm">Reviews</span>
                </button>
              </nav>
            </div>
          </aside>

          {/* Main Content */}
          <main className="flex-1">
            <div className="bg-white rounded-2xl p-8 shadow-sm">
              {/* Header */}
              <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">프로젝트를 시작해볼까요?</h1>
                <p className="text-gray-600">
                  아래의 이름 부들을 채우고 우리가 할일을 말 줍니다니다.
                </p>
              </div>

              {/* Project Title */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3 text-gray-700">
                  프로젝트 이름
                </label>
                <input
                  type="text"
                  defaultValue="예: 브랜드는 아이덴티티 및 레거시 디자인 만들기"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DD4AC] focus:border-transparent"
                />
              </div>

              {/* Description */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3 text-gray-700">
                  스너보및 내용
                </label>
                <textarea
                  rows={4}
                  defaultValue="프로젝트를 통 특송 약시 설명 목적 등 주요 중요 내도를 감당리기 작성해주세요."
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DD4AC] focus:border-transparent resize-none"
                />
              </div>

              {/* Categories */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3 text-gray-700">
                  관련 분야
                </label>
                <div className="flex flex-wrap gap-3 mb-4">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${category.color}`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
                <button className="text-sm text-gray-600 hover:text-black flex items-center gap-1">
                  <Plus className="size-4" />
                  분야 추가하기
                </button>
              </div>

              {/* Style Preferences */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <label className="block text-sm font-medium mb-3 text-gray-700">
                  선호 스타일
                </label>
                <div className="bg-gray-50 rounded-xl p-6 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-black rounded-lg">
                      <Sparkles className="size-5 text-white" />
                    </div>
                    <button className="flex-1 flex items-center gap-2 bg-white px-4 py-3 rounded-lg border border-gray-200 text-left text-gray-500 hover:border-gray-300">
                      <Search className="size-4" />
                      <span className="text-sm">예: 미니말한, 대담한, 미래적, 바른적...</span>
                    </button>
                    <button className="bg-black text-white px-6 py-3 rounded-lg text-sm font-medium hover:bg-gray-800 whitespace-nowrap">
                      구문으로 검색
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {["#Luxury", "#Eyecatchy", "#EcoFriendly"].map((tag) => (
                      <span
                        key={tag}
                        className="bg-white px-3 py-1 rounded-full text-xs text-gray-600 cursor-pointer hover:bg-gray-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                {/* AI Reference Section */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-700">AI 출력 스드료트</h4>
                    <button className="text-sm text-gray-500 hover:text-black">
                      편안조 정재
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-4">
                    {styleReferences.map((ref) => (
                      <div
                        key={ref.id}
                        className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer group"
                      >
                        <div className="relative h-28">
                          <ImageWithFallback
                            src={ref.image}
                            alt={ref.title}
                            className="w-full h-full object-cover"
                          />
                          {ref.badge && (
                            <div className="absolute top-2 right-2 bg-[#4DD4AC] text-black px-2 py-1 rounded text-xs font-bold">
                              {ref.badge}
                            </div>
                          )}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                            <Plus className="size-6 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="p-3">
                          <h5 className="font-bold text-xs mb-1">{ref.title}</h5>
                          <p className="text-xs text-gray-600">{ref.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                  더 찾아보고 전체보기
                </button>
              </div>

              {/* Inspiration Section */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold">인기있는 디자인 스타일</h3>
                  <Link to="#" className="text-sm text-[#4DD4AC] hover:text-[#3BC99A] flex items-center gap-1">
                    레퍼런스 +
                    <ChevronRight className="size-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-4 gap-4">
                  {styleReferences.map((ref) => (
                    <div
                      key={ref.id}
                      className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer"
                    >
                      <div className="relative h-32">
                        <ImageWithFallback
                          src={ref.image}
                          alt={ref.title}
                          className="w-full h-full object-cover"
                        />
                        {ref.badge && (
                          <div className="absolute top-2 left-2 bg-[#4DD4AC] text-black px-2 py-1 rounded text-xs font-bold">
                            ✓
                          </div>
                        )}
                      </div>
                      <div className="p-3">
                        <h5 className="font-bold text-sm mb-1">{ref.title}</h5>
                        <p className="text-xs text-gray-600">{ref.artist}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Budget Section */}
              <div className="pt-8 border-t border-gray-200">
                <h3 className="font-bold mb-6">작업 및 일정</h3>
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 bg-[#4DD4AC] rounded-lg">
                        <TrendingUp className="size-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold mb-1">예상 예산 범위</h4>
                        <p className="text-xs text-gray-600 mb-3">
                          Atelier (가요만 서비스하기 내요 등)
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">₩ 1,000,000</span>
                          <ChevronRight className="size-4 text-gray-400" />
                          <span className="text-sm text-gray-600">₩ 10,000,000+</span>
                        </div>
                        <div className="text-2xl font-bold">₩ 5,500,000</div>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 rounded-xl p-6">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-[#4DD4AC] rounded-lg">
                        <MessageSquare className="size-5 text-black" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold mb-1">작업요구 기간</h4>
                        <p className="text-xs text-gray-600 mb-3">
                          Atelier (가요만)
                        </p>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm text-gray-600">3 시착 (응용 1 시작)</span>
                        </div>
                        <div className="text-2xl font-bold">3개월 (예상)</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
              <h3 className="font-bold mb-4">프로젝트 요약</h3>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">기한 님앤</span>
                  <span className="font-medium">평균</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">상태 디스크한</span>
                  <span className="font-medium">평균</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">예산 및 일정</span>
                  <span className="font-medium">평균</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">부스트 (48)</span>
                  <span className="font-medium">가속</span>
                </div>
              </div>

              <button className="w-full bg-[#FF6B4A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#FF5539] mb-3">
                프로젝트 게시하기
              </button>

              <p className="text-xs text-gray-500 text-center mb-6">
                이리발은히므 프로젝트 입력의 확인하사람들할 것으로 간주합니다
              </p>

              {/* Quick Tips */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex items-start gap-2 bg-[#4DD4AC]/10 p-4 rounded-lg">
                  <Sparkles className="size-4 text-[#4DD4AC] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold mb-1">작성 도움말</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      버지세이어 예상로스 작업을 업을 많을수록 리 디자이너등 를 말를 빠르게 연기정합니다. 이세스혀기 프로젝트한 허줬합니다.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
