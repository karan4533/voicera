import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import type { UserRole } from "../lib/auth";

// ── RoleRoute ─────────────────────────────────────────────────────────────────
//
// Thin wrapper that checks the authenticated user's role against an allowlist.
// Unauthenticated users are sent to /login.
// Authenticated users whose role is NOT in allowedRoles are redirected to
// the appropriate default for their role:
//   platform_admin  → /admin
//   customer_*      → /dashboard

interface RoleRouteProps {
  children: ReactNode;
  /** Roles that are permitted to render children */
  allowedRoles: UserRole[];
}

export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { session, loading } = useAuth();

  // While Firebase resolves the persisted session, render nothing to avoid flash.
  if (loading) return null;

  // Not authenticated → go to login
  if (!session) return <Navigate to="/login" replace />;

  // Role is permitted → render
  if (allowedRoles.includes(session.user.role)) {
    return <>{children}</>;
  }

  // Wrong role → redirect to the correct default home
  if (session.user.role === "platform_admin") {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}
