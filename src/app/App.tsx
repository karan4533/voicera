import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { AgentProvider } from "./context/AgentContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginScreen } from "./components/LoginScreen";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LiveCallsPage } from "./pages/LiveCallsPage";
import { CallRemindersPage } from "./pages/CallRemindersPage";
import { AgentsPage } from "./pages/AgentsPage";
import { CustomizePage } from "./pages/CustomizePage";
import { useAuth } from "./context/AuthContext";

/** Redirects already-authenticated users away from the login page. */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <AgentProvider>
        <BrowserRouter>
          <Routes>
            <Route
              path="/login"
              element={
                <GuestRoute>
                  <LoginScreen />
                </GuestRoute>
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              {/* Default → Dashboard & Analytics */}
              <Route index element={<DashboardPage />} />

              {/* New pages */}
              <Route path="agents" element={<AgentsPage />} />
              <Route path="customize" element={<CustomizePage />} />

              {/* Existing pages */}
              <Route path="call-reminders" element={<CallRemindersPage />} />
              <Route path="live-calls" element={<LiveCallsPage />} />

              {/* Legacy redirects — keep old URLs working */}
              <Route path="monitoring" element={<Navigate to="/dashboard" replace />} />
              <Route path="analytics" element={<Navigate to="/dashboard" replace />} />
              <Route path="settings" element={<CustomizePage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AgentProvider>
    </AuthProvider>
  );
}
