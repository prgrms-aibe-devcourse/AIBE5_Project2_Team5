import Navigation from "../components/Navigation";
import { TrendingUp, Calendar, Filter, X } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { Link } from "react-router";
import { useState } from "react";

const trendingProjects = [
  "#UI/UX 디자인",
  "#브랜딩 그래픽",
  "#로고 제작",
  "#3D 모델링",
];

const projects = [
  {
    id: 1,
    badge: "급구",
    badgeColor: "bg-red-500",
    period: "1-3개월 이내임",
    title: "편태크 모바일 앱 UI/UX 고도화 프로젝트",
    description:
      "기존 시스템의 사용자 경험을 부스줍으로 개선하고 시니리. UI 디자인 나요은 보여나 기롯나 들를려보웁니다. 경험 많을 UX 디자이너 선호 협니다.",
    tags: ["#fintech", "#MobileApp", "#UIUX"],
    budget: "1,500만 원 ~",
    duration: "예상 기간 2개월",
    imageUrl:
      "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMHV4JTIwZGVzaWduJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3NTU0MTE1MXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 2,
    badge: "진행중",
    badgeColor: "bg-blue-500",
    period: "10/4-18/0881",
    title: "브랜드 아이덴티티 수립을 위한 캐릭터 일러스트",
    description:
      "신규 브랜드의 기르캐럭트 무선 AI 캐릭터 시스템을 구축합니다. 브랜드 배경을 푸른 화면을 스토에 주들 중입니다.",
    tags: ["#Character", "#Branding", "#Illustration"],
    budget: "500만 원 ~",
    duration: "예상 기간 1개월",
    imageUrl:
      "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3NTU1ODM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 3,
    badge: "검토중",
    badgeColor: "bg-orange-500",
    period: "5-6개월 이내임",
    title: "글로벌 런칭 제품 출농홍 3D 모션영상 제작",
    description:
      "신제품 제넉코그의 3D 수호에 마움를의 위구보 구독하기 독특합니다. 프리미엄 3D 계처리익 아트 디렉터 석유 입합니다.",
    tags: ["#Cinema4D", "#Motion", "#3Ddesz"],
    budget: "2,000만 원 ~",
    duration: "예상 기간 3개월",
    imageUrl:
      "https://images.unsplash.com/photo-1740174459691-5b93c2fa0592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3Rpb24lMjBncmFwaGljcyUyMGFuaW1hdGlvbnxlbnwxfHx8fDE3NzU1OTI4Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

export default function Projects() {
  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navigation />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">역제안 게시판</h1>
              <p className="text-gray-600">
                크리에이티브가 안제 제안! 디자이너의 감각에 한다는 프로젝트나
                아이디어들에 직접 지원하세요.
              </p>
            </div>
            <Link
              to="/projects/new"
              className="bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-md text-white px-6 py-3 rounded-lg font-semibold hover:shadow-lg hover:scale-105 transition-all border border-white/30"
            >
              + 프로젝트 등록
            </Link>
          </div>
        </div>

        {/* Stats Section */}
        <div className="bg-white rounded-2xl p-6 mb-8 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600 mb-1">등록된 프로젝트</div>
              <div className="text-3xl font-bold text-[#0F0F0F]">1,284</div>
            </div>
            <div className="bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] px-6 py-3 rounded-xl shadow-md">
              <div className="text-sm mb-1 font-medium">매칭 성공률</div>
              <div className="text-2xl font-bold">85%</div>
            </div>
          </div>
        </div>

        {/* Trending Section */}
        <div className="bg-gradient-to-br from-[#0F0F0F] via-[#1C1C1C] to-[#0F0F0F] text-white rounded-2xl p-6 mb-8 shadow-lg border border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="size-5 text-[#00C9A7]" />
            <h2 className="text-xl font-bold">오늘의 주목 분류라이트</h2>
          </div>
          <p className="text-gray-300 text-sm mb-4">
            내일응토르로큐 작업들이 올라왔어요! 월로 프로젝트를 만드세요.
          </p>
          <div className="flex flex-wrap gap-2">
            {trendingProjects.map((tag, idx) => (
              <span
                key={idx}
                className="bg-white/10 px-4 py-2 rounded-full text-sm backdrop-blur-sm hover:bg-[#00C9A7] hover:text-[#0F0F0F] cursor-pointer transition-all"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="mt-4">
            <span className="bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] px-3 py-1 rounded-full text-xs font-semibold shadow-md">
              NextStep Labs
            </span>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-4 mb-6">
          <h2 className="text-2xl font-bold">최신 프로젝트 공고</h2>
          <div className="flex-1"></div>
          <button className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm hover:bg-white hover:border-[#00C9A7] transition-all">
            <Filter className="size-4" />
            필터
          </button>
          <button className="flex items-center gap-2 px-4 py-2 border-2 border-gray-300 rounded-lg text-sm hover:bg-white hover:border-[#00C9A7] transition-all">
            정렬 방식
          </button>
        </div>

        {/* Projects List */}
        <div className="space-y-4 mb-8">
          {projects.map((project) => (
            <Link
              key={project.id}
              to={`/projects/${project.id}`}
              className="block bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-[#A8F0E4]"
            >
              <div className="flex">
                <div className="w-32 flex-shrink-0 relative">
                  <ImageWithFallback
                    src={project.imageUrl}
                    alt={project.title}
                    className="w-full h-full object-cover"
                  />
                  <div
                    className={`absolute top-3 left-3 ${project.badgeColor} text-white px-2 py-1 rounded text-xs font-medium shadow-md`}
                  >
                    {project.badge}
                  </div>
                </div>

                <div className="flex-1 p-6">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="size-3" />
                          {project.period}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                      <p className="text-gray-600 text-sm mb-3 leading-relaxed">
                        {project.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {project.tags.map((tag, idx) => (
                          <span
                            key={idx}
                            className="bg-[#A8F0E4]/20 text-[#00A88C] px-3 py-1 rounded-full text-xs font-medium hover:bg-[#00C9A7] hover:text-[#0F0F0F] cursor-pointer transition-all"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="text-right ml-6">
                      <div className="text-2xl font-bold mb-1 text-[#00A88C]">{project.budget}</div>
                      <div className="text-xs text-gray-500 mb-4">{project.duration}</div>
                      <button className="bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] px-6 py-2 rounded-lg text-sm font-semibold hover:shadow-lg transition-all">
                        제안 받기
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Pagination */}
        <div className="flex justify-center items-center gap-2">
          <button className="px-3 py-1 hover:bg-[#A8F0E4]/20 rounded transition-colors">‹</button>
          <button className="px-3 py-2 bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] rounded font-semibold shadow-sm">1</button>
          <button className="px-3 py-2 hover:bg-[#A8F0E4]/20 rounded transition-colors">2</button>
          <button className="px-3 py-2 hover:bg-[#A8F0E4]/20 rounded transition-colors">3</button>
          <button className="px-3 py-2 hover:bg-[#A8F0E4]/20 rounded transition-colors">4</button>
          <button className="px-3 py-1 hover:bg-[#A8F0E4]/20 rounded transition-colors">›</button>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xl mb-2">
                pick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
              </div>
              <p className="text-sm text-gray-600">
                크리에이티브의 가치를 포폰되고 연결하는 공간. 픽셀입니다. 우리는 당신의
                새로운 시각적 커뮤니티 행성하는 프리미엄 세계 단지로 돕고 즐깁니다.
              </p>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-[#00A88C] transition-colors">이용약관</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">고객센터</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">인재채용</a>
              <a href="#" className="hover:text-[#00A88C] transition-colors">비즈니스 문의</a>
            </div>
          </div>
          <p className="text-xs text-gray-500 mt-4">
            © 2024 pickxel. Crafted for the creative elite.
          </p>
        </div>
      </footer>
    </div>
  );
}