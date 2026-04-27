import { ArrowRight, Building2, CheckCircle, Eye, EyeOff, Lock, Mail, Palette, User, X } from "lucide-react";
import { Link, Navigate, useLocation, useNavigate, useSearchParams } from "react-router";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";
import { PickxelLogo } from "../components/PickxelLogo";
import { DayNightSwitch } from "../components/DayNightSwitch";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { getAuthSplitFormPanelClass } from "../components/auth/authSplitLayout";
import { AnimatedCharactersLoginHero } from "../components/ui/animated-characters-login-page";
import { Button } from "../components/ui/button";
import { cn } from "../../lib/utils";
import { useAuthSurface } from "../components/auth/useAuthSurface";
import kakaoTalkLogo from "../assets/kakao-talk-logo.png";
import { checkNicknameAvailabilityApi, getGoogleOAuthUrl, getKakaoOAuthUrl, signupApi } from "../api/authApi";
import { clearAuthenticated, isAuthenticated, type UserRole } from "../utils/auth";

const NAME_MIN_LENGTH = 2;
const NAME_MAX_LENGTH = 30;
const EMAIL_MAX_LENGTH = 30;
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

type SignupLocationState = {
  message?: string;
};

const isPasswordInRange = (password: string) =>
  password.length >= PASSWORD_MIN_LENGTH && password.length <= PASSWORD_MAX_LENGTH;
const isNameInRange = (name: string) => {
  const length = name.trim().length;
  return length >= NAME_MIN_LENGTH && length <= NAME_MAX_LENGTH;
};
const isEmailValid = (email: string) => /^\S+@\S+$/.test(email.trim());

const SIGNUP_STEP_COUNT = 7;

function getSignupStepForErrors(errors: SignupErrors): number | null {
  if (errors.name) return 0;
  if (errors.nickname) return 1;
  if (errors.email) return 2;
  if (errors.role) return 3;
  if (errors.password) return 4;
  if (errors.confirmPassword) return 5;
  if (errors.terms) return 6;
  return null;
}

export default function Signup() {
  const s = useAuthSurface();
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const openedSocialSignupRef = useRef(false);
  const locationState = location.state as SignupLocationState | null;
  const socialSignupPrompt = typeof locationState?.message === "string" ? locationState.message : "";
  const [pendingSocialProvider, setPendingSocialProvider] = useState<"Google" | "카카오" | null>(null);
  const [socialName, setSocialName] = useState("");
  const [socialNickname, setSocialNickname] = useState("");
  const [socialEmail, setSocialEmail] = useState("");
  const [socialSignupError, setSocialSignupError] = useState("");
  const [socialNicknameCheckMessage, setSocialNicknameCheckMessage] = useState("");
  const [checkedSocialNickname, setCheckedSocialNickname] = useState("");
  const [isCheckingSocialNickname, setIsCheckingSocialNickname] = useState(false);
  const [isSignupCompleteOpen, setIsSignupCompleteOpen] = useState(false);
  const [completedSignupEmail, setCompletedSignupEmail] = useState("");
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
  const [showSignupPassword, setShowSignupPassword] = useState(false);
  const [heroTextFieldFocused, setHeroTextFieldFocused] = useState(false);
  const heroFocusBlurRef = useRef(0);
  const [signupStep, setSignupStep] = useState(0);

  const handleHeroTextFocus = () => {
    window.clearTimeout(heroFocusBlurRef.current);
    setHeroTextFieldFocused(true);
  };

  const handleHeroTextBlur = () => {
    heroFocusBlurRef.current = window.setTimeout(() => setHeroTextFieldFocused(false), 120);
  };

  const handleHeroPasswordFocus = () => {
    window.clearTimeout(heroFocusBlurRef.current);
    setHeroTextFieldFocused(false);
  };

  useEffect(() => {
    if (openedSocialSignupRef.current) {
      return;
    }
    if (searchParams.get("social") !== "kakao" || searchParams.get("mode") !== "signup") {
      return;
    }

    openedSocialSignupRef.current = true;
    setSignupErrors({});
    setSocialName(formData.name.trim());
    setSocialNickname(formData.nickname.trim());
    setSocialEmail(formData.email.trim());
    setSocialSignupError("");
    setSocialNicknameCheckMessage("");
    setCheckedSocialNickname("");
    setPendingSocialProvider("카카오");
  }, [formData.email, formData.name, formData.nickname, searchParams]);

  if (isAuthenticated()) {
    return <Navigate to="/feed" replace />;
  }

  const validateSignupStep = (step: number): SignupErrors => {
    const next: SignupErrors = {};
    switch (step) {
      case 0:
        if (!formData.name.trim()) {
          next.name = "이름을 입력해주세요.";
        } else if (!isNameInRange(formData.name)) {
          next.name = "이름은 2자 이상 30자 이하로 입력해주세요.";
        }
        break;
      case 1:
        if (!formData.nickname.trim()) {
          next.nickname = "닉네임을 입력해주세요.";
        }
        break;
      case 2:
        if (!formData.email.trim()) {
          next.email = "이메일을 입력해주세요.";
        } else if (!isEmailValid(formData.email)) {
          next.email = "이메일에는 @를 포함해서 입력해주세요.";
        }
        break;
      case 3:
        if (!formData.role) {
          next.role = "역할을 선택해주세요.";
        }
        break;
      case 4:
        if (!formData.password) {
          next.password = "비밀번호를 입력해주세요.";
        } else if (!isPasswordInRange(formData.password)) {
          next.password = "비밀번호는 8자 이상 20자 이하로 입력해주세요.";
        }
        break;
      case 5:
        if (!formData.confirmPassword) {
          next.confirmPassword = "비밀번호를 한 번 더 입력해주세요.";
        } else if (!isPasswordInRange(formData.password)) {
          next.password = "비밀번호는 8자 이상 20자 이하로 입력해주세요.";
        } else if (formData.password !== formData.confirmPassword) {
          next.confirmPassword = "비밀번호가 일치하지 않습니다.";
        } else if (!isPasswordConfirmed) {
          next.confirmPassword = "비밀번호 확인 버튼을 눌러주세요.";
        }
        break;
      case 6:
        if (!agreedTerms) {
          next.terms = "이용약관과 개인정보처리방침에 동의해주세요.";
        }
        break;
      default:
        break;
    }
    return next;
  };

  const goToNextSignupStep = () => {
    const next = validateSignupStep(signupStep);
    if (Object.keys(next).length > 0) {
      setSignupErrors(next);
      return;
    }
    setSignupErrors({});
    setSignupStep((prev) => Math.min(SIGNUP_STEP_COUNT - 1, prev + 1));
  };

  const goToPrevSignupStep = () => {
    setSignupErrors({});
    setSignupStep((prev) => Math.max(0, prev - 1));
  };

  const onSignupFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (signupStep < SIGNUP_STEP_COUNT - 1) {
      goToNextSignupStep();
      return;
    }
    void handleSignup(e);
  };

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
      const jump = getSignupStepForErrors(nextErrors);
      if (jump !== null) {
        setSignupStep(jump);
      }
      return;
    }

    const selectedRole = formData.role as UserRole;
    try {
      await signupApi({
        loginId: formData.email.trim(),
        password: formData.password,
        name: formData.name.trim(),
        nickname: formData.nickname.trim(),
        role: selectedRole.toUpperCase() as "CLIENT" | "DESIGNER",
      });

      clearAuthenticated();
      setCompletedSignupEmail(formData.email.trim());
      setIsSignupCompleteOpen(true);
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
      const jump = getSignupStepForErrors(apiErrors);
      if (jump !== null) {
        setSignupStep(jump);
      }
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

  const goToLoginAfterSignup = () => {
    navigate("/login", {
      replace: true,
      state: {
        message: "회원가입이 완료되었습니다. 로그인해주세요.",
      },
    });
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
    setSignupErrors({});
    setSocialName(formData.name.trim());
    setSocialNickname(formData.nickname.trim());
    setSocialEmail(formData.email.trim());
    setSocialSignupError("");
    setSocialNicknameCheckMessage("");
    setCheckedSocialNickname("");
    setPendingSocialProvider(provider);
  };

  const handleCheckSocialNickname = async () => {
    const nickname = socialNickname.trim();
    setSocialSignupError("");
    setSocialNicknameCheckMessage("");
    setCheckedSocialNickname("");

    if (!nickname) {
      setSocialSignupError("닉네임을 입력해주세요.");
      return;
    }
    if (nickname.length > 10) {
      setSocialSignupError("닉네임은 10자 이하로 입력해주세요.");
      return;
    }

    try {
      setIsCheckingSocialNickname(true);
      const result = await checkNicknameAvailabilityApi(nickname);
      if (!result.available) {
        setSocialSignupError("이미 사용 중인 닉네임입니다.");
        return;
      }

      setCheckedSocialNickname(result.nickname);
      setSocialNicknameCheckMessage("사용 가능한 닉네임입니다.");
    } catch (error) {
      setSocialSignupError(error instanceof Error ? error.message : "닉네임 중복 확인에 실패했습니다.");
    } finally {
      setIsCheckingSocialNickname(false);
    }
  };

  const completeSocialSignup = (role: UserRole) => {
    if (!pendingSocialProvider) {
      return;
    }

    const nickname = socialNickname.trim();
    const name = socialName.trim();
    if (!name) {
      setSocialSignupError("이름을 입력해주세요.");
      return;
    }
    if (!isNameInRange(name)) {
      setSocialSignupError("이름은 2자 이상 30자 이하로 입력해주세요.");
      return;
    }
    if (!nickname) {
      setSocialSignupError("닉네임을 입력해주세요.");
      return;
    }
    if (nickname.length > 10) {
      setSocialSignupError("닉네임은 10자 이하로 입력해주세요.");
      return;
    }
    if (checkedSocialNickname !== nickname) {
      setSocialSignupError("닉네임 중복 확인을 먼저 해주세요.");
      return;
    }

    const email = socialEmail.trim();
    if (pendingSocialProvider === "카카오") {
      if (!email) {
        setSocialSignupError("카카오 회원가입에 사용할 이메일을 입력해주세요.");
        return;
      }
      if (email.length > EMAIL_MAX_LENGTH) {
        setSocialSignupError("이메일은 30자 이하로 입력해주세요.");
        return;
      }
      if (!isEmailValid(email)) {
        setSocialSignupError("이메일에 @를 포함해서 입력해주세요.");
        return;
      }
    }

    const oauthUrl = pendingSocialProvider === "카카오" ? getKakaoOAuthUrl : getGoogleOAuthUrl;
    window.location.href = oauthUrl({
      mode: "signup",
      role: role.toUpperCase() as "CLIENT" | "DESIGNER",
      name,
      nickname,
      email: pendingSocialProvider === "카카오" ? email : undefined,
      redirectTo: "/feed",
    });
  };

  const isNameLengthValid = isNameInRange(formData.name);
  const isPasswordLengthValid = isPasswordInRange(formData.password);
  const hasPassword = formData.password.length > 0;
  const progressPct = Math.min(100, Math.round(((signupStep + 1) / SIGNUP_STEP_COUNT) * 100));

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
    transition: reduce ? { duration: 0.15 } : { type: "spring" as const, stiffness: 420, damping: 32 },
  };

  return (
    <AuthPageShell variant="split">
      <main className="grid min-h-svh w-full grid-cols-1 lg:grid-cols-2">
        <div className="relative hidden min-h-0 lg:block">
          <AnimatedCharactersLoginHero
            isNight={s.isNight}
            emailFieldFocused={heroTextFieldFocused}
            password={formData.password}
            showPassword={showSignupPassword}
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
                pickxel에 오신 걸 환영해요
              </h1>
              <p className={`mt-2 text-sm sm:text-base ${s.subheading}`}>단계에 맞춰 정보를 입력해주세요.</p>
            </div>

            <div className={getAuthSplitFormPanelClass(s.isNight)}>
              <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-[#FF5C3A]/90"
                  initial={false}
                  animate={{ width: `${progressPct}%` }}
                  transition={{ type: "spring", stiffness: 200, damping: 26 }}
                />
              </div>
              <p className="mb-6 text-center text-xs font-medium text-muted-foreground">
                진행 {signupStep + 1} / {SIGNUP_STEP_COUNT}
              </p>

            <form onSubmit={onSignupFormSubmit} noValidate className="space-y-5">
              <motion.div
                key={signupStep}
                initial={reduce ? false : { opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="space-y-5"
              >
                {signupStep === 0 && (
                  <div>
                    <label htmlFor="name" className={s.label}>
                      먼저 이름을 알려주세요
                    </label>
                    <div className="relative">
                      <User className={`pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 ${s.iconInput}`} />
                      <input
                        type="text"
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        onFocus={handleHeroTextFocus}
                        onBlur={handleHeroTextBlur}
                        maxLength={NAME_MAX_LENGTH}
                        aria-invalid={Boolean(signupErrors.name)}
                        aria-describedby={signupErrors.name ? "signup-name-error" : undefined}
                        className={s.input(Boolean(signupErrors.name))}
                        placeholder="홍길동"
                      />
                    </div>
                    <div className={`mt-2 ${s.hintBox}`}>
                      <p className={formData.name.trim() && isNameLengthValid ? `font-medium ${s.link}` : ""}>
                        이름은 2자 이상 30자 이하로 입력해주세요.
                      </p>
                    </div>
                    {signupErrors.name && (
                      <p id="signup-name-error" className={`mt-2 ${s.errorText}`}>
                        {signupErrors.name}
                      </p>
                    )}
                  </div>
                )}

                {signupStep === 1 && (
                  <div>
                    <label htmlFor="nickname" className={s.label}>
                      프로필에 보일 닉네임을 정해주세요
                    </label>
                    <div className="relative">
                      <User className={`pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 ${s.iconInput}`} />
                      <input
                        type="text"
                        id="nickname"
                        name="nickname"
                        value={formData.nickname}
                        onChange={handleChange}
                        onFocus={handleHeroTextFocus}
                        onBlur={handleHeroTextBlur}
                        maxLength={10}
                        aria-invalid={Boolean(signupErrors.nickname)}
                        aria-describedby={signupErrors.nickname ? "signup-nickname-error" : undefined}
                        className={s.input(Boolean(signupErrors.nickname))}
                        placeholder="닉네임"
                      />
                    </div>
                    {signupErrors.nickname && (
                      <p id="signup-nickname-error" className={`mt-2 ${s.errorText}`}>
                        {signupErrors.nickname}
                      </p>
                    )}
                  </div>
                )}

                {signupStep === 2 && (
                  <div>
                    <label htmlFor="email" className={s.label}>
                      어디로 소식을 받을까요?
                    </label>
                    <div className="relative">
                      <Mail className={`pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 ${s.iconInput}`} />
                      <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        onFocus={handleHeroTextFocus}
                        onBlur={handleHeroTextBlur}
                        maxLength={EMAIL_MAX_LENGTH}
                        aria-invalid={Boolean(signupErrors.email)}
                        aria-describedby={signupErrors.email ? "signup-email-error" : undefined}
                        className={s.input(Boolean(signupErrors.email))}
                        placeholder="your@email.com"
                      />
                    </div>
                    {signupErrors.email && (
                      <p id="signup-email-error" className={`mt-2 ${s.errorText}`}>
                        {signupErrors.email}
                      </p>
                    )}
                    {!signupErrors.email && (
                      <p className={`mt-2 text-sm ${s.muted}`}>이메일에는 @를 포함해서 입력해주세요.</p>
                    )}
                  </div>
                )}

                {signupStep === 3 && (
                  <div>
                    <label className={s.label}>어떤 역할로 시작할까요?</label>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                            whileHover={reduce ? undefined : { y: -2 }}
                            whileTap={reduce ? undefined : { scale: 0.98 }}
                            onClick={() => handleRoleChange(role.id)}
                            className={`rounded-xl border p-4 text-left transition-all ${
                              isSelected ? s.roleCardSelected : s.roleCardIdle
                            }`}
                          >
                            <div className="mb-3 flex items-center justify-between">
                              <div className={`rounded-lg p-2 ${s.roleIconWrap(isSelected)}`}>
                                <Icon className="size-5" />
                              </div>
                              {isSelected && <CheckCircle className={`size-5 ${s.link}`} />}
                            </div>
                            <div className={`font-semibold ${s.heading}`}>{role.label}</div>
                            <p className={`mt-1 text-xs leading-relaxed ${s.muted}`}>{role.desc}</p>
                          </motion.button>
                        );
                      })}
                    </div>
                    {signupErrors.role && <p className={`mt-2 ${s.errorText}`}>{signupErrors.role}</p>}
                  </div>
                )}

                {signupStep === 4 && (
                  <div>
                    <label htmlFor="password" className={s.label}>
                      비밀번호를 만들어주세요
                    </label>
                    <div className="relative">
                      <Lock className={`pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 ${s.iconInput}`} />
                      <input
                        type={showSignupPassword ? "text" : "password"}
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        onFocus={handleHeroPasswordFocus}
                        maxLength={PASSWORD_MAX_LENGTH}
                        aria-invalid={Boolean(signupErrors.password)}
                        aria-describedby="signup-password-rule signup-password-error"
                        className={s.input(Boolean(signupErrors.password))}
                        placeholder="비밀번호"
                        autoComplete="new-password"
                      />
                      <button
                        type="button"
                        onClick={() => setShowSignupPassword((v) => !v)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                        aria-label={showSignupPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                      >
                        {showSignupPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                      </button>
                    </div>
                    <div id="signup-password-rule" className={`mt-2 ${s.hintBox}`}>
                      <p className={hasPassword && isPasswordLengthValid ? `font-medium ${s.link}` : ""}>
                        비밀번호는 8자 이상 20자 이하로 입력해주세요.
                      </p>
                    </div>
                    {signupErrors.password && (
                      <p id="signup-password-error" className={`mt-2 ${s.errorText}`}>
                        {signupErrors.password}
                      </p>
                    )}
                  </div>
                )}

                {signupStep === 5 && (
                  <div>
                    <label htmlFor="confirmPassword" className={s.label}>
                      한 번 더 확인할게요
                    </label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Lock className={`pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 ${s.iconInput}`} />
                        <input
                          type={showSignupPassword ? "text" : "password"}
                          id="confirmPassword"
                          name="confirmPassword"
                          value={formData.confirmPassword}
                          onChange={handleChange}
                          onFocus={handleHeroPasswordFocus}
                          maxLength={PASSWORD_MAX_LENGTH}
                          aria-invalid={Boolean(signupErrors.confirmPassword)}
                          aria-describedby={signupErrors.confirmPassword ? "signup-confirm-password-error" : undefined}
                          className={s.input(Boolean(signupErrors.confirmPassword))}
                          placeholder="한 번 더 입력"
                          autoComplete="new-password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSignupPassword((v) => !v)}
                          className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
                          aria-label={showSignupPassword ? "비밀번호 숨기기" : "비밀번호 표시"}
                        >
                          {showSignupPassword ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={handleConfirmPassword}
                        className={`h-12 shrink-0 rounded-xl border border-primary px-4 text-sm font-semibold transition-colors hover:bg-primary/10`}
                      >
                        확인
                      </button>
                    </div>
                    {signupErrors.confirmPassword && (
                      <p id="signup-confirm-password-error" className={`mt-2 ${s.errorText}`}>
                        {signupErrors.confirmPassword}
                      </p>
                    )}
                    {isPasswordConfirmed && !signupErrors.confirmPassword && (
                      <p className={`mt-2 text-sm font-medium ${s.link}`}>비밀번호가 일치합니다.</p>
                    )}
                  </div>
                )}

                {signupStep === 6 && (
                  <div className="space-y-5">
                    <div>
                      <label className="flex items-start gap-2">
                        <input
                          type="checkbox"
                          checked={agreedTerms}
                          onChange={(event) => handleTermsChange(event.target.checked)}
                          className="mt-1 h-4 w-4 rounded border-input text-primary focus:ring-primary"
                        />
                        <span className={`text-sm ${s.subheading}`}>
                          <span className={`font-semibold ${s.link}`} title="페이지 준비 중입니다">
                            이용약관
                          </span>{" "}
                          및{" "}
                          <span className={`font-semibold ${s.link}`} title="페이지 준비 중입니다">
                            개인정보처리방침
                          </span>
                          에 동의합니다.
                        </span>
                      </label>
                      {signupErrors.terms && <p className={`mt-2 ${s.errorText}`}>{signupErrors.terms}</p>}
                    </div>
                    {signupErrors.form && <p className={s.errorText}>{signupErrors.form}</p>}
                  </div>
                )}
              </motion.div>

              <div className="flex flex-wrap gap-3 pt-2">
                {signupStep > 0 && (
                  <Button type="button" variant="outline" className="h-12 min-h-[3rem] min-w-[5.5rem]" onClick={goToPrevSignupStep}>
                    이전
                  </Button>
                )}
                {signupStep < 6 ? (
                  <Button type="button" className="h-12 min-h-[3rem] flex-1 text-base font-semibold" onClick={goToNextSignupStep}>
                    다음
                  </Button>
                ) : (
                  <motion.button
                    type="submit"
                    whileHover={reduce ? undefined : { y: -1 }}
                    whileTap={reduce ? undefined : { scale: 0.98 }}
                    className={`flex h-12 min-h-[3rem] flex-1 items-center justify-center gap-2 ${s.primaryButton}`}
                  >
                    회원가입
                    <ArrowRight className="size-5" />
                  </motion.button>
                )}
              </div>
            </form>

            <div className="mt-7 text-center">
              <p className={`text-base ${s.subheading}`}>
                이미 계정이 있으신가요?{" "}
                <Link to="/login" className={`font-semibold ${s.link}`}>
                  로그인
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
                  onClick={() => startSocialSignup("Google")}
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
                onClick={() => startSocialSignup("카카오")}
                whileHover={reduce ? undefined : { y: -2 }}
                whileTap={reduce ? undefined : { scale: 0.99 }}
                className="flex h-12 min-h-[3rem] w-full items-center justify-center gap-3 rounded-2xl bg-[#FEE500] px-4 text-base font-semibold text-[#2D2A26] shadow-[0_10px_28px_rgba(0,0,0,0.12)] transition-colors hover:bg-[#FDD835]"
              >
                <img src={kakaoTalkLogo} alt="" className="h-6 w-6 rounded-[6px]" />
                카카오로 계속하기
              </motion.button>
            </div>
            </div>
          </div>
        </motion.section>
      </main>
      <AnimatePresence>
        {isSignupCompleteOpen && (
          <motion.div key="signup-done" className={`${s.modalOverlay} z-[60]`} {...modalBackdrop}>
            <motion.div className={`${s.modalCard} text-center`} {...modalPanel}>
            <div
              className={`mx-auto mb-5 grid size-14 place-items-center rounded-full ${
                s.isNight ? "bg-[#00C9A7]/20 text-[#7EE8D0]" : "bg-[#A8F0E4]/35 text-[#00A88C]"
              }`}
            >
              <CheckCircle className="size-8" />
            </div>
            <p className={`text-sm font-bold ${s.link}`}>회원가입 완료</p>
            <h2 className={`font-display mt-2 text-2xl font-bold ${s.modalTitle}`}>
              회원가입이 완료되었습니다
            </h2>
            <p className={`mt-3 text-sm leading-relaxed ${s.modalBody}`}>
              {completedSignupEmail ? `${completedSignupEmail} 계정으로 가입됐어요. ` : ""}
              로그인 페이지에서 다시 로그인해주세요.
            </p>
            <button
              type="button"
              onClick={goToLoginAfterSignup}
              className={`mt-6 flex h-12 min-h-[3rem] w-full items-center justify-center gap-2 font-bold ${s.primaryButton}`}
            >
              로그인하기
              <ArrowRight className="size-5" />
            </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      <AnimatePresence>
        {pendingSocialProvider && (
        <motion.div key="social-signup" className={s.modalOverlay} {...modalBackdrop}>
          <motion.div className={s.modalCard} {...modalPanel}>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className={`mb-1 flex items-center gap-2 text-base font-semibold ${s.link}`}>
                  {pendingSocialProvider === "카카오" && (
                    <img src={kakaoTalkLogo} alt="" className="h-5 w-5 rounded-[5px]" />
                  )}
                  {pendingSocialProvider} 회원가입
                </p>
                <h2 className={`font-display text-2xl font-bold ${s.modalTitle}`}>이름과 역할을 선택해주세요</h2>
                <p className={`mt-2 text-sm ${s.modalBody}`}>
                  최초 소셜 가입 시 입력한 이름과 선택한 역할이 저장됩니다.
                </p>
                {socialSignupPrompt && (
                  <p className={`mt-3 rounded-xl px-3 py-2 text-sm font-medium ${s.errorBanner}`}>
                    {socialSignupPrompt}
                  </p>
                )}
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

            <div className="mb-5">
              <label htmlFor="social-name" className={s.label}>
                이름
              </label>
              <div className="relative">
                <User className={`pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 ${s.iconInput}`} />
                <input
                  id="social-name"
                  type="text"
                  maxLength={NAME_MAX_LENGTH}
                  value={socialName}
                  onChange={(event) => {
                    setSocialName(event.target.value);
                    setSocialSignupError("");
                  }}
                  className={s.input(Boolean(socialSignupError))}
                  placeholder="2자 이상 30자 이하"
                />
              </div>
              <p className={`mb-4 mt-2 text-xs ${s.muted}`}>프로필에 표시할 실제 이름을 입력해주세요.</p>

              <label htmlFor="social-nickname" className={s.label}>
                닉네임
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <User className={`pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 ${s.iconInput}`} />
                  <input
                    id="social-nickname"
                    type="text"
                    maxLength={10}
                    value={socialNickname}
                    onChange={(event) => {
                      setSocialNickname(event.target.value);
                      setSocialSignupError("");
                      setSocialNicknameCheckMessage("");
                      setCheckedSocialNickname("");
                    }}
                    className={s.input(Boolean(socialSignupError))}
                    placeholder="10자 이하"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleCheckSocialNickname}
                  disabled={isCheckingSocialNickname}
                  className={`h-12 shrink-0 rounded-xl border border-[#00C9A7] px-4 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${
                    s.isNight
                      ? "bg-[#00C9A7]/15 text-[#7EE8D0] hover:bg-[#00C9A7]/25"
                      : "text-[#007C69] hover:bg-[#E8FFF9]"
                  }`}
                >
                  {isCheckingSocialNickname ? "확인 중" : "중복 확인"}
                </button>
              </div>
              <p className={`mt-2 text-xs ${s.muted}`}>
                {pendingSocialProvider === "카카오"
                  ? "이메일은 pickxel 계정용으로 직접 입력합니다."
                  : "이메일은 Google 계정 정보로 가져옵니다."}
              </p>
              {socialNicknameCheckMessage && !socialSignupError && (
                <p className={`mt-2 text-sm font-medium ${s.link}`}>{socialNicknameCheckMessage}</p>
              )}
              {pendingSocialProvider === "카카오" && (
                <div className="mt-4">
                  <label htmlFor="social-email" className={s.label}>
                    이메일
                  </label>
                  <div className="relative">
                    <Mail className={`pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 ${s.iconInput}`} />
                    <input
                      id="social-email"
                      type="email"
                      maxLength={EMAIL_MAX_LENGTH}
                      value={socialEmail}
                      onChange={(event) => {
                        setSocialEmail(event.target.value);
                        setSocialSignupError("");
                      }}
                      className={s.input(Boolean(socialSignupError))}
                      placeholder="your@email.com"
                    />
                  </div>
                  <p className={`mt-2 text-xs ${s.muted}`}>이메일에 @를 포함해서 입력해주세요.</p>
                </div>
              )}
              {socialSignupError && (
                <p className={`mt-2 ${s.errorText}`}>{socialSignupError}</p>
              )}
            </div>

            <div className="grid gap-3">
              <motion.button
                type="button"
                onClick={() => completeSocialSignup("designer")}
                whileHover={reduce ? undefined : { y: -2 }}
                whileTap={reduce ? undefined : { scale: 0.99 }}
                className={
                  s.isNight
                    ? "rounded-2xl border border-[#BDEFD8]/30 bg-[#00C9A7]/8 p-4 text-left transition-all hover:border-[#00C9A7]/50 hover:shadow-md"
                    : "rounded-2xl border border-[#BDEFD8] bg-[#F5FFFB] p-4 text-left transition-all hover:border-[#00C9A7] hover:shadow-md"
                }
              >
                <div className="mb-3 inline-flex rounded-xl bg-[#00C9A7] p-2 text-[#0F0F0F]">
                  <Palette className="size-5" />
                </div>
                <div className={`font-semibold ${s.modalTitle}`}>디자이너</div>
                <p className={`mt-1 text-sm ${s.modalBody}`}>
                  작업물을 공유하고 프로젝트를 만납니다.
                </p>
              </motion.button>
              <motion.button
                type="button"
                onClick={() => completeSocialSignup("client")}
                whileHover={reduce ? undefined : { y: -2 }}
                whileTap={reduce ? undefined : { scale: 0.99 }}
                className={
                  s.isNight
                    ? "rounded-2xl border border-[#FF5C3A]/25 bg-[#FF5C3A]/8 p-4 text-left transition-all hover:border-[#FF5C3A]/45 hover:shadow-md"
                    : "rounded-2xl border border-[#FFB9AA] bg-[#FFF7F4] p-4 text-left transition-all hover:border-[#FF5C3A] hover:shadow-md"
                }
              >
                <div className="mb-3 inline-flex rounded-xl bg-[#FF5C3A] p-2 text-white">
                  <Building2 className="size-5" />
                </div>
                <div className={`font-semibold ${s.modalTitle}`}>클라이언트</div>
                <p className={`mt-1 text-sm ${s.modalBody}`}>
                  감각에 맞는 디자이너를 찾고 의뢰합니다.
                </p>
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
        )}
      </AnimatePresence>
    </AuthPageShell>
  );
}
