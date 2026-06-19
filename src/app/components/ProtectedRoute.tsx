import type { ReactNode } from "react";
import { Navigate } from "react-router";
import { useAuth } from "../context/AuthContext";

// ── Inline spinner — shown while Firebase resolves the persisted session ──────

function FullPageSpinner() {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        backgroundColor: "#FAFAF9",
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "3px solid #E2DDD5",
          borderTopColor: "#50381F",
          animation: "spin 0.75s linear infinite",
        }}
      />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}

// ── Protected route ───────────────────────────────────────────────────────────

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { session, loading } = useAuth();

  // Wait for Firebase to resolve the persisted session before deciding whether
  // to redirect. Without this guard, a page-refresh would flash /login for
  // authenticated users while the IndexedDB credential is being read.
  if (loading) return <FullPageSpinner />;

  if (!session) return <Navigate to="/login" replace />;
  return <>{children}</>;
}
