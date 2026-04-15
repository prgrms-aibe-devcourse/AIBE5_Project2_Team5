import Navigation from "../components/Navigation";
import { MoreHorizontal, Plus } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const collections = [
  {
    id: 1,
    title: "2024 UI 트렌드",
    items: "아이템 24개",
    likes: "2개 전 업데이트",
    images: [
      "https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzc1NTU1MzcxfDA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMHV4JTIwZGVzaWduJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3NTU0MTE1MXww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1623932078839-44eb01fbee63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHdvcmt8ZW58MXx8fHwxNzc1NjAzODU5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    badge: "COLLECTION SAFE WORK",
  },
  {
    id: 2,
    title: "브랜딩 레퍼런스",
    items: "아이템 15개",
    likes: "1일 전 업데이트",
    images: [
      "https://images.unsplash.com/photo-1633533451997-8b6079082e3d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxicmFuZCUyMGlkZW50aXR5JTIwZGVzaWdufGVufDF8fHx8MTc3NTU2NDQ1MXww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1718220216044-006f43e3a9b1?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb2Rlcm4lMjBvZmZpY2UlMjB3b3Jrc3BhY2V8ZW58MXx8fHwxNzc1NTU1MzcxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
    additionalCount: 12,
  },
  {
    id: 3,
    title: "협업 프로젝트 A",
    items: "아이템 8개",
    likes: "방금 전 업데이트",
    images: [
      "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3NTU1ODM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMHV4JTIwZGVzaWduJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3NTU0MTE1MXww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1595411425732-e69c1abe2763?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdlb21ldHJpYyUyMHNoYXBlc3xlbnwxfHx8fDE3NzU2MzMzODZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
    ],
  },
];

export default function Collections() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />

      <div className="max-w-[1400px] mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">나의 컬렉션</h1>
            <p className="text-gray-600">
              영감을 주는 작업물과 프로젝트 아이디어를 출력하며 정리해보세요.
              <br />
              오, 당신의 크리에이터의 여기입니다.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-100 flex items-center gap-2">
              <span>필터</span>
            </button>
            <button className="px-6 py-2 bg-black text-white rounded-lg text-sm hover:bg-gray-800 flex items-center gap-2">
              + 새 컬렉션
            </button>
          </div>
        </div>

        {/* Collections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {collections.map((collection) => (
            <div
              key={collection.id}
              className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-shadow cursor-pointer"
            >
              {/* Collection Preview */}
              <div className="h-64 relative bg-gray-900">
                {collection.badge && (
                  <div className="absolute top-3 left-3 bg-black/80 text-white px-3 py-1 rounded text-xs">
                    {collection.badge}
                  </div>
                )}
                <div className="grid grid-cols-2 gap-1 h-full p-1">
                  {collection.images.slice(0, 3).map((image, idx) => (
                    <div
                      key={idx}
                      className={`relative ${
                        idx === 0 ? "col-span-1 row-span-2" : "col-span-1"
                      }`}
                    >
                      <ImageWithFallback
                        src={image}
                        alt=""
                        className="w-full h-full object-cover rounded"
                      />
                    </div>
                  ))}
                  {collection.additionalCount && (
                    <div className="bg-gray-800/90 rounded flex items-center justify-center text-white">
                      <span className="text-xl font-semibold">
                        +{collection.additionalCount}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Collection Info */}
              <div className="p-4 flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {collection.title}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {collection.items} • {collection.likes}
                  </p>
                </div>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreHorizontal className="size-5 text-gray-600" />
                </button>
              </div>
            </div>
          ))}

          {/* Add New Collection Card */}
          <div className="bg-gray-100 rounded-2xl overflow-hidden border-2 border-dashed border-gray-300 flex flex-col items-center justify-center h-[352px] cursor-pointer hover:border-gray-400 hover:bg-gray-50 transition-colors">
            <div className="bg-white rounded-full p-4 mb-4">
              <Plus className="size-8 text-gray-600" />
            </div>
            <p className="text-gray-600 font-medium">새 컬렉션 추가</p>
          </div>
        </div>

        {/* Inspiration Section */}
        <section className="bg-gradient-to-r from-gray-100 to-[#D4F4F4] rounded-2xl p-12 mt-16 flex items-center justify-between">
          <div className="max-w-xl">
            <h2 className="text-3xl font-bold mb-4">영감을 현실로 만드는 방법</h2>
            <p className="text-gray-700 mb-6 leading-relaxed">
              수천 감각선을 바탕으로 새로운 프로젝트를 시작하고. pickxel의
              AI 어시스턴트가 당신의 아이디어를 컬렉션으로 포트폴리오 구성할 수
              있습니다. 지금 시작 해보실래요?
            </p>
            <button className="bg-[#4DD4AC] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#3BC99A] flex items-center gap-2">
              AI 분석 시작하기
            </button>
          </div>
          <div className="w-80 h-64 bg-gray-200 rounded-xl"></div>
        </section>
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
              <a href="#" className="hover:text-black">
                이용약관
              </a>
              <a href="#" className="hover:text-black">
                개인정보처리방침
              </a>
              <a href="#" className="hover:text-black">
                고객센터
              </a>
              <a href="#" className="hover:text-black">
                인재채용
              </a>
              <a href="#" className="hover:text-black">
                비즈니스 문의
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
