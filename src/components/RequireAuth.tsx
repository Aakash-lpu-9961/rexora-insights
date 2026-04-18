import { type ReactNode, useEffect } from "react";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useLocation, useNavigate } from "@tanstack/react-router";

export function RequireAuth({ children }: { children: ReactNode }) {
  const { isAuthenticated, initializing } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (initializing) return;
    if (isAuthenticated) return;
    // Don't redirect from /login back to /login — the router is mid-transition
    // after sign-out and we briefly still render inside AppShell/RequireAuth.
    if (location.pathname === "/login") return;
    // Preserve query string so post-login lands back on same filter/page state.
    // Pile-up from nested `/login?redirect=/login?…` is prevented separately by
    // validateSearch in src/routes/login.tsx.
    void navigate({
      to: "/login",
      search: { redirect: location.pathname + (location.searchStr || "") },
    });
  }, [isAuthenticated, initializing, navigate, location.pathname, location.searchStr]);

  if (initializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-sm text-muted-foreground">
        Redirecting to sign in…
      </div>
    );
  }
  return <>{children}</>;
}
