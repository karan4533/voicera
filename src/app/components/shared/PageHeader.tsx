import type { ReactNode } from "react";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle: string; action?: ReactNode }) {
  return (
    <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
      <div className="min-w-0">
        <h1 className="m-0 text-[1.375rem] font-semibold tracking-tight text-[#1E1A14] leading-snug">
          {title}
        </h1>
        <p className="mt-1 mb-0 text-[13px] text-[#7A746C] leading-relaxed max-w-2xl">
          {subtitle}
        </p>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

export function MetricCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent?: boolean }) {
  return (
    <div className="vo-card flex flex-col justify-between px-4 py-3.5 min-h-[84px]">
      <span className="text-[11px] font-medium text-[#7A746C] uppercase tracking-wider">{label}</span>
      <span className={`text-[1.5rem] font-semibold leading-none tracking-tight ${accent ? "text-[#50381F]" : "text-[#1E1A14]"}`}>
        {value}
      </span>
      {sub && <span className="text-[11px] text-[#9E9890] mt-0.5">{sub}</span>}
    </div>
  );
}

export const metricsGridClass = "mb-4 grid grid-cols-2 gap-3 sm:mb-5 lg:grid-cols-4";
export const metricsGrid3Class = "mb-4 grid grid-cols-1 gap-3 sm:mb-5 sm:grid-cols-3";
export const metricsGrid6Class = "mb-4 grid grid-cols-2 gap-3 sm:mb-5 sm:grid-cols-3 xl:grid-cols-6";
export const metricsGrid5Class = "mb-4 grid grid-cols-2 gap-3 sm:mb-5 sm:grid-cols-3 lg:grid-cols-5";
export const twoColGridClass = "mb-4 grid grid-cols-1 gap-3.5 sm:mb-5 md:grid-cols-2";
export const settingsGridClass = "grid grid-cols-1 gap-3.5 md:grid-cols-2";
