import { ArrowRight, Building2, Lock, Mail, Palette, X } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { motion } from "motion/react";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import kakaoTalkLogo from "../assets/kakao-talk-logo.png";
import { getGoogleOAuthUrl, getKakaoOAuthUrl, loginApi, requestPasswordResetEmailApi } from "../api/authApi";
import { isAuthenticated, setAuthenticated, setAuthTokens, setCurrentUser, type UserRole } from "../utils/auth";

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

type LoginErrors = {
  email?: string;
  password?: string;
  form?: string;
};

type PasswordResetErrors = {
  loginId?: string;
  form?: string;
};

type LoginLocationState = {
  redirectTo?: string;
  message?: string;
};

const emptyPasswordResetForm = {
  loginId: "",
};

type PasswordResetField = keyof typeof emptyPasswordResetForm;

const isEmailValid = (email: string) => /^\S+@\S+$/.test(email.trim());

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
  const location = useLocation();
  const locationState = location.state as LoginLocationState | null;
  const redirectToCandidate = locationState?.redirectTo;
  const redirectTo =
    typeof redirectToCandidate === "string" &&
    redirectToCandidate.startsWith("/") &&
    !redirectToCandidate.startsWith("//")
      ? redirectToCandidate
      : "/feed";
  const loginPromptMessage = typeof locationState?.message === "string" ? locationState.message : "";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [passwordResetForm, setPasswordResetForm] = useState(emptyPasswordResetForm);
  const [passwordResetErrors, setPasswordResetErrors] = useState<PasswordResetErrors>({});
  const [passwordResetSuccess, setPasswordResetSuccess] = useState("");
  const [isPasswordResetSubmitting, setIsPasswordResetSubmitting] = useState(false);
  const [activeArtworkIndex, setActiveArtworkIndex] = useState(0);
  const [pendingSocialProvider, setPendingSocialProvider] = useState<"Google" | "카카오" | null>(null);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveArtworkIndex((current) => (current + 1) % loginFeedItems.length);
    }, 3200);

    return () => window.clearInterval(timer);
  }, []);

  if (isAuthenticated()) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleEmailChange = (value: string) => {
    setEmail(value);
    setLoginErrors((errors) => ({ ...errors, email: undefined, form: undefined }));
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    setLoginErrors((errors) => ({ ...errors, password: undefined, form: undefined }));
  };

  const openPasswordReset = () => {
    setPasswordResetForm({
      ...emptyPasswordResetForm,
      loginId: email.trim(),
    });
    setPasswordResetErrors({});
    setPasswordResetSuccess("");
    setIsPasswordResetOpen(true);
  };

  const closePasswordReset = () => {
    setIsPasswordResetOpen(false);
    setPasswordResetErrors({});
    setPasswordResetSuccess("");
  };

  const handlePasswordResetFieldChange = (field: PasswordResetField, value: string) => {
    setPasswordResetForm((form) => ({ ...form, [field]: value }));
    setPasswordResetErrors((errors) => ({ ...errors, [field]: undefined, form: undefined }));
    setPasswordResetSuccess("");
  };

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: PasswordResetErrors = {};
    const loginId = passwordResetForm.loginId.trim();

    if (!loginId) {
      nextErrors.loginId = "이메일을 입력해주세요.";
    } else if (!isEmailValid(loginId)) {
      nextErrors.loginId = "이메일에는 @를 포함해서 입력해주세요.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setPasswordResetErrors(nextErrors);
      return;
    }

    try {
      setIsPasswordResetSubmitting(true);
      const result = await requestPasswordResetEmailApi(loginId);
      setEmail(loginId);
      setPassword("");
      setPasswordResetForm({
        ...emptyPasswordResetForm,
        loginId,
      });
      setPasswordResetSuccess(result.message);
    } catch (error) {
      setPasswordResetErrors({
        form: error instanceof Error ? error.message : "비밀번호 재설정 메일 전송에 실패했습니다.",
      });
    } finally {
      setIsPasswordResetSubmitting(false);
    }
  };

  const startSocialLogin = (provider: "Google" | "카카오") => {
    setLoginErrors({});
    setPendingSocialProvider(provider);
  };

  const completeSocialLogin = (role: UserRole) => {
    if (!pendingSocialProvider) {
      return;
    }

    const oauthUrl = pendingSocialProvider === "카카오" ? getKakaoOAuthUrl : getGoogleOAuthUrl;
    window.location.href = oauthUrl({
      mode: "login",
      role: role.toUpperCase() as "CLIENT" | "DESIGNER",
      redirectTo,
    });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: LoginErrors = {};
    if (!email.trim()) {
      nextErrors.email = "이메일을 입력해주세요.";
    } else if (!isEmailValid(email)) {
      nextErrors.email = "이메일에는 @를 포함해서 입력해주세요.";
    }
    if (!password) {
      nextErrors.password = "비밀번호를 입력해주세요.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setLoginErrors(nextErrors);
      return;
    }

    try {
      const user = await loginApi(email.trim(), password);
      setAuthTokens(user.accessToken, user.refreshToken, rememberMe);
      setCurrentUser({
        userId: user.userId,
        name: user.name,
        nickname: user.nickname,
        email: user.loginId,
        role: user.role.toLowerCase() as UserRole,
        profileImage: user.profileImage,
      });
      setAuthenticated(rememberMe);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setLoginErrors({
        password: error instanceof Error ? error.message : "로그인에 실패했습니다.",
      });
    }
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
            {loginPromptMessage && (
              <div className="mb-5 rounded-lg border border-[#A8F0E4] bg-[#F0FDF9] px-4 py-3 text-sm font-medium text-[#007C69]">
                {loginPromptMessage}
              </div>
            )}
            <form onSubmit={handleLogin} noValidate className="space-y-5">
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
                    onChange={(e) => handleEmailChange(e.target.value)}
                    aria-invalid={Boolean(loginErrors.email)}
                    aria-describedby={loginErrors.email ? "email-error" : undefined}
                    className={`h-12 w-full rounded-lg border bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10 ${
                      loginErrors.email ? "border-[#FF5C3A]" : "border-gray-200"
                    }`}
                    placeholder="your@email.com"
                  />
                </div>
                {loginErrors.email && (
                  <p id="email-error" className="mt-2 text-xs font-medium text-[#FF5C3A]">
                    {loginErrors.email}
                  </p>
                )}
                {!loginErrors.email && (
                  <p className="mt-2 text-xs text-gray-500">
                    이메일에는 @를 포함해서 입력해주세요.
                  </p>
                )}
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
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    aria-invalid={Boolean(loginErrors.password)}
                    aria-describedby={loginErrors.password ? "password-error" : undefined}
                    className={`h-12 w-full rounded-lg border bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10 ${
                      loginErrors.password ? "border-[#FF5C3A]" : "border-gray-200"
                    }`}
                    placeholder="비밀번호를 입력하세요"
                  />
                </div>
                {loginErrors.password && (
                  <p id="password-error" className="mt-2 text-xs font-medium text-[#FF5C3A]">
                    {loginErrors.password}
                  </p>
                )}
                {loginErrors.form && (
                  <p className="mt-2 text-xs font-medium text-[#FF5C3A]">
                    {loginErrors.form}
                  </p>
                )}
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
                <button
                  type="button"
                  onClick={openPasswordReset}
                  className="text-sm font-medium text-[#00A88C] transition-colors hover:text-[#007C69]"
                >
                  비밀번호 찾기
                </button>
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
                <img src={kakaoTalkLogo} alt="" className="h-6 w-6 rounded-[6px]" />
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
      {isPasswordResetOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 text-sm font-semibold text-[#00A88C]">비밀번호 재설정</p>
                <h2 className="text-2xl font-bold">가입 이메일을 입력해주세요</h2>
                <p className="mt-2 text-sm text-gray-600">
                  가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.
                </p>
              </div>
              <button
                type="button"
                onClick={closePasswordReset}
                className="rounded-lg p-2 text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-800"
                aria-label="비밀번호 재설정 닫기"
              >
                <X className="size-5" />
              </button>
            </div>

            {passwordResetSuccess && (
              <div className="mb-4 rounded-lg border border-[#A8F0E4] bg-[#F0FDF9] px-4 py-3 text-sm font-medium text-[#007C69]">
                {passwordResetSuccess}
              </div>
            )}

            <form onSubmit={handlePasswordReset} noValidate className="space-y-4">
              <div>
                <label htmlFor="reset-login-id" className="mb-2 block text-sm font-medium text-gray-700">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    id="reset-login-id"
                    type="email"
                    value={passwordResetForm.loginId}
                    onChange={(e) => handlePasswordResetFieldChange("loginId", e.target.value)}
                    className={`h-11 w-full rounded-lg border bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10 ${
                      passwordResetErrors.loginId ? "border-[#FF5C3A]" : "border-gray-200"
                    }`}
                    placeholder="your@email.com"
                  />
                </div>
                {passwordResetErrors.loginId && (
                  <p className="mt-2 text-xs font-medium text-[#FF5C3A]">{passwordResetErrors.loginId}</p>
                )}
              </div>

              {passwordResetErrors.form && (
                <p className="rounded-lg bg-[#FFF7F4] px-4 py-3 text-sm font-medium text-[#FF5C3A]">
                  {passwordResetErrors.form}
                </p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={closePasswordReset}
                  className="h-11 flex-1 rounded-lg border border-gray-200 bg-white text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50"
                >
                  닫기
                </button>
                <button
                  type="submit"
                  disabled={isPasswordResetSubmitting}
                  className="h-11 flex-1 rounded-lg bg-[#00C9A7] text-sm font-semibold text-[#0F0F0F] transition-colors hover:bg-[#00A88C] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPasswordResetSubmitting ? "전송 중..." : "재설정 메일 받기"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {pendingSocialProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 p-4">
          <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="mb-1 flex items-center gap-2 text-sm font-semibold text-[#00A88C]">
                  {pendingSocialProvider === "카카오" && (
                    <img src={kakaoTalkLogo} alt="" className="h-5 w-5 rounded-[5px]" />
                  )}
                  {pendingSocialProvider} 로그인
                </p>
                <h2 className="text-2xl font-bold">어떤 역할로 시작할까요?</h2>
                <p className="mt-2 text-sm text-gray-600">
                  최초 소셜 가입 시 선택한 역할이 저장됩니다. 기존 계정이면 저장된 역할로 로그인됩니다.
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
