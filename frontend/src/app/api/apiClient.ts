import { clearAuthenticated, getAuthHeaders } from "../utils/auth";

type ApiResponse<T> = {
  success: boolean;
  message: string;
  data: T | null;
};

const API_BASE_URL = ((import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "").replace(/\/$/, "");

function buildApiUrl(path: string) {
  if (/^https?:\/\//i.test(path)) {
    return path;
  }

  if (!API_BASE_URL) {
    return path;
  }

  return path.startsWith("/") ? `${API_BASE_URL}${path}` : `${API_BASE_URL}/${path}`;
}

async function readJsonResponse<T>(response: Response, fallbackMessage: string) {
  let result: ApiResponse<T>;

  try {
    result = await response.json();
  } catch {
    throw new Error(fallbackMessage);
  }

  if (!response.ok || !result.success) {
    throw new Error(result.message || fallbackMessage);
  }

  return result.data as T;
}

function buildHeaders(options: RequestInit, withAuth: boolean) {
  const headers = new Headers(options.headers);

  if (options.body && !(options.body instanceof FormData) && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (withAuth) {
    Object.entries(getAuthHeaders()).forEach(([key, value]) => {
      headers.set(key, value);
    });
  }

  return headers;
}

export async function publicApiRequest<T>(
  path: string,
  options: RequestInit = {},
  fallbackMessage = "API request failed.",
) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: buildHeaders(options, false),
  });

  return readJsonResponse<T>(response, fallbackMessage);
}

export async function apiRequest<T>(
  path: string,
  options: RequestInit = {},
  fallbackMessage = "API request failed.",
) {
  const response = await fetch(buildApiUrl(path), {
    ...options,
    headers: buildHeaders(options, true),
  });

  if (response.status === 401) {
    clearAuthenticated();
  }

  return readJsonResponse<T>(response, fallbackMessage);
}
