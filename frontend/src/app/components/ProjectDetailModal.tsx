import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import {
  X, Bookmark, Share2, MessageCircle, AlertTriangle,
  Clock, Users, Building2, BadgeCheck, CheckSquare,
  ChevronLeft, ChevronRight, Link2, Paperclip, Calendar,
} from "lucide-react";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import CompletionModal from "./CompletionModal";
import { applyProjectApi } from "../api/projectApi";
import { uploadProjectApplicationPortfolioApi } from "../api/uploadApi";

export interface ProjectMilestone {
  label: string;
  date: string;
}

export interface ProjectCompanyInfo {
  size: string;
  industry: string;
}

export interface ProjectClient {
  name: string;
  avatar: string;
  verified: boolean;
}

export interface ProjectApplicant {
  applicationId: number;
  designerId: number;
  designerName: string;
  designerNickname?: string | null;
  designerProfileImage?: string | null;
  expectedBudget?: number | null;
  summary?: string | null;
  coverLetter?: string | null;
  portfolioUrl?: string | null;
  startDate?: string | null;
}

export interface ProjectData {
  id: number;
  badge: string;
  priority: "high" | "medium" | "low";
  title: string;
  description: string;
  fullDescription?: string;
  client: ProjectClient;
  category: string;
  categories?: string[];
  skills: string[];
  budget: number | string;
  duration: string;
  deadline: string;
  applicants: number;
  remote: boolean;
  imageUrl: string;
  referenceImages?: string[];
  requirements?: string[];
  responsibilities?: string[];
  projectType?: string;
  experienceLevel?: string;
  milestones?: ProjectMilestone[];
  companyInfo?: ProjectCompanyInfo;
  ownerView?: boolean;
  applications?: ProjectApplicant[];
}

interface Props {
  project: ProjectData | null;
  onClose: () => void;
  bookmarked?: boolean;
  onBookmark?: () => void;
}

function getDday(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
}

function formatBudgetLabel(budget: number | string) {
  if (typeof budget === "number") {
    return `${budget}만원`;
  }

  const parsed = Number.parseInt(String(budget).replace(/\D/g, ""), 10);
  return Number.isFinite(parsed) ? `${parsed}만원` : String(budget);
}

function formatApplicantBudgetLabel(budget?: number | null) {
  if (budget == null) return "협의 가능";
  return `${budget}만원`;
}

function DdayBadge({ deadline }: { deadline: string }) {
  const d = getDday(deadline);
  const label = d <= 0 ? "마감됨" : `D-${d}`;
  const colorClass =
    d <= 0 ? "text-gray-400 bg-gray-100 border-gray-200" :
    d <= 7 ? "text-red-500 bg-red-50 border-red-200" :
    d <= 14 ? "text-orange-500 bg-orange-50 border-orange-200" :
    "text-[#00A88C] bg-[#00C9A7]/10 border-[#00C9A7]/30";
  return (
    <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-bold ${colorClass}`}>
      {d > 0 && d <= 3 && <AlertTriangle className="size-3.5" />}
      마감 {label}
    </span>
  );
}

function DdayBarSidebar({ deadline }: { deadline: string }) {
  const d = getDday(deadline);
  const pct = d <= 0 ? 0 : Math.min(d, 30) / 30 * 100;
  const barColor = d <= 0 ? "bg-gray-300" : d <= 7 ? "bg-red-400" : d <= 14 ? "bg-orange-400" : "bg-[#00C9A7]";
  const labelColor = d <= 0 ? "text-gray-400" : d <= 7 ? "text-red-500" : d <= 14 ? "text-orange-500" : "text-[#00A88C]";
  const label = d <= 0 ? "마감됨" : `D-${d}`;
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">지원 마감</span>
        <span className={`text-xs font-bold flex items-center gap-0.5 ${labelColor}`}>
          {d > 0 && d <= 3 && <AlertTriangle className="size-3" />}
          {label}
        </span>
      </div>
      <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${barColor} ${d <= 3 && d > 0 ? "animate-pulse" : ""}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-[10px] text-gray-400">마감일: {deadline}</p>
    </div>
  );
}

function ApplicantDotsSidebar({ count }: { count: number }) {
  const MAX = 20;
  const DOTS = 10;
  const filled = Math.round(Math.min(count, MAX) / MAX * DOTS);
  const dotColor = count >= 16 ? "bg-red-400" : count >= 10 ? "bg-orange-400" : "bg-[#00C9A7]";
  const label = count >= 16 ? "높은 경쟁률" : count >= 10 ? "보통 경쟁률" : "낮은 경쟁률";
  const labelColor = count >= 16 ? "text-red-500" : count >= 10 ? "text-orange-500" : "text-[#00A88C]";
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">지원 현황</span>
        <span className={`text-xs font-bold ${labelColor}`}>{count}명 지원 중</span>
      </div>
      <div className="flex gap-1">
        {Array.from({ length: DOTS }).map((_, i) => (
          <span key={i} className={`flex-1 h-2 rounded-full ${i < filled ? dotColor : "bg-gray-100"}`} />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${labelColor}`}>{label}</p>
    </div>
  );
}

export default function ProjectDetailModal({ project, onClose, bookmarked = false, onBookmark }: Props) {
  const [applied, setApplied] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyMsg, setApplyMsg] = useState("");
  const [applyExp, setApplyExp] = useState("");
  const [applyPortfolioTab, setApplyPortfolioTab] = useState<"url" | "file">("url");
  const [applyPortfolioUrl, setApplyPortfolioUrl] = useState("");
  const [applyPortfolioFile, setApplyPortfolioFile] = useState<File | null>(null);
  const [applyBudget, setApplyBudget] = useState("");
  const [applyStartDate, setApplyStartDate] = useState("");
  const [isSubmittingApply, setIsSubmittingApply] = useState(false);
  const [showApplyCompletionModal, setShowApplyCompletionModal] = useState(false);

  const refImages = project?.referenceImages ?? [];
  const PREVIEW = 3;

  useEffect(() => {
    if (!project) return;
    setApplied(false);
    setLightboxIndex(null);
    setShowApplyForm(false);
    setApplyMsg("");
    setApplyExp("");
    setApplyPortfolioTab("url");
    setApplyPortfolioUrl("");
    setApplyPortfolioFile(null);
    setApplyBudget("");
    setApplyStartDate("");
    setIsSubmittingApply(false);
    setShowApplyCompletionModal(false);
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [project]);

  useEffect(() => {
    if (!project) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (lightboxIndex !== null) setLightboxIndex(null);
        else onClose();
      }
      if (lightboxIndex !== null) {
        if (e.key === "ArrowRight") setLightboxIndex((i) => Math.min(i! + 1, refImages.length - 1));
        if (e.key === "ArrowLeft")  setLightboxIndex((i) => Math.max(i! - 1, 0));
      }
    };
    document.addEventListener("keydown", handleKey);
    return () => { document.removeEventListener("keydown", handleKey); };
  }, [project, onClose, lightboxIndex, refImages.length]);

  function handleSubmitApplyLegacy() {
    if (!applyMsg.trim() || !applyExp.trim()) return;
    setApplied(true);
    setShowApplyForm(false);
    toast.success("지원이 완료되었습니다! 🎉", {
      description: "클라이언트가 검토 후 연락드립니다.",
      duration: 4000,
    });
  }

  function handlePortfolioFileSelect(file: File | null) {
    setApplyPortfolioFile(file);
  }

  function parseApplyBudgetValue(value: string) {
    const digitsOnly = value.replace(/\D/g, "");
    if (!digitsOnly) return undefined;
    const parsed = Number.parseInt(digitsOnly, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
  }

  async function handleSubmitApply() {
    if (!project || !applyMsg.trim() || !applyExp.trim() || isSubmittingApply) return;
    if (applyPortfolioTab === "file" && !applyPortfolioFile) {
      toast.error("포트폴리오 파일을 선택해주세요.");
      return;
    }

    try {
      setIsSubmittingApply(true);

      let portfolioUrl = applyPortfolioTab === "url" ? applyPortfolioUrl.trim() : "";
      if (applyPortfolioTab === "file" && applyPortfolioFile) {
        const uploadResult = await uploadProjectApplicationPortfolioApi(project.id, applyPortfolioFile);
        portfolioUrl = uploadResult.fileUrl;
      }

      await applyProjectApi(project.id, {
        coverLetter: applyMsg.trim(),
        summary: applyExp.trim(),
        expectedBudget: parseApplyBudgetValue(applyBudget),
        portfolioUrl: portfolioUrl || undefined,
        startDate: applyStartDate || undefined,
      });

      setApplied(true);
      setShowApplyForm(false);
      setShowApplyCompletionModal(true);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "지원서를 제출하지 못했어요.");
    } finally {
      setIsSubmittingApply(false);
    }
  }

  function handleApplyCompletionClose() {
    setShowApplyCompletionModal(false);
  }

  function handleShare() {
    navigator.clipboard.writeText(window.location.href).then(() => {
      toast.info("링크가 복사되었습니다 🔗");
    });
  }

  function handleMessage() {
    toast.info("문의 기능은 준비 중입니다.", { description: "백엔드 연동 후 이용 가능합니다." });
  }

  const badgePriorityStyle =
    project?.priority === "high" ? "bg-[#FF5C3A] text-white" : "bg-white/20 backdrop-blur-sm text-white border border-white/30";

  return (
    <AnimatePresence>
      {project && (
        <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-8"
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Panel */}
          <motion.div
            initial={{ opacity: 0, y: 60, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1, maxWidth: showApplyForm ? 1216 : 896 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 30, stiffness: 280 }}
            className="relative bg-white rounded-3xl w-full max-h-[92vh] overflow-hidden shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ── HERO ── */}
            <div className="relative h-56 shrink-0 overflow-hidden">
              <ImageWithFallback
                src={project.imageUrl}
                alt={project.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/10" />

              {/* Close */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 bg-white/15 backdrop-blur-md border border-white/25 rounded-full p-2 hover:bg-white/35 transition-all"
              >
                <X className="size-4 text-white" />
              </button>

              {/* Top badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${badgePriorityStyle}`}>
                  {project.badge}
                </span>
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-white/15 backdrop-blur-sm text-white border border-white/25">
                  {project.category}
                </span>
                {project.projectType && (
                  <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/10 backdrop-blur-sm text-white/80 border border-white/20">
                    {project.projectType}
                  </span>
                )}
              </div>

              {/* Title + client */}
              <div className="absolute bottom-0 left-0 right-0 p-6">
                <h2 className="text-2xl font-extrabold text-white mb-2.5 leading-snug">{project.title}</h2>
                <div className="flex items-center gap-2.5">
                  <ImageWithFallback
                    src={project.client.avatar}
                    alt={project.client.name}
                    className="size-7 rounded-lg object-cover border-2 border-white/40"
                  />
                  <span className="text-white font-semibold text-sm">{project.client.name}</span>
                  {project.client.verified && (
                    <BadgeCheck className="size-4 text-[#00C9A7]" />
                  )}
                  {project.companyInfo && (
                    <span className="text-white/55 text-xs">
                      · {project.companyInfo.industry} · {project.companyInfo.size}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* ── STATS BAR ── */}
            <div className="flex items-center gap-5 px-6 py-3.5 bg-[#FAFBFC] border-b border-gray-100 shrink-0 overflow-x-auto">
              <div className="shrink-0">
                <p className="text-[10px] text-gray-400 mb-0.5">예산</p>
                <p className="text-sm font-bold text-[#00A88C]">{formatBudgetLabel(project.budget)}</p>
              </div>
              <div className="w-px h-7 bg-gray-200 shrink-0" />
              <div className="shrink-0">
                <p className="text-[10px] text-gray-400 mb-0.5">프로젝트 기간</p>
                <p className="text-sm font-bold text-gray-700 flex items-center gap-1">
                  <Clock className="size-3 text-gray-400" />{project.duration}
                  {/* 💡 기간 값에 따른 설명 추가 로직 */}
                  <span className="text-[11px] font-medium text-gray-500 ml-1">
                    {project.duration === "단기" && "(1~3개월)"}
                    {project.duration === "중기" && "(3~6개월)"}
                    {project.duration === "장기" && "(6개월 이상)"}
                  </span>
                </p>
              </div>
              <div className="w-px h-7 bg-gray-200 shrink-0" />
              <div className="shrink-0">
                <p className="text-[10px] text-gray-400 mb-0.5">마감일</p>
                <p className="text-sm font-bold text-gray-700 flex items-center gap-1">
                  <Clock className="size-3 text-gray-400" />{project.deadline}
                </p>
              </div>

              {project.experienceLevel && (
                <>
                  <div className="w-px h-7 bg-gray-200 shrink-0" />
                  <div className="shrink-0">
                    <p className="text-[10px] text-gray-400 mb-0.5">경험</p>
                    <p className="text-sm font-bold text-gray-700">{project.experienceLevel}</p>
                  </div>
                </>
              )}
              <div className="ml-auto shrink-0">
                <DdayBadge deadline={project.deadline} />
              </div>
            </div>

            {/* ── BODY (scrollable, 2-col) ── */}
            <div className="flex flex-1 overflow-hidden">

              {/* Left: main content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-7 min-w-0">

                {/* 프로젝트 개요 */}
                <section>
                  <SectionHeading color="mint">프로젝트 개요</SectionHeading>
                  <p className="text-sm text-gray-600 leading-relaxed">{project.description}</p>
                </section>
                {project.fullDescription && (
                  <section>
                    <SectionHeading color="mint">상세내용</SectionHeading>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-gray-600">{project.fullDescription}</p>
                  </section>
                )}

                {/* 담당 업무 */}
                {project.responsibilities && project.responsibilities.length > 0 && (
                  <section>
                    <SectionHeading color="mint">담당 업무</SectionHeading>
                    <ul className="space-y-2">
                      {project.responsibilities.map((r, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <CheckSquare className="size-4 text-[#00C9A7] mt-0.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* 지원 자격 */}
                {project.requirements && project.requirements.length > 0 && (
                  <section>
                    <SectionHeading color="coral">지원 자격</SectionHeading>
                    <ul className="space-y-2">
                      {project.requirements.map((r, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-sm text-gray-600">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#FF5C3A] mt-1.5 shrink-0" />
                          {r}
                        </li>
                      ))}
                    </ul>
                  </section>
                )}

                {/* 요구 스킬 */}
                <section>
                  <SectionHeading color="mint">요구 스킬</SectionHeading>
                  <div className="flex flex-wrap gap-2">
                    {project.skills && project.skills.length > 0 ? (
                        project.skills.map((skill) => (
                            <span
                                key={skill}
                                className="px-3 py-1.5 rounded-xl bg-[#A8F0E4]/20 text-[#00A88C] text-sm font-semibold border border-[#00C9A7]/20"
                            >
                                {skill}
                            </span>
                        ))
                    ) : (
                        <p className="text-xs text-gray-400 italic">요구 스킬 정보가 없습니다.</p>
                    )}
                  </div>
                </section>

                {/* 레퍼런스 이미지 갤러리 */}
                {refImages.length > 0 && (
                  <section>
                    <div className="flex items-center justify-between mb-3">
                      <SectionHeading color="mint">레퍼런스 이미지</SectionHeading>
                      {refImages.length > PREVIEW && (
                        <span className="text-xs text-gray-400">총 {refImages.length}장</span>
                      )}
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {refImages.slice(0, PREVIEW).map((src, i) => {
                        const isOverflowSlot = i === PREVIEW - 1 && refImages.length > PREVIEW;
                        const remaining = refImages.length - PREVIEW + 1;
                        return (
                          <button
                            key={i}
                            onClick={() => setLightboxIndex(i)}
                            className="relative group rounded-xl overflow-hidden aspect-video bg-gray-100 hover:ring-2 hover:ring-[#00C9A7] transition-all"
                          >
                            <ImageWithFallback
                              src={src}
                              alt={`레퍼런스 ${i + 1}`}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                            {isOverflowSlot ? (
                              <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center gap-1">
                                <span className="text-white text-2xl font-extrabold">+{remaining}</span>
                                <span className="text-white/70 text-[10px] font-medium">더 보기</span>
                              </div>
                            ) : (
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center">
                                <span className="text-white text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity bg-black/50 px-2 py-1 rounded-full">
                                  크게 보기
                                </span>
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </section>
                )}

                {/* 마일스톤 타임라인 */}
                {project.milestones && project.milestones.length > 0 && (
                  <section className="pb-4">
                    <SectionHeading color="mint">프로젝트 일정</SectionHeading>
                    <div className="flex items-start">
                      {project.milestones.map((m, i) => (
                        <div key={i} className="flex-1 relative">
                          <div className="flex items-center">
                            <div className="w-3 h-3 rounded-full bg-[#00C9A7] border-2 border-white ring-2 ring-[#00C9A7]/30 shrink-0 z-10" />
                            {i < project.milestones!.length - 1 && (
                              <div className="h-0.5 flex-1 bg-gradient-to-r from-[#00C9A7] to-gray-200" />
                            )}
                          </div>
                          <div className="mt-2 pr-3">
                            <p className="text-xs font-bold text-[#0F0F0F]">{m.label}</p>
                            <p className="text-[10px] text-gray-400 mt-0.5">{m.date}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </div>

              {/* Right: CTA sidebar */}
              <div className="w-60 shrink-0 border-l border-gray-100 overflow-y-auto">
                <div className="p-4 space-y-3">

                  {/* 지원하기 */}
                  {project.ownerView ? (
                    <div className="w-full rounded-2xl border border-[#00C9A7]/20 bg-[#00C9A7]/8 px-4 py-3 text-center">
                      <p className="text-sm font-bold text-[#00A88C]">내가 등록한 공고</p>
                      <p className="mt-1 text-xs text-gray-500">아래에서 디자이너 지원 내역을 바로 확인할 수 있어요.</p>
                    </div>
                  ) : (
                    <button
                      onClick={() => { if (!applied) setShowApplyForm(true); }}
                      disabled={applied}
                      className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
                        applied
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                          : "bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white hover:shadow-[0_0_24px_rgba(0,201,167,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                      }`}
                    >
                      {applied ? "✓ 지원 완료" : "지원하기"}
                    </button>
                  )}

                  {/* 북마크 / 공유 */}
                  <div className="flex gap-2">
                    <button
                      onClick={onBookmark}
                      className={`flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl border text-xs font-semibold transition-all ${
                        bookmarked
                          ? "border-[#00C9A7] bg-[#00C9A7]/10 text-[#00A88C]"
                          : "border-gray-200 text-gray-500 hover:border-[#00C9A7] hover:text-[#00A88C]"
                      }`}
                    >
                      <Bookmark className={`size-3.5 ${bookmarked ? "fill-[#00C9A7]" : ""}`} />
                      북마크
                    </button>
                    <button
                      onClick={handleShare}
                      className="flex-1 flex items-center justify-center gap-1 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-500 hover:border-gray-300 transition-all"
                    >
                      <Share2 className="size-3.5" />
                      공유
                    </button>
                  </div>

                  {/* D-Day + 지원 현황 */}
                  <div className="bg-[#FAFBFC] rounded-2xl p-3.5 space-y-3">
                    <DdayBarSidebar deadline={project.deadline} />
                    <div className="w-full h-px bg-gray-100" />
                    <ApplicantDotsSidebar count={project.applicants} />
                  </div>

                  {/* 클라이언트 카드 */}
                  <div className="bg-[#FAFBFC] rounded-2xl p-3.5">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">클라이언트</p>
                    <div className="flex items-center gap-2 mb-3">
                      <ImageWithFallback
                        src={project.client.avatar}
                        alt={project.client.name}
                        className="size-9 rounded-xl object-cover border border-gray-100"
                      />
                      <div>
                        <p className="text-sm font-bold text-[#0F0F0F] leading-snug">{project.client.name}</p>
                        {project.client.verified && (
                          <p className="text-[10px] text-[#00A88C] flex items-center gap-0.5 mt-0.5">
                            <BadgeCheck className="size-3" /> 인증 클라이언트
                          </p>
                        )}
                      </div>
                    </div>
                    {project.companyInfo && (
                      <div className="space-y-1.5 mb-3">
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Building2 className="size-3 text-gray-400" /> {project.companyInfo.industry}
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-gray-500">
                          <Users className="size-3 text-gray-400" /> {project.companyInfo.size}
                        </div>
                      </div>
                    )}
                    <button
                      onClick={handleMessage}
                      className="w-full flex items-center justify-center gap-1 text-xs text-[#00A88C] font-semibold py-2 border border-[#00C9A7]/30 rounded-xl hover:bg-[#00C9A7]/5 transition-all"
                    >
                      <MessageCircle className="size-3.5" /> 문의하기
                    </button>
                  </div>

                  {project.ownerView && (
                    <div className="bg-[#FAFBFC] rounded-2xl p-3.5">
                      <div className="mb-3 flex items-center justify-between gap-2">
                        <div>
                          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">지원 내역</p>
                          <p className="mt-1 text-xs text-gray-500">
                            {project.applications?.length ? `${project.applications.length}명의 디자이너가 지원했어요.` : "아직 지원한 디자이너가 없어요."}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        {(project.applications ?? []).map((application) => (
                          <div
                            key={application.applicationId}
                            className="rounded-2xl border border-white bg-white p-3 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <ImageWithFallback
                                src={application.designerProfileImage || "/default-avatar.svg"}
                                alt={application.designerNickname || application.designerName}
                                className="size-10 rounded-xl object-cover border border-gray-100"
                              />
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-bold text-[#0F0F0F]">
                                  {application.designerNickname || application.designerName}
                                </p>
                                <p className="mt-0.5 text-[11px] text-gray-500">
                                  희망 예산 {formatApplicantBudgetLabel(application.expectedBudget)}
                                </p>
                              </div>
                            </div>

                            {application.summary && (
                              <p className="mt-3 text-xs leading-relaxed text-gray-600">
                                {application.summary}
                              </p>
                            )}

                            {application.coverLetter && (
                              <p className="mt-2 text-xs leading-relaxed text-gray-500">
                                {application.coverLetter}
                              </p>
                            )}

                            <div className="mt-3 space-y-1.5 text-[11px] text-gray-500">
                              {application.startDate && (
                                <p>작업 시작 가능일 {application.startDate}</p>
                              )}
                              {application.portfolioUrl && (
                                <a
                                  href={application.portfolioUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="block truncate text-[#00A88C] hover:underline"
                                >
                                  포트폴리오 보기
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                </div>
              </div>

              {/* ── 지원서 폼 패널 (3열) ── */}
              <motion.div
                animate={{
                  width: showApplyForm ? 320 : 0,
                  opacity: showApplyForm ? 1 : 0,
                }}
                initial={{ width: 0, opacity: 0 }}
                transition={{ type: "spring", damping: 30, stiffness: 280 }}
                className="shrink-0 border-l border-gray-100 flex flex-col overflow-hidden"
              >
                    {/* 폼 헤더 */}
                    <div className="px-5 pt-5 pb-4 border-b border-gray-100 shrink-0 flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-[#0F0F0F]">지원서 작성</p>
                        <p className="text-xs text-[#00A88C] font-medium mt-0.5 line-clamp-1">{project.title}</p>
                      </div>
                      <button
                        onClick={() => setShowApplyForm(false)}
                        className="p-1.5 rounded-xl hover:bg-gray-100 transition-colors shrink-0 ml-2"
                      >
                        <X className="size-4 text-gray-400" />
                      </button>
                    </div>

                    {/* 폼 필드 */}
                    <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

                      {/* 지원 메시지 */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2">
                          지원 메시지 <span className="text-[#FF5C3A]">*</span>
                        </label>
                        <textarea
                          value={applyMsg}
                          onChange={(e) => setApplyMsg(e.target.value.slice(0, 200))}
                          rows={4}
                          placeholder="이 프로젝트에 지원하는 이유와 강점을 간단히 소개해 주세요."
                          className="w-full text-sm rounded-xl border border-gray-200 px-3.5 py-3 focus:outline-none focus:border-[#00C9A7] transition-colors resize-none leading-relaxed placeholder:text-gray-300"
                        />
                        <p className="text-xs text-gray-300 text-right mt-1">{applyMsg.length}/200</p>
                      </div>

                      {/* 관련 경험 */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2">
                          관련 경험 요약 <span className="text-[#FF5C3A]">*</span>
                        </label>
                        <textarea
                          value={applyExp}
                          onChange={(e) => setApplyExp(e.target.value.slice(0, 150))}
                          rows={3}
                          placeholder="관련 프로젝트 경험을 간략히 정리해 주세요."
                          className="w-full text-sm rounded-xl border border-gray-200 px-3.5 py-3 focus:outline-none focus:border-[#00C9A7] transition-colors resize-none leading-relaxed placeholder:text-gray-300"
                        />
                        <p className="text-xs text-gray-300 text-right mt-1">{applyExp.length}/150</p>
                      </div>

                      {/* 포트폴리오 */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2">
                          포트폴리오 <span className="text-xs text-gray-400 font-normal">(선택)</span>
                        </label>
                        <div className="flex mb-2.5 rounded-xl overflow-hidden border border-gray-200">
                          <button
                            onClick={() => setApplyPortfolioTab("url")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors ${
                              applyPortfolioTab === "url"
                                ? "bg-[#00C9A7]/10 text-[#00A88C]"
                                : "bg-white text-gray-400 hover:bg-gray-50"
                            }`}
                          >
                            <Link2 className="size-3.5" /> 링크
                          </button>
                          <button
                            onClick={() => setApplyPortfolioTab("file")}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold transition-colors border-l border-gray-200 ${
                              applyPortfolioTab === "file"
                                ? "bg-[#00C9A7]/10 text-[#00A88C]"
                                : "bg-white text-gray-400 hover:bg-gray-50"
                            }`}
                          >
                            <Paperclip className="size-3.5" /> 파일
                          </button>
                        </div>
                        {applyPortfolioTab === "url" ? (
                          <input
                            type="url"
                            value={applyPortfolioUrl}
                            onChange={(e) => setApplyPortfolioUrl(e.target.value)}
                            placeholder="https://behance.net/..."
                            className="w-full text-sm rounded-xl border border-gray-200 px-3.5 py-3 focus:outline-none focus:border-[#00C9A7] transition-colors placeholder:text-gray-300"
                          />
                        ) : (
                          <label
                            className="flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-gray-200 rounded-xl p-5 cursor-pointer hover:border-[#00C9A7]/50 hover:bg-[#00C9A7]/5 transition-all"
                            onDragOver={(event) => event.preventDefault()}
                            onDrop={(event) => {
                              event.preventDefault();
                              handlePortfolioFileSelect(event.dataTransfer.files?.[0] ?? null);
                            }}
                          >
                            <Paperclip className="size-6 text-gray-300" />
                            <span className="text-xs text-gray-400">파일을 드래그하거나</span>
                            <span className="text-xs text-[#00A88C] font-semibold">직접 선택</span>
                            {applyPortfolioFile && (
                              <span className="max-w-full truncate text-xs font-medium text-gray-500">
                                {applyPortfolioFile.name}
                              </span>
                            )}
                            <input
                              type="file"
                              className="hidden"
                              onChange={(event) => handlePortfolioFileSelect(event.target.files?.[0] ?? null)}
                            />
                          </label>
                        )}
                      </div>

                      {/* 희망 예산 */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2">
                          희망 예산 <span className="text-xs text-gray-400 font-normal">(선택)</span>
                        </label>
                        <input
                          type="text"
                          value={applyBudget}
                          onChange={(e) => setApplyBudget(e.target.value)}
                          placeholder="예) 300만원 / 협의 가능"
                          className="w-full text-sm rounded-xl border border-gray-200 px-3.5 py-3 focus:outline-none focus:border-[#00C9A7] transition-colors placeholder:text-gray-300"
                        />
                      </div>

                      {/* 시작 가능일 */}
                      <div>
                        <label className="block text-xs font-bold text-gray-600 mb-2">
                          <Calendar className="size-3.5 inline mr-1" />
                          작업 시작 가능일 <span className="text-xs text-gray-400 font-normal">(선택)</span>
                        </label>
                        <input
                          type="date"
                          value={applyStartDate}
                          onChange={(e) => setApplyStartDate(e.target.value)}
                          className="w-full text-sm rounded-xl border border-gray-200 px-3.5 py-3 focus:outline-none focus:border-[#00C9A7] transition-colors text-gray-600"
                        />
                      </div>

                    </div>

                    {/* 제출 버튼 */}
                    <div className="px-5 py-4 border-t border-gray-100 shrink-0 bg-white">
                      <button
                        onClick={handleSubmitApply}
                        disabled={!applyMsg.trim() || !applyExp.trim() || isSubmittingApply}
                        className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all ${
                          !applyMsg.trim() || !applyExp.trim() || isSubmittingApply
                            ? "bg-gray-100 text-gray-300 cursor-not-allowed"
                            : "bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white hover:shadow-[0_0_24px_rgba(0,201,167,0.4)] hover:scale-[1.02] active:scale-[0.98]"
                        }`}
                      >
                        지원서 제출
                      </button>
                      <p className="text-xs text-gray-300 text-center mt-2">* 표시 항목은 필수입니다</p>
                    </div>
              </motion.div>

            </div>
          </motion.div>
        </motion.div>

        {/* ── 라이트박스 ── */}
        {lightboxIndex !== null && refImages[lightboxIndex] && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center p-6"
            onClick={() => setLightboxIndex(null)}
          >
            <div className="absolute inset-0 bg-black/92" />

            {/* 닫기 */}
            <button
              onClick={() => setLightboxIndex(null)}
              className="absolute top-5 right-5 bg-white/15 border border-white/25 rounded-full p-2 hover:bg-white/30 transition-all z-10"
            >
              <X className="size-5 text-white" />
            </button>

            {/* 카운터 */}
            <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm text-white text-sm font-semibold px-4 py-1.5 rounded-full z-10">
              {lightboxIndex + 1} / {refImages.length}
            </div>

            {/* 이전 */}
            {lightboxIndex > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i! - 1); }}
                className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/15 border border-white/25 rounded-full p-3 hover:bg-white/30 transition-all z-10"
              >
                <ChevronLeft className="size-5 text-white" />
              </button>
            )}

            {/* 이미지 */}
            <AnimatePresence mode="wait">
              <motion.img
                key={lightboxIndex}
                initial={{ opacity: 0, x: 30 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -30 }}
                transition={{ duration: 0.18 }}
                src={refImages[lightboxIndex]}
                alt={`레퍼런스 ${lightboxIndex + 1}`}
                className="relative max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl"
                onClick={(e) => e.stopPropagation()}
              />
            </AnimatePresence>

            {/* 다음 */}
            {lightboxIndex < refImages.length - 1 && (
              <button
                onClick={(e) => { e.stopPropagation(); setLightboxIndex((i) => i! + 1); }}
                className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/15 border border-white/25 rounded-full p-3 hover:bg-white/30 transition-all z-10"
              >
                <ChevronRight className="size-5 text-white" />
              </button>
            )}

            {/* 하단 썸네일 스트립 (4장 이상일 때) */}
            {refImages.length > 3 && (
              <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2 z-10">
                {refImages.map((src, i) => (
                  <button
                    key={i}
                    onClick={(e) => { e.stopPropagation(); setLightboxIndex(i); }}
                    className={`w-12 h-8 rounded-lg overflow-hidden border-2 transition-all ${
                      i === lightboxIndex ? "border-[#00C9A7] scale-110" : "border-white/20 opacity-50 hover:opacity-80"
                    }`}
                  >
                    <ImageWithFallback src={src} alt={`thumb-${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </motion.div>
        )}
        <CompletionModal
          open={showApplyCompletionModal}
          eyebrow="프로젝트 지원 완료"
          title="지원서 제출이 완료되었습니다"
          description={`${project.title} 공고에 지원이 등록되었어요.\n클라이언트가 지원 내용을 확인한 뒤 연락할 거예요.`}
          primaryActionLabel="확인"
          onPrimaryAction={handleApplyCompletionClose}
          onClose={handleApplyCompletionClose}
        />
        </>
      )}
    </AnimatePresence>
  );
}

function SectionHeading({ children, color }: { children: React.ReactNode; color: "mint" | "coral" }) {
  const barColor = color === "mint" ? "bg-[#00C9A7]" : "bg-[#FF5C3A]";
  return (
    <h3 className="text-base font-bold text-[#0F0F0F] mb-3 flex items-center gap-2">
      <span className={`w-1 h-4 rounded-full inline-block shrink-0 ${barColor}`} />
      {children}
    </h3>
  );
}
