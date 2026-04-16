import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router";
import { motion, AnimatePresence } from "motion/react";
import { useDropzone } from "react-dropzone";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import Navigation from "../components/Navigation";
import { Slider } from "../components/ui/slider";
import {
  Tag, Plus, X, ChevronLeft, ChevronRight, Check,
  Clock, MapPin, Layers, Users, Briefcase, Calendar,
  Image as ImageIcon, Building2, Sparkles, GripVertical,
  AlertCircle, Eye,
} from "lucide-react";

// ── 상수 ──────────────────────────────────────────────────────
const CATEGORIES = ["UI/UX", "브랜딩", "모션/영상", "일러스트", "그래픽 디자인", "웹 디자인", "3D/시각화", "타이포그래피"];
const EXP_LEVELS = ["1년 미만", "1~3년", "3년 이상", "5년 이상"];
const DURATION_OPTS = ["2주", "1개월", "6주", "2개월", "3개월", "6개월 이상"];
const BADGE_OPTS = [
  { value: "급구", color: "bg-[#FF5C3A] text-white" },
  { value: "모집중", color: "bg-[#00C9A7] text-white" },
  { value: "검토중", color: "bg-gray-400 text-white" },
];
const STEP_LABELS = ["기본 정보", "상세 내용", "예산 & 일정", "레퍼런스", "미리보기"];
const SKILL_PRESETS = ["Figma", "Illustrator", "Photoshop", "After Effects", "Cinema 4D", "Blender", "Sketch", "InDesign", "Procreate", "Webflow"];

// ── 타입 ──────────────────────────────────────────────────────
type Milestone = { label: string; date: string };

// ── 헬퍼: 태그 입력 ─────────────────────────────────────────
function TagInput({ tags, onChange, presets, placeholder }: { tags: string[]; onChange: (t: string[]) => void; presets?: string[]; placeholder?: string }) {
  const [input, setInput] = useState("");
  const add = (val: string) => {
    const v = val.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput("");
  };
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2 min-h-[40px] p-2 border border-gray-200 rounded-xl bg-white">
        {tags.map((t) => (
          <span key={t} className="flex items-center gap-1 bg-[#00C9A7]/10 text-[#00A88C] text-xs font-semibold px-3 py-1.5 rounded-full">
            {t}
            <button onClick={() => onChange(tags.filter((x) => x !== t))} className="hover:text-red-400 transition-colors"><X className="size-3" /></button>
          </span>
        ))}
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(input); } }}
          placeholder={tags.length === 0 ? (placeholder ?? "입력 후 Enter") : ""}
          className="flex-1 min-w-[120px] text-sm outline-none bg-transparent placeholder:text-gray-300"
        />
      </div>
      {presets && (
        <div className="flex flex-wrap gap-1.5">
          {presets.filter((p) => !tags.includes(p)).slice(0, 7).map((p) => (
            <button key={p} onClick={() => add(p)} className="text-xs px-2.5 py-1 rounded-full border border-gray-200 text-gray-500 hover:border-[#00C9A7] hover:text-[#00A88C] transition-colors">+ {p}</button>
          ))}
        </div>
      )}
    </div>
  );
}

// ── 헬퍼: 동적 리스트 ────────────────────────────────────────
function DynamicList({ items, onChange, placeholder }: { items: string[]; onChange: (v: string[]) => void; placeholder?: string }) {
  const update = (i: number, v: string) => { const n = [...items]; n[i] = v; onChange(n); };
  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i));
  return (
    <div className="space-y-2">
      {items.map((item, i) => (
        <div key={i} className="flex gap-2 items-center group">
          <div className="w-1.5 h-1.5 rounded-full bg-[#00C9A7] shrink-0 mt-0.5" />
          <input
            value={item}
            onChange={(e) => update(i, e.target.value)}
            placeholder={placeholder}
            className="flex-1 text-sm px-3 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-[#00C9A7] transition-colors"
          />
          {items.length > 1 && (
            <button onClick={() => remove(i)} className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-300 hover:text-red-400">
              <X className="size-4" />
            </button>
          )}
        </div>
      ))}
      <button onClick={() => onChange([...items, ""])} className="flex items-center gap-1.5 text-xs text-[#00A88C] font-semibold mt-1 hover:text-[#008f78] transition-colors">
        <Plus className="size-3.5" /> 항목 추가
      </button>
    </div>
  );
}

// ── 헬퍼: 이미지 드롭존 ──────────────────────────────────────
function ImageDropzone({ value, onChange, label }: { value: string; onChange: (url: string) => void; label?: string }) {
  const [preview, setPreview] = useState(value);
  const onDrop = useCallback((files: File[]) => {
    const file = files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => { const url = e.target?.result as string; setPreview(url); onChange(url); };
    reader.readAsDataURL(file);
  }, [onChange]);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop, accept: { "image/*": [] }, maxFiles: 1 });

  return (
    <div className="space-y-2">
      {label && <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{label}</p>}
      <div {...getRootProps()} className={`relative group cursor-pointer border-2 border-dashed rounded-2xl overflow-hidden transition-all ${isDragActive ? "border-[#00C9A7] bg-[#00C9A7]/5" : "border-gray-200 hover:border-[#00C9A7]/60"}`} style={{ height: 140 }}>
        <input {...getInputProps()} />
        {preview ? (
          <>
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <p className="text-white text-xs font-semibold">클릭 또는 드래그로 변경</p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-2">
            <ImageIcon className="size-8 text-gray-300" />
            <p className="text-xs text-gray-400">{isDragActive ? "놓아서 업로드" : "클릭 또는 드래그"}</p>
          </div>
        )}
      </div>
      <div className="flex gap-2 items-center">
        <span className="text-xs text-gray-400">또는 URL 입력:</span>
        <input
          type="url"
          defaultValue={value.startsWith("http") ? value : ""}
          onBlur={(e) => { if (e.target.value) { setPreview(e.target.value); onChange(e.target.value); } }}
          placeholder="https://..."
          className="flex-1 text-xs border border-gray-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:border-[#00C9A7] transition-colors placeholder:text-gray-300"
        />
      </div>
    </div>
  );
}

// ── 미리보기 카드 ─────────────────────────────────────────────
function PreviewCard({ data }: { data: { title: string; category: string; budget: string; deadline: string; duration: string; remote: boolean; skills: string[]; applicants: number; imageUrl: string; badge: string } }) {
  const daysLeft = data.deadline ? Math.max(0, Math.ceil((new Date(data.deadline).getTime() - Date.now()) / 86400000)) : null;
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-md border border-gray-100 text-left">
      <div className="relative h-28 bg-gradient-to-br from-[#00C9A7]/20 to-[#FF5C3A]/10">
        {data.imageUrl ? <img src={data.imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full" />}
        {data.badge && <span className={`absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${data.badge === "급구" ? "bg-[#FF5C3A] text-white" : data.badge === "모집중" ? "bg-[#00C9A7] text-white" : "bg-gray-400 text-white"}`}>{data.badge}</span>}
        {daysLeft !== null && <span className="absolute top-2 right-2 text-[10px] bg-black/50 text-white px-2 py-0.5 rounded-full">{daysLeft === 0 ? "오늘 마감" : `D-${daysLeft}`}</span>}
      </div>
      <div className="p-3">
        {data.category && <span className="text-[10px] text-[#00A88C] font-semibold">{data.category}</span>}
        <h4 className="text-sm font-bold text-[#0F0F0F] mt-0.5 line-clamp-2 leading-snug">{data.title || "프로젝트 제목"}</h4>
        <div className="flex flex-wrap gap-x-2 gap-y-1 mt-2">
          {data.budget && <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Briefcase className="size-2.5" />{data.budget}</span>}
          {data.duration && <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><Clock className="size-2.5" />{data.duration}</span>}
          <span className="text-[10px] text-gray-500 flex items-center gap-0.5"><MapPin className="size-2.5" />{data.remote ? "원격" : "현장"}</span>
        </div>
        {data.skills.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-2">
            {data.skills.slice(0, 3).map((s) => <span key={s} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{s}</span>)}
            {data.skills.length > 3 && <span className="text-[10px] text-gray-400">+{data.skills.length - 3}</span>}
          </div>
        )}
        <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-50">
          <span className="text-[10px] text-gray-400"><Users className="size-2.5 inline mr-0.5" />{data.applicants}명 지원</span>
        </div>
      </div>
    </div>
  );
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────
export default function CreateProject() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const autoSaveTimer = useRef<ReturnType<typeof setInterval> | null>(null);

  // Step 1
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [projectType, setProjectType] = useState<"단기" | "중기" | "장기">("단기");
  const [remote, setRemote] = useState(true);
  const [experienceLevel, setExperienceLevel] = useState("");

  // Step 2
  const [description, setDescription] = useState("");
  const [fullDescription, setFullDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [responsibilities, setResponsibilities] = useState(["", ""]);
  const [requirements, setRequirements] = useState(["", ""]);

  // Step 3
  const [budgetRange, setBudgetRange] = useState([500, 1500]);
  const [duration, setDuration] = useState("2개월");
  const [deadline, setDeadline] = useState("");
  const [milestones, setMilestones] = useState<Milestone[]>([{ label: "킥오프", date: "" }, { label: "최종 납품", date: "" }]);

  // Step 4
  const [imageUrl, setImageUrl] = useState("");
  const [referenceImages, setReferenceImages] = useState(["", "", ""]);
  const [industry, setIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  const [badge, setBadge] = useState("모집중");

  // 유효성 검사
  const step1Valid = !!title.trim() && !!category;
  const step2Valid = !!description.trim();
  const step3Valid = !!deadline;
  const canProceed = [true, step1Valid, step2Valid, step3Valid, true][step - 1];

  const previewData = {
    title, category, budget: `${budgetRange[0]}만 ~ ${budgetRange[1]}만 원`,
    deadline, duration, remote, skills, applicants: 0,
    imageUrl, badge,
  };

  // 자동 임시저장
  useEffect(() => {
    autoSaveTimer.current = setInterval(() => {
      const draft = { title, category, projectType, remote, experienceLevel, description, fullDescription, skills, responsibilities, requirements, budgetRange, duration, deadline, milestones, imageUrl, referenceImages, industry, companySize, badge };
      localStorage.setItem("create_project_draft", JSON.stringify(draft));
      toast.success("임시저장 됨", { duration: 1500, position: "bottom-right" });
    }, 30000);
    return () => { if (autoSaveTimer.current) clearInterval(autoSaveTimer.current); };
  }, [title, category, projectType, remote, experienceLevel, description, fullDescription, skills, responsibilities, requirements, budgetRange, duration, deadline, milestones, imageUrl, referenceImages, industry, companySize, badge]);

  // 초안 불러오기
  useEffect(() => {
    const saved = localStorage.getItem("create_project_draft");
    if (!saved) return;
    try {
      const d = JSON.parse(saved);
      if (d.title) setTitle(d.title);
      if (d.category) setCategory(d.category);
      if (d.projectType) setProjectType(d.projectType);
      if (typeof d.remote === "boolean") setRemote(d.remote);
      if (d.experienceLevel) setExperienceLevel(d.experienceLevel);
      if (d.description) setDescription(d.description);
      if (d.fullDescription) setFullDescription(d.fullDescription);
      if (d.skills) setSkills(d.skills);
      if (d.responsibilities) setResponsibilities(d.responsibilities);
      if (d.requirements) setRequirements(d.requirements);
      if (d.budgetRange) setBudgetRange(d.budgetRange);
      if (d.duration) setDuration(d.duration);
      if (d.deadline) setDeadline(d.deadline);
      if (d.milestones) setMilestones(d.milestones);
      if (d.imageUrl) setImageUrl(d.imageUrl);
      if (d.referenceImages) setReferenceImages(d.referenceImages);
      if (d.industry) setIndustry(d.industry);
      if (d.companySize) setCompanySize(d.companySize);
      if (d.badge) setBadge(d.badge);
    } catch { /* ignore */ }
  }, []);

  const handlePublish = () => {
    confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors: ["#00C9A7", "#FF5C3A", "#ffffff"] });
    toast.success("프로젝트가 게시되었습니다!", { duration: 3000 });
    localStorage.removeItem("create_project_draft");
    setTimeout(() => navigate("/projects"), 1800);
  };

  const handleSaveDraft = () => {
    const draft = { title, category, projectType, remote, experienceLevel, description, fullDescription, skills, responsibilities, requirements, budgetRange, duration, deadline, milestones, imageUrl, referenceImages, industry, companySize, badge };
    localStorage.setItem("create_project_draft", JSON.stringify(draft));
    toast.success("임시저장 됨");
  };

  const updateMilestone = (i: number, field: "label" | "date", val: string) => {
    const next = [...milestones];
    next[i] = { ...next[i], [field]: val };
    setMilestones(next);
  };

  const addRefImage = () => setReferenceImages([...referenceImages, ""]);
  const updateRefImage = (i: number, val: string) => { const n = [...referenceImages]; n[i] = val; setReferenceImages(n); };
  const removeRefImage = (i: number) => setReferenceImages(referenceImages.filter((_, idx) => idx !== i));

  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navigation />

      {/* 스텝 진행바 */}
      <div className="bg-white border-b border-gray-100 sticky top-[65px] z-40">
        <div className="max-w-5xl mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {STEP_LABELS.map((label, i) => {
                const n = i + 1;
                const done = step > n;
                const active = step === n;
                return (
                  <div key={n} className="flex items-center gap-1">
                    <button
                      onClick={() => { if (done || active) setStep(n); }}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${active ? "bg-[#00C9A7] text-white shadow-sm" : done ? "bg-[#00C9A7]/10 text-[#00A88C] hover:bg-[#00C9A7]/20" : "text-gray-400"}`}
                    >
                      {done ? <Check className="size-3" /> : <span className="size-4 text-center">{n}</span>}
                      {label}
                    </button>
                    {i < 4 && <ChevronRight className="size-3.5 text-gray-300 mx-0.5" />}
                  </div>
                );
              })}
            </div>
            <button onClick={handleSaveDraft} className="text-xs text-gray-500 hover:text-gray-700 font-medium flex items-center gap-1 px-3 py-1.5 rounded-full hover:bg-gray-100 transition-colors">
              <span>임시저장</span>
            </button>
          </div>
        </div>
      </div>

      {/* 본문 */}
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex gap-6 items-start">
          {/* 폼 영역 */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              {/* ── STEP 1: 기본 정보 ── */}
              {step === 1 && (
                <motion.div key="s1" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                  <div className="bg-white rounded-2xl p-7 shadow-sm space-y-7">
                    <div>
                      <h1 className="text-2xl font-bold text-[#0F0F0F]">프로젝트를 소개해주세요</h1>
                      <p className="text-sm text-gray-400 mt-1">핵심 정보를 입력하면 적합한 디자이너가 더 빨리 찾아옵니다.</p>
                    </div>

                    {/* 제목 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">프로젝트 제목 <span className="text-[#FF5C3A]">*</span></label>
                      <input
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="예: 핀테크 앱 UI/UX 리디자인 프로젝트"
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00C9A7] transition-colors"
                      />
                      <p className="text-xs text-gray-300 text-right mt-1">{title.length}/80</p>
                    </div>

                    {/* 카테고리 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">카테고리 <span className="text-[#FF5C3A]">*</span></label>
                      <div className="flex flex-wrap gap-2">
                        {CATEGORIES.map((c) => (
                          <button key={c} onClick={() => setCategory(c)} className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all ${category === c ? "bg-[#00C9A7] text-white border-[#00C9A7] shadow-sm" : "bg-white text-gray-600 border-gray-200 hover:border-[#00C9A7] hover:text-[#00A88C]"}`}>{c}</button>
                        ))}
                      </div>
                    </div>

                    {/* 프로젝트 유형 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">프로젝트 유형</label>
                      <div className="flex gap-3">
                        {(["단기", "중기", "장기"] as const).map((t) => (
                          <button key={t} onClick={() => setProjectType(t)} className={`flex-1 py-2.5 rounded-xl text-sm font-semibold border transition-all ${projectType === t ? "bg-[#0F0F0F] text-white border-[#0F0F0F]" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}>{t}</button>
                        ))}
                      </div>
                    </div>

                    {/* 원격/현장 */}
                    <div className="flex items-center justify-between p-4 rounded-xl bg-gray-50 border border-gray-100">
                      <div>
                        <p className="text-sm font-bold text-gray-700">원격 근무</p>
                        <p className="text-xs text-gray-400 mt-0.5">원격으로 진행 가능한 프로젝트인가요?</p>
                      </div>
                      <button onClick={() => setRemote(!remote)} className={`relative w-12 h-6 rounded-full transition-colors ${remote ? "bg-[#00C9A7]" : "bg-gray-300"}`}>
                        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${remote ? "left-7" : "left-1"}`} />
                      </button>
                    </div>

                    {/* 경험 수준 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">요구 경험 수준</label>
                      <div className="flex gap-2 flex-wrap">
                        {EXP_LEVELS.map((e) => (
                          <button key={e} onClick={() => setExperienceLevel(e)} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${experienceLevel === e ? "bg-[#00C9A7]/10 text-[#00A88C] border-[#00C9A7]" : "border-gray-200 text-gray-500 hover:border-gray-400"}`}>{e}</button>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 2: 상세 내용 ── */}
              {step === 2 && (
                <motion.div key="s2" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                  <div className="bg-white rounded-2xl p-7 shadow-sm space-y-7">
                    <div>
                      <h1 className="text-2xl font-bold text-[#0F0F0F]">프로젝트를 상세히 설명해주세요</h1>
                      <p className="text-sm text-gray-400 mt-1">구체적일수록 원하는 디자이너와 매칭될 확률이 높아집니다.</p>
                    </div>

                    {/* 소개 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">프로젝트 소개 <span className="text-[#FF5C3A]">*</span></label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value.slice(0, 300))}
                        rows={3}
                        placeholder="프로젝트의 핵심 목표와 배경을 간략하게 소개해주세요."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00C9A7] transition-colors resize-none leading-relaxed"
                      />
                      <p className="text-xs text-gray-300 text-right mt-1">{description.length}/300</p>
                    </div>

                    {/* 상세 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">상세 내용</label>
                      <textarea
                        value={fullDescription}
                        onChange={(e) => setFullDescription(e.target.value)}
                        rows={5}
                        placeholder="협업 방식, 사용 툴, 기대 결과물 등 자유롭게 작성해주세요."
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00C9A7] transition-colors resize-none leading-relaxed"
                      />
                    </div>

                    {/* 스킬 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2"><Tag className="size-3.5 inline mr-1" />필요 스킬</label>
                      <TagInput tags={skills} onChange={setSkills} presets={SKILL_PRESETS} placeholder="예: Figma, After Effects" />
                    </div>

                    {/* 주요 업무 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3"><Layers className="size-3.5 inline mr-1" />주요 업무</label>
                      <DynamicList items={responsibilities} onChange={setResponsibilities} placeholder="예: 사용자 리서치 및 인사이트 도출" />
                    </div>

                    {/* 지원 자격 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3"><Users className="size-3.5 inline mr-1" />지원 자격</label>
                      <DynamicList items={requirements} onChange={setRequirements} placeholder="예: Figma 실무 경력 3년 이상" />
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 3: 예산 & 일정 ── */}
              {step === 3 && (
                <motion.div key="s3" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                  <div className="bg-white rounded-2xl p-7 shadow-sm space-y-8">
                    <div>
                      <h1 className="text-2xl font-bold text-[#0F0F0F]">예산과 일정을 알려주세요</h1>
                      <p className="text-sm text-gray-400 mt-1">현실적인 정보를 입력할수록 제안이 원활해집니다.</p>
                    </div>

                    {/* 예산 슬라이더 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-4"><Briefcase className="size-3.5 inline mr-1" />예산 범위 (만원)</label>
                      <div className="px-1">
                        <Slider
                          value={budgetRange}
                          onValueChange={setBudgetRange}
                          min={50} max={5000} step={50}
                          className="mb-4"
                        />
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">최소</p>
                          <p className="text-lg font-bold text-[#0F0F0F]">{budgetRange[0].toLocaleString()}만</p>
                        </div>
                        <div className="flex-1 mx-4 h-px bg-gray-200" />
                        <div className="text-center">
                          <p className="text-xs text-gray-400 mb-1">최대</p>
                          <p className="text-lg font-bold text-[#0F0F0F]">{budgetRange[1].toLocaleString()}만</p>
                        </div>
                      </div>
                      <div className="mt-3 flex gap-2 flex-wrap">
                        {[[100,300],[300,700],[500,1000],[1000,2000],[2000,5000]].map(([mn,mx]) => (
                          <button key={`${mn}-${mx}`} onClick={() => setBudgetRange([mn, mx])} className="text-xs px-3 py-1.5 rounded-full border border-gray-200 text-gray-500 hover:border-[#00C9A7] hover:text-[#00A88C] transition-colors">{mn}~{mx}만</button>
                        ))}
                      </div>
                    </div>

                    {/* 작업 기간 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3"><Clock className="size-3.5 inline mr-1" />작업 기간</label>
                      <div className="flex gap-2 flex-wrap">
                        {DURATION_OPTS.map((d) => (
                          <button key={d} onClick={() => setDuration(d)} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-all ${duration === d ? "bg-[#0F0F0F] text-white border-[#0F0F0F]" : "border-gray-200 text-gray-600 hover:border-gray-400"}`}>{d}</button>
                        ))}
                      </div>
                    </div>

                    {/* 마감 기한 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2"><Calendar className="size-3.5 inline mr-1" />지원 마감 기한 <span className="text-[#FF5C3A]">*</span></label>
                      <input
                        type="date"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                        min={new Date().toISOString().split("T")[0]}
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00C9A7] transition-colors text-gray-700"
                      />
                    </div>

                    {/* 마일스톤 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">프로젝트 마일스톤</label>
                      <div className="space-y-3">
                        {milestones.map((m, i) => (
                          <div key={i} className="flex gap-3 items-center group">
                            <div className="flex items-center gap-2 text-gray-300 cursor-grab">
                              <GripVertical className="size-4" />
                              <span className="text-xs font-bold text-gray-300">{i + 1}</span>
                            </div>
                            <input
                              value={m.label}
                              onChange={(e) => updateMilestone(i, "label", e.target.value)}
                              placeholder="단계명 (예: 킥오프)"
                              className="flex-1 px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00C9A7] transition-colors"
                            />
                            <input
                              type="date"
                              value={m.date}
                              onChange={(e) => updateMilestone(i, "date", e.target.value)}
                              className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00C9A7] transition-colors text-gray-700"
                            />
                            {milestones.length > 1 && (
                              <button onClick={() => setMilestones(milestones.filter((_, idx) => idx !== i))} className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-400 transition-all">
                                <X className="size-4" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      <button onClick={() => setMilestones([...milestones, { label: "", date: "" }])} className="flex items-center gap-1.5 text-xs text-[#00A88C] font-semibold mt-3 hover:text-[#008f78] transition-colors">
                        <Plus className="size-3.5" /> 마일스톤 추가
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 4: 레퍼런스 & 회사 ── */}
              {step === 4 && (
                <motion.div key="s4" initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.2 }}>
                  <div className="bg-white rounded-2xl p-7 shadow-sm space-y-7">
                    <div>
                      <h1 className="text-2xl font-bold text-[#0F0F0F]">레퍼런스와 회사 정보</h1>
                      <p className="text-sm text-gray-400 mt-1">이미지와 회사 정보를 추가하면 프로필이 더욱 풍성해집니다.</p>
                    </div>

                    {/* 대표 이미지 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3"><ImageIcon className="size-3.5 inline mr-1" />대표 이미지</label>
                      <ImageDropzone value={imageUrl} onChange={setImageUrl} />
                    </div>

                    {/* 참고 이미지 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">참고 이미지 (최대 5장)</label>
                      <div className="grid grid-cols-3 gap-3">
                        {referenceImages.map((url, i) => (
                          <div key={i} className="relative group">
                            <div className="h-24 rounded-xl border border-gray-200 overflow-hidden bg-gray-50">
                              {url ? <img src={url} alt={`ref-${i}`} className="w-full h-full object-cover" onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }} /> : <div className="flex items-center justify-center h-full"><ImageIcon className="size-6 text-gray-300" /></div>}
                            </div>
                            <input
                              value={url}
                              onChange={(e) => updateRefImage(i, e.target.value)}
                              placeholder="이미지 URL"
                              className="w-full mt-1.5 px-2.5 py-1.5 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-[#00C9A7] transition-colors placeholder:text-gray-300"
                            />
                            {referenceImages.length > 1 && (
                              <button onClick={() => removeRefImage(i)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <X className="size-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                      {referenceImages.length < 5 && (
                        <button onClick={addRefImage} className="flex items-center gap-1.5 text-xs text-[#00A88C] font-semibold mt-3 hover:text-[#008f78] transition-colors">
                          <Plus className="size-3.5" /> 이미지 추가
                        </button>
                      )}
                    </div>

                    {/* 배지 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3">공고 배지</label>
                      <div className="flex gap-2">
                        {BADGE_OPTS.map((b) => (
                          <button key={b.value} onClick={() => setBadge(b.value)} className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition-all ${badge === b.value ? `${b.color} border-transparent shadow-md` : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"}`}>{b.value}</button>
                        ))}
                      </div>
                    </div>

                    {/* 회사 정보 */}
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-3"><Building2 className="size-3.5 inline mr-1" />회사 정보 (선택)</label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5">업종</p>
                          <input value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="예: 핀테크 / 금융 SaaS" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00C9A7] transition-colors placeholder:text-gray-300" />
                        </div>
                        <div>
                          <p className="text-xs text-gray-500 mb-1.5">회사 규모</p>
                          <input value={companySize} onChange={(e) => setCompanySize(e.target.value)} placeholder="예: 50~200명" className="w-full px-3.5 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:border-[#00C9A7] transition-colors placeholder:text-gray-300" />
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── STEP 5: 미리보기 & 게시 ── */}
              {step === 5 && (
                <motion.div key="s5" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }} transition={{ duration: 0.25 }}>
                  <div className="bg-white rounded-2xl p-7 shadow-sm space-y-7">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Eye className="size-5 text-[#00C9A7]" />
                        <h1 className="text-2xl font-bold text-[#0F0F0F]">최종 미리보기</h1>
                      </div>
                      <p className="text-sm text-gray-400">게시 전 공고가 어떻게 보이는지 확인해보세요.</p>
                    </div>

                    {/* 카드 미리보기 (가로형) */}
                    <div className="rounded-2xl border border-gray-100 overflow-hidden">
                      <div className="relative h-48">
                        {imageUrl ? <img src={imageUrl} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full bg-gradient-to-br from-[#00C9A7]/20 to-[#FF5C3A]/10" />}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                        <div className="absolute bottom-4 left-5 right-5">
                          <div className="flex items-center gap-2 mb-2">
                            {badge && <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${badge === "급구" ? "bg-[#FF5C3A] text-white" : badge === "모집중" ? "bg-[#00C9A7] text-white" : "bg-gray-400 text-white"}`}>{badge}</span>}
                            {category && <span className="text-xs text-white/80 font-medium">{category}</span>}
                          </div>
                          <h2 className="text-white font-bold text-lg leading-snug">{title || "프로젝트 제목"}</h2>
                        </div>
                      </div>
                      <div className="p-5 space-y-4">
                        <p className="text-sm text-gray-600 leading-relaxed">{description || "프로젝트 소개가 표시됩니다."}</p>
                        <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-gray-500">
                          <span className="flex items-center gap-1"><Briefcase className="size-3.5" />{budgetRange[0]}만 ~ {budgetRange[1]}만 원</span>
                          <span className="flex items-center gap-1"><Clock className="size-3.5" />{duration}</span>
                          <span className="flex items-center gap-1"><MapPin className="size-3.5" />{remote ? "원격" : "현장"}</span>
                          {deadline && <span className="flex items-center gap-1"><Calendar className="size-3.5" />마감 {deadline}</span>}
                        </div>
                        {skills.length > 0 && (
                          <div className="flex flex-wrap gap-1.5">
                            {skills.map((s) => <span key={s} className="text-xs bg-[#00C9A7]/10 text-[#00A88C] px-3 py-1 rounded-full font-medium">{s}</span>)}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 체크리스트 */}
                    <div className="bg-[#F7F7F5] rounded-2xl p-5">
                      <p className="text-sm font-bold text-gray-700 mb-4">입력 완료 체크</p>
                      <div className="space-y-2.5">
                        {[
                          { label: "프로젝트 제목", done: !!title.trim(), step: 1 },
                          { label: "카테고리 선택", done: !!category, step: 1 },
                          { label: "프로젝트 소개", done: !!description.trim(), step: 2 },
                          { label: "필요 스킬", done: skills.length > 0, step: 2 },
                          { label: "마감 기한", done: !!deadline, step: 3 },
                          { label: "대표 이미지", done: !!imageUrl, step: 4 },
                        ].map((item) => (
                          <div key={item.label} className="flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center ${item.done ? "bg-[#00C9A7]" : "bg-gray-200"}`}>
                                {item.done ? <Check className="size-3 text-white" /> : <AlertCircle className="size-3 text-gray-400" />}
                              </div>
                              <span className={`text-sm ${item.done ? "text-gray-700" : "text-gray-400"}`}>{item.label}</span>
                            </div>
                            {!item.done && (
                              <button onClick={() => setStep(item.step)} className="text-xs text-[#00A88C] font-semibold hover:underline">입력하기</button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* 게시 버튼 */}
                    <button
                      onClick={handlePublish}
                      disabled={!step1Valid || !step2Valid || !step3Valid}
                      className={`w-full py-4 rounded-2xl text-base font-bold transition-all flex items-center justify-center gap-2 ${
                        step1Valid && step2Valid && step3Valid
                          ? "bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white hover:shadow-[0_0_32px_rgba(0,201,167,0.4)] hover:scale-[1.01]"
                          : "bg-gray-100 text-gray-300 cursor-not-allowed"
                      }`}
                    >
                      <Sparkles className="size-5" />
                      프로젝트 게시하기
                    </button>
                    {(!step1Valid || !step2Valid || !step3Valid) && (
                      <p className="text-xs text-gray-400 text-center -mt-4">필수 항목(*)을 모두 입력해야 게시할 수 있습니다.</p>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* 이전 / 다음 버튼 */}
            <div className="flex justify-between mt-5">
              {step > 1 ? (
                <button onClick={() => setStep(step - 1)} className="flex items-center gap-2 px-5 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:border-gray-400 transition-colors">
                  <ChevronLeft className="size-4" /> 이전
                </button>
              ) : <div />}
              {step < 5 && (
                <button
                  onClick={() => { if (canProceed) setStep(step + 1); }}
                  className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${canProceed ? "bg-[#0F0F0F] text-white hover:bg-gray-800" : "bg-gray-100 text-gray-300 cursor-not-allowed"}`}
                >
                  다음 <ChevronRight className="size-4" />
                </button>
              )}
            </div>
          </div>

          {/* 우측 실시간 미리보기 패널 */}
          {step < 5 && (
            <div className="w-64 shrink-0 sticky top-[125px]">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 px-1">실시간 미리보기</p>
              <PreviewCard data={previewData} />
              <div className="mt-4 p-4 bg-white rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-700 mb-2 flex items-center gap-1.5"><Sparkles className="size-3.5 text-[#00C9A7]" />입력 팁</p>
                <ul className="space-y-1.5">
                  {step === 1 && ["구체적인 제목이 지원율을 2배 높입니다", "카테고리 선택은 필수입니다"].map((t) => <li key={t} className="text-xs text-gray-400 flex gap-1.5"><span className="text-[#00C9A7] mt-0.5">•</span>{t}</li>)}
                  {step === 2 && ["스킬 태그를 5개 이상 입력하세요", "주요 업무를 구체적으로 작성하면 미스매치가 줄어듭니다"].map((t) => <li key={t} className="text-xs text-gray-400 flex gap-1.5"><span className="text-[#00C9A7] mt-0.5">•</span>{t}</li>)}
                  {step === 3 && ["현실적인 예산 범위를 설정하세요", "마일스톤은 신뢰도를 높입니다"].map((t) => <li key={t} className="text-xs text-gray-400 flex gap-1.5"><span className="text-[#00C9A7] mt-0.5">•</span>{t}</li>)}
                  {step === 4 && ["대표 이미지는 지원율에 큰 영향을 줍니다", "참고 이미지로 원하는 스타일을 전달하세요"].map((t) => <li key={t} className="text-xs text-gray-400 flex gap-1.5"><span className="text-[#00C9A7] mt-0.5">•</span>{t}</li>)}
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
