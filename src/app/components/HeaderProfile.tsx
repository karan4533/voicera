import { useEffect, useRef, useState } from "react";
import { ChevronDown, LogOut, Building2, Shield } from "lucide-react";
import { useAuth } from "../context/AuthContext";

function roleLabel(role?: string) {
  if (role === "platform_admin") return "Platform Admin";
  if (role === "customer_admin") return "Customer Admin";
  if (role === "customer_user") return "Customer User";
  return "User";
}

function initials(name?: string, email?: string) {
  const src = (name || email || "U").trim();
  const parts = src.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

interface HeaderProfileProps {
  tenantName?: string;
  onSignOut: () => void;
  variant?: "customer" | "admin";
}

/** Header avatar + dropdown — name, email, role, org, sign out. */
export function HeaderProfile({
  tenantName,
  onSignOut,
  variant = "customer",
}: HeaderProfileProps) {
  const { session } = useAuth();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!session) return null;

  const name = session.user.name || "User";
  const email = session.user.email || "";
  const role = roleLabel(session.user.role);
  const org =
    tenantName ||
    sessionStorage.getItem("voicera_active_tenant_name") ||
    session.user.orgId ||
    (variant === "admin" ? "Heuristic Labs" : "");

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="vo-lift flex items-center gap-2 max-w-[220px] h-9 pl-1.5 pr-2 rounded-lg border border-[#E2DDD5] bg-white hover:bg-[#F7F4EF] hover:border-[#C9B99E] cursor-pointer"
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Account menu"
      >
        <div className="h-7 w-7 shrink-0 rounded-full bg-[#EDE4D8] flex items-center justify-center ring-0 transition-[box-shadow] duration-200 group-hover:ring-2">
          <span className="text-[11px] font-bold text-[#50381F]">
            {initials(name, email)}
          </span>
        </div>
        <div className="hidden sm:flex min-w-0 flex-col items-start leading-tight">
          <span className="text-[12px] font-semibold text-[#1E1A14] truncate max-w-[120px] vo-text-glow">
            {name}
          </span>
          <span className="text-[10px] text-[#9E9890] truncate max-w-[120px]">
            {role}
          </span>
        </div>
        <ChevronDown
          size={14}
          className={`text-[#9E9890] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="menu"
          className="vo-menu-pop absolute right-0 top-[calc(100%+6px)] z-[60] w-[260px] rounded-xl border border-[#E2DDD5] bg-white shadow-[0_12px_32px_rgba(80,56,31,0.14)] overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-[#F0EDE8]">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-[#EDE4D8] flex items-center justify-center shrink-0">
                <span className="text-[13px] font-bold text-[#50381F]">
                  {initials(name, email)}
                </span>
              </div>
              <div className="min-w-0">
                <p className="m-0 text-[13px] font-semibold text-[#1E1A14] truncate">{name}</p>
                <p className="m-0 mt-0.5 text-[11px] text-[#7A746C] truncate">{email}</p>
              </div>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#EDE4D8] text-[#50381F]">
                {variant === "admin" ? <Shield size={10} /> : null}
                {role}
              </span>
            </div>
            {org ? (
              <div className="mt-2 flex items-center gap-1.5 text-[11px] text-[#9E9890]">
                <Building2 size={11} className="shrink-0" />
                <span className="truncate">{org}</span>
              </div>
            ) : null}
          </div>

          <div className="p-1.5">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false);
                onSignOut();
              }}
              className="vo-option"
              style={{ color: "#B91C1C" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#FEE2E2";
                e.currentTarget.style.color = "#991B1B";
                e.currentTarget.style.fontWeight = "700";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "";
                e.currentTarget.style.color = "#B91C1C";
                e.currentTarget.style.fontWeight = "";
              }}
            >
              <LogOut size={14} />
              <span className="vo-option-label">Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
