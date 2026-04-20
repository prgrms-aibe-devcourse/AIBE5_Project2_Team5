import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router";
import { setAuthenticated, setAuthTokens, setCurrentUser, type UserRole } from "../utils/auth";

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
    const name = searchParams.get("name");
    const nickname = searchParams.get("nickname");
    const role = normalizeRole(searchParams.get("role"));

    if (!accessToken || !loginId || !name || !nickname) {
      setErrorMessage("소셜 로그인 정보를 확인할 수 없습니다.");
      return;
    }

    setAuthTokens(accessToken, refreshToken, true);
    setCurrentUser({
      name,
      nickname,
      email: loginId,
      role,
    });
    setAuthenticated(true);
    navigate(normalizeRedirectTo(searchParams.get("redirectTo")), { replace: true });
  }, [navigate, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#F7F7F5] px-6 text-[#0F0F0F]">
      <section className="w-full max-w-md rounded-lg bg-white p-8 text-center shadow-xl">
        {errorMessage ? (
          <>
            <p className="mb-2 text-sm font-semibold text-[#FF5C3A]">{providerName} 로그인 실패</p>
            <h1 className="text-2xl font-bold">다시 로그인해주세요</h1>
            <p className="mt-3 text-sm text-gray-600">{errorMessage}</p>
            <Link
              to="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#00C9A7] px-5 text-sm font-semibold text-[#0F0F0F] transition-colors hover:bg-[#00A88C]"
            >
              로그인으로 돌아가기
            </Link>
          </>
        ) : (
          <>
            <p className="mb-2 text-sm font-semibold text-[#00A88C]">소셜 로그인</p>
            <h1 className="text-2xl font-bold">로그인 처리 중입니다</h1>
            <p className="mt-3 text-sm text-gray-600">잠시만 기다려주세요.</p>
          </>
        )}
      </section>
    </main>
  );
}
