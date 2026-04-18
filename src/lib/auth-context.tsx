import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { apiRequest, loadStoredAuth, storeAuth, type StoredAuth } from "./api";

type AuthState = {
  auth: StoredAuth | null;
  isAuthenticated: boolean;
  initializing: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => void;
  token: string | null;
};

const AuthCtx = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<StoredAuth | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const stored = loadStoredAuth();
    if (stored) {
      setAuth(stored);
      // validate lazily
      apiRequest("/api/auth/me", { token: stored.token })
        .catch(() => {
          setAuth(null);
          storeAuth(null);
        })
        .finally(() => setInitializing(false));
    } else {
      setInitializing(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const resp = await apiRequest<StoredAuth & { access_token: string }>("/api/auth/login", {
      method: "POST",
      body: { email, password },
    });
    const stored: StoredAuth = {
      token: resp.access_token,
      user: resp.user,
    };
    setAuth(stored);
    storeAuth(stored);
  }, []);

  const register = useCallback(async (email: string, password: string, name: string) => {
    const resp = await apiRequest<StoredAuth & { access_token: string }>("/api/auth/register", {
      method: "POST",
      body: { email, password, name },
    });
    const stored: StoredAuth = {
      token: resp.access_token,
      user: resp.user,
    };
    setAuth(stored);
    storeAuth(stored);
  }, []);

  const logout = useCallback(() => {
    setAuth(null);
    storeAuth(null);
  }, []);

  const value = useMemo<AuthState>(
    () => ({
      auth,
      isAuthenticated: !!auth?.token,
      initializing,
      login,
      register,
      logout,
      token: auth?.token ?? null,
    }),
    [auth, initializing, login, register, logout],
  );

  return <AuthCtx.Provider value={value}>{children}</AuthCtx.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthCtx);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
