import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { motion, useReducedMotion } from "motion/react";
import { clearAuthenticated, setAuthenticated, setAuthTokens, setCurrentUser, type UserRole } from "../utils/auth";
import { PickxelLogo } from "../components/PickxelLogo";
import { AuthPageShell } from "../components/auth/AuthPageShell";
import { useAuthSurface } from "../components/auth/useAuthSurface";

function normalizeRedirectTo(value: string | null) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/feed";
  }
  return value;
}

function normalizeRole(value: string | null): UserRole {
  return value?.toLowerCase() === "client" ? "client" : "designer";
}

function shouldContinueToKakaoSignup(provider: string | null, error: string) {
  return provider?.toLowerCase() === "kakao" && error.includes("Kakao") && error.includes("회원가입");
}

export default function OAuth2Redirect() {
  const s = useAuthSurface();
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [errorMessage, setErrorMessage] = useState("");
  const providerName = searchParams.get("provider") ?? "소셜";

  useEffect(() => {
    const error = searchParams.get("error");
    if (error) {
      if (shouldContinueToKakaoSignup(searchParams.get("provider"), error)) {
        navigate("/signup?social=kakao&mode=signup", {
          replace: true,
          state: { message: "카카오 회원가입을 먼저 진행해주세요." },
        });
        return;
      }
      setErrorMessage(error);
      return;
    }

    const accessToken = searchParams.get("accessToken");
    const refreshToken = searchParams.get("refreshToken") ?? "";
    const loginId = searchParams.get("loginId");
    const userId = Number(searchParams.get("userId"));
    const name = searchParams.get("name");
    const nickname = searchParams.get("nickname");
    const role = normalizeRole(searchParams.get("role"));
    const profileImage = searchParams.get("profileImage");

    if (!accessToken || !loginId || !name || !nickname) {
      setErrorMessage("소셜 로그인 정보를 확인할 수 없습니다.");
      return;
    }

    clearAuthenticated();
    setAuthTokens(accessToken, refreshToken, true);
    setCurrentUser({
      userId: Number.isFinite(userId) ? userId : undefined,
      name,
      nickname,
      email: loginId,
      role,
      profileImage,
    });
    setAuthenticated(true);
    navigate(normalizeRedirectTo(searchParams.get("redirectTo")), { replace: true });
  }, [navigate, searchParams]);

  return (
    <AuthPageShell>
      <main className="relative mx-auto flex min-h-[calc(100vh-5rem)] max-w-md flex-col items-center justify-center px-4 pb-20 pt-6 sm:px-6">
        <div className="mb-10 w-full">
          <PickxelLogo dark={s.isNight} />
        </div>

        <section className={`w-full p-8 text-center ${s.card}`}>
          {errorMessage ? (
            <>
              <p className={`mb-2 text-base font-semibold ${s.errorText}`}>{providerName} 로그인 실패</p>
              <h1 className={`font-display text-2xl font-bold ${s.heading}`}>다시 로그인해주세요</h1>
              <p className={`mt-3 text-sm ${s.subheading}`}>{errorMessage}</p>
              <Link
                to="/login"
                className={`mt-8 inline-flex h-12 min-h-[3rem] items-center justify-center rounded-xl px-6 ${s.primaryButton}`}
              >
                로그인으로 돌아가기
              </Link>
            </>
          ) : (
            <>
              <p className={`mb-2 text-base font-semibold ${s.link}`}>소셜 로그인</p>
              <h1 className={`font-display text-2xl font-bold ${s.heading}`}>로그인 처리 중입니다</h1>
              <p className={`mt-3 text-sm ${s.subheading}`}>잠시만 기다려주세요.</p>
              <div className="mt-8 flex justify-center">
                <motion.div
                  className="size-12 rounded-full border-2 border-[#00C9A7]/30 border-t-[#00C9A7]"
                  animate={reduce ? { opacity: [0.55, 1, 0.55] } : { rotate: 360 }}
                  transition={
                    reduce
                      ? { duration: 1.4, repeat: Infinity, ease: "easeInOut" }
                      : { duration: 0.9, repeat: Infinity, ease: "linear" }
                  }
                  aria-hidden
                />
              </div>
            </>
          )}
        </section>
      </main>
    </AuthPageShell>
  );
}
