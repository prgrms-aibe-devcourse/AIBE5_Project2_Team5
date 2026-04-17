import { ArrowRight, Building2, Lock, Mail, Palette, X } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { isAuthenticated, setAuthenticated, setCurrentUser, type UserRole } from "../utils/auth";

const floatingPixels = [
  { className: "left-[7%] top-[16%] h-14 w-14 bg-[#00C9A7]/20", delay: 0 },
  { className: "left-[16%] bottom-[18%] h-20 w-20 bg-white/70", delay: 0.7 },
  { className: "right-[10%] top-[12%] h-16 w-16 bg-[#FF5C3A]/20", delay: 1.1 },
  { className: "right-[18%] bottom-[14%] h-12 w-12 bg-[#00C9A7]/25", delay: 1.6 },
];

const loginFeedItems = [
  {
    author: { name: "김지은", role: "브랜드 디자이너", avatar: "https://i.pravatar.cc/150?img=1" },
    title: "Electric Mint 브랜딩 프로젝트",
    image: "https://images.unsplash.com/photo-1623932078839-44eb01fbee63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHdvcmt8ZW58MXx8fHwxNzc1NjAzODU5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 234,
    comments: 45,
    tags: ["브랜딩", "로고"],
  },
  {
    author: { name: "박서준", role: "그래픽 디자이너", avatar: "https://i.pravatar.cc/150?img=2" },
    title: "타이포그래피 포스터 시리즈",
    image: "https://images.unsplash.com/photo-1770581939371-326fc1537f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0eXBvZ3JhcGh5JTIwcG9zdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3NTU5Nzc3Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 189,
    comments: 32,
    tags: ["타이포그래피", "포스터"],
  },
  {
    author: { name: "이민호", role: "UI/UX 디자이너", avatar: "https://i.pravatar.cc/150?img=3" },
    title: "모바일 뱅킹 앱 리디자인",
    image: "https://images.unsplash.com/photo-1618761714954-0b8cd0026356?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx3ZWIlMjBkZXNpZ24lMjBpbnRlcmZhY2V8ZW58MXx8fHwxNzc1NTg0MDgxfDA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 456,
    comments: 78,
    tags: ["UI/UX", "모바일"],
  },
  {
    author: { name: "최유나", role: "일러스트레이터", avatar: "https://i.pravatar.cc/150?img=4" },
    title: "디지털 일러스트 컬렉션",
    image: "https://images.unsplash.com/photo-1700605295478-2478ac29d2ec?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbGx1c3RyYXRpb24lMjBhcnR3b3JrfGVufDF8fHx8MTc3NTYzNzc0Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 312,
    comments: 56,
    tags: ["일러스트", "디지털아트"],
  },
  {
    author: { name: "정재현", role: "패키지 디자이너", avatar: "https://i.pravatar.cc/150?img=5" },
    title: "프리미엄 화장품 패키지",
    image: "https://images.unsplash.com/photo-1748765968965-7e18d4f7192b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNrYWdpbmclMjBkZXNpZ24lMjBjcmVhdGl2ZXxlbnwxfHx8fDE3NzU2MDE3MTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 278,
    comments: 41,
    tags: ["패키지", "프리미엄"],
  },
  {
    author: { name: "송혜교", role: "디지털 아티스트", avatar: "https://i.pravatar.cc/150?img=9" },
    title: "3D 캐릭터 일러스트",
    image: "https://images.unsplash.com/photo-1657584942205-c34fec47404d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxkaWdpdGFsJTIwYXJ0JTIwaWxsdXN0cmF0aW9ufGVufDF8fHx8MTc3NTU1ODM1OHww&ixlib=rb-4.1.0&q=80&w=1080",
    likes: 289,
    comments: 44,
    tags: ["3D", "캐릭터"],
  },
];

function Logo({ className = "" }: { className?: string }) {
  return (
    <Link to="/" className={`flex items-center gap-2 ${className}`}>
      <div className="grid h-8 w-8 grid-cols-2 gap-[3px]">
        <div className="rounded-[2px] bg-[#00C9A7]"></div>
        <div className="rounded-[2px] bg-[#00C9A7] opacity-50"></div>
        <div className="rounded-[2px] bg-[#FF5C3A] opacity-60"></div>
        <div className="rounded-[2px] bg-[#FF5C3A]"></div>
      </div>
      <span className="text-3xl font-bold tracking-tight">
        <span className="text-[#FF5C3A]">p</span>ick<span className="text-[#00C9A7]">x</span>el<span className="text-[#FF5C3A] text-[32px]">.</span>
      </span>
    </Link>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [activeArtworkIndex, setActiveArtworkIndex] = useState(0);
  const [pendingSocialProvider, setPendingSocialProvider] = useState<"Google" | "카카오" | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveArtworkIndex((current) => (current + 1) % loginFeedItems.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  if (isAuthenticated()) {
    return <Navigate to="/feed" replace />;
  }

  const completeLogin = (remember = rememberMe) => {
    setAuthenticated(remember);
    navigate("/feed", { replace: true });
  };

  const startSocialLogin = (provider: "Google" | "카카오") => {
    setPendingSocialProvider(provider);
  };

  const completeSocialLogin = (role: UserRole) => {
    setCurrentUser({
      name: role === "designer" ? "소셜 디자이너" : "소셜 클라이언트",
      email: `${pendingSocialProvider === "Google" ? "google" : "kakao"}@pickxel.local`,
      role,
    });
    setAuthenticated(true);
    navigate("/feed", { replace: true });
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();

    if (email.trim() === "qwer@email.com" && password === "1234") {
      completeLogin();
      return;
    }

    alert("이메일 또는 비밀번호가 일치하지 않습니다.");
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F7F5] text-[#0F0F0F]">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(90deg,rgba(15,15,15,0.04)_1px,transparent_1px),linear-gradient(rgba(15,15,15,0.04)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#00C9A7,#FF5C3A,#00C9A7)]" />

      {floatingPixels.map((pixel, index) => (
        <motion.div
          key={index}
          aria-hidden="true"
          className={`pointer-events-none absolute hidden rounded-lg border border-white/80 shadow-lg backdrop-blur-sm lg:block ${pixel.className}`}
          animate={{ y: [0, -16, 0], rotate: [0, 4, 0] }}
          transition={{
            duration: 5.5,
            repeat: Infinity,
            ease: "easeInOut",
            delay: pixel.delay,
          }}
        />
      ))}

      <main className="relative mx-auto grid min-h-screen max-w-[1180px] grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_440px]">
        <section className="hidden lg:block">
          <Logo className="mb-8" />

          <motion.div
            initial={{ opacity: 0, x: -36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative h-[620px] overflow-hidden rounded-lg bg-[#0F0F0F]"
          >
            {loginFeedItems.map((item, index) => (
              <motion.div
                key={item.title}
                className="absolute inset-0"
                initial={false}
                animate={{
                  opacity: index === activeArtworkIndex ? 1 : 0,
                  scale: index === activeArtworkIndex ? 1.04 : 1,
                }}
                transition={{ opacity: { duration: 0.9 }, scale: { duration: 3.2 } }}
              >
                <ImageWithFallback
                  src={item.image}
                  alt={item.title}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            ))}
            <div className="absolute inset-0 bg-[#0F0F0F]/18" />
            <div className="absolute bottom-5 left-1/2 flex -translate-x-1/2 gap-2">
              {loginFeedItems.map((item, index) => (
                <button
                  key={item.title}
                  type="button"
                  aria-label={`${item.title} 보기`}
                  onClick={() => setActiveArtworkIndex(index)}
                  className={`h-2 rounded-full transition-all ${
                    index === activeArtworkIndex ? "w-8 bg-[#00C9A7]" : "w-2 bg-white/70"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-md justify-self-center lg:justify-self-end"
        >
          <Logo className="mb-8 justify-center lg:hidden" />

          <div className="mb-6">
            <h1 className="mb-2 text-3xl font-bold">다시 만나서 반가워요</h1>
            <p className="text-gray-600">계정으로 들어가 저장한 작업과 메시지를 확인하세요.</p>
          </div>

          <div className="rounded-lg border border-gray-200 bg-white/95 p-8 shadow-2xl backdrop-blur-md">
            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    id="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12 w-full rounded-lg border border-gray-200 bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10"
                    placeholder="your@email.com"
                    required
                  />
                </div>
              </div>

              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="password"
                    id="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-12 w-full rounded-lg border border-gray-200 bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10"
                    placeholder="비밀번호를 입력하세요"
                    required
                  />
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-[#00C9A7] focus:ring-[#00C9A7]"
                  />
                  <span className="text-sm text-gray-600">로그인 상태 유지</span>
                </label>
                <a href="#" className="text-sm font-medium text-[#00A88C] transition-colors hover:text-[#007C69]">
                  비밀번호 찾기
                </a>
              </div>

              <motion.button
                type="submit"
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#00C9A7] font-semibold text-[#0F0F0F] shadow-lg shadow-[#00C9A7]/20 transition-colors hover:bg-[#00A88C]"
              >
                로그인
                <ArrowRight className="size-5" />
              </motion.button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                아직 계정이 없으신가요?{" "}
                <Link to="/signup" className="font-semibold text-[#00A88C] transition-colors hover:text-[#007C69]">
                  회원가입
                </Link>
              </p>
            </div>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200"></div>
              <span className="text-sm text-gray-500">또는</span>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>

            <div className="space-y-3">
              <button
                type="button"
                onClick={() => startSocialLogin("Google")}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 transition-colors hover:bg-gray-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-gray-700">Google로 계속하기</span>
              </button>

              <button
                type="button"
                onClick={() => startSocialLogin("카카오")}
                className="flex h-12 w-full items-center justify-center gap-3 rounded-lg bg-[#FEE500] px-4 transition-colors hover:bg-[#FDD835]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#000000" d="M3.0273 10.9441c0 3.9802 2.4648 7.3789 6.7383 7.3789 2.2148 0 3.6953-0.8789 4.8281-2.1367l-1.9688-1.5234c-0.5859 0.7031-1.4297 1.2891-2.8594 1.2891-1.8398 0-3.1406-1.1367-3.5156-2.7539h8.6133c0.0703-0.293 0.1172-0.6328 0.1172-1.0078 0-3.5508-2.332-7.3789-6.457-7.3789-3.8516 0-6.5508 3.4219-6.5508 7.1328zm3.2227-1.2891c0.2461-1.8164 1.4648-2.8711 3.3281-2.8711 1.7109 0 2.9063 1.0078 3.0938 2.8711z"/>
                </svg>
                <span className="font-medium text-gray-900">카카오로 계속하기</span>
              </button>
            </div>
          </div>

          <p className="mt-6 text-center text-sm text-gray-500">
            로그인함으로써{" "}
            <a href="#" className="text-[#00A88C] hover:underline">이용약관</a>
            {" "}및{" "}
            <a href="#" className="text-[#00A88C] hover:underline">개인정보처리방침</a>
            에 동의합니다.
          </p>
        </motion.section>
      </main>
      {pendingSocialProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-sm font-semibold text-[#00A88C]">
                  {pendingSocialProvider} 인증 완료
                </p>
                <h2 className="text-2xl font-bold">어떤 역할로 시작할까요?</h2>
                <p className="mt-2 text-sm text-gray-600">
                  선택한 역할은 프로필 배지와 주요 화면 권한에 반영됩니다.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPendingSocialProvider(null)}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                aria-label="역할 선택 닫기"
              >
                <X className="size-5" />
              </button>
            </div>

            <div className="grid gap-3">
              <button
                type="button"
                onClick={() => completeSocialLogin("designer")}
                className="rounded-lg border border-[#BDEFD8] bg-[#F5FFFB] p-4 text-left transition-all hover:border-[#00C9A7] hover:shadow-md"
              >
                <div className="mb-3 inline-flex rounded-lg bg-[#00C9A7] p-2 text-[#0F0F0F]">
                  <Palette className="size-5" />
                </div>
                <div className="font-semibold">디자이너</div>
                <p className="mt-1 text-sm text-gray-600">
                  작업물을 올리고 프로젝트 제안을 받습니다.
                </p>
              </button>
              <button
                type="button"
                onClick={() => completeSocialLogin("client")}
                className="rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] p-4 text-left transition-all hover:border-[#FF5C3A] hover:shadow-md"
              >
                <div className="mb-3 inline-flex rounded-lg bg-[#FF5C3A] p-2 text-white">
                  <Building2 className="size-5" />
                </div>
                <div className="font-semibold">클라이언트</div>
                <p className="mt-1 text-sm text-gray-600">
                  디자이너를 찾고 프로젝트를 의뢰합니다.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
