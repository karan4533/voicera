import {
  Utensils, Landmark, ShoppingBag, Headphones, Stethoscope,
  Building2, Shield, Users, CreditCard, Cpu, Bot,
} from "lucide-react";
import { PageHeader } from "../components/shared/PageHeader";
import { useAgent } from "../context/AgentContext";
import type { AgentDefinition } from "../lib/types";

// ── Icon map ───────────────────────────────────────────────────────────────────

const ICON_MAP: Record<string, React.ElementType> = {
  Utensils, Landmark, ShoppingBag, HeadphonesIcon: Headphones,
  Stethoscope, Building2, Shield, Users, CreditCard, Cpu, Bot,
};

function AgentIcon({ name, size = 18 }: { name: string; size?: number }) {
  const Icon = ICON_MAP[name] ?? Bot;
  return <Icon size={size} />;
}



// ── Agent Card ─────────────────────────────────────────────────────────────────

function AgentCard({
  agent,
  onSelect,
  isSelected,
}: {
  agent: AgentDefinition;
  onSelect: () => void;
  isSelected: boolean;
}) {
  return (
    <div className={`bg-white border rounded-xl p-5 flex flex-col gap-4 transition-colors relative ${isSelected ? "border-[#50381F] shadow-sm" : "border-[#E2DDD5] hover:border-[#C9B99E]"}`}>
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div
            className="h-10 w-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: `${agent.color}18`, color: agent.color }}
          >
            <AgentIcon name={agent.icon} size={20} />
          </div>
          <div>
            <h3 className="m-0 text-[14px] font-bold text-[#1E1A14]">{agent.name}</h3>
            <p className="m-0 mt-0.5 text-[11px] text-[#9E9890]">{agent.category}</p>
          </div>
        </div>
      </div>

      {/* Description */}
      <p className="m-0 text-[12px] text-[#7A746C] leading-relaxed line-clamp-2">{agent.description}</p>

      {/* Stats */}
      {agent.status === "active" && (
        <div className="grid grid-cols-3 gap-2 bg-[#F7F4EF] rounded-lg p-3">
          <div className="text-center">
            <p className="m-0 text-[11px] text-[#9E9890]">Today</p>
            <p className="m-0 text-[14px] font-bold text-[#1E1A14]">{agent.stats.callsToday}</p>
          </div>
          <div className="text-center border-x border-[#E2DDD5]">
            <p className="m-0 text-[11px] text-[#9E9890]">Resolved</p>
            <p className="m-0 text-[14px] font-bold text-[#50381F]">{agent.stats.resolutionRate}%</p>
          </div>
          <div className="text-center">
            <p className="m-0 text-[11px] text-[#9E9890]">Avg Duration</p>
            <p className="m-0 text-[14px] font-bold text-[#1E1A14]">{agent.stats.avgDuration}</p>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-[#F0EDE8]">
        <button
          onClick={onSelect}
          disabled={isSelected}
          className={`w-full h-9 rounded-lg text-[13px] font-medium transition-colors cursor-pointer border-none ${
            isSelected 
              ? "bg-[#EDE4D8] text-[#50381F] cursor-default" 
              : "bg-[#50381F] text-white hover:bg-[#3D2914]"
          }`}
        >
          {isSelected ? "Current Agent" : "Select Agent"}
        </button>
      </div>
    </div>
  );
}



// ── Page ──────────────────────────────────────────────────────────────────────

export function AgentsPage() {
  const { agent, setAgent, agentDefs } = useAgent();

  const filtered = agentDefs;

  return (
    <>
      <PageHeader
        title="Agent Management"
        subtitle="Select and configure your AI agents"
      />

      {/* Agent cards grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-8">
        {filtered.map((agentDef) => (
          <AgentCard
            key={agentDef.id}
            agent={agentDef}
            isSelected={agentDef.type === agent}
            onSelect={() => setAgent(agentDef.type)}
          />
        ))}
        {filtered.length === 0 && (
          <div className="col-span-3 py-16 text-center text-[#9E9890]">
            <Bot size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-[14px] font-medium">No agents in this category</p>
          </div>
        )}
      </div>

    </>
  );
}
