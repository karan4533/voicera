import type { CSSProperties, ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-4 sm:mb-5 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div>
        <h1 className="m-0 text-[1.375rem] font-bold text-[#1E1A14]">
          {title}
        </h1>
        <p className="mt-1 text-[13px] text-[#7A746C]">
          {subtitle}
        </p>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex h-20 flex-col justify-between rounded-[10px] border border-[#E2DDD5] bg-white px-4 py-3.5">
      <span className="text-[11px] font-medium text-[#7A746C]">{label}</span>
      <span className="text-[1.625rem] font-bold leading-none tracking-tight text-[#1E1A14]">
        {value}
      </span>
    </div>
  );
}

export const metricsGridClass = "mb-4 grid grid-cols-2 gap-3 sm:mb-5 lg:grid-cols-4";

export const metricsGrid5Class = "mb-4 grid grid-cols-2 gap-3 sm:mb-5 sm:grid-cols-3 lg:grid-cols-5";

export const twoColGridClass = "mb-4 grid grid-cols-1 gap-3.5 sm:mb-5 md:grid-cols-2";

export const settingsGridClass = "grid grid-cols-1 gap-3.5 md:grid-cols-2";

export const cardStyle: CSSProperties = {
  backgroundColor: "#FFFFFF",
  border: "1px solid #E2DDD5",
  borderRadius: 12,
  overflow: "hidden",
};

export const inputStyle: CSSProperties = {
  height: 40,
  border: "1.5px solid #E2DDD5",
  borderRadius: 8,
  padding: "0 12px",
  fontFamily: "Inter, sans-serif",
  fontSize: 13,
  color: "#1E1A14",
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  backgroundColor: "#fff",
};

export const labelStyle: CSSProperties = {
  fontFamily: "Inter, sans-serif",
  fontWeight: 500,
  fontSize: 13,
  color: "#7A746C",
  marginBottom: 4,
  display: "block",
};

export const primaryBtn: CSSProperties = {
  height: 40,
  padding: "0 16px",
  backgroundColor: "#C8872A",
  borderRadius: 8,
  border: "none",
  color: "#fff",
  fontFamily: "Inter, sans-serif",
  fontWeight: 600,
  fontSize: 13,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

export const secondaryBtn: CSSProperties = {
  height: 40,
  padding: "0 16px",
  backgroundColor: "#fff",
  borderRadius: 8,
  border: "1px solid #E2DDD5",
  color: "#1E1A14",
  fontFamily: "Inter, sans-serif",
  fontWeight: 500,
  fontSize: 13,
  cursor: "pointer",
  display: "inline-flex",
  alignItems: "center",
  gap: 6,
};

