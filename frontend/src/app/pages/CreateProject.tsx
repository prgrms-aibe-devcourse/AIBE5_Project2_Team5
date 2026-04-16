import { useState } from "react";
import { Link } from "react-router";
import {
  Briefcase,
  CheckCircle,
  ChevronRight,
  FileText,
  Plus,
  Sparkles,
  Upload,
  Users,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const categories = [
  { id: "branding", label: "브랜딩", color: "bg-[#4DD4AC]" },
  { id: "uiux", label: "UI/UX 디자인", color: "bg-blue-500" },
  { id: "typography", label: "타이포그래피", color: "bg-purple-500" },
  { id: "motion", label: "모션 그래픽", color: "bg-orange-500" },
  { id: "illustration", label: "일러스트", color: "bg-pink-500" },
];

const aiReferences = [
  {
    id: 1,
    title: "Vibrant Waves",
    artist: "신예 디자이너",
    image:
      "https://images.unsplash.com/photo-1695671538019-0b45bdb5b608?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHJlZmVyZW5jZXxlbnwxfHx8fDE3NzU3MjA3ODN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "PICKED",
  },
  {
    id: 2,
    title: "Quiet Luxury",
    artist: "가드아트 스튜디오",
    image:
      "https://images.unsplash.com/photo-1601110958586-008f807b4957?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkZXNpZ24lMjBpbnNwaXJhdGlvbiUyMG1vb2R8ZW58MXx8fHwxNzc1NzEwMzkzfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 3,
    title: "Neo Minimalism",
    artist: "에이전시 노트",
    image:
      "https://images.unsplash.com/photo-1504237111663-37d6094bec09?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtaW5pbWFsJTIwd2ViJTIwZGVzaWdufGVufDF8fHx8MTc3NTcyMDc4NHww&ixlib=rb-4.1.0&q=80&w=1080",
    badge: "RECENT",
  },
];

const durationOptions = ["1개월 예상", "2개월 예상", "3개월 예상", "4개월 예상", "6개월 이상"];

export default function CreateProject() {
  const [currentStep, setCurrentStep] = useState(1);
  const [projectTitle, setProjectTitle] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [minBudget, setMinBudget] = useState("1000000");
  const [maxBudget, setMaxBudget] = useState("10000000");
  const [duration, setDuration] = useState("3개월 예상");

  const toggleCategory = (categoryId: string) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter((id) => id !== categoryId));
      return;
    }

    setSelectedCategories([...selectedCategories, categoryId]);
  };

  const formatWon = (value: string) => {
    const numericValue = Number(value || 0);
    return `₩ ${numericValue.toLocaleString("ko-KR")}`;
  };

  const steps = [
    { id: 1, label: "프로젝트 개요", icon: FileText },
    { id: 2, label: "팀 구성", icon: Users },
    { id: 3, label: "크리에이티브 브리프", icon: Briefcase },
    { id: 4, label: "마일스톤", icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <Link to="/" className="text-2xl font-bold">
            <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el
            <span className="text-[#FF5C3A]">.</span>
          </Link>

          <div className="flex items-center gap-4">
            <button type="button" className="text-sm text-gray-600 hover:text-black">
              임시 저장
            </button>
            <button
              type="button"
              className="rounded-lg bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              프로젝트 게시하기
            </button>
            <div className="h-10 w-10 rounded-full bg-gray-200" />
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-[1400px] px-6 py-8">
        <div className="flex gap-8">
          <aside className="w-64 flex-shrink-0">
            <div className="sticky top-8 rounded-2xl bg-white p-4 shadow-sm">
              <div className="mb-6 flex items-center gap-3 border-b border-gray-200 pb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-[#4DD4AC]">
                  <FileText className="size-6 text-black" />
                </div>
                <div>
                  <h3 className="text-sm font-bold">New Project</h3>
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
                      type="button"
                      onClick={() => setCurrentStep(step.id)}
                      className={`flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors ${
                        isActive
                          ? "bg-gray-100 font-medium text-black"
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

          <main className="flex-1">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-8">
                <h1 className="mb-2 text-3xl font-bold">프로젝트를 시작해볼까요?</h1>
                <p className="text-gray-600">
                  프로젝트 기본 정보와 참고 자료를 정리하면 더 잘 맞는 디자이너를 빠르게 찾을 수 있습니다.
                </p>
              </div>

              <div className="mb-8">
                <label className="mb-2 block text-sm font-medium">
                  프로젝트 이름 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={projectTitle}
                  onChange={(e) => setProjectTitle(e.target.value)}
                  placeholder="예: 브랜드 아이덴티티 및 패키지 디자인 리뉴얼"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#4DD4AC]"
                />
              </div>

              <div className="mb-8">
                <label className="mb-3 block text-sm font-medium">
                  관련 분야 <span className="text-red-500">*</span>
                </label>
                <div className="flex flex-wrap gap-3">
                  {categories.map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      onClick={() => toggleCategory(category.id)}
                      className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
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

              <div className="mb-8">
                <label className="mb-3 block text-sm font-medium">파일 첨부</label>
                <div className="cursor-pointer rounded-lg border-2 border-dashed border-gray-300 p-8 text-center transition-colors hover:border-[#4DD4AC]">
                  <Upload className="mx-auto mb-2 size-8 text-gray-400" />
                  <p className="mb-1 text-sm text-gray-600">
                    클릭하여 파일을 업로드하거나 드래그 앤 드롭하세요.
                  </p>
                  <p className="text-xs text-gray-400">
                    최대 10MB, PDF, JPG, PNG, AI, PSD 파일을 지원합니다.
                  </p>
                </div>
              </div>

              <div className="mb-8 border-b border-gray-200 pb-8">
                <div className="mb-4 flex items-center gap-2">
                  <Sparkles className="size-5 text-[#4DD4AC]" />
                  <h3 className="font-bold">AI 참고자료 제안</h3>
                </div>
                <p className="mb-4 text-sm text-gray-600">
                  AI가 프로젝트 성격에 맞는 레퍼런스 무드와 스타일 방향을 추천해드립니다.
                </p>

                <div className="mb-4 rounded-xl bg-gray-50 p-6">
                  <div className="mb-4 flex items-center gap-3">
                    <div className="rounded-lg bg-white p-2">
                      <Sparkles className="size-5 text-[#4DD4AC]" />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        placeholder="예: 미니멀한, 대담한, 미래적인, 브랜드 중심..."
                        className="w-full rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#4DD4AC]"
                      />
                    </div>
                    <button
                      type="button"
                      className="rounded-lg bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
                    >
                      검색하기
                    </button>
                  </div>

                  <div className="flex gap-2">
                    {["#Luxury", "#Eyecatchy", "#EcoFriendly"].map((tag) => (
                      <span
                        key={tag}
                        className="cursor-pointer rounded-full bg-white px-3 py-1 text-xs text-gray-600 hover:bg-gray-100"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mb-4">
                  <h4 className="mb-3 text-sm font-medium">AI 추천 레퍼런스</h4>
                  <div className="grid grid-cols-3 gap-4">
                    {aiReferences.map((ref) => (
                      <div
                        key={ref.id}
                        className="group cursor-pointer overflow-hidden rounded-lg border border-gray-200 bg-white transition-shadow hover:shadow-lg"
                      >
                        <div className="relative h-32">
                          <ImageWithFallback
                            src={ref.image}
                            alt={ref.title}
                            className="h-full w-full object-cover"
                          />
                          {ref.badge && (
                            <div className="absolute right-2 top-2 rounded bg-[#4DD4AC] px-2 py-1 text-xs font-bold text-black">
                              {ref.badge}
                            </div>
                          )}
                          <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
                            <Plus className="size-8 text-white opacity-0 transition-opacity group-hover:opacity-100" />
                          </div>
                        </div>
                        <div className="p-3">
                          <h5 className="mb-1 text-sm font-bold">{ref.title}</h5>
                          <p className="text-xs text-gray-600">{ref.artist}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  className="w-full rounded-lg bg-gray-100 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-200"
                >
                  전체 레퍼런스 보기
                </button>
              </div>

              <div className="mb-8">
                <h3 className="mb-4 font-bold">예산 및 일정</h3>

                <div className="mb-6 grid gap-6 lg:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4DD4AC]">예상 예산 범위</label>
                    <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                      <input
                        type="text"
                        value={formatWon(minBudget)}
                        onChange={(e) => setMinBudget(e.target.value.replace(/[^0-9]/g, ""))}
                        className="min-w-0 rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#4DD4AC]"
                      />
                      <ChevronRight className="hidden size-5 text-gray-400 sm:block" />
                      <input
                        type="text"
                        value={formatWon(maxBudget)}
                        onChange={(e) => setMaxBudget(e.target.value.replace(/[^0-9]/g, ""))}
                        className="min-w-0 rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#4DD4AC]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-medium text-[#4DD4AC]">작업 완료 기한</label>
                    <select
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#4DD4AC]"
                    >
                      {durationOptions.map((option) => (
                        <option key={option} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="mb-2 flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-600">예산 범위 (원)</span>
                    <span className="text-right text-lg font-bold">
                      {formatWon(minBudget)} - {formatWon(maxBudget)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-sm text-gray-600">작업 기간</span>
                    <span className="text-right text-lg font-bold">{duration}</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          <aside className="w-80 flex-shrink-0">
            <div className="sticky top-8 rounded-2xl bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-bold">프로젝트 요약</h3>

              <div className="mb-6 space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">기본 정보</span>
                  <span className="font-medium">{projectTitle ? "완료" : "미완료"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">카테고리 선택</span>
                  <span className="font-medium">{selectedCategories.length > 0 ? "완료" : "미완료"}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">예산 및 일정</span>
                  <span className="font-medium">완료</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">추천 디자이너</span>
                  <span className="font-medium">준비 중</span>
                </div>
              </div>

              <button
                type="button"
                className="mb-4 w-full rounded-lg bg-[#FF6B4A] px-6 py-3 font-medium text-white hover:bg-[#FF5539]"
              >
                프로젝트 게시하기
              </button>

              <p className="text-center text-xs text-gray-500">
                게시 후에는 프로젝트가 공개되며, 플랫폼 이용 정책에 동의한 것으로 간주됩니다.
              </p>

              <div className="mt-6 border-t border-gray-200 pt-6">
                <div className="flex items-start gap-2">
                  <Sparkles className="mt-1 size-4 flex-shrink-0 text-[#4DD4AC]" />
                  <div>
                    <h4 className="mb-1 text-sm font-bold">작성 팁</h4>
                    <p className="text-xs leading-relaxed text-gray-600">
                      프로젝트 목적과 원하는 스타일을 구체적으로 적을수록 적합한 디자이너 제안을 더 빨리 받을 수 있습니다.
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
