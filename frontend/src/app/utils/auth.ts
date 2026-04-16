const AUTH_STORAGE_KEY = "pickxel:isLoggedIn";
const CURRENT_USER_STORAGE_KEY = "pickxel:currentUser";

export type UserRole = "designer" | "client";

export type CurrentUser = {
  name: string;
  email: string;
  role: UserRole;
};

export function isAuthenticated() {
  if (typeof window === "undefined") {
    return false;
  }

  return (
    window.localStorage.getItem(AUTH_STORAGE_KEY) === "true" ||
    window.sessionStorage.getItem(AUTH_STORAGE_KEY) === "true"
  );
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

export function getCurrentUser(): CurrentUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  const storedUser = window.localStorage.getItem(CURRENT_USER_STORAGE_KEY);
  if (!storedUser) return null;

  try {
    const parsedUser = JSON.parse(storedUser);
    if (
      typeof parsedUser?.name === "string" &&
      typeof parsedUser?.email === "string" &&
      (parsedUser?.role === "designer" || parsedUser?.role === "client")
    ) {
      return parsedUser;
    }
  } catch {
    return null;
  }

  return null;
}

export function setCurrentUser(user: CurrentUser) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(CURRENT_USER_STORAGE_KEY, JSON.stringify(user));
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
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
}
