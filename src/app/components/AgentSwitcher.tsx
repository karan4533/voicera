import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Bot } from "lucide-react";
import { useAgent } from "../context/AgentContext";
import type { AgentType } from "../lib/types";

/** Elegant agent picker — highlights each option as the cursor moves over it. */
export function AgentSwitcher() {
  const { agent, agentDefs, setAgent } = useAgent();
  const [open, setOpen] = useState(false);
  const [highlighted, setHighlighted] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const activeDef = agentDefs.find((d) => d.type === agent);

  useEffect(() => {
    if (!open) {
      setHighlighted(null);
      return;
    }
    const onDoc = (e: MouseEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (agentDefs.length === 0) {
    return (
      <span className="text-[12px] font-medium text-[#9E9890]">No agents assigned</span>
    );
  }

  const pick = (type: AgentType) => {
    setAgent(type);
    setOpen(false);
  };

  if (agentDefs.length === 1) {
    return (
      <span className="inline-flex items-center gap-1.5 max-w-[200px] h-8 px-2.5 rounded-lg bg-[#EDE4D8]/70 border border-[#E2DDD5]">
        <Bot size={13} className="text-[#50381F] shrink-0" />
        <span className="text-[13px] font-semibold text-[#50381F] truncate">
          {activeDef?.name ?? "Agent"}
        </span>
      </span>
    );
  }

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="vo-lift inline-flex items-center gap-1.5 max-w-[220px] h-8 pl-2 pr-2 rounded-lg border border-[#E2DDD5] bg-white hover:border-[#C9B99E] cursor-pointer"
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label="Switch agent"
      >
        <span
          className="h-1.5 w-1.5 rounded-full shrink-0"
          style={{ backgroundColor: activeDef?.color || "#50381F" }}
        />
        <span className="text-[13px] font-semibold text-[#1E1A14] truncate vo-text-glow">
          {activeDef?.name ?? "Agent"}
        </span>
        <ChevronDown
          size={13}
          className={`text-[#9E9890] shrink-0 transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Agents"
          className="vo-menu-pop absolute left-0 top-[calc(100%+6px)] z-[60] min-w-[220px] max-w-[280px] rounded-xl border border-[#E2DDD5] bg-white shadow-[0_12px_32px_rgba(80,56,31,0.14)] p-1.5"
          onMouseLeave={() => setHighlighted(null)}
        >
          <p className="px-2.5 pt-1.5 pb-1 text-[10px] font-bold uppercase tracking-wider text-[#9E9890]">
            Switch agent
          </p>
          {agentDefs.map((def) => {
            const active = def.type === agent;
            const isHi = highlighted === def.id;
            return (
              <button
                key={def.id}
                type="button"
                role="option"
                aria-selected={active}
                data-active={active}
                data-highlighted={isHi}
                className="vo-option"
                onMouseEnter={() => setHighlighted(def.id)}
                onMouseLeave={() => setHighlighted((h) => (h === def.id ? null : h))}
                onFocus={() => setHighlighted(def.id)}
                onClick={() => pick(def.type)}
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0 transition-transform duration-150"
                  style={{
                    backgroundColor: def.color || "#50381F",
                    transform: active || isHi ? "scale(1.3)" : "scale(1)",
                  }}
                />
                <span className="vo-option-label min-w-0 flex-1 truncate">{def.name}</span>
                {active && <Check size={14} className="text-[#50381F] shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
