import {useEffect, useMemo, useState} from "react";
import {Link, useNavigate} from "react-router";
import { toast } from "sonner";
import {
    AlertTriangle,
    ArrowRight,
    Bookmark,
    Clock,
    LayoutGrid,
    LayoutList,
    Search,
    BadgeCheck,
} from "lucide-react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import ProjectDetailModal from "../components/ProjectDetailModal";
import type {ProjectData} from "../components/ProjectDetailModal";
import {ImageWithFallback} from "../components/figma/ImageWithFallback";
import {apiRequest} from "../api/apiClient";

import {
    getProjectFilterOptionsApi,
    getProjectDetailApi,
    getMyPostsApi,
    getMyApplicationsApi,
    getProjectApplicationsApi,
    deleteProjectApi,
    deleteProjectApplicationApi,
    type ProjectApplicationItemResponse
} from "../api/projectApi";
import { getCurrentUser } from "../utils/auth";

type ProjectApiItem = {
    id: number;
    clientUserId?: number | null;
    nickname: string;
    profileImage?: string | null;
    companyName: string | null;
    category: string | null;
    categories?: string[] | null;
    title: string;
    overview: string;
    budget: string;
    deadline: string;
    experienceLevel: string;
    jobState: string;
    thumbnailImageUrl?: string | null;
    imageUrls?: string[];
};

type FilterOptions = {
    jobStates: string[];
    experienceLevels: string[];
    categories: string[];
};

// 우측 내 활동 패널의 탭 상태
type MyActivityTab = "posts" | "applications";

const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/$/, "");
const PROJECTS_API_URL = `${API_BASE_URL}/api/projects`;
const SORT_OPTIONS = ["최신순", "예산순", "마감임박순"] as const;
const DEFAULT_AVATAR = "/default-avatar.svg";

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
    if (dday <= 3) return "긴급마감";
    return "모집중";
}

function toProjectData(project: ProjectApiItem): ProjectData {
    const categories =
        Array.isArray(project.categories) && project.categories.length > 0
            ? project.categories
            : project.category
                ? [project.category]
                : [];
    const referenceImages = project.imageUrls ?? [];
    const imageUrl =
        project.thumbnailImageUrl ??
        referenceImages[0] ??
        "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400";

    return {
        id: project.id,
        badge: getBadge(project.deadline),
        priority: getPriority(project.deadline),
        title: project.title,
        description: project.overview,
        fullDescription: "",
        client: {
            userId: project.clientUserId ?? null,
            name: project.nickname,
            avatar: project.profileImage || DEFAULT_AVATAR,
            verified: true,
        },
        category: project.category ?? categories[0] ?? "미분류",
        categories,
        skills: [],
        budget: parseBudgetToManwon(project.budget).toString(),
        duration: project.jobState,
        deadline: project.deadline,
        applicants: 0,
        remote: true,
        imageUrl,
        referenceImages,
        requirements: [],
        responsibilities: [],
        projectType: project.jobState,
        experienceLevel: project.experienceLevel,
        companyInfo: {
            size: project.companyName ?? "",
            industry: project.category ?? categories[0] ?? "클라이언트",
        },
    };
}

function toProjectApplicant(application: ProjectApplicationItemResponse) {
    return {
        applicationId: application.applicationId,
        designerId: application.designerId,
        designerName: application.designerName,
        designerNickname: application.designerNickname,
        designerProfileImage: application.designerProfileImage,
        expectedBudget: application.expectedBudget,
        summary: application.summary,
        coverLetter: application.coverLetter,
        portfolioUrl: application.portfolioUrl,
        startDate: application.startDate,
    };
}

function DdayPill({deadline}: { deadline: string }) {
    const dday = getDday(deadline);
    const label = dday <= 0 ? "마감" : `D-${dday}`;
    const colorClass =
        dday <= 0
            ? "bg-gray-100 text-gray-500"
            : dday <= 3
                ? "bg-red-50 text-red-500"
                : dday <= 7
                    ? "bg-orange-50 text-orange-500"
                    : "bg-[#F5FFFB] text-[#00A88C]";

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
      {dday > 0 && dday <= 3 && <AlertTriangle className="size-3"/>}
            {label}
    </span>
    );
}

function Thumbnail({project, mode}: { project: ProjectData; mode: "list" | "grid" }) {
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
    const navigate = useNavigate();
    const currentUser = getCurrentUser();
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
    const [openApplyEditorOnModal, setOpenApplyEditorOnModal] = useState(false);
    const [bookmarked, setBookmarked] = useState<number[]>([]);
    const [loading, setLoading] = useState(true);
    const [detailLoading, setDetailLoading] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);

    // 우측 사이드바용 활동 데이터 상태
    const [activeTab, setActiveTab] = useState<MyActivityTab>("posts");
    const [myPosts, setMyPosts] = useState<any[]>([]);
    const [myApplications, setMyApplications] = useState<any[]>([]);
    const [isActivityLoading, setIsActivityLoading] = useState(false);

    async function reloadMyApplications() {
        const response = await getMyApplicationsApi();
        setMyApplications(Array.isArray(response) ? response : (response as any).data || []);
    }

    // 1. 초기 데이터 로드: 메인 목록과 필터 옵션
    useEffect(() => {
        let mounted = true;

        async function loadInitialData() {
            try {
                setLoading(true);
                const [projectsData, filtersData] = await Promise.all([
                    apiRequest<ProjectApiItem[]>(PROJECTS_API_URL),
                    getProjectFilterOptionsApi(),
                ]);

                if (!mounted) return;
                setApiProjects(projectsData ?? []);
                setFilterOptions(filtersData ?? { jobStates: [], experienceLevels: [], categories: [] });
            } catch (err) {
                if (mounted) setError(err instanceof Error ? err.message : "데이터를 불러오지 못했어요.");
            } finally {
                if (mounted) setLoading(false);
            }
        }

        void loadInitialData();
        return () => { mounted = false; };
    }, []); // 최초 1회 실행

// 2. 우측 사이드바 활동 데이터 로드 - 탭 변경 시 실행
    useEffect(() => {
        let mounted = true;

        const fetchActivityData = async () => {
            setIsActivityLoading(true);
            try {
                // 현재 선택된 탭의 데이터만 로드
                if (activeTab === "posts") {
                    const response = await getMyPostsApi();
                    if (!mounted) return;
                    setMyPosts(Array.isArray(response) ? response : (response as any).data || []);
                } else {
                    const response = await getMyApplicationsApi();
                    if (!mounted) return;
                    setMyApplications(Array.isArray(response) ? response : (response as any).data || []);
                }
            } catch (error) {
                if (mounted) console.error("Activity 데이터 로드 실패:", error);
            } finally {
                if (mounted) setIsActivityLoading(false);
            }
        };

        void fetchActivityData();
        return () => { mounted = false; };
    }, [activeTab]); // 탭이 바뀔 때만 실행

    const projectsData = useMemo(() => apiProjects.map(toProjectData), [apiProjects]);

    const categoryCounts = useMemo(() => {
        return filterOptions.categories.reduce<Record<string, number>>((acc, category) => {
            acc[category] = projectsData.filter((project) => project.categories?.includes(category) || project.category === category).length;
            return acc;
        }, {});
    }, [projectsData, filterOptions.categories]);

    const filteredProjects = useMemo(() => {
        let list = [...projectsData];

        if (selectedCategory) {
            list = list.filter((project) => project.categories?.includes(selectedCategory) || project.category === selectedCategory);
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

    async function handleOpenProject(project: ProjectData, options?: { openApplyEditor?: boolean }) {
        setSelectedProject(project);
        setOpenApplyEditorOnModal(Boolean(options?.openApplyEditor));
        setDetailLoading(project.id);

        try {
            const [detail, applications] = await Promise.all([
                getProjectDetailApi(project.id),
                project.ownerView ? getProjectApplicationsApi(project.id) : Promise.resolve(null),
            ]);

            setSelectedProject((current) => {
                if (!current || current.id !== project.id) {
                    return current;
                }

                const mappedApplications = applications?.map(toProjectApplicant) ?? current.applications ?? [];

                return {
                    ...current,
                    client: {
                        ...current.client,
                        userId: detail.clientUserId ?? current.client.userId ?? null,
                        avatar: detail.profileImage || current.client.avatar,
                    },
                    category: detail.categories && detail.categories.length > 0
                        ? detail.categories.join(", ")
                        : detail.category || current.category,
                    categories: detail.categories ?? current.categories,
                    title: detail.title || current.title,
                    description: detail.overview || current.description,
                    fullDescription: detail.fullDescription || "",
                    responsibilities: detail.responsibilities ?? [],
                    requirements: detail.qualifications ?? [],
                    skills: detail.skills ?? [],
                    budget: parseBudgetToManwon(detail.budget).toString(),
                    duration: detail.jobState || current.duration,
                    projectType: detail.jobState || current.projectType,
                    experienceLevel: detail.experienceLevel || current.experienceLevel,
                    deadline: detail.deadline || current.deadline,
                    applicants: project.ownerView ? mappedApplications.length : current.applicants,
                    imageUrl:
                        detail.thumbnailImageUrl ||
                        detail.imageUrls?.[0] ||
                        current.imageUrl,
                    referenceImages: detail.imageUrls ?? current.referenceImages,
                    applications: mappedApplications,
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

    // ?뮕 ?좉퇋: ?ъ씠?쒕컮 ?쒕룞 ?댁뿭 ?꾩씠???대┃ ?몃뱾??
    function handleActivityItemClick(item: any, options?: { openApplyEditor?: boolean }) {
        const ownerView = activeTab === "posts";
        const projectData: ProjectData = {
            id: item.postId,
            badge: item.projectState === 'OPEN' ? '모집중' : '마감',
            priority: getPriority(item.deadline),
            title: item.title,
            description: item.overview,
            fullDescription: "",
            client: {
                userId: item.clientUserId ?? null,
                name: "프로젝트 작성자",
                avatar: item.profileImage || DEFAULT_AVATAR,
                verified: true,
            },
            category: item.category || "미분류",
            categories: item.categories ?? (item.category ? [item.category] : []),
            skills: [],
            budget: "0",
            duration: item.jobState,
            deadline: item.deadline,
            applicants: 0,
            remote: true,
            imageUrl:
                item.thumbnailImageUrl ||
                item.imageUrls?.[0] ||
                "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400",
            referenceImages: item.imageUrls ?? [],
            requirements: [],
            responsibilities: [],
            projectType: item.jobState,
            experienceLevel: "",
            ownerView,
            applications: ownerView ? [] : undefined,
            myApplication: ownerView ? undefined : {
                applicationId: item.applicationId,
                designerId: currentUser?.userId ?? 0,
                designerName: currentUser?.name ?? currentUser?.nickname ?? "",
                designerNickname: currentUser?.nickname ?? null,
                designerProfileImage: currentUser?.profileImage ?? null,
                expectedBudget: item.expectedBudget,
                summary: item.summary,
                coverLetter: item.coverLetter,
                portfolioUrl: item.portfolioUrl,
                startDate: item.startDate,
            },
            companyInfo: {
                size: "",
                industry: item.category || "",
            },
        };
        handleOpenProject(projectData, options);
    }

    async function handleDeleteMyPost(postId: number, event: React.MouseEvent) {
        event.stopPropagation();
        if (!window.confirm("등록한 공고를 삭제할까요?")) {
            return;
        }

        try {
            await deleteProjectApi(postId);
            setApiProjects((current) => current.filter((project) => project.id !== postId));
            setMyPosts((current) => current.filter((item) => item.postId !== postId));
            setSelectedProject((current) => current?.id === postId ? null : current);
            toast.success("공고를 삭제했어요.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "공고를 삭제하지 못했어요.");
        }
    }

    async function handleDeleteMyApplication(postId: number, event: React.MouseEvent) {
        event.stopPropagation();
        if (!window.confirm("지원 내역을 삭제할까요?")) {
            return;
        }

        try {
            await deleteProjectApplicationApi(postId);
            setMyApplications((current) => current.filter((item) => item.postId !== postId));
            setSelectedProject((current) => current?.id === postId ? null : current);
            toast.success("지원 내역을 삭제했어요.");
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "지원 내역을 삭제하지 못했어요.");
        }
    }

    function handleEditMyPost(postId: number, event: React.MouseEvent) {
        event.stopPropagation();
        navigate(`/projects/new?edit=${postId}`);
    }

    function handleEditMyApplication(item: any, event: React.MouseEvent) {
        event.stopPropagation();
        handleActivityItemClick(item, { openApplyEditor: true });
    }

    return (
        <div className="flex min-h-screen flex-col bg-[#f6f8fb] text-[#111827]">
            <Navigation/>

            <section className="bg-[#0f172a] text-white">
                <div className="mx-auto flex max-w-[1400px] items-end justify-between gap-6 px-6 py-12">
                    <div>
                        <div
                            className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#00C9A7]/30 bg-[#00C9A7]/15 px-3 py-1">
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00C9A7]"/>
                            <span
                                className="text-xs font-semibold tracking-wide text-[#00C9A7]">LIVE MATCHING BOARD</span>
                        </div>
                        <h1 className="text-4xl font-black">
                            <span className="text-[#FF5C3A]">p</span>
                            <span className="text-white">ick</span>
                            <span className="mx-2 text-white">&</span>
                            <span className="text-[#00C9A7]">s</span>
                            <span className="text-white">ell</span>
                        </h1>
                        <p className="mt-3 max-w-2xl text-sm text-gray-300">
                            원하는 프로젝트를 고르고 <span className="text-[#FF5C3A]">(Pick)</span>, 크리에이티브를 판매합니다 <span className="text-[#00C9A7]">(Sell)</span> <br />
                            클라이언트와 디자이너를 잇는 새로운 방식의 프로젝트 매칭 플랫폼
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
                            <div className="h-8 w-px bg-white/10"/>
                            <div className="text-center">
                                <p className="text-2xl font-bold text-[#FF5C3A]">{projectsData.filter((p) => p.priority === "high").length}</p>
                                <p className="mt-0.5 text-[11px] text-gray-400">긴급 공고</p>
                            </div>
                        </div>

                        <Link
                            to="/projects/new"
                            onClick={(event) => {
                                if (currentUser?.role !== "designer") {
                                    return;
                                }

                                event.preventDefault();
                                toast.error("클라이언트만 프로젝트를 등록할 수 있습니다.");
                            }}
                            className="rounded-xl bg-[#00C9A7] px-4 py-3 text-sm font-bold text-white transition hover:bg-[#00A88C]"
                        >
                            + 프로젝트 등록
                        </Link>
                    </div>
                </div>
            </section>

            <div className="mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-6 py-8 xl:flex-row flex-col">
                <aside className="w-full rounded-3xl border border-white/70 bg-white p-5 shadow-sm xl:w-72">
                    <div className="mb-6">
                        <h2 className="text-sm font-bold uppercase tracking-[0.2em] text-gray-400">필터</h2>
                    </div>

                    <div>
                        <p className="mb-1 text-xs font-bold text-gray-400">프로젝트 유형</p>
                        <div className="mb-4 flex flex-wrap gap-2">
                            {filterOptions.jobStates.map((projectType) => (
                                <button
                                    key={projectType}
                                    onClick={() => setSelectedProjectType((prev) => (prev === projectType ? null : projectType))}
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                        selectedProjectType === projectType ? "bg-[#0F0F0F] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                                        selectedExperience === experienceLevel ? "bg-[#0F0F0F] text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
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
                                            selectedCategory === category ? "bg-[#F5FFFB] text-[#007E68]" : "bg-gray-50 text-gray-600 hover:bg-gray-100"
                                        }`}
                                    >
                                        <span>{category}</span>
                                        <span
                                            className="rounded-full bg-white px-2 py-0.5 text-xs">{categoryCounts[category] ?? 0}</span>
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
                            className="w-full rounded-xl border border-dashed border-gray-300 px-3 py-2 text-sm text-gray-500 transition hover:border-[#00C9A7] hover:text-[#00A88C]"
                        >
                            필터 초기화
                        </button>
                    </div>
                </aside>

                <main className="min-w-0 flex-1">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className="text-sm text-gray-500">총 프로젝트</p>
                            <p className="text-3xl font-black text-[#0F0F0F]">{projectsData.length}</p>
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
                                    className={`p-2 ${viewMode === "list" ? "bg-[#00C9A7] text-white" : "text-gray-400"}`}
                                >
                                    <LayoutList className="size-4"/>
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 ${viewMode === "grid" ? "bg-[#00C9A7] text-white" : "text-gray-400"}`}
                                >
                                    <LayoutGrid className="size-4"/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading && (
                        <div
                            className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center text-sm text-gray-500">
                            프로젝트 목록을 불러오는 중입니다.
                        </div>
                    )}

                    {!loading && error && (
                        <div
                            className="rounded-3xl border border-red-100 bg-red-50 px-6 py-20 text-center text-sm text-red-600">
                            {error}
                        </div>
                    )}

                    {!loading && !error && filteredProjects.length === 0 && (
                        <div
                            className="rounded-3xl border border-dashed border-gray-300 bg-white px-6 py-20 text-center">
                            <Search className="mx-auto mb-4 size-8 text-gray-300"/>
                            <p className="text-sm font-semibold text-gray-600">조건에 맞는 프로젝트가 없습니다.</p>
                        </div>
                    )}

                    {!loading && !error && filteredProjects.length > 0 && (
                        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 lg:grid-cols-2" : "space-y-4"}>
                            {filteredProjects.map((project) => (
                                <article
                                    key={project.id}
                                    onClick={() => void handleOpenProject(project)}
                                    className="group cursor-pointer overflow-hidden rounded-3xl border border-white/70 bg-white shadow-sm transition hover:-translate-y-1 hover:border-[#BDEFD8] hover:shadow-xl"
                                >
                                    <div
                                        className={viewMode === "grid" ? "flex flex-col" : "flex flex-col md:flex-row"}>
                                        <Thumbnail project={project} mode={viewMode}/>

                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="mb-3 flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                                        <span
                                                            className="rounded-full bg-[#0F0F0F] px-2.5 py-1 text-xs font-bold text-white">{project.badge}</span>
                                                        <span
                                                            className="rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-600">{project.category}</span>
                                                        <span
                                                            className="rounded-full bg-[#F5FFFB] px-2.5 py-1 text-xs font-semibold text-[#007E68]">{project.projectType}</span>
                                                    </div>
                                                    <h3 className="line-clamp-1 text-lg font-black text-[#0F0F0F] transition group-hover:text-[#00A88C]">
                                                        {project.title}
                                                    </h3>
                                                </div>

                                                <button
                                                    onClick={(event) => toggleBookmark(project.id, event)}
                                                    className="rounded-xl p-2 text-gray-300 transition hover:bg-gray-100"
                                                >
                                                    <Bookmark
                                                        className={`size-4 ${bookmarked.includes(project.id) ? "fill-[#00C9A7] text-[#00C9A7]" : "text-gray-300"}`}
                                                    />
                                                </button>
                                            </div>

                                            <p className="line-clamp-2 text-sm leading-6 text-gray-500">{project.description}</p>

                                            <div
                                                className="mt-5 flex flex-wrap items-end justify-between gap-4 border-t border-gray-100 pt-4">
                                                <div>
                                                    <p className="text-xs text-gray-400">예산</p>
                                                    <p className="text-lg font-black text-[#00A88C]">{project.budget}만원</p>
                                                </div>

                                                <div className="flex items-center gap-3 text-sm text-gray-500">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-4"/>
                              {project.experienceLevel}
                          </span>
                                                    <DdayPill deadline={project.deadline}/>
                                                    <span
                                                        className="inline-flex items-center gap-1 font-semibold text-[#00A88C]">
                            {detailLoading === project.id ? "불러오는 중" : "상세보기"}
                                                        <ArrowRight className="size-4"/>
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

                {/* 우측 사이드바: 내 활동 */}
                <aside className="hidden w-full shrink-0 space-y-6 lg:block xl:w-80">
                    <div className="rounded-3xl border border-white/70 bg-white p-5 shadow-sm">
                        <h2 className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-gray-400">내 활동</h2>

                        {/* 세그먼트 컨트롤 */}
                        <div className="mb-5 flex rounded-2xl bg-gray-100 p-1">
                            <button
                                onClick={() => setActiveTab("posts")}
                                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                                    activeTab === "posts"
                                        ? "bg-white text-[#007E68] shadow-sm"
                                        : "text-gray-400 hover:text-gray-600"
                                }`}
                            >
                                작성한 프로젝트
                            </button>
                            <button
                                onClick={() => setActiveTab("applications")}
                                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                                    activeTab === "applications"
                                        ? "bg-white text-[#007E68] shadow-sm"
                                        : "text-gray-400 hover:text-gray-600"
                                }`}
                            >
                                지원한 프로젝트
                            </button>
                        </div>

                        {/* 리스트 영역 */}
                        <div className="space-y-3">
                            {isActivityLoading ? (
                                <p className="py-10 text-center text-xs text-gray-400">불러오는 중...</p>
                            ) : (activeTab === "posts" ? myPosts : myApplications).length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className="text-xs text-gray-400">내역이 없습니다.</p>
                                </div>
                            ) : (
                                (activeTab === "posts" ? myPosts : myApplications).map((item: any) => (
                                    <div
                                        key={item.id || item.postId}
                                        onClick={() => handleActivityItemClick(item)}
                                        className="group relative cursor-pointer rounded-2xl border border-gray-50 bg-gray-50/50 p-4 transition hover:border-[#BDEFD8] hover:bg-white"
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            {/* projectState 표시 */}
                                            <span className={`text-[10px] font-bold ${item.projectState === 'OPEN' ? 'text-[#00C9A7]' : 'text-gray-400'}`}>
                                {item.projectState === 'OPEN' ? '모집중' : '마감'}
                            </span>
                                            <span className="text-[10px] text-gray-400">{item.deadline?.split('T')[0]}</span>
                                        </div>
                                        {/* title */}
                                        <p className="mt-1 line-clamp-1 text-sm font-black text-[#0F0F0F] group-hover:text-[#00A88C]">
                                            {item.title}
                                        </p>
                                        {/* overview */}
                                        <p className="mt-1 line-clamp-2 text-[11px] leading-relaxed text-gray-500">
                                            {item.overview}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between">
                                            {/* 하단 정보: jobState / category */}
                                            <div className="flex gap-1.5">
                                <span className="rounded-md bg-[#F1F1EE] px-1.5 py-0.5 text-[10px] font-semibold text-gray-600">
                                    {item.jobState}
                                </span>
                                                <span className="rounded-md bg-blue-50 px-1.5 py-0.5 text-[10px] font-semibold text-blue-600">
                                    {item.category}
                                </span>
                                            </div>
                                            <ArrowRight className="size-3 text-gray-300 transition group-hover:translate-x-0.5 group-hover:text-[#00C9A7]" />
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            {activeTab === "posts" ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleEditMyPost(item.postId, event)}
                                                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-[11px] font-semibold text-gray-600 transition hover:border-[#00C9A7] hover:text-[#00A88C]"
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleDeleteMyPost(item.postId, event)}
                                                        className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-[11px] font-semibold text-red-500 transition hover:bg-red-50"
                                                    >
                                                        삭제
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleEditMyApplication(item, event)}
                                                        className="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-[11px] font-semibold text-gray-600 transition hover:border-[#00C9A7] hover:text-[#00A88C]"
                                                    >
                                                        지원서 수정
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleDeleteMyApplication(item.postId, event)}
                                                        className="flex-1 rounded-xl border border-red-200 px-3 py-2 text-[11px] font-semibold text-red-500 transition hover:bg-red-50"
                                                    >
                                                        지원 삭제
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <button className="mt-5 w-full rounded-xl border border-dashed border-gray-200 py-3 text-xs font-semibold text-gray-400 transition hover:border-[#BDEFD8] hover:text-[#00A88C]">
                            전체 보기
                        </button>
                    </div>

                    {/* 하단 홍보 배너 */}
                    <div className="rounded-3xl bg-gradient-to-br from-[#0F0F0F] to-[#1a1a1a] p-6 text-white shadow-lg">
                        <div className="flex items-center gap-2 text-[#00C9A7]">
                            <BadgeCheck className="size-4" />
                            <span className="text-[10px] font-bold uppercase">Pro Verified</span>
                        </div>
                        <p className="mt-3 text-sm font-bold leading-relaxed">
                            매칭 성과를 더 높이고 싶다면<br />
                            프로필을 업데이트 해보세요
                        </p>
                        <Link to="/profile/me" className="mt-4 inline-flex items-center gap-1 text-xs font-bold text-[#00C9A7] hover:underline">
                            프로필 수정하기 <ArrowRight className="size-3" />
                        </Link>
                    </div>
                </aside>
            </div>

            <Footer/>

            <ProjectDetailModal
                project={selectedProject}
                onClose={() => {
                    setSelectedProject(null);
                    setOpenApplyEditorOnModal(false);
                }}
                bookmarked={selectedProject ? bookmarked.includes(selectedProject.id) : false}
                onBookmark={() => {
                    if (!selectedProject) return;
                    setBookmarked((prev) =>
                        prev.includes(selectedProject.id)
                            ? prev.filter((id) => id !== selectedProject.id)
                            : [...prev, selectedProject.id],
                    );
                }}
                openApplyFormOnMount={openApplyEditorOnModal}
                onApplicationChanged={() => {
                    void reloadMyApplications();
                    setOpenApplyEditorOnModal(false);
                }}
                onProjectDeleted={(projectId) => {
                    setApiProjects((current) => current.filter((project) => project.id !== projectId));
                    setMyPosts((current) => current.filter((item) => item.postId !== projectId));
                    setSelectedProject(null);
                }}
                onRequestProjectEdit={(projectId) => navigate(`/projects/new?edit=${projectId}`)}
            />
        </div>
    );
}


