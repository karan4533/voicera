import { useEffect, useState, useCallback } from "react";
import { Link } from "react-router";
import { Activity, Calendar, Users, ShoppingBag, MessageSquare, ArrowRight, ExternalLink } from "lucide-react";
import { PageHeader, MetricCard, cardStyle, metricsGridClass } from "../components/shared/PageHeader";
import { getDashboardMetrics, getExtractedData } from "../lib/api";
import { useAgent } from "../context/AgentContext";
import type { DashboardMetrics, ExtractedEntity } from "../lib/types";



const getExtractionIcon = (type: string) => {
  switch (type) {
    case "Booking": return <Calendar size={16} color="#4F46E5" />;
    case "Lead": return <Users size={16} color="#C8872A" />;
    case "Order": return <ShoppingBag size={16} color="#15803D" />;
    case "Enquiry": return <MessageSquare size={16} color="#0369A1" />;
    case "Payment": return <Activity size={16} color="#C2410C" />;
    default: return <Activity size={16} color="#7A746C" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "Synced": return <span style={{ fontSize: 11, fontWeight: 600, color: "#15803D", backgroundColor: "#DCFCE7", padding: "2px 8px", borderRadius: 12 }}>Synced</span>;
    case "Action Required": return <span style={{ fontSize: 11, fontWeight: 600, color: "#DC2626", backgroundColor: "#FEE2E2", padding: "2px 8px", borderRadius: 12 }}>Action Required</span>;
    case "Pending": return <span style={{ fontSize: 11, fontWeight: 600, color: "#C2410C", backgroundColor: "#FFEDD5", padding: "2px 8px", borderRadius: 12 }}>Pending Review</span>;
    default: return <span style={{ fontSize: 11, fontWeight: 600, color: "#6B7280", backgroundColor: "#F3F4F6", padding: "2px 8px", borderRadius: 12 }}>{status}</span>;
  }
};

export function DashboardPage() {
  const { agent, agentLabel } = useAgent();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedEntity[]>([]);

  const load = useCallback(() => {
    getDashboardMetrics().then(setMetrics);
    getExtractedData(agent).then(setExtractedData);
  }, [agent]);

  useEffect(() => {
    load();
    const id = setInterval(load, 5000); // Polling for live updates
    return () => clearInterval(id);
  }, [load]);

  return (
    <>
      <PageHeader 
        title={`${agentLabel} Dashboard`}
        subtitle="Mission control for extracted business data and active agents" 
      />

      {/* Global Metrics Row */}
      <div className={metricsGridClass} style={{ marginBottom: 24 }}>
        <MetricCard label="Total Calls Today" value={metrics ? metrics.totalCallsToday.toLocaleString() : "—"} />
        <MetricCard label="Overall CSAT Score" value={metrics ? `${metrics.overallCsat}/5` : "—"} />
        <MetricCard label="Global Avg Latency" value={metrics ? `${metrics.avgLatencyMs} ms` : "—"} />
        <MetricCard label="Active Agents" value={metrics ? String(metrics.activeAgents) : "—"} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Full Width Column: Actionable Data Feed */}
        <div className="lg:col-span-3">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <div>
              <h2 style={{ fontSize: 16, fontWeight: 700, color: "#1E1A14", margin: 0 }}>Recent Extracted Data</h2>
              <p style={{ fontSize: 13, color: "#7A746C", margin: "4px 0 0 0" }}>Leads, bookings, and orders automatically extracted from live calls.</p>
            </div>
            <Link to="/dashboard/analytics" style={{ fontSize: 13, color: "#C8872A", textDecoration: "none", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
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
                  <tr key={item.id} style={{ borderBottom: i < extractedData.length - 1 ? "1px solid #F0EDE8" : "none", backgroundColor: "#fff" }} className="hover:bg-[#F9F9F7]">
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
                          <div key={key} style={{ 
                            display: "inline-flex", alignItems: "center", gap: 4, 
                            backgroundColor: "#F9F9F7", border: "1px solid #E2DDD5", 
                            borderRadius: 6, padding: "2px 8px", fontSize: 12 
                          }}>
                            <span style={{ color: "#7A746C", fontWeight: 500 }}>{key}:</span>
                            <span style={{ color: "#1E1A14", fontWeight: 600 }}>{value}</span>
                          </div>
                        ))}
                      </div>
                      {item.callId && (
                        <Link to={`/dashboard/analytics?call=${item.callId}`} style={{ display: "inline-flex", alignItems: "center", gap: 4, fontSize: 11, fontWeight: 500, color: "#C8872A", marginTop: 8, textDecoration: "none" }}>
                          View Call Transcript <ExternalLink size={10} />
                        </Link>
                      )}
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
    </>
  );
}
