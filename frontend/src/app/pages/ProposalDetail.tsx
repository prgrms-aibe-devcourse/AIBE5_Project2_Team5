import { Link, useParams } from "react-router";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  CircleDollarSign,
  Clock3,
  FileText,
  MessageCircle,
  Send,
  Sparkles,
  Upload,
} from "lucide-react";
import Navigation from "../components/Navigation";

const proposals = [
  {
    id: "1",
    studio: "Studio A",
    title: "브랜드 아이덴티티 리뉴얼 제안",
    summary:
      "기존 브랜드 자산을 유지하면서도 디지털 채널에 더 잘 맞는 로고 시스템과 비주얼 가이드를 제안합니다.",
    budget: "₩ 3,800,000",
    duration: "3주",
    sentAt: "2026년 4월 16일",
    skills: ["브랜딩", "로고 시스템", "가이드라인"],
    deliverables: [
      "메인 로고 및 서브 로고 3종",
      "브랜드 컬러/타이포 시스템",
      "SNS 및 웹 배너용 응용 시안",
      "최종 브랜드 가이드 PDF",
    ],
    schedule: [
      "1주차: 킥오프 및 레퍼런스 정리",
      "2주차: 방향성 2안 제안 및 피드백 반영",
      "3주차: 최종 시안 확정 및 가이드 납품",
    ],
    message:
      "현재 프로젝트 설명을 기준으로 보면 브랜드 톤은 유지하되 사용성은 더 가볍게 만드는 방향이 적합합니다. 제안서 검토 후 바로 미팅도 가능합니다.",
  },
  {
    id: "6",
    studio: "Mono Lab",
    title: "수정 제안서",
    summary:
      "희망 예산과 일정에 맞춰 범위를 조정한 실무형 제안입니다. 우선순위 높은 산출물부터 빠르게 납품하는 구조입니다.",
    budget: "₩ 2,900,000",
    duration: "2주",
    sentAt: "2026년 4월 13일",
    skills: ["브랜딩", "패키지", "실행 시안"],
    deliverables: [
      "핵심 로고 리프레시 1종",
      "패키지 메인 시안 2종",
      "런칭용 대표 목업 이미지",
    ],
    schedule: [
      "1주차: 핵심 시안 제작",
      "2주차: 수정 반영 및 최종 납품",
    ],
    message:
      "예산을 고려해 산출물 범위를 우선순위 중심으로 재구성했습니다. 빠르게 런칭해야 하는 프로젝트에 적합한 제안입니다.",
  },
];

export default function ProposalDetail() {
  const { id } = useParams();
  const proposal = proposals.find((item) => item.id === id) ?? proposals[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="mx-auto max-w-[1200px] px-6 py-8">
        <div className="mb-6">
          <Link
            to="/notifications"
            className="inline-flex items-center gap-2 text-sm text-gray-500 transition-colors hover:text-black"
          >
            <ArrowLeft className="size-4" />
            알림 센터로 돌아가기
          </Link>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <main className="space-y-6">
            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-start justify-between gap-4">
                <div>
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-[#4DD4AC]/15 px-3 py-1 text-xs font-semibold text-[#158a72]">
                    <Sparkles className="size-3.5" />
                    받은 제안
                  </div>
                  <h1 className="text-3xl font-bold">{proposal.title}</h1>
                  <div className="mt-2 flex items-center gap-2 text-sm text-gray-500">
                    <BadgeCheck className="size-4 text-[#00A88C]" />
                    {proposal.studio}
                    <span>·</span>
                    {proposal.sentAt} 도착
                  </div>
                </div>

                <Link
                  to="/messages"
                  className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium transition-colors hover:bg-gray-50"
                >
                  <MessageCircle className="size-4" />
                  메시지 보내기
                </Link>
              </div>

              <p className="leading-7 text-gray-700">{proposal.summary}</p>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <FileText className="size-5 text-[#00A88C]" />
                <h2 className="text-xl font-bold">제안 메시지</h2>
              </div>
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 leading-7 text-gray-700">
                {proposal.message}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <Briefcase className="size-5 text-[#00A88C]" />
                <h2 className="text-xl font-bold">포함 산출물</h2>
              </div>
              <div className="space-y-3">
                {proposal.deliverables.map((item) => (
                  <div
                    key={item}
                    className="rounded-xl border border-gray-200 px-4 py-3 text-sm text-gray-700"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="mb-4 flex items-center gap-2">
                <CalendarDays className="size-5 text-[#00A88C]" />
                <h2 className="text-xl font-bold">진행 일정</h2>
              </div>
              <div className="space-y-3">
                {proposal.schedule.map((item) => (
                  <div key={item} className="rounded-xl bg-gray-50 px-4 py-3 text-sm text-gray-700">
                    {item}
                  </div>
                ))}
              </div>
            </section>
          </main>

          <aside className="space-y-6">
            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">제안 요약</h2>

              <div className="space-y-4 text-sm">
                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-gray-500">
                    <CircleDollarSign className="size-4" />
                    제안 금액
                  </span>
                  <span className="font-semibold text-black">{proposal.budget}</span>
                </div>

                <div className="flex items-center justify-between gap-4">
                  <span className="flex items-center gap-2 text-gray-500">
                    <Clock3 className="size-4" />
                    예상 기간
                  </span>
                  <span className="font-semibold text-black">{proposal.duration}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-wrap gap-2">
                {proposal.skills.map((skill) => (
                  <span
                    key={skill}
                    className="rounded-full bg-[#4DD4AC]/15 px-3 py-1 text-xs font-medium text-[#158a72]"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </section>

            <section className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-bold">다음 액션</h2>
              <div className="space-y-3">
                <Link
                  to="/messages"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-black px-4 py-3 text-sm font-medium text-white hover:bg-gray-800"
                >
                  <Send className="size-4" />
                  제안에 답장하기
                </Link>

                <Link
                  to="/projects/new"
                  className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 px-4 py-3 text-sm font-medium hover:bg-gray-50"
                >
                  <Upload className="size-4" />
                  자료 보완 업로드
                </Link>
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}
