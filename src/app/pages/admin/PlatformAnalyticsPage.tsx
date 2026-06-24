import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { MOCK_ORGANISATIONS } from "../../lib/rbac";
import { AGENT_TYPES } from "../../context/AgentContext";
import { TrendingUp, Phone, Users } from "lucide-react";

// ── Chart data ─────────────────────────────────────────────────────────────────

const PLATFORM_VOLUME = [
  { month: "Jan", calls: 4200, resolved: 3780 },
  { month: "Feb", calls: 5800, resolved: 5220 },
  { month: "Mar", calls: 7200, resolved: 6480 },
  { month: "Apr", calls: 8900, resolved: 8010 },
  { month: "May", calls: 11400, resolved: 10260 },
  { month: "Jun", calls: 14800, resolved: 13320 },
];

const PLATFORM_SENTIMENT = [
  { month: "Jan", score: 71 },
  { month: "Feb", score: 73 },
  { month: "Mar", score: 75 },
  { month: "Apr", score: 77 },
  { month: "May", score: 79 },
  { month: "Jun", score: 82 },
];

// Agent usage — count how many orgs use each agent type
const agentUsage = AGENT_TYPES.slice(0, 6).map((at) => ({
  name: at.label.replace(" Agent", ""),
  orgs: MOCK_ORGANISATIONS.filter((o) => o.subscribedAgents.includes(at.id as never)).length,
  color: at.color,
}));

const PIE_COLORS = ["#50381F", "#6B645B", "#4CAF50", "#F4B400", "#D9534F", "#8B7355"];

// ── Custom tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E7DFC8", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#1E1A16" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || "#50381F" }}>
          {p.name ? `${p.name}: ` : ""}<strong>{p.value}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function StatCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className="bg-[#FFFFFF] rounded-xl border p-4" style={{ borderColor: "#E7DFC8" }}>
      <p className="text-[11px] font-bold uppercase tracking-wider m-0 mb-2" style={{ color: "#6B645B" }}>{label}</p>
      <div className="flex items-end gap-2">
        <span className="text-[1.6rem] font-bold leading-none" style={{ color: "#1E1A16" }}>{value}</span>
        {sub && <span className="text-[12px] mb-0.5" style={{ color: "#6B645B" }}>{sub}</span>}
      </div>
      <div className="mt-2 h-1 rounded-full" style={{ backgroundColor: `${accent}25` }}>
        <div className="h-1 rounded-full w-3/4" style={{ backgroundColor: accent }} />
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function PlatformAnalyticsPage() {
  const totalCalls = MOCK_ORGANISATIONS.reduce((s, o) => s + o.totalCalls, 0);

  return (
    <>
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[22px] font-bold m-0 mb-1" style={{ color: "#1E1A16" }}>Platform Analytics</h1>
        <p className="text-[13px] m-0" style={{ color: "#6B645B" }}>
          Aggregated metrics across all customer organisations. No individual customer business data is shown.
        </p>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        <StatCard label="Total Platform Calls" value={totalCalls.toLocaleString()} sub="all-time" accent="#50381F" />
        <StatCard label="Avg Resolution Rate" value="90.4%" accent="#4CAF50" />
        <StatCard label="Active Tenants" value={String(MOCK_ORGANISATIONS.filter(o => o.status === "active").length)} sub="of 6" accent="#6B645B" />
        <StatCard label="Platform Sentiment" value="82%" sub="positive" accent="#F4B400" />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
        {/* Volume */}
        <div className="bg-[#FFFFFF] rounded-xl border overflow-hidden" style={{ borderColor: "#E7DFC8" }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#E7DFC8" }}>
            <Phone size={14} color="#50381F" />
            <h2 className="text-[14px] font-bold m-0" style={{ color: "#1E1A16" }}>Call Volume — Last 6 Months</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={PLATFORM_VOLUME} barSize={18} barCategoryGap="35%">
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B645B" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: "#6B645B" }} axisLine={false} tickLine={false} width={36} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="calls"    name="Total"    fill="#ECE6D9" radius={[4, 4, 0, 0]} />
                <Bar dataKey="resolved" name="Resolved" fill="#50381F" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-4 mt-2">
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "#6B645B" }}><span className="h-2.5 w-2.5 rounded-sm bg-[#ECE6D9] inline-block" /> Total</span>
              <span className="flex items-center gap-1.5 text-[11px]" style={{ color: "#6B645B" }}><span className="h-2.5 w-2.5 rounded-sm bg-[#50381F] inline-block" /> Resolved</span>
            </div>
          </div>
        </div>

        {/* Sentiment */}
        <div className="bg-[#FFFFFF] rounded-xl border overflow-hidden" style={{ borderColor: "#E7DFC8" }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#E7DFC8" }}>
            <TrendingUp size={14} color="#4CAF50" />
            <h2 className="text-[14px] font-bold m-0" style={{ color: "#1E1A16" }}>Sentiment Trend</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={PLATFORM_SENTIMENT}>
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: "#6B645B" }} axisLine={false} tickLine={false} />
                <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#6B645B" }} axisLine={false} tickLine={false} width={28} />
                <Tooltip content={<ChartTooltip />} />
                <Line type="monotone" dataKey="score" name="Sentiment %" stroke="#4CAF50" strokeWidth={2.5} dot={{ fill: "#4CAF50", r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px]" style={{ color: "#6B645B" }}>Positive sentiment score (%)</span>
              <span className="text-[12px] font-bold" style={{ color: "#4CAF50" }}>↑ +11% vs Jan</span>
            </div>
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {/* Agent usage */}
        <div className="bg-[#FFFFFF] rounded-xl border overflow-hidden" style={{ borderColor: "#E7DFC8" }}>
          <div className="px-5 py-4 border-b" style={{ borderColor: "#E7DFC8" }}>
            <h2 className="text-[14px] font-bold m-0" style={{ color: "#1E1A16" }}>Agent Usage by Tenants</h2>
          </div>
          <div className="p-5 flex flex-col gap-3">
            {agentUsage.map((au) => (
              <div key={au.name} className="flex items-center gap-3">
                <span className="text-[12px] w-28 shrink-0 font-medium" style={{ color: "#6B645B" }}>{au.name}</span>
                <div className="flex-1 rounded-full h-2 overflow-hidden" style={{ backgroundColor: "#F7F4EF" }}>
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${(au.orgs / MOCK_ORGANISATIONS.length) * 100}%`, backgroundColor: au.color }}
                  />
                </div>
                <span className="text-[12px] font-bold w-8 text-right" style={{ color: "#1E1A16" }}>{au.orgs}</span>
                <span className="text-[11px] w-12 text-right" style={{ color: "#6B645B" }}>
                  {Math.round((au.orgs / MOCK_ORGANISATIONS.length) * 100)}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Top tenants by calls */}
        <div className="bg-[#FFFFFF] rounded-xl border overflow-hidden" style={{ borderColor: "#E7DFC8" }}>
          <div className="px-5 py-4 border-b flex items-center gap-2" style={{ borderColor: "#E7DFC8" }}>
            <Users size={14} color="#50381F" />
            <h2 className="text-[14px] font-bold m-0" style={{ color: "#1E1A16" }}>Top Tenants by Call Volume</h2>
          </div>
          <div className="p-5">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={MOCK_ORGANISATIONS.map((o, i) => ({ name: o.name.split(" ")[0], value: o.totalCalls, fill: PIE_COLORS[i % PIE_COLORS.length] }))}
                  cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false} fontSize={10}
                >
                  {MOCK_ORGANISATIONS.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => [v.toLocaleString(), "Calls"]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </>
  );
}
