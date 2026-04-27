import { useState } from "react";
import { ArrowRight, Building2, Eye, EyeOff, Mail, Palette, X } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { PickxelLogo } from "../components/PickxelLogo";
import { DayNightSwitch } from "../components/DayNightSwitch";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { getAuthSplitFormPanelClass } from "../components/auth/authSplitLayout";
import { AnimatedCharactersLoginHero } from "../components/ui/animated-characters-login-page";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { cn } from "../../lib/utils";
import { useAuthSurface } from "../components/auth/useAuthSurface";
import kakaoTalkLogo from "../assets/kakao-talk-logo.png";
import { getGoogleOAuthUrl, getKakaoOAuthUrl, loginApi, requestPasswordResetEmailApi } from "../api/authApi";
import { clearAuthenticated, isAuthenticated, setAuthenticated, setAuthTokens, setCurrentUser, type UserRole } from "../utils/auth";

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

const formStagger = {
  visible: { transition: { staggerChildren: 0.06 } },
};

const formItem = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as const } },
};

export default function Login() {
  const s = useAuthSurface();
  const reduce = useReducedMotion();
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
  const [showPassword, setShowPassword] = useState(false);
  const [emailFieldFocused, setEmailFieldFocused] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [loginErrors, setLoginErrors] = useState<LoginErrors>({});
  const [isPasswordResetOpen, setIsPasswordResetOpen] = useState(false);
  const [passwordResetForm, setPasswordResetForm] = useState(emptyPasswordResetForm);
  const [passwordResetErrors, setPasswordResetErrors] = useState<PasswordResetErrors>({});
  const [passwordResetSuccess, setPasswordResetSuccess] = useState("");
  const [isPasswordResetSubmitting, setIsPasswordResetSubmitting] = useState(false);
  const [pendingSocialProvider, setPendingSocialProvider] = useState<"Google" | "카카오" | null>(null);

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
      clearAuthenticated();
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

  const roleCardDesigner = s.isNight
    ? "rounded-2xl border border-[#BDEFD8]/30 bg-[#00C9A7]/8 p-4 text-left transition-all hover:border-[#00C9A7]/55 hover:shadow-[0_16px_40px_rgba(0,201,167,0.15)]"
    : "rounded-2xl border border-[#BDEFD8] bg-[#F5FFFB] p-4 text-left transition-all hover:border-[#00C9A7] hover:shadow-[0_16px_40px_rgba(0,201,167,0.12)]";
  const roleCardClient = s.isNight
    ? "rounded-2xl border border-[#FF5C3A]/25 bg-[#FF5C3A]/8 p-4 text-left transition-all hover:border-[#FF5C3A]/45 hover:shadow-[0_16px_40px_rgba(255,92,58,0.12)]"
    : "rounded-2xl border border-[#FFB9AA] bg-[#FFF7F4] p-4 text-left transition-all hover:border-[#FF5C3A] hover:shadow-[0_16px_40px_rgba(255,92,58,0.1)]";

  const modalBackdrop = {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: reduce ? 0.15 : 0.22 },
  };

  const modalPanel = {
    initial: { opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 16 },
    animate: { opacity: 1, scale: 1, y: 0 },
    exit: { opacity: 0, scale: reduce ? 1 : 0.96, y: reduce ? 0 : 12 },
    transition: reduce ? { duration: 0.15 } : { type: "spring", stiffness: 420, damping: 32 },
  };

  return (
    <AuthPageShell variant="split">
      <main className="grid min-h-svh w-full grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden min-h-0 lg:block">
          <AnimatedCharactersLoginHero
            isNight={s.isNight}
            emailFieldFocused={emailFieldFocused}
            password={password}
            showPassword={showPassword}
            reduceMotion={Boolean(reduce)}
          />
        </div>

        <motion.section
          initial={reduce ? false : { opacity: 0, x: 28 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1], delay: 0.05 }}
          className={cn(
            "flex min-h-svh flex-col items-center justify-center px-4 py-8 transition-colors duration-500 sm:p-8",
            s.isNight ? "bg-[#0C1222] text-[var(--brand-landing-night-text)]" : "bg-[#FBF9F6] text-[var(--brand-landing-text)]",
          )}
        >
          <div className={cn("w-full max-w-[420px]", s.isNight && "dark")}>
            <div className="mb-6 flex w-full justify-end">
              <DayNightSwitch isNight={s.isNight} onToggle={s.toggle} />
            </div>
            <motion.div
              className="mb-10 flex justify-center lg:hidden"
              initial={reduce ? false : { opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <PickxelLogo dark={s.isNight} className="min-w-0" />
            </motion.div>

            <div className="mb-10 text-center">
              <h1 className={`font-display text-3xl font-black tracking-tight sm:text-4xl ${s.heading}`}>
                다시 만나서 반가워요
              </h1>
              <p className={`mt-2 text-sm sm:text-base ${s.subheading}`}>이메일과 비밀번호를 입력해주세요.</p>
            </div>

            <div className={getAuthSplitFormPanelClass(s.isNight)}>
              {loginPromptMessage && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className={`mb-6 overflow-hidden rounded-xl px-4 py-3 text-base font-medium ${s.successBanner}`}
                >
                  {loginPromptMessage}
                </motion.div>
              )}

              <motion.form
                variants={reduce ? undefined : formStagger}
                initial="hidden"
                animate="visible"
                onSubmit={handleLogin}
                noValidate
                className="space-y-5"
              >
                <motion.div variants={reduce ? undefined : formItem} className="space-y-2">
                  <Label htmlFor="email" className={s.label}>
                    이메일
                  </Label>
                  <div className="relative">
                    <Mail
                      className={cn(
                        "pointer-events-none absolute left-3 top-1/2 size-5 -translate-y-1/2",
                        s.iconInput,
                      )}
                    />
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => handleEmailChange(e.target.value)}
                      onFocus={() => setEmailFieldFocused(true)}
                      onBlur={() => setEmailFieldFocused(false)}
                      aria-invalid={Boolean(loginErrors.email)}
                      aria-describedby={loginErrors.email ? "email-error" : undefined}
                      className={cn("h-12 min-h-[3rem] pl-11", loginErrors.email && "border-destructive")}
                      placeholder="your@email.com"
                      autoComplete="email"
                    />
                  </div>
                  {loginErrors.email && (
                    <p id="email-error" className={`text-sm ${s.errorText}`}>
                      {loginErrors.email}
                    </p>
                  )}
                  {!loginErrors.email && (
                    <p className={`text-sm ${s.muted}`}>이메일에는 @를 포함해서 입력해주세요.</p>
                  )}
                </motion.div>

                <motion.div variants={reduce ? undefined : formItem} className="space-y-2">
                  <Label htmlFor="password" className={s.label}>
                    비밀번호
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => handlePasswordChange(e.target.value)}
                      aria-invalid={Boolean(loginErrors.password)}
                      aria-describedby={loginErrors.password ? "password-error" : undefined}
                      className={cn("h-12 min-h-[3rem] pr-11", loginErrors.password && "border-destructive")}
                      placeholder="비밀번호를 입력하세요"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                      aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                    >
                      {showPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                    </button>
                  </div>
                  {loginErrors.password && (
                    <p id="password-error" className={`text-sm ${s.errorText}`}>
                      {loginErrors.password}
                    </p>
                  )}
                  {loginErrors.form && <p className={`text-sm ${s.errorText}`}>{loginErrors.form}</p>}
                </motion.div>

                <motion.div
                  variants={reduce ? undefined : formItem}
                  className="flex flex-wrap items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="remember"
                      checked={rememberMe}
                      onCheckedChange={(c) => setRememberMe(c === true)}
                    />
                    <Label htmlFor="remember" className={cn("cursor-pointer text-base font-normal", s.subheading)}>
                      로그인 상태 유지
                    </Label>
                  </div>
                  <button type="button" onClick={openPasswordReset} className={`text-base font-medium ${s.link}`}>
                    비밀번호 찾기
                  </button>
                </motion.div>

                <motion.div variants={reduce ? undefined : formItem}>
                  <motion.div whileHover={reduce ? undefined : { y: -2 }} whileTap={reduce ? undefined : { scale: 0.985 }}>
                    <Button type="submit" size="lg" className="h-12 min-h-[3rem] w-full gap-2 text-base font-semibold">
                      로그인
                      <ArrowRight className="size-5" />
                    </Button>
                  </motion.div>
                </motion.div>
              </motion.form>

              <div className="mt-7 text-center">
                <p className={`text-base ${s.subheading}`}>
                  아직 계정이 없으신가요?{" "}
                  <Link to="/signup" className={`font-semibold ${s.link}`}>
                    회원가입
                  </Link>
                </p>
              </div>

              <div className="my-7 flex items-center gap-4">
                <div className={`h-px flex-1 ${s.divider}`} />
                <span className={`text-xs font-semibold uppercase tracking-widest ${s.muted}`}>또는</span>
                <div className={`h-px flex-1 ${s.divider}`} />
              </div>

              <div className="space-y-3">
                <motion.div whileHover={reduce ? undefined : { y: -2 }} whileTap={reduce ? undefined : { scale: 0.99 }}>
                  <Button
                    type="button"
                    variant="outline"
                    size="lg"
                    className="h-12 min-h-[3rem] w-full gap-2 text-base"
                    onClick={() => startSocialLogin("Google")}
                  >
                    <svg className="h-5 w-5" viewBox="0 0 24 24" aria-hidden="true">
                      <path
                        fill="#4285F4"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    Google로 계속하기
                  </Button>
                </motion.div>

                <motion.button
                  type="button"
                  onClick={() => startSocialLogin("카카오")}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.99 }}
                  className="flex h-12 min-h-[3rem] w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-4 text-base font-semibold text-[#2D2A26] shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#FDD835]"
                >
                  <img src={kakaoTalkLogo} alt="" className="h-6 w-6 rounded-[6px]" />
                  카카오로 계속하기
                </motion.button>
              </div>
            </div>

            <p className={`mt-8 text-center text-sm leading-relaxed ${s.muted}`}>
              로그인함으로써{" "}
              <span className={`font-semibold ${s.link}`} title="페이지 준비 중입니다">
                이용약관
              </span>{" "}
              및{" "}
              <span className={`font-semibold ${s.link}`} title="페이지 준비 중입니다">
                개인정보처리방침
              </span>
              에 동의합니다.
            </p>
          </div>
        </motion.section>
      </main>

      <AnimatePresence>
        {isPasswordResetOpen && (
          <motion.div
            key="reset-modal"
            className={`${s.modalOverlay} items-center`}
            {...modalBackdrop}
          >
            <motion.div className={s.modalCard} {...modalPanel}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className={`mb-1 text-base font-semibold ${s.link}`}>비밀번호 재설정</p>
                  <h2 className={`font-display text-2xl font-bold ${s.modalTitle}`}>가입 이메일을 입력해주세요</h2>
                  <p className={`mt-2 text-sm ${s.modalBody}`}>가입한 이메일로 비밀번호 재설정 링크를 보내드립니다.</p>
                </div>
                <button type="button" onClick={closePasswordReset} className={s.closeButton} aria-label="비밀번호 재설정 닫기">
                  <X className="size-5" />
                </button>
              </div>

              {passwordResetSuccess && (
                <div className={`mb-4 rounded-2xl px-4 py-3 text-base font-medium ${s.successBanner}`}>{passwordResetSuccess}</div>
              )}

              <form onSubmit={handlePasswordReset} noValidate className="space-y-4">
                <div>
                  <label htmlFor="reset-login-id" className={s.label}>
                    이메일
                  </label>
                  <div className="relative">
                    <Mail className={`pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 ${s.iconInput}`} />
                    <input
                      id="reset-login-id"
                      type="email"
                      value={passwordResetForm.loginId}
                      onChange={(e) => handlePasswordResetFieldChange("loginId", e.target.value)}
                      className={s.input(Boolean(passwordResetErrors.loginId))}
                      placeholder="your@email.com"
                    />
                  </div>
                  {passwordResetErrors.loginId && (
                    <p className={`mt-2 ${s.errorText}`}>{passwordResetErrors.loginId}</p>
                  )}
                </div>

                {passwordResetErrors.form && <p className={s.errorBanner}>{passwordResetErrors.form}</p>}

                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={closePasswordReset} className={s.ghostButton}>
                    닫기
                  </button>
                  <button
                    type="submit"
                    disabled={isPasswordResetSubmitting}
                    className={`h-12 min-h-[3rem] flex-1 ${s.primaryButton}`}
                  >
                    {isPasswordResetSubmitting ? "전송 중..." : "재설정 메일 받기"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {pendingSocialProvider && (
          <motion.div key="social-modal" className={`${s.modalOverlay} items-center`} {...modalBackdrop}>
            <motion.div className={s.modalCard} {...modalPanel}>
              <div className="mb-5 flex items-start justify-between gap-4">
                <div>
                  <p className={`mb-1 flex items-center gap-2 text-base font-semibold ${s.link}`}>
                    {pendingSocialProvider === "카카오" && (
                      <img src={kakaoTalkLogo} alt="" className="h-5 w-5 rounded-[5px]" />
                    )}
                    {pendingSocialProvider} 로그인
                  </p>
                  <h2 className={`font-display text-2xl font-bold ${s.modalTitle}`}>어떤 역할로 시작할까요?</h2>
                  <p className={`mt-2 text-sm ${s.modalBody}`}>
                    최초 소셜 가입 시 선택한 역할이 저장됩니다. 기존 계정이면 저장된 역할로 로그인됩니다.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPendingSocialProvider(null)}
                  className={s.closeButton}
                  aria-label="역할 선택 닫기"
                >
                  <X className="size-5" />
                </button>
              </div>

              <div className="grid gap-3">
                <motion.button
                  type="button"
                  onClick={() => completeSocialLogin("designer")}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.99 }}
                  className={roleCardDesigner}
                >
                  <div className="mb-3 inline-flex rounded-xl bg-[#00C9A7] p-2 text-[#0F0F0F]">
                    <Palette className="size-5" />
                  </div>
                  <div className={`text-base font-semibold ${s.modalTitle}`}>디자이너</div>
                  <p className={`mt-1 text-sm ${s.modalBody}`}>작업물을 올리고 프로젝트 제안을 받습니다.</p>
                </motion.button>
                <motion.button
                  type="button"
                  onClick={() => completeSocialLogin("client")}
                  whileHover={reduce ? undefined : { y: -2 }}
                  whileTap={reduce ? undefined : { scale: 0.99 }}
                  className={roleCardClient}
                >
                  <div className="mb-3 inline-flex rounded-xl bg-[#FF5C3A] p-2 text-white">
                    <Building2 className="size-5" />
                  </div>
                  <div className={`text-base font-semibold ${s.modalTitle}`}>클라이언트</div>
                  <p className={`mt-1 text-sm ${s.modalBody}`}>디자이너를 찾고 프로젝트를 의뢰합니다.</p>
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthPageShell>
  );
}
