import { useState } from "react";
import {
  Users, Package, Phone, DollarSign,
  TrendingUp, AlertCircle, ArrowUpRight, Activity,
} from "lucide-react";
import { MOCK_ORGANISATIONS } from "../../lib/rbac";

// ── Helpers ────────────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, trend, accent,
}: {
  icon: typeof Phone; label: string; value: string; sub?: string;
  trend?: string; accent: string;
}) {
  return (
    <div className="bg-[#FFFFFF] rounded-xl border p-5 flex flex-col gap-3" style={{ borderColor: "#E7DFC8" }}>
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#6B645B" }}>{label}</span>
        <div className="h-9 w-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${accent}18` }}>
          <Icon size={16} style={{ color: accent }} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[1.75rem] font-bold leading-none tracking-tight" style={{ color: "#1E1A16" }}>{value}</span>
        {sub && <span className="text-[12px] mb-0.5" style={{ color: "#6B645B" }}>{sub}</span>}
      </div>
      {trend && (
        <div className="flex items-center gap-1">
          <TrendingUp size={12} color="#4CAF50" />
          <span className="text-[11px] font-bold" style={{ color: "#4CAF50" }}>{trend}</span>
        </div>
      )}
    </div>
  );
}

function RecentActivityRow({
  org, action, time, status,
}: {
  org: string; action: string; time: string;
  status: "success" | "warning" | "info";
}) {
  const colors = {
    success: { dot: "#4CAF50", bg: "#4CAF5022", text: "#4CAF50" },
    warning: { dot: "#F4B400", bg: "#F4B40022", text: "#F4B400" },
    info:    { dot: "#50381F", bg: "#50381F22", text: "#50381F" },
  }[status];
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0" style={{ borderColor: "#E7DFC8" }}>
      <div className="flex items-center gap-3">
        <div className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: colors.dot }} />
        <div>
          <span className="text-[13px] font-bold" style={{ color: "#1E1A16" }}>{org}</span>
          <span className="text-[12px] ml-2" style={{ color: "#6B645B" }}>{action}</span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: colors.bg, color: colors.text }}>
          {status === "success" ? "Completed" : status === "warning" ? "Pending" : "Info"}
        </span>
        <span className="text-[11px]" style={{ color: "#6B645B" }}>{time}</span>
      </div>
    </div>
  );
}

// ── Computed stats ─────────────────────────────────────────────────────────────

const totalCalls = MOCK_ORGANISATIONS.reduce((s, o) => s + o.totalCalls, 0);
const activeOrgs = MOCK_ORGANISATIONS.filter((o) => o.status === "active").length;
const totalAgentSlots = MOCK_ORGANISATIONS.reduce((s, o) => s + o.subscribedAgents.length, 0);

// ── Page ──────────────────────────────────────────────────────────────────────

export function AdminOverviewPage() {
  const [_tab, _setTab] = useState("overview");

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <h1 className="text-[22px] font-bold m-0" style={{ color: "#1E1A16" }}>Platform Overview</h1>
          <span className="text-[11px] px-2 py-0.5 rounded-full font-bold" style={{ backgroundColor: "#ECE6D9", color: "#50381F" }}>
            Admin Console
          </span>
        </div>
        <p className="text-[13px] m-0" style={{ color: "#6B645B" }}>
          Platform-wide metrics, recent activity, and operational status across all tenants.
        </p>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <KpiCard
          icon={Users}
          label="Total Tenants"
          value={String(MOCK_ORGANISATIONS.length)}
          sub="organisations"
          trend="+2 this month"
          accent="#50381F"
        />
        <KpiCard
          icon={Package}
          label="Active Subscriptions"
          value={String(totalAgentSlots)}
          sub="agent slots"
          trend="+5 this month"
          accent="#6B645B"
        />
        <KpiCard
          icon={Phone}
          label="Platform Calls"
          value={totalCalls.toLocaleString()}
          sub="total"
          trend="+12.4% vs last month"
          accent="#4CAF50"
        />
        <KpiCard
          icon={DollarSign}
          label="Active Tenants"
          value={String(activeOrgs)}
          sub={`of ${MOCK_ORGANISATIONS.length}`}
          accent="#F4B400"
        />
      </div>

      {/* Two-column section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-5">

        {/* Tenant Health Overview */}
        <div className="bg-[#FFFFFF] rounded-xl border overflow-hidden" style={{ borderColor: "#E7DFC8" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E7DFC8" }}>
            <h2 className="text-[14px] font-bold m-0" style={{ color: "#1E1A16" }}>Tenant Health</h2>
            <a href="/admin/customers" className="text-[12px] font-bold flex items-center gap-1 no-underline hover:opacity-80 transition-opacity" style={{ color: "#50381F" }}>
              View all <ArrowUpRight size={12} />
            </a>
          </div>
          <div className="p-5">
            <div className="flex flex-col gap-3">
              {[
                { label: "Active", count: MOCK_ORGANISATIONS.filter(o => o.status === "active").length,   color: "#4CAF50", bg: "#4CAF5022" },
                { label: "Trial",  count: MOCK_ORGANISATIONS.filter(o => o.status === "trial").length,    color: "#F4B400", bg: "#F4B40022" },
                { label: "Suspended", count: MOCK_ORGANISATIONS.filter(o => o.status === "suspended").length, color: "#D9534F", bg: "#D9534F22" },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="text-[12px] w-20 shrink-0 font-medium" style={{ color: "#6B645B" }}>{item.label}</span>
                  <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ backgroundColor: "#F7F4EF" }}>
                    <div
                      className="h-2 rounded-full transition-all duration-700"
                      style={{
                        width: `${(item.count / MOCK_ORGANISATIONS.length) * 100}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                    style={{ color: item.color, backgroundColor: item.bg }}
                  >
                    {item.count}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-4 pt-4 border-t flex items-center gap-2" style={{ borderColor: "#E7DFC8" }}>
              <Activity size={13} color="#4CAF50" className="shrink-0" />
              <span className="text-[12px]" style={{ color: "#6B645B" }}>Platform uptime: <strong style={{ color: "#1E1A16" }}>99.97%</strong> — last 30 days</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#FFFFFF] rounded-xl border overflow-hidden" style={{ borderColor: "#E7DFC8" }}>
          <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E7DFC8" }}>
            <h2 className="text-[14px] font-bold m-0" style={{ color: "#1E1A16" }}>Recent Activity</h2>
            <AlertCircle size={14} color="#6B645B" />
          </div>
          <div className="px-5 py-2">
            <RecentActivityRow org="Spice Garden Restaurants" action="subscribed to Restaurant Agent" time="2h ago" status="success" />
            <RecentActivityRow org="AgroCredit Solutions" action="account suspended — overdue" time="5h ago" status="warning" />
            <RecentActivityRow org="HomeFinder Realty" action="started 14-day trial" time="1d ago" status="info" />
            <RecentActivityRow org="MedPlus Healthcare" action="upgraded plan to Growth" time="2d ago" status="success" />
            <RecentActivityRow org="Trendy Shop Online" action="added Customer Support Agent" time="3d ago" status="success" />
          </div>
        </div>
      </div>

      {/* Plan Distribution */}
      <div className="bg-[#FFFFFF] rounded-xl border overflow-hidden" style={{ borderColor: "#E7DFC8" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E7DFC8" }}>
          <h2 className="text-[14px] font-bold m-0" style={{ color: "#1E1A16" }}>Subscription Plan Distribution</h2>
        </div>
        <div className="p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { plan: "Starter",    count: MOCK_ORGANISATIONS.filter(o => o.plan === "Starter").length,    color: "#50381F", desc: "Up to 2 agents, 1K calls/mo" },
            { plan: "Growth",     count: MOCK_ORGANISATIONS.filter(o => o.plan === "Growth").length,     color: "#6B645B", desc: "Up to 5 agents, 10K calls/mo" },
            { plan: "Enterprise", count: MOCK_ORGANISATIONS.filter(o => o.plan === "Enterprise").length, color: "#4CAF50", desc: "Unlimited agents & calls" },
          ].map((item) => (
            <div key={item.plan} className="rounded-xl border p-4 text-center" style={{ borderColor: "#E7DFC8" }}>
              <div className="text-[2rem] font-bold mb-1" style={{ color: item.color }}>{item.count}</div>
              <div className="text-[13px] font-bold mb-1" style={{ color: "#1E1A16" }}>{item.plan}</div>
              <div className="text-[11px]" style={{ color: "#6B645B" }}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
