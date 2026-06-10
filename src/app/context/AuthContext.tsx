import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import * as auth from "../lib/auth";
import { loginUser } from "../lib/api";

interface AuthContextValue {
  session: auth.AuthSession | null;
  login: (email: string, password: string, rememberMe: boolean) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<auth.AuthSession | null>(() => auth.getSession());

  // Re-validate session whenever the tab regains focus (handles token expiry while idle)
  useEffect(() => {
    const handleFocus = () => {
      const current = auth.getSession();
      setSession(current);
    };
    window.addEventListener("focus", handleFocus);
    return () => window.removeEventListener("focus", handleFocus);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    // Delegates to api.ts → mock-api.ts in dev, real backend in prod
    await loginUser(email, password);
    // Re-read session from storage (mock sets it directly; real backend should return a JWT)
    const s = auth.getSession();
    if (!s) throw new Error("Login succeeded but no session was created.");
    setSession(s);
  }, []);

  const logout = useCallback(() => {
    auth.logout();
    setSession(null);
  }, []);

  return (
    <AuthContext.Provider value={{ session, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
