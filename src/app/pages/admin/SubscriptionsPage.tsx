import { useState } from "react";
import {
  Search, Plus, X, Check, Package,
  ChevronDown, AlertCircle,
} from "lucide-react";
import { MOCK_ORGANISATIONS, type MockOrganisation } from "../../lib/rbac";
import { AGENT_TYPES } from "../../context/AgentContext";
import type { AgentType } from "../../lib/types";
import { CreateAccountModal } from "./CreateAccountModal";

// ── Agent checkbox in the assignment modal ─────────────────────────────────────

function AgentCheckbox({
  agentType, checked, onChange,
}: {
  agentType: typeof AGENT_TYPES[number]; checked: boolean; onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all cursor-pointer ${
        checked ? "bg-[#F7F4EF]" : "bg-[#FFFFFF]"
      }`}
      style={{ borderColor: checked ? "#50381F" : "#E7DFC8" }}
    >
      <div
        className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${agentType.color}15`, color: agentType.color }}
      >
        <Package size={14} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-bold truncate" style={{ color: "#1E1A16" }}>{agentType.label}</div>
        <div className="text-[10px]" style={{ color: "#6B645B" }}>{agentType.category}</div>
      </div>
      <div
        className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0`}
        style={{ 
          borderColor: checked ? "#50381F" : "#E7DFC8", 
          backgroundColor: checked ? "#50381F" : "#FFFFFF" 
        }}
      >
        {checked && <Check size={10} color="white" strokeWidth={3} />}
      </div>
    </button>
  );
}

// ── Assignment Modal ───────────────────────────────────────────────────────────

function AssignModal({
  org, onClose,
}: {
  org: MockOrganisation; onClose: () => void;
}) {
  const [selected, setSelected] = useState<Set<AgentType>>(
    new Set(org.subscribedAgents)
  );

  const toggle = (id: AgentType, val: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      val ? next.add(id) : next.delete(id);
      return next;
    });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-[560px] mx-4 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal header */}
        <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "#E7DFC8" }}>
          <div>
            <div className="font-bold text-[16px]" style={{ color: "#1E1A16" }}>Manage Agent Access</div>
            <div className="text-[12px] mt-0.5" style={{ color: "#6B645B" }}>{org.name}</div>
          </div>
          <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-[#F7F4EF] cursor-pointer border-none bg-transparent transition-colors">
            <X size={16} color="#6B645B" />
          </button>
        </div>

        {/* Agent list */}
        <div className="flex-1 overflow-y-auto px-6 py-4">
          <p className="text-[12px] mb-3" style={{ color: "#6B645B" }}>Select which AI agents this organisation can access:</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {AGENT_TYPES.map((at) => (
              <AgentCheckbox
                key={at.id}
                agentType={at}
                checked={selected.has(at.id as AgentType)}
                onChange={(v) => toggle(at.id as AgentType, v)}
              />
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t shrink-0 flex items-center justify-between" style={{ borderColor: "#E7DFC8" }}>
          <span className="text-[12px]" style={{ color: "#6B645B" }}>
            <strong style={{ color: "#1E1A16" }}>{selected.size}</strong> agent{selected.size !== 1 ? "s" : ""} selected
          </span>
          <div className="flex gap-3">
            <button onClick={onClose} className="h-9 px-4 rounded-lg border text-[13px] font-bold cursor-pointer transition-colors" style={{ borderColor: "#E7DFC8", backgroundColor: "#FFFFFF", color: "#1E1A16" }}>
              Cancel
            </button>
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-lg border-none text-[13px] font-bold text-white cursor-pointer transition-colors"
              style={{ backgroundColor: "#50381F" }}
            >
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function SubscriptionsPage() {
  const [search, setSearch] = useState("");
  const [planFilter, setPlanFilter] = useState("all");
  const [assignOrg, setAssignOrg] = useState<MockOrganisation | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = MOCK_ORGANISATIONS.filter((o) => {
    const q = search.toLowerCase();
    const matchQ = !q || o.name.toLowerCase().includes(q);
    const matchP = planFilter === "all" || o.plan.toLowerCase() === planFilter;
    return matchQ && matchP;
  });

  return (
    <>
      {/* Header */}
      <div className="mb-5">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-[22px] font-bold m-0 mb-1" style={{ color: "#1E1A16" }}>Subscriptions</h1>
            <p className="text-[13px] m-0" style={{ color: "#6B645B" }}>Assign and manage agent access per customer organisation.</p>
          </div>
          <button onClick={() => setShowCreate(true)} className="flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-bold text-white cursor-pointer border-none transition-colors shadow-sm" style={{ backgroundColor: "#50381F" }}>
            <Plus size={14} /> New Subscription / Account
          </button>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2.5 rounded-xl border p-3 mb-5" style={{ backgroundColor: "#ECE6D9", borderColor: "#E7DFC8" }}>
        <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#50381F" }} />
        <p className="text-[12px] m-0" style={{ color: "#1E1A16" }}>
          Each organisation can only access agents listed in their subscription. Adding or removing agents here takes effect immediately.
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative flex-1 min-w-[220px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#6B645B" }} />
          <input
            type="text"
            placeholder="Search organisation..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 h-9 text-[13px] border rounded-lg focus:outline-none transition-colors"
            style={{ borderColor: "#E7DFC8", backgroundColor: "#FFFFFF", color: "#1E1A16", outlineColor: "#50381F" }}
          />
        </div>
        <div className="relative">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="appearance-none h-9 pl-3 pr-8 text-[13px] border rounded-lg focus:outline-none cursor-pointer"
            style={{ borderColor: "#E7DFC8", backgroundColor: "#FFFFFF", color: "#1E1A16" }}
          >
            <option value="all">All Plans</option>
            <option value="starter">Starter</option>
            <option value="growth">Growth</option>
            <option value="enterprise">Enterprise</option>
          </select>
          <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6B645B" }} />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {filtered.map((org) => (
          <div
            key={org.id}
            className="bg-[#FFFFFF] rounded-xl border overflow-hidden"
            style={{ borderColor: "#E7DFC8" }}
          >
            <div className="flex items-start justify-between px-5 py-4 border-b" style={{ borderColor: "#E7DFC8" }}>
              <div>
                <div className="font-bold" style={{ color: "#1E1A16" }}>{org.name}</div>
                <div className="text-[11px] mt-0.5" style={{ color: "#6B645B" }}>{org.email}</div>
              </div>
              <span
                className="text-[11px] font-bold px-2 py-0.5 rounded-md shrink-0"
                style={{
                  backgroundColor: { Starter: "#F7F4EF", Growth: "#ECE6D9", Enterprise: "#4CAF5022" }[org.plan],
                  color: { Starter: "#50381F", Growth: "#1E1A16", Enterprise: "#4CAF50" }[org.plan],
                }}
              >
                {org.plan}
              </span>
            </div>

            <div className="px-5 py-4">
              <p className="text-[11px] font-bold uppercase tracking-wider mb-3" style={{ color: "#6B645B" }}>
                Subscribed Agents ({org.subscribedAgents.length})
              </p>
              <div className="flex flex-wrap gap-2 mb-4">
                {org.subscribedAgents.map((agentId) => {
                  const def = AGENT_TYPES.find((a) => a.id === agentId);
                  if (!def) return null;
                  return (
                    <span
                      key={agentId}
                      className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full border"
                      style={{ color: "#1E1A16", backgroundColor: "#ECE6D9", borderColor: "#E7DFC8" }}
                    >
                      <Check size={10} strokeWidth={3} />
                      {def.label.replace(" Agent", "")}
                    </span>
                  );
                })}
              </div>

              <button
                onClick={() => setAssignOrg(org)}
                className="flex items-center gap-2 h-8 px-3 rounded-lg text-[12px] font-bold cursor-pointer border transition-colors"
                style={{ color: "#1E1A16", borderColor: "#E7DFC8", backgroundColor: "#F7F4EF" }}
                onMouseOver={(e) => (e.currentTarget.style.backgroundColor = "#ECE6D9")}
                onMouseOut={(e) => (e.currentTarget.style.backgroundColor = "#F7F4EF")}
              >
                <Package size={12} /> Manage Agent Access
              </button>
            </div>
          </div>
        ))}
      </div>

      {assignOrg && (
        <AssignModal org={assignOrg} onClose={() => setAssignOrg(null)} />
      )}
      {showCreate && (
        <CreateAccountModal onClose={() => setShowCreate(false)} />
      )}
    </>
  );
}
