import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import { Heart, MessageCircle, CheckCircle, Sparkles, X, Briefcase, Calendar, UserRound } from "lucide-react";
import { motion } from "motion/react";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import {
  type NotificationCategory,
  type NotificationItem,
  getNotifications,
  hasUnreadNotifications,
  markAllNotificationsRead,
  markNotificationRead,
  snoozeNotification,
  subscribeNotificationState,
} from "../utils/notificationState";

type NotificationTab = "all" | NotificationCategory;

type CreateProjectDraft = {
  title: string;
  category: string;
  projectType: "단기" | "중기" | "장기";
  remote: boolean;
  experienceLevel: string;
  description: string;
  fullDescription: string;
  skills: string[];
  responsibilities: string[];
  requirements: string[];
  budgetRange: number[];
  duration: string;
  deadline: string;
  milestones: Array<{ label: string; date: string }>;
  imageUrl: string;
  referenceImages: string[];
  industry: string;
  companySize: string;
  badge: string;
};

type ProjectProposal = {
  id: number;
  projectTitle: string;
  projectMeta: string;
  designerName: string;
  designerRole: string;
  designerAvatar: string;
  summary: string;
  budget: string;
  startDate: string;
  skills: string[];
  portfolioLabel: string;
};

const tabs: Array<{ key: NotificationTab; label: string }> = [
  { key: "all", label: "전체" },
  { key: "project", label: "프로젝트 제안" },
  { key: "activity", label: "활동 알림" },
  { key: "system", label: "시스템" },
];

const getDocumentDraft = (): CreateProjectDraft => ({
  title: "AI 인터페이스 설계 프로젝트",
  category: "UI/UX",
  projectType: "중기",
  remote: true,
  experienceLevel: "3년 이상",
  description:
    "생성형 AI 기반 대시보드 UX를 설계하고, 실제 서비스 적용을 위한 운영 문서를 보완하는 작업입니다.",
  fullDescription:
    "서류 보완 요청이 있어 Create Project의 세부 설명, 요구사항, 마일스톤 항목을 중심으로 다시 점검해야 합니다.",
  skills: ["Figma", "Product Design", "Design System"],
  responsibilities: ["서비스 플로우 설계", "운영 문서 및 요구사항 정리"],
  requirements: ["실무형 제품 설계 경험", "문서화 역량"],
  budgetRange: [700, 1500],
  duration: "2개월",
  deadline: new Date(Date.now() + 1000 * 60 * 60 * 24 * 7).toISOString().split("T")[0],
  milestones: [
    { label: "서류 보완 완료", date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 2).toISOString().split("T")[0] },
    { label: "최종 제출", date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 14).toISOString().split("T")[0] },
  ],
  imageUrl: "",
  referenceImages: ["", "", ""],
  industry: "AI Product",
  companySize: "20~50명",
  badge: "급구",
});

const proposalInbox: ProjectProposal[] = [
  {
    id: 1,
    projectTitle: "브랜드 리뉴얼 프로젝트",
    projectMeta: "브랜딩 · 모집중 · 지원 3명",
    designerName: "김지은",
    designerRole: "브랜드 디자이너",
    designerAvatar: "https://i.pravatar.cc/80?img=1",
    summary:
      "기존 브랜드의 강점을 유지하면서 디지털 접점을 강화하는 방향으로 리브랜딩 제안을 드립니다. 로고 개선안과 핵심 랜딩 시안을 1차로 빠르게 제시할 수 있습니다.",
    budget: "900만원",
    startDate: "즉시 가능",
    skills: ["Brand Identity", "Figma", "Illustrator"],
    portfolioLabel: "F&B 브랜딩 리뉴얼 4건",
  },
  {
    id: 2,
    projectTitle: "브랜드 리뉴얼 프로젝트",
    projectMeta: "브랜딩 · 모집중 · 지원 3명",
    designerName: "박서준",
    designerRole: "그래픽 디자이너",
    designerAvatar: "https://i.pravatar.cc/80?img=2",
    summary:
      "브랜드 시스템과 디지털 콘텐츠 운영을 함께 고려한 제안이 가능합니다. 실무 적용을 위한 가이드 문서까지 포함해 작업할 수 있습니다.",
    budget: "1,050만원",
    startDate: "1주 이내 가능",
    skills: ["Visual System", "Typography", "Guide Document"],
    portfolioLabel: "SaaS 브랜드 시스템 구축 경험",
  },
  {
    id: 3,
    projectTitle: "브랜드 리뉴얼 프로젝트",
    projectMeta: "브랜딩 · 모집중 · 지원 3명",
    designerName: "이민호",
    designerRole: "UI/UX 디자이너",
    designerAvatar: "https://i.pravatar.cc/80?img=3",
    summary:
      "브랜드 리뉴얼과 동시에 핵심 웹 화면에 적용되는 UI 컨셉까지 연결해서 제안드릴 수 있습니다. 빠른 시안 공유와 협업 피드백에 익숙합니다.",
    budget: "1,200만원",
    startDate: "다음 주 시작 가능",
    skills: ["UI Concept", "Figma", "Design System"],
    portfolioLabel: "브랜드 + 제품 경험 통합 포트폴리오",
  },
];

const getIconContent = (notification: NotificationItem) => {
  switch (notification.type) {
    case "announcement":
    case "milestone":
      return {
        icon: <Sparkles className="size-5" />,
        iconBg: "bg-[#4DD4AC]",
      };
    case "like":
      return {
        icon: <Heart className="size-5" />,
        iconBg: "bg-white border border-gray-300",
      };
    case "message":
      return {
        icon: <MessageCircle className="size-5" />,
        iconBg: "bg-white border border-gray-300",
      };
    default:
      return {
        icon: <CheckCircle className="size-5" />,
        iconBg: "bg-white border border-gray-300",
      };
  }
};

export default function Notifications() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<NotificationTab>("all");
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => getNotifications());
  const [hasUnread, setHasUnread] = useState(hasUnreadNotifications());
  const [selectedProposalNotification, setSelectedProposalNotification] = useState<NotificationItem | null>(null);

  useEffect(() => {
    const sync = () => {
      setNotifications(getNotifications());
      setHasUnread(hasUnreadNotifications());
    };

    sync();
    return subscribeNotificationState(sync);
  }, []);

  const visibleNotifications = useMemo(() => {
    const filtered =
      activeTab === "all"
        ? notifications
        : notifications.filter((notification) => notification.category === activeTab);

    return filtered.filter((notification) => !notification.isSnoozed);
  }, [activeTab, notifications]);

  const handleMarkAllRead = () => {
    markAllNotificationsRead();
    setNotifications(getNotifications());
    setHasUnread(false);
  };

  const handleSnooze = (notificationId: number) => {
    snoozeNotification(notificationId);
    setNotifications(getNotifications());
    setHasUnread(hasUnreadNotifications());
  };

  const handlePrimaryAction = (notification: NotificationItem) => {
    markNotificationRead(notification.id);

    if (notification.actionType === "proposal") {
      setSelectedProposalNotification(notification);
      setNotifications(getNotifications());
      setHasUnread(hasUnreadNotifications());
      return;
    }

    if (notification.actionType === "document") {
      localStorage.setItem("create_project_draft", JSON.stringify(getDocumentDraft()));
      navigate("/projects/new?step=2");
      return;
    }

    if (notification.actionType === "message") {
      navigate("/messages");
      return;
    }

    setNotifications(getNotifications());
    setHasUnread(hasUnreadNotifications());
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navigation />

      <main className="flex-1">
      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">알림 센터</h1>
            <p className="text-gray-600 mt-2">
              프로젝트 제안, 활동 소식, 시스템 알림을 분류해서 확인하세요.
            </p>
          </div>
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-[#4DD4AC] hover:text-[#3BC99A] flex items-center gap-1"
          >
            <CheckCircle className="size-4" />
            {hasUnread ? "모두읽음으로 표시" : "모두읽음"}
          </button>
        </div>

        <div className="bg-white rounded-xl p-1 inline-flex mb-8 border border-gray-200">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.key
                  ? "bg-black text-white"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          {visibleNotifications.map((notification) => {
            const iconContent = getIconContent(notification);

            return (
              <div
                key={notification.id}
                className={`bg-white rounded-xl p-6 border ${
                  !notification.isRead ? "border-[#4DD4AC]" : "border-gray-200"
                } hover:shadow-md transition-shadow`}
              >
                <div className="flex gap-4">
                  <div
                    className={`${iconContent.iconBg} size-12 rounded-full flex items-center justify-center flex-shrink-0`}
                  >
                    {notification.avatar ? (
                      <div className="size-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                    ) : (
                      iconContent.icon
                    )}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <h3 className="font-semibold mb-1">{notification.title}</h3>
                        {notification.subtitle && (
                          <p className="text-sm text-gray-600">{notification.subtitle}</p>
                        )}
                        {notification.quote && (
                          <div className="bg-gray-50 border-l-4 border-gray-300 p-3 mt-2 italic text-sm text-gray-700">
                            {notification.quote}
                          </div>
                        )}
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap ml-4">
                        {notification.time}
                      </span>
                    </div>

                    {(notification.action || notification.actionSecondary) && (
                      <div className="flex gap-2 mt-3">
                        {notification.action && (
                          <button
                            onClick={() => handlePrimaryAction(notification)}
                            className="bg-[#4DD4AC] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3BC99A]"
                          >
                            {notification.action}
                          </button>
                        )}
                        {notification.actionSecondary && (
                          <button
                            onClick={() => handleSnooze(notification.id)}
                            className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50"
                          >
                            {notification.actionSecondary}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {visibleNotifications.length === 0 && (
          <div className="text-center mt-12 text-sm text-gray-500">
            현재 탭에 표시할 알림이 없습니다.
          </div>
        )}
      </div>
      </main>

      <Footer />

      {selectedProposalNotification && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/55 p-4"
          onClick={() => setSelectedProposalNotification(null)}
        >
          <div
            className="w-full max-w-4xl rounded-3xl bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between border-b border-gray-100 px-6 py-5">
              <div>
                <p className="text-sm font-semibold text-[#00A88C]">제안 확인하기</p>
                <h2 className="mt-1 text-2xl font-bold text-[#0F0F0F]">
                  {proposalInbox[0].projectTitle}
                </h2>
                <p className="mt-2 text-sm text-gray-500">{proposalInbox[0].projectMeta}</p>
              </div>
              <button
                onClick={() => setSelectedProposalNotification(null)}
                className="rounded-full border border-gray-200 p-2 text-gray-400 transition-colors hover:bg-gray-50 hover:text-gray-700"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              <div className="mb-5 rounded-2xl bg-[#F7F9FB] px-5 py-4 text-sm text-gray-600">
                내가 작성한 프로젝트 공고에 제안한 디자이너 목록입니다. 제안 내용을 검토하고 메시지로 이어갈 수 있습니다.
              </div>

              <div className="space-y-4">
                {proposalInbox.map((proposal) => (
                  <div
                    key={proposal.id}
                    className="rounded-2xl border border-gray-200 p-5 transition-shadow hover:shadow-md"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-4">
                        <img
                          src={proposal.designerAvatar}
                          alt={proposal.designerName}
                          className="size-14 rounded-2xl object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="text-lg font-bold text-[#0F0F0F]">{proposal.designerName}</h3>
                            <span className="rounded-full bg-[#EEF9F6] px-2 py-1 text-xs font-semibold text-[#00A88C]">
                              {proposal.designerRole}
                            </span>
                          </div>
                          <p className="mt-1 text-sm text-gray-500">{proposal.portfolioLabel}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => navigate("/messages")}
                        className="rounded-xl bg-[#4DD4AC] px-4 py-2 text-sm font-semibold text-black transition-colors hover:bg-[#3BC99A]"
                      >
                        메시지 보기
                      </button>
                    </div>

                    <p className="mt-4 text-sm leading-6 text-gray-700">{proposal.summary}</p>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {proposal.skills.map((skill) => (
                        <span
                          key={skill}
                          className="rounded-full border border-[#CDEFE6] bg-[#F3FCF8] px-3 py-1 text-xs font-medium text-[#008F78]"
                        >
                          {skill}
                        </span>
                      ))}
                    </div>

                    <div className="mt-5 grid gap-3 rounded-2xl bg-[#FAFBFC] p-4 md:grid-cols-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Briefcase className="size-4 text-[#00A88C]" />
                        제안 예산 {proposal.budget}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <Calendar className="size-4 text-[#00A88C]" />
                        시작 가능 {proposal.startDate}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <UserRound className="size-4 text-[#00A88C]" />
                        프로젝트 적합도 높음
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
