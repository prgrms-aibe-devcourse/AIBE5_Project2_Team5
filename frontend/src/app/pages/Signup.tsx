import { ArrowRight, Building2, CheckCircle, Lock, Mail, Palette, User, X } from "lucide-react";
import { Link, Navigate, useNavigate } from "react-router";
import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";
import { ImageWithFallback } from "../components/figma/ImageWithFallback";
import { signupApi } from "../api/authApi";
import { isAuthenticated, setAuthenticated, setAuthTokens, setCurrentUser, type UserRole } from "../utils/auth";

const showcaseItems = [
  {
    image: "https://images.unsplash.com/photo-1623932078839-44eb01fbee63?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxjcmVhdGl2ZSUyMGRlc2lnbiUyMHdvcmt8ZW58MXx8fHwxNzc1NjAzODU5fDA&ixlib=rb-4.1.0&q=80&w=1080",
    label: "브랜드 아이덴티티",
  },
  {
    image: "https://images.unsplash.com/photo-1770581939371-326fc1537f10?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHx0eXBvZ3JhcGh5JTIwcG9zdGVyJTIwZGVzaWdufGVufDF8fHx8MTc3NTU5Nzc3Mnww&ixlib=rb-4.1.0&q=80&w=1080",
    label: "타이포그래피",
  },
  {
    image: "https://images.unsplash.com/photo-1748765968965-7e18d4f7192b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxwYWNrYWdpbmclMjBkZXNpZ24lMjBjcmVhdGl2ZXxlbnwxfHx8fDE3NzU2MDE3MTV8MA&ixlib=rb-4.1.0&q=80&w=1080",
    label: "패키지 디자인",
  },
];

const floatingPixels = [
  { className: "left-[6%] top-[14%] h-16 w-16 bg-[#00C9A7]/20", delay: 0 },
  { className: "left-[18%] bottom-[12%] h-10 w-10 bg-[#FF5C3A]/20", delay: 0.6 },
  { className: "right-[8%] top-[18%] h-12 w-12 bg-white/70", delay: 1.1 },
  { className: "right-[18%] bottom-[20%] h-20 w-20 bg-[#00C9A7]/15", delay: 1.5 },
];

const stepVariants = {
  hidden: { opacity: 0, y: 18, height: 0 },
  visible: { opacity: 1, y: 0, height: "auto" },
  exit: { opacity: 0, y: -10, height: 0 },
};

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 30;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_LENGTH = 20;

type SignupErrors = {
  name?: string;
  nickname?: string;
  email?: string;
  role?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
  form?: string;
};

const isPasswordInRange = (password: string) =>
  password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
const isNameInRange = (name: string) => {
  const length = name.trim().length;
  return length >= NAME_MIN_LENGTH && length <= NAME_MAX_LENGTH;
};
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

export default function Signup() {
  const navigate = useNavigate();
  const [activeShowcaseIndex, setActiveShowcaseIndex] = useState(0);
  const [pendingSocialProvider, setPendingSocialProvider] = useState<"Google" | "카카오" | null>(null);
  const [signupErrors, setSignupErrors] = useState<SignupErrors>({});
  const [isPasswordConfirmed, setIsPasswordConfirmed] = useState(false);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    nickname: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "",
  });

  useEffect(() => {
    const timer = window.setInterval(() => {
      setActiveShowcaseIndex((current) => (current + 1) % showcaseItems.length);
    }, 3400);

    return () => window.clearInterval(timer);
  }, []);

  if (isAuthenticated()) {
    return <Navigate to="/feed" replace />;
  }

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    const nextErrors: SignupErrors = {};
    if (!formData.name.trim()) {
      nextErrors.name = "이름을 입력해주세요.";
    } else if (!isNameInRange(formData.name)) {
      nextErrors.name = "이름은 2자 이상 30자 이하로 입력해주세요.";
    }
    if (!formData.nickname.trim()) {
      nextErrors.nickname = "닉네임을 입력해주세요.";
    }
    if (!formData.email.trim()) {
      nextErrors.email = "이메일을 입력해주세요.";
    } else if (!isEmailValid(formData.email)) {
      nextErrors.email = "이메일에는 @를 포함해서 입력해주세요.";
    }
    if (!formData.role) {
      nextErrors.role = "역할을 선택해주세요.";
    }
    if (!formData.password) {
      nextErrors.password = "비밀번호를 입력해주세요.";
    } else if (!isPasswordInRange(formData.password)) {
      nextErrors.password = "비밀번호는 8자 이상 20자 이하로 입력해주세요.";
    }
    if (!formData.confirmPassword) {
      nextErrors.confirmPassword = "비밀번호를 한 번 더 입력해주세요.";
    } else if (formData.password !== formData.confirmPassword) {
      nextErrors.confirmPassword = "비밀번호가 일치하지 않습니다.";
    } else if (!isPasswordConfirmed) {
      nextErrors.confirmPassword = "비밀번호 확인 버튼을 눌러주세요.";
    }
    if (!agreedTerms) {
      nextErrors.terms = "이용약관과 개인정보처리방침에 동의해주세요.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setSignupErrors(nextErrors);
      return;
    }

    const selectedRole = formData.role as UserRole;
    try {
      const user = await signupApi({
        loginId: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        nickname: formData.nickname.trim(),
        role: selectedRole.toUpperCase() as "CLIENT" | "DESIGNER",
      });

      setAuthTokens(user.accessToken, user.refreshToken, true);
      setCurrentUser({
        name: user.name,
        nickname: user.nickname,
        email: user.loginId,
        role: user.role.toLowerCase() as UserRole,
      });
      setAuthenticated(true);
      navigate("/feed", { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : "회원가입에 실패했습니다.";
      const apiErrors: SignupErrors = {};
      if (message.includes("아이디") || message.includes("이메일")) {
        apiErrors.email = message;
      } else if (message.includes("닉네임")) {
        apiErrors.nickname = message;
      } else if (message.includes("비밀번호")) {
        apiErrors.password = message;
      } else {
        apiErrors.form = message;
      }
      setSignupErrors(apiErrors);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fieldName = e.target.name as keyof typeof formData;
    setFormData((current) => ({
      ...current,
      [fieldName]: e.target.value,
    }));
    setSignupErrors((errors) => ({ ...errors, [fieldName]: undefined, form: undefined }));

    if (fieldName === "password" || fieldName === "confirmPassword") {
      setIsPasswordConfirmed(false);
    }
  };

  const handleRoleChange = (role: string) => {
    setFormData((current) => ({ ...current, role }));
    setSignupErrors((errors) => ({ ...errors, role: undefined, form: undefined }));
  };

  const handleTermsChange = (checked: boolean) => {
    setAgreedTerms(checked);
    setSignupErrors((errors) => ({ ...errors, terms: undefined, form: undefined }));
  };

  const handleConfirmPassword = () => {
    if (!formData.confirmPassword) {
      setIsPasswordConfirmed(false);
      setSignupErrors((errors) => ({
        ...errors,
        confirmPassword: "비밀번호를 한 번 더 입력해주세요.",
        form: undefined,
      }));
      return;
    }

    if (!isPasswordInRange(formData.password)) {
      setIsPasswordConfirmed(false);
      setSignupErrors((errors) => ({
        ...errors,
        password: "비밀번호는 8자 이상 20자 이하로 입력해주세요.",
        confirmPassword: "먼저 비밀번호 규칙을 확인해주세요.",
        form: undefined,
      }));
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setIsPasswordConfirmed(false);
      setSignupErrors((errors) => ({
        ...errors,
        confirmPassword: "비밀번호가 일치하지 않습니다.",
        form: undefined,
      }));
      return;
    }

    setIsPasswordConfirmed(true);
    setSignupErrors((errors) => ({ ...errors, confirmPassword: undefined, form: undefined }));
  };

  const startSocialSignup = (provider: "Google" | "카카오") => {
    setPendingSocialProvider(provider);
  };

  const completeSocialSignup = (role: UserRole) => {
    setCurrentUser({
      name: role === "designer" ? "소셜 디자이너" : "소셜 클라이언트",
      nickname: role === "designer" ? "소셜 디자이너" : "소셜 클라이언트",
      email: `${pendingSocialProvider === "Google" ? "google" : "kakao"}@pickxel.local`,
      role,
    });
    setAuthenticated(true);
    navigate("/feed", { replace: true });
  };

  const hasName = formData.name.trim().length > 0;
  const hasNickname = formData.nickname.trim().length > 0;
  const hasEmail = formData.email.trim().length > 0;
  const hasRole = formData.role !== "";
  const hasPassword = formData.password.length > 0;
  const hasConfirmPassword = formData.confirmPassword.length > 0;
  const isNameLengthValid = isNameInRange(formData.name);
  const isPasswordLengthValid = isPasswordInRange(formData.password);
  const activeStep =
    1 +
    Number(hasName) +
    Number(hasNickname) +
    Number(hasEmail) +
    Number(hasRole) +
    Number(hasPassword);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#F7F7F5] text-[#0F0F0F]">
      <div className="absolute inset-0 opacity-70 [background-image:linear-gradient(90deg,rgba(15,15,15,0.04)_1px,transparent_1px),linear-gradient(rgba(15,15,15,0.04)_1px,transparent_1px)] [background-size:44px_44px]" />
      <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#FF5C3A,#00C9A7,#FF5C3A)]" />

      {floatingPixels.map((pixel, index) => (
        <motion.div
          key={index}
          aria-hidden="true"
          className={`pointer-events-none absolute hidden rounded-lg border border-white/80 shadow-lg backdrop-blur-sm lg:block ${pixel.className}`}
          animate={{ y: [0, -14, 0], rotate: [0, -4, 0] }}
          transition={{
            duration: 5.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: pixel.delay,
          }}
        />
      ))}

      <main className="relative mx-auto grid min-h-screen max-w-[1180px] grid-cols-1 items-center gap-10 px-6 py-10 lg:grid-cols-[0.95fr_1.05fr]">
        <section className="hidden lg:block">
          <Logo className="mb-8" />

          <motion.div
            initial={{ opacity: 0, x: -36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
            className="relative h-[650px] overflow-hidden rounded-lg bg-[#0F0F0F]"
          >
            {showcaseItems.map((item, index) => (
              <motion.div
                key={item.label}
                className="absolute inset-0"
                initial={false}
                animate={{
                  opacity: index === activeShowcaseIndex ? 1 : 0,
                  scale: index === activeShowcaseIndex ? 1.05 : 1,
                }}
                transition={{ opacity: { duration: 0.9 }, scale: { duration: 3.4 } }}
              >
                <ImageWithFallback
                  src={item.image}
                  alt={item.label}
                  className="h-full w-full object-cover"
                />
              </motion.div>
            ))}
            <div className="absolute inset-0 bg-gradient-to-t from-[#0F0F0F]/75 via-[#0F0F0F]/16 to-transparent" />
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <motion.div
                key={showcaseItems[activeShowcaseIndex].label}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45 }}
                className="mb-6"
              >
                <h2 className="text-5xl font-bold leading-tight">당신의 감각이 필요한 곳으로</h2>
                <p className="mt-4 max-w-[440px] text-sm leading-relaxed text-gray-200">
                  포트폴리오를 발견하고, 프로젝트를 제안하고, 좋은 협업을 시작하세요.
                </p>
              </motion.div>

              <div className="flex gap-2">
                {showcaseItems.map((item, index) => (
                  <button
                    key={item.label}
                    type="button"
                    aria-label={`${item.label} 보기`}
                    onClick={() => setActiveShowcaseIndex(index)}
                    className={`h-2 rounded-full transition-all ${
                      index === activeShowcaseIndex ? "w-8 bg-[#00C9A7]" : "w-2 bg-white/70"
                    }`}
                  />
                ))}
              </div>
            </div>
          </motion.div>
        </section>

        <motion.section
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="w-full max-w-xl justify-self-center lg:justify-self-end"
        >
          <Logo className="mb-8 justify-center lg:hidden" />

          <div className="mb-6">
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.1 }}
              className="mb-3 text-sm font-semibold text-[#00A88C]"
            >
              Join pickxel
            </motion.p>
            <motion.h1
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.18 }}
              className="mb-2 text-3xl font-bold"
            >
              픽셀 크리에이티브 커뮤니티에 가입하세요
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.26 }}
              className="text-gray-600"
            >
              디자이너와 의뢰인이 서로의 감각을 찾는 곳입니다.
            </motion.p>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 26 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.32 }}
            className="rounded-lg border border-gray-200 bg-white/95 p-8 shadow-2xl backdrop-blur-md"
          >
            <form onSubmit={handleSignup} noValidate className="space-y-5">
              <div>
                <label htmlFor="name" className="mb-2 block text-sm font-medium text-gray-700">
                  먼저 이름을 알려주세요
                </label>
                <div className="relative">
                  <User className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    maxLength={NAME_MAX_LENGTH}
                    aria-invalid={Boolean(signupErrors.name)}
                    aria-describedby={signupErrors.name ? "signup-name-error" : undefined}
                    className={`h-12 w-full rounded-lg border bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10 ${
                      signupErrors.name ? "border-[#FF5C3A]" : "border-gray-200"
                    }`}
                    placeholder="홍길동"
                  />
                </div>
                <div className="mt-2 rounded-lg bg-[#F7F7F5] px-3 py-2 text-xs text-gray-600">
                  <p className={hasName && isNameLengthValid ? "font-medium text-[#00A88C]" : ""}>
                    이름은 2자 이상 30자 이하로 입력해주세요.
                  </p>
                </div>
                {signupErrors.name && (
                  <p id="signup-name-error" className="mt-2 text-xs font-medium text-[#FF5C3A]">
                    {signupErrors.name}
                  </p>
                )}
              </div>

              <AnimatePresence initial={false}>
                {hasName && (
                  <motion.div
                    key="nickname-step"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <label htmlFor="nickname" className="mb-2 block text-sm font-medium text-gray-700">
                      프로필에 보일 닉네임을 정해주세요
                    </label>
                    <div className="relative">
                      <User className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="text"
                        id="nickname"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleChange}
                        maxLength={10}
                        aria-invalid={Boolean(signupErrors.nickname)}
                        aria-describedby={signupErrors.nickname ? "signup-nickname-error" : undefined}
                        className={`h-12 w-full rounded-lg border bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10 ${
                          signupErrors.nickname ? "border-[#FF5C3A]" : "border-gray-200"
                        }`}
                        placeholder="닉네임"
                      />
                    </div>
                    {signupErrors.nickname && (
                      <p id="signup-nickname-error" className="mt-2 text-xs font-medium text-[#FF5C3A]">
                        {signupErrors.nickname}
                      </p>
                    )}
                  </motion.div>
                )}

                {hasName && hasNickname && (
                  <motion.div
                    key="email-step"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                      어디로 소식을 받을까요?
                    </label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        aria-invalid={Boolean(signupErrors.email)}
                        aria-describedby={signupErrors.email ? "signup-email-error" : undefined}
                        className={`h-12 w-full rounded-lg border bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10 ${
                          signupErrors.email ? "border-[#FF5C3A]" : "border-gray-200"
                        }`}
                        placeholder="your@email.com"
                      />
                    </div>
                    {signupErrors.email && (
                      <p id="signup-email-error" className="mt-2 text-xs font-medium text-[#FF5C3A]">
                        {signupErrors.email}
                      </p>
                    )}
                    {!signupErrors.email && (
                      <p className="mt-2 text-xs text-gray-500">
                        이메일에는 @를 포함해서 입력해주세요.
                      </p>
                    )}
                  </motion.div>
                )}

                {hasName && hasNickname && hasEmail && (
                  <motion.div
                    key="role-step"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <label className="mb-2 block text-sm font-medium text-gray-700">어떤 역할로 시작할까요?</label>
                    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                      {[
                        {
                          id: "designer",
                          label: "디자이너",
                          desc: "작업물을 공유하고 프로젝트를 만납니다.",
                          icon: Palette,
                        },
                        {
                          id: "client",
                          label: "클라이언트",
                          desc: "감각에 맞는 디자이너를 찾습니다.",
                          icon: Building2,
                        },
                      ].map((role) => {
                        const Icon = role.icon;
                        const isSelected = formData.role === role.id;

                        return (
                          <motion.button
                            key={role.id}
                            type="button"
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleRoleChange(role.id)}
                            className={`rounded-lg border p-4 text-left transition-all ${
                              isSelected
                                ? "border-[#00C9A7] bg-[#A8F0E4]/20 shadow-lg shadow-[#00C9A7]/10"
                                : "border-gray-200 bg-white hover:border-[#00C9A7]/50"
                            }`}
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <div className={`rounded-lg p-2 ${isSelected ? "bg-[#00C9A7] text-[#0F0F0F]" : "bg-gray-100 text-gray-600"}`}>
                                <Icon className="size-5" />
                              </div>
                              {isSelected && <CheckCircle className="size-5 text-[#00A88C]" />}
                            </div>
                            <div className="font-semibold">{role.label}</div>
                            <p className="mt-1 text-xs leading-relaxed text-gray-500">{role.desc}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                    {signupErrors.role && (
                      <p className="mt-2 text-xs font-medium text-[#FF5C3A]">
                        {signupErrors.role}
                      </p>
                    )}
                  </motion.div>
                )}

                {hasName && hasNickname && hasEmail && hasRole && (
                  <motion.div
                    key="password-step"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                      비밀번호를 만들어주세요
                    </label>
                    <div className="relative">
                      <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                      <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        maxLength={PASSWORD_MAX_LENGTH}
                        aria-invalid={Boolean(signupErrors.password)}
                        aria-describedby="signup-password-rule signup-password-error"
                        className={`h-12 w-full rounded-lg border bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10 ${
                          signupErrors.password ? "border-[#FF5C3A]" : "border-gray-200"
                        }`}
                        placeholder="비밀번호"
                      />
                    </div>
                    <div id="signup-password-rule" className="mt-2 rounded-lg bg-[#F7F7F5] px-3 py-2 text-xs text-gray-600">
                      <p className={hasPassword && isPasswordLengthValid ? "font-medium text-[#00A88C]" : ""}>
                        비밀번호는 8자 이상 20자 이하로 입력해주세요.
                      </p>
                    </div>
                    {signupErrors.password && (
                      <p id="signup-password-error" className="mt-2 text-xs font-medium text-[#FF5C3A]">
                        {signupErrors.password}
                      </p>
                    )}
                  </motion.div>
                )}

                {hasName && hasNickname && hasEmail && hasRole && hasPassword && (
                  <motion.div
                    key="confirm-password-step"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="overflow-hidden"
                  >
                    <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-gray-700">
                      한 번 더 확인할게요
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-gray-400" />
                        <input
                          type="password"
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          maxLength={PASSWORD_MAX_LENGTH}
                          aria-invalid={Boolean(signupErrors.confirmPassword)}
                          aria-describedby={signupErrors.confirmPassword ? "signup-confirm-password-error" : undefined}
                          className={`h-12 w-full rounded-lg border bg-white px-12 text-sm outline-none transition-colors focus:border-[#00C9A7] focus:ring-4 focus:ring-[#00C9A7]/10 ${
                            signupErrors.confirmPassword ? "border-[#FF5C3A]" : "border-gray-200"
                          }`}
                          placeholder="한 번 더 입력"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleConfirmPassword}
                        className="h-12 shrink-0 rounded-lg border border-[#00C9A7] px-4 text-sm font-semibold text-[#007C69] transition-colors hover:bg-[#E8FFF9]"
                      >
                        확인
                      </button>
                    </div>
                    {signupErrors.confirmPassword && (
                      <p id="signup-confirm-password-error" className="mt-2 text-xs font-medium text-[#FF5C3A]">
                        {signupErrors.confirmPassword}
                      </p>
                    )}
                    {isPasswordConfirmed && !signupErrors.confirmPassword && (
                      <p className="mt-2 text-xs font-medium text-[#00A88C]">
                        비밀번호가 일치합니다.
                      </p>
                    )}
                  </motion.div>
                )}

                {hasName && hasNickname && hasEmail && hasRole && hasPassword && hasConfirmPassword && (
                  <motion.div
                    key="submit-step"
                    variants={stepVariants}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="space-y-5 overflow-hidden"
                  >
                    <div>
                    <label className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        checked={agreedTerms}
                        onChange={(event) => handleTermsChange(event.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-[#00C9A7] focus:ring-[#00C9A7]"
                      />
                      <span className="text-sm text-gray-600">
                        <a href="#" className="text-[#00A88C] hover:underline">이용약관</a> 및{" "}
                        <a href="#" className="text-[#00A88C] hover:underline">개인정보처리방침</a>에 동의합니다.
                      </span>
                    </label>
                    {signupErrors.terms && (
                      <p className="mt-2 text-xs font-medium text-[#FF5C3A]">
                        {signupErrors.terms}
                      </p>
                    )}
                    </div>

                    <motion.button
                      type="submit"
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-[#00C9A7] font-semibold text-[#0F0F0F] shadow-lg shadow-[#00C9A7]/20 transition-colors hover:bg-[#00A88C]"
                    >
                      회원가입
                      <ArrowRight className="size-5" />
                    </motion.button>
                    {signupErrors.form && (
                      <p className="text-xs font-medium text-[#FF5C3A]">
                        {signupErrors.form}
                      </p>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>

              {!hasConfirmPassword && (
                <div className="rounded-lg bg-[#F7F7F5] px-4 py-3 text-sm text-gray-500">
                  입력을 마치면 다음 단계가 자동으로 열립니다.
                </div>
              )}
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                이미 계정이 있으신가요?{" "}
                <Link to="/login" className="font-semibold text-[#00A88C] transition-colors hover:text-[#007C69]">
                  로그인
                </Link>
              </p>
            </div>

            <div className="my-6 flex items-center gap-4">
              <div className="h-px flex-1 bg-gray-200"></div>
              <span className="text-sm text-gray-500">또는</span>
              <div className="h-px flex-1 bg-gray-200"></div>
            </div>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <button
                type="button"
                onClick={() => startSocialSignup("Google")}
                className="flex h-12 items-center justify-center gap-3 rounded-lg border border-gray-200 bg-white px-4 transition-colors hover:bg-gray-50"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                <span className="font-medium text-gray-700">Google</span>
              </button>

              <button
                type="button"
                onClick={() => startSocialSignup("카카오")}
                className="flex h-12 items-center justify-center gap-3 rounded-lg bg-[#FEE500] px-4 transition-colors hover:bg-[#FDD835]"
              >
                <svg className="h-5 w-5" viewBox="0 0 24 24">
                  <path fill="#000000" d="M3.0273 10.9441c0 3.9802 2.4648 7.3789 6.7383 7.3789 2.2148 0 3.6953-0.8789 4.8281-2.1367l-1.9688-1.5234c-0.5859 0.7031-1.4297 1.2891-2.8594 1.2891-1.8398 0-3.1406-1.1367-3.5156-2.7539h8.6133c0.0703-0.293 0.1172-0.6328 0.1172-1.0078 0-3.5508-2.332-7.3789-6.457-7.3789-3.8516 0-6.5508 3.4219-6.5508 7.1328zm3.2227-1.2891c0.2461-1.8164 1.4648-2.8711 3.3281-2.8711 1.7109 0 2.9063 1.0078 3.0938 2.8711z"/>
                </svg>
                <span className="font-medium text-gray-900">카카오</span>
              </button>
            </div>
          </motion.div>
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
                <h2 className="text-2xl font-bold">역할을 선택해주세요</h2>
                <p className="mt-2 text-sm text-gray-600">
                  이 선택에 따라 프로필에 디자이너 또는 클라이언트 배지가 표시됩니다.
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
                onClick={() => completeSocialSignup("designer")}
                className="rounded-lg border border-[#BDEFD8] bg-[#F5FFFB] p-4 text-left transition-all hover:border-[#00C9A7] hover:shadow-md"
              >
                <div className="mb-3 inline-flex rounded-lg bg-[#00C9A7] p-2 text-[#0F0F0F]">
                  <Palette className="size-5" />
                </div>
                <div className="font-semibold">디자이너</div>
                <p className="mt-1 text-sm text-gray-600">
                  작업물을 공유하고 프로젝트를 만납니다.
                </p>
              </button>
              <button
                type="button"
                onClick={() => completeSocialSignup("client")}
                className="rounded-lg border border-[#FFB9AA] bg-[#FFF7F4] p-4 text-left transition-all hover:border-[#FF5C3A] hover:shadow-md"
              >
                <div className="mb-3 inline-flex rounded-lg bg-[#FF5C3A] p-2 text-white">
                  <Building2 className="size-5" />
                </div>
                <div className="font-semibold">클라이언트</div>
                <p className="mt-1 text-sm text-gray-600">
                  감각에 맞는 디자이너를 찾고 의뢰합니다.
                </p>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
