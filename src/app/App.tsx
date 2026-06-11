import { BrowserRouter, Routes, Route, Navigate } from "react-router";
import { AuthProvider } from "./context/AuthContext";
import { AgentProvider } from "./context/AgentContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { LoginScreen } from "./components/LoginScreen";
import { DashboardLayout } from "./layouts/DashboardLayout";
import { DashboardPage } from "./pages/DashboardPage";
import { LiveCallsPage } from "./pages/LiveCallsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";
import { CallQueuePage } from "./pages/CallQueuePage";
import { CallRemindersPage } from "./pages/CallRemindersPage";
import { useAuth } from "./context/AuthContext";

/** Redirects already-authenticated users away from the login page. */
function GuestRoute({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
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
              <Route index element={<DashboardPage />} />
              <Route path="live-calls" element={<LiveCallsPage />} />
              <Route path="call-queue" element={<CallQueuePage />} />
              <Route path="call-reminders" element={<CallRemindersPage />} />
              <Route path="analytics" element={<AnalyticsPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
      </AgentProvider>
    </AuthProvider>
  );
}
