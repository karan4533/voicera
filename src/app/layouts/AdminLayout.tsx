import { useState, useCallback, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router";
import {
  LayoutDashboard, Users, Package,
  Activity, LogOut, X, Menu, Shield, HelpCircle, KeyRound,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "../components/NotificationBell";
import { ConfirmDialog } from "../components/shared/UiKit";
import heuristicLabsLogoLight from "../../assets/heuristic-labs-logo-light.png";

// ── Admin nav items ────────────────────────────────────────────────────────────

const adminNavItems = [
  { icon: LayoutDashboard, label: "Overview",              path: "/admin" },
  { icon: Users,           label: "Tenant Management",     path: "/admin/customers" },
  { icon: Package,         label: "Purchased Agents",      path: "/admin/subscriptions" },
  { icon: Activity,        label: "System Health",         path: "/admin/system-health" },
  { icon: KeyRound,        label: "Security",              path: "/admin/security" },
];

// ── NavItem ────────────────────────────────────────────────────────────────────

function AdminNavItem({
  icon: Icon, label, path, end, onNavigate,
}: {
  icon: typeof Shield; label: string; path: string; end?: boolean; onNavigate?: () => void;
}) {
  return (
    <NavLink
      to={path}
      end={end}
      onClick={onNavigate}
      className={({ isActive }) =>
        `flex items-center gap-2.5 min-h-10 h-10 px-[18px] border-l-[3px] text-[13px] no-underline w-full transition-[background-color,color,border-color] duration-200 ${
          isActive
            ? "border-l-white/90 bg-white/15 text-white font-semibold"
            : "border-l-transparent text-white/65 font-normal hover:bg-white/10 hover:text-white/90"
        }`
      }
    >
      <Icon size={15} />
      {label}
    </NavLink>
  );
}

// ── Layout ─────────────────────────────────────────────────────────────────────

export function AdminLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);

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
      {/* Logo + brand — click returns to admin home */}
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <Link
          to="/admin"
          onClick={(e) => {
            closeSidebar();
            if (pathname === "/admin") {
              e.preventDefault();
              document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex min-w-0 items-center gap-3 rounded-lg no-underline -ml-1 px-1 py-0.5 hover:bg-white/10 transition-colors"
          aria-label="Voicera home"
        >
          <img
            src={heuristicLabsLogoLight}
            alt=""
            className="h-[38px] w-[38px] object-contain shrink-0"
          />
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 20, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
            Voicera
          </span>
        </Link>
        <button
          type="button"
          onClick={closeSidebar}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 lg:hidden cursor-pointer border-none"
          aria-label="Close menu"
        >
          <X size={16} color="white" />
        </button>
      </div>

      {/* Platform Admin badge */}
      <div className="mx-[18px] mb-4 px-2 py-1.5 rounded bg-white/15">
        <div className="flex items-center gap-1.5">
          <Shield size={10} className="shrink-0" style={{ color: "rgba(255,255,255,0.7)" }} />
          <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            Platform Admin
          </span>
        </div>
      </div>

      {/* Section label */}
      <div className="px-5 pb-2">
        <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
          Management
        </span>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 pb-2">
        {adminNavItems.map(({ icon, label, path }) => (
          <AdminNavItem
            key={path}
            icon={icon}
            label={label}
            path={path}
            end={path === "/admin"}
            onNavigate={closeSidebar}
          />
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-white/10 pt-2">
        <button className="flex h-9 w-full items-center gap-2 border-none bg-transparent px-[18px] text-[12px] transition-colors cursor-pointer text-white/50 hover:text-white/80">
          <HelpCircle size={14} />
          Help & Support
        </button>
        {/* User info */}
        <div className="flex h-14 w-full items-center gap-2.5 px-[18px] mb-1">
          <div className="h-7 w-7 shrink-0 rounded-full flex items-center justify-center bg-white/20">
            <span className="text-[11px] font-bold uppercase text-white">
              {session?.user.name?.[0] ?? "A"}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <span className="text-[12px] font-semibold truncate max-w-[110px] text-white/90">
              {session?.user.name ?? "Platform Admin"}
            </span>
            <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/15 text-white/70">
              Platform Admin
            </span>
          </div>
          <button
            type="button"
            onClick={() => setLogoutConfirm(true)}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-white/10 hover:bg-white/20 transition-colors cursor-pointer border-none"
          >
            <LogOut size={13} color="rgba(255,255,255,0.65)" />
          </button>
        </div>
      </div>
    </>
  );

  return (
    <div className="flex h-[100dvh] w-full overflow-hidden font-[Inter,sans-serif]" style={{ backgroundColor: "#F7F4EF" }}>
      <a href="#main-content" className="vo-skip">Skip to content</a>
      {sidebarOpen && (
        <div
          className="vo-overlay fixed inset-0 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden={true}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[220px] flex-col transition-transform duration-200 ease-out lg:static lg:z-auto lg:min-w-[210px] lg:translate-x-0 ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#50381F" }}
        aria-label="Admin navigation"
      >
        {sidebar}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-40 shrink-0 border-b border-[#E2DDD5] bg-white/95 backdrop-blur-sm px-4 h-14 sm:px-6">
          <div className="flex items-center justify-between w-full h-14">
            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="vo-icon-btn lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2DDD5] bg-[#F7F4EF]">
                  <Shield size={12} className="text-[#50381F]" />
                  <span className="text-[12px] font-semibold text-[#50381F]">Admin Console</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5" title="All systems operational">
                <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
                <span className="text-[12px] font-medium hidden sm:inline text-[#7A746C]">All Systems Operational</span>
              </div>
              <NotificationBell variant="admin" />
            </div>
          </div>
        </header>

        <main id="main-content" className="flex-1 overflow-auto p-4 sm:p-6 lg:p-7 vo-page" tabIndex={-1}>
          <Outlet />
        </main>
      </div>

      {logoutConfirm && (
        <ConfirmDialog
          title="Sign out?"
          description="You will be returned to the login page."
          confirmLabel="Sign out"
          danger
          confirmId="admin-confirm-logout"
          onCancel={() => setLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}
