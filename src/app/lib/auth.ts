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
 *
 * ── RBAC Roles ────────────────────────────────────────────────────────────────
 *  platform_admin  — Voicera platform owner; manages accounts & subscriptions,
 *                    no access to customer business data.
 *  customer_admin  — Tenant power user; full access to their org's purchased
 *                    agents and all associated data.
 *  customer_user   — Tenant limited user; permissions scoped by Customer Admin
 *                    (scaffolded now, fully enforced in a future phase).
 *
 * In production, `role` comes from Firebase Custom Claims set server-side.
 * During the demo/MVP phase it is derived client-side in rbac.ts.
 */

import type { AgentType } from "./types";

export type UserRole = "platform_admin" | "customer_admin" | "customer_user";

export interface AuthUser {
  email: string;
  name: string;
  role: UserRole;
  /** Tenant / organisation identifier — undefined for platform admins */
  orgId?: string;
  /** Agent type IDs the org has purchased — undefined means all (legacy / platform admin) */
  subscribedAgents?: AgentType[];
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
