import { useEffect, useRef, useState, useCallback } from "react";
import { Link, Navigate } from "react-router";
import {
  motion,
  useMotionValue,
  useSpring,
  useTransform,
} from "motion/react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  ChevronDown,
  Layers,
  Search,
  FolderKanban,
  MessageCircle,
  UserPlus,
  Compass,
  Handshake,
  ArrowRight,
} from "lucide-react";
import { isAuthenticated } from "../utils/auth";
import Footer from "../components/Footer";
import { DayNightSwitch } from "../components/DayNightSwitch";
import { useNightMode } from "../contexts/NightModeContext";
import Lenis from "lenis";


const features = [
  {
    icon: Layers,
    title: "포트폴리오 피드",
    description:
      "디자이너의 작품을 실시간 피드로 탐색하세요. Pick으로 마음에 드는 작업을 저장하고 나만의 컬렉션을 만들 수 있습니다.",
    accent: "mint" as const,
  },
  {
    icon: Search,
    title: "디자이너 탐색 & 매칭",
    description:
      "카테고리, 스타일, 경력별로 최적의 디자이너를 찾아보세요. 프로젝트에 딱 맞는 크리에이터에게 바로 제안할 수 있습니다.",
    accent: "coral" as const,
  },
  {
    icon: FolderKanban,
    title: "프로젝트 관리",
    description:
      "모집 공고 등록부터 지원 관리, 마일스톤 추적까지. 프로젝트의 모든 흐름을 한곳에서 관리합니다.",
    accent: "mint" as const,
  },
  {
    icon: MessageCircle,
    title: "실시간 협업 메시징",
    description:
      "1:1 채팅, 파일 공유, 프로젝트 진행 상태까지 한 화면에서 소통하세요. 빠르고 효율적인 협업이 가능합니다.",
    accent: "coral" as const,
  },
];

const steps = [
  {
    icon: UserPlus,
    number: "01",
    title: "가입하기",
    description: "간단한 정보만 입력하면 바로 시작할 수 있어요.",
  },
  {
    icon: Compass,
    number: "02",
    title: "탐색 & 매칭",
    description:
      "피드를 둘러보고 마음에 드는 디자이너를 찾거나, 프로젝트를 등록하세요.",
  },
  {
    icon: Handshake,
    number: "03",
    title: "협업 & 완성",
    description:
      "메시지로 소통하며 함께 작업을 완성하고, 결과물을 세상에 공개하세요.",
  },
];

const feedGridImages = [
  "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=400&q=70",
  "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=400&q=70",
  "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&q=70",
  "https://images.unsplash.com/photo-1609921212029-bb5a28e60960?w=400&q=70",
  "https://images.unsplash.com/photo-1633186710895-309db2eca9e4?w=400&q=70",
  "https://images.unsplash.com/photo-1547826039-bfc35e0f1ea8?w=400&q=70",
  "https://images.unsplash.com/photo-1626785774573-4b799315345d?w=400&q=70",
  "https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=400&q=70",
  "https://images.unsplash.com/photo-1634986666676-ec8fd927c23d?w=400&q=70",
  "https://images.unsplash.com/photo-1613909207039-6b173b755cc1?w=400&q=70",
  "https://images.unsplash.com/photo-1617791160505-6f00504e3519?w=400&q=70",
  "https://images.unsplash.com/photo-1605106702734-205df224ecce?w=400&q=70",
  "https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=400&q=70",
  "https://images.unsplash.com/photo-1579783902614-a3fb3927b6a5?w=400&q=70",
  "https://images.unsplash.com/photo-1549490349-8643362247b5?w=400&q=70",
  "https://images.unsplash.com/photo-1482160549825-59d1b23cb208?w=400&q=70",
];

const pixelDots = [
  { size: 6, x: "12%", y: "18%", color: "#00C9A7", delay: 0 },
  { size: 4, x: "85%", y: "22%", color: "#FF5C3A", delay: 0.5 },
  { size: 8, x: "8%", y: "72%", color: "#FF5C3A", delay: 1.2 },
  { size: 5, x: "92%", y: "65%", color: "#00C9A7", delay: 0.8 },
  { size: 7, x: "18%", y: "45%", color: "#00C9A7", delay: 1.5 },
  { size: 4, x: "78%", y: "80%", color: "#FF5C3A", delay: 0.3 },
  { size: 6, x: "45%", y: "12%", color: "#00C9A7", delay: 2.0 },
  { size: 5, x: "55%", y: "88%", color: "#FF5C3A", delay: 1.0 },
  { size: 3, x: "30%", y: "30%", color: "#00C9A7", delay: 0.7 },
  { size: 3, x: "70%", y: "40%", color: "#FF5C3A", delay: 1.8 },
];

/* ─── Logo ─── */
function PickxelLogo({ dark = false }: { dark?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5">
      <div className="grid h-7 w-7 grid-cols-2 gap-[3px]">
        <div className="rounded-[3px] bg-[#00C9A7]" />
        <div className="rounded-[3px] bg-[#00C9A7]/55" />
        <div className="rounded-[3px] bg-[#FF5C3A]/65" />
        <div className="rounded-[3px] bg-[#FF5C3A]" />
      </div>
      <span
        className={`text-xl font-bold tracking-tight transition-colors duration-700 sm:text-2xl ${
          dark ? "text-white" : "text-[#2D2A26]"
        }`}
      >
        <span className="text-[#FF5C3A]">p</span>ick
        <span className="text-[#00C9A7]">x</span>el
        <span className="text-[#FF5C3A] text-[26px]">.</span>
      </span>
    </Link>
  );
}

/* DayNightSwitch is now imported from components/DayNightSwitch */

/* ─── Sticky Nav ─── */
function StickyNav({
  isNight,
  onToggle,
}: {
  isNight: boolean;
  onToggle: () => void;
}) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.nav
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-700 ${
        scrolled
          ? isNight
            ? "bg-[#0C1222]/85 shadow-[0_1px_20px_rgba(0,0,0,0.3)] backdrop-blur-xl"
            : "bg-white/80 shadow-[0_1px_20px_rgba(0,0,0,0.06)] backdrop-blur-xl"
          : "bg-transparent"
      }`}
    >
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4 sm:px-10">
        <PickxelLogo dark={isNight} />

        <div className="flex items-center gap-3">
          <DayNightSwitch isNight={isNight} onToggle={onToggle} />
          <Link
            to="/login"
            className={`group relative overflow-hidden rounded-full px-7 py-2.5 text-sm font-semibold transition-all duration-700 ${
              scrolled
                ? isNight
                  ? "bg-white text-[#0C1222] hover:bg-white/90"
                  : "bg-[#0F0F0F] text-white hover:bg-[#2D2A26]"
                : isNight
                  ? "border border-white/30 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20"
                  : "border border-[#2D2A26]/20 bg-[#2D2A26]/5 text-[#2D2A26] backdrop-blur-sm hover:bg-[#2D2A26]/10"
            }`}
          >
            <span className="relative z-10">시작하기</span>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}

/* ─── Floating Showcase Image ─── */
/* ─── Scrolling Image Column ─── */
function ScrollingColumn({
  images,
  speed,
  reverse,
  isNight,
}: {
  images: string[];
  speed: number;
  reverse?: boolean;
  isNight: boolean;
}) {
  const doubled = [...images, ...images];
  return (
    <div className="relative h-full w-[180px] shrink-0 overflow-hidden sm:w-[200px] lg:w-[220px]">
      <motion.div
        className="flex flex-col gap-3"
        animate={{ y: reverse ? ["0%", "-50%"] : ["-50%", "0%"] }}
        transition={{
          duration: speed,
          repeat: Infinity,
          ease: "linear",
        }}
      >
        {doubled.map((src, i) => (
          <motion.div
            key={`${src}-${i}`}
            className={`group relative aspect-[3/4] w-full overflow-hidden transition-all duration-500 ${
              isNight
                ? "rounded-lg border border-white/10 shadow-[0_4px_20px_rgba(0,0,0,0.4)]"
                : "rounded-lg border border-black/5 shadow-[0_4px_20px_rgba(0,0,0,0.08)]"
            }`}
            whileHover={{
              scale: 1.05,
              zIndex: 10,
              transition: { type: "spring", stiffness: 300, damping: 20 },
            }}
          >
            <img
              src={src}
              alt=""
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
              draggable={false}
              loading="lazy"
            />
            <div
              className={`pointer-events-none absolute inset-0 transition-opacity duration-300 group-hover:opacity-0 ${
                isNight ? "opacity-20" : "opacity-10"
              }`}
              style={{
                backgroundImage: isNight
                  ? "radial-gradient(circle, rgba(255,255,255,0.3) 1px, transparent 1px)"
                  : "radial-gradient(circle, rgba(0,0,0,0.15) 1px, transparent 1px)",
                backgroundSize: "4px 4px",
              }}
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─── Hero ─── */
function HeroSection({ isNight }: { isNight: boolean }) {
  const col1 = feedGridImages.slice(0, 4);
  const col2 = feedGridImages.slice(4, 8);
  const col3 = feedGridImages.slice(8, 12);
  const col4 = feedGridImages.slice(12, 16);

  return (
    <section
      className={`relative flex h-full min-h-0 items-center justify-center overflow-hidden pt-20 transition-colors duration-700 ${
        isNight ? "bg-[#0C1222]" : "bg-[var(--brand-landing-bg)]"
      }`}
    >
      {/* Background scrolling grid */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center gap-3 opacity-50 sm:gap-4">
        <ScrollingColumn images={col1} speed={35} isNight={isNight} />
        <ScrollingColumn
          images={col2}
          speed={30}
          reverse
          isNight={isNight}
        />
        <ScrollingColumn images={col3} speed={38} isNight={isNight} />
        <ScrollingColumn
          images={col4}
          speed={32}
          reverse
          isNight={isNight}
        />
        <ScrollingColumn
          images={[...col1].reverse()}
          speed={36}
          isNight={isNight}
        />
        <ScrollingColumn
          images={[...col2].reverse()}
          speed={33}
          reverse
          isNight={isNight}
        />
      </div>

      {/* Blur overlay */}
      <div
        className={`pointer-events-none absolute inset-0 transition-all duration-700 ${
          isNight
            ? "bg-[#0C1222]/70 backdrop-blur-[8px]"
            : "bg-[var(--brand-landing-bg)]/70 backdrop-blur-[8px]"
        }`}
      />

      {/* Glow blobs */}
      <motion.div
        animate={{ x: [0, 30, 0], y: [0, -20, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full blur-[120px] transition-colors duration-700 ${
          isNight ? "bg-[#00C9A7]/10" : "bg-[#00C9A7]/15"
        }`}
      />
      <motion.div
        animate={{ x: [0, -25, 0], y: [0, 30, 0] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
        className={`absolute -right-32 bottom-1/4 h-[350px] w-[350px] rounded-full blur-[120px] transition-colors duration-700 ${
          isNight ? "bg-[#FF5C3A]/8" : "bg-[#FF5C3A]/12"
        }`}
      />

      {/* Pixel dot decorations */}
      {pixelDots.map((dot, i) => (
        <motion.div
          key={i}
          className="absolute z-10"
          style={{ left: dot.x, top: dot.y }}
          animate={{
            opacity: [0.3, 0.8, 0.3],
            scale: [1, 1.3, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
            delay: dot.delay,
          }}
        >
          <div
            style={{
              width: dot.size,
              height: dot.size,
              backgroundColor: dot.color,
            }}
          />
        </motion.div>
      ))}

      {/* Center text content */}
      <div className="relative z-20 flex flex-col items-center px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <div
            className={`mb-8 inline-flex items-center gap-2 rounded-full border px-5 py-2 text-[11px] font-bold tracking-[0.15em] uppercase transition-all duration-700 ${
              isNight
                ? "border-white/15 bg-white/5 text-white/60 backdrop-blur-sm"
                : "border-[#2D2A26]/10 bg-white/40 text-[#7A746D] backdrop-blur-sm"
            }`}
          >
            <span
              className="inline-block h-1.5 w-1.5 bg-[#00C9A7]"
              style={{ clipPath: "none" }}
            />
            Designer Matching Platform
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.4 }}
          className={`font-display text-4xl font-black leading-[1.15] tracking-tight transition-colors duration-700 sm:text-5xl md:text-6xl lg:text-7xl ${
            isNight ? "text-white" : "text-[#2D2A26]"
          }`}
        >
          디자이너를{" "}
          <span className="relative inline-block text-[#FF5C3A]">
            pick
            <motion.span
              className="absolute -bottom-1 left-0 h-[3px] w-full bg-[#FF5C3A]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1.0, ease: "easeOut" }}
              style={{ transformOrigin: "left" }}
            />
          </span>
          하고
          <br />
          작업물을{" "}
          <span className="relative inline-block text-[#00C9A7]">
            sell
            <motion.span
              className="absolute -bottom-1 left-0 h-[3px] w-full bg-[#00C9A7]"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1.3, ease: "easeOut" }}
              style={{ transformOrigin: "left" }}
            />
          </span>
          하다.
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
          className={`mt-6 max-w-[480px] text-base leading-relaxed transition-colors duration-700 sm:text-lg ${
            isNight ? "text-white/65" : "text-[#4A4540]"
          }`}
        >
          마음에 드는 디자이너를 골라 프로젝트를 맡기고,
          <br />
          당신의 작업물을 세상에 판매하세요.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <Link
            to="/login"
            state={{ redirectTo: "/explore" }}
            className="group relative inline-flex items-center gap-2 overflow-hidden rounded-full bg-gradient-to-r from-[#FF5C3A] to-[#e84d2d] px-8 py-3.5 text-sm font-bold text-white shadow-[0_4px_24px_rgba(255,92,58,0.3)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_8px_32px_rgba(255,92,58,0.4)]"
          >
            <span className="relative z-10 flex items-center gap-2">
              Pick 시작하기
              <ArrowRight className="size-4 transition-transform duration-300 group-hover:translate-x-1" />
            </span>
          </Link>
          <Link
            to="/login"
            state={{ redirectTo: "/projects" }}
            className={`rounded-full px-6 py-3.5 text-sm font-semibold transition-all duration-500 ${
              isNight
                ? "border border-white/20 text-white/70 backdrop-blur-sm hover:bg-white/10"
                : "border border-[#2D2A26]/20 text-[#4A4540] backdrop-blur-sm hover:bg-[#2D2A26]/5"
            }`}
          >
            Sell 시작하기
          </Link>
        </motion.div>

        {/* Pixel-style decorative dots around CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
          className={`mt-10 flex items-center gap-6 text-xs font-medium transition-colors duration-700 ${
            isNight ? "text-white/50" : "text-[#5A554F]"
          }`}
        >
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-[#00C9A7]" />
            무료 가입
          </span>
          <span
            className={`h-3 w-px ${isNight ? "bg-white/15" : "bg-[#2D2A26]/10"}`}
          />
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-[#00C9A7]" />
            검증된 디자이너
          </span>
          <span
            className={`h-3 w-px ${isNight ? "bg-white/15" : "bg-[#2D2A26]/10"}`}
          />
          <span className="flex items-center gap-2">
            <span className="h-1.5 w-1.5 bg-[#FF5C3A]" />
            안전한 거래
          </span>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
      >
        <ChevronDown
          className={`size-6 transition-colors duration-700 ${
            isNight ? "text-white/30" : "text-[#2D2A26]/30"
          }`}
        />
      </motion.div>
    </section>
  );
}

/* ─── Features ─── */
function FeaturesSection({ isNight }: { isNight: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const section = sectionRef.current;
      if (!section) return;

      const title = section.querySelector(".feature-title");
      const cards = gsap.utils.toArray<HTMLElement>(
        section.querySelectorAll(".feature-card")
      );

      const tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "+=2800",
          pin: true,
          scrub: 0.65,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      });

      if (title) {
        tl.fromTo(
          title,
          { y: 40, opacity: 0 },
          { y: 0, opacity: 1, duration: 1, ease: "power2.out" },
          0
        );
      }

      cards.forEach((card, index) => {
        const fromLeft = index % 2 === 0;
        tl.fromTo(
          card,
          {
            opacity: 0,
            x: fromLeft ? "-14vw" : "14vw",
          },
          {
            opacity: 1,
            x: 0,
            duration: 0.95,
            ease: "power2.out",
          },
          0.35 + index * 0.18
        );
      });
    },
    { scope: sectionRef, dependencies: [] }
  );

  return (
    <section
      ref={sectionRef}
      className={`relative overflow-x-hidden pt-16 pb-24 transition-colors duration-700 sm:pt-20 sm:pb-32 md:pt-24 md:pb-40 ${
        isNight ? "bg-[#111827]" : "bg-[var(--brand-landing-soft)]"
      }`}
    >
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <div className="feature-title mb-8 text-center sm:mb-10 md:mb-12">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#00C9A7]">
            Core Features
          </p>
          <h2
            className={`font-display text-3xl font-black leading-tight transition-colors duration-700 sm:text-5xl ${
              isNight ? "text-white" : "text-[var(--brand-landing-text)]"
            }`}
          >
            디자인 협업의
            <br />
            모든 것이 여기에
          </h2>
        </div>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-5">
          {features.map((feature) => (
            <div key={feature.title} className="feature-card will-change-transform">
              <div
                className={`group relative overflow-hidden rounded-3xl border p-6 transition-all duration-300 hover:-translate-y-2 md:p-7 lg:p-8 ${
                  isNight
                    ? "border-white/10 bg-[#1a2035] shadow-[0_2px_20px_rgba(0,0,0,0.2)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.4)]"
                    : "border-[var(--brand-landing-border)] bg-white shadow-[0_2px_20px_rgba(0,0,0,0.04)] hover:shadow-[0_12px_40px_rgba(0,0,0,0.1)]"
                }`}
              >
              <div
                className={`absolute -right-12 -top-12 h-32 w-32 rounded-full blur-3xl transition-opacity duration-500 group-hover:opacity-100 ${
                  feature.accent === "mint"
                    ? isNight
                      ? "bg-[#00C9A7]/20 opacity-0"
                      : "bg-[#00C9A7]/10 opacity-0"
                    : isNight
                      ? "bg-[#FF5C3A]/20 opacity-0"
                      : "bg-[#FF5C3A]/10 opacity-0"
                }`}
              />

              <motion.div
                whileHover={{ rotate: 8, scale: 1.1 }}
                transition={{ type: "spring", stiffness: 300, damping: 15 }}
                className={`mb-5 inline-flex rounded-2xl p-3.5 ${
                  feature.accent === "mint"
                    ? isNight
                      ? "bg-[#00C9A7]/15 text-[#00C9A7]"
                      : "bg-[#00C9A7]/10 text-[#00C9A7]"
                    : isNight
                      ? "bg-[#FF5C3A]/15 text-[#FF5C3A]"
                      : "bg-[#FF5C3A]/10 text-[#FF5C3A]"
                }`}
              >
                <feature.icon className="size-6" strokeWidth={2} />
              </motion.div>

              <h3
                className={`mb-3 text-xl font-bold transition-colors duration-700 ${
                  isNight ? "text-white" : "text-[var(--brand-landing-text)]"
                }`}
              >
                {feature.title}
              </h3>
              <p
                className={`text-sm leading-relaxed transition-colors duration-700 ${
                  isNight
                    ? "text-white/60"
                    : "text-[var(--brand-landing-text-sub)]"
                }`}
              >
                {feature.description}
              </p>

              <div
                className={`mt-6 flex items-center gap-1.5 text-xs font-semibold transition-colors ${
                  feature.accent === "mint"
                    ? "text-[#00C9A7] group-hover:text-[#00A88C]"
                    : "text-[#FF5C3A] group-hover:text-[#ea4d2d]"
                }`}
              >
                자세히 보기
                <ArrowRight className="size-3.5 transition-transform duration-300 group-hover:translate-x-1" />
              </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ─── How It Works ─── */
function HowItWorksSection({ isNight }: { isNight: boolean }) {
  const sectionRef = useRef<HTMLElement>(null);
  const lineRef = useRef<HTMLDivElement>(null);

  useGSAP(
    () => {
      if (!lineRef.current) return;

      gsap.fromTo(
        lineRef.current,
        { scaleX: 0 },
        {
          scaleX: 1,
          duration: 1.2,
          ease: "power2.inOut",
          scrollTrigger: {
            trigger: sectionRef.current,
            start: "top 60%",
          },
        }
      );

      gsap.fromTo(
        ".step-card",
        { y: 60, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          duration: 0.7,
          stagger: 0.2,
          ease: "power3.out",
          scrollTrigger: {
            trigger: ".step-card",
            start: "top 85%",
          },
        }
      );
    },
    { scope: sectionRef }
  );

  return (
    <section
      ref={sectionRef}
      className={`relative py-28 transition-colors duration-700 sm:py-36 ${
        isNight ? "bg-[#0C1222]" : "bg-[var(--brand-landing-bg)]"
      }`}
    >
      <div className="mx-auto max-w-[1200px] px-6 sm:px-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className="mb-20 text-center"
        >
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.3em] text-[#FF5C3A]">
            How It Works
          </p>
          <h2
            className={`font-display text-3xl font-black leading-tight transition-colors duration-700 sm:text-5xl ${
              isNight ? "text-white" : "text-[var(--brand-landing-text)]"
            }`}
          >
            세 단계로 시작하세요
          </h2>
        </motion.div>

        <div className="relative">
          <div
            ref={lineRef}
            className="absolute left-[16.67%] right-[16.67%] top-[52px] hidden h-[2px] origin-left bg-gradient-to-r from-[#00C9A7] via-[#00C9A7]/50 to-[#FF5C3A] md:block"
          />

          <div className="grid grid-cols-1 gap-10 md:grid-cols-3 md:gap-8">
            {steps.map((step, index) => (
              <motion.div
                key={step.number}
                className="step-card group text-center"
                whileHover={{ y: -6 }}
                transition={{ duration: 0.3 }}
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300, damping: 15 }}
                  className={`relative z-10 mx-auto mb-7 flex h-[104px] w-[104px] items-center justify-center rounded-3xl border-2 shadow-lg transition-all duration-700 ${
                    isNight
                      ? index === 0
                        ? "border-[#00C9A7]/40 bg-[#1a2035] text-[#00C9A7] group-hover:border-[#00C9A7] group-hover:shadow-[0_8px_30px_rgba(0,201,167,0.25)]"
                        : index === 1
                          ? "border-[#00C9A7]/25 bg-[#1a2035] text-[#00A88C] group-hover:border-[#00C9A7]/70 group-hover:shadow-[0_8px_30px_rgba(0,168,140,0.25)]"
                          : "border-[#FF5C3A]/40 bg-[#1a2035] text-[#FF5C3A] group-hover:border-[#FF5C3A] group-hover:shadow-[0_8px_30px_rgba(255,92,58,0.25)]"
                      : index === 0
                        ? "border-[#00C9A7]/30 bg-white text-[#00C9A7] group-hover:border-[#00C9A7] group-hover:shadow-[0_8px_30px_rgba(0,201,167,0.2)]"
                        : index === 1
                          ? "border-[#00C9A7]/20 bg-white text-[#00A88C] group-hover:border-[#00C9A7]/60 group-hover:shadow-[0_8px_30px_rgba(0,168,140,0.2)]"
                          : "border-[#FF5C3A]/30 bg-white text-[#FF5C3A] group-hover:border-[#FF5C3A] group-hover:shadow-[0_8px_30px_rgba(255,92,58,0.2)]"
                  }`}
                >
                  <step.icon className="size-10" strokeWidth={1.5} />
                  <span
                    className={`absolute -right-2 -top-2 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold transition-colors duration-700 ${
                      isNight
                        ? "bg-white text-[#0C1222]"
                        : "bg-[#2D2A26] text-white"
                    }`}
                  >
                    {step.number}
                  </span>
                </motion.div>

                <h3
                  className={`mb-3 text-lg font-bold transition-colors duration-700 ${
                    isNight ? "text-white" : "text-[var(--brand-landing-text)]"
                  }`}
                >
                  {step.title}
                </h3>
                <p
                  className={`mx-auto max-w-[260px] text-sm leading-relaxed transition-colors duration-700 ${
                    isNight
                      ? "text-white/55"
                      : "text-[var(--brand-landing-text-sub)]"
                  }`}
                >
                  {step.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ─── CTA ─── */
function CTASection({ isNight }: { isNight: boolean }) {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const smoothX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const smoothY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const blobNegX = useTransform(smoothX, (v) => -v);
  const blobNegY = useTransform(smoothY, (v) => -v);

  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width - 0.5) * 30;
      const y = ((e.clientY - rect.top) / rect.height - 0.5) * 30;
      mouseX.set(x);
      mouseY.set(y);
    },
    [mouseX, mouseY]
  );

  return (
    <section
      onMouseMove={handleMouseMove}
      className={`relative overflow-hidden py-28 transition-colors duration-700 sm:py-36 ${
        isNight ? "bg-[#0f1729]" : "bg-[var(--brand-landing-bg)]"
      }`}
    >
      <div
        className={`absolute inset-0 transition-all duration-700 ${
          isNight
            ? "bg-gradient-to-br from-[#00C9A7]/8 via-[#0f1729] to-[#FF5C3A]/8"
            : "bg-gradient-to-br from-[#00C9A7]/10 via-[#FAF8F5] to-[#FF5C3A]/10"
        }`}
      />

      <motion.div
        className={`absolute -left-20 -top-20 h-72 w-72 rounded-full blur-3xl transition-colors duration-700 ${
          isNight ? "bg-[#00C9A7]/10" : "bg-[#00C9A7]/15"
        }`}
        style={{ x: smoothX, y: smoothY }}
      />
      <motion.div
        className={`absolute -bottom-20 -right-20 h-72 w-72 rounded-full blur-3xl transition-colors duration-700 ${
          isNight ? "bg-[#FF5C3A]/8" : "bg-[#FF5C3A]/12"
        }`}
        style={{ x: blobNegX, y: blobNegY }}
      />

      <div className="relative z-10 mx-auto max-w-[800px] px-6 text-center sm:px-10">
        <motion.h2
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
          className={`font-display text-3xl font-black leading-tight transition-colors duration-700 sm:text-5xl ${
            isNight ? "text-white" : "text-[var(--brand-landing-text)]"
          }`}
        >
          당신의 픽셀을
          <br />
          세상에 보여주세요
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className={`mx-auto mt-6 max-w-[440px] text-base leading-relaxed transition-colors duration-700 ${
            isNight ? "text-white/55" : "text-[var(--brand-landing-text-sub)]"
          }`}
        >
          지금 가입하고 수많은 디자이너, 클라이언트와 만나보세요.
          <br />
          당신의 크리에이티브가 시작되는 곳.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="mt-10"
        >
          <Link
            to="/login"
            className={`group relative inline-flex items-center gap-2.5 overflow-hidden rounded-full px-10 py-4 text-base font-bold shadow-lg transition-all duration-300 hover:-translate-y-1 ${
              isNight
                ? "bg-white text-[#0C1222] hover:shadow-[0_8px_40px_rgba(255,255,255,0.15)]"
                : "bg-[#2D2A26] text-white hover:shadow-[0_8px_40px_rgba(45,42,38,0.35)]"
            }`}
          >
            <span className="relative z-10">시작하기</span>
            <ArrowRight className="relative z-10 size-5 transition-transform duration-300 group-hover:translate-x-1" />
            <span
              className={`absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100 ${
                isNight
                  ? "bg-gradient-to-r from-[#A8F0E4] to-[#00C9A7]"
                  : "bg-gradient-to-r from-[#00C9A7] to-[#00A88C]"
              }`}
            />
          </Link>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7, delay: 0.5 }}
          className={`mt-8 flex items-center justify-center gap-6 text-xs transition-colors duration-700 ${
            isNight ? "text-white/45" : "text-[var(--brand-landing-text-sub)]"
          }`}
        >
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00C9A7]" />
            무료 가입
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00C9A7]" />
            즉시 시작
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-[#00C9A7]" />
            안전한 협업
          </span>
        </motion.div>
      </div>
    </section>
  );
}

/* ─── Home ─── */
export default function Home() {
  if (isAuthenticated()) {
    return <Navigate to="/feed" replace />;
  }

  const { isNight, toggle: handleToggle } = useNightMode();

  return (
    <div
      className={`min-h-screen overflow-x-hidden transition-colors duration-700 ${
        isNight ? "bg-[#0C1222]" : "bg-[var(--brand-landing-bg)]"
      }`}
    >
      <StickyNav isNight={isNight} onToggle={handleToggle} />
      <div className="fixed inset-0 z-0 h-[100dvh] overflow-x-hidden overflow-y-hidden">
        <HeroSection isNight={isNight} />
      </div>
      <main className="relative z-10 mt-[100dvh] overflow-x-hidden shadow-[0_-8px_30px_rgba(0,0,0,0.06)]">
        <FeaturesSection isNight={isNight} />
        <HowItWorksSection isNight={isNight} />
        <CTASection isNight={isNight} />
        <Footer />
      </main>
    </div>
  );
}
