const styles: Record<string, { bg: string; color: string }> = {
  Active: { bg: "#DCFCE7", color: "#15803D" },
  Ringing: { bg: "#FFEDD5", color: "#C2410C" },
  Hold: { bg: "#DBEAFE", color: "#1D4ED8" },
  Completed: { bg: "#F3F4F6", color: "#4B5563" },
  idle: { bg: "#F3F4F6", color: "#6B7280" },
  pending: { bg: "#F3F4F6", color: "#6B7280" },
  indexing: { bg: "#DBEAFE", color: "#1D4ED8" },
  indexed: { bg: "#DCFCE7", color: "#15803D" },
  error: { bg: "#FEE2E2", color: "#DC2626" },
  completed: { bg: "#DCFCE7", color: "#15803D" },
  committed: { bg: "#DBEAFE", color: "#1D4ED8" },
  "no-answer": { bg: "#FFEDD5", color: "#C2410C" },
  escalated: { bg: "#FEE2E2", color: "#DC2626" },
  connected: { bg: "#DCFCE7", color: "#15803D" },
  syncing: { bg: "#DBEAFE", color: "#1D4ED8" },
  disconnected: { bg: "#F3F4F6", color: "#6B7280" },
};

/** Neutral grey fallback used for any unrecognised status value */
const FALLBACK_STYLE = { bg: "#F3F4F6", color: "#6B7280" };

export function StatusBadge({ status, pulse = false }: { status: string; pulse?: boolean }) {
  const s = styles[status] ?? FALLBACK_STYLE;
  const label = status.charAt(0).toUpperCase() + status.slice(1).replace(/-/g, " ");

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        backgroundColor: s.bg,
        color: s.color,
        borderRadius: 20,
        padding: "2px 10px",
        fontFamily: "Inter, sans-serif",
        fontWeight: 700,
        fontSize: 11,
        whiteSpace: "nowrap",
      }}
    >
      <span
        className={pulse ? "vocera-pulse" : undefined}
        style={{
          width: 6,
          height: 6,
          borderRadius: "50%",
          backgroundColor: s.color,
          display: "inline-block",
        }}
      />
      {label}
    </span>
  );
}
