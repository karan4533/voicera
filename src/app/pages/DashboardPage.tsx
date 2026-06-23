import { useEffect, useState, useCallback } from "react";
import { X, TrendingUp, Phone, CheckCircle, Zap, Activity, Search, Download } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { PageHeader } from "../components/shared/PageHeader";
import { getDashboardMetrics, getExtractedData } from "../lib/api";
import { useAgent } from "../context/AgentContext";
import type { DashboardMetrics, ExtractedEntity } from "../lib/types";

// ── Mock chart data ────────────────────────────────────────────────────────────

const CALL_VOLUME_DATA = [
  { day: "Mon", calls: 124, resolved: 108 },
  { day: "Tue", calls: 98,  resolved: 89 },
  { day: "Wed", calls: 145, resolved: 131 },
  { day: "Thu", calls: 162, resolved: 144 },
  { day: "Fri", calls: 189, resolved: 170 },
  { day: "Sat", calls: 72,  resolved: 64 },
  { day: "Sun", calls: 51,  resolved: 45 },
];

const SENTIMENT_DATA = [
  { day: "Mon", score: 74 },
  { day: "Tue", score: 71 },
  { day: "Wed", score: 76 },
  { day: "Thu", score: 78 },
  { day: "Fri", score: 82 },
  { day: "Sat", score: 85 },
  { day: "Sun", score: 80 },
];

const LANGUAGE_DATA = [
  { language: "English",  count: 342, percentage: 41 },
  { language: "Hindi",    count: 210, percentage: 25 },
  { language: "Tamil",    count: 151, percentage: 18 },
  { language: "Telugu",   count: 84,  percentage: 10 },
  { language: "Gujarati", count: 50,  percentage: 6 },
];

const LANG_COLORS = ["#50381F", "#7A5C3C", "#A88060", "#C9B99E", "#E2DDD5"];

// ── Sub-components ─────────────────────────────────────────────────────────────

function KpiCard({
  icon: Icon, label, value, sub, iconColor,
}: { icon: typeof Phone; label: string; value: string; sub?: string; iconColor: string }) {
  return (
    <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-[#7A746C] uppercase tracking-wider">{label}</span>
        <div className="h-8 w-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${iconColor}15` }}>
          <Icon size={15} style={{ color: iconColor }} />
        </div>
      </div>
      <div className="flex items-end gap-2">
        <span className="text-[1.6rem] font-bold leading-none tracking-tight text-[#1E1A14]">{value}</span>
        {sub && <span className="text-[12px] text-[#9E9890] mb-0.5">{sub}</span>}
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white border border-[#E2DDD5] rounded-xl overflow-hidden">
      <div className="px-5 py-4 border-b border-[#F0EDE8]">
        <h2 className="m-0 text-[14px] font-semibold text-[#1E1A14]">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  );
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Synced":
      return <span style={{ fontSize: 11, fontWeight: 600, color: "#15803D", backgroundColor: "#DCFCE7", padding: "2px 8px", borderRadius: 12 }}>Synced</span>;
    case "Action Required":
      return <span style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", backgroundColor: "#FEE2E2", padding: "2px 8px", borderRadius: 12 }}>Action Required</span>;
    case "Pending":
      return <span style={{ fontSize: 11, fontWeight: 600, color: "#92400E", backgroundColor: "#FEF3C7", padding: "2px 8px", borderRadius: 12 }}>Pending</span>;
    default:
      return <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", backgroundColor: "#F3F4F6", padding: "2px 8px", borderRadius: 12 }}>{status}</span>;
  }
};

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: { value: number; name?: string; color?: string }[]; label?: string }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "#fff", border: "1px solid #E2DDD5", borderRadius: 8, padding: "8px 12px", fontSize: 12, boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
      <p style={{ margin: "0 0 4px", fontWeight: 600, color: "#1E1A14" }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ margin: 0, color: p.color || "#50381F" }}>
          {p.name ? `${p.name}: ` : ""}<strong>{p.value}{p.name === "Sentiment" ? "%" : ""}</strong>
        </p>
      ))}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { agentLabel } = useAgent();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedEntity[]>([]);
  const [selectedCall, setSelectedCall] = useState<ExtractedEntity | null>(null);
  const [search, setSearch] = useState("");

  const load = useCallback(() => {
    getDashboardMetrics().then(setMetrics);
    getExtractedData().then(setExtractedData);
  }, []);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  const filtered = extractedData.filter((e) =>
    search === "" || e.customerName.toLowerCase().includes(search.toLowerCase()) || e.contact.includes(search)
  );

  const handleExportCSV = () => {
    const headers = ["Type", "Customer", "Contact", "Status", "Timestamp"];
    const rows = filtered.map((e) => [e.type, e.customerName, e.contact, e.status, e.timestamp]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `dashboard_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle={`Operational overview for ${agentLabel} — live metrics, trends, and recent calls`}
      />

      {/* ── KPI Row ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5">
        <KpiCard icon={Phone}         label="Active Calls"       value={metrics ? metrics.activeCalls.toLocaleString() : "—"}                   iconColor="#50381F" />
        <KpiCard icon={TrendingUp}    label="Today's Calls"      value={metrics ? (metrics.todayCalls ?? 0).toLocaleString() : "—"}               iconColor="#2563EB" />
        <KpiCard icon={CheckCircle}   label="Resolution Rate"    value={metrics ? `${metrics.resolutionRate ?? 0}%` : "—"}             iconColor="#16A34A" />
        <KpiCard icon={Zap}           label="Avg Latency"        value={metrics ? `${(metrics.avgLatency ?? 0).toLocaleString()}ms` : "—"}                iconColor="#D97706" />
      </div>

      {/* ── Charts Row 1 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <SectionCard title="Call Volume — Last 7 Days">
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={CALL_VOLUME_DATA} barSize={18} barCategoryGap="30%">
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9E9890" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: "#9E9890" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="calls" name="Total" fill="#C9B99E" radius={[4, 4, 0, 0]} />
              <Bar dataKey="resolved" name="Resolved" fill="#50381F" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-4 mt-3">
            <span className="flex items-center gap-1.5 text-[11px] text-[#7A746C]">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#C9B99E] inline-block" /> Total Calls
            </span>
            <span className="flex items-center gap-1.5 text-[11px] text-[#7A746C]">
              <span className="h-2.5 w-2.5 rounded-sm bg-[#50381F] inline-block" /> Resolved
            </span>
          </div>
        </SectionCard>

        <SectionCard title="Sentiment Trend — Last 7 Days">
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={SENTIMENT_DATA}>
              <XAxis dataKey="day" tick={{ fontSize: 11, fill: "#9E9890" }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fontSize: 11, fill: "#9E9890" }} axisLine={false} tickLine={false} width={28} />
              <Tooltip content={<ChartTooltip />} />
              <Line
                type="monotone" dataKey="score" name="Sentiment"
                stroke="#50381F" strokeWidth={2} dot={{ fill: "#50381F", r: 4 }}
                activeDot={{ r: 5, fill: "#50381F" }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="flex items-center justify-between mt-3">
            <span className="text-[11px] text-[#7A746C]">Positive sentiment score (%)</span>
            <span className="text-[12px] font-semibold text-[#16A34A]">↑ +4.2% vs last week</span>
          </div>
        </SectionCard>
      </div>

      {/* ── Charts Row 2 ────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        {/* Language Distribution */}
        <SectionCard title="Language Distribution">
          <div className="flex flex-col gap-3">
            {LANGUAGE_DATA.map((l, i) => (
              <div key={l.language} className="flex items-center gap-3">
                <span className="text-[12px] text-[#7A746C] w-16 shrink-0">{l.language}</span>
                <div className="flex-1 bg-[#F0EDE8] rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-700"
                    style={{ width: `${l.percentage}%`, backgroundColor: LANG_COLORS[i] }}
                  />
                </div>
                <span className="text-[12px] font-semibold text-[#1E1A14] w-10 text-right">{l.count}</span>
                <span className="text-[11px] text-[#9E9890] w-8 text-right">{l.percentage}%</span>
              </div>
            ))}
          </div>
        </SectionCard>

        {/* System Health */}
        <SectionCard title="System Health">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {[
              { label: "System Status",    value: "Healthy",  color: "#16A34A", bg: "#DCFCE7" },
              { label: "Active Channels",  value: metrics ? String(metrics.activeChannels ?? 10) : "10",  color: "#50381F", bg: "#EDE4D8" },
              { label: "Avg Latency",      value: metrics ? `${metrics.avgLatency ?? 420}ms` : "420ms", color: "#D97706", bg: "#FEF3C7" },
              { label: "Uptime",           value: "99.9%",    color: "#2563EB", bg: "#DBEAFE" },
            ].map((item) => (
              <div key={item.label} className="rounded-lg border border-[#E2DDD5] p-3">
                <p className="text-[11px] text-[#9E9890] m-0 mb-1">{item.label}</p>
                <p className="text-[14px] font-bold m-0" style={{ color: item.color }}>{item.value}</p>
              </div>
            ))}
          </div>
          <div className="flex items-center gap-2 bg-[#F7F4EF] rounded-lg p-3">
            <Activity size={14} className="text-[#50381F] shrink-0" />
            <span className="text-[12px] text-[#7A746C]">All systems operating within normal parameters. No alerts.</span>
          </div>
        </SectionCard>
      </div>

      {/* ── Recent Calls Table ───────────────────────────────────────────────── */}
      <div className="bg-white border border-[#E2DDD5] rounded-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-[#F0EDE8] flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="m-0 text-[14px] font-semibold text-[#1E1A14]">Recent Call Results</h2>
            <p className="m-0 mt-0.5 text-[12px] text-[#9E9890]">Completed calls with automatically extracted customer data</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#9E9890]" />
              <input
                type="text"
                placeholder="Search calls..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-8 pl-8 pr-3 rounded-lg border border-[#E2DDD5] bg-[#F7F4EF] text-[12px] text-[#1E1A14] outline-none focus:border-[#C9B99E] transition-colors w-44"
              />
            </div>
            <button
              onClick={handleExportCSV}
              className="h-8 px-3 rounded-lg border border-[#E2DDD5] bg-white text-[12px] font-medium text-[#7A746C] cursor-pointer hover:bg-[#F7F4EF] transition-colors flex items-center gap-1.5"
            >
              <Download size={12} /> Export
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-[#F7F4EF] border-b border-[#E2DDD5]">
                {["Type", "Customer", "Details", "Status", "Time"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[10px] font-semibold text-[#9E9890] uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => setSelectedCall(item)}
                  className="border-b border-[#F0EDE8] last:border-0 cursor-pointer hover:bg-[#F7F4EF] transition-colors"
                  style={{ backgroundColor: selectedCall?.id === item.id ? "#F7F4EF" : undefined }}
                >
                  <td className="px-4 py-3.5">
                    <span className="text-[13px] font-semibold text-[#1E1A14]">{item.type}</span>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="text-[13px] font-medium text-[#1E1A14]">{item.customerName}</div>
                    <div className="text-[11px] text-[#9E9890] font-mono mt-0.5">{item.contact}</div>
                  </td>
                  <td className="px-4 py-3.5">
                    <div className="flex flex-wrap gap-1.5 max-w-sm">
                      {Object.entries(item.attributes).slice(0, 3).map(([key, value]) => (
                        <span key={key} className="inline-flex items-center gap-1 bg-[#F7F4EF] border border-[#E2DDD5] rounded-md px-2 py-0.5 text-[11px]">
                          <span className="text-[#9E9890]">{key}:</span>
                          <span className="text-[#1E1A14] font-medium">{value}</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3.5">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3.5">
                    <span className="text-[12px] text-[#9E9890]">{item.timestamp}</span>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-[13px] text-[#9E9890]">
                    No call records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Slide-out detail panel ───────────────────────────────────────────── */}
      {selectedCall !== null && (
        <div className="fixed right-0 top-0 h-full w-full sm:w-[400px] max-w-[100vw] bg-white border-l border-[#E2DDD5] shadow-2xl flex flex-col z-50">
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2DDD5] shrink-0 bg-[#F7F4EF]">
            <div>
              <div className="font-bold text-[15px] text-[#1E1A14]">{selectedCall.customerName}</div>
              <div className="text-[12px] text-[#7A746C] font-mono">{selectedCall.contact}</div>
            </div>
            <button
              onClick={() => setSelectedCall(null)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#E2DDD5] transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={16} className="text-[#7A746C]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-bold text-[#1E1A14]">{selectedCall.type}</span>
              {getStatusBadge(selectedCall.status)}
            </div>

            <div>
              <h3 className="text-[11px] font-bold text-[#9E9890] uppercase tracking-wider mb-2">Extracted Data</h3>
              <div className="bg-[#F7F4EF] rounded-xl border border-[#E2DDD5] p-4 flex flex-col gap-3">
                {Object.entries(selectedCall.attributes ?? {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center border-b border-[#E2DDD5] pb-2 last:border-0 last:pb-0">
                    <span className="text-[12px] text-[#7A746C] font-medium">{key}</span>
                    <span className="text-[12px] text-[#1E1A14] font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {selectedCall.summary && (
              <div>
                <h3 className="text-[11px] font-bold text-[#9E9890] uppercase tracking-wider mb-2">AI Summary</h3>
                <div className="bg-[#EDE4D8] border border-[#C9B99E] rounded-xl p-4 text-[13px] text-[#50381F] leading-relaxed">
                  {selectedCall.summary}
                </div>
              </div>
            )}

            {selectedCall.transcript && (
              <div>
                <h3 className="text-[11px] font-bold text-[#9E9890] uppercase tracking-wider mb-2">Transcript</h3>
                <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 max-h-[260px] overflow-y-auto flex flex-col gap-2">
                  {selectedCall.transcript.split("\n").map((line, idx) => {
                    const isAi = line.startsWith("AI:");
                    return (
                      <div
                        key={idx}
                        className={`p-2.5 rounded-lg text-[12px] leading-relaxed ${isAi ? "bg-[#F7F4EF] text-[#4A453E]" : "bg-[#EDE4D8] text-[#50381F]"}`}
                      >
                        <strong>{isAi ? "AI Agent" : "Customer"}:</strong>{" "}
                        {line.replace(/^(AI|Customer):\s*/, "")}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
