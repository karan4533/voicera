import { useEffect, useState, useCallback } from "react";
import { Eye, PhoneOff, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router";
import { StatusBadge } from "../components/shared/StatusBadge";
import { PageHeader, MetricCard, cardStyle, metricsGridClass } from "../components/shared/PageHeader";
import { getActiveCalls, getCompletedCalls, endActiveCall } from "../lib/api";
import { formatDuration } from "../lib/csv";
import type { ActiveCall, CompletedCall } from "../lib/types";

export function LiveCallsPage() {
  const navigate = useNavigate();
  const [calls, setCalls] = useState<ActiveCall[]>([]);
  const [completed, setCompleted] = useState<CompletedCall[]>([]);
  const [, setTick] = useState(0);

  const load = useCallback(() => {
    getActiveCalls().then(setCalls);
    getCompletedCalls().then(setCompleted);
  }, []);

  useEffect(() => {
    load();
    const poll = setInterval(load, 5000);
    const timer = setInterval(() => setTick((t) => t + 1), 1000);
    return () => { clearInterval(poll); clearInterval(timer); };
  }, [load]);

  const handleEnd = async (id: string) => {
    await endActiveCall(id);
    load();
  };

  const resolutionRate = completed.length > 0
    ? `${Math.round((completed.filter((c) => c.outcome !== "Ended by operator").length / completed.length) * 100)}%`
    : "92%";

  return (
    <>
      <PageHeader title="Live Calls" subtitle="Real-time monitoring of all active calls" />

      <div className={metricsGridClass}>
        <MetricCard label="Active Calls" value={String(calls.length)} />
        <MetricCard label="Avg Latency" value="420 ms" />
        <MetricCard label="Today's Call Count" value="450" />
        <MetricCard label="Resolution Rate" value={resolutionRate} />
      </div>

      <div style={{ ...cardStyle, marginBottom: 20 }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2DDD5" }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#1E1A14" }}>Active Calls</span>
        </div>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ backgroundColor: "#F9F9F7" }}>
                {["Caller ID", "Customer Name", "Duration", "Agent", "Language", "Status", "Actions"].map((col) => (
                  <th key={col} style={{ fontWeight: 600, fontSize: 10, color: "#7A746C", letterSpacing: "0.06em", textTransform: "uppercase", textAlign: "left", padding: "10px 16px" }}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {calls.map((row, i) => (
                <tr key={row.id} style={{ height: 44, borderBottom: i < calls.length - 1 ? "1px solid #F0EDE8" : "none" }}>
                  <td style={{ padding: "0 16px", fontFamily: "Roboto Mono, monospace", fontSize: 11, color: "#4A453E" }}>{row.callerId}</td>
                  <td style={{ padding: "0 16px", fontSize: 13, color: "#1E1A14" }}>{row.name}</td>
                  <td style={{ padding: "0 16px", fontFamily: "Roboto Mono, monospace", fontSize: 11, color: "#4A453E" }}>
                    {formatDuration(Math.floor((Date.now() - row.startedAt) / 1000))}
                  </td>
                  <td style={{ padding: "0 16px", fontSize: 13, color: "#4A453E" }}>{row.agent}</td>
                  <td style={{ padding: "0 16px", fontSize: 13, color: "#4A453E" }}>{row.language}</td>
                  <td style={{ padding: "0 16px" }}>
                    <StatusBadge status={row.status} pulse={row.status === "Active" || row.status === "Ringing"} />
                  </td>
                  <td style={{ padding: "0 16px" }}>
                    <div className="flex items-center gap-2">
                      <button title="Monitor" style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #E2DDD5", borderRadius: 5, backgroundColor: "#fff", cursor: "pointer", color: "#7A746C" }}>
                        <Eye size={13} />
                      </button>
                      <button title="End call" onClick={() => handleEnd(row.id)} style={{ width: 28, height: 28, display: "flex", alignItems: "center", justifyContent: "center", border: "1px solid #FECACA", borderRadius: 5, backgroundColor: "#FFF5F5", cursor: "pointer", color: "#EF4444" }}>
                        <PhoneOff size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div style={cardStyle}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid #E2DDD5" }}>
          <span style={{ fontWeight: 600, fontSize: 15, color: "#1E1A14" }}>Recent Completed Calls</span>
        </div>
        <div>
          {completed.map((call, i) => (
            <button
              key={call.id}
              onClick={() => navigate(`/dashboard/analytics?call=${call.id}`)}
              style={{ display: "flex", alignItems: "center", width: "100%", padding: "12px 20px", border: "none", borderBottom: i < completed.length - 1 ? "1px solid #F0EDE8" : "none", background: "transparent", cursor: "pointer", textAlign: "left" }}
            >
              <div className="flex-1">
                <div style={{ fontSize: 13, fontWeight: 600, color: "#1E1A14" }}>{call.name}</div>
                <div style={{ fontSize: 11, color: "#7A746C", marginTop: 2 }}>{call.callerId} · {call.duration} · {call.outcome}</div>
              </div>
              <span style={{ fontSize: 11, color: "#9E9890", marginRight: 8 }}>{call.completedAt}</span>
              <ChevronRight size={14} color="#9E9890" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
