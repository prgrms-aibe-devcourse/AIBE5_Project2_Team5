import Navigation from "../components/Navigation";
import { Search, ChevronDown, Plus } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const projects = [
  {
    id: 1,
    title: "Fluid Geometry Study",
    author: "Alex Rivera",
    badge: "NEW",
    imageUrl: "https://images.unsplash.com/photo-1595411425732-e69c1abe2763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdlb21ldHJpYyUyMHNoYXBlc3xlbnwxfHx8fDE3NzU2MzMzODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 2,
    title: "Glassmorphism UI Kit",
    author: "Elena Choi",
    imageUrl: "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMHV4JTIwZGVzaWduJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3NTU0MTE1MXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 3,
    title: "Vibrant Patterns",
    author: "Marc Chen",
    imageUrl: "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3NTU1ODM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 4,
    title: "Organic Flow Series",
    author: "Sarah Jenkins",
    imageUrl: "https://images.unsplash.com/photo-1633533451997-8b6079082e3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFuZCUyMGlkZW50aXR5JTIwZGVzaWdufGVufDF8fHx8MTc3NTU2NDQ1MXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 5,
    title: "Monochrome Branding",
    author: "David Park",
    imageUrl: "https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzc1NTU1MzcxfDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 6,
    title: "Neon Flora Study",
    author: "Ji-won Lee",
    imageUrl: "https://images.unsplash.com/photo-1623932078839-44eb01fbee63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHdvcmt8ZW58MXx8fHwxNzc1NjAzODU5fDA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 7,
    title: "Gradient Dream",
    author: "Sofi Kim",
    imageUrl: "https://images.unsplash.com/photo-1740174459691-5b93c2fa0592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3Rpb24lMjBncmFwaGljcyUyMGFuaW1hdGlvbnxlbnwxfHx8fDE3NzU1OTI4Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 8,
    title: "Arch Theory",
    author: "Tom Brooks",
    imageUrl: "https://images.unsplash.com/photo-1595411425732-e69c1abe2763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdlb21ldHJpYyUyMHNoYXBlc3xlbnwxfHx8fDE3NzU2MzMzODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 9,
    title: "Deep Ocean UI",
    author: "Luna Sky",
    imageUrl: "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMHV4JTIwZGVzaWduJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3NTU0MTE1MXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 10,
    title: "Core Fusion",
    author: "Ian Smith",
    imageUrl: "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3NTU1ODM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
  },
];

const filters = [
  { label: "시스템탬", type: "category" },
  { label: "미니멀", type: "category", active: true },
  { label: "액시얼리즘", type: "category" },
  { label: "빈티지", type: "category" },
];

const colors = [
  { color: "gray", active: false },
  { color: "black", active: true },
  { color: "orange", active: false },
  { color: "red", active: false },
  { color: "blue", active: false },
];

const styles = [
  { label: "그래픽 디자인", type: "style" },
  { label: "일러스트", type: "style" },
  { label: "3D 아트", type: "style" },
];

export default function Explore() {
  return (
    <div className="min-h-screen bg-[#F7F7F5]">
      <Navigation />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        {/* Search Section */}
        <div className="flex gap-4 mb-8 items-center">
          <div className="flex gap-2 bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] rounded-full px-4 py-2 shadow-md">
            <button className="px-4 py-1 bg-[#0F0F0F] text-white rounded-full text-sm font-medium">
              피드 검색
            </button>
            <button className="px-4 py-1 text-white rounded-full text-sm hover:bg-white/20 transition-colors">
              프로젝트 검색
            </button>
          </div>
          
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="어떤 스타일의 영감을 찾고 계신가요? (예. 미니멀한 패키지 디자인)"
              className="w-full bg-white border-2 border-gray-200 rounded-full px-6 py-3 pr-24 text-sm focus:outline-none focus:border-[#00C9A7] transition-colors shadow-sm"
            />
            <button className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white px-6 py-2 rounded-full text-sm font-semibold hover:shadow-md transition-all">
              AI 탐색
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">무드</span>
            <div className="flex gap-2">
              {filters.map((filter, index) => (
                <button
                  key={index}
                  className={`px-4 py-2 rounded-full text-sm border transition-all ${
                    filter.active
                      ? "bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white border-transparent shadow-sm"
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#A8F0E4] hover:bg-[#A8F0E4]/10"
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">색상</span>
            <div className="flex gap-2">
              {colors.map((item, index) => (
                <button
                  key={index}
                  className={`size-10 rounded-full border-2 transition-all hover:scale-110 ${
                    item.active ? "border-[#00C9A7] shadow-md" : "border-gray-300"
                  } ${
                    item.color === "gray"
                      ? "bg-gray-300"
                      : item.color === "black"
                      ? "bg-black"
                      : item.color === "orange"
                      ? "bg-[#FF5C3A]"
                      : item.color === "red"
                      ? "bg-red-500"
                      : "bg-blue-500"
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600 font-medium">스타일</span>
            <div className="flex gap-2">
              {styles.map((style, index) => (
                <button
                  key={index}
                  className="px-4 py-2 rounded-full text-sm border bg-white text-gray-700 border-gray-300 hover:border-[#A8F0E4] hover:bg-[#A8F0E4]/10 transition-all"
                >
                  {style.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Projects Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-8">
          {projects.map((project) => (
            <div key={project.id} className="group cursor-pointer">
              <div className="bg-white rounded-2xl overflow-hidden mb-3 aspect-square relative shadow-sm hover:shadow-xl transition-all border border-gray-100 hover:border-[#A8F0E4]">
                <ImageWithFallback
                  src={project.imageUrl}
                  alt={project.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                />
                {project.badge && (
                  <div className="absolute top-3 right-3 bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-[#0F0F0F] px-3 py-1 rounded-full text-xs font-bold shadow-md">
                    {project.badge}
                  </div>
                )}
              </div>
              <h3 className="font-medium text-sm mb-1">{project.title}</h3>
              <p className="text-xs text-gray-600">{project.author}</p>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="flex justify-center">
          <button className="bg-white border-2 border-gray-300 text-gray-700 px-8 py-3 rounded-full text-sm font-medium hover:border-[#00C9A7] hover:text-[#00A88C] transition-all flex items-center gap-2 shadow-sm hover:shadow-md">
            더 많은 작품 보기
            <ChevronDown className="size-4" />
          </button>
        </div>
      </div>

      {/* Floating Add Button */}
      <button className="fixed bottom-8 right-8 bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white size-14 rounded-full flex items-center justify-center hover:shadow-2xl hover:scale-110 transition-all shadow-lg">
        <Plus className="size-6" />
      </button>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xl mb-2">
                <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
              </div>
              <p className="text-sm text-gray-600">
                창작은 진 세계 창작들의 영감을 연결하고
                <br />
                새로운 시각적 커뮤니티 출현하는 프리미엄 크리에이터를 돕고
                <br />
                즐깁니다.
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
