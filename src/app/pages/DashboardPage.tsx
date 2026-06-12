import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { Activity, Calendar, Users, ShoppingBag, MessageSquare, ArrowRight, X } from "lucide-react";
import { PageHeader, MetricCard, cardStyle, metricsGridClass } from "../components/shared/PageHeader";
import { getDashboardMetrics, getExtractedData } from "../lib/api";
import { useAgent } from "../context/AgentContext";
import type { DashboardMetrics, ExtractedEntity } from "../lib/types";

// ── Helpers ───────────────────────────────────────────────────────────────────

const getExtractionIcon = (type: string) => {
  switch (type) {
    case "Booking":  return <Calendar    size={16} color="#4F46E5" />;
    case "Lead":     return <Users       size={16} color="#C8872A" />;
    case "Order":    return <ShoppingBag size={16} color="#15803D" />;
    case "Enquiry":  return <MessageSquare size={16} color="#0369A1" />;
    case "Payment":  return <Activity    size={16} color="#C2410C" />;
    default:         return <Activity    size={16} color="#7A746C" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Synced":
      return <span style={{ fontSize: 11, fontWeight: 600, color: "#15803D", backgroundColor: "#DCFCE7", padding: "2px 8px", borderRadius: 12 }}>Synced</span>;
    case "Action Required":
      return <span style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", backgroundColor: "#FEE2E2", padding: "2px 8px", borderRadius: 12 }}>Action Required</span>;
    case "Pending":
      return <span style={{ fontSize: 11, fontWeight: 600, color: "#C2410C", backgroundColor: "#FFEDD5", padding: "2px 8px", borderRadius: 12 }}>Pending Review</span>;
    default:
      return <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", backgroundColor: "#F3F4F6", padding: "2px 8px", borderRadius: 12 }}>{status}</span>;
  }
};

// ── Page ──────────────────────────────────────────────────────────────────────

export function DashboardPage() {
  const { agent, agentLabel } = useAgent();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedEntity[]>([]);
  const [selectedCall, setSelectedCall] = useState<ExtractedEntity | null>(null);

  const load = useCallback(() => {
    getDashboardMetrics(agent).then(setMetrics);
    getExtractedData(agent).then(setExtractedData);
  }, [agent]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000);
    return () => clearInterval(id);
  }, [load]);

  return (
    <>
      <PageHeader
        title={`${agentLabel} Dashboard`}
        subtitle="Mission control — real-time call stats and extracted customer data"
      />

      {/* Metrics Row */}
      <div className={metricsGridClass} style={{ marginBottom: 24 }}>
        <MetricCard label="Total Calls"       value={metrics ? metrics.totalCalls.toLocaleString() : "—"} />
        <MetricCard label="Active Calls"      value={metrics ? String(metrics.activeCalls)          : "—"} />
        <MetricCard label="Connected Calls"   value={metrics ? String(metrics.connectedCalls)        : "—"} />
        <MetricCard label="Pending Follow-ups" value={metrics ? String(metrics.pendingFollowUps)     : "—"} />
      </div>

      {/* Recent Call Results table */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-3">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1E1A14", margin: 0 }}>Recent Call Results</h2>
              <p style={{ fontSize: 13, color: "#7A746C", margin: "4px 0 0 0" }}>Completed calls and automatically extracted customer data.</p>
            </div>
            <Link
              to="/dashboard/analytics"
              style={{ fontSize: 13, color: "#C8872A", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}
            >
              View All <ArrowRight size={14} />
            </Link>
          </div>

          <div style={{ ...cardStyle, overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ backgroundColor: "#F9F9F7", borderBottom: "1px solid #E2DDD5" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#7A746C", textTransform: "uppercase", letterSpacing: "0.05em" }}>Type</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#7A746C", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#7A746C", textTransform: "uppercase", letterSpacing: "0.05em" }}>Details</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", fontSize: 11, fontWeight: 600, color: "#7A746C", textTransform: "uppercase", letterSpacing: "0.05em" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {extractedData.map((item, i) => (
                  <tr
                    key={item.id}
                    style={{
                      borderBottom: i < extractedData.length - 1 ? "1px solid #F0EDE8" : "none",
                      backgroundColor: selectedCall?.id === item.id ? "#FDF8F3" : "#fff",
                      cursor: "pointer",
                    }}
                    className="hover:bg-[#F9F9F7]"
                    onClick={() => setSelectedCall(item)}
                  >
                    <td style={{ padding: "16px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        {getExtractionIcon(item.type)}
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#1E1A14" }}>{item.type}</span>
                      </div>
                      <div style={{ fontSize: 11, color: "#9E9890", marginTop: 4, marginLeft: 24 }}>{item.timestamp}</div>
                    </td>
                    <td style={{ padding: "16px", verticalAlign: "top" }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: "#1E1A14" }}>{item.customerName}</div>
                      <div style={{ fontSize: 12, color: "#7A746C", fontFamily: "Roboto Mono, monospace", marginTop: 2 }}>{item.contact}</div>
                    </td>
                    <td style={{ padding: "16px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6, maxWidth: 380 }}>
                        {Object.entries(item.attributes).map(([key, value]) => (
                          <div
                            key={key}
                            style={{
                              display: "inline-flex", alignItems: "center", gap: 4,
                              backgroundColor: "#F9F9F7", border: "1px solid #E2DDD5",
                              borderRadius: 6, padding: "2px 8px", fontSize: 12,
                            }}
                          >
                            <span style={{ color: "#7A746C", fontWeight: 500 }}>{key}:</span>
                            <span style={{ color: "#1E1A14", fontWeight: 600 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                    </td>
                    <td style={{ padding: "16px", verticalAlign: "top" }}>
                      {getStatusBadge(item.status)}
                    </td>
                  </tr>
                ))}
                {extractedData.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 32, textAlign: "center", color: "#9E9890", fontSize: 13 }}>
                      No data has been extracted yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Slide-out Panel */}
      {selectedCall !== null && (
        <div className="fixed right-0 top-0 h-full w-[400px] bg-white border-l border-[#E2DDD5] shadow-2xl flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-[#E2DDD5] shrink-0 bg-[#FDFDFD]">
            <div>
              <div className="font-bold text-[16px] text-[#1E1A14]">{selectedCall.customerName}</div>
              <div className="text-[12px] text-[#7A746C]">{selectedCall.contact}</div>
            </div>
            <button
              onClick={() => setSelectedCall(null)}
              className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#F0EDE8] transition-colors cursor-pointer border-none bg-transparent"
            >
              <X size={18} className="text-[#7A746C]" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-6">
            {/* Status & Type */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {getExtractionIcon(selectedCall.type)}
                <span className="text-[14px] font-bold text-[#1E1A14]">{selectedCall.type}</span>
              </div>
              {getStatusBadge(selectedCall.status)}
            </div>

            {/* Extracted Data */}
            <div>
              <h3 className="text-[12px] font-bold text-[#7A746C] uppercase tracking-wider mb-3">Extracted Data</h3>
              <div className="bg-[#F9F9F7] rounded-xl border border-[#E2DDD5] p-4 flex flex-col gap-3">
                {Object.entries(selectedCall.attributes ?? {}).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center border-b border-[#E2DDD5] pb-2 last:border-0 last:pb-0">
                    <span className="text-[13px] text-[#7A746C] font-medium">{key}</span>
                    <span className="text-[13px] text-[#1E1A14] font-semibold">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Summary */}
            <div>
              <h3 className="text-[12px] font-bold text-[#7A746C] uppercase tracking-wider mb-3">AI Summary</h3>
              <div className="bg-[#FDF8F3] border border-[#F0DDC5] rounded-xl p-4 text-[13px] text-[#C8872A] leading-relaxed">
                {selectedCall.summary ?? "Summary generation in progress..."}
              </div>
            </div>

            {/* Full Transcript */}
            <div>
              <h3 className="text-[12px] font-bold text-[#7A746C] uppercase tracking-wider mb-3">Full Transcript</h3>
              <div className="bg-white border border-[#E2DDD5] rounded-xl p-4 max-h-[300px] overflow-y-auto">
                {selectedCall.transcript ? (
                  <div className="flex flex-col gap-3 text-[13px] leading-relaxed">
                    {selectedCall.transcript.split("\n").map((line, idx) => {
                      const isAi = line.startsWith("AI:");
                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-lg ${isAi ? "bg-[#F9F9F7] text-[#4A453E]" : "bg-[#EFF6FF] text-[#1E3A8A] self-end"}`}
                        >
                          <strong>{isAi ? "AI Agent" : "Customer"}:</strong>{" "}
                          {line.replace(/^(AI|Customer):\s*/, "")}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-[13px] text-[#9E9890] italic">Transcript not available yet.</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
