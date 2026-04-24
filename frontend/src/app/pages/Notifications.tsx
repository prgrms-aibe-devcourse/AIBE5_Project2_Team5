import Navigation from "../components/Navigation";
import { Heart, MessageCircle, CheckCircle, Sparkles } from "lucide-react";

const notifications = [
  {
    id: 1,
    type: "announcement",
    icon: <Sparkles className="size-5" />,
    iconBg: "bg-[#4DD4AC]",
    title: "'Studio A'로부터 새로운 프로젝트 제안이 도착했습니다",
    subtitle: "브랜딩 아이덴티티 디자인 팀 신규 디자이너 합류 요청",
    action: "제안 확인하기",
    time: "방금 전",
    badge: true,
  },
  {
    id: 2,
    type: "like",
    icon: <Heart className="size-5" />,
    iconBg: "bg-white border border-gray-300",
    title: "이민호 님 외 12명이 당신의 'Neo-Vintage Brand Concept' 컨셉션을 좋아합니다.",
    time: "2시간 전",
    avatar: true,
  },
  {
    id: 3,
    type: "complete",
    icon: <CheckCircle className="size-5" />,
    iconBg: "bg-white border border-gray-300",
    title: "프로젝트 'AI 인터페이스 설계'의 심례가 반려되었습니다",
    subtitle: "재거 시공 대가 단편 전환되었습니다. 자료를 업로해 주세요.",
    action: "서류 페이지로 이동",
    time: "5시간 전",
  },
  {
    id: 4,
    type: "message",
    icon: <MessageCircle className="size-5" />,
    iconBg: "bg-white border border-gray-300",
    title: "김나영 님이 메시지를 남겼습니다:",
    quote: "대인스크그린의 어떤 여건가? 정말 인상적이었니다! 눈에 어떤 콘텐츠 사용한장지? 흉할 수 있을까요?",
    action: "답글 달기",
    actionSecondary: "무시",
    time: "1일 전",
  },
  {
    id: 5,
    type: "milestone",
    icon: <Sparkles className="size-5" />,
    iconBg: "bg-[#4DD4AC]",
    title: "축하합니다! 이번 '이달의 디자이너'로 후보로 선정되었습니다",
    subtitle: "최근 30일간의 활동 공모 자동등록되었습니다. 프로젝트 투표를 통해 특별 상으로 선정됩니다.",
    time: "2일 전",
  },
];

export default function Notifications() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-[900px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">알림 센터</h1>
          <button className="text-sm text-[#4DD4AC] hover:text-[#3BC99A] flex items-center gap-1">
            <CheckCircle className="size-4" />
            모두 읽음으로 표시
          </button>
        </div>

        <p className="text-gray-600 mb-8">
          새로운 프로젝트, 제안과 커뮤니티 활동을 확인하세요.
        </p>

        {/* Tabs */}
        <div className="bg-white rounded-xl p-1 inline-flex mb-8 border border-gray-200">
          <button className="px-6 py-2 bg-black text-white rounded-lg text-sm font-medium">
            전체
          </button>
          <button className="px-6 py-2 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            프로젝트 제안
          </button>
          <button className="px-6 py-2 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            활동 알림
          </button>
          <button className="px-6 py-2 text-gray-600 rounded-lg text-sm hover:bg-gray-50">
            시스템
          </button>
        </div>

        {/* Notifications List */}
        <div className="space-y-3">
          {notifications.map((notification) => (
            <div
              key={notification.id}
              className={`bg-white rounded-xl p-6 border ${
                notification.badge ? "border-[#4DD4AC]" : "border-gray-200"
              } hover:shadow-md transition-shadow`}
            >
              <div className="flex gap-4">
                <div
                  className={`${notification.iconBg} size-12 rounded-full flex items-center justify-center flex-shrink-0`}
                >
                  {notification.avatar ? (
                    <div className="size-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                  ) : (
                    notification.icon
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
                        <button className="bg-[#4DD4AC] text-black px-4 py-2 rounded-lg text-sm font-medium hover:bg-[#3BC99A]">
                          {notification.action}
                        </button>
                      )}
                      {notification.actionSecondary && (
                        <button className="border border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
                          {notification.actionSecondary}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="text-center mt-8">
          <button className="text-gray-600 text-sm hover:text-black">
            더 많은 알림 보기
          </button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xl mb-2">pickxel</div>
              <p className="text-sm text-gray-600">
                © 2024 pickxel. Crafted for the creative elite.
              </p>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-black">이용약관</a>
              <a href="#" className="hover:text-black">개인정보처리방침</a>
              <a href="#" className="hover:text-black">고객센터</a>
              <a href="#" className="hover:text-black">인재채용</a>
              <a href="#" className="hover:text-black">비즈니스 문의</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}