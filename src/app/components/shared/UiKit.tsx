import type { ReactNode } from "react";
import { Search, X } from "lucide-react";

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-14 px-6">
      <div className="h-12 w-12 rounded-2xl bg-[#F7F4EF] border border-[#E2DDD5] flex items-center justify-center mb-3">
        <Icon size={22} className="text-[#9E9890]" aria-hidden />
      </div>
      <p className="m-0 text-[14px] font-semibold text-[#1E1A14]">{title}</p>
      {description && (
        <p className="m-0 mt-1 max-w-sm text-[13px] text-[#7A746C] leading-relaxed">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={`vo-skeleton ${className}`} aria-hidden />;
}

export function MetricSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 mb-5" aria-hidden>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="vo-card p-4 min-h-[92px] flex flex-col gap-3">
          <SkeletonBlock className="h-3 w-20" />
          <SkeletonBlock className="h-7 w-24" />
        </div>
      ))}
    </div>
  );
}

export function SearchField({
  value,
  onChange,
  placeholder,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  id?: string;
}) {
  return (
    <div className="relative w-full max-w-md">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#9E9890] pointer-events-none" aria-hidden />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="vo-input pl-9 pr-9"
        aria-label={placeholder}
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2 top-1/2 -translate-y-1/2 h-7 w-7 flex items-center justify-center rounded-md border-none bg-transparent text-[#9E9890] cursor-pointer hover:text-[#1E1A14]"
          aria-label="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  danger = false,
  confirmId,
  onConfirm,
  onCancel,
}: {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  confirmId?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div
      className="vo-overlay fixed inset-0 z-[200] flex items-center justify-center"
      onClick={onCancel}
    >
      <div
        className="vo-dialog w-[340px] max-w-[92vw] p-6"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
      >
        <h2 id="confirm-dialog-title" className="m-0 mb-2 text-base font-bold text-[#1E1A14]">
          {title}
        </h2>
        <p className="m-0 mb-5 text-[13px] text-[#7A746C] leading-relaxed">{description}</p>
        <div className="flex gap-3 justify-end">
          <button type="button" onClick={onCancel} className="vo-btn vo-btn-secondary h-9">
            {cancelLabel}
          </button>
          <button
            type="button"
            id={confirmId}
            onClick={onConfirm}
            className={`vo-btn h-9 ${danger ? "vo-btn-danger" : "vo-btn-primary"}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
