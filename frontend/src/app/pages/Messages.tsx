import Navigation from "../components/Navigation";
import { Edit, Search, Phone, Video, Info, Send, Image, Smile, AtSign, Sparkles, Calendar, FileText, CheckCircle, Circle, ChevronDown, ChevronUp, Save, ThumbsUp, XCircle } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router";

const conversations = [
  {
    id: 1,
    name: "김민재 크리에이티브팀",
    role: "디자인 팀장 중",
    message: "네, 제안해주신 서비스 테이하우스 디자이너 ...",
    time: "오전 10:45",
    unread: true,
    online: true,
  },
  {
    id: 2,
    name: "이소연 일러스트레이터",
    role: "지난 위탁 커뮤니",
    message: "저하면 필요한 것들 만들다.",
    time: "어제",
    unread: false,
    online: false,
  },
  {
    id: 3,
    name: "메타버스 프로젝트 팀",
    role: "메시지 30개 새로 공유",
    message: "메시지, 30 새로운 미디어 공유합니다.",
    time: "주말일",
    unread: false,
    online: false,
  },
];

const messages = [
  {
    id: 1,
    sender: "김민재 크리에이티브팀",
    message:
      "안녕하세요! 이번에 저희블로 신 보도 가이드라인 소개를 작업하실디다. 전체적인 색품 톤의 프로젝트 방향설정에 대해 늘 L1고 싶은데요...",
    time: "2024년 5월 24일 리오님",
    isSelf: false,
  },
  {
    id: 2,
    sender: "나",
    message:
      "반참하려만! 감지 'Electric Mint'를 코덱르 컬러로 부정한 비율의 드물려됩니다. 시각 부분은 이렇게 날릴선 있나요?",
    time: "오전 10:40",
    isSelf: true,
    highlighted: true,
  },
  {
    id: 3,
    sender: "김민재 크리에이티브팀",
    message:
      "네, 저명하주신 칼라야우주 면 맞을가 듭니다. 다음 단계로 넘어가시긴 서대로. Plus Jakarta Sans의 모던한 분랫도 기꺼식의 어머니적 잘 맞추는 것 같습니다.",
    time: "오전 10:45",
    isSelf: false,
  },
];

const quickActions = [
  { label: "AI 메시지 도우미", icon: <Sparkles className="size-4" /> },
  { label: "다음 단계 예약 및 날짜", icon: <Calendar className="size-4" /> },
  { label: "프로젝트 개인 문서 첨부", icon: <FileText className="size-4" /> },
];

const initialProcesses = [
  {
    id: 1,
    title: "프로젝트 기획",
    status: "completed",
    tasks: [
      { id: 1, text: "클라이언트 요구사항 분석", completed: true },
      { id: 2, text: "프로젝트 범위 정의", completed: true },
      { id: 3, text: "일정 및 예산 확정", completed: true },
    ],
  },
  {
    id: 2,
    title: "디자인 작업",
    status: "in-progress",
    tasks: [
      { id: 4, text: "와이어프레임 제작", completed: true },
      { id: 5, text: "시각 디자인 시안", completed: true },
      { id: 6, text: "컬러 팔레트 확정", completed: false },
      { id: 7, text: "타이포그래피 선정", completed: false },
    ],
  },
  {
    id: 3,
    title: "피드백 및 수정",
    status: "pending",
    tasks: [
      { id: 8, text: "1차 클라이언트 리뷰", completed: false },
      { id: 9, text: "수정사항 반영", completed: false },
      { id: 10, text: "최종 승인", completed: false },
    ],
  },
  {
    id: 4,
    title: "최종 납품",
    status: "pending",
    tasks: [
      { id: 11, text: "최종 파일 정리", completed: false },
      { id: 12, text: "가이드라인 문서 작성", completed: false },
      { id: 13, text: "프로젝트 완료", completed: false },
    ],
  },
];

export default function Messages() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"profile" | "process">("profile");
  const [processes, setProcesses] = useState(initialProcesses);
  const [expandedProcess, setExpandedProcess] = useState<number | null>(2);
  const [saved, setSaved] = useState(false);

  const toggleTask = (processId: number, taskId: number) => {
    setProcesses(prev => prev.map(process => {
      if (process.id === processId) {
        return {
          ...process,
          tasks: process.tasks.map(task =>
            task.id === taskId ? { ...task, completed: !task.completed } : task
          ),
        };
      }
      return process;
    }));
  };

  const saveProcess = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const getProgressPercentage = (tasks: typeof initialProcesses[0]["tasks"]) => {
    const completedCount = tasks.filter(t => t.completed).length;
    return Math.round((completedCount / tasks.length) * 100);
  };

  const getTotalProgress = () => {
    return Math.round(
      (processes.reduce((acc, p) => acc + getProgressPercentage(p.tasks), 0) /
        processes.length)
    );
  };

  const handleCompleteWork = () => {
    navigate("/review/write?client=김민재 크리에이티브팀&project=브랜드 아이덴티티 프로젝트");
  };

  const handleEndWork = () => {
    if (confirm("작업을 종료하시겠습니까? 진행 중인 작업이 있는 경우 저장되지 않을 수 있습니다.")) {
      // 작업 종료 처리
      alert("작업이 종료되었습니다.");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed": return "bg-[#00C9A7]";
      case "in-progress": return "bg-[#FF5C3A]";
      default: return "bg-gray-300";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "completed": return "완료";
      case "in-progress": return "진행중";
      default: return "대기";
    }
  };
  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navigation />

      <div className="max-w-[1400px] mx-auto flex h-[calc(100vh-73px)]">
        {/* Conversations Sidebar */}
        <div className="w-80 border-r border-gray-200 flex flex-col bg-white">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">메시지</h2>
              <button className="p-2 hover:bg-[#A8F0E4]/20 rounded-lg transition-colors">
                <Edit className="size-5 text-[#00A88C]" />
              </button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-gray-400" />
              <input
                type="text"
                placeholder="이름 또는 키워드 검색"
                className="w-full pl-10 pr-4 py-2 bg-[#F7F7F5] rounded-lg text-sm focus:outline-none focus:bg-white focus:border-2 focus:border-[#00C9A7] transition-all"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                className={`p-4 border-b border-gray-100 hover:bg-[#A8F0E4]/10 cursor-pointer transition-colors ${
                  conv.id === 1 ? "bg-gradient-to-r from-[#A8F0E4]/20 to-transparent border-l-4 border-l-[#00C9A7]" : ""
                }`}
              >
                <div className="flex gap-3">
                  <div className="relative">
                    <div className="size-12 rounded-full bg-gradient-to-br from-[#00C9A7] to-[#00A88C]"></div>
                    {conv.online && (
                      <div className="absolute bottom-0 right-0 size-3 bg-[#00C9A7] border-2 border-white rounded-full"></div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between mb-1">
                      <h3 className="font-semibold text-sm truncate">{conv.name}</h3>
                      <span className="text-xs text-gray-500 flex-shrink-0 ml-2">
                        {conv.time}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mb-1">{conv.role}</p>
                    <p className="text-sm text-gray-600 truncate">{conv.message}</p>
                  </div>
                  {conv.unread && (
                    <div className="size-2 bg-[#FF5C3A] rounded-full flex-shrink-0 mt-2 shadow-lg shadow-[#FF5C3A]/30"></div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-white">
          {/* Chat Header */}
          <div className="p-4 border-b border-gray-200 flex items-center justify-between bg-gradient-to-r from-white to-[#F7F7F5]">
            <div className="flex items-center gap-3">
              <div className="size-10 rounded-full bg-gradient-to-br from-[#00C9A7] to-[#00A88C]"></div>
              <div>
                <h3 className="font-semibold">김민재 크리에이티브팀</h3>
                <p className="text-xs text-[#00C9A7] flex items-center gap-1">● 지금 활동 중</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="p-2 hover:bg-[#A8F0E4]/20 rounded-lg transition-colors">
                <Phone className="size-5 text-gray-600 hover:text-[#00A88C]" />
              </button>
              <button className="p-2 hover:bg-[#A8F0E4]/20 rounded-lg transition-colors">
                <Video className="size-5 text-gray-600 hover:text-[#00A88C]" />
              </button>
              <button className="p-2 hover:bg-[#A8F0E4]/20 rounded-lg transition-colors">
                <Info className="size-5 text-gray-600 hover:text-[#00A88C]" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#F7F7F5]">
            <div className="text-center text-xs text-gray-500 mb-4">
              2024년 5월 24일 리오님
            </div>

            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.isSelf ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] shadow-sm ${
                    msg.isSelf
                      ? "bg-gradient-to-br from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] rounded-2xl rounded-tr-sm"
                      : "bg-white text-gray-800 rounded-2xl rounded-tl-sm border border-gray-200"
                  } ${msg.highlighted ? "bg-gradient-to-br from-[#00C9A7] to-[#00A88C] text-[#0F0F0F]" : ""} p-4`}
                >
                  {!msg.isSelf && (
                    <div className="flex items-center gap-2 mb-2">
                      <div className="size-6 rounded-full bg-gradient-to-br from-[#00C9A7] to-[#00A88C]"></div>
                    </div>
                  )}
                  <p className="text-sm leading-relaxed">{msg.message}</p>
                  <p
                    className={`text-xs mt-2 ${
                      msg.isSelf || msg.highlighted ? "text-[#0F0F0F]/60" : "text-gray-500"
                    }`}
                  >
                    {msg.time}
                  </p>
                </div>
              </div>
            ))}

            {/* Quick Actions */}
            <div className="bg-gradient-to-br from-[#A8F0E4]/30 via-[#A8F0E4]/20 to-white border-2 border-[#00C9A7]/30 rounded-xl p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="size-5 text-[#00A88C]" />
                <span className="font-medium text-sm text-[#00A88C]">AI 메시지 도우미</span>
              </div>
              <p className="text-sm text-gray-600 mb-3">
                당신 만의 부대와 업 디자인 직각 늘 응답하고 프리랜서 그들의 좋은 제안을 하고 싶나요?
              </p>
              <div className="flex gap-2">
                <button className="bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] px-4 py-2 rounded-lg text-sm font-semibold hover:shadow-md transition-all">
                  다음 단계 예약 및 날짜
                </button>
                <button className="bg-white border-2 border-gray-300 px-4 py-2 rounded-lg text-sm hover:bg-gray-50 hover:border-[#A8F0E4] transition-all">
                  프로젝트 개인 문서 첨부
                </button>
              </div>
            </div>
          </div>

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 bg-white">
            <div className="flex gap-2 items-end">
              <button className="p-2 hover:bg-[#A8F0E4]/20 rounded-lg transition-colors">
                <AtSign className="size-5 text-[#00A88C]" />
              </button>
              <div className="flex-1 bg-[#F7F7F5] border-2 border-transparent rounded-2xl px-4 py-3 flex items-center gap-2 focus-within:border-[#00C9A7] transition-all">
                <input
                  type="text"
                  placeholder="김민재 크리에이티브팀님에게 메시지 보내기..."
                  className="flex-1 bg-transparent focus:outline-none text-sm"
                />
                <button className="p-1 hover:bg-[#A8F0E4]/30 rounded-lg transition-colors">
                  <Smile className="size-5 text-gray-600" />
                </button>
                <button className="p-1 hover:bg-[#A8F0E4]/30 rounded-lg transition-colors">
                  <Image className="size-5 text-gray-600" />
                </button>
              </div>
              <button className="bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] p-3 rounded-full hover:shadow-lg transition-all">
                <Send className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="w-80 border-l border-gray-200 bg-white flex flex-col">
          {/* Tab Navigation */}
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab("profile")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === "profile"
                  ? "text-[#00C9A7] border-b-2 border-[#00C9A7]"
                  : "text-gray-600 hover:text-[#00A88C]"
              }`}
            >
              프로필
            </button>
            <button
              onClick={() => setActiveTab("process")}
              className={`flex-1 py-3 text-sm font-medium transition-all ${
                activeTab === "process"
                  ? "text-[#00C9A7] border-b-2 border-[#00C9A7]"
                  : "text-gray-600 hover:text-[#00A88C]"
              }`}
            >
              작업 프로세스
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            {activeTab === "profile" ? (
              <>
                <div className="text-center mb-6">
                  <div className="size-24 rounded-full bg-gradient-to-br from-[#00C9A7] to-[#00A88C] mx-auto mb-4 shadow-lg"></div>
                  <h3 className="font-bold text-lg mb-1">김민재</h3>
                  <p className="text-sm text-gray-600">UX Strategy Director @StudioX</p>
                </div>

                <div className="space-y-3 mb-6">
                  <button className="w-full bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] py-2 rounded-lg text-sm font-semibold hover:shadow-md transition-all">
                    프로필 보기
                  </button>
                  <button className="w-full border-2 border-gray-300 py-2 rounded-lg text-sm hover:bg-gray-50 hover:border-[#A8F0E4] transition-all">
                    프로필 보기기
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <h4 className="font-medium mb-2">소개</h4>
                    <p className="text-sm text-gray-600">
                      디지털 커뮤니케이션 및 전장 전혀된 디자이나디, 년세대
                      드보쇄의 가치속으로 선려한 컨셉 밝블 복제
                      표요 렌치다.
                    </p>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">활동된 미디어</h4>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="aspect-square bg-gradient-to-br from-[#00C9A7] to-[#00A88C] rounded-lg shadow-sm"></div>
                      <div className="aspect-square bg-gradient-to-br from-[#FF5C3A] to-[#FF5C3A]/70 rounded-lg shadow-sm"></div>
                      <div className="aspect-square bg-gradient-to-br from-[#1C1C1C] to-[#0F0F0F] rounded-lg shadow-sm"></div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">설정</h4>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">내역 알림 받기</span>
                        <input type="checkbox" className="toggle" defaultChecked />
                      </div>
                      <button className="text-sm text-[#FF5C3A] hover:text-[#FF5C3A]/80 transition-colors">
                        내역일 나가기
                      </button>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <>
                {/* Process Tab */}
                <div className="mb-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold text-lg">프로젝트 진행 상황</h3>
                    <button
                      onClick={saveProcess}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                        saved
                          ? "bg-[#00C9A7] text-white"
                          : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                      }`}
                    >
                      <Save className="size-4" />
                      {saved ? "저장됨" : "저장"}
                    </button>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    프로젝트 단계별 진행 상황을 확인하고 관리하세요.
                  </p>
                </div>

                {/* Progress Overview */}
                <div className="bg-gradient-to-br from-[#A8F0E4]/20 to-white border border-[#00C9A7]/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">전체 진행률</span>
                    <span className="text-sm font-bold text-[#00A88C]">
                      {Math.round(
                        (processes.reduce((acc, p) => acc + getProgressPercentage(p.tasks), 0) /
                          processes.length)
                      )}%
                    </span>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#00C9A7] to-[#00A88C] transition-all duration-500"
                      style={{
                        width: `${Math.round(
                          (processes.reduce((acc, p) => acc + getProgressPercentage(p.tasks), 0) /
                            processes.length)
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>

                {/* Process Steps */}
                <div className="space-y-3">
                  {processes.map((process) => {
                    const progress = getProgressPercentage(process.tasks);
                    const isExpanded = expandedProcess === process.id;

                    return (
                      <div
                        key={process.id}
                        className="border border-gray-200 rounded-xl overflow-hidden transition-all hover:border-[#00C9A7]/50"
                      >
                        <button
                          onClick={() => setExpandedProcess(isExpanded ? null : process.id)}
                          className="w-full p-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center gap-3 flex-1">
                            <div className={`size-2 rounded-full ${getStatusColor(process.status)}`}></div>
                            <div className="text-left flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h4 className="font-semibold text-sm">{process.title}</h4>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                                  {getStatusLabel(process.status)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full ${getStatusColor(process.status)} transition-all duration-500`}
                                    style={{ width: `${progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-xs text-gray-500 font-medium min-w-[40px] text-right">
                                  {progress}%
                                </span>
                              </div>
                            </div>
                          </div>
                          {isExpanded ? (
                            <ChevronUp className="size-4 text-gray-400 ml-2" />
                          ) : (
                            <ChevronDown className="size-4 text-gray-400 ml-2" />
                          )}
                        </button>

                        {isExpanded && (
                          <div className="px-4 pb-4 bg-gray-50/50">
                            <div className="space-y-2">
                              {process.tasks.map((task) => (
                                <div
                                  key={task.id}
                                  className="flex items-start gap-2 group"
                                >
                                  <button
                                    onClick={() => toggleTask(process.id, task.id)}
                                    className="mt-0.5 flex-shrink-0"
                                  >
                                    {task.completed ? (
                                      <CheckCircle className="size-4 text-[#00C9A7]" />
                                    ) : (
                                      <Circle className="size-4 text-gray-300 group-hover:text-gray-400" />
                                    )}
                                  </button>
                                  <span
                                    className={`text-sm ${
                                      task.completed
                                        ? "text-gray-500 line-through"
                                        : "text-gray-700"
                                    }`}
                                  >
                                    {task.text}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Save Notice */}
                {saved && (
                  <div className="mt-4 p-3 bg-[#00C9A7]/10 border border-[#00C9A7]/30 rounded-lg">
                    <p className="text-sm text-[#00A88C] font-medium flex items-center gap-2">
                      <CheckCircle className="size-4" />
                      작업 프로세스가 저장되었습니다.
                    </p>
                  </div>
                )}

                {/* Complete/End Work Button */}
                <div className="mt-6 pt-6 border-t border-gray-200">
                  {getTotalProgress() === 100 ? (
                    <button
                      onClick={handleCompleteWork}
                      className="w-full bg-gradient-to-r from-[#00C9A7] to-[#00A88C] backdrop-blur-md text-[#0F0F0F] py-3 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all border border-white/30 flex items-center justify-center gap-2"
                    >
                      <ThumbsUp className="size-5" />
                      작업 완료 및 후기 작성
                    </button>
                  ) : (
                    <button
                      onClick={handleEndWork}
                      className="w-full border-2 border-gray-300 text-gray-700 py-3 rounded-xl font-semibold hover:bg-gray-50 hover:border-[#FF5C3A] hover:text-[#FF5C3A] transition-all flex items-center justify-center gap-2"
                    >
                      <XCircle className="size-5" />
                      작업 종료
                    </button>
                  )}
                  <p className="text-xs text-gray-500 text-center mt-3">
                    {getTotalProgress() === 100
                      ? "모든 작업이 완료되었습니다. 후기를 작성해주세요."
                      : "작업 완료 후 후기를 작성할 수 있습니다."}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}