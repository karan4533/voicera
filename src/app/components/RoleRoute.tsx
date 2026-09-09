import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { SuspendedAccountScreen } from "./SuspendedAccountScreen";
import type { UserRole } from "../lib/auth";

function FullPageSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-[#F7F4EF]" role="status" aria-label="Loading">
      <div
        className="h-9 w-9 rounded-full border-[3px] border-[#E2DDD5] border-t-[#50381F]"
        style={{ animation: "vo-spin 0.75s linear infinite" }}
      />
    </div>
  );
}

interface RoleRouteProps {
  children: ReactNode;
  allowedRoles: UserRole[];
}

export function RoleRoute({ children, allowedRoles }: RoleRouteProps) {
  const { session, loading } = useAuth();

  if (loading) return <FullPageSpinner />;

  if (!session) return <Navigate to="/login" replace />;

  if (allowedRoles.includes(session.user.role)) {
    const isCustomer = session.user.role === "customer_admin" || session.user.role === "customer_user";
    if (isCustomer && session.user.orgStatus === "suspended") {
      return <SuspendedAccountScreen />;
    }
    return <>{children}</>;
  }

  if (session.user.role === "platform_admin") {
    return <Navigate to="/admin" replace />;
  }
  return <Navigate to="/dashboard" replace />;
}
