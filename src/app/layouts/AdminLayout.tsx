import { useState, useCallback, useEffect } from "react";
import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router";
import {
  LayoutDashboard, Users, Package,
  Activity, LogOut, X, Menu, Shield, HelpCircle, KeyRound,
  PanelLeftClose, PanelLeftOpen, BarChart3,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { NotificationBell } from "../components/NotificationBell";
import { HeaderProfile } from "../components/HeaderProfile";
import { ConfirmDialog } from "../components/shared/UiKit";
import heuristicLabsLogoLight from "../../assets/heuristic-labs-logo-light.png";

const SIDEBAR_COLLAPSE_KEY = "voicera_admin_sidebar_collapsed";

const adminNavItems = [
  { icon: LayoutDashboard, label: "Overview",              path: "/admin" },
  { icon: Users,           label: "Tenant Management",     path: "/admin/customers" },
  { icon: Package,         label: "Purchased Agents",      path: "/admin/subscriptions" },
  { icon: BarChart3,       label: "Platform Analytics",    path: "/admin/analytics" },
  { icon: Activity,        label: "System Health",         path: "/admin/system-health" },
  { icon: KeyRound,        label: "Security",              path: "/admin/security" },
];

function AdminNavItem({
  icon: Icon, label, path, end, onNavigate, collapsed,
}: {
  icon: typeof Shield; label: string; path: string; end?: boolean; onNavigate?: () => void; collapsed?: boolean;
}) {
  return (
    <NavLink
      to={path}
      end={end}
      onClick={onNavigate}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `vo-nav-link flex items-center ${collapsed ? "justify-center px-0" : "gap-2.5 px-[18px]"} min-h-10 h-10 border-l-[3px] text-[13px] no-underline w-full ${
          isActive
            ? "border-l-white/90 bg-white/15 text-white font-semibold"
            : "border-l-transparent text-white/65 font-normal hover:bg-white/10 hover:text-white/90"
        }`
      }
    >
      <Icon size={15} className="shrink-0" />
      {!collapsed && label}
    </NavLink>
  );
}

function pageTitle(pathname: string): string {
  const hit = adminNavItems.find((n) => n.path === pathname);
  return hit?.label ?? "Admin Console";
}

export function AdminLayout() {
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [logoutConfirm, setLogoutConfirm] = useState(false);

  const toggleCollapsed = useCallback(() => {
    setSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem(SIDEBAR_COLLAPSE_KEY, next ? "1" : "0");
      } catch {
        // ignore
      }
      return next;
    });
  }, []);

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
  const collapsed = sidebarCollapsed;

  const renderNav = (isCollapsed: boolean, onNav?: () => void) => (
    <>
      <div className={`flex items-center gap-2 ${isCollapsed ? "justify-center px-2" : "px-5"} pt-5 pb-4`}>
        <Link
          to="/admin"
          onClick={(e) => {
            onNav?.();
            if (pathname === "/admin") {
              e.preventDefault();
              document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex min-w-0 items-center gap-3 rounded-lg no-underline px-1 py-0.5 hover:bg-white/10 transition-colors"
          aria-label="Voicera home"
          title="Voicera home"
        >
          <img
            src={heuristicLabsLogoLight}
            alt=""
            className="h-[38px] w-[38px] object-contain shrink-0"
          />
          {!isCollapsed && (
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 20, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
              Voicera
            </span>
          )}
        </Link>
        {!isCollapsed && (
          <button
            type="button"
            onClick={closeSidebar}
            className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 lg:hidden cursor-pointer border-none"
            aria-label="Close menu"
          >
            <X size={16} color="white" />
          </button>
        )}
      </div>

      {!isCollapsed ? (
        <div className="mx-[18px] mb-4 px-2 py-1.5 rounded bg-white/15">
          <div className="flex items-center gap-1.5">
            <Shield size={10} className="shrink-0" style={{ color: "rgba(255,255,255,0.7)" }} />
            <span style={{ fontSize: 9, fontWeight: 700, color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
              Platform Admin
            </span>
          </div>
        </div>
      ) : (
        <div className="mx-auto mb-3 flex h-8 w-8 items-center justify-center rounded bg-white/15" title="Platform Admin">
          <Shield size={12} color="rgba(255,255,255,0.7)" />
        </div>
      )}

      {!isCollapsed && (
        <div className="px-5 pb-2">
          <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
            Management
          </span>
        </div>
      )}

      <nav className="flex flex-1 flex-col gap-0.5 pb-2">
        {adminNavItems.map(({ icon, label, path }) => (
          <AdminNavItem
            key={path}
            icon={icon}
            label={label}
            path={path}
            end={path === "/admin"}
            onNavigate={onNav}
            collapsed={isCollapsed}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 pt-2">
        <button
          type="button"
          className={`flex h-9 w-full items-center ${isCollapsed ? "justify-center px-0" : "gap-2 px-[18px]"} border-none bg-transparent text-[12px] transition-colors cursor-pointer text-white/50 hover:text-white/80`}
          title="Help & Support"
          aria-label="Help and support"
        >
          <HelpCircle size={14} />
          {!isCollapsed && "Help & Support"}
        </button>

        <button
          type="button"
          onClick={toggleCollapsed}
          className={`hidden lg:flex h-10 w-full items-center ${isCollapsed ? "justify-center px-0" : "gap-2 px-[18px]"} border-none bg-transparent text-white/50 cursor-pointer text-[12px] hover:text-white/80 hover:bg-white/5 transition-colors`}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          {!isCollapsed && "Collapse"}
        </button>

        {!isCollapsed ? (
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
        ) : (
          <button
            type="button"
            onClick={() => setLogoutConfirm(true)}
            title="Sign out"
            aria-label="Sign out"
            className="flex h-10 w-full items-center justify-center border-none bg-transparent text-white/50 cursor-pointer hover:text-white/80 hover:bg-white/5 mb-2"
          >
            <LogOut size={15} />
          </button>
        )}
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
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[220px] flex-col transition-transform duration-200 ease-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#50381F" }}
        aria-label="Admin navigation"
      >
        {renderNav(false, closeSidebar)}
      </aside>

      <aside
        className={`hidden lg:flex h-full flex-col shrink-0 transition-[width] duration-200 ease-out ${
          collapsed ? "w-[72px]" : "w-[220px]"
        }`}
        style={{ backgroundColor: "#50381F" }}
        aria-label="Admin navigation"
      >
        {renderNav(collapsed)}
      </aside>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <header className="relative z-40 shrink-0 border-b border-[#E2DDD5] bg-white/95 backdrop-blur-sm px-4 h-14 sm:px-6">
          <div className="flex items-center justify-between w-full h-14 gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                type="button"
                onClick={() => setSidebarOpen(true)}
                className="vo-icon-btn lg:hidden"
                aria-label="Open menu"
              >
                <Menu size={18} />
              </button>
              <button
                type="button"
                onClick={toggleCollapsed}
                className="vo-icon-btn hidden lg:inline-flex"
                aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
                title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
              </button>
              <div className="hidden sm:flex items-center gap-2">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2DDD5] bg-[#F7F4EF]">
                  <Shield size={12} className="text-[#50381F]" />
                  <span className="text-[12px] font-semibold text-[#50381F]">Admin Console</span>
                </div>
              </div>
              <div className="hidden md:flex flex-col min-w-0 leading-tight">
                <span className="text-[11px] font-medium text-[#9E9890]">Platform</span>
                <span className="text-[13px] font-semibold text-[#1E1A14] truncate">
                  {pageTitle(pathname)}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-1.5" title="All systems operational">
                <div className="h-2 w-2 rounded-full bg-[#22C55E]" />
                <span className="text-[12px] font-medium hidden lg:inline text-[#7A746C]">All Systems Operational</span>
              </div>
              <NotificationBell variant="admin" />
              <HeaderProfile
                variant="admin"
                tenantName="Heuristic Labs"
                onSignOut={() => setLogoutConfirm(true)}
              />
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
