const AUTH_STORAGE_KEY = "pickxel:isLoggedIn";

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

export function clearAuthenticated() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_STORAGE_KEY);
  window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
}
