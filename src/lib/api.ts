// Thin fetch wrapper that injects JWT and surfaces readable errors.

const DEFAULT_BASE = (() => {
  if (
    typeof window !== "undefined" &&
    (window as unknown as { __REXORA_API_URL__?: string }).__REXORA_API_URL__
  ) {
    return (window as unknown as { __REXORA_API_URL__?: string }).__REXORA_API_URL__ as string;
  }
  const env = (import.meta.env.VITE_API_URL as string | undefined) || "";
  return env || "http://localhost:8080";
})();

export const API_BASE_URL = DEFAULT_BASE.replace(/\/$/, "");

export const AUTH_STORAGE_KEY = "rexora.auth.v1";

export type StoredAuth = {
  token: string;
  user: { id: number; email: string; name: string };
};

export function loadStoredAuth(): StoredAuth | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

export function storeAuth(auth: StoredAuth | null) {
  if (typeof window === "undefined") return;
  try {
    if (auth) window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(auth));
    else window.localStorage.removeItem(AUTH_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public body?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

type Method = "GET" | "POST" | "PATCH" | "DELETE";

export async function apiRequest<T = unknown>(
  path: string,
  options: { method?: Method; body?: unknown; token?: string | null } = {},
): Promise<T> {
  const { method = "GET", body, token } = options;
  const headers: Record<string, string> = {
    Accept: "application/json",
  };
  if (body !== undefined) headers["Content-Type"] = "application/json";
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let data: unknown = null;
  const text = await res.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
  }

  if (!res.ok) {
    const detail =
      data &&
      typeof data === "object" &&
      "detail" in data &&
      typeof (data as { detail: unknown }).detail === "string"
        ? (data as { detail: string }).detail
        : `${res.status} ${res.statusText}`;
    throw new ApiError(res.status, detail, data);
  }

  return data as T;
}
