import { useEffect, useState, useCallback } from "react";
import { Outlet, NavLink, useNavigate, Link, useLocation } from "react-router";
import {
  Bot, LayoutDashboard, Library, Phone, BarChart3, Rocket,
  Megaphone, Users, Menu, X, LogOut, HelpCircle, Building2, CreditCard,
  PanelLeftClose, PanelLeftOpen,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { useAgent } from "../context/AgentContext";
import { AgentSwitcher } from "../components/AgentSwitcher";
import { NotificationBell } from "../components/NotificationBell";
import { HeaderProfile } from "../components/HeaderProfile";
import { CORE_SETUP_NAV, OPERATIONS_NAV, TENANT_ADMIN_NAV } from "../lib/workflow";
import { getSystemHealth, getFriendlyApiMessage } from "../lib/api";
import type { AgentType, SystemHealth } from "../lib/types";
import { ConfirmDialog } from "../components/shared/UiKit";
import heuristicLabsLogoLight from "../../assets/heuristic-labs-logo-light.png";

const SIDEBAR_COLLAPSE_KEY = "voicera_sidebar_collapsed";

const ICON_BY_ID: Record<string, typeof Phone> = {
  dashboard: LayoutDashboard,
  library: Library,
  configure: Rocket,
  agents: Bot,
  live: Phone,
  analytics: BarChart3,
  campaigns: Megaphone,
  team: Users,
  usage: CreditCard,
};

function NavItem({ icon: Icon, label, path, end, onNavigate, collapsed }: {
  icon: typeof Phone; label: string; path: string; end?: boolean; onNavigate?: () => void; collapsed?: boolean;
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

function SectionLabel({ children, collapsed }: { children: React.ReactNode; collapsed?: boolean }) {
  if (collapsed) {
    return <div className="mx-3 my-2 border-t border-white/10" aria-hidden />;
  }
  return (
    <div className="px-5 pt-3 pb-1.5">
      <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.4)", textTransform: "uppercase", letterSpacing: "0.1em" }}>
        {children}
      </span>
    </div>
  );
}

function pageTitle(pathname: string): string {
  const all = [...CORE_SETUP_NAV, ...OPERATIONS_NAV, ...TENANT_ADMIN_NAV];
  const hit = all.find((n) => n.path === pathname);
  return hit?.label ?? "Workspace";
}

// ── Layout ─────────────────────────────────────────────────────────────────────

export function DashboardLayout() {
  const { session, logout, switchTenant, userTenants } = useAuth();
  const { setAgent } = useAgent();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [health, setHealth] = useState<SystemHealth>({ status: "healthy", activeCalls: 0, avgLatency: 420 });
  const [healthReachable, setHealthReachable] = useState(true);
  const [healthError, setHealthError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      return localStorage.getItem(SIDEBAR_COLLAPSE_KEY) === "1";
    } catch {
      return false;
    }
  });
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const [tenantPicker, setTenantPicker] = useState(false);
  const [tenantName, setTenantName] = useState(
    () => sessionStorage.getItem("voicera_active_tenant_name") || "",
  );

  const isAdmin = session?.user.role === "customer_admin";
  const noWorkspace =
    !!session &&
    session.user.role !== "platform_admin" &&
    userTenants.length === 0;

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

  const pickTenant = useCallback((id: string, name: string, primaryAgent: AgentType) => {
    sessionStorage.removeItem("vocera_selected_agent");
    sessionStorage.setItem("voicera_active_tenant", id);
    sessionStorage.setItem("voicera_active_tenant_name", name);
    sessionStorage.removeItem("voicera_need_tenant");
    switchTenant(id);
    setAgent(primaryAgent);
    setTenantName(name);
    setTenantPicker(false);
    navigate("/dashboard", { replace: true });
  }, [navigate, setAgent, switchTenant]);

  // Tenant gate: multi → picker; single → auto-enter; never list orgs the user doesn't own
  useEffect(() => {
    if (!session || session.user.role === "platform_admin") {
      setTenantPicker(false);
      return;
    }

    if (userTenants.length > 1 && !session.user.orgId) {
      setTenantPicker(true);
      return;
    }

    setTenantPicker(false);
    sessionStorage.removeItem("voicera_need_tenant");

    if (userTenants.length === 1) {
      const t = userTenants[0];
      setTenantName(t.name);
      sessionStorage.setItem("voicera_active_tenant", t.id);
      sessionStorage.setItem("voicera_active_tenant_name", t.name);
      if (session.user.orgId !== t.id) {
        sessionStorage.removeItem("vocera_selected_agent");
        switchTenant(t.id);
      }
      setAgent(t.primaryAgent);
    }
  }, [session, userTenants, switchTenant, setAgent]);

  const filterAdmin = <T extends { adminOnly?: boolean }>(items: readonly T[]) =>
    items.filter((item) => isAdmin || !item.adminOnly);

  useEffect(() => {
    let cancelled = false;
    let timer: number | undefined;
    let consecutiveFailures = 0;

    const schedule = (delayMs: number) => {
      if (timer !== undefined) window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        void load();
      }, delayMs);
    };

    const load = async () => {
      if (typeof navigator !== "undefined" && navigator.onLine === false) {
        if (!cancelled) {
          consecutiveFailures += 1;
          setHealthReachable(false);
          setHealthError("You are offline.");
          setHealth((h) => ({ ...h, status: "down" }));
        }
        if (!cancelled) schedule(15_000);
        return;
      }
      try {
        const next = await getSystemHealth();
        if (cancelled) return;
        consecutiveFailures = 0;
        setHealth(next);
        setHealthReachable(true);
        setHealthError(null);
        schedule(next.status === "down" ? 10_000 : 5_000);
      } catch (err) {
        if (cancelled) return;
        consecutiveFailures += 1;
        setHealthReachable(false);
        setHealthError(getFriendlyApiMessage(err));
        setHealth((h) => ({ ...h, status: "down", activeCalls: 0 }));
        schedule(consecutiveFailures >= 2 ? 15_000 : 8_000);
      }
    };

    void load();

    return () => {
      cancelled = true;
      if (timer !== undefined) window.clearTimeout(timer);
    };
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
  // On mobile drawer, never use collapsed icon-only mode
  const collapsed = sidebarCollapsed;

  const sidebar = (
    <>
      <div className={`flex items-center gap-2 ${collapsed ? "justify-center px-2" : "px-5"} pt-5 pb-4`}>
        <Link
          to="/dashboard"
          onClick={(e) => {
            closeSidebar();
            if (pathname === "/dashboard") {
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
          {!collapsed && (
            <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 20, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
              Voicera
            </span>
          )}
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

      <SectionLabel collapsed={collapsed}>Setup</SectionLabel>
      <nav className="flex flex-col gap-0.5">
        {filterAdmin(CORE_SETUP_NAV).map((item) => (
          <NavItem
            key={item.path}
            icon={ICON_BY_ID[item.id] ?? LayoutDashboard}
            label={item.label}
            path={item.path}
            end={item.path === "/dashboard"}
            onNavigate={closeSidebar}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <SectionLabel collapsed={collapsed}>Operations</SectionLabel>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {filterAdmin(OPERATIONS_NAV).map((item) => (
          <NavItem
            key={item.path}
            icon={ICON_BY_ID[item.id] ?? Phone}
            label={item.label}
            path={item.path}
            onNavigate={closeSidebar}
            collapsed={collapsed}
          />
        ))}

        <SectionLabel collapsed={collapsed}>Admin</SectionLabel>
        {filterAdmin(TENANT_ADMIN_NAV).map((item) => (
          <NavItem
            key={item.path}
            icon={ICON_BY_ID[item.id] ?? Users}
            label={item.label}
            path={item.path}
            onNavigate={closeSidebar}
            collapsed={collapsed}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 pt-2">
        <button
          type="button"
          className={`flex h-10 w-full items-center ${collapsed ? "justify-center px-0" : "gap-2 px-[18px]"} border-none bg-transparent text-white/50 cursor-pointer text-[12px] hover:text-white/80 hover:bg-white/5 transition-colors`}
          aria-label="Help and support"
          title="Help & Support"
        >
          <HelpCircle size={14} />
          {!collapsed && "Help & Support"}
        </button>

        {/* Desktop collapse control */}
        <button
          type="button"
          onClick={toggleCollapsed}
          className={`hidden lg:flex h-10 w-full items-center ${collapsed ? "justify-center px-0" : "gap-2 px-[18px]"} border-none bg-transparent text-white/50 cursor-pointer text-[12px] hover:text-white/80 hover:bg-white/5 transition-colors`}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen size={15} /> : <PanelLeftClose size={15} />}
          {!collapsed && "Collapse"}
        </button>

        {!collapsed && (
          <>
            <div className="flex h-14 w-full items-center gap-2.5 px-[18px] mb-1">
              <div className="h-7 w-7 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
                <span className="text-[11px] font-bold text-white uppercase">
                  {session?.user.name?.[0] ?? "A"}
                </span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col items-start">
                <span className="text-[12px] font-semibold text-white/90 truncate max-w-[110px]">
                  {session?.user.name ?? "Admin User"}
                </span>
                <span className="max-w-[110px] truncate text-[10px] text-white/45">
                  {session?.user.email ?? ""}
                </span>
                <span className="mt-0.5 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-white/15 text-white/70">
                  {session?.user.role === "customer_admin" ? "Customer Admin" :
                   session?.user.role === "customer_user"  ? "Customer User"  :
                   "Workspace"}
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

            {session?.user.orgId && (
              <div className="flex items-center gap-1.5 px-[18px] pb-2">
                <Building2 size={10} className="text-white/30 shrink-0" />
                <span className="text-[10px] text-white/30 truncate font-mono">
                  {tenantName || sessionStorage.getItem("voicera_active_tenant_name") || session.user.orgId}
                </span>
              </div>
            )}
          </>
        )}

        {collapsed && (
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
    <div className="flex h-[100dvh] w-full overflow-hidden bg-[#F7F4EF] font-[Inter,sans-serif]">
      <a href="#main-content" className="vo-skip">Skip to content</a>
      {sidebarOpen && (
        <div
          className="vo-overlay fixed inset-0 z-40 lg:hidden"
          onClick={closeSidebar}
          aria-hidden={true}
        />
      )}

      {/* Mobile drawer — always full width labels */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex h-full w-[220px] flex-col transition-transform duration-200 ease-out lg:hidden ${
          sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ backgroundColor: "#50381F" }}
        aria-label="Workspace navigation"
      >
        {/* Force expanded labels on mobile by temporarily rendering with collapsed=false */}
        <DashboardMobileSidebar
          session={session}
          tenantName={tenantName}
          pathname={pathname}
          filterAdmin={filterAdmin}
          closeSidebar={closeSidebar}
          setLogoutConfirm={setLogoutConfirm}
        />
      </aside>

      {/* Desktop sidebar — collapsible */}
      <aside
        className={`hidden lg:flex h-full flex-col shrink-0 transition-[width] duration-200 ease-out ${
          collapsed ? "w-[72px]" : "w-[220px]"
        }`}
        style={{ backgroundColor: "#50381F" }}
        aria-label="Workspace navigation"
      >
        {sidebar}
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
              <div className="hidden md:flex flex-col min-w-0 leading-tight">
                <span className="text-[11px] font-medium text-[#9E9890] truncate">
                  {tenantName || "Workspace"}
                </span>
                <span className="text-[13px] font-semibold text-[#1E1A14] truncate">
                  {pageTitle(pathname)}
                </span>
              </div>
              <div className="h-5 w-px bg-[#E2DDD5] hidden sm:block shrink-0" />
              <div className="flex min-w-0 items-center gap-2">
                <span className="hidden sm:inline text-[12px] font-medium text-[#9E9890] shrink-0">Active agent:</span>
                <span className="sm:hidden text-[11px] font-medium text-[#9E9890] shrink-0">Agent:</span>
                <div className="min-w-0 truncate">
                  <AgentSwitcher />
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div
                className="flex items-center gap-1.5"
                title={
                  !healthReachable
                    ? (healthError ?? "Backend unreachable")
                    : health.status === "healthy"
                      ? "System healthy"
                      : health.status === "down"
                        ? "System down"
                        : "System degraded"
                }
              >
                <div
                  className={`h-2 w-2 rounded-full ${
                    !healthReachable || health.status === "down"
                      ? "bg-[#DC2626]"
                      : health.status === "healthy"
                        ? "bg-[#22C55E]"
                        : "bg-[#F59E0B]"
                  }`}
                />
                <span className="text-[12px] font-medium text-[#7A746C] hidden lg:inline">
                  {!healthReachable || health.status === "down"
                    ? "Service Unavailable"
                    : health.status === "healthy"
                      ? "System Healthy"
                      : "Degraded"}
                </span>
              </div>
              <span className={`text-[12px] font-semibold text-[#50381F] bg-[#EDE4D8] px-2.5 py-0.5 rounded-full hidden sm:inline ${health.activeCalls > 0 ? "vo-chip-live" : ""}`}>
                {health.activeCalls} Active
              </span>
              <NotificationBell variant="customer" />
              <HeaderProfile
                tenantName={tenantName}
                variant="customer"
                onSignOut={() => setLogoutConfirm(true)}
              />
            </div>
          </div>
        </header>

        {(!healthReachable || health.status === "down" || health.status === "degraded") && (
          <div
            className={`shrink-0 px-4 sm:px-6 py-2.5 text-[13px] border-b ${
              !healthReachable || health.status === "down"
                ? "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
                : "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
            }`}
            role="status"
            aria-live="polite"
          >
            {!healthReachable || health.status === "down"
              ? (healthError ?? "Backend service is unavailable. Data may be outdated — try again shortly.")
              : "System is degraded. Some features may be slow or incomplete."}
          </div>
        )}

        <main id="main-content" className="flex-1 overflow-auto p-4 sm:p-6 lg:p-7 vo-page" tabIndex={-1}>
          {noWorkspace ? (
            <div className="mx-auto mt-16 max-w-md vo-card p-8 text-center">
              <Building2 size={36} className="mx-auto mb-4 text-[#9E9890]" />
              <h2 className="m-0 mb-2 text-lg font-bold text-[#1E1A14]">No workspace assigned</h2>
              <p className="m-0 mb-6 text-[13px] text-[#7A746C] leading-relaxed">
                This account is not provisioned to a purchased Voicera tenant.
                Contact your admin or Heuristic Labs sales to get access.
              </p>
              <a
                href="mailto:sales@heuristiclabs.ai"
                className="inline-flex h-10 items-center justify-center rounded-lg bg-[#50381F] px-4 text-[13px] font-semibold text-white no-underline"
              >
                Contact sales
              </a>
            </div>
          ) : (
            <Outlet />
          )}
        </main>
      </div>

      {tenantPicker && userTenants.length > 1 && (
        <div className="vo-overlay fixed inset-0 z-[210] flex items-center justify-center">
          <div className="vo-dialog w-[440px] max-w-[92vw] p-6" role="dialog" aria-modal="true" aria-labelledby="tenant-picker-title">
            <div className="mb-1 text-[11px] font-bold uppercase tracking-wider text-[#b5763a]">Workspace</div>
            <h2 id="tenant-picker-title" className="m-0 mb-2 text-base font-bold text-[#1E1A14]">Choose your tenant</h2>
            <p className="m-0 mb-4 text-[13px] text-[#7A746C] leading-relaxed">
              Your account belongs to <strong>more than one organization</strong>.
              Pick the tenant for this session — agents, calls, and campaigns stay scoped to that org.
              Sign out and back in to switch again.
            </p>
            <p className="m-0 mb-4 text-[12px] text-[#9E9890]">
              Signed in as <span className="font-mono text-[#50381F]">{session?.user.email}</span>
            </p>
            <div className="flex flex-col gap-2">
              {userTenants.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => pickTenant(t.id, t.name, t.primaryAgent)}
                  className="text-left rounded-lg border border-[#E2DDD5] bg-white px-4 py-3 cursor-pointer hover:border-[#C9B99E] hover:bg-[#F7F4EF] transition-colors duration-150"
                >
                  <div className="text-[14px] font-semibold text-[#1E1A14]">{t.name}</div>
                  <div className="text-[12px] text-[#7A746C] mt-0.5">{t.detail}</div>
                  <div className="text-[11px] text-[#9E9890] font-mono mt-1">{t.id}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {logoutConfirm && (
        <ConfirmDialog
          title="Sign out?"
          description="You will be returned to the login page."
          confirmLabel="Sign out"
          danger
          confirmId="confirm-logout"
          onCancel={() => setLogoutConfirm(false)}
          onConfirm={handleLogout}
        />
      )}
    </div>
  );
}

/** Mobile drawer always shows full labels (ignores desktop collapse). */
function DashboardMobileSidebar({
  session,
  tenantName,
  pathname,
  filterAdmin,
  closeSidebar,
  setLogoutConfirm,
}: {
  session: ReturnType<typeof useAuth>["session"];
  tenantName: string;
  pathname: string;
  filterAdmin: <T extends { adminOnly?: boolean }>(items: readonly T[]) => T[];
  closeSidebar: () => void;
  setLogoutConfirm: (v: boolean) => void;
}) {
  return (
    <>
      <div className="flex items-center gap-3 px-5 pt-6 pb-5">
        <Link
          to="/dashboard"
          onClick={(e) => {
            closeSidebar();
            if (pathname === "/dashboard") {
              e.preventDefault();
              document.getElementById("main-content")?.scrollTo({ top: 0, behavior: "smooth" });
            }
          }}
          className="flex min-w-0 items-center gap-3 rounded-lg no-underline -ml-1 px-1 py-0.5 hover:bg-white/10 transition-colors"
          aria-label="Voicera home"
        >
          <img src={heuristicLabsLogoLight} alt="" className="h-[38px] w-[38px] object-contain shrink-0" />
          <span style={{ fontFamily: "Inter, sans-serif", fontWeight: 700, fontSize: 20, color: "#FFFFFF", letterSpacing: "-0.01em" }}>
            Voicera
          </span>
        </Link>
        <button
          type="button"
          onClick={closeSidebar}
          className="ml-auto flex h-8 w-8 items-center justify-center rounded-lg bg-white/10 cursor-pointer border-none"
          aria-label="Close menu"
        >
          <X size={16} color="white" />
        </button>
      </div>

      <SectionLabel>Setup</SectionLabel>
      <nav className="flex flex-col gap-0.5">
        {filterAdmin(CORE_SETUP_NAV).map((item) => (
          <NavItem
            key={item.path}
            icon={ICON_BY_ID[item.id] ?? LayoutDashboard}
            label={item.label}
            path={item.path}
            end={item.path === "/dashboard"}
            onNavigate={closeSidebar}
          />
        ))}
      </nav>

      <SectionLabel>Operations</SectionLabel>
      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto">
        {filterAdmin(OPERATIONS_NAV).map((item) => (
          <NavItem
            key={item.path}
            icon={ICON_BY_ID[item.id] ?? Phone}
            label={item.label}
            path={item.path}
            onNavigate={closeSidebar}
          />
        ))}
        <SectionLabel>Admin</SectionLabel>
        {filterAdmin(TENANT_ADMIN_NAV).map((item) => (
          <NavItem
            key={item.path}
            icon={ICON_BY_ID[item.id] ?? Users}
            label={item.label}
            path={item.path}
            onNavigate={closeSidebar}
          />
        ))}
      </nav>

      <div className="border-t border-white/10 pt-2">
        <div className="flex h-14 w-full items-center gap-2.5 px-[18px] mb-1">
          <div className="h-7 w-7 shrink-0 rounded-full bg-white/20 flex items-center justify-center">
            <span className="text-[11px] font-bold text-white uppercase">
              {session?.user.name?.[0] ?? "A"}
            </span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col items-start">
            <span className="text-[12px] font-semibold text-white/90 truncate max-w-[110px]">
              {session?.user.name ?? "Admin User"}
            </span>
            <span className="max-w-[110px] truncate text-[10px] text-white/45">
              {session?.user.email ?? ""}
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
        {session?.user.orgId && (
          <div className="flex items-center gap-1.5 px-[18px] pb-2">
            <Building2 size={10} className="text-white/30 shrink-0" />
            <span className="text-[10px] text-white/30 truncate font-mono">
              {tenantName || session.user.orgId}
            </span>
          </div>
        )}
      </div>
    </>
  );
}
