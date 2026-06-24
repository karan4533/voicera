import { useState, useEffect } from "react";
import {
  Activity, Zap, Server, Globe2, Clock, AlertTriangle,
  CheckCircle2, RefreshCw,
} from "lucide-react";

// ── Mock data + helpers ────────────────────────────────────────────────────────

interface ServiceStatus {
  name: string;
  status: "operational" | "degraded" | "down";
  latency: number;
  uptime: number;
  region: string;
}

const SERVICES: ServiceStatus[] = [
  { name: "Voice Gateway",        status: "operational", latency: 38,  uptime: 99.98, region: "ap-south-1" },
  { name: "AI Inference Engine",  status: "operational", latency: 142, uptime: 99.95, region: "ap-south-1" },
  { name: "STT / Transcription",  status: "operational", latency: 210, uptime: 99.90, region: "global" },
  { name: "TTS Engine",           status: "operational", latency: 88,  uptime: 99.99, region: "ap-south-1" },
  { name: "NLU / Intent Engine",  status: "degraded",    latency: 580, uptime: 99.42, region: "us-east-1" },
  { name: "Campaign Scheduler",   status: "operational", latency: 22,  uptime: 100,   region: "ap-south-1" },
  { name: "Call Recording Store", status: "operational", latency: 55,  uptime: 99.97, region: "ap-south-1" },
  { name: "Firebase Auth",        status: "operational", latency: 61,  uptime: 100,   region: "global" },
];

const INCIDENT_LOG = [
  { id: 1, time: "Jun 24, 10:45 IST", severity: "low",    title: "NLU Engine elevated latency — investigation in progress", resolved: false },
  { id: 2, time: "Jun 22, 03:12 IST", severity: "medium", title: "STT latency spike for 18 minutes — resolved",              resolved: true },
  { id: 3, time: "Jun 19, 14:30 IST", severity: "low",    title: "Campaign Scheduler delayed batch by 5 min — resolved",    resolved: true },
  { id: 4, time: "Jun 11, 09:00 IST", severity: "high",   title: "Voice Gateway outage 12 min — post-mortem published",     resolved: true },
];

function StatusDot({ status }: { status: ServiceStatus["status"] }) {
  const map = {
    operational: "bg-[#4CAF50] shadow-[0_0_6px_#4CAF50]",
    degraded:    "bg-[#F4B400] shadow-[0_0_6px_#F4B400]",
    down:        "bg-[#D9534F] shadow-[0_0_6px_#D9534F]",
  }[status];
  return <span className={`h-2 w-2 rounded-full inline-block shrink-0 ${map}`} />;
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    low:    { bg: "#F7F4EF", text: "#50381F", label: "Low" },
    medium: { bg: "#F4B40022", text: "#F4B400", label: "Medium" },
    high:   { bg: "#D9534F22", text: "#D9534F", label: "High" },
  };
  const c = map[severity] ?? map.low;
  return (
    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: c.bg, color: c.text }}>
      {c.label}
    </span>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SystemHealthPage() {
  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const [refreshing, setRefreshing] = useState(false);

  const operationalCount = SERVICES.filter((s) => s.status === "operational").length;
  const degradedCount    = SERVICES.filter((s) => s.status === "degraded").length;
  const downCount        = SERVICES.filter((s) => s.status === "down").length;
  const overallStatus    = downCount > 0 ? "Partial Outage" : degradedCount > 0 ? "Degraded Performance" : "All Systems Operational";
  const overallColor     = downCount > 0 ? "#D9534F" : degradedCount > 0 ? "#F4B400" : "#4CAF50";

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setLastRefreshed(new Date());
      setRefreshing(false);
    }, 800);
  };

  // Auto-refresh every 30s
  useEffect(() => {
    const id = setInterval(() => setLastRefreshed(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <>
      {/* Header */}
      <div className="mb-5 flex items-start justify-between">
        <div>
          <h1 className="text-[22px] font-bold m-0 mb-1" style={{ color: "#1E1A16" }}>System Health</h1>
          <p className="text-[13px] m-0" style={{ color: "#6B645B" }}>Real-time infrastructure status across all platform services.</p>
        </div>
        <button
          onClick={handleRefresh}
          className="flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-bold border cursor-pointer transition-colors"
          style={{ borderColor: "#E7DFC8", backgroundColor: "#FFFFFF", color: "#1E1A16" }}
          onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#F7F4EF")}
          onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#FFFFFF")}
        >
          <RefreshCw size={13} className={refreshing ? "animate-spin" : ""} style={{ color: "#6B645B" }} />
          Refresh
        </button>
      </div>

      {/* Overall status banner */}
      <div
        className="rounded-xl border px-5 py-4 mb-6 flex items-center gap-3"
        style={{ backgroundColor: `${overallColor}10`, borderColor: `${overallColor}30` }}
      >
        <div className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${overallColor}20` }}>
          {downCount > 0 || degradedCount > 0
            ? <AlertTriangle size={18} style={{ color: overallColor }} />
            : <CheckCircle2 size={18} style={{ color: overallColor }} />
          }
        </div>
        <div>
          <div className="font-bold text-[15px]" style={{ color: overallColor }}>{overallStatus}</div>
          <div className="text-[12px] mt-0.5" style={{ color: "#6B645B" }}>
            {operationalCount} operational · {degradedCount} degraded · {downCount} down
            <span className="ml-3" style={{ color: "#6B645B" }}>Last updated: {lastRefreshed.toLocaleTimeString()}</span>
          </div>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Activity, label: "Platform Uptime",   value: "99.96%",   accent: "#4CAF50" },
          { icon: Zap,      label: "Avg API Latency",   value: "142ms",    accent: "#F4B400" },
          { icon: Server,   label: "Active Channels",   value: "48",       accent: "#50381F" },
          { icon: Globe2,   label: "Regions Online",    value: "2 / 2",    accent: "#6B645B" },
        ].map((item) => (
          <div key={item.label} className="bg-[#FFFFFF] rounded-xl border p-4" style={{ borderColor: "#E7DFC8" }}>
            <div className="flex items-center gap-2 mb-2">
              <div className="h-7 w-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.accent}18` }}>
                <item.icon size={13} style={{ color: item.accent }} />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider" style={{ color: "#6B645B" }}>{item.label}</span>
            </div>
            <div className="text-[1.4rem] font-bold" style={{ color: "#1E1A16" }}>{item.value}</div>
          </div>
        ))}
      </div>

      {/* Service status table */}
      <div className="bg-[#FFFFFF] rounded-xl border overflow-hidden mb-5" style={{ borderColor: "#E7DFC8" }}>
        <div className="px-5 py-4 border-b" style={{ borderColor: "#E7DFC8" }}>
          <h2 className="text-[14px] font-bold m-0" style={{ color: "#1E1A16" }}>Service Status</h2>
        </div>
        <table className="w-full border-collapse text-[13px]">
          <thead>
            <tr className="border-b" style={{ backgroundColor: "#F7F4EF", borderColor: "#E7DFC8" }}>
              <th className="text-left text-[11px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: "#6B645B" }}>Service</th>
              <th className="text-left text-[11px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: "#6B645B" }}>Status</th>
              <th className="text-left text-[11px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: "#6B645B" }}>Region</th>
              <th className="text-right text-[11px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: "#6B645B" }}>Latency</th>
              <th className="text-right text-[11px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: "#6B645B" }}>Uptime</th>
            </tr>
          </thead>
          <tbody>
            {SERVICES.map((svc, i) => (
              <tr key={svc.name} className={`hover:bg-[#F7F4EF]/70 transition-colors ${i < SERVICES.length - 1 ? "border-b" : ""}`} style={{ borderColor: "#E7DFC8" }}>
                <td className="px-5 py-3.5">
                  <span className="font-bold" style={{ color: "#1E1A16" }}>{svc.name}</span>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <StatusDot status={svc.status} />
                    <span className="text-[12px] font-bold capitalize" style={{
                      color: svc.status === "operational" ? "#4CAF50" : svc.status === "degraded" ? "#F4B400" : "#D9534F"
                    }}>
                      {svc.status}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-1.5">
                    <Globe2 size={11} style={{ color: "#6B645B" }} />
                    <span className="text-[12px] font-mono" style={{ color: "#6B645B" }}>{svc.region}</span>
                  </div>
                </td>
                <td className="px-4 py-3.5 text-right">
                  <span className="text-[13px] font-bold" style={{ color: svc.latency > 400 ? "#F4B400" : "#1E1A16" }}>
                    {svc.latency}ms
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <span className="text-[12px] font-bold" style={{ color: svc.uptime < 99.9 ? "#F4B400" : "#4CAF50" }}>
                    {svc.uptime}%
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Incident log */}
      <div className="bg-[#FFFFFF] rounded-xl border overflow-hidden" style={{ borderColor: "#E7DFC8" }}>
        <div className="px-5 py-4 border-b flex items-center justify-between" style={{ borderColor: "#E7DFC8" }}>
          <div className="flex items-center gap-2">
            <Clock size={14} style={{ color: "#6B645B" }} />
            <h2 className="text-[14px] font-bold m-0" style={{ color: "#1E1A16" }}>Incident Log</h2>
          </div>
          {INCIDENT_LOG.some((i) => !i.resolved) && (
            <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#F4B40022", color: "#F4B400" }}>
              {INCIDENT_LOG.filter((i) => !i.resolved).length} open
            </span>
          )}
        </div>
        <div className="divide-y" style={{ borderColor: "#E7DFC8" }}>
          {INCIDENT_LOG.map((inc) => (
            <div key={inc.id} className="px-5 py-3.5 flex items-center gap-3">
              <div className={`h-2 w-2 rounded-full shrink-0`} style={{ backgroundColor: inc.resolved ? "#4CAF50" : "#F4B400" }} />
              <div className="flex-1 min-w-0">
                <span className="text-[13px]" style={{ color: "#1E1A16" }}>{inc.title}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <SeverityBadge severity={inc.severity} />
                <span className="text-[11px] whitespace-nowrap" style={{ color: "#6B645B" }}>{inc.time}</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: inc.resolved ? "#4CAF5022" : "#F4B40022", color: inc.resolved ? "#4CAF50" : "#F4B400" }}>
                  {inc.resolved ? "Resolved" : "Open"}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
