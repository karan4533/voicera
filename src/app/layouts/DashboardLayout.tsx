import { useEffect, useState, useCallback } from "react";
import { Outlet, NavLink, useNavigate } from "react-router";
import {
  LayoutDashboard, Phone, BarChart2, BookOpen, Send, Settings, HelpCircle, ChevronDown, Bell, Menu, X, LogOut,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAgent, AGENTS } from "../context/AgentContext";
import { getSystemHealth } from "../lib/api";
import heuristicLabsLogo from "../../assets/heuristic-labs-logo.png";

const navItems = [
  { icon: LayoutDashboard, label: "Overview", path: "/dashboard" },
  { icon: Phone, label: "Live Calls", path: "/dashboard/live-calls" },
  { icon: BarChart2, label: "Analytics", path: "/dashboard/analytics" },
];

function NavItem({ icon: Icon, label, path, end, onNavigate }: {
  icon: typeof Phone; label: string; path: string; end?: boolean; onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={path}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 h-10 px-[18px] border-none border-l-[3px] text-[13px] no-underline w-full transition-colors ${
          isActive
            ? "border-l-white bg-white/20 text-white font-semibold"
            : "border-l-transparent text-white/70 font-normal hover:bg-white/10"
        }`
      }
    >
      <Icon size={16} />
      {label}
    </NavLink>
  );
}

export function DashboardLayout() {
  const { session, logout } = useAuth();
  const { agent, agentLabel, setAgent } = useAgent();
  const navigate = useNavigate();
  const [health, setHealth] = useState({ status: "healthy", activeCalls: 0, avgLatency: 420 });
  const [agentOpen, setAgentOpen] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  useEffect(() => {
    const load = () => getSystemHealth().then(setHealth);
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, []);

  // Close agent dropdown on outside click
  useEffect(() => {
    const close = () => setAgentOpen(false);
    if (agentOpen) document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, [agentOpen]);

  // Close sidebar on Escape key
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      setSidebarOpen(false);
      setLogoutConfirm(false);
    }
  }, []);

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const closeSidebar = () => setSidebarOpen(false);

  const sidebar = (
    <>
      <div className="flex items-center gap-2 px-5 py-5">
        <img src={heuristicLabsLogo} alt="Voicera" className="h-[30px] w-[30px] object-contain shrink-0" />
        <span className="font-[Georgia,serif] text-lg font-bold italic" style={{ color: "#1E1A14" }}>
          Voicera
        </span>
        <button
          type="button"
          onClick={closeSidebar}
          className="ml-auto flex h-9 w-9 items-center justify-center rounded-lg border border-white/30 bg-white/15 lg:hidden cursor-pointer"
          aria-label="Close menu"
        >
          <X size={18} color="white" />
        </button>
      </div>

      <nav className="mt-1 flex flex-1 flex-col">
        {navItems.map(({ icon, label, path }) => (
          <NavItem
            key={path}
            icon={icon}
            label={label}
            path={path}
            end={path === "/dashboard"}
            onNavigate={closeSidebar}
          />
        ))}
      </nav>

      <div className="border-t border-white/25">
        <button className="flex h-10 w-full items-center gap-2 border-none bg-transparent px-[18px] text-white/70 cursor-pointer text-xs hover:text-white transition-colors">
          <HelpCircle size={15} />
          Help &amp; Support
        </button>

        {/* User info row — display only */}
        <div className="flex h-12 w-full items-center gap-2 px-[18px]">
          <div className="h-[30px] w-[30px] shrink-0 rounded-full bg-white/25 flex items-center justify-center">
            <span className="text-[11px] font-bold text-white/80 uppercase">
              {session?.user.name?.[0] ?? "A"}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <span className="text-xs font-semibold text-white">
              {session?.user.name ?? "Admin User"}
            </span>
            <span className="max-w-[110px] truncate text-[11px] text-white/65">
              {session?.user.email ?? "admin@voicera.ai"}
            </span>
          </div>
          {/* Separate, clearly-labelled logout button */}
          <button
            type="button"
            onClick={() => setLogoutConfirm(true)}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border-none"
          >
            <LogOut size={13} color="rgba(255,255,255,0.75)" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#F9F9F7] font-[Inter,sans-serif]">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden={true}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[220px] flex-col transition-transform duration-200 lg:static lg:z-auto lg:min-w-[200px] lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#B8946A", borderRight: "1px solid rgba(255,255,255,0.15)" }}
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="shrink-0 border-b border-[#E2DDD5] bg-white px-4 py-2.5 sm:px-6 lg:h-14 lg:py-0">
          <div className="flex flex-col gap-2.5 lg:h-14 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-[#E2DDD5] bg-white lg:hidden cursor-pointer"
                aria-label="Open menu"
              >
                <Menu size={18} color="#7A746C" />
              </button>
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2">
                  <span className="text-[13px] font-medium text-[#7A746C]">Agent:</span>
                  <button
                    type="button"
                    onClick={() => setAgentOpen(!agentOpen)}
                    className="flex max-w-[180px] items-center gap-1.5 rounded-md border border-[#E2DDD5] bg-[#F9F9F7] px-2.5 py-1.5 text-[13px] font-medium text-[#1E1A14] cursor-pointer sm:max-w-none"
                  >
                    <span className="truncate">{agentLabel}</span>
                    <ChevronDown size={14} className="shrink-0 text-[#7A746C]" />
                  </button>
                </div>
                {agentOpen && (
                  <div className="absolute left-0 top-full z-50 mt-1 min-w-[200px] rounded-lg border border-[#E2DDD5] bg-white shadow-lg sm:left-12">
                    {AGENTS.map((a) => (
                      <button
                        key={a.id}
                        type="button"
                        onClick={() => { setAgent(a.id); setAgentOpen(false); }}
                        className={`block w-full border-none px-3.5 py-2.5 text-left text-[13px] cursor-pointer first:rounded-t-lg last:rounded-b-lg ${
                          agent === a.id ? "bg-[#FDF3E3] font-semibold text-[#C8872A]" : "bg-white font-normal text-[#1E1A14] hover:bg-[#F9F9F7]"
                        }`}
                      >
                        {a.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between gap-4 sm:justify-end sm:gap-6">
              <div className="flex shrink-0 flex-col items-center">
                <span className="mb-0.5 text-[10px] text-[#9E9890]">System Health</span>
                <div className="flex items-center gap-1.5">
                  <div className={`h-[7px] w-[7px] rounded-full ${health.status === "healthy" ? "bg-[#22C55E]" : "bg-[#F59E0B]"}`} />
                  <span className="text-[13px] font-semibold text-[#1E1A14]">
                    {health.status === "healthy" ? "Healthy" : "Degraded"}
                  </span>
                </div>
              </div>
              <div className="flex shrink-0 flex-col items-center">
                <span className="mb-0.5 text-[10px] text-[#9E9890]">Active Calls</span>
                <span className="text-lg font-bold leading-none text-[#1E1A14]">{health.activeCalls}</span>
              </div>
              <div className="flex shrink-0 flex-col items-center">
                <span className="mb-0.5 text-[10px] text-[#9E9890]">Avg Latency</span>
                <span className="text-lg font-bold leading-none text-[#1E1A14]">{health.avgLatency} ms</span>
              </div>
              <button
                type="button"
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[#E2DDD5] bg-white cursor-pointer"
                aria-label="Notifications"
              >
                <Bell size={16} className="text-[#7A746C]" />
              </button>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-7">
          <Outlet />
        </main>
      </div>

      {/* Logout confirmation dialog */}
      {logoutConfirm && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40"
          onClick={() => setLogoutConfirm(false)}
          aria-hidden={true}
        >
          <div
            className="w-[320px] rounded-xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Confirm sign out"
          >
            <h2 className="m-0 mb-2 text-base font-bold text-[#1E1A14]">Sign out?</h2>
            <p className="m-0 mb-5 text-[13px] text-[#7A746C]">
              You will be returned to the login page.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                type="button"
                onClick={() => setLogoutConfirm(false)}
                className="h-9 rounded-lg border border-[#E2DDD5] bg-white px-4 text-[13px] font-medium text-[#1E1A14] cursor-pointer hover:bg-[#F9F9F7] transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                id="confirm-logout"
                onClick={handleLogout}
                className="h-9 rounded-lg border-none bg-[#DC2626] px-4 text-[13px] font-semibold text-white cursor-pointer hover:bg-[#B91C1C] transition-colors"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
