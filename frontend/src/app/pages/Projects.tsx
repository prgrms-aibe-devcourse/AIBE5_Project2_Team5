import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import {
  AlertTriangle,
  ArrowRight,
  Bookmark,
  Clock,
  LayoutGrid,
  LayoutList,
  Search,
} from "lucide-react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import ProjectDetailModal from "../components/ProjectDetailModal";
import type { ProjectData } from "../components/ProjectDetailModal";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { publicApiRequest } from "../api/apiClient";
import { getProjectDetailApi } from "../api/projectApi";

type ProjectApiItem = {
  id: number;
  nickname: string;
  companyName: string | null;
  category: string | null;
  title: string;
  overview: string;
  budget: string;
  deadline: string;
  experienceLevel: string;
  jobState: string;
};

type FilterOptions = {
  jobStates: string[];
  experienceLevels: string[];
  categories: string[];
};

const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/$/, "");
const PROJECTS_API_URL = `${API_BASE_URL}/api/projects`;
const SORT_OPTIONS = ["최신순", "예산순", "마감임박순"] as const;
const DEFAULT_AVATAR = "https://i.pravatar.cc/40?img=12";

function parseBudgetToManwon(value: string | number | null | undefined): number {
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : 0;
  }

  if (!value) {
    return 0;
  }

  const parsed = Number.parseInt(String(value).replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getDday(deadline: string): number {
  return Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

function getPriority(deadline: string): ProjectData["priority"] {
  const dday = getDday(deadline);
  if (dday <= 3) return "high";
  if (dday <= 10) return "medium";
  return "low";
}

function getBadge(deadline: string): string {
  const dday = getDday(deadline);
  if (dday <= 0) return "마감";
  if (dday <= 3) return "급마감";
  return "모집중";
}

function toProjectData(project: ProjectApiItem): ProjectData {
  return {
    id: project.id,
    badge: getBadge(project.deadline),
    priority: getPriority(project.deadline),
    title: project.title,
    description: project.overview,
    fullDescription: "",
    client: {
      name: project.nickname,
      avatar: DEFAULT_AVATAR,
      verified: true,
    },
    category: project.category ?? "Uncategorized",
    skills: [],
    budget: parseBudgetToManwon(project.budget),
    duration: project.jobState,
    deadline: project.deadline,
    applicants: 0,
    remote: true,
    imageUrl: "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
    referenceImages: [],
    requirements: [],
    responsibilities: [],
    projectType: project.jobState,
    experienceLevel: project.experienceLevel,
    companyInfo: {
      size: project.companyName ?? "",
      industry: project.category ?? "Client",
    },
  };
}

function DdayPill({ deadline }: { deadline: string }) {
  const dday = getDday(deadline);
  const label = dday <= 0 ? "마감" : `D-${dday}`;
  const colorClass =
    dday <= 0
      ? "bg-gray-100 text-gray-500"
      : dday <= 3
        ? "bg-red-50 text-red-500"
        : dday <= 7
          ? "bg-orange-50 text-orange-500"
          : "bg-emerald-50 text-emerald-600";

  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
      {dday > 0 && dday <= 3 && <AlertTriangle className="size-3" />}
      {label}
    </span>
  );
}

function Thumbnail({ project, mode }: { project: ProjectData; mode: "list" | "grid" }) {
  const className = mode === "grid" ? "h-44 w-full" : "h-full w-40 shrink-0";

  return (
    <div className={`${className} overflow-hidden bg-gray-100`}>
      <ImageWithFallback
        src={project.imageUrl}
        alt={project.title}
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    </div>
  );
}

export default function Projects() {
  const [apiProjects, setApiProjects] = useState<ProjectApiItem[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions>({
    jobStates: [],
    experienceLevels: [],
    categories: [],
  });
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedExperience, setSelectedExperience] = useState<string | null>(null);
  const [selectedProjectType, setSelectedProjectType] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<(typeof SORT_OPTIONS)[number]>("최신순");
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");
  const [selectedProject, setSelectedProject] = useState<ProjectData | null>(null);
  const [bookmarked, setBookmarked] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        setLoading(true);
        setError(null);

        const [projectsData, filtersData] = await Promise.all([
          publicApiRequest<ProjectApiItem[]>(PROJECTS_API_URL),
          publicApiRequest<FilterOptions>(`${PROJECTS_API_URL}/filtering`),
        ]);

        if (!mounted) return;
        setApiProjects(projectsData ?? []);
        setFilterOptions(filtersData ?? { jobStates: [], experienceLevels: [], categories: [] });
      } catch (fetchError) {
        if (!mounted) return;
        setError(fetchError instanceof Error ? fetchError.message : "데이터를 불러오지 못했습니다.");
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      mounted = false;
    };
  }, []);

  const projectsData = useMemo(() => apiProjects.map(toProjectData), [apiProjects]);

  const categoryCounts = useMemo(() => {
    return filterOptions.categories.reduce<Record<string, number>>((acc, category) => {
      acc[category] = projectsData.filter((project) => project.category === category).length;
      return acc;
    }, {});
  }, [projectsData, filterOptions.categories]);

  const filteredProjects = useMemo(() => {
    let list = [...projectsData];

    if (selectedCategory) {
      list = list.filter((project) => project.category === selectedCategory);
    }

    if (selectedExperience) {
      list = list.filter((project) => project.experienceLevel === selectedExperience);
    }

    if (selectedProjectType) {
      list = list.filter((project) => project.projectType === selectedProjectType);
    }

    if (sortBy === "예산순") {
      list.sort((a, b) => Number(b.budget) - Number(a.budget));
    }

    if (sortBy === "마감임박순") {
      list.sort((a, b) => getDday(a.deadline) - getDday(b.deadline));
    }

    return list;
  }, [projectsData, selectedCategory, selectedExperience, selectedProjectType, sortBy]);

  async function handleOpenProject(project: ProjectData) {
    setSelectedProject(project);
    setDetailLoading(project.id);

    try {
      const detail = await getProjectDetailApi(project.id);

      setSelectedProject((current) => {
        if (!current || current.id !== project.id) {
          return current;
        }

        return {
          ...current,
          category: detail.category || current.category,
          title: detail.title || current.title,
          description: detail.overview || current.description,
          fullDescription: detail.fullDescription || "",
          responsibilities: detail.responsibilities ?? [],
          requirements: detail.qualifications ?? [],
          skills: detail.skills ?? [],
          budget: parseBudgetToManwon(detail.budget),
          duration: detail.jobState || current.duration,
          projectType: detail.jobState || current.projectType,
          experienceLevel: detail.experienceLevel || current.experienceLevel,
          deadline: detail.deadline || current.deadline,
        };
      });
    } catch {
      setSelectedProject((current) => current);
    } finally {
      setDetailLoading((current) => (current === project.id ? null : current));
    }
  }

  function toggleBookmark(projectId: number, event: React.MouseEvent) {
    event.stopPropagation();
    setBookmarked((prev) => (prev.includes(projectId) ? prev.filter((id) => id !== projectId) : [...prev, projectId]));
  }

  return (
    <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-[#111827]">
      <Navigation />

      <section className="bg-[#0f172a] text-white">
        <div className="mx-auto flex max-w-[1400px] items-end justify-between gap-6 px-6 py-12">
          <div>
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00C9A7]/30 bg-[#00C9A7]/15 px-3 py-1">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00C9A7]" />
              <span className="text-xs font-semibold tracking-wide text-[#00C9A7]">LIVE MATCHING BOARD</span>
            </div>
            <h1 className="text-4xl font-black">
              <span className="text-[#FF5C3A]">p</span>
              <span className="text-white">ick</span>
              <span className="mx-2 text-white">&</span>
              <span className="text-[#00C9A7]">s</span>
              <span className="text-white">ell</span>
            </h1>
            <p className="mt-3 max-w-2xl text-sm text-slate-300">
              프로젝트를 고르고, 적합한 디자이너를 연결하는 매칭 보드입니다.
            </p>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex items-center gap-5">
              <div className="text-center">
                <p className="text-2xl font-bold text-white">
                  <span className="font-semibold text-[#00C9A7]">{projectsData.length}</span>
                </p>
                <p className="mt-0.5 text-[11px] text-gray-400">등록 공고</p>
              </div>
              <div className="h-8 w-px bg-white/10" />
              <div className="text-center">
                <p className="text-2xl font-bold text-[#FF5C3A]">{projectsData.filter((p) => p.priority === "high").length}</p>
                <p className="mt-0.5 text-[11px] text-gray-400">급한 공고</p>
              </div>
            </div>

            <Link
              to="/projects/new"
              className="rounded-xl bg-emerald-400 px-4 py-3 text-sm font-bold text-slate-900 transition hover:bg-emerald-300"
            >
              + 프로젝트 등록
            </Link>
          </div>
        </div>
      </section>

      <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-6 py-8 xl:flex-row flex-col">
        <aside className="w-full rounded-3xl border border-white/70 bg-white p-5 shadow-sm xl:w-72">
          <div className="mb-6">
            <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">Filter</h2>
          </div>

          <div>
            <p className="mb-1 text-xs font-bold text-gray-400">프로젝트 유형</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {filterOptions.jobStates.map((projectType) => (
                <button
                  key={projectType}
                  onClick={() => setSelectedProjectType((prev) => (prev === projectType ? null : projectType))}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    selectedProjectType === projectType ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {projectType}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="mb-1 text-xs font-bold text-gray-400">경력</p>
            <div className="mb-4 flex flex-wrap gap-2">
              {filterOptions.experienceLevels.map((experienceLevel) => (
                <button
                  key={experienceLevel}
                  onClick={() => setSelectedExperience((prev) => (prev === experienceLevel ? null : experienceLevel))}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    selectedExperience === experienceLevel ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {experienceLevel}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <p className="mb-1 text-xs font-bold text-gray-400">카테고리</p>
              <div className="space-y-2">
                {filterOptions.categories.map((category) => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory((prev) => (prev === category ? null : category))}
                    className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                      selectedCategory === category ? "bg-emerald-50 text-emerald-700" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    <span>{category}</span>
                    <span className="rounded-full bg-white px-2 py-0.5 text-xs">{categoryCounts[category] ?? 0}</span>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={() => {
                setSelectedCategory(null);
                setSelectedExperience(null);
                setSelectedProjectType(null);
              }}
              className="w-full rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 transition hover:border-emerald-400 hover:text-emerald-600"
            >
              필터 초기화
            </button>
          </div>
        </aside>

        <main className="min-w-0 flex-1">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm text-gray-500">총 프로젝트</p>
              <p className="text-3xl font-black text-slate-900">{projectsData.length}</p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={sortBy}
                onChange={(event) => setSortBy(event.target.value as (typeof SORT_OPTIONS)[number])}
                className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-600"
              >
                {SORT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>

              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white">
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 ${viewMode === "list" ? "bg-emerald-500 text-white" : "text-gray-400"}`}
                >
                  <LayoutList className="size-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 ${viewMode === "grid" ? "bg-emerald-500 text-white" : "text-gray-400"}`}
                >
                  <LayoutGrid className="size-4" />
                </button>
              </div>
            </div>
          </div>

          {loading && (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center text-sm text-gray-500">
              프로젝트 목록을 불러오는 중입니다.
            </div>
          )}

          {!loading && error && (
            <div className="rounded-3xl border border-red-100 bg-red-50 px-6 py-20 text-center text-sm text-red-600">
              {error}
            </div>
          )}

          {!loading && !error && filteredProjects.length === 0 && (
            <div className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
              <Search className="mx-auto mb-4 size-8 text-gray-300" />
              <p className="text-sm font-semibold text-gray-600">조건에 맞는 프로젝트가 없습니다.</p>
            </div>
          )}

          {!loading && !error && filteredProjects.length > 0 && (
            <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 lg:grid-cols-2" : "space-y-4"}>
              {filteredProjects.map((project) => (
                <article
                  key={project.id}
                  onClick={() => void handleOpenProject(project)}
                  className="group cursor-pointer overflow-hidden rounded-3xl border border-white/70 bg-white shadow-sm transition hover:-translate-y-1 hover:border-emerald-200 hover:shadow-xl"
                >
                  <div className={viewMode === "grid" ? "flex flex-col" : "flex flex-col md:flex-row"}>
                    <Thumbnail project={project} mode={viewMode} />

                    <div className="flex flex-1 flex-col p-5">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <div className="mb-2 flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-slate-900 px-2.5 py-1 text-xs font-bold text-white">{project.badge}</span>
                            <span className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{project.category}</span>
                            <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700">{project.projectType}</span>
                          </div>
                          <h3 className="line-clamp-1 text-lg font-black text-slate-900 transition group-hover:text-emerald-600">
                            {project.title}
                          </h3>
                        </div>

                        <button
                          onClick={(event) => toggleBookmark(project.id, event)}
                          className="rounded-xl p-2 text-gray-300 transition hover:bg-gray-100"
                        >
                          <Bookmark
                            className={`size-4 ${bookmarked.includes(project.id) ? "fill-emerald-500 text-emerald-500" : "text-gray-300"}`}
                          />
                        </button>
                      </div>

                      <p className="line-clamp-2 text-sm leading-6 text-gray-500">{project.description}</p>

                      <div className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-gray-100 pt-4">
                        <div>
                          <p className="text-xs text-gray-400">예산</p>
                          <p className="text-lg font-black text-emerald-600">{project.budget}만원</p>
                        </div>

                        <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-4" />
                            {project.experienceLevel}
                          </span>
                          <DdayPill deadline={project.deadline} />
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-600">
                            {detailLoading === project.id ? "불러오는 중" : "상세보기"}
                            <ArrowRight className="size-4" />
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      <Footer />

      <ProjectDetailModal
        project={selectedProject}
        onClose={() => setSelectedProject(null)}
        bookmarked={selectedProject ? bookmarked.includes(selectedProject.id) : false}
        onBookmark={() => {
          if (!selectedProject) return;
          setBookmarked((prev) =>
            prev.includes(selectedProject.id)
              ? prev.filter((id) => id !== selectedProject.id)
              : [...prev, selectedProject.id],
          );
        }}
      />
    </div>
  );
}
