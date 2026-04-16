import { ArrowRight } from "lucide-react";
import { Link, Navigate } from "react-router";
import { motion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { isAuthenticated } from "../utils/auth";

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

function CountUpNumber({ value }: { value: number }) {
  const [count, setCount] = useState(0);
  const [hasStarted, setHasStarted] = useState(false);
  const frameRef = useRef<number | null>(null);

  useEffect(() => {
    if (!hasStarted) {
      return;
    }

    const duration = 1400;
    const startTime = performance.now();

    const tick = (now: number) => {
      const progress = Math.min((now - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);

      setCount(Math.round(value * eased));

      if (progress < 1) {
        frameRef.current = requestAnimationFrame(tick);
      }
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [hasStarted, value]);

  return (
    <motion.span
      className="font-bold text-[#0F0F0F]"
      onViewportEnter={() => setHasStarted(true)}
      viewport={{ once: true, margin: "-80px" }}
    >
      {count.toLocaleString()}
    </motion.span>
  );
}

export default function Home() {
  if (isAuthenticated()) {
    return <Navigate to="/feed" replace />;
  }

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
            디자이너와 의뢰인을 바로 연결하는 플랫폼
          </motion.p>
          <motion.h1
            initial="hidden"
            animate="visible"
            className="text-5xl md:text-6xl"
          >
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="inline-block text-[#0F0F0F]"
            >
              디자이너를&nbsp;
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 14, scale: 0.75 },
                visible: { opacity: 1, y: 0, scale: [0.75, 1.18, 1] },
              }}
              transition={{ duration: 0.62, delay: 0.62, ease: "easeOut" }}
              className="inline-block text-[#00C9A7]"
            >
              Pick
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, delay: 0.82 }}
              className="inline-block text-[#0F0F0F]"
            >
              하고,&nbsp;
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, delay: 0.98 }}
              className="inline-block text-[#0F0F0F]"
            >
              작업물을&nbsp;
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 14, scale: 0.75 },
                visible: { opacity: 1, y: 0, scale: [0.75, 1.18, 1] },
              }}
              transition={{ duration: 0.62, delay: 1.16, ease: "easeOut" }}
              className="inline-block text-[#FF5C3A]"
            >
              Sell
            </motion.span>
            <motion.span
              variants={{
                hidden: { opacity: 0, y: 18 },
                visible: { opacity: 1, y: 0 },
              }}
              transition={{ duration: 0.5, delay: 1.34 }}
              className="inline-block text-[#0F0F0F]"
            >
              하다.
            </motion.span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.9 }}
            className="text-gray-600 text-lg"
          >
            마음에 드는 작업을 발견하고, 조건에 맞는 프로젝트를 제안하세요. 픽셀은 의뢰인과 디자이너를 더 빠르고 안전하게 연결합니다.
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
          <p className="text-gray-600 mb-4">
            이미 <CountUpNumber value={1400} />명 이상의 디자이너와 의뢰인이 픽셀에서 만나고 있습니다
          </p>
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
              className="relative"
            >
              <motion.div
                animate={{ y: [0, -4, 0] }}
                transition={{
                  duration: 4 + index * 0.3,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: index * 0.2,
                }}
                whileHover={{ y: -8, scale: 1.03, transition: { duration: 0.25 } }}
                className="relative rounded-2xl h-64 flex flex-col justify-end cursor-pointer overflow-hidden group"
              >
                {/* Background Image */}
                <div className="absolute inset-0">
                  <ImageWithFallback
                    src={card.image}
                    alt={card.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent transition-opacity duration-500 group-hover:from-black/75 group-hover:via-black/30" />
                </div>
                
                {/* Badge */}
                <div className="absolute top-4 right-4 bg-[#00C9A7] text-black px-3 py-1 rounded-full text-xs font-bold transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-105">
                  {card.badge}
                </div>
                
                {/* Content */}
                <div className="relative p-6 text-white transition-transform duration-500 group-hover:-translate-y-2">
                  <h3 className="font-bold text-2xl mb-2">{card.title}</h3>
                  <p className="text-sm text-gray-200">{card.desc}</p>
                </div>
              </motion.div>
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
            <p className="text-gray-600 text-lg">지금 이 순간에도 새로운 작업과 포트폴리오가 올라오고 있습니다</p>
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
                className="flex-shrink-0 w-[360px] bg-white rounded-xl overflow-hidden shadow-lg group transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="relative h-[270px] overflow-hidden">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
                className="flex-shrink-0 w-[360px] bg-white rounded-xl overflow-hidden shadow-lg group transition-transform duration-300 hover:-translate-y-2 hover:shadow-2xl"
              >
                <div className="relative h-[270px] overflow-hidden">
                  <ImageWithFallback
                    src={item.image}
                    alt={item.title}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
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
            픽셀은 이렇게 작동합니다
          </motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              {
                number: "01",
                title: "무료 가입",
                description: "몇 가지 정보만 입력하면 포트폴리오 탐색과 프로젝트 등록을 바로 시작할 수 있습니다."
              },
              {
                number: "02",
                title: "프로젝트 등록",
                description: "원하는 스타일, 일정, 예산을 입력해 디자이너에게 프로젝트를 제안합니다."
              },
              {
                number: "03",
                title: "디자이너 매칭",
                description: "프로젝트 조건과 작업 스타일을 바탕으로 잘 맞는 디자이너를 추천합니다."
              },
              {
                number: "04",
                title: "안전한 계약",
                description: "메시지, 계약, 작업 진행 과정을 한곳에서 확인하며 안심하고 협업합니다."
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

      {/* Footer */}
      <footer className="bg-[#0F0F0F] border-t border-[#242424] text-white py-8">
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
                <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A]">.</span>
              </div>
              <p className="text-sm text-gray-400">© 2024 pickxel. 크리에이터와 의뢰인을 위한 연결 플랫폼.</p>
            </div>
            <div className="flex gap-8 text-sm text-gray-400">
              <a href="#" className="hover:text-white transition-colors">이용약관</a>
              <a href="#" className="hover:text-white transition-colors">개인정보처리방침</a>
              <a href="#" className="hover:text-white transition-colors">고객센터</a>
              <a href="#" className="hover:text-white transition-colors">인재채용</a>
              <a href="#" className="hover:text-white transition-colors">비즈니스 문의</a>
            </div>
          </div>
        </motion.div>
      </footer>
    </div>
  );
}
