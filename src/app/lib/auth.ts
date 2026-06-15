/**
 * auth.ts — Shared auth types + synchronous session cache
 *
 * Types define the AuthSession shape used throughout the app
 * (AuthContext, api.ts, ProtectedRoute). The mock implementation
 * has been replaced by Firebase Authentication — see AuthContext.tsx
 * and firebase.ts.
 *
 * getSession() / setCachedSession() give api.ts a synchronous snapshot
 * of the current Firebase session. AuthContext keeps them in sync via
 * the onIdTokenChanged listener (fires on sign-in, sign-out, and the
 * automatic ~1 h token refresh).
 */

export interface AuthUser {
  email: string;
  name: string;
  role: "admin" | "operator";
}

export interface AuthSession {
  /** Firebase ID token — attached as Bearer by apiFetch() in api.ts */
  token: string;
  user: AuthUser;
  /** Unix timestamp (ms) when the token expires */
  expiresAt: number;
}

// ── Synchronous session cache ─────────────────────────────────────────────────
// AuthContext calls setCachedSession() whenever Firebase auth state changes,
// keeping this in sync. apiFetch() in api.ts reads it synchronously.

let _session: AuthSession | null = null;

export function getSession(): AuthSession | null {
  return _session;
}

export function setCachedSession(session: AuthSession | null): void {
  _session = session;
}
