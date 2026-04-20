import { apiRequest, publicApiRequest } from "./apiClient";

type AuthRole = "CLIENT" | "DESIGNER";

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

export async function getMeApi() {
  return apiRequest<CurrentUserResponse>("/api/auth/me", {}, "Failed to load current user.");
}

export async function resetPasswordApi(params: {
  loginId: string;
  name: string;
  nickname: string;
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
