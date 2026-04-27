import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import Navigation from "../components/Navigation";
import CompletionModal from "../components/CompletionModal";
import { createProjectApi, getProjectFilterOptionsApi, type FilteringResponse } from "../api/projectApi";
import { uploadFeedImagesApi } from "../api/uploadApi";
import { getCurrentUser } from "../utils/auth";

const SKILL_PRESETS = ["Figma", "Illustrator", "Photoshop", "After Effects", "Cinema 4D", "Blender", "Webflow"];
// 예산과 일정이 Step 1으로 이동했으므로 Step을 3개로 압축합니다.
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

function TagInput({
                    tags,
                    onChange,
                  }: {
  tags: string[];
  onChange: (next: string[]) => void;
}) {
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

  return (
      <div className="space-y-3">
        <div className="flex min-h-12 flex-wrap gap-2 rounded-2xl border border-gray-200 bg-white p-3">
          {tags.map((tag) => (
              <span key={tag} className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            {tag}
                <button type="button" onClick={() => onChange(tags.filter((item) => item !== tag))}>
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
              className="min-w-40 flex-1 bg-transparent text-sm outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {SKILL_PRESETS.filter((tag) => !tags.includes(tag)).map((tag) => (
              <button
                  key={tag}
                  type="button"
                  onClick={() => addTag(tag)}
                  className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 transition hover:border-emerald-400 hover:text-emerald-600"
              >
                + {tag}
              </button>
          ))}
        </div>
      </div>
  );
}

function DynamicList({
                       items,
                       onChange,
                       placeholder,
                     }: {
  items: string[];
  onChange: (items: string[]) => void;
  placeholder: string;
}) {
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
      <div className="space-y-3">
        {items.map((item, index) => (
            // 💡 여기가 수정되었습니다! key={`${index}-${item}`} -> key={index}
            <div key={index} className="flex items-center gap-2">
              <input
                  value={item}
                  onChange={(event) => updateItem(index, event.target.value)}
                  placeholder={placeholder}
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
              />
              <button type="button" onClick={() => removeItem(index)} className="rounded-xl border border-gray-200 p-3 text-gray-400">
                <X className="size-4" />
              </button>
            </div>
        ))}
        <button
            type="button"
            onClick={() => onChange([...items, ""])}
            className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-600"
        >
          <Plus className="size-4" />
          항목 추가
        </button>
      </div>
  );
}

export default function CreateProject() {
  const navigate = useNavigate();
  const currentUser = getCurrentUser();
  const [step, setStep] = useState(1);
  const [filters, setFilters] = useState<FilteringResponse>(DEFAULT_FILTERS);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [createdProjectTitle, setCreatedProjectTitle] = useState("");

  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState(""); // 만원 단위 예산
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

  const step1Valid = Boolean(title.trim() && selectedCategories.length > 0 && jobState && experienceLevel && deadline && budget.trim());
  const step2Valid = Boolean(
      overview.trim() &&
      fullDescription.trim() &&
      skills.length > 0 &&
      responsibilities.filter((r) => r.trim()).length > 0 &&
      qualifications.filter((q) => q.trim()).length > 0
  );

  const canProceed = useMemo(() => {
    if (step === 1) return step1Valid;
    if (step === 2) return step2Valid;
    return true;
  }, [step, step1Valid, step2Valid]);

  const submitDisabled = !step1Valid || !step2Valid || submitting;

  const toggleCategory = (category: string) => {
    setSelectedCategories((current) =>
      current.includes(category)
        ? current.filter((item) => item !== category)
        : [...current, category],
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

  const handleSubmit = async () => {
    if (currentUser?.role === "designer") {
      toast.error("클라이언트만 프로젝트를 등록할 수 있습니다.");
      navigate("/projects", { replace: true });
      return;
    }
    if (submitDisabled) {
      toast.error("필수 항목을 먼저 입력해주세요.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await createProjectApi({
        postType: "JOB_POST",
        title: title.trim(),
        category: selectedCategories[0] ?? "",
        categories: selectedCategories,
        jobState,
        experienceLevel,
        budget: Number(budget), // 만원 단위 정수로 파싱하여 전송
        overview: overview.trim(),
        fullDescription: fullDescription.trim(),
        skills,
        // 빈 배열을 걸러내고 순수 텍스트 배열(List<String>)을 그대로 전송합니다. (백엔드 CLOB 연동)
        responsibilities: responsibilities.filter((r) => r.trim()),
        qualifications: qualifications.filter((q) => q.trim()),
        state: "OPEN",
        deadline,
      });

      if (projectImageFiles.length > 0) {
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "프로젝트 등록에 실패했어요.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProjectCreateComplete = () => {
    setCreatedProjectTitle("");
    navigate("/projects");
  };

  const goNext = () => {
    if (!canProceed) {
      toast.error("현재 단계를 먼저 입력해주세요.");
      return;
    }
    setStep((current) => Math.min(current + 1, STEP_LABELS.length));
  };

  return (
    <>
      <div className="min-h-screen bg-[#f7f7f5]">
        <Navigation />

        <div className="border-b border-gray-200 bg-white">
          <div className="mx-auto flex max-w-5xl items-center gap-3 px-6 py-4">
            {STEP_LABELS.map((label, index) => {
              const current = index + 1;
              const active = current === step;
              const done = current < step;
              return (
                  <div key={label} className="flex items-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                          if (done) setStep(current);
                        }}
                        className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold ${
                            active ? "bg-emerald-500 text-white" : done ? "bg-emerald-50 text-emerald-700" : "bg-gray-100 text-gray-400"
                        }`}
                    >
                      {done ? <Check className="size-4" /> : <span>{current}</span>}
                      {label}
                    </button>
                    {index < STEP_LABELS.length - 1 && <ChevronRight className="size-4 text-gray-300" />}
                  </div>
              );
            })}
          </div>
        </div>

        <div className="mx-auto grid max-w-5xl gap-6 px-6 py-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {/* ── STEP 1: 기본 정보 ── */}
            {step === 1 && (
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                  <h1 className="text-2xl font-bold text-slate-900">프로젝트를 소개해주세요</h1>
                  <p className="mt-2 text-sm text-gray-500">핵심 정보를 입력하면 적합한 디자이너가 더 빨리 찾아옵니다.</p>

                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">제목</label>
                      <input
                          value={title}
                          onChange={(event) => setTitle(event.target.value)}
                          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                          placeholder="프로젝트 제목을 입력해주세요"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">카테고리</label>
                      <div className="flex flex-wrap gap-2">
                        {filters.categories.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => toggleCategory(item)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                    selectedCategories.includes(item) ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"
                                }`}
                            >
                              {item}
                            </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">프로젝트 유형</label>
                      <div className="flex flex-wrap gap-2">
                        {filters.jobStates.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setJobState(item)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                    jobState === item ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-600"
                                }`}
                            >
                              {item}
                            </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">경험 수준</label>
                      <div className="flex flex-wrap gap-2">
                        {filters.experienceLevels.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setExperienceLevel(item)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                    experienceLevel === item ? "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-400" : "bg-gray-100 text-gray-600"
                                }`}
                            >
                              {item}
                            </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">예산 상한</label>
                      <div className="flex items-center gap-2">
                        <input
                            type="number"
                            value={budget}
                            onChange={(event) => setBudget(event.target.value)} // 기존 setTitle 버그 수정
                            className="flex-1 rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                            placeholder="예: 500"
                        />
                        <p className="whitespace-nowrap text-sm text-gray-700">만원 이하</p>
                      </div>
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">마감일</label>
                      <input
                          type="date"
                          value={deadline}
                          min={minDeadline}
                          onChange={(event) => setDeadline(event.target.value)}
                          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                      />
                    </div>
                  </div>
                </section>
            )}

            {/* ── STEP 2: 상세 정보 ── */}
            {step === 2 && (
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                  <h1 className="text-2xl font-bold text-slate-900">프로젝트 상세 정보</h1>
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">프로젝트 개요</label>
                      <textarea
                          value={overview}
                          onChange={(event) => setOverview(event.target.value)}
                          rows={4}
                          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                          placeholder="프로젝트를 짧게 소개해주세요"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">상세 내용</label>
                      <textarea
                          value={fullDescription}
                          onChange={(event) => setFullDescription(event.target.value)}
                          rows={6}
                          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                          placeholder="프로젝트 상세 내용을 입력해주세요"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">필요 기술역량</label>
                      <TagInput tags={skills} onChange={setSkills} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">담당 업무</label>
                      <DynamicList items={responsibilities} onChange={setResponsibilities} placeholder="담당 업무를 입력해주세요" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">지원 자격</label>
                      <DynamicList items={qualifications} onChange={setQualifications} placeholder="지원 자격을 입력해주세요" />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">프로젝트 이미지 (선택)</label>
                      <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleProjectImageChange}
                          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-emerald-50 file:px-3 file:py-2 file:font-semibold file:text-emerald-700"
                      />
                      <p className="mt-2 text-xs text-gray-500">
                        이미지는 최대 {MAX_PROJECT_IMAGES}장까지 올릴 수 있고, 등록 시 함께 업로드돼요.
                      </p>
                      {projectImagePreviews.length > 0 && (
                          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                            {projectImagePreviews.map((preview, index) => (
                                <div key={`${preview}-${index}`} className="relative aspect-square overflow-hidden rounded-xl border border-gray-200">
                                  <img src={preview} alt={`프로젝트 미리보기 ${index + 1}`} className="h-full w-full object-cover" />
                                  <button
                                      type="button"
                                      onClick={() => handleRemoveProjectImage(index)}
                                      className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white"
                                      aria-label="이미지 삭제"
                                  >
                                    <X className="size-3" />
                                  </button>
                                </div>
                            ))}
                          </div>
                      )}
                    </div>
                  </div>
                </section>
            )}

            {/* ── STEP 3: 최종 확인 ── */}
            {step === 3 && (
                <section className="rounded-3xl bg-white p-6 shadow-sm">
                  <h1 className="text-2xl font-bold text-slate-900">등록 전 확인</h1>
                  <div className="mt-6 space-y-4 text-sm text-gray-700">
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="font-semibold text-slate-900">{title || "제목 없음"}</p>
                      <p className="mt-1">{selectedCategories.join(", ")} / {jobState} / {experienceLevel}</p>
                      <p className="mt-1">예산 상한: {budget ? `${budget} 만원` : "-"}</p>
                      <p className="mt-1">마감일: {deadline || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="font-semibold text-slate-900">프로젝트 개요</p>
                      <p className="mt-1 whitespace-pre-wrap">{overview || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="font-semibold text-slate-900">상세 내용</p>
                      <p className="mt-1 whitespace-pre-wrap">{fullDescription || "-"}</p>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="font-semibold text-slate-900">담당 업무</p>
                      <ul className="mt-1 list-inside list-disc space-y-1">
                        {responsibilities.filter((r) => r.trim()).length > 0 ? (
                            responsibilities.filter((r) => r.trim()).map((r, i) => <li key={i}>{r}</li>)
                        ) : (
                            <li>-</li>
                        )}
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="font-semibold text-slate-900">지원 자격</p>
                      <ul className="mt-1 list-inside list-disc space-y-1">
                        {qualifications.filter((q) => q.trim()).length > 0 ? (
                            qualifications.filter((q) => q.trim()).map((q, i) => <li key={i}>{q}</li>)
                        ) : (
                            <li>-</li>
                        )}
                      </ul>
                    </div>
                    <div className="rounded-2xl bg-gray-50 p-4">
                      <p className="font-semibold text-slate-900">프로젝트 이미지</p>
                      {projectImagePreviews.length > 0 ? (
                          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                            {projectImagePreviews.map((preview, index) => (
                                <img
                                    key={`${preview}-${index}`}
                                    src={preview}
                                    alt={`프로젝트 이미지 ${index + 1}`}
                                    className="aspect-square w-full rounded-lg object-cover"
                                />
                            ))}
                          </div>
                      ) : (
                          <p className="mt-1">-</p>
                      )}
                    </div>

                  </div>
                </section>
            )}

            {/* 하단 네비게이션 버튼 */}
            <div className="flex items-center justify-between">
              {step > 1 ? (
                  <button
                      type="button"
                      onClick={() => setStep((current) => current - 1)}
                      className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-5 py-3 text-sm font-semibold text-gray-700"
                  >
                    <ChevronLeft className="size-4" />
                    이전
                  </button>
              ) : (
                  <div />
              )}

              {step < STEP_LABELS.length ? (
                  <button
                      type="button"
                      onClick={goNext}
                      disabled={!canProceed}
                      className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold ${
                          canProceed ? "bg-slate-900 text-white" : "bg-gray-100 text-gray-400"
                      }`}
                  >
                    다음
                    <ChevronRight className="size-4" />
                  </button>
              ) : (
                  <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={submitDisabled}
                      className={`rounded-xl px-6 py-3 text-sm font-semibold ${
                          submitDisabled ? "bg-gray-100 text-gray-400" : "bg-emerald-500 text-white"
                      }`}
                  >
                    {submitting ? "등록 중..." : "프로젝트 등록"}
                  </button>
              )}
            </div>
          </div>

          {/* ── 우측 라이브 프리뷰 사이드바 ── */}
          <aside className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">미리보기</h2>
            {loadingFilters ? (
                <p className="mt-4 text-sm text-gray-500">필터 옵션을 불러오는 중이에요...</p>
            ) : (
                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  <div>
                    <p className="font-bold text-slate-900">제목: {title || "프로젝트 제목"}</p>
                    <p className="mt-1">카테고리: {selectedCategories.length > 0 ? selectedCategories.join(", ") : "미선택"}</p>
                    <p>
                      프로젝트 유형: {jobState || "미선택"}
                      {jobState === "단기" && " (1~3개월)"}
                      {jobState === "중기" && " (4~6개월)"}
                      {jobState === "장기" && " (7개월 이상)"}
                    </p>
                    <p>경험 수준: {experienceLevel || "미선택"}</p>
                  </div>
                  <div>
                    <p>희망 예산상한: {budget ? `${budget} 만원` : "입력 대기 중"}</p>
                    <p>마감일: {deadline || "미선택"}</p>
                  </div>
                  <div>
                    <p>담당 업무: {responsibilities.filter(r => r).join(", ") || "입력 대기 중"}</p>
                    <p>지원 자격: {qualifications.filter(q => q).join(", ") || "입력 대기 중"}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                        <span key={skill} className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                    {skill}
                  </span>
                    ))}
                  </div>
                  <hr />
                  <h2 className="text-lg font-bold text-slate-900">프로젝트 내용</h2>
                  <div>
                    <p className="font-bold text-slate-900">[ 프로젝트 개요 ]</p>
                    <p>{overview || "프로젝트 개요"}</p>
                  </div>
                  <br />
                  <div>
                    <p className="font-bold text-slate-900">[ 상세내용 ]</p>
                    <p className="whitespace-pre-wrap">{fullDescription || "상세 내용"}</p>
                  </div>
                </div>
            )}
          </aside>
        </div>
      </div>
      <CompletionModal
        open={Boolean(createdProjectTitle)}
        eyebrow="프로젝트 등록 완료"
        title="공고 등록이 완료되었습니다"
        description={`${createdProjectTitle || "새 프로젝트"} 공고가 저장되었어요.\n이제 프로젝트 목록에서 지원 현황을 확인할 수 있어요.`}
        primaryActionLabel="프로젝트 목록으로 이동"
        onPrimaryAction={handleProjectCreateComplete}
        onClose={handleProjectCreateComplete}
      />
    </>
  );
}
