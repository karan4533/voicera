const TOKEN_KEY = "vocera_jwt";
const USER_KEY = "vocera_user";

export interface AuthUser {
  email: string;
  name: string;
  role: "admin" | "operator";
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  expiresAt: number;
}

function createMockJwt(email: string): string {
  const payload = btoa(JSON.stringify({ sub: email, iat: Date.now(), exp: Date.now() + 86400000 }));
  return `eyJhbGciOiJIUzI1NiJ9.${payload}.vocera-mock-signature`;
}

function parseJwt(token: string): { exp?: number; sub?: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    return JSON.parse(atob(parts[1]));
  } catch {
    return null;
  }
}

export function login(email: string, password: string, rememberMe: boolean): AuthSession {
  if (!email || !password) {
    throw new Error("Email and password are required");
  }

  const session: AuthSession = {
    token: createMockJwt(email),
    user: {
      email,
      name: email.split("@")[0].replace(/[._]/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) || "Admin User",
      role: "admin",
    },
    expiresAt: Date.now() + 24 * 60 * 60 * 1000,
  };

  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(TOKEN_KEY, session.token);
  storage.setItem(USER_KEY, JSON.stringify(session.user));
  storage.setItem(`${TOKEN_KEY}_exp`, String(session.expiresAt));

  return session;
}

export function getSession(): AuthSession | null {
  const storage = localStorage.getItem(TOKEN_KEY) ? localStorage : sessionStorage;
  const token = storage.getItem(TOKEN_KEY);
  const userRaw = storage.getItem(USER_KEY);
  const expRaw = storage.getItem(`${TOKEN_KEY}_exp`);

  if (!token || !userRaw) return null;

  const payload = parseJwt(token);
  const expiresAt = expRaw ? Number(expRaw) : payload?.exp ?? 0;

  if (expiresAt && Date.now() > expiresAt) {
    logout();
    return null;
  }

  return {
    token,
    user: JSON.parse(userRaw) as AuthUser,
    expiresAt,
  };
}

export function logout(): void {
  [localStorage, sessionStorage].forEach((s) => {
    s.removeItem(TOKEN_KEY);
    s.removeItem(USER_KEY);
    s.removeItem(`${TOKEN_KEY}_exp`);
  });
}

export function isAuthenticated(): boolean {
  return getSession() !== null;
}
