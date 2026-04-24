import { useState } from "react";
import { Link } from "react-router";
import { 
  FileText, 
  Users, 
  Briefcase, 
  CheckCircle, 
  Upload, 
  Sparkles,
  ChevronRight,
  Plus,
  X
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const categories = [
  { id: "branding", label: "브랜딩", color: "bg-[#4DD4AC]" },
  { id: "uiux", label: "UI/UX 디자인", color: "bg-blue-500" },
  { id: "typography", label: "타이포그래피", color: "bg-purple-500" },
  { id: "motion", label: "모션 그래픽스", color: "bg-orange-500" },
  { id: "illustration", label: "일러스트", color: "bg-pink-500" },
];

const aiReferences = [
  {
    id: 1,
    title: "Vibrant Waves",
    artist: "제인스 디자인",
    image: "https://images.unsplash.com/photo-1695671538019-0b45bdb5b608?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHJlZmVyZW5jZXxlbnwxfHx8fDE3NzU3MjA3ODN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "PICKED"
  },
  {
    id: 2,
    title: "Quiet Luxury",
    artist: "가윤아트 스튜디오",
    image: "https://images.unsplash.com/photo-1601110958586-008f807b4957?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ24lMjBpbnNwaXJhdGlvbiUyMG1vb2R8ZW58MXx8fHwxNzc1NzEwMzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 3,
    title: "Neo Minimalism",
    artist: "레이디 디자인랩",
    image: "https://images.unsplash.com/photo-1504237111663-37d6094bec09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwd2ViJTIwZGVzaWdufGVufDF8fHx8MTc3NTcyMDc4NHww&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "RECENT"
  },
];

export default function CreateProject() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectTitle, setProjectTitle] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState("1000000");
  const [maxBudget, setMaxBudget] = useState("10000000");
  const [duration, setDuration] = useState("3개월 (예상)");

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const steps = [
    { id: 1, label: "Project Details", icon: FileText },
    { id: 2, label: "Team", icon: Users },
    { id: 3, label: "Creative Brief", icon: Briefcase },
    { id: 4, label: "Milestones", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/" className="text-2xl font-bold">
            pickxel
          </Link>
          <div className="flex items-center gap-4">
            <button className="text-sm text-gray-600 hover:text-black">
              임시 저장
            </button>
            <button className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
              프로젝트 게시하기
            </button>
            <div className="w-10 h-10 rounded-full bg-gray-200" />
          </div>
        </div>
      </header>

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex gap-8">
          {/* Sidebar */}
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
                {steps.map((step) => {
                  const Icon = step.icon;
                  const isActive = step.id === currentStep;
                  return (
                    <button
                      key={step.id}
                      onClick={() => setCurrentStep(step.id)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-left transition-colors ${
                        isActive
                          ? "bg-gray-100 text-black font-medium"
                          : "text-gray-600 hover:bg-gray-50"
                      }`}
                    >
                      <Icon className="size-5" />
                      <span className="text-sm">{step.label}</span>
                    </button>
                  );
                })}
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
                  아래 내용을 모두 작성 후 우리가 최고의 팀을 보장해드립니다.
                </p>
              </div>

              {/* Project Title */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-2">
                  프로젝트 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="예: 브랜드 아이덴티티 및 패키지 디자인 리뉴얼"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DD4AC] focus:border-transparent"
                />
              </div>

              {/* Categories */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3">
                  관련 분야 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      onClick={() => toggleCategory(category.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        selectedCategories.includes(category.id)
                          ? `${category.color} text-white`
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      {category.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* File Upload */}
              <div className="mb-8">
                <label className="block text-sm font-medium mb-3">
                  파일 첨부
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-[#4DD4AC] transition-colors cursor-pointer">
                  <Upload className="size-8 text-gray-400 mx-auto mb-2" />
                  <p className="text-sm text-gray-600 mb-1">
                    클릭하여 파일을 업로드하거나 드래그 앤 드롭하세요
                  </p>
                  <p className="text-xs text-gray-400">
                    최대 10MB, PDF, JPG, PNG, AI, PSD 파일만 가능합니다
                  </p>
                </div>
              </div>

              {/* AI Reference Section */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <div className="flex items-center gap-2 mb-4">
                  <Sparkles className="size-5 text-[#4DD4AC]" />
                  <h3 className="font-bold">AI 참고자료 제안</h3>
                </div>
                <p className="text-sm text-gray-600 mb-4">
                  대단능력의 AI 기반 시스템이 당신의 프로젝트와 어울리는 작품 스타일이나 논의후 오드리므 준입니다.
                </p>

                <div className="bg-gray-50 rounded-xl p-6 mb-4">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-white rounded-lg">
                      <Sparkles className="size-5 text-[#4DD4AC]" />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="예: 미니말한, 대담한, 미래적, 바른적..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-[#4DD4AC] focus:border-transparent"
                      />
                    </div>
                    <button className="bg-black text-white px-6 py-2 rounded-lg text-sm font-medium hover:bg-gray-800">
                      검색하여 상세
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

                {/* Reference Cards */}
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-3">AI 추천 레퍼런스</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {aiReferences.map((ref) => (
                      <div
                        key={ref.id}
                        className="bg-white rounded-lg overflow-hidden border border-gray-200 hover:shadow-lg transition-shadow cursor-pointer group"
                      >
                        <div className="relative h-32">
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
                            <Plus className="size-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                          </div>
                        </div>
                        <div className="p-3">
                          <h5 className="font-bold text-sm mb-1">{ref.title}</h5>
                          <p className="text-xs text-gray-600">{ref.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-gray-200">
                  더 많으면, 전체보기
                </button>
              </div>

              {/* Budget Section */}
              <div className="mb-8">
                <h3 className="font-bold mb-4">예산 및 일정</h3>
                
                <div className="grid grid-cols-2 gap-6 mb-6">
                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#4DD4AC]">
                      예상 최저 금액
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={`₩ ${parseInt(minBudget).toLocaleString()}`}
                        onChange={(e) => setMinBudget(e.target.value.replace(/[^0-9]/g, ""))}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DD4AC] focus:border-transparent"
                      />
                      <ChevronRight className="size-5 text-gray-400" />
                      <input
                        type="text"
                        value={`₩ ${parseInt(maxBudget).toLocaleString()}`}
                        onChange={(e) => setMaxBudget(e.target.value.replace(/[^0-9]/g, ""))}
                        className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DD4AC] focus:border-transparent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2 text-[#4DD4AC]">
                      작업 완료 기한
                    </label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#4DD4AC] focus:border-transparent"
                    >
                      <option>1개월 (예상)</option>
                      <option>2개월 (예상)</option>
                      <option>3개월 (예상)</option>
                      <option>4개월 (예상)</option>
                      <option>6개월 이상</option>
                    </select>
                  </div>
                </div>

                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600">예산 범위 (원)</span>
                    <span className="font-bold text-lg">₩ {parseInt(minBudget).toLocaleString()} - ₩ {parseInt(maxBudget).toLocaleString()}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">작업 기간 (월)</span>
                    <span className="font-bold text-lg">{duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Right Sidebar */}
          <aside className="w-80 flex-shrink-0">
            <div className="bg-white rounded-2xl p-6 shadow-sm sticky top-8">
              <h3 className="font-bold mb-4">프로젝트 요약</h3>
              
              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">기본 정보</span>
                  <span className="font-medium">
                    {projectTitle ? "완료" : "미완"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">상태 보관함</span>
                  <span className="font-medium">
                    {selectedCategories.length > 0 ? "완료" : "미완"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">비용 및 일정</span>
                  <span className="font-medium">완료</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">부노드 (48)</span>
                  <span className="font-medium">선택</span>
                </div>
              </div>

              <button className="w-full bg-[#FF6B4A] text-white px-6 py-3 rounded-lg font-medium hover:bg-[#FF5539] mb-4">
                프로젝트 게시하기
              </button>

              <p className="text-xs text-gray-500 text-center">
                업로드시 이 프로젝트가 공개됩니다!약관에 동의했을 것으로 간주합니다.
              </p>

              {/* Quick Hints */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="flex items-start gap-2">
                  <Sparkles className="size-4 text-[#4DD4AC] flex-shrink-0 mt-1" />
                  <div>
                    <h4 className="text-sm font-bold mb-1">제안 보기</h4>
                    <p className="text-xs text-gray-600 leading-relaxed">
                      여기에 명시한 크리에이터 디테일이 많을수록 적합한 디자이너를 빠르게 찾을 것입니다. 상세한 프로젝트 정합니다.
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
