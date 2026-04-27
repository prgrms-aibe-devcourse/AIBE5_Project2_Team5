const AUTH_STORAGE_KEY = "pickxel:isLoggedIn";
const CURRENT_USER_STORAGE_KEY = "pickxel:currentUser";
const ACCESS_TOKEN_STORAGE_KEY = "pickxel:accessToken";
const REFRESH_TOKEN_STORAGE_KEY = "pickxel:refreshToken";
const CURRENT_USER_CHANGE_EVENT = "pickxel:current-user-change";

export type UserRole = "designer" | "client";

export type CurrentUser = {
  userId?: number;
  name: string;
  nickname: string;
  email: string;
  role: UserRole;
  profileImage?: string | null;
};

function dispatchCurrentUserChange() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(CURRENT_USER_CHANGE_EVENT));
}

type JwtPayload = {
  userId?: number | string;
  loginId?: string;
  name?: string;
  nickname?: string;
  role?: string;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) {
      return null;
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    const paddedPayload = normalizedPayload.padEnd(
      normalizedPayload.length + ((4 - (normalizedPayload.length % 4)) % 4),
      "="
    );

    return JSON.parse(window.atob(paddedPayload)) as JwtPayload;
  } catch {
    return null;
  }
}

function getCurrentUserFromAccessToken(accessToken: string | null): CurrentUser | null {
  if (!accessToken) {
    return null;
  }

  const payload = decodeJwtPayload(accessToken);
  if (!payload) {
    return null;
  }

  const role =
    payload.role === "DESIGNER"
      ? "designer"
      : payload.role === "CLIENT"
        ? "client"
        : null;

  if (!role || typeof payload.name !== "string") {
    return null;
  }

  const numericUserId =
    typeof payload.userId === "number"
      ? payload.userId
      : typeof payload.userId === "string" && payload.userId.trim()
        ? Number(payload.userId)
        : undefined;

  return {
    userId: Number.isFinite(numericUserId) ? Number(numericUserId) : undefined,
    name: payload.name,
    nickname: typeof payload.nickname === "string" ? payload.nickname : payload.name,
    email: typeof payload.loginId === "string" ? payload.loginId : "",
    role,
    profileImage: undefined,
  };
}

function getActiveStorage() {
  if (typeof window === "undefined") {
    return null;
  }

  const hasSessionAuth =
    window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "true" ||
    Boolean(window.sessionStorage.getItem(ACCESS_TOKEN_STORAGE_KEY));
  if (hasSessionAuth) {
    return window.sessionStorage;
  }

  const hasLocalAuth =
    window.localStorage.getItem(AUTH_STORAGE_KEY) === "true" ||
    Boolean(window.localStorage.getItem(ACCESS_TOKEN_STORAGE_KEY));
  if (hasLocalAuth) {
    return window.localStorage;
  }

  return window.localStorage;
}

export function isAuthenticated() {
  if (typeof window === "undefined") {
    return false;
  }

  const hasAuthFlag =
    window.localStorage.getItem(AUTH_STORAGE_KEY) === "true" ||
    window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "true";

  return hasAuthFlag && Boolean(getAccessToken());
}

export function setAuthenticated(remember = true) {
  if (typeof window === "undefined") {
    return;
  }

  if (remember) {
    window.localStorage.setItem(AUTH_STORAGE_KEY, "true");
    window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.setItem(AUTH_STORAGE_KEY, "true");
}

export function setAuthTokens(accessToken: string, refreshToken = "", remember = true) {
  if (typeof window === "undefined") {
    return;
  }

  const targetStorage = remember ? window.localStorage : window.sessionStorage;
  const otherStorage = remember ? window.sessionStorage : window.localStorage;

  targetStorage.setItem(ACCESS_TOKEN_STORAGE_KEY, accessToken);
  if (refreshToken) {
    targetStorage.setItem(REFRESH_TOKEN_STORAGE_KEY, refreshToken);
  } else {
    targetStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  }

  otherStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  otherStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  otherStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  dispatchCurrentUserChange();
}

export function getAccessToken() {
  if (typeof window === "undefined") {
    return null;
  }

  const activeStorage = getActiveStorage();
  if (!activeStorage) {
    return null;
  }

  return activeStorage.getItem(ACCESS_TOKEN_STORAGE_KEY);
}

export function getAuthHeaders() {
  const accessToken = getAccessToken();
  return accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
}

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const activeStorage = getActiveStorage();
  const accessToken = activeStorage?.getItem(ACCESS_TOKEN_STORAGE_KEY) ?? null;
  const storedUser = activeStorage?.getItem(CURRENT_USER_STORAGE_KEY);
  if (!storedUser) {
    return getCurrentUserFromAccessToken(accessToken);
  }

  try {
    const parsedUser = JSON.parse(storedUser);
    if (
      typeof parsedUser?.name === "string" &&
      typeof parsedUser?.email === "string" &&
      (parsedUser?.role === "designer" || parsedUser?.role === "client")
    ) {
      return {
        userId: typeof parsedUser?.userId === "number" ? parsedUser.userId : undefined,
        name: parsedUser.name,
        nickname: typeof parsedUser?.nickname === "string" ? parsedUser.nickname : parsedUser.name,
        email: parsedUser.email,
        role: parsedUser.role,
        profileImage:
          typeof parsedUser?.profileImage === "string" || parsedUser?.profileImage === null
            ? parsedUser.profileImage
            : undefined,
        };
      }
  } catch {
    return getCurrentUserFromAccessToken(accessToken);
  }

  return getCurrentUserFromAccessToken(accessToken);
}

export function setCurrentUser(user: CurrentUser) {
  if (typeof window === "undefined") {
    return;
  }

  const activeStorage = getActiveStorage();
  const otherStorage =
    activeStorage === window.localStorage ? window.sessionStorage : window.localStorage;

  activeStorage?.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
  otherStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  dispatchCurrentUserChange();
}

export function subscribeCurrentUser(listener: () => void) {
  if (typeof window === "undefined") {
    return () => {};
  }

  const handleStorage = (event: StorageEvent) => {
    if (
      event.key === CURRENT_USER_STORAGE_KEY ||
      event.key === ACCESS_TOKEN_STORAGE_KEY ||
      event.key === AUTH_STORAGE_KEY
    ) {
      listener();
    }
  };

  window.addEventListener(CURRENT_USER_CHANGE_EVENT, listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    window.removeEventListener(CURRENT_USER_CHANGE_EVENT, listener);
    window.removeEventListener("storage", handleStorage);
  };
}

export function getCurrentUserRole(defaultRole: UserRole = "designer") {
  return getCurrentUser()?.role ?? defaultRole;
}

export function clearAuthenticated() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.localStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  window.localStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.localStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(CURRENT_USER_STORAGE_KEY);
  window.sessionStorage.removeItem(ACCESS_TOKEN_STORAGE_KEY);
  window.sessionStorage.removeItem(REFRESH_TOKEN_STORAGE_KEY);
  dispatchCurrentUserChange();
}
