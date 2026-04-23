import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { Check, ChevronLeft, ChevronRight, Plus, X } from "lucide-react";
import Navigation from "../components/Navigation";
import { createProjectApi, getProjectFilterOptionsApi, type FilteringResponse } from "../api/projectApi";

const SKILL_PRESETS = ["Figma", "Illustrator", "Photoshop", "After Effects", "Cinema 4D", "Blender", "Webflow"];
// 예산과 일정이 Step 1으로 이동했으므로 Step을 3개로 압축합니다.
const STEP_LABELS = ["Basic", "Details", "Submit"] as const;
const DEFAULT_FILTERS: FilteringResponse = {
  categories: [],
  experienceLevels: [],
  jobStates: [],
};

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
              placeholder={tags.length === 0 ? "Add a skill and press Enter" : ""}
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
          Add item
        </button>
      </div>
  );
}

export default function CreateProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [filters, setFilters] = useState<FilteringResponse>(DEFAULT_FILTERS);
  const [loadingFilters, setLoadingFilters] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [budget, setBudget] = useState(""); // 만원 단위 예산
  const [category, setCategory] = useState("");
  const [jobState, setJobState] = useState("");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [overview, setOverview] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState<string[]>([""]);
  const [qualifications, setQualifications] = useState<string[]>([""]);
  const [deadline, setDeadline] = useState("");
  const minDeadline = new Date().toISOString().split("T")[0];

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
        toast.error(error instanceof Error ? error.message : "Failed to load filters.");
      } finally {
        if (mounted) setLoadingFilters(false);
      }
    }

    void loadFilters();

    return () => {
      mounted = false;
    };
  }, []);

  const step1Valid = Boolean(title.trim() && category && jobState && experienceLevel && deadline && budget.trim());
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

  const handleSubmit = async () => {
    if (submitDisabled) {
      toast.error("Fill in all required fields first.");
      return;
    }

    try {
      setSubmitting(true);
      const response = await createProjectApi({
        postType: "JOB_POST",
        title: title.trim(),
        category,
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

      toast.success("Project created.");
      navigate("/projects");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to create project.");
    } finally {
      setSubmitting(false);
    }
  };

  const goNext = () => {
    if (!canProceed) {
      toast.error("Complete this step first.");
      return;
    }
    setStep((current) => Math.min(current + 1, STEP_LABELS.length));
  };

  return (
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
                          placeholder="Project title"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">카테고리</label>
                      <div className="flex flex-wrap gap-2">
                        {filters.categories.map((item) => (
                            <button
                                key={item}
                                type="button"
                                onClick={() => setCategory(item)}
                                className={`rounded-full px-4 py-2 text-sm font-semibold ${
                                    category === item ? "bg-emerald-500 text-white" : "bg-gray-100 text-gray-600"
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
                  <h1 className="text-2xl font-bold text-slate-900">Project details</h1>
                  <div className="mt-6 space-y-6">
                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">프로젝트 개요</label>
                      <textarea
                          value={overview}
                          onChange={(event) => setOverview(event.target.value)}
                          rows={4}
                          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                          placeholder="Short project summary"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">상세 내용</label>
                      <textarea
                          value={fullDescription}
                          onChange={(event) => setFullDescription(event.target.value)}
                          rows={6}
                          className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm outline-none transition focus:border-emerald-400"
                          placeholder="Detailed project description"
                      />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">필요 기술역량</label>
                      <TagInput tags={skills} onChange={setSkills} />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">담당 업무</label>
                      <DynamicList items={responsibilities} onChange={setResponsibilities} placeholder="Responsibility item" />
                    </div>

                    <div>
                      <label className="mb-2 block text-sm font-semibold text-gray-700">지원 자격</label>
                      <DynamicList items={qualifications} onChange={setQualifications} placeholder="Qualification item" />
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
                      <p className="font-semibold text-slate-900">{title || "Untitled project"}</p>
                      <p className="mt-1">{category} / {jobState} / {experienceLevel}</p>
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
                    Previous
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
                    Next
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
                    {submitting ? "Submitting..." : "Create project"}
                  </button>
              )}
            </div>
          </div>

          {/* ── 우측 라이브 프리뷰 사이드바 ── */}
          <aside className="rounded-3xl bg-white p-6 shadow-sm">
            <h2 className="text-lg font-bold text-slate-900">Live preview</h2>
            {loadingFilters ? (
                <p className="mt-4 text-sm text-gray-500">Loading filter options...</p>
            ) : (
                <div className="mt-4 space-y-3 text-sm text-gray-600">
                  <div>
                    <p className="font-bold text-slate-900">제목: {title || "Project title"}</p>
                    <p className="mt-1">카테고리: {category || "미선택"}</p>
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
                  <h2 className="text-lg font-bold text-slate-900">Project Content</h2>
                  <div>
                    <p className="font-bold text-slate-900">[ 프로젝트 개요 ]</p>
                    <p>{overview || "Project Summary"}</p>
                  </div>
                  <br />
                  <div>
                    <p className="font-bold text-slate-900">[ 상세내용 ]</p>
                    <p className="whitespace-pre-wrap">{fullDescription || "Detailed Description"}</p>
                  </div>
                </div>
            )}
          </aside>
        </div>
      </div>
  );
}