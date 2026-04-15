import { ArrowRight } from "lucide-react";
import { Link } from "react-router";
import { motion } from "motion/react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";

const feedShowcase = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1623932078839-44eb01fbee63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHdvcmt8ZW58MXx8fHwxNzc1NjAzODU5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "브랜드 아이덴티티",
    author: "김지은",
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1761746395536-00d334eba480?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYXNoaW9uJTIwZGVzaWduJTIwc2tldGNofGVufDF8fHx8MTc3NTYzODA1M3ww&ixlib=rb-4.1.0&q=80&w=1080",
    title: "패션 디자인",
    author: "이수진",
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1770581939371-326fc1537f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0eXBvZ3JhcGh5JTIwcG9zdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3NTU5Nzc3Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    title: "타이포그래피 포스터",
    author: "박서준",
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1760138270903-d95903188730?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb2dvJTIwYnJhbmRpbmclMjBpZGVudGl0eXxlbnwxfHx8fDE3NzU2MzgwNTN8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "로고 브랜딩",
    author: "최유나",
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1707836868495-3307d371aba4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWJzaXRlJTIwbW9ja3VwJTIwZGVzaWdufGVufDF8fHx8MTc3NTU3MzI1NXww&ixlib=rb-4.1.0&q=80&w=1080",
    title: "웹사이트 디자인",
    author: "정재현",
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXNpZ24lMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzc1NTg0MDgxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "UI/UX 인터페이스",
    author: "이민호",
  },
  {
    id: 7,
    image: "https://images.unsplash.com/photo-1645483252995-7bdc48253204?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjaGFyYWN0ZXIlMjBkZXNpZ24lMjBhcnR8ZW58MXx8fHwxNzc1NjM4MDU0fDA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "캐릭터 디자인",
    author: "강민지",
  },
  {
    id: 8,
    image: "https://images.unsplash.com/photo-1705321963943-de94bb3f0dd3?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbnRlcmlvciUyMGRlc2lnbiUyMG1vZGVybnxlbnwxfHx8fDE3NzU2MzgwNTR8MA&ixlib=rb-4.1.0&q=80&w=1080",
    title: "인테리어 디자인",
    author: "윤서아",
  },
  {
    id: 9,
    image: "https://images.unsplash.com/photo-1700605295478-2478ac29d2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbGx1c3RyYXRpb24lMjBhcnR3b3JrfGVufDF8fHx8MTc3NTYzNzc0Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    title: "일러스트레이션",
    author: "한지훈",
  },
  {
    id: 10,
    image: "https://images.unsplash.com/photo-1774283834505-e7bf45485d43?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhZHZlcnRpc2luZyUyMHBvc3RlciUyMGNyZWF0aXZlfGVufDF8fHx8MTc3NTYzODA1NHww&ixlib=rb-4.1.0&q=80&w=1080",
    title: "광고 포스터",
    author: "송혜교",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Hero Navigation */}
      <motion.nav
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="border-b border-gray-200 bg-white sticky top-0 z-50 shadow-sm"
      >
        <div className="max-w-[1400px] mx-auto px-6 py-4 flex items-center justify-between">
          {/* Logo with Branding */}
          <Link to="/" className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-[3px] w-[28px] h-[28px]">
              <div className="rounded-[2px] bg-[#00C9A7]"></div>
              <div className="rounded-[2px] bg-[#00C9A7] opacity-50"></div>
              <div className="rounded-[2px] bg-[#FF5C3A] opacity-60"></div>
              <div className="rounded-[2px] bg-[#FF5C3A]"></div>
            </div>
            <span className="text-2xl font-bold tracking-tight">
              <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A] text-[28px]">.</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link
              to="/explore"
              className="text-sm text-gray-600 hover:text-[#00A88C] transition-colors"
            >
              둘러보기
            </Link>
            <Link
              to="/login"
              className="text-sm text-gray-600 hover:text-[#00A88C] transition-colors"
            >
              로그인
            </Link>
            <Link
              to="/signup"
              className="bg-gradient-to-r from-[#00C9A7] to-[#00A88C] text-white px-5 py-2 rounded-full text-sm font-medium hover:shadow-lg hover:scale-105 transition-all"
            >
              시작하기
            </Link>
          </div>
        </div>
      </motion.nav>
      
      {/* Hero Section */}
      <section className="max-w-[1400px] mx-auto px-6 py-20">
        <div className="text-center space-y-6">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-[#00C9A7] text-sm font-medium"
          >
            디자이너와 의뢰인이 직접 만나는 플랫폼
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className="text-5xl md:text-6xl"
          >
            <span className="text-[#0F0F0F]">디자이너를 </span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="text-[#00C9A7]"
            >
              Pick
            </motion.span>
            <span className="text-[#0F0F0F]">하고,</span>
            <br />
            <span className="text-[#0F0F0F]">작업물을 </span>
            <motion.span
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.8 }}
              className="text-[#FF5C3A]"
            >
              Sell
            </motion.span>
            <span className="text-[#0F0F0F]">하다.</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="text-gray-600 text-lg"
          >
            패배없는 수요 찾아, 클라이언트 논하는 그대들.
            <br />
            픽셀 하나로 당신의 감각에 맞는 디자이너와 연결됩니다.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 1.1 }}
            className="flex items-center justify-center gap-4 pt-4"
          >
            <Link
              to="/explore"
              className="bg-[#00C9A7] text-black px-6 py-3 rounded-lg font-medium hover:bg-[#00A88C] flex items-center gap-2 hover:scale-105 transition-transform"
            >
              디자이너 찾기
            </Link>
            <Link
              to="/projects/new"
              className="bg-white border border-gray-300 text-black px-6 py-3 rounded-lg font-medium hover:bg-gray-50 hover:scale-105 transition-transform"
            >
              프로젝트 등록
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="max-w-[1400px] mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-8"
        >
          <p className="text-gray-600 mb-4">이미 1,400명 이상의 디자이너와 의뢰인이 픽셀에서 만났습니다</p>
          <button className="bg-[#0F0F0F] text-white px-6 py-2 rounded-lg text-sm hover:scale-105 transition-transform">
            성공 사례 보기
          </button>
        </motion.div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {[
            { 
              image: "https://images.unsplash.com/photo-1742440710226-450e3b85c100?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMHN0dWRpbyUyMHdvcmtzcGFjZSUyMHRlYW18ZW58MXx8fHwxNzc1NTczMTA4fDA&ixlib=rb-4.1.0&q=80&w=1080",
              title: "Studio Pixel", 
              desc: "브랜드 아이덴티티 디자인 전문",
              badge: "추천"
            },
            { 
              image: "https://images.unsplash.com/photo-1691430597165-4ac5e9d375e0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNrYWdpbmclMjBkZXNpZ24lMjBjb2xvcmZ1bHxlbnwxfHx8fDE3NzU1ODAzNzN8MA&ixlib=rb-4.1.0&q=80&w=1080",
              title: "Design Lab", 
              desc: "제품 패키징 & 그래픽 디자인",
              badge: "인기"
            },
            { 
              image: "https://images.unsplash.com/photo-1609309267394-9d7b8e01bfe0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhcnQlMjBkaXJlY3Rpb24lMjBjcmVhdGl2ZXxlbnwxfHx8fDE3NzU2MzgxNzZ8MA&ixlib=rb-4.1.0&q=80&w=1080",
              title: "Creative Director", 
              desc: "아트 디렉션 & 비주얼 컨설팅",
              badge: "신규"
            }
          ].map((card, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="relative rounded-2xl h-64 flex flex-col justify-end cursor-pointer overflow-hidden group"
            >
              {/* Background Image */}
              <div className="absolute inset-0">
                <ImageWithFallback
                  src={card.image}
                  alt={card.title}
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
              </div>
              
              {/* Badge */}
              <div className="absolute top-4 right-4 bg-[#00C9A7] text-black px-3 py-1 rounded-full text-xs font-bold">
                {card.badge}
              </div>
              
              {/* Content */}
              <div className="relative p-6 text-white">
                <h3 className="font-bold text-2xl mb-2">{card.title}</h3>
                <p className="text-sm text-gray-200">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Live Feed Animation Section */}
      <section className="py-20 overflow-hidden bg-white">
        <div className="max-w-[1400px] mx-auto px-6 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-4xl font-bold mb-4">실시간으로 업데이트되는 작품들</h2>
            <p className="text-gray-600 text-lg">지금 이 순간에도 크리에이터들이 새로운 작품을 공유하고 있습니다</p>
          </motion.div>
        </div>

        {/* First Row - Moving Right */}
        <div className="relative mb-6">
          <motion.div
            className="flex gap-6"
            animate={{
              x: [0, -1920],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
          >
            {[...feedShowcase.slice(0, 5), ...feedShowcase.slice(0, 5)].map((item, index) => (
              <div
                key={`row1-${index}`}
                className="flex-shrink-0 w-[360px] bg-white rounded-xl overflow-hidden shadow-lg"
              >
                <div className="relative h-[270px] overflow-hidden">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.author}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        {/* Second Row - Moving Left */}
        <div className="relative">
          <motion.div
            className="flex gap-6"
            animate={{
              x: [-1920, 0],
            }}
            transition={{
              x: {
                repeat: Infinity,
                repeatType: "loop",
                duration: 30,
                ease: "linear",
              },
            }}
          >
            {[...feedShowcase.slice(5, 10), ...feedShowcase.slice(5, 10)].map((item, index) => (
              <div
                key={`row2-${index}`}
                className="flex-shrink-0 w-[360px] bg-white rounded-xl overflow-hidden shadow-lg"
              >
                <div className="relative h-[270px] overflow-hidden">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-1">{item.title}</h3>
                  <p className="text-sm text-gray-600">{item.author}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>

        <div className="text-center mt-12">
          <Link
            to="/feed"
            className="inline-flex items-center gap-2 bg-[#00C9A7] text-black px-8 py-4 rounded-lg font-medium hover:bg-[#00A88C] hover:scale-105 transition-all"
          >
            더 많은 작품 보기
            <ArrowRight className="size-5" />
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="bg-[#F7F7F5] py-20">
        <div className="max-w-[1400px] mx-auto px-6">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl font-bold mb-12"
          >
            픽셀은 어떻게 작동하나요
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                number: "01",
                title: "무료 등록",
                description: "빠른 가입으로 기다립니다. 당신을 위한 할인은 클릭 한 번으로 끝나요."
              },
              {
                number: "02",
                title: "역제안 게시",
                description: "클라이언트가 원하는 조건, 예산을 입력 후 프로젝트 공고를 올립니다."
              },
              {
                number: "03",
                title: "디자이너 매칭",
                description: "역제안 기능으로 디자이너 중 맞는 분을 위해 픽셀이 추천 드립니다."
              },
              {
                number: "04",
                title: "안전한 계약",
                description: "픽셀을 통해 안전하고 신뢰있는 프로젝트 거래를 보장합니다."
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
                className="space-y-3"
              >
                <motion.div
                  whileHover={{ scale: 1.1 }}
                  transition={{ duration: 0.2 }}
                  className="text-6xl font-bold text-gray-200 hover:text-[#00C9A7]"
                >
                  {item.number}
                </motion.div>
                <h3 className="text-xl font-bold">{item.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#0F0F0F] text-white py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-[1400px] mx-auto px-6 flex items-center justify-between"
        >
          <div>
            <h2 className="text-3xl font-bold mb-2">지금 바로 픽셀을 시작해보세요</h2>
            <p className="text-gray-400">당신의 꿈이자 일터 #프리랜서 커리어를 지금하세요.</p>
          </div>
          <motion.div
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
          >
            <Link
              to="/feed"
              className="bg-[#FF5C3A] text-white px-8 py-4 rounded-lg font-medium hover:bg-[#FF5C3A]/90 flex items-center gap-2"
            >
              무료로 시작하기
              <ArrowRight className="size-5" />
            </Link>
          </motion.div>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-8">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="max-w-[1400px] mx-auto px-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-xl mb-2">
                pick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
              </div>
              <p className="text-sm text-gray-600">© 2024 pickxel. Crafted for the creative elite.</p>
            </div>
            <div className="flex gap-8 text-sm text-gray-600">
              <a href="#" className="hover:text-black transition-colors">이용약관</a>
              <a href="#" className="hover:text-black transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-black transition-colors">고객센터</a>
              <a href="#" className="hover:text-black transition-colors">인재채용</a>
              <a href="#" className="hover:text-black transition-colors">비즈니스 문의</a>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}