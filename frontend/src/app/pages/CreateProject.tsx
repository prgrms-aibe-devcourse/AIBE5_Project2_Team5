import { useEffect, useMemo, useState, type ChangeEvent, type ReactNode } from "react";
import { useNavigate, useSearchParams } from "react-router";
import { toast } from "sonner";
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  FileText,
  LayoutGrid,
  Briefcase,
  GraduationCap,
  Wallet,
  Calendar,
  ListChecks,
  ImageIcon,
  Sparkles,
  AlertCircle,
  Eye,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Navigation from "../components/Navigation";
import CompletionModal from "../components/CompletionModal";
import {
  createProjectApi,
  getProjectDetailApi,
  getProjectFilterOptionsApi,
  updateProjectApi,
  type FilteringResponse,
} from "../api/projectApi";
import { uploadFeedImagesApi } from "../api/uploadApi";
import { getCurrentUser } from "../utils/auth";
import { useNightMode } from "../contexts/NightModeContext";

const SKILL_PRESETS = ["Figma", "Illustrator", "Photoshop", "After Effects", "Cinema 4D", "Blender", "Webflow"];
const STEP_LABELS = ["기본 정보", "상세 정보", "등록 확인"] as const;
const DEFAULT_FILTERS: FilteringResponse = {
  categories: [],
  experienceLevels: [],
  jobStates: [],
};
const MAX_PROJECT_IMAGES = 4;

const readImageFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("이미지 미리보기에 실패했어요."));
    };
    reader.onerror = () => reject(new Error("이미지 미리보기에 실패했어요."));
    reader.readAsDataURL(file);
  });

type TagInputProps = {
  tags: string[];
  onChange: (next: string[]) => void;
  isNight: boolean;
};

function TagInput({ tags, onChange, isNight }: TagInputProps) {
  const [input, setInput] = useState("");

  const addTag = (rawValue: string) => {
    const value = rawValue.trim();
    if (!value || tags.includes(value)) {
      setInput("");
      return;
    }
    onChange([...tags, value]);
    setInput("");
  };

  const shell = isNight
    ? "border-white/10 bg-[#0C1222] text-white placeholder:text-white/35"
    : "border-gray-200 bg-white text-gray-900 placeholder:text-gray-400";
  const chip = isNight
    ? "border border-[#00C9A7]/30 bg-[#00C9A7]/10 text-[#7ee8d3]"
    : "border border-[#CDEFE6] bg-[#EEF9F6] text-[#006B5C]";
  const preset = isNight
    ? "border border-white/15 text-base text-white/75 hover:border-[#00C9A7]/50 hover:text-[#7ee8d3]"
    : "border border-gray-200 text-base text-gray-700 hover:border-[#00C9A7] hover:text-[#00A88C]";

  return (
    <div className="space-y-2">
      <div className={`flex min-h-11 flex-wrap gap-1.5 rounded-lg border p-2.5 ${shell}`}>
        {tags.map((tag) => (
          <span
            key={tag}
            className={`inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-sm font-semibold ${chip}`}
          >
            {tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((item) => item !== tag))}
              className="opacity-80 hover:opacity-100"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === ",") {
              event.preventDefault();
              addTag(input);
            }
          }}
          placeholder={tags.length === 0 ? "필요한 기술을 입력하고 엔터를 눌러주세요" : ""}
          className="min-w-40 flex-1 bg-transparent text-base leading-normal outline-none"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {SKILL_PRESETS.filter((tag) => !tags.includes(tag)).map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => addTag(tag)}
            className={`rounded-md px-2.5 py-1.5 font-medium transition ${preset}`}
          >
            + {tag}
          </button>
        ))}
      </div>
    </div>
  );
}

type DynamicListProps = {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
  isNight: boolean;
};

function DynamicList({ items, onChange, placeholder, isNight }: DynamicListProps) {
  const inputCls = isNight
    ? "w-full rounded-lg border border-white/10 bg-[#0C1222] px-3.5 py-2.5 text-base leading-normal text-white placeholder:text-white/35 outline-none transition focus:ring-2 focus:ring-[#00C9A7]/40 [color-scheme:dark]"
    : "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-base leading-normal text-gray-900 shadow-sm placeholder:text-gray-400 outline-none transition focus:ring-2 focus:ring-[#00C9A7]/35";

  const removeBtn = isNight
    ? "rounded-lg border border-white/10 p-2.5 text-white/50 hover:bg-white/5 hover:text-white"
    : "rounded-lg border border-gray-200 p-2.5 text-gray-400 hover:bg-gray-50";

  const addLink = isNight ? "text-[#7ee8d3] hover:text-[#9af5e0]" : "text-[#00A88C] hover:text-[#006B5C]";

  const updateItem = (index: number, value: string) => {
    const next = [...items];
    next[index] = value;
    onChange(next);
  };

  const removeItem = (index: number) => {
    if (items.length === 1) {
      onChange([""]);
      return;
    }
    onChange(items.filter((_, itemIndex) => itemIndex !== index));
  };

  return (
    <div className="space-y-2">
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2">
          <input
            value={item}
            onChange={(event) => updateItem(index, event.target.value)}
            placeholder={placeholder}
            className={inputCls}
          />
          <button type="button" onClick={() => removeItem(index)} className={removeBtn} aria-label="항목 삭제">
            <X className="size-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...items, ""])}
        className={`inline-flex items-center gap-1.5 text-base font-semibold ${addLink}`}
      >
        <Plus className="size-4" />
        항목 추가
      </button>
    </div>
  );
}

function FormPanel({
  title,
  description,
  isNight,
  children,
  className = "",
}: {
  title: string;
  description?: string;
  isNight: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={`rounded-xl border p-4 sm:p-5 ${isNight ? "border-white/10 bg-[#141d30]/95" : "border-gray-200/90 bg-white shadow-sm"} ${className}`}
    >
      <h3 className={`text-xl font-semibold tracking-tight ${isNight ? "text-white" : "text-gray-900"}`}>{title}</h3>
      {description ? (
        <p className={`mt-1 text-base leading-snug ${isNight ? "text-white/55" : "text-gray-500"}`}>{description}</p>
      ) : null}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

type StepTrackProps = {
  step: number;
  isNight: boolean;
  labels: readonly string[];
  onGoto: (n: number) => void;
};

function StepTrack({ step, isNight, labels, onGoto }: StepTrackProps) {
  const fillFrac = (step - 1) / 2;
  return (
    <div className="relative mx-auto w-full max-w-4xl py-1">
      <div
        className={`pointer-events-none absolute left-0 right-0 top-[1.125rem] z-0 h-0.5 rounded-full ${isNight ? "bg-white/12" : "bg-gray-200"}`}
        aria-hidden
      />
      <div
        className="pointer-events-none absolute left-0 top-[1.125rem] z-0 h-0.5 max-w-full rounded-full bg-[#00C9A7] transition-all duration-500 ease-out"
        style={{ width: `${fillFrac * 100}%` }}
        aria-hidden
      />
      <div className="relative z-10 flex justify-between gap-1 sm:gap-2">
        {labels.map((label, index) => {
          const n = index + 1;
          const active = step === n;
          const done = step > n;
          return (
            <button
              key={label}
              type="button"
              onClick={() => done && onGoto(n)}
              disabled={!done && !active}
              className={`flex min-w-0 max-w-[34%] flex-1 flex-col items-center gap-1 rounded-lg p-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#00C9A7] ${
                isNight ? "focus-visible:ring-offset-[#0C1222]" : "focus-visible:ring-offset-[#F5F6F8]"
              } ${done ? "cursor-pointer" : !active ? "cursor-not-allowed" : "cursor-default"}`}
              aria-current={active ? "step" : undefined}
            >
              <span
                className={`flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition ${
                  done
                    ? "border-[#00C9A7] bg-[#00C9A7] text-[#0f172a]"
                    : active
                      ? isNight
                        ? "border-[#00C9A7] bg-[#141d30] text-[#7ee8d3]"
                        : "border-[#00C9A7] bg-white text-[#00A88C] shadow-sm"
                      : isNight
                        ? "border-white/15 bg-[#0C1222] text-white/35"
                        : "border-gray-300 bg-white text-gray-400"
                }`}
              >
                {done ? <Check className="size-4" strokeWidth={2.5} /> : n}
              </span>
              <span
                className={`text-center text-sm font-semibold leading-snug ${
                  active ? (isNight ? "text-[#7ee8d3]" : "text-[#00A88C]") : isNight ? "text-white/50" : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

type ChecklistEntry = { id: string; label: string; done: boolean; anchorId: string };

export default function CreateProject() {
  const navigate = useNavigate();
  const { isNight, toggle: toggleNight } = useNightMode();
  const [searchParams] = useSearchParams();
  const currentUser = getCurrentUser();
  const editingPostId = Number.parseInt(searchParams.get("edit") ?? "", 10);
  const isEditMode = Number.isFinite(editingPostId);
  const [step, setStep] = useState(1);
  const [filters, setFilters] = useState<FilteringResponse>(DEFAULT_FILTERS);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [loadingProject, setLoadingProject] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [createdProjectTitle, setCreatedProjectTitle] = useState("");
  const [completionMode, setCompletionMode] = useState<"create" | "update" | null>(null);

  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [jobState, setJobState] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [overview, setOverview] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([""]);
  const [qualifications, setQualifications] = useState<string[]>([""]);
  const [projectImageFiles, setProjectImageFiles] = useState<File[]>([]);
  const [projectImagePreviews, setProjectImagePreviews] = useState<string[]>([]);
  const [deadline, setDeadline] = useState("");
  const minDeadline = new Date().toISOString().split("T")[0];

  const previewDeadlineLabel = useMemo(() => {
    if (!deadline) return { short: "마감 미정", ymd: "" as string | null };
    const [y, m, dd] = deadline.split("-").map(Number);
    if (!y || !m || !dd) return { short: "마감 미정", ymd: null };
    const end = new Date(y, m - 1, dd);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end0 = new Date(end);
    end0.setHours(0, 0, 0, 0);
    const diffDays = Math.round((end0.getTime() - today.getTime()) / 864e5);
    const ymd = `${y}.${String(m).padStart(2, "0")}.${String(dd).padStart(2, "0")}`;
    if (diffDays < 0) return { short: "마감 경과", ymd };
    if (diffDays === 0) return { short: "D-Day", ymd };
    return { short: `D-${diffDays}`, ymd };
  }, [deadline]);

  const shell = isNight
    ? "min-h-screen bg-[#0C1222] text-white/90 antialiased"
    : "min-h-screen bg-[#F5F6F8] text-[#0F0F0F] antialiased";
  const card = isNight
    ? "rounded-xl border border-white/10 bg-[#141d30]/90 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] backdrop-blur-sm"
    : "rounded-xl border border-[#E5E7EB] bg-white shadow-sm";
  const muted = isNight ? "text-white/50" : "text-[#5F5E5A]";
  const labelCls =
    "mb-1.5 block text-sm font-semibold uppercase tracking-[0.08em] " + (isNight ? "text-white/60" : "text-gray-600");
  const inputCls = isNight
    ? "w-full rounded-lg border border-white/10 bg-[#0C1222] px-3.5 py-2.5 text-base leading-normal text-white placeholder:text-white/35 outline-none transition focus:ring-2 focus:ring-[#00C9A7]/40 [color-scheme:dark]"
    : "w-full rounded-lg border border-gray-200 bg-white px-3.5 py-2.5 text-base leading-normal text-gray-900 shadow-sm placeholder:text-gray-400 outline-none transition focus:ring-2 focus:ring-[#00C9A7]/35";

  const gridSelect = (selected: boolean) =>
    selected
      ? isNight
        ? "ring-2 ring-[#00C9A7] ring-offset-2 ring-offset-[#0C1222] border border-[#00C9A7]/40 bg-[#00C9A7]/10 text-white"
        : "ring-2 ring-[#00C9A7] ring-offset-2 ring-offset-[#F5F6F8] border border-transparent bg-[#EEF9F6] text-gray-900"
      : isNight
        ? "border border-white/10 bg-[#0C1222]/50 text-white/85 hover:border-white/20"
        : "border border-gray-200 bg-white text-gray-800 shadow-sm hover:border-gray-300";

  useEffect(() => {
    if (currentUser?.role !== "designer") {
      return;
    }
    toast.error("클라이언트만 프로젝트를 등록할 수 있습니다.");
    navigate("/projects", { replace: true });
  }, [currentUser?.role, navigate]);

  useEffect(() => {
    let mounted = true;
    async function loadFilters() {
      try {
        setLoadingFilters(true);
        const response = await getProjectFilterOptionsApi();
        if (!mounted) return;
        setFilters(response ?? DEFAULT_FILTERS);
      } catch (error) {
        if (!mounted) return;
        toast.error(error instanceof Error ? error.message : "필터 옵션을 불러오지 못했어요.");
      } finally {
        if (mounted) setLoadingFilters(false);
      }
    }
    void loadFilters();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!isEditMode) return;
    let mounted = true;
    async function loadProjectDetail() {
      try {
        setLoadingProject(true);
        const detail = await getProjectDetailApi(editingPostId);
        if (!mounted) return;
        setTitle(detail.title ?? "");
        setBudget(detail.budget != null ? String(detail.budget) : "");
        setSelectedCategories(
          Array.isArray(detail.categories) && detail.categories.length > 0
            ? detail.categories
            : detail.category
              ? [detail.category]
              : [],
        );
        setJobState(detail.jobState ?? "");
        setExperienceLevel(detail.experienceLevel ?? "");
        setOverview(detail.overview ?? "");
        setFullDescription(detail.fullDescription ?? "");
        setSkills(detail.skills ?? []);
        setResponsibilities(detail.responsibilities?.length ? detail.responsibilities : [""]);
        setQualifications(detail.qualifications?.length ? detail.qualifications : [""]);
        setDeadline(detail.deadline ?? "");
      } catch (error) {
        if (!mounted) return;
        toast.error(error instanceof Error ? error.message : "프로젝트 정보를 불러오지 못했어요.");
        navigate("/projects", { replace: true });
      } finally {
        if (mounted) setLoadingProject(false);
      }
    }
    void loadProjectDetail();
    return () => {
      mounted = false;
    };
  }, [editingPostId, isEditMode, navigate]);

  const step1Valid = Boolean(
    title.trim() && selectedCategories.length > 0 && jobState && experienceLevel && deadline && budget.trim(),
  );
  const step2Valid = Boolean(
    overview.trim() &&
      fullDescription.trim() &&
      skills.length > 0 &&
      responsibilities.filter((r) => r.trim()).length > 0 &&
      qualifications.filter((q) => q.trim()).length > 0,
  );

  const step1Checklist: ChecklistEntry[] = useMemo(
    () => [
      { id: "t", label: "프로젝트 제목", done: Boolean(title.trim()), anchorId: "field-title" },
      { id: "c", label: "카테고리(1개 이상)", done: selectedCategories.length > 0, anchorId: "field-categories" },
      { id: "j", label: "프로젝트 유형", done: Boolean(jobState), anchorId: "field-jobstate" },
      { id: "e", label: "경험 수준", done: Boolean(experienceLevel), anchorId: "field-experience" },
      { id: "b", label: "예산 상한(만원)", done: Boolean(budget.trim()), anchorId: "field-budget" },
      { id: "d", label: "마감일", done: Boolean(deadline), anchorId: "field-deadline" },
    ],
    [title, selectedCategories, jobState, experienceLevel, budget, deadline],
  );

  const step2Checklist: ChecklistEntry[] = useMemo(
    () => [
      { id: "o", label: "프로젝트 개요", done: Boolean(overview.trim()), anchorId: "field-overview" },
      { id: "f", label: "상세 내용", done: Boolean(fullDescription.trim()), anchorId: "field-detail" },
      { id: "s", label: "요구 스킬(1개 이상)", done: skills.length > 0, anchorId: "field-skills" },
      {
        id: "r",
        label: "담당 업무(1개 이상)",
        done: responsibilities.filter((r) => r.trim()).length > 0,
        anchorId: "field-responsibilities",
      },
      {
        id: "q",
        label: "지원 자격(1개 이상)",
        done: qualifications.filter((q) => q.trim()).length > 0,
        anchorId: "field-qualifications",
      },
    ],
    [overview, fullDescription, skills, responsibilities, qualifications],
  );

  const formProgress = useMemo(() => {
    const s1w = 6;
    const s2w = 5;
    let s1 = 0;
    if (title.trim()) s1++;
    if (selectedCategories.length > 0) s1++;
    if (jobState) s1++;
    if (experienceLevel) s1++;
    if (budget.trim()) s1++;
    if (deadline) s1++;
    let s2 = 0;
    if (overview.trim()) s2++;
    if (fullDescription.trim()) s2++;
    if (skills.length > 0) s2++;
    if (responsibilities.filter((r) => r.trim()).length > 0) s2++;
    if (qualifications.filter((q) => q.trim()).length > 0) s2++;
    return Math.round(((s1 / s1w) * 50 + (s2 / s2w) * 50) * 10) / 10;
  }, [
    title,
    selectedCategories,
    jobState,
    experienceLevel,
    budget,
    deadline,
    overview,
    fullDescription,
    skills,
    responsibilities,
    qualifications,
  ]);

  const canProceed = useMemo(() => {
    if (step === 1) return step1Valid;
    if (step === 2) return step2Valid;
    return true;
  }, [step, step1Valid, step2Valid]);

  const submitDisabled = !step1Valid || !step2Valid || submitting;

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category) ? current.filter((item) => item !== category) : [...current, category],
    );
  };

  const handleProjectImageChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
      .filter((file) => file.type.startsWith("image/"))
      .slice(0, Math.max(0, MAX_PROJECT_IMAGES - projectImageFiles.length));
    event.target.value = "";
    if (files.length === 0) {
      toast.error(`이미지는 최대 ${MAX_PROJECT_IMAGES}장까지 업로드할 수 있어요.`);
      return;
    }
    try {
      const previews = await Promise.all(files.map(readImageFileAsDataUrl));
      setProjectImageFiles((current) => [...current, ...files].slice(0, MAX_PROJECT_IMAGES));
      setProjectImagePreviews((current) => [...current, ...previews].slice(0, MAX_PROJECT_IMAGES));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "이미지 미리보기에 실패했어요.");
    }
  };

  const handleRemoveProjectImage = (index: number) => {
    setProjectImageFiles((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setProjectImagePreviews((current) => current.filter((_, currentIndex) => currentIndex !== index));
  };

  const scrollToField = (anchorId: string) => {
    const el = document.getElementById(anchorId);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  const scrollPageToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
  };

  const handleSubmit = async () => {
    if (currentUser?.role === "designer") {
      toast.error("클라이언트만 프로젝트를 등록할 수 있습니다.");
      navigate("/projects", { replace: true });
      return;
    }
    if (submitDisabled) {
      if (!step1Valid) {
        setStep(1);
        const first = step1Checklist.find((c) => !c.done);
        setTimeout(() => first && scrollToField(first.anchorId), 100);
        toast.error("1·2단계의 필수 항목이 모두 채워지지 않았어요. 기본·상세 단계의 체크리스트를 확인해 주세요.");
      } else {
        toast.error("필수 항목이 모두 완료된 뒤 등록할 수 있어요.");
      }
      return;
    }
    try {
      setSubmitting(true);
      const payload = {
        postType: "JOB_POST" as const,
        title: title.trim(),
        category: selectedCategories[0] ?? "",
        categories: selectedCategories,
        jobState,
        experienceLevel,
        budget: Number(budget),
        overview: overview.trim(),
        fullDescription: fullDescription.trim(),
        skills,
        responsibilities: responsibilities.filter((r) => r.trim()),
        qualifications: qualifications.filter((q) => q.trim()),
        state: "OPEN" as const,
        deadline,
      };
      const response = isEditMode ? await updateProjectApi(editingPostId, payload) : await createProjectApi(payload);
      if (!isEditMode && projectImageFiles.length > 0) {
        try {
          await uploadFeedImagesApi(response.postId, projectImageFiles);
        } catch (error) {
          toast.error(
            error instanceof Error
              ? `프로젝트는 등록됐지만 이미지 업로드에 실패했어요: ${error.message}`
              : "프로젝트는 등록됐지만 이미지 업로드에 실패했어요.",
          );
          navigate("/projects");
          return;
        }
      }
      setCreatedProjectTitle(response.title.trim() || title.trim());
      setCompletionMode(isEditMode ? "update" : "create");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : isEditMode ? "프로젝트 수정에 실패했어요." : "프로젝트 등록에 실패했어요.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleProjectCreateComplete = () => {
    setCreatedProjectTitle("");
    setCompletionMode(null);
    navigate("/projects");
  };

  const goNext = () => {
    if (!canProceed) {
      const list = step === 1 ? step1Checklist : step === 2 ? step2Checklist : [];
      const missing = list.filter((c) => !c.done);
      const first = missing[0];
      if (first) scrollToField(first.anchorId);
      const names = missing.map((m) => m.label);
      const sample = names.slice(0, 3).join(", ");
      toast.error(
        names.length
          ? `다음을 입력해 주세요: ${sample}${names.length > 3 ? ` 외 ${names.length - 3}개` : ""}.`
        : "현재 단계의 정보를 먼저 입력해주세요.",
      );
      return;
    }
    setStep((current) => Math.min(current + 1, STEP_LABELS.length));
    queueMicrotask(() => {
      scrollPageToTop();
    });
  };

  const reviewDlDt = isNight
    ? "text-sm font-semibold uppercase tracking-[0.08em] text-white/60"
    : "text-sm font-semibold uppercase tracking-[0.08em] text-gray-600";
  const reviewDlDd = isNight
    ? "text-base font-medium leading-snug text-white"
    : "text-base font-medium leading-snug text-gray-900";
  const reviewBody = isNight
    ? "text-base leading-snug text-white/80"
    : "text-base leading-snug text-gray-700";

  const previewKicker = isNight ? "text-sm font-semibold text-white" : "text-sm font-semibold text-gray-900";
  const previewMeta = isNight ? "text-sm leading-snug text-white/75" : "text-sm leading-snug text-gray-600";
  const previewLabelRow = isNight ? "text-sm font-medium text-white/60" : "text-sm font-medium text-gray-600";
  const previewValue = isNight ? "text-sm font-medium text-white" : "text-sm font-medium text-gray-900";
  const previewBodyText = isNight ? "text-base leading-snug text-white/75" : "text-base leading-snug text-gray-600";
  const previewWarn = isNight ? "text-sm font-medium text-amber-400" : "text-sm font-medium text-amber-600";
  const previewChip = isNight
    ? "rounded-md border border-[#00C9A7]/35 bg-[#00C9A7]/10 px-2 py-0.5 text-sm font-medium text-[#7ee8d3]"
    : "rounded-md border border-[#CDEFE6] bg-[#EEF9F6] px-2 py-0.5 text-sm font-medium text-[#006B5C]";

  return (
    <>
      <div className={`${shell} transition-colors duration-500`}>
        <Navigation isNight={isNight} onToggle={toggleNight} />

        <div className="pickxel-animate-page-in">
          <div
            className={`border-b ${isNight ? "border-white/5 bg-[#0C1222]/80" : "border-gray-200/80 bg-white"}`}
          >
            <div className="mx-auto max-w-6xl px-4 py-2.5 sm:px-6 sm:py-3">
              <p className={`text-xs font-semibold uppercase tracking-[0.12em] sm:text-sm ${muted}`}>
                {isEditMode ? "프로젝트 수정" : "새 공고"}
              </p>
              <h1
                className={`mt-0.5 text-xl font-bold tracking-tight sm:text-2xl ${
                  isNight ? "text-white" : "text-[#0F0F0F]"
                }`}
              >
                {isEditMode ? "공고를 업데이트하세요" : "프로젝트를 등록하세요"}
              </h1>
              <p className={`mt-0.5 max-w-2xl text-base leading-snug line-clamp-2 ${muted}`}>
                단계별로 필수 항목을 채우면 맞춤 제안이 더 잘 맞는 디자이너를 만날 수 있어요.
              </p>

              <nav className="mt-3" aria-label="등록 단계">
                <StepTrack
                  step={step}
                  isNight={isNight}
                  labels={STEP_LABELS}
                  onGoto={(n) => {
                    setStep(n);
                    queueMicrotask(() => {
                      scrollPageToTop();
                    });
                  }}
                />
              </nav>
            </div>
          </div>

          <div className="mx-auto grid max-w-6xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[1fr_min(380px,100%)]">
            <div className="min-w-0 space-y-4">
              {loadingFilters || loadingProject ? (
                <div className={`${card} p-8 text-center text-base leading-snug ${muted}`}>
                  {loadingProject ? "프로젝트 정보를 불러오는 중이에요…" : "옵션을 준비하는 중이에요…"}
                </div>
              ) : (
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <motion.section
                      key="s1"
                      id="create-step-1"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex items-start gap-2.5 px-0.5">
                        <div
                          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
                            isNight ? "bg-white/5 text-[#7ee8d3]" : "bg-[#EEF9F6] text-[#00A88C]"
                          }`}
                        >
                          <FileText className="size-5" />
                        </div>
                        <div>
                          <h2
                            className={`text-xl font-bold tracking-tight sm:text-2xl ${
                              isNight ? "text-white" : "text-[#0F0F0F]"
                            }`}
                          >
                            {isEditMode ? "기본 정보를 수정하세요" : "기본 정보"}
                          </h2>
                          <p className={`mt-1 text-base leading-snug ${muted}`}>
                            제목, 분야, 일정, 예산 — 디자이너가 공고를 이해하는 첫 화면이에요.
                          </p>
                        </div>
                      </div>

                      <FormPanel
                        title="프로젝트 요약"
                        description="공고 목록과 상세에 가장 먼저 노출되는 제목이에요."
                        isNight={isNight}
                      >
                        <div id="field-title">
                          <label className={labelCls}>제목</label>
                          <input
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className={inputCls}
                            placeholder="프로젝트 제목을 입력해주세요"
                            autoComplete="off"
                          />
                        </div>
                      </FormPanel>

                      <FormPanel
                        title="분야·조건"
                        description="맞는 디자이너를 찾기 위한 태그예요. 카테고리는 복수 선택할 수 있어요."
                        isNight={isNight}
                      >
                        <div id="field-categories">
                          <label className={labelCls}>
                            <span className="inline-flex items-center gap-1.5">
                              <LayoutGrid className="size-4" /> 카테고리
                            </span>
                          </label>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                            {filters.categories.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => toggleCategory(item)}
                                className={`rounded-lg px-3.5 py-2.5 text-left text-base font-medium transition ${gridSelect(
                                  selectedCategories.includes(item),
                                )}`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div id="field-jobstate">
                          <label className={labelCls}>
                            <span className="inline-flex items-center gap-1.5">
                              <Briefcase className="size-4" /> 프로젝트 유형
                            </span>
                          </label>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                            {filters.jobStates.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setJobState(item)}
                                className={`rounded-lg px-3.5 py-2.5 text-left text-base font-medium transition ${gridSelect(
                                  jobState === item,
                                )}`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div id="field-experience">
                          <label className={labelCls}>
                            <span className="inline-flex items-center gap-1.5">
                              <GraduationCap className="size-4" /> 경험 수준
                            </span>
                          </label>
                          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 md:grid-cols-3">
                            {filters.experienceLevels.map((item) => (
                              <button
                                key={item}
                                type="button"
                                onClick={() => setExperienceLevel(item)}
                                className={`rounded-lg px-3.5 py-2.5 text-left text-base font-medium transition ${gridSelect(
                                  experienceLevel === item,
                                )}`}
                              >
                                {item}
                              </button>
                            ))}
                          </div>
                        </div>
                      </FormPanel>

                      <FormPanel
                        title="예산·일정"
                        description="검수와 일정에 맞춰 제안 품질이 달라져요."
                        isNight={isNight}
                      >
                        <div className="grid gap-4 sm:grid-cols-2" id="field-budget">
                          <div>
                            <label className={labelCls}>
                              <span className="inline-flex items-center gap-1.5">
                                <Wallet className="size-4" /> 예산 상한(만원)
                              </span>
                            </label>
                            <div className="flex items-center gap-2">
                              <input
                                type="number"
                                value={budget}
                                onChange={(e) => setBudget(e.target.value)}
                                className={inputCls + " tabular-nums"}
                                placeholder="예) 500"
                                min={0}
                              />
                              <span
                                className={`shrink-0 text-base font-medium ${
                                  isNight ? "text-white/60" : "text-gray-600"
                                }`}
                              >
                                만원 이하
                              </span>
                            </div>
                          </div>
                          <div id="field-deadline">
                            <label className={labelCls}>
                              <span className="inline-flex items-center gap-1.5">
                                <Calendar className="size-4" /> 마감일
                              </span>
                            </label>
                            <input
                              type="date"
                              value={deadline}
                              min={minDeadline}
                              onChange={(e) => setDeadline(e.target.value)}
                              className={inputCls + " tabular-nums"}
                            />
                          </div>
                        </div>
                      </FormPanel>
                    </motion.section>
                  )}

                  {step === 2 && (
                    <motion.section
                      key="s2"
                      id="create-step-2"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <div className="flex items-start gap-2.5 px-0.5">
                        <div
                          className={`mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg ${
                            isNight ? "bg-white/5 text-[#7ee8d3]" : "bg-[#EEF9F6] text-[#00A88C]"
                          }`}
                        >
                          <ListChecks className="size-5" />
                        </div>
                        <div>
                          <h2
                            className={`text-xl font-bold tracking-tight sm:text-2xl ${isNight ? "text-white" : "text-[#0F0F0F]"}`}
                          >
                            상세 정보
                          </h2>
                          <p className={`mt-1 text-base leading-snug ${muted}`}>
                            업무 범위와 지원 자격이 명확할수록 제안 품질이 올라가요.
                          </p>
                        </div>
                      </div>

                      <FormPanel
                        title="프로젝트 설명"
                        description="짧은 개요와 상세 본문으로 기대를 정리해 주세요."
                        isNight={isNight}
                      >
                        <div id="field-overview">
                          <label className={labelCls}>프로젝트 개요</label>
                          <textarea
                            value={overview}
                            onChange={(e) => setOverview(e.target.value)}
                            rows={4}
                            className={inputCls + " min-h-[6.25rem] resize-y leading-relaxed"}
                            placeholder="프로젝트를 짧고 명확하게 소개해주세요"
                          />
                        </div>
                        <div id="field-detail">
                          <label className={labelCls}>상세 내용</label>
                          <textarea
                            value={fullDescription}
                            onChange={(e) => setFullDescription(e.target.value)}
                            rows={6}
                            className={inputCls + " min-h-[8rem] resize-y leading-relaxed"}
                            placeholder="프로젝트 상세 내용을 입력해주세요"
                          />
                        </div>
                      </FormPanel>

                      <FormPanel
                        title="요구 사항"
                        description="스킬과 역할, 자격을 구체적으로 적을수록 제안이 정확해져요."
                        isNight={isNight}
                      >
                        <div id="field-skills">
                          <label className={labelCls}>
                            <span className="inline-flex items-center gap-1.5">
                              <Sparkles className="size-4" /> 요구 스킬
                            </span>
                          </label>
                          <TagInput tags={skills} onChange={setSkills} isNight={isNight} />
                        </div>
                        <div id="field-responsibilities">
                          <label className={labelCls}>담당 업무</label>
                          <DynamicList
                            items={responsibilities}
                            onChange={setResponsibilities}
                            placeholder="담당 업무를 입력해주세요"
                            isNight={isNight}
                          />
                        </div>
                        <div id="field-qualifications">
                          <label className={labelCls}>지원 자격</label>
                          <DynamicList
                            items={qualifications}
                            onChange={setQualifications}
                            placeholder="지원 자격을 입력해주세요"
                            isNight={isNight}
                          />
                        </div>
                      </FormPanel>

                      <FormPanel
                        title="프로젝트 이미지"
                        description="대표 이미지는 최대 4장까지, 등록 직후 업로드돼요."
                        isNight={isNight}
                      >
                        <div>
                          <label className={labelCls}>
                            <span className="inline-flex items-center gap-1.5">
                              <ImageIcon className="size-4" /> 이미지 파일 (선택)
                            </span>
                          </label>
                          <input
                            type="file"
                            accept="image/*"
                            multiple
                            onChange={handleProjectImageChange}
                            className={
                              inputCls +
                              " file:mr-3 file:rounded-md file:border-0 file:px-3 file:py-1.5 file:text-base file:font-semibold " +
                              (isNight
                                ? "file:bg-white/10 file:text-[#7ee8d3]"
                                : "file:bg-[#EEF9F6] file:text-[#00A88C]")
                            }
                          />
                          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {Array.from({ length: MAX_PROJECT_IMAGES }).map((_, index) => {
                              const src = projectImagePreviews[index];
                              return (
                                <div
                                  key={index}
                                  className={`relative aspect-square overflow-hidden rounded-lg ${
                                    src
                                      ? isNight
                                        ? "border border-white/10"
                                        : "border border-gray-200"
                                      : isNight
                                        ? "border-2 border-dashed border-white/15 bg-white/[0.02]"
                                        : "border-2 border-dashed border-gray-200 bg-gray-50/80"
                                  }`}
                                >
                                  {src ? (
                                    <>
                                      <img src={src} alt="" className="h-full w-full object-cover" />
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveProjectImage(index)}
                                        className="absolute right-1.5 top-1.5 rounded bg-black/65 p-1.5 text-white"
                                        aria-label="이미지 삭제"
                                      >
                                        <X className="size-3" />
                                      </button>
                                    </>
                                  ) : (
                                    <div className="flex h-full flex-col items-center justify-center gap-1 p-2 text-center">
                                      <ImageIcon className={`size-6 ${isNight ? "text-white/20" : "text-gray-300"}`} />
                                      <span
                                        className={`text-sm font-medium ${
                                          isNight ? "text-white/40" : "text-gray-400"
                                        }`}
                                      >
                                        슬롯 {index + 1}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </FormPanel>
                    </motion.section>
                  )}

                  {step === 3 && (
                    <motion.section
                      key="s3"
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -8 }}
                      transition={{ duration: 0.25 }}
                      className="space-y-4"
                    >
                      <FormPanel
                        description={`아래 내용이 맞다면 ${isEditMode ? "수정" : "등록"}을 진행하세요.`}
                        isNight={isNight}
                      >
                        <dl
                          className={`divide-y ${isNight ? "divide-white/10" : "divide-gray-200/90"} -mt-1 space-y-0`}
                        >
                          <div className="grid gap-0.5 pb-3 pt-1.5 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-x-5 sm:gap-y-0.5">
                            <dt className={reviewDlDt}>제목·분류</dt>
                            <dd className={reviewDlDd}>
                              {title || "제목 없음"}
                              <p className={`mt-1 text-sm font-normal ${muted}`}>
                                {selectedCategories.join(", ") || "—"} / {jobState || "—"} / {experienceLevel || "—"}
                              </p>
                            </dd>
                          </div>
                          <div className="grid gap-0.5 py-3 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-x-5 sm:gap-y-0.5">
                            <dt className={reviewDlDt}>예산·마감</dt>
                            <dd className={reviewDlDd}>
                              <span className="tabular-nums">{budget ? `${budget}만원` : "—"}</span>
                              <span className={isNight ? "mx-2 text-white/30" : "mx-2 text-gray-300"}>·</span>
                              <span className="tabular-nums">{deadline || "—"}</span>
                            </dd>
                          </div>
                          <div className="grid gap-0.5 py-3 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-x-5 sm:gap-y-0.5">
                            <dt className={reviewDlDt}>프로젝트 개요</dt>
                            <dd className={`whitespace-pre-wrap ${reviewBody}`}>{overview || "—"}</dd>
                          </div>
                          <div className="grid gap-0.5 py-3 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-x-5 sm:gap-y-0.5">
                            <dt className={reviewDlDt}>상세 내용</dt>
                            <dd className={`whitespace-pre-wrap ${reviewBody}`}>{fullDescription || "—"}</dd>
                          </div>
                          <div className="grid gap-0.5 py-3 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-x-5 sm:gap-y-0.5">
                            <dt className={reviewDlDt}>담당 업무</dt>
                            <dd className={reviewBody}>
                              <ul className="list-inside list-disc space-y-0.5">
                                {responsibilities.filter((r) => r.trim()).length > 0
                                  ? responsibilities.filter((r) => r.trim()).map((r, i) => <li key={i}>{r}</li>)
                                  : <li>—</li>}
                              </ul>
                            </dd>
                          </div>
                          <div className="grid gap-0.5 py-3 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-x-5 sm:gap-y-0.5">
                            <dt className={reviewDlDt}>지원 자격</dt>
                            <dd className={reviewBody}>
                              <ul className="list-inside list-disc space-y-0.5">
                                {qualifications.filter((q) => q.trim()).length > 0
                                  ? qualifications.filter((q) => q.trim()).map((q, i) => <li key={i}>{q}</li>)
                                  : <li>—</li>}
                              </ul>
                            </dd>
                          </div>
                          <div className="grid gap-0.5 pt-3 sm:grid-cols-[minmax(0,10rem)_1fr] sm:gap-x-5 sm:gap-y-0.5">
                            <dt className={reviewDlDt}>이미지</dt>
                            <dd>
                              {projectImagePreviews.length > 0 ? (
                                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                                  {projectImagePreviews.map((preview, i) => (
                                    <img
                                      key={i}
                                      src={preview}
                                      alt=""
                                      className="aspect-square rounded-lg object-cover"
                                    />
                                  ))}
                                </div>
                              ) : (
                                <span className={reviewBody}>—</span>
                              )}
                            </dd>
                          </div>
                        </dl>
                      </FormPanel>
                    </motion.section>
                  )}
                </AnimatePresence>
              )}

              {/* Checklist + nav */}
              {!loadingFilters && !loadingProject && (step === 1 || step === 2) && (
                <div
                  className={`flex flex-col gap-2 rounded-xl border p-3 sm:flex-row sm:items-center sm:justify-between sm:p-4 ${
                    isNight ? "border-white/10 bg-[#141d30]/95" : "border-gray-200/90 bg-white shadow-sm"
                  }`}
                >
                  <div className="flex min-w-0 items-start gap-2">
                    <AlertCircle
                      className={`mt-0.5 size-5 shrink-0 ${!canProceed ? (isNight ? "text-amber-400" : "text-amber-600") : (isNight ? "text-[#7ee8d3]" : "text-[#00A88C]")}`}
                    />
                    <div>
                      <p className={`text-sm font-semibold uppercase tracking-wide ${isNight ? "text-white/60" : "text-gray-600"}`}>
                        {step === 1 ? "1단계" : "2단계"} — 다음으로 넘어가려면
                      </p>
                      <ul className="mt-1.5 flex flex-col gap-1">
                        {(step === 1 ? step1Checklist : step2Checklist).map((c) => (
                          <li key={c.id} className="flex items-center gap-2 text-base">
                            {c.done ? (
                              <Check className="size-4 shrink-0 text-[#00C9A7]" />
                            ) : (
                              <span className="size-4 shrink-0 rounded border border-amber-500/50" />
                            )}
                            <button
                              type="button"
                              onClick={() => scrollToField(c.anchorId)}
                              className={`min-w-0 text-left ${
                                c.done
                                  ? isNight
                                    ? "text-white/40 line-through"
                                    : "text-gray-400 line-through"
                                  : isNight
                                    ? "font-medium text-amber-200/90"
                                    : "font-medium text-amber-800"
                              }`}
                            >
                              {c.label}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-1.5 sm:flex-row sm:items-center sm:justify-end">
                {step > 1 ? (
                  <button
                    type="button"
                    onClick={() => {
                      setStep((s) => s - 1);
                      queueMicrotask(() => {
                        scrollPageToTop();
                      });
                    }}
                    className={
                      isNight
                        ? "order-2 flex h-10 items-center justify-center gap-1 self-start px-1 text-base font-medium text-white/80 hover:underline sm:order-1 sm:justify-start"
                        : "order-2 flex h-10 items-center justify-center gap-1 self-start px-1 text-base font-medium text-gray-600 hover:underline sm:order-1 sm:justify-start"
                    }
                  >
                    <ChevronLeft className="size-4" />
                    이전
                  </button>
                ) : (
                  <div className="order-2 sm:order-1" />
                )}

                {step < STEP_LABELS.length ? (
                  <button
                    type="button"
                    onClick={goNext}
                    className={
                      "order-1 flex h-11 w-full min-h-[44px] max-w-sm items-center justify-center gap-2 self-end rounded-lg px-4 text-base font-semibold shadow-sm sm:ml-auto sm:w-auto sm:min-w-[10.5rem] " +
                      (canProceed
                        ? isNight
                          ? "bg-[#00C9A7] text-[#0f172a] hover:bg-[#00E0BA]"
                          : "bg-[#0F0F0F] text-white hover:bg-[#1a1a1a]"
                        : isNight
                          ? "cursor-not-allowed bg-white/10 text-white/35 shadow-none"
                          : "cursor-not-allowed bg-gray-200 text-gray-500 shadow-none")
                    }
                  >
                    다음 단계
                    <ChevronRight className="size-4" />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleSubmit}
                    disabled={submitDisabled}
                    className={
                      "order-1 flex h-11 w-full min-h-[44px] max-w-sm items-center justify-center gap-2 self-end rounded-lg px-4 text-base font-semibold sm:ml-auto sm:w-auto sm:min-w-[10.5rem] " +
                      (!submitDisabled
                        ? isNight
                          ? "bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0f172a] shadow-sm hover:opacity-95"
                          : "bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] shadow-sm hover:opacity-95"
                        : isNight
                          ? "cursor-not-allowed bg-white/10 text-white/35"
                          : "cursor-not-allowed bg-gray-200 text-gray-500")
                    }
                  >
                    {submitting ? (isEditMode ? "수정 중…" : "등록 중…") : (isEditMode ? "수정 사항 반영" : "프로젝트 등록")}
                  </button>
                )}
              </div>
            </div>

            {/* Preview: 공고 카드형 */}
            <aside
              className={`${card} h-fit overflow-hidden border-l-4 border-l-[#00C9A7] p-0 lg:sticky lg:top-20`}
            >
              <div
                className={`h-1 w-full bg-gradient-to-r from-[#00C9A7]/50 via-[#00A88C]/40 to-[#00C9A7]/20`}
                aria-hidden
              />
              <div className="p-3 sm:p-4">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Eye className={`size-4 shrink-0 ${isNight ? "text-white/55" : "text-gray-500"}`} />
                    <h2 className={previewKicker}>공고 미리보기</h2>
                  </div>
                </div>
                <div
                  className={`mt-2.5 h-1 w-full overflow-hidden rounded-full ${isNight ? "bg-white/10" : "bg-gray-200"}`}
                >
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#00C9A7] to-[#00A88C] transition-all duration-500"
                    style={{ width: `${formProgress}%` }}
                  />
                </div>
                <p className={`mt-1.5 text-right text-sm font-medium ${isNight ? "text-white/55" : "text-gray-500"}`}>
                  작성률 {formProgress}%
                </p>
                {loadingFilters || loadingProject ? (
                  <p className={`mt-2 text-base leading-snug ${muted}`}>
                    {loadingProject ? "불러오는 중…" : "옵션 준비 중…"}
                  </p>
                ) : (
                  <div className="mt-3 space-y-0 text-base leading-snug">
                    {projectImagePreviews.length > 0 && (
                      <div
                        className={`-mx-1 mb-3 flex gap-1.5 overflow-x-auto pb-1`}
                      >
                        {projectImagePreviews.map((src, i) => (
                          <div
                            key={i}
                            className={`h-14 w-20 shrink-0 overflow-hidden rounded-md ${
                              isNight ? "border border-white/10" : "border border-gray-200"
                            }`}
                          >
                            <img src={src} alt="" className="h-full w-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}

                    <div
                      className={
                        isNight
                          ? "border-b border-white/10 pb-3"
                          : "border-b border-gray-100 pb-3"
                      }
                    >
                      <h3
                        className={`line-clamp-2 text-lg font-semibold leading-tight ${
                          isNight ? "text-white" : "text-[#0F0F0F]"
                        }`}
                      >
                        {title.trim() || (
                          <span className={isNight ? "text-white/45" : "text-gray-400"}>제목을 입력해 주세요</span>
                        )}
                      </h3>
                      <div className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-sm">
                        <Briefcase
                          className={`size-4 shrink-0 ${isNight ? "text-white/45" : "text-gray-400"}`}
                          aria-hidden
                        />
                        <span className={previewMeta}>
                          {selectedCategories.length > 0 ? (
                            <span className={isNight ? "text-white/80" : "text-gray-700"}>
                              {selectedCategories.join(" · ")}
                            </span>
                          ) : (
                            <span className={previewWarn}>카테고리 미입력</span>
                          )}
                          <span className={isNight ? "mx-1.5 text-white/30" : "mx-1.5 text-gray-300"}>|</span>
                          {jobState ? (
                            <span className={isNight ? "text-white/80" : "text-gray-700"}>{jobState}</span>
                          ) : (
                            <span className={previewWarn}>유형</span>
                          )}
                          <span className={isNight ? "mx-1.5 text-white/30" : "mx-1.5 text-gray-300"}>|</span>
                          {experienceLevel ? (
                            <span className={isNight ? "text-white/80" : "text-gray-700"}>{experienceLevel}</span>
                          ) : (
                            <span className={previewWarn}>경험</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div
                      className={
                        isNight
                          ? "space-y-1.5 border-b border-white/10 py-3"
                          : "space-y-1.5 border-b border-gray-100 py-3"
                      }
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className={previewLabelRow}>예산</span>
                        <span className={previewValue + " tabular-nums"}>
                          {budget.trim() && !Number.isNaN(Number(budget)) ? (
                            <>{Number(budget).toLocaleString()}만원</>
                          ) : (
                            <span className={previewWarn}>미입력</span>
                          )}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <span className={previewLabelRow}>마감</span>
                        <span className={`text-right ${previewValue} tabular-nums`}>
                          {previewDeadlineLabel.ymd ? (
                            <>
                              <span className="text-[#00C9A7]">{previewDeadlineLabel.short}</span>
                              <span className={isNight ? "text-white/50" : "text-gray-500"}>
                                {" "}
                                · {previewDeadlineLabel.ymd}
                              </span>
                            </>
                          ) : (
                            <span className={previewWarn}>미정</span>
                          )}
                        </span>
                      </div>
                    </div>

                    <div className="py-3">
                      <p className={`mb-1.5 ${previewLabelRow} uppercase tracking-[0.08em]`}>스킬</p>
                      <div className="flex flex-wrap gap-1.5">
                        {skills.length > 0 ? (
                          <>
                            {skills.slice(0, 4).map((skill) => (
                              <span key={skill} className={previewChip}>
                                {skill}
                              </span>
                            ))}
                            {skills.length > 4 && (
                              <span
                                className={`self-center text-sm font-semibold ${
                                  isNight ? "text-white/50" : "text-gray-500"
                                }`}
                              >
                                +{skills.length - 4}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className={previewWarn}>스킬 미입력</span>
                        )}
                      </div>
                    </div>

                    <div
                      className={isNight ? "border-t border-white/10 pt-3" : "border-t border-gray-100 pt-3"}
                    >
                      <p className={`mb-1.5 text-sm font-semibold text-[#00C9A7]`}>개요</p>
                      <p className={`line-clamp-3 ${previewBodyText}`}>
                        {overview.trim() || "짧은 소개가 여기에 표시돼요."}
                      </p>
                    </div>
                    <div
                      className={`mt-3 ${isNight ? "border-t border-white/10 pt-3" : "border-t border-gray-100 pt-3"}`}
                    >
                      <p className={`mb-1.5 text-sm font-semibold text-[#00C9A7]`}>상세</p>
                      <p className={`line-clamp-4 ${previewBodyText}`}>
                        {fullDescription.trim() || "상세 설명이 이어집니다."}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </aside>
          </div>
        </div>
      </div>
      <CompletionModal
        open={Boolean(createdProjectTitle) && completionMode !== null}
        isNight={isNight}
        eyebrow={completionMode === "update" ? "프로젝트 수정 완료" : "프로젝트 등록 완료"}
        title={completionMode === "update" ? "프로젝트 수정이 완료되었습니다." : "공고 등록이 완료되었습니다."}
        description={
          completionMode === "update"
            ? `${createdProjectTitle || "이 프로젝트"} 공고 내용이 저장되었어요.\n프로젝트 목록에서 변경된 내용을 바로 확인할 수 있어요.`
            : `${createdProjectTitle || "이 프로젝트"} 공고가 등록되었어요.\n이제 프로젝트 목록에서 지원 현황을 확인할 수 있어요.`
        }
        primaryActionLabel="프로젝트 목록으로 이동"
        onPrimaryAction={handleProjectCreateComplete}
        onClose={handleProjectCreateComplete}
      />
    </>
  );
}
