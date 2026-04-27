import {useEffect, useMemo, useState} from "react";
import {Link, useNavigate} from "react-router";
import { toast } from "sonner";
import { motion } from "motion/react";
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
import { useNightMode } from "../contexts/NightModeContext";

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

function DdayPill({deadline, isNight = false}: { deadline: string; isNight?: boolean }) {
    const dday = getDday(deadline);
    const label = dday <= 0 ? "마감" : `D-${dday}`;
    const colorClass =
        dday <= 0
            ? (isNight ? "bg-white/10 text-white/40" : "bg-gray-100 text-gray-500")
            : dday <= 3
                ? (isNight ? "bg-red-500/15 text-red-400" : "bg-red-50 text-red-500")
                : dday <= 7
                    ? (isNight ? "bg-orange-500/15 text-orange-400" : "bg-orange-50 text-orange-500")
                    : (isNight ? "bg-[#00C9A7]/15 text-[#00C9A7]" : "bg-[#F5FFFB] text-[#00A88C]");

    return (
        <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold ${colorClass}`}>
      {dday > 0 && dday <= 3 && <AlertTriangle className="size-3"/>}
            {label}
    </span>
    );
}

function Thumbnail({project, mode, isNight = false}: { project: ProjectData; mode: "list" | "grid"; isNight?: boolean }) {
    const className = mode === "grid" ? "h-44 w-full" : "h-full w-40 shrink-0";

    return (
        <div className={`${className} overflow-hidden ${isNight ? "bg-[#1a2035]" : "bg-gray-100"}`}>
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
    const { isNight } = useNightMode();
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

    const heroTotal = projectsData.length;
    const heroUrgent = projectsData.filter((p) => p.priority === "high").length;
    const heroUrgentPct = heroTotal === 0 ? 0 : Math.round((heroUrgent / heroTotal) * 100);

    return (
        <div className={`flex min-h-screen flex-col transition-colors duration-700 ${isNight ? "bg-[#0C1222] text-white" : "bg-[#f6f8fb] text-[#111827]"}`}>
            <Navigation/>

            <section
                className={`relative overflow-hidden transition-colors duration-700 ${
                    isNight ? "bg-[#0C1222] text-white" : "bg-gradient-to-br from-[#f6f8fb] via-white to-[#eef8f5] text-[#111827]"
                }`}
            >
                <div
                    className="pointer-events-none absolute inset-0"
                    style={{
                        backgroundImage: isNight
                            ? "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)"
                            : "radial-gradient(circle, rgba(15,23,42,0.06) 1px, transparent 1px)",
                        backgroundSize: "24px 24px",
                    }}
                />

                <motion.div
                    className={`pointer-events-none absolute -left-32 -top-32 h-96 w-96 rounded-full blur-[120px] ${
                        isNight ? "bg-[#00C9A7]/20" : "bg-[#00C9A7]/14"
                    }`}
                    animate={{ x: [0, 40, 0], y: [0, 30, 0], scale: [1, 1.15, 1] }}
                    transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
                />
                <motion.div
                    className={`pointer-events-none absolute -bottom-24 right-0 h-80 w-80 rounded-full blur-[100px] ${
                        isNight ? "bg-[#FF5C3A]/15" : "bg-[#FF5C3A]/10"
                    }`}
                    animate={{ x: [0, -30, 0], y: [0, -20, 0], scale: [1, 1.1, 1] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                />

                <div className="relative z-10 mx-auto flex max-w-[1400px] flex-col gap-6 px-6 py-7 sm:py-9 lg:flex-row lg:items-end lg:justify-between lg:gap-6">
                    <div className="min-w-0 flex-1">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                            className={`mb-2.5 inline-flex items-center gap-2 rounded-full border px-3.5 py-1 backdrop-blur-sm ${
                                isNight ? "border-[#00C9A7]/30 bg-[#00C9A7]/10" : "border-[#00C9A7]/35 bg-[#00C9A7]/12"
                            }`}
                        >
                            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[#00C9A7]" />
                            <span className={`text-xs font-semibold tracking-wide ${isNight ? "text-[#00C9A7]" : "text-[#00A88C]"}`}>
                                LIVE MATCHING BOARD
                            </span>
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
                            className="text-3xl font-black sm:text-4xl"
                        >
                            <span className="text-[#FF5C3A]">p</span>
                            <span className={isNight ? "text-white" : "text-[#0f172a]"}>ick</span>
                            <span className={`mx-2 ${isNight ? "text-white/60" : "text-gray-400"}`}>&</span>
                            <span className="text-[#00C9A7]">s</span>
                            <span className={isNight ? "text-white" : "text-[#0f172a]"}>ell</span>
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
                            className={`mt-2 max-w-2xl text-sm leading-snug ${isNight ? "text-gray-300" : "text-gray-600"}`}
                        >
                            원하는 프로젝트를 고르고 <span className="font-semibold text-[#FF5C3A]">(Pick)</span>, 크리에이티브를 판매합니다 <span className="font-semibold text-[#00C9A7]">(Sell)</span> <br />
                            클라이언트와 디자이너를 잇는 새로운 방식의 프로젝트 매칭 플랫폼
                        </motion.p>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
                        className="flex w-full min-w-0 flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-stretch lg:w-auto lg:max-w-none lg:flex-nowrap lg:items-end lg:justify-end"
                    >
                        <div
                            className={`w-full min-w-0 rounded-2xl border p-3.5 sm:min-w-[min(100%,320px)] sm:max-w-md lg:max-w-[360px] ${
                                isNight
                                    ? "border-white/10 bg-white/[0.06] backdrop-blur-sm"
                                    : "border-gray-200/90 bg-white/85 shadow-sm backdrop-blur-sm"
                            }`}
                        >
                            <div className="flex gap-4 sm:gap-5">
                                <div className="min-w-0 flex-1">
                                    <motion.p
                                        initial={{ scale: 0.92, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.45, delay: 0.45, ease: [0.22, 1, 0.36, 1] }}
                                        className="text-xl font-black tabular-nums text-[#00C9A7] sm:text-2xl"
                                    >
                                        {heroTotal}
                                    </motion.p>
                                    <p className={`mt-1 text-sm font-semibold ${isNight ? "text-white/90" : "text-gray-900"}`}>
                                        등록 공고
                                    </p>
                                    <p className={`mt-0.5 text-xs leading-snug ${isNight ? "text-white/45" : "text-gray-500"}`}>
                                        {heroTotal === 0 ? "아직 등록된 공고가 없어요" : "현재 보드의 전체 공고 수"}
                                    </p>
                                </div>
                                <div className={`w-px shrink-0 self-stretch ${isNight ? "bg-white/12" : "bg-gray-200"}`} />
                                <div className="min-w-0 flex-1">
                                    <motion.p
                                        initial={{ scale: 0.92, opacity: 0 }}
                                        animate={{ scale: 1, opacity: 1 }}
                                        transition={{ duration: 0.45, delay: 0.52, ease: [0.22, 1, 0.36, 1] }}
                                        className="text-xl font-black tabular-nums text-[#FF5C3A] sm:text-2xl"
                                    >
                                        {heroUrgent}
                                    </motion.p>
                                    <p className={`mt-1 text-sm font-semibold ${isNight ? "text-white/90" : "text-gray-900"}`}>
                                        긴급 공고
                                    </p>
                                    <p className={`mt-0.5 text-xs leading-snug ${isNight ? "text-white/45" : "text-gray-500"}`}>
                                        마감 3일 이내 · 전체 대비 {heroTotal === 0 ? "—" : `${heroUrgentPct}%`}
                                    </p>
                                </div>
                            </div>

                            <div className="mt-3">
                                <p className={`mb-1 text-[11px] font-semibold uppercase tracking-wide ${isNight ? "text-white/35" : "text-gray-400"}`}>
                                    긴급 비중
                                </p>
                                <div
                                    className={`flex h-2.5 w-full overflow-hidden rounded-full ${isNight ? "bg-white/10" : "bg-gray-200"}`}
                                    role="img"
                                    aria-label={
                                        heroTotal === 0
                                            ? "등록된 공고 없음"
                                            : `긴급 공고 비율 ${heroUrgentPct}퍼센트`
                                    }
                                >
                                    {heroTotal === 0 ? (
                                        <div className={`h-full w-full ${isNight ? "bg-white/[0.07]" : "bg-gray-300/70"}`} />
                                    ) : (
                                        <>
                                            <div
                                                className="h-full shrink-0 bg-[#FF5C3A] transition-[width] duration-500 ease-out"
                                                style={{ width: `${heroUrgentPct}%` }}
                                            />
                                            <div
                                                className={`h-full shrink-0 transition-[width] duration-500 ease-out ${
                                                    isNight ? "bg-[#00C9A7]/45" : "bg-[#00C9A7]/40"
                                                }`}
                                                style={{ width: `${100 - heroUrgentPct}%` }}
                                            />
                                        </>
                                    )}
                                </div>
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
                            className="group relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-[#00C9A7] to-[#00A88C] px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-[#00C9A7]/20 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl hover:shadow-[#00C9A7]/30 sm:self-center lg:self-end"
                        >
                            <span className="relative z-10">+ 프로젝트 등록</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-[#00A88C] to-[#00C9A7] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                        </Link>
                    </motion.div>
                </div>

                <div
                    className={`absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent to-transparent ${
                        isNight ? "via-[#00C9A7]/30" : "via-[#00C9A7]/22"
                    }`}
                />
            </section>

            <div className="pickxel-animate-page-in mx-auto flex w-full max-w-[1400px] flex-1 gap-6 px-6 py-8 xl:flex-row flex-col">
                <aside className={`w-full rounded-3xl border p-5 shadow-sm xl:w-72 transition-colors duration-700 ${
                    isNight ? "border-white/10 bg-[#141d30]" : "border-white/70 bg-white"
                }`}>
                    <div className="mb-6">
                        <h2 className={`text-sm font-bold uppercase tracking-[0.2em] ${isNight ? "text-white/40" : "text-gray-400"}`}>필터</h2>
                    </div>

                    <div>
                        <p className={`mb-1 text-xs font-bold ${isNight ? "text-white/40" : "text-gray-400"}`}>프로젝트 유형</p>
                        <div className="mb-4 flex flex-wrap gap-2">
                            {filterOptions.jobStates.map((projectType) => (
                                <button
                                    key={projectType}
                                    onClick={() => setSelectedProjectType((prev) => (prev === projectType ? null : projectType))}
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                        selectedProjectType === projectType
                                            ? (isNight ? "bg-[#00C9A7] text-white" : "bg-[#0F0F0F] text-white")
                                            : (isNight ? "bg-white/10 text-white/60 hover:bg-white/15" : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                                    }`}
                                >
                                    {projectType}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div>
                        <p className={`mb-1 text-xs font-bold ${isNight ? "text-white/40" : "text-gray-400"}`}>경력</p>
                        <div className="mb-4 flex flex-wrap gap-2">
                            {filterOptions.experienceLevels.map((experienceLevel) => (
                                <button
                                    key={experienceLevel}
                                    onClick={() => setSelectedExperience((prev) => (prev === experienceLevel ? null : experienceLevel))}
                                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                                        selectedExperience === experienceLevel
                                            ? (isNight ? "bg-[#00C9A7] text-white" : "bg-[#0F0F0F] text-white")
                                            : (isNight ? "bg-white/10 text-white/60 hover:bg-white/15" : "bg-gray-100 text-gray-600 hover:bg-gray-200")
                                    }`}
                                >
                                    {experienceLevel}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <p className={`mb-1 text-xs font-bold ${isNight ? "text-white/40" : "text-gray-400"}`}>카테고리</p>
                            <div className="space-y-2">
                                {filterOptions.categories.map((category) => (
                                    <button
                                        key={category}
                                        onClick={() => setSelectedCategory((prev) => (prev === category ? null : category))}
                                        className={`flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm transition ${
                                            selectedCategory === category
                                                ? (isNight ? "bg-[#00C9A7]/15 text-[#00C9A7]" : "bg-[#F5FFFB] text-[#007E68]")
                                                : (isNight ? "bg-white/5 text-white/60 hover:bg-white/10" : "bg-gray-50 text-gray-600 hover:bg-gray-100")
                                        }`}
                                    >
                                        <span>{category}</span>
                                        <span className={`rounded-full px-2 py-0.5 text-xs ${
                                            isNight ? "bg-white/10 text-white/50" : "bg-white"
                                        }`}>{categoryCounts[category] ?? 0}</span>
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
                            className={`w-full rounded-xl border border-dashed px-3 py-2 text-sm transition ${
                                isNight
                                    ? "border-white/20 text-white/40 hover:border-[#00C9A7]/50 hover:text-[#00C9A7]"
                                    : "border-gray-300 text-gray-500 hover:border-[#00C9A7] hover:text-[#00A88C]"
                            }`}
                        >
                            필터 초기화
                        </button>
                    </div>
                </aside>

                <main className="min-w-0 flex-1">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                        <div>
                            <p className={`text-sm ${isNight ? "text-white/50" : "text-gray-500"}`}>총 프로젝트</p>
                            <p className={`text-3xl font-black ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>{projectsData.length}</p>
                        </div>

                        <div className="flex items-center gap-2">
                            <select
                                value={sortBy}
                                onChange={(event) => setSortBy(event.target.value as (typeof SORT_OPTIONS)[number])}
                                className={`rounded-xl border px-3 py-2 text-sm transition-colors ${
                                    isNight
                                        ? "border-white/10 bg-[#141d30] text-white/70"
                                        : "border-gray-200 bg-white text-gray-600"
                                }`}
                            >
                                {SORT_OPTIONS.map((option) => (
                                    <option key={option} value={option}>
                                        {option}
                                    </option>
                                ))}
                            </select>

                            <div className={`overflow-hidden rounded-xl border ${isNight ? "border-white/10 bg-[#141d30]" : "border-gray-200 bg-white"}`}>
                                <button
                                    onClick={() => setViewMode("list")}
                                    className={`p-2 transition-colors ${viewMode === "list" ? "bg-[#00C9A7] text-white" : (isNight ? "text-white/40" : "text-gray-400")}`}
                                >
                                    <LayoutList className="size-4"/>
                                </button>
                                <button
                                    onClick={() => setViewMode("grid")}
                                    className={`p-2 transition-colors ${viewMode === "grid" ? "bg-[#00C9A7] text-white" : (isNight ? "text-white/40" : "text-gray-400")}`}
                                >
                                    <LayoutGrid className="size-4"/>
                                </button>
                            </div>
                        </div>
                    </div>

                    {loading && (
                        <div className={`rounded-3xl border border-dashed px-6 py-20 text-center text-sm ${
                            isNight ? "border-white/10 bg-[#141d30] text-white/50" : "border-gray-300 bg-white text-gray-500"
                        }`}>
                            프로젝트 목록을 불러오는 중입니다.
                        </div>
                    )}

                    {!loading && error && (
                        <div className={`rounded-3xl border px-6 py-20 text-center text-sm ${
                            isNight ? "border-red-500/20 bg-red-500/10 text-red-400" : "border-red-100 bg-red-50 text-red-600"
                        }`}>
                            {error}
                        </div>
                    )}

                    {!loading && !error && filteredProjects.length === 0 && (
                        <div className={`rounded-3xl border border-dashed px-6 py-20 text-center ${
                            isNight ? "border-white/10 bg-[#141d30]" : "border-gray-300 bg-white"
                        }`}>
                            <Search className={`mx-auto mb-4 size-8 ${isNight ? "text-white/20" : "text-gray-300"}`}/>
                            <p className={`text-sm font-semibold ${isNight ? "text-white/60" : "text-gray-600"}`}>조건에 맞는 프로젝트가 없습니다.</p>
                        </div>
                    )}

                    {!loading && !error && filteredProjects.length > 0 && (
                        <div className={viewMode === "grid" ? "grid grid-cols-1 gap-4 lg:grid-cols-2" : "space-y-4"}>
                            {filteredProjects.map((project) => (
                                <article
                                    key={project.id}
                                    onClick={() => void handleOpenProject(project)}
                                    className={`group cursor-pointer overflow-hidden rounded-3xl border shadow-sm transition hover:-translate-y-1 hover:shadow-xl ${
                                        isNight
                                            ? "border-white/10 bg-[#141d30] hover:border-[#00C9A7]/30"
                                            : "border-white/70 bg-white hover:border-[#BDEFD8]"
                                    }`}
                                >
                                    <div
                                        className={viewMode === "grid" ? "flex flex-col" : "flex flex-col md:flex-row"}>
                                        <Thumbnail project={project} mode={viewMode} isNight={isNight}/>

                                        <div className="flex flex-1 flex-col p-5">
                                            <div className="mb-3 flex items-start justify-between gap-3">
                                                <div className="min-w-0">
                                                    <div className="mb-2 flex flex-wrap items-center gap-2">
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                                                            isNight ? "bg-white/15 text-white" : "bg-[#0F0F0F] text-white"
                                                        }`}>{project.badge}</span>
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            isNight ? "bg-white/10 text-white/60" : "bg-gray-100 text-gray-600"
                                                        }`}>{project.category}</span>
                                                        <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                                            isNight ? "bg-[#00C9A7]/15 text-[#00C9A7]" : "bg-[#F5FFFB] text-[#007E68]"
                                                        }`}>{project.projectType}</span>
                                                    </div>
                                                    <h3 className={`line-clamp-1 text-lg font-black transition group-hover:text-[#00A88C] ${
                                                        isNight ? "text-white" : "text-[#0F0F0F]"
                                                    }`}>
                                                        {project.title}
                                                    </h3>
                                                </div>

                                                <button
                                                    onClick={(event) => toggleBookmark(project.id, event)}
                                                    className={`rounded-xl p-2 transition ${isNight ? "text-white/20 hover:bg-white/10" : "text-gray-300 hover:bg-gray-100"}`}
                                                >
                                                    <Bookmark
                                                        className={`size-4 ${bookmarked.includes(project.id) ? "fill-[#00C9A7] text-[#00C9A7]" : (isNight ? "text-white/20" : "text-gray-300")}`}
                                                    />
                                                </button>
                                            </div>

                                            <p className={`line-clamp-2 text-sm leading-6 ${isNight ? "text-white/50" : "text-gray-500"}`}>{project.description}</p>

                                            <div className={`mt-5 flex flex-wrap items-end justify-between gap-4 border-t pt-4 ${
                                                isNight ? "border-white/10" : "border-gray-100"
                                            }`}>
                                                <div>
                                                    <p className={`text-xs ${isNight ? "text-white/40" : "text-gray-400"}`}>예산</p>
                                                    <p className="text-lg font-black text-[#00A88C]">{project.budget}만원</p>
                                                </div>

                                                <div className={`flex items-center gap-3 text-sm ${isNight ? "text-white/50" : "text-gray-500"}`}>
                          <span className="inline-flex items-center gap-1">
                            <Clock className="size-4"/>
                              {project.experienceLevel}
                          </span>
                                                    <DdayPill deadline={project.deadline} isNight={isNight}/>
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
                    <div className={`rounded-3xl border p-5 shadow-sm transition-colors duration-700 ${
                        isNight ? "border-white/10 bg-[#141d30]" : "border-white/70 bg-white"
                    }`}>
                        <h2 className={`mb-4 text-sm font-bold uppercase tracking-[0.2em] ${isNight ? "text-white/40" : "text-gray-400"}`}>내 활동</h2>

                        {/* 세그먼트 컨트롤 */}
                        <div className={`mb-5 flex rounded-2xl p-1 ${isNight ? "bg-white/5" : "bg-gray-100"}`}>
                            <button
                                onClick={() => setActiveTab("posts")}
                                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                                    activeTab === "posts"
                                        ? (isNight ? "bg-[#1a2035] text-[#00C9A7] shadow-sm" : "bg-white text-[#007E68] shadow-sm")
                                        : (isNight ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600")
                                }`}
                            >
                                작성한 프로젝트
                            </button>
                            <button
                                onClick={() => setActiveTab("applications")}
                                className={`flex-1 rounded-xl py-2 text-xs font-bold transition-all ${
                                    activeTab === "applications"
                                        ? (isNight ? "bg-[#1a2035] text-[#00C9A7] shadow-sm" : "bg-white text-[#007E68] shadow-sm")
                                        : (isNight ? "text-white/40 hover:text-white/60" : "text-gray-400 hover:text-gray-600")
                                }`}
                            >
                                지원한 프로젝트
                            </button>
                        </div>

                        {/* 리스트 영역 */}
                        <div className="space-y-3">
                            {isActivityLoading ? (
                                <p className={`py-10 text-center text-xs ${isNight ? "text-white/40" : "text-gray-400"}`}>불러오는 중...</p>
                            ) : (activeTab === "posts" ? myPosts : myApplications).length === 0 ? (
                                <div className="py-10 text-center">
                                    <p className={`text-xs ${isNight ? "text-white/40" : "text-gray-400"}`}>내역이 없습니다.</p>
                                </div>
                            ) : (
                                (activeTab === "posts" ? myPosts : myApplications).map((item: any) => (
                                    <div
                                        key={item.id || item.postId}
                                        onClick={() => handleActivityItemClick(item)}
                                        className={`group relative cursor-pointer rounded-2xl border p-4 transition ${
                                            isNight
                                                ? "border-white/5 bg-white/5 hover:border-[#00C9A7]/30 hover:bg-white/10"
                                                : "border-gray-50 bg-gray-50/50 hover:border-[#BDEFD8] hover:bg-white"
                                        }`}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <span className={`text-[10px] font-bold ${item.projectState === 'OPEN' ? 'text-[#00C9A7]' : (isNight ? 'text-white/40' : 'text-gray-400')}`}>
                                {item.projectState === 'OPEN' ? '모집중' : '마감'}
                            </span>
                                            <span className={`text-[10px] ${isNight ? "text-white/40" : "text-gray-400"}`}>{item.deadline?.split('T')[0]}</span>
                                        </div>
                                        <p className={`mt-1 line-clamp-1 text-sm font-black group-hover:text-[#00A88C] ${isNight ? "text-white" : "text-[#0F0F0F]"}`}>
                                            {item.title}
                                        </p>
                                        <p className={`mt-1 line-clamp-2 text-[11px] leading-relaxed ${isNight ? "text-white/50" : "text-gray-500"}`}>
                                            {item.overview}
                                        </p>
                                        <div className="mt-3 flex items-center justify-between">
                                            <div className="flex gap-1.5">
                                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                    isNight ? "bg-white/10 text-white/60" : "bg-[#F1F1EE] text-gray-600"
                                }`}>
                                    {item.jobState}
                                </span>
                                                <span className={`rounded-md px-1.5 py-0.5 text-[10px] font-semibold ${
                                                    isNight ? "bg-blue-500/15 text-blue-400" : "bg-blue-50 text-blue-600"
                                                }`}>
                                    {item.category}
                                </span>
                                            </div>
                                            <ArrowRight className={`size-3 transition group-hover:translate-x-0.5 group-hover:text-[#00C9A7] ${isNight ? "text-white/20" : "text-gray-300"}`} />
                                        </div>
                                        <div className="mt-3 flex gap-2">
                                            {activeTab === "posts" ? (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleEditMyPost(item.postId, event)}
                                                        className={`flex-1 rounded-xl border px-3 py-2 text-[11px] font-semibold transition ${
                                                            isNight
                                                                ? "border-white/10 text-white/60 hover:border-[#00C9A7]/50 hover:text-[#00C9A7]"
                                                                : "border-gray-200 text-gray-600 hover:border-[#00C9A7] hover:text-[#00A88C]"
                                                        }`}
                                                    >
                                                        수정
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleDeleteMyPost(item.postId, event)}
                                                        className={`flex-1 rounded-xl border px-3 py-2 text-[11px] font-semibold transition ${
                                                            isNight
                                                                ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                                                                : "border-red-200 text-red-500 hover:bg-red-50"
                                                        }`}
                                                    >
                                                        삭제
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleEditMyApplication(item, event)}
                                                        className={`flex-1 rounded-xl border px-3 py-2 text-[11px] font-semibold transition ${
                                                            isNight
                                                                ? "border-white/10 text-white/60 hover:border-[#00C9A7]/50 hover:text-[#00C9A7]"
                                                                : "border-gray-200 text-gray-600 hover:border-[#00C9A7] hover:text-[#00A88C]"
                                                        }`}
                                                    >
                                                        지원서 수정
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={(event) => handleDeleteMyApplication(item.postId, event)}
                                                        className={`flex-1 rounded-xl border px-3 py-2 text-[11px] font-semibold transition ${
                                                            isNight
                                                                ? "border-red-500/20 text-red-400 hover:bg-red-500/10"
                                                                : "border-red-200 text-red-500 hover:bg-red-50"
                                                        }`}
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

                        <button className={`mt-5 w-full rounded-xl border border-dashed py-3 text-xs font-semibold transition ${
                            isNight
                                ? "border-white/15 text-white/40 hover:border-[#00C9A7]/50 hover:text-[#00C9A7]"
                                : "border-gray-200 text-gray-400 hover:border-[#BDEFD8] hover:text-[#00A88C]"
                        }`}>
                            전체 보기
                        </button>
                    </div>

                    {/* 하단 홍보 배너 */}
                    <div className={`rounded-3xl p-6 text-white shadow-lg ${
                        isNight
                            ? "bg-gradient-to-br from-[#1a2035] to-[#141d30] border border-white/10"
                            : "bg-gradient-to-br from-[#0F0F0F] to-[#1a1a1a]"
                    }`}>
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


