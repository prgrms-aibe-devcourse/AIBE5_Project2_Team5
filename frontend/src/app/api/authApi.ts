import { apiRequest, publicApiRequest } from "./apiClient";

export type AuthRole = "CLIENT" | "DESIGNER";

const API_ORIGIN = import.meta.env.VITE_API_ORIGIN ?? "http://localhost:8080";

export type LoginResponse = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  loginId: string;
  name: string;
  nickname: string;
  role: AuthRole;
  profileImage: string | null;
};

export type SignUpResponse = {
  accessToken: string;
  refreshToken: string;
  userId: number;
  loginId: string;
  name: string;
  nickname: string;
  role: AuthRole;
};

export type CurrentUserResponse = {
  userId: number;
  loginId: string;
  name: string;
  nickname: string;
  role: AuthRole;
};

export type PasswordResetResponse = {
  loginId: string;
};

export type PasswordResetEmailResponse = {
  message: string;
};

export type NicknameCheckResponse = {
  nickname: string;
  available: boolean;
};

export async function loginApi(loginId: string, password: string) {
  return publicApiRequest<LoginResponse>(
    "/api/auth/login",
    {
      method: "POST",
      body: JSON.stringify({ loginId, password }),
    },
    "Login failed.",
  );
}

export async function signupApi(params: {
  loginId: string;
  password: string;
  name: string;
  nickname: string;
  role: AuthRole;
}) {
  return publicApiRequest<SignUpResponse>(
    "/api/auth/signup",
    {
      method: "POST",
      body: JSON.stringify(params),
    },
    "Sign up failed.",
  );
}

export async function checkNicknameAvailabilityApi(nickname: string) {
  const query = new URLSearchParams({ nickname });
  return publicApiRequest<NicknameCheckResponse>(
    `/api/auth/nickname/check?${query.toString()}`,
    {},
    "Failed to check nickname.",
  );
}

export async function getMeApi() {
  return apiRequest<CurrentUserResponse>("/api/auth/me", {}, "Failed to load current user.");
}

export async function requestPasswordResetEmailApi(loginId: string) {
  return publicApiRequest<PasswordResetEmailResponse>(
    "/api/auth/password-reset/request",
    {
      method: "POST",
      body: JSON.stringify({ loginId }),
    },
    "Failed to send password reset email.",
  );
}

export async function confirmPasswordResetApi(params: {
  token: string;
  newPassword: string;
  confirmPassword: string;
}) {
  return publicApiRequest<PasswordResetResponse>(
    "/api/auth/password-reset",
    {
      method: "POST",
      body: JSON.stringify(params),
    },
    "Failed to reset password.",
  );
}

export function getGoogleOAuthUrl(params: {
  mode: "login" | "signup";
  role: AuthRole;
  nickname?: string;
  email?: string;
  redirectTo?: string;
}) {
  return getSocialOAuthUrl("google", params);
}

export function getKakaoOAuthUrl(params: {
  mode: "login" | "signup";
  role: AuthRole;
  nickname?: string;
  email?: string;
  redirectTo?: string;
}) {
  return getSocialOAuthUrl("kakao", params);
}

function getSocialOAuthUrl(
  provider: "google" | "kakao",
  params: {
    mode: "login" | "signup";
    role: AuthRole;
    nickname?: string;
    email?: string;
    redirectTo?: string;
  },
) {
  const url = new URL(`/api/auth/oauth2/${provider}`, API_ORIGIN);
  url.searchParams.set("mode", params.mode);
  url.searchParams.set("role", params.role);
  if (params.nickname) {
    url.searchParams.set("nickname", params.nickname);
  }
  if (params.email) {
    url.searchParams.set("email", params.email);
  }
  url.searchParams.set("redirectTo", params.redirectTo ?? "/feed");
  return url.toString();
}
