import Navigation from "../components/Navigation";
import { Heart, MessageCircle, Bookmark, Calendar, MapPin, Star } from "lucide-react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { useParams, Link, useNavigate } from "react-router";
import { useState, useEffect } from "react";

const profileData = {
  name: "이지은 (Ji-eun Lee)",
  rating: 4.8,
  title: "UI/UX Designer & Brand Strategist",
  followers: "1.2k",
  following: "842",
  badges: ["#UI/UX", "#branding", "#illustration", "#3D Motion"],
};

const projects = [
  {
    id: 1,
    title: "Sustainable Fashion Brand Identity",
    description:
      "새로운 친환경 패션 브랜드를 위한 아이덴티티 작업을 진행하였습니다. 지속 가능 패션에 대한 가치를 그래픽으로 담아내고 있습니다.",
    likes: 259,
    comments: 18,
    tags: ["#branding", "#UI/UX"],
    imageUrl:
      "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMHV4JTIwZGVzaWduJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3NTU0MTE1MXww&ixlib=rb-4.1.0&q=80&w=1080",
  },
  {
    id: 2,
    title: "Summer Motion Series",
    description:
      "여름의 매력새로 낯설 그래픽 사이드 프로젝트입니다. 백설리 티저를 활용한 영상 시퀀스 총 4종으로 구성되니다.",
    likes: 182,
    comments: 32,
    images: [
      "https://images.unsplash.com/photo-1740174459691-5b93c2fa0592?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtb3Rpb24lMjBncmFwaGljcyUyMGFuaW1hdGlvbnxlbnwxfHx8fDE3NzU1OTI4Mzh8MA&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1768471125958-78556538fadc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkZXNpZ25lciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTU0MzkxNXww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3NTU1ODM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
      "https://images.unsplash.com/photo-1772272935464-2e90d8218987?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx1aSUyMHV4JTIwZGVzaWduJTIwaW50ZXJmYWNlfGVufDF8fHx8MTc3NTU0MTE1MXww&ixlib=rb-4.1.0&q=80&w=1080",
    ],
  },
];

const reviews = [
  {
    id: 1,
    company: "TechFlow Solutions",
    author: "김태현 대표",
    rating: 5,
    text: "디자인 품질이 정말 훌륭합니다. 프로젝트를 한족 더 높은 수준으로 끌어올렸습니다. 커뮤니케이션 능력도 탁월하며 매우 만족스러운 협업이었습니다.",
    tags: ["#webDesign", "#branding"],
  },
  {
    id: 2,
    company: "CreativeLoft",
    author: "이수진 팀장",
    rating: 5,
    text: "타고난 안목과 컨셉 이해도가 뛰 우수하지만, 만질된 감각의 컴하여 높은 완성도 제작물을 받았습니다. 레퍼런스 나앙이 너무 많은 편라시했습니다.",
    tags: ["#app-mobile-app"],
  },
];

export default function Profile() {
  const navigate = useNavigate();
  const params = useParams();
  const [activeTab, setActiveTab] = useState<"feed" | "collection" | "reviews">("feed");
  const [allReviews, setAllReviews] = useState(reviews);

  useEffect(() => {
    // localStorage에서 새로운 후기 가져오기
    const savedReviews = localStorage.getItem("reviews");
    if (savedReviews) {
      const parsedReviews = JSON.parse(savedReviews);
      const formattedReviews = parsedReviews.map((r: any, idx: number) => ({
        id: reviews.length + idx + 1,
        company: r.projectName,
        author: r.clientName,
        rating: r.rating,
        text: r.review,
        tags: [],
        communication: r.communication,
        professionalism: r.professionalism,
        payment: r.payment,
        date: r.date,
      }));
      setAllReviews([...formattedReviews, ...reviews]);
    }
  }, []);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />

      <div className="max-w-[1200px] mx-auto px-6 py-12">
        {/* Profile Header */}
        <div className="flex gap-8 mb-12">
          <div className="size-32 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex-shrink-0">
            <ImageWithFallback
              src="https://images.unsplash.com/photo-1768471125958-78556538fadc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwcm9mZXNzaW9uYWwlMjBkZXNpZ25lciUyMHBvcnRyYWl0fGVufDF8fHx8MTc3NTU0MzkxNXww&ixlib=rb-4.1.0&q=80&w=1080"
              alt="Profile"
              className="w-full h-full object-cover rounded-full"
            />
          </div>

          <div className="flex-1">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h1 className="text-3xl font-bold mb-1">{profileData.name}</h1>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-yellow-500">★ {profileData.rating}</span>
                </div>
                <p className="text-gray-600 mb-4">{profileData.title}</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => navigate('/messages')}
                  className="bg-gradient-to-r from-[#00C9A7]/90 to-[#00A88C]/90 backdrop-blur-md text-white px-6 py-2 rounded-full font-medium hover:shadow-lg hover:scale-105 transition-all border border-white/30"
                >
                  채팅하기
                </button>
                <button
                  onClick={() => navigate('/messages')}
                  className="border-2 border-gray-300 px-6 py-2 rounded-full hover:bg-[#F7F7F5] hover:border-[#00C9A7] transition-all"
                >
                  메시지 보내기
                </button>
              </div>
            </div>

            <div className="flex gap-8 mb-4">
              <div>
                <div className="text-2xl font-bold">{profileData.followers}</div>
                <div className="text-sm text-gray-600">Followers</div>
              </div>
              <div>
                <div className="text-2xl font-bold">{profileData.following}</div>
                <div className="text-sm text-gray-600">Following</div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {profileData.badges.map((badge, index) => (
                <span
                  key={index}
                  className="bg-[#4DD4AC] text-black px-3 py-1 rounded-full text-xs font-medium"
                >
                  {badge}
                </span>
              ))}
              <span className="bg-blue-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                +3D Motion
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <MapPin className="size-4" />
                <span>출하마디 컴색</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Calendar className="size-4" />
                <span>최근 위 프로젝트</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <span>응대시간 트테크</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-8">
          <div className="flex gap-8">
            <button
              className={`px-4 py-3 border-b-2 ${
                activeTab === "feed" ? "border-black font-medium" : "text-gray-600 hover:text-black"
              }`}
              onClick={() => setActiveTab("feed")}
            >
              피드 (Feed)
            </button>
            <button
              className={`px-4 py-3 ${
                activeTab === "collection" ? "border-b-2 border-black font-medium" : "text-gray-600 hover:text-black"
              }`}
              onClick={() => setActiveTab("collection")}
            >
              컬렉션 (Collection)
            </button>
            <button
              className={`px-4 py-3 ${
                activeTab === "reviews" ? "border-b-2 border-black font-medium" : "text-gray-600 hover:text-black"
              }`}
              onClick={() => setActiveTab("reviews")}
            >
              후기 (Reviews)
            </button>
          </div>
        </div>

        {/* Tab Content */}
        {activeTab === "feed" && (
          <div className="space-y-8 mb-12">
            {projects.map((project) => (
              <div key={project.id} className="bg-white rounded-2xl overflow-hidden border border-gray-200">
                <div className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="size-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500"></div>
                    <div>
                      <div className="font-semibold">이지은</div>
                      <div className="text-xs text-gray-500">Brand Designer</div>
                    </div>
                    <button className="ml-auto">
                      <MessageCircle className="size-5 text-gray-600" />
                    </button>
                  </div>

                  {project.imageUrl && (
                    <div className="mb-4 rounded-xl overflow-hidden">
                      <ImageWithFallback
                        src={project.imageUrl}
                        alt={project.title}
                        className="w-full aspect-video object-cover"
                      />
                    </div>
                  )}

                  {project.images && (
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      {project.images.map((img, idx) => (
                        <div key={idx} className="rounded-xl overflow-hidden aspect-square">
                          <ImageWithFallback
                            src={img}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {project.tags && (
                    <div className="flex gap-2 mb-3">
                      {project.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-[#4DD4AC] text-black px-3 py-1 rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <h3 className="text-xl font-bold mb-2">{project.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{project.description}</p>

                  <div className="flex items-center gap-6 text-sm text-gray-600">
                    <button className="flex items-center gap-2 hover:text-red-500">
                      <Heart className="size-4" />
                      <span>{project.likes}</span>
                    </button>
                    <button className="flex items-center gap-2 hover:text-blue-500">
                      <MessageCircle className="size-4" />
                      <span>{project.comments}</span>
                    </button>
                    <button className="ml-auto hover:text-black">
                      <Bookmark className="size-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === "collection" && (
          <div className="text-center py-20">
            <div className="text-6xl mb-4">📚</div>
            <h3 className="text-2xl font-bold mb-2">컬렉션이 비어있습니다</h3>
            <p className="text-gray-600">마음에 드는 작품을 저장하여 컬렉션을 만들어보세요.</p>
          </div>
        )}

        {activeTab === "reviews" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">프로젝트 후기</h2>
              <div className="text-sm text-gray-600">총 {allReviews.length}개의 후기</div>
            </div>
            <div className="space-y-4">
              {allReviews.map((review) => (
                <div key={review.id} className="bg-white border border-gray-200 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="size-14 rounded-full bg-gradient-to-br from-[#00C9A7] to-[#00A88C] flex-shrink-0"></div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <div className="font-bold text-lg">{review.company}</div>
                          <div className="text-sm text-gray-600">{review.author}</div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`size-5 ${
                                i < review.rating
                                  ? "fill-[#FF5C3A] text-[#FF5C3A]"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Detailed Ratings if available */}
                      {(review as any).communication && (
                        <div className="grid grid-cols-3 gap-4 mb-4 p-3 bg-[#F7F7F5] rounded-lg">
                          <div>
                            <div className="text-xs text-gray-600 mb-1">의사소통</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`size-3 ${
                                    i < (review as any).communication
                                      ? "fill-[#00C9A7] text-[#00C9A7]"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">전문성</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`size-3 ${
                                    i < (review as any).professionalism
                                      ? "fill-[#00C9A7] text-[#00C9A7]"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-600 mb-1">결제/일정</div>
                            <div className="flex items-center gap-1">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`size-3 ${
                                    i < (review as any).payment
                                      ? "fill-[#00C9A7] text-[#00C9A7]"
                                      : "text-gray-300"
                                  }`}
                                />
                              ))}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  <p className="text-gray-700 leading-relaxed mb-3">{review.text}</p>
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex gap-2">
                      {review.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="bg-[#A8F0E4]/20 text-[#00A88C] px-3 py-1 rounded-full text-xs font-medium"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  {(review as any).date && (
                    <div className="text-xs text-gray-500 mt-3">
                      {new Date((review as any).date).toLocaleDateString("ko-KR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric"
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8 mt-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xl mb-2">
                <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
              </div>
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
