import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Bot } from "lucide-react";
import { useAgent } from "../context/AgentContext";
import type { AgentType } from "../lib/types";

export function AgentSwitcher() {
  const { agent, setAgent, agentDefs } = useAgent();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const activeDef = agentDefs.find((d) => d.type === agent);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  if (agentDefs.length === 0) {
    return (
      <span className="text-[12px] font-medium text-[#9E9890]">No agents assigned</span>
    );
  }

  if (agentDefs.length === 1) {
    return (
      <span className="flex max-w-[200px] items-center gap-1.5 rounded-md border border-[#E2DDD5] bg-[#F7F4EF] px-2.5 py-1.5 text-[13px] font-medium text-[#1E1A14] sm:max-w-none">
        <span className="truncate">{activeDef?.name ?? "Agent"}</span>
      </span>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex max-w-[200px] items-center gap-1.5 rounded-md border border-[#E2DDD5] bg-[#F7F4EF] px-2.5 py-1.5 text-[13px] font-medium text-[#1E1A14] cursor-pointer hover:border-[#C9B99E] transition-colors sm:max-w-none"
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="truncate">{activeDef?.name ?? "Select agent"}</span>
        <ChevronDown size={14} className="shrink-0 text-[#7A746C]" />
      </button>

      {open && (
        <div
          className="absolute left-0 top-full z-50 mt-1 min-w-[220px] rounded-lg border border-[#E2DDD5] bg-white py-1 shadow-lg"
          role="listbox"
        >
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#9E9890]">
            Your subscribed agents
          </p>
          {agentDefs.map((def) => {
            const selected = def.type === agent;
            return (
              <button
                key={def.id}
                type="button"
                role="option"
                aria-selected={selected}
                onClick={() => {
                  setAgent(def.type as AgentType);
                  setOpen(false);
                }}
                className={`flex w-full items-center gap-2.5 px-3 py-2 text-left border-none cursor-pointer transition-colors ${
                  selected ? "bg-[#F7F4EF]" : "bg-transparent hover:bg-[#FAFAF8]"
                }`}
              >
                <div
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                  style={{ backgroundColor: `${def.color}15`, color: def.color }}
                >
                  <Bot size={13} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="truncate text-[13px] font-semibold text-[#1E1A14]">{def.name}</div>
                  <div className="truncate text-[10px] text-[#9E9890]">{def.category}</div>
                </div>
                {selected && <Check size={14} className="shrink-0 text-[#50381F]" strokeWidth={3} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
