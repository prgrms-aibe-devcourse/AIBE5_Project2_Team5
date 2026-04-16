import Navigation from "../components/Navigation";
import {
  Clock, Users, Bookmark, ArrowRight, Search,
  LayoutList, LayoutGrid, AlertTriangle, CheckCircle,
  Pencil, Ban, Eye, Briefcase, ClipboardList,
} from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Link } from "react-router";
import { useState, useMemo, useEffect } from "react";

interface ProjectClient {
  name: string;
  avatar: string;
  verified: boolean;
}

interface ProjectData {
  id: number;
  badge: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  client: ProjectClient;
  category: string;
  skills: string[];
  budget: string;
  duration: string;
  deadline: string;
  applicants: number;
  remote: boolean;
  imageUrl: string;
}

const projectsData: ProjectData[] = [
  {
    id: 1,
    badge: "급구",
    priority: "high",
    title: "핀테크 모바일 앱 UI/UX 고도화 프로젝트",
    description: "기존 금융 서비스 앱의 사용자 경험을 전면 재설계합니다. 복잡한 금융 데이터를 직관적으로 시각화하고 신규 기능 온보딩 플로우를 개선해주실 UX 디자이너를 찾습니다.",
    client: { name: "NextStep Labs", avatar: "https://i.pravatar.cc/40?img=11", verified: true },
    category: "UI/UX",
    skills: ["Figma", "Prototyping", "User Research"],
    budget: "1,200만 ~ 1,800만 원",
    duration: "2개월",
    deadline: "2026-04-20",
    applicants: 12,
    remote: true,
    imageUrl: "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  },
  {
    id: 2,
    badge: "모집중",
    priority: "medium",
    title: "글로벌 SaaS 브랜드 아이덴티티 리뉴얼",
    description: "B2B SaaS 플랫폼의 브랜드 아이덴티티를 글로벌 시장에 맞게 전면 재정립합니다. 로고, 컬러 시스템, 타이포그래피, 모션 가이드라인 포함.",
    client: { name: "Orion Cloud", avatar: "https://i.pravatar.cc/40?img=22", verified: true },
    category: "브랜딩",
    skills: ["Brand Identity", "Illustrator", "Typography"],
    budget: "800만 ~ 1,200만 원",
    duration: "6주",
    deadline: "2026-05-10",
    applicants: 8,
    remote: false,
    imageUrl: "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  },
  {
    id: 3,
    badge: "검토중",
    priority: "low",
    title: "제품 글로벌 런칭 3D 모션 영상 제작",
    description: "신제품 글로벌 런칭 캠페인을 위한 60초 분량의 프리미엄 3D 모션 그래픽 영상을 제작합니다. Cinema 4D 및 After Effects 전문가 우대.",
    client: { name: "APEX Studio", avatar: "https://i.pravatar.cc/40?img=33", verified: false },
    category: "모션/영상",
    skills: ["Cinema 4D", "After Effects", "3D Modeling"],
    budget: "1,500만 ~ 2,500만 원",
    duration: "3개월",
    deadline: "2026-06-30",
    applicants: 5,
    remote: true,
    imageUrl: "https://images.unsplash.com/photo-1740174459691-5b93c2fa0592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  },
  {
    id: 4,
    badge: "급구",
    priority: "high",
    title: "e커머스 플랫폼 메인 배너 일러스트 시리즈",
    description: "시즌별 판촉 캠페인에 활용할 감성적인 일러스트 배너 시리즈 12종을 제작합니다. 따뜻하고 감각적인 스타일 선호.",
    client: { name: "Bloom Market", avatar: "https://i.pravatar.cc/40?img=44", verified: true },
    category: "일러스트",
    skills: ["Illustration", "Procreate", "Adobe Fresco"],
    budget: "500만 ~ 700만 원",
    duration: "4주",
    deadline: "2026-04-22",
    applicants: 21,
    remote: true,
    imageUrl: "https://images.unsplash.com/photo-1618004912476-29818d81ae2e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  },
  {
    id: 5,
    badge: "모집중",
    priority: "medium",
    title: "엔터프라이즈 대시보드 UI 컴포넌트 라이브러리",
    description: "복잡한 데이터 시각화가 필요한 기업용 대시보드의 디자인 시스템 및 컴포넌트 라이브러리를 구축합니다. Figma + Storybook 연동 경험 필수.",
    client: { name: "DataPulse Inc.", avatar: "https://i.pravatar.cc/40?img=55", verified: true },
    category: "UI/UX",
    skills: ["Design System", "Figma", "Storybook"],
    budget: "2,000만 ~ 3,000만 원",
    duration: "4개월",
    deadline: "2026-05-25",
    applicants: 7,
    remote: false,
    imageUrl: "https://images.unsplash.com/photo-1551288049-bebda4e38f71?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  },
  {
    id: 6,
    badge: "모집중",
    priority: "medium",
    title: "패션 브랜드 룩북 포토그래피 & 리터칭",
    description: "SS 시즌 신제품 룩북 촬영 및 전문 리터칭 작업입니다. 미니멀하고 감각적인 패션 필름 감성을 구현할 포토그래퍼를 찾습니다.",
    client: { name: "Maison Elite", avatar: "https://i.pravatar.cc/40?img=66", verified: true },
    category: "포토그래피",
    skills: ["Photography", "Lightroom", "Retouching"],
    budget: "400만 ~ 600만 원",
    duration: "3주",
    deadline: "2026-05-05",
    applicants: 14,
    remote: false,
    imageUrl: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
  },
];

const CATEGORIES = ["UI/UX", "브랜딩", "일러스트", "모션/영상", "3D", "포토그래피", "그래픽 디자인"];
const PROJECT_TYPES = ["단기 (1개월 이내)", "중기 (1-3개월)", "장기 (3개월+)", "상주"];
const EXPERIENCE_LEVELS = ["신입 가능", "3년 이상", "5년 이상", "시니어"];

function getDday(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

function DdayBar({ deadline }: { deadline: string }) {
  const d = getDday(deadline);
  const pct = d <= 0 ? 0 : Math.min(d, 30) / 30 * 100;
  const color = d <= 0 ? "bg-gray-300" : d <= 7 ? "bg-red-400" : d <= 14 ? "bg-orange-400" : "bg-[#00C9A7]";
  const label = d <= 0 ? "마감됨" : `D-${d}`;
  const labelColor = d <= 0 ? "text-gray-400" : d <= 7 ? "text-red-500" : d <= 14 ? "text-orange-500" : "text-[#00A88C]";
  return (
    <div className="flex flex-col gap-0.5 min-w-[80px]">
      <div className="flex items-center justify-between">
        <span className={`text-[10px] font-bold ${labelColor} flex items-center gap-0.5`}>
          {d > 0 && d <= 3 && <AlertTriangle className="size-2.5" />}
          {label}
        </span>
        <span className="text-[9px] text-gray-300">마감</span>
      </div>
      <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all ${color} ${d <= 3 && d > 0 ? "animate-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}

function ApplicantDots({ count }: { count: number }) {
  const MAX = 20;
  const DOTS = 10;
  const filled = Math.round(Math.min(count, MAX) / MAX * DOTS);
  const dotColor = count >= 16 ? "bg-red-400" : count >= 10 ? "bg-orange-400" : "bg-[#00C9A7]";
  return (
    <div className="flex flex-col gap-0.5">
      <div className="flex items-center justify-between">
        <span className="text-[9px] text-gray-400">경쟁률</span>
        <span className="text-[10px] font-bold text-gray-600">{count}명</span>
      </div>
      <div className="flex gap-0.5">
        {Array.from({ length: DOTS }).map((_, i) => (
          <span key={i} className={`w-2 h-2 rounded-full ${i < filled ? dotColor : "bg-gray-100"}`} />
        ))}
      </div>
    </div>
  );
}

function PriorityBadge({ badge, priority }: { badge: string; priority: string }) {
  const styles: Record<string, string> = {
    high: "bg-[#FF5C3A]/10 text-[#FF5C3A] border border-[#FF5C3A]/30",
    medium: "bg-[#00C9A7]/10 text-[#00A88C] border border-[#00C9A7]/30",
    low: "bg-amber-50 text-amber-600 border border-amber-200",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold ${styles[priority]}`}>
      {priority === "high" && <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A] animate-pulse" />}
      {badge}
    </span>
  );
}

// ── Mock data for role-based sidebar ──
const myPostedProjects = [
  { id: 1, title: "핀테크 앱 UI/UX 고도화", status: "모집중" as const, applicants: 12, deadline: "2026-04-20" },
  { id: 4, title: "e커머스 배너 일러스트", status: "마감" as const, applicants: 21, deadline: "2026-04-22" },
  { id: 5, title: "대시보드 컴포넌트 라이브러리", status: "모집중" as const, applicants: 7, deadline: "2026-05-25" },
];

const myApplications = [
  { id: 2, title: "글로벌 SaaS 브랜드 리뉴얼", stage: 2, result: "pending" as const },
  { id: 6, title: "패션 브랜드 룩북 포토그래피", stage: 3, result: "accepted" as const },
  { id: 3, title: "3D 모션 영상 제작", stage: 1, result: "rejected" as const },
];
// stage: 1=서류검토, 2=면접, 3=최종결과
// result: pending | accepted | rejected

export default function Projects() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedExperience, setSelectedExperience] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState("최신순");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [role, setRole] = useState<"designer" | "client">(() => {
    return (localStorage.getItem("dev_role") as "designer" | "client") ?? "designer";
  });
  const [myPosts, setMyPosts] = useState(myPostedProjects);

  useEffect(() => {
    localStorage.setItem("dev_role", role);
  }, [role]);

  const toggleType = (type: string) =>
    setSelectedTypes((prev) => prev.includes(type) ? prev.filter((t) => t !== type) : [...prev, type]);

  const toggleExperience = (level: string) =>
    setSelectedExperience((prev) => prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level]);

  const toggleBookmark = (id: number, e: React.MouseEvent) => {
    e.preventDefault();
    setBookmarked((prev) => prev.includes(id) ? prev.filter((b) => b !== id) : [...prev, id]);
  };

  const filtered = useMemo(() => {
    let list = projectsData.filter((p) => {
      if (selectedCategory && p.category !== selectedCategory) return false;
      return true;
    });
    if (sortBy === "예산순") list = [...list].sort((a, b) => parseInt(b.budget.replace(/\D/g, "")) - parseInt(a.budget.replace(/\D/g, "")));
    if (sortBy === "마감임박순") list = [...list].sort((a, b) => getDday(a.deadline) - getDday(b.deadline));
    return list;
  }, [selectedCategory, sortBy]);

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navigation />

      {/* Hero Banner */}
      <div className="relative bg-gradient-to-br from-[#0F0F0F] via-[#1a1a2e] to-[#0F0F0F] overflow-hidden">
        {/* 배경 글로우 */}
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#00C9A7]/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-[#00C9A7]/5 rounded-full blur-2xl pointer-events-none" />

        <div className="relative max-w-[1400px] mx-auto px-6 py-10">
          <div className="flex items-center justify-between">
            {/* 좌측: 타이틀 + 배지 */}
            <div>
              <div className="inline-flex items-center gap-2 bg-[#00C9A7]/15 border border-[#00C9A7]/30 rounded-full px-3 py-1 mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00C9A7] animate-pulse" />
                <span className="text-[#00C9A7] text-xs font-semibold tracking-wide">LIVE · 프리랜서 매칭 플랫폼</span>
              </div>
              <h1 className="text-4xl font-extrabold text-white mb-2 tracking-tight">역제안 게시판</h1>
              <p className="text-gray-400 text-sm">크리에이터가 먼저 제안하는 새로운 방식의 프로젝트 매칭</p>
            </div>

            {/* 우측: 통계 + CTA + DEV 토글 */}
            <div className="flex flex-col items-end gap-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-5">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{projectsData.length}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">등록 공고</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-white">{CATEGORIES.length}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">카테고리</p>
                  </div>
                  <div className="w-px h-8 bg-white/10" />
                  <div className="text-center">
                    <p className="text-2xl font-bold text-[#00C9A7]">{projectsData.filter((p) => p.priority === "high").length}</p>
                    <p className="text-[11px] text-gray-400 mt-0.5">급구 공고</p>
                  </div>
                </div>
                <Link
                  to="/projects/new"
                  className="bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white px-6 py-3 rounded-xl font-bold text-sm hover:shadow-[0_0_24px_rgba(0,201,167,0.4)] hover:scale-105 transition-all"
                >
                  + 프로젝트 등록
                </Link>
              </div>
              {/* DEV 역할 토글 */}
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-yellow-400 bg-yellow-400/15 border border-yellow-400/30 px-2 py-0.5 rounded-full">DEV</span>
                <div className="flex rounded-lg overflow-hidden border border-white/10">
                  <button
                    onClick={() => setRole("designer")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all ${
                      role === "designer" ? "bg-[#00C9A7] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <span>🎨</span> 디자이너
                  </button>
                  <button
                    onClick={() => setRole("client")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold transition-all ${
                      role === "client" ? "bg-[#00C9A7] text-white" : "bg-white/5 text-gray-400 hover:bg-white/10"
                    }`}
                  >
                    <span>🏢</span> 클라이언트
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-6 py-8 flex gap-6 items-start xl:flex-row flex-col">

        {/* ── Left Sidebar Filter ── */}
        <aside className="w-56 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6">
            <h2 className="font-bold text-sm text-[#0F0F0F] mb-5">Filter</h2>

            {/* Project Type */}
            <div className="mb-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">프로젝트 유형</p>
              <div className="space-y-2.5">
                {PROJECT_TYPES.map((type) => (
                  <label key={type} className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" checked={selectedTypes.includes(type)} onChange={() => toggleType(type)} className="w-4 h-4 rounded border-gray-300 accent-[#00C9A7]" />
                    <span className="text-xs text-gray-600 group-hover:text-[#00A88C] transition-colors">{type}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 my-4" />

            {/* Category */}
            <div className="mb-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">카테고리</p>
              <div className="space-y-2.5">
                {CATEGORIES.map((cat) => (
                  <label key={cat} className="flex items-center justify-between cursor-pointer group">
                    <div className="flex items-center gap-2.5">
                      <input type="checkbox" checked={selectedCategory === cat} onChange={() => setSelectedCategory(selectedCategory === cat ? null : cat)} className="w-4 h-4 rounded border-gray-300 accent-[#00C9A7]" />
                      <span className="text-xs text-gray-600 group-hover:text-[#00A88C] transition-colors">{cat}</span>
                    </div>
                    <span className="text-[10px] text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded-full">
                      {projectsData.filter((p) => p.category === cat).length}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="w-full h-px bg-gray-100 my-4" />

            {/* Experience */}
            <div className="mb-5">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">경험 수준</p>
              <div className="space-y-2.5">
                {EXPERIENCE_LEVELS.map((level) => (
                  <label key={level} className="flex items-center gap-2.5 cursor-pointer group">
                    <input type="checkbox" checked={selectedExperience.includes(level)} onChange={() => toggleExperience(level)} className="w-4 h-4 rounded border-gray-300 accent-[#00C9A7]" />
                    <span className="text-xs text-gray-600 group-hover:text-[#00A88C] transition-colors">{level}</span>
                  </label>
                ))}
              </div>
            </div>

            <button
              onClick={() => { setSelectedCategory(null); setSelectedTypes([]); setSelectedExperience([]); }}
              className="w-full mt-1 text-xs text-gray-400 hover:text-[#00A88C] transition-colors py-1"
            >
              필터 초기화
            </button>
          </div>
        </aside>

        {/* ── Main Content ── */}
        <div className="flex-1 min-w-0">

          {/* List header bar */}
          <div className="flex items-center justify-between mb-4">
            <span className="text-sm text-gray-500">
              공고 <span className="text-[#00A88C] font-bold text-base">{filtered.length}</span>개
            </span>
            <div className="flex items-center gap-2.5">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="text-xs border border-gray-200 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:border-[#00C9A7] cursor-pointer text-gray-600"
              >
                {["최신순", "예산순", "마감임박순"].map((s) => <option key={s}>{s}</option>)}
              </select>
              <div className="flex border border-gray-200 rounded-lg overflow-hidden">
                <button onClick={() => setViewMode("list")} className={`p-1.5 transition-colors ${viewMode === "list" ? "bg-[#00C9A7] text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}>
                  <LayoutList className="size-4" />
                </button>
                <button onClick={() => setViewMode("grid")} className={`p-1.5 transition-colors ${viewMode === "grid" ? "bg-[#00C9A7] text-white" : "bg-white text-gray-400 hover:bg-gray-50"}`}>
                  <LayoutGrid className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Project Cards */}
          <div className={viewMode === "list" ? "space-y-3" : "grid grid-cols-2 gap-4"}>
            {filtered.map((project) => (
              <Link
                key={project.id}
                to={`/projects/${project.id}`}
                className="group block bg-white rounded-2xl border border-gray-100 hover:border-[#00C9A7] hover:shadow-xl transition-all duration-300 overflow-hidden"
              >
                <div className={viewMode === "list" ? "flex items-stretch" : "flex flex-col"}>

                  {/* Grid mode: top image */}
                  {viewMode === "grid" && (
                    <div className="h-40 w-full overflow-hidden">
                      <ImageWithFallback src={project.imageUrl} alt={project.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                  )}

                  {/* Card Content */}
                  <div className="flex-1 p-5 min-w-0">

                    {/* Row 1: client avatar + name + badge + bookmark */}
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <ImageWithFallback
                          src={project.client.avatar}
                          alt={project.client.name}
                          className="size-9 rounded-xl object-cover border border-gray-100 shadow-sm shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-semibold text-gray-700 truncate">{project.client.name}</span>
                            {project.client.verified && <CheckCircle className="size-3 text-[#00C9A7] shrink-0" />}
                          </div>
                          <span className="text-[10px] text-gray-400">{project.category}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <PriorityBadge badge={project.badge} priority={project.priority} />
                        <button onClick={(e) => toggleBookmark(project.id, e)} className="p-1 rounded-lg hover:bg-gray-100 transition-colors">
                          <Bookmark className={`size-4 transition-colors ${bookmarked.includes(project.id) ? "fill-[#00C9A7] text-[#00C9A7]" : "text-gray-300 group-hover:text-gray-400"}`} />
                        </button>
                      </div>
                    </div>

                    {/* Title + Description */}
                    <h3 className="font-bold text-[#0F0F0F] text-base mb-1.5 group-hover:text-[#00A88C] transition-colors line-clamp-1">
                      {project.title}
                    </h3>
                    <p className="text-xs text-gray-500 leading-relaxed mb-3 line-clamp-2">{project.description}</p>

                    {/* Tags */}
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-medium ${project.remote ? "bg-blue-50 text-blue-600" : "bg-gray-50 text-gray-500"}`}>
                        {project.remote ? "🌐 원격" : "🏢 상주"}
                      </span>
                      {project.skills.map((skill) => (
                        <span key={skill} className="text-[10px] px-2 py-0.5 rounded-md bg-[#A8F0E4]/20 text-[#00A88C] font-medium">
                          {skill}
                        </span>
                      ))}
                    </div>

                    {/* Footer: budget · duration | 시각화 지표 | 지원하기 */}
                    <div className="flex items-end justify-between pt-3 border-t border-gray-50 gap-3">
                      <div className="flex flex-col gap-1">
                        <span className="font-bold text-sm text-[#00A88C]">{project.budget}</span>
                        <span className="text-xs text-gray-400 flex items-center gap-1">
                          <Clock className="size-3" />{project.duration}
                        </span>
                      </div>
                      <div className="flex items-end gap-4">
                        <ApplicantDots count={project.applicants} />
                        <DdayBar deadline={project.deadline} />
                        <span className="flex items-center gap-0.5 text-xs font-semibold text-[#00A88C] opacity-0 group-hover:opacity-100 transition-opacity pb-0.5">
                          지원하기 <ArrowRight className="size-3" />
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* List mode: right thumbnail image */}
                  {viewMode === "list" && (
                    <div className="w-36 shrink-0 overflow-hidden">
                      <ImageWithFallback
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <Search className="size-7 text-gray-400" />
              </div>
              <p className="font-semibold text-gray-600 mb-1">검색 결과가 없습니다</p>
              <p className="text-sm text-gray-400">다른 키워드나 필터를 시도해보세요</p>
            </div>
          )}
        </div>

        {/* ── Right Sidebar (역할 기반) ── */}
        <aside className="hidden xl:block w-64 shrink-0">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 sticky top-6">
            {role === "client" ? (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <Briefcase className="size-4 text-[#00C9A7]" />
                  <h2 className="font-bold text-sm text-[#0F0F0F]">내 공고 관리</h2>
                  <span className="ml-auto text-[10px] bg-[#00C9A7]/10 text-[#00A88C] px-2 py-0.5 rounded-full font-semibold">{myPosts.length}</span>
                </div>
                <div className="space-y-3">
                  {myPosts.map((post) => {
                    const d = getDday(post.deadline);
                    return (
                      <div key={post.id} className="p-3 rounded-xl border border-gray-100 hover:border-[#00C9A7]/40 transition-all bg-[#FAFBFC]">
                        <div className="flex items-start justify-between gap-1 mb-1.5">
                          <p className="text-xs font-semibold text-[#0F0F0F] line-clamp-2 leading-snug flex-1">{post.title}</p>
                          <span className={`shrink-0 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                            post.status === "모집중" ? "bg-[#00C9A7]/10 text-[#00A88C]" : "bg-gray-100 text-gray-400"
                          }`}>
                            {post.status === "모집중" ? "● 모집중" : "○ 마감"}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-[10px] text-gray-400 mb-2">
                          <span className="flex items-center gap-0.5"><Users className="size-2.5" />{post.applicants}명</span>
                          <span>·</span>
                          <span className={d <= 3 && d > 0 ? "text-red-500 font-semibold" : d <= 7 ? "text-orange-500 font-semibold" : ""}>
                            {d <= 0 ? "마감됨" : `D-${d}`}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          {post.status === "모집중" ? (
                            <>
                              <button className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-[#00A88C] bg-white border border-gray-200 hover:border-[#00C9A7] px-2 py-1 rounded-lg transition-all">
                                <Pencil className="size-2.5" />편집
                              </button>
                              <button
                                onClick={() => setMyPosts((prev) => prev.map((p) => p.id === post.id ? { ...p, status: "마감" as const } : p))}
                                className="flex items-center gap-1 text-[10px] text-gray-500 hover:text-red-500 bg-white border border-gray-200 hover:border-red-200 px-2 py-1 rounded-lg transition-all"
                              >
                                <Ban className="size-2.5" />마감처리
                              </button>
                            </>
                          ) : (
                            <button className="flex items-center gap-1 text-[10px] text-[#00A88C] bg-[#00C9A7]/10 hover:bg-[#00C9A7]/20 px-2 py-1 rounded-lg transition-all">
                              <Eye className="size-2.5" />결과보기
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <Link to="/projects/new" className="mt-4 flex items-center justify-center gap-1.5 w-full py-2 rounded-xl border border-dashed border-[#00C9A7]/40 text-xs text-[#00A88C] hover:bg-[#00C9A7]/5 transition-all">
                  + 새 공고 등록
                </Link>
              </>
            ) : (
              <>
                <div className="flex items-center gap-2 mb-4">
                  <ClipboardList className="size-4 text-[#00C9A7]" />
                  <h2 className="font-bold text-sm text-[#0F0F0F]">내 지원 현황</h2>
                  <span className="ml-auto text-[10px] bg-[#00C9A7]/10 text-[#00A88C] px-2 py-0.5 rounded-full font-semibold">{myApplications.length}</span>
                </div>
                <div className="space-y-3">
                  {myApplications.map((app) => {
                    const stages = ["서류검토", "면접", "최종결과"];
                    const resultLabel = app.result === "accepted" ? "합격 🎉" : app.result === "rejected" ? "불합격" : "검토중";
                    const resultColor = app.result === "accepted" ? "text-[#00A88C] bg-[#00C9A7]/10" : app.result === "rejected" ? "text-gray-400 bg-gray-100" : "text-amber-600 bg-amber-50";
                    return (
                      <div key={app.id} className="p-3 rounded-xl border border-gray-100 bg-[#FAFBFC]">
                        <p className="text-xs font-semibold text-[#0F0F0F] line-clamp-2 leading-snug mb-2">{app.title}</p>
                        {/* 스테이지 진행 바 */}
                        <div className="flex items-center gap-0 mb-2">
                          {stages.map((stage, i) => {
                            const isActive = i < app.stage;
                            const isCurrent = i === app.stage - 1;
                            return (
                              <div key={stage} className="flex items-center flex-1">
                                <div className="flex flex-col items-center gap-0.5 flex-1">
                                  <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] font-bold border-2 ${
                                    isActive && app.result === "accepted" && i === 2 ? "border-[#00C9A7] bg-[#00C9A7] text-white" :
                                    isActive ? "border-[#00C9A7] bg-[#00C9A7] text-white" :
                                    isCurrent ? "border-amber-400 bg-amber-50 text-amber-600" :
                                    "border-gray-200 bg-white text-gray-300"
                                  }`}>
                                    {isActive ? "✓" : i + 1}
                                  </div>
                                  <span className="text-[8px] text-gray-400 text-center leading-tight">{stage}</span>
                                </div>
                                {i < 2 && (
                                  <div className={`h-0.5 w-full mb-3.5 mx-0.5 ${
                                    i < app.stage - 1 ? (app.result === "rejected" && i >= app.stage - 1 ? "bg-gray-200" : "bg-[#00C9A7]") : "bg-gray-200"
                                  }`} />
                                )}
                              </div>
                            );
                          })}
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${resultColor}`}>{resultLabel}</span>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </aside>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-12">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xl mb-2">
                <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
              </div>
              <p className="text-sm text-gray-600">크리에이티브의 가치를 연결하는 공간. pickxel.</p>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-[#00A88C] transition-colors">이용약관</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">고객센터</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">인재채용</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">비즈니스 문의</a>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">© 2024 pickxel. Crafted for the creative elite.</p>
        </div>
      </footer>
    </div>
  );
}
