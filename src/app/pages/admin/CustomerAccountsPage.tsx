import { useState } from "react";
import {
  Search, Plus, MoreVertical, ChevronDown,
  CheckCircle2, AlertCircle, Clock, Ban, Users,
  ArrowUpRight, X
} from "lucide-react";
import { MOCK_ORGANISATIONS, type MockOrganisation } from "../../lib/rbac";
import { AGENT_TYPES } from "../../context/AgentContext";
import type { AgentType } from "../../lib/types";
import { CreateAccountModal } from "./CreateAccountModal";

// ── Status badge ───────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: MockOrganisation["status"] }) {
  switch (status) {
    case "active":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#4CAF5022", color: "#4CAF50" }}>
          <CheckCircle2 size={10} /> Active
        </span>
      );
    case "trial":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#F4B40022", color: "#F4B400" }}>
          <Clock size={10} /> Trial
        </span>
      );
    case "suspended":
      return (
        <span className="inline-flex items-center gap-1.5 text-[11px] font-bold px-2.5 py-1 rounded-full" style={{ backgroundColor: "#D9534F22", color: "#D9534F" }}>
          <Ban size={10} /> Suspended
        </span>
      );
  }
}

function PlanBadge({ plan }: { plan: MockOrganisation["plan"] }) {
  const map = {
    Starter:    { bg: "#F7F4EF", text: "#50381F" },
    Growth:     { bg: "#ECE6D9", text: "#1E1A16" },
    Enterprise: { bg: "#4CAF5022", text: "#4CAF50" },
  }[plan];
  return (
    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md" style={{ backgroundColor: map.bg, color: map.text }}>
      {plan}
    </span>
  );
}

function AgentPill({ agentId }: { agentId: AgentType }) {
  const def = AGENT_TYPES.find((a) => a.id === agentId);
  if (!def) return null;
  return (
    <span
      className="inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-md border"
      style={{ color: "#1E1A16", backgroundColor: "#ECE6D9", borderColor: "#E7DFC8" }}
    >
      {def.label.replace(" Agent", "")}
    </span>
  );
}



// ── OrgDrawer ─────────────────────────────────────────────────────────────────

function OrgDrawer({ org, onClose }: { org: MockOrganisation; onClose: () => void }) {
  return (
    <div className="fixed right-0 top-0 h-full w-full md:w-[420px] max-w-[100vw] bg-[#FFFFFF] border-l flex flex-col z-30 overflow-hidden shadow-2xl" style={{ borderColor: "#E7DFC8" }}>
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "#E7DFC8", backgroundColor: "#F7F4EF" }}>
        <div>
          <div className="font-bold text-[16px]" style={{ color: "#1E1A16" }}>{org.name}</div>
          <div className="text-[11px] font-mono mt-0.5" style={{ color: "#6B645B" }}>{org.id}</div>
        </div>
        <button onClick={onClose} className="h-8 w-8 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors cursor-pointer border-none bg-transparent">
          <X size={16} color="#6B645B" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col gap-5">
        <div className="flex items-center gap-3">
          <StatusBadge status={org.status} />
          <PlanBadge plan={org.plan} />
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B645B" }}>Customer Login</p>
          <div className="rounded-xl border p-4" style={{ backgroundColor: "#F7F4EF", borderColor: "#E7DFC8" }}>
            <div className="flex justify-between text-[13px] mb-2">
              <span style={{ color: "#6B645B" }}>Login URL</span>
              <span className="font-mono text-[12px] font-bold" style={{ color: "#50381F" }}>voicera.ai/login</span>
            </div>
            <div className="flex justify-between text-[13px] mb-2">
              <span style={{ color: "#6B645B" }}>Email</span>
              <span className="font-bold font-mono text-[12px]" style={{ color: "#1E1A16" }}>{org.email}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span style={{ color: "#6B645B" }}>Role</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: "#ECE6D9", color: "#50381F" }}>Customer Admin</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B645B" }}>Contact</p>
          <div className="rounded-xl border p-4 flex flex-col gap-2" style={{ backgroundColor: "#F7F4EF", borderColor: "#E7DFC8" }}>
            <div className="flex justify-between text-[13px]">
              <span style={{ color: "#6B645B" }}>Contact Name</span>
              <span className="font-bold" style={{ color: "#1E1A16" }}>{org.contactName}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span style={{ color: "#6B645B" }}>Member Since</span>
              <span className="font-bold" style={{ color: "#1E1A16" }}>{org.createdAt}</span>
            </div>
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B645B" }}>Subscribed Agents</p>
          <div className="flex flex-wrap gap-2">
            {org.subscribedAgents.map((a) => (<AgentPill key={a} agentId={a} />))}
          </div>
        </div>

        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: "#6B645B" }}>Usage</p>
          <div className="rounded-xl border p-4" style={{ backgroundColor: "#F7F4EF", borderColor: "#E7DFC8" }}>
            <div className="flex justify-between text-[13px] mb-2">
              <span style={{ color: "#6B645B" }}>Total Calls</span>
              <span className="font-bold" style={{ color: "#1E1A16" }}>{org.totalCalls.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-[13px]">
              <span style={{ color: "#6B645B" }}>Active Agents</span>
              <span className="font-bold" style={{ color: "#1E1A16" }}>{org.subscribedAgents.length}</span>
            </div>
          </div>
        </div>

        <div className="flex items-start gap-2.5 rounded-xl border p-3" style={{ backgroundColor: "#F4B40022", borderColor: "#F4B400" }}>
          <AlertCircle size={14} className="shrink-0 mt-0.5" style={{ color: "#F4B400" }} />
          <p className="text-[12px] m-0 leading-relaxed" style={{ color: "#F4B400" }}>
            Admin Console shows account &amp; subscription data only. Customer business data (menus, transcripts, records) is not accessible here.
          </p>
        </div>
      </div>

      <div className="shrink-0 border-t p-5 flex flex-col gap-2.5" style={{ borderColor: "#E7DFC8" }}>
        <button className="w-full h-10 rounded-lg text-[13px] font-bold text-white cursor-pointer border-none flex items-center justify-center gap-2 transition-colors" style={{ backgroundColor: "#50381F" }}>
          <ArrowUpRight size={14} /> Manage Subscriptions
        </button>
        <button
          className="w-full h-10 rounded-lg text-[13px] font-bold cursor-pointer border-none transition-colors"
          style={{ backgroundColor: org.status === "suspended" ? "#4CAF5022" : "#D9534F22", color: org.status === "suspended" ? "#4CAF50" : "#D9534F" }}
        >
          {org.status === "suspended" ? "Reactivate Account" : "Suspend Account"}
        </button>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export function CustomerAccountsPage() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedOrg, setSelectedOrg] = useState<MockOrganisation | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const filtered = MOCK_ORGANISATIONS.filter((o) => {
    const q = search.toLowerCase();
    const matchQ = !q || o.name.toLowerCase().includes(q) || o.email.toLowerCase().includes(q) || o.contactName.toLowerCase().includes(q);
    const matchS = statusFilter === "all" || o.status === statusFilter;
    return matchQ && matchS;
  });

  return (
    <div className="flex h-full overflow-hidden relative">
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${selectedOrg ? "md:mr-[420px]" : ""}`}>


        <div className="mb-4 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-[22px] font-bold m-0 mb-1" style={{ color: "#1E1A16" }}>Customer Accounts</h1>
              <p className="text-[13px] m-0" style={{ color: "#6B645B" }}>{MOCK_ORGANISATIONS.length} registered organisations — click <strong style={{ color: "#1E1A16" }}>"New Account"</strong> to create a customer and set their login credentials</p>
            </div>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-lg text-[13px] font-bold text-white cursor-pointer border-none transition-colors shadow-sm"
              style={{ backgroundColor: "#50381F" }}
            >
              <Plus size={14} /> New Account
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 mb-4 shrink-0">
          <div className="relative flex-1 min-w-[220px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: "#6B645B" }} />
            <input
              type="text" placeholder="Search by name, email..."
              value={search} onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-[13px] border rounded-lg bg-white focus:outline-none transition-colors"
              style={{ borderColor: "#E7DFC8", color: "#1E1A16" }}
            />
          </div>
          <div className="relative">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="appearance-none h-9 pl-3 pr-8 text-[13px] border rounded-lg bg-white focus:outline-none cursor-pointer" style={{ borderColor: "#E7DFC8", color: "#1E1A16" }}>
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="trial">Trial</option>
              <option value="suspended">Suspended</option>
            </select>
            <ChevronDown size={13} className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "#6B645B" }} />
          </div>
        </div>

        <div className="flex-1 overflow-auto rounded-xl border shadow-sm" style={{ backgroundColor: "#FFFFFF", borderColor: "#E7DFC8" }}>
          <table className="w-full border-collapse text-[13px]">
            <thead className="sticky top-0 z-10" style={{ backgroundColor: "#F7F4EF" }}>
              <tr className="border-b" style={{ borderColor: "#E7DFC8" }}>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: "#6B645B" }}>Organisation</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: "#6B645B" }}>Login Email</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: "#6B645B" }}>Plan</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: "#6B645B" }}>Agents Access</th>
                <th className="text-left text-[11px] font-bold uppercase tracking-wider px-4 py-3" style={{ color: "#6B645B" }}>Status</th>
                <th className="text-right text-[11px] font-bold uppercase tracking-wider px-5 py-3" style={{ color: "#6B645B" }}>Calls</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16" style={{ color: "#6B645B" }}>
                    <Users size={36} className="mx-auto mb-3 opacity-30" />
                    <p className="text-[14px] font-bold">No accounts found</p>
                    <button onClick={() => setShowCreate(true)} className="mt-2 text-[13px] font-bold border-none bg-transparent cursor-pointer hover:underline" style={{ color: "#50381F" }}>
                      + Create first customer account
                    </button>
                  </td>
                </tr>
              ) : (
                filtered.map((org) => (
                  <tr
                    key={org.id}
                    onClick={() => setSelectedOrg(org)}
                    className="transition-colors cursor-pointer border-b last:border-0 hover:bg-[#F7F4EF]/50"
                    style={{ borderColor: "#E7DFC8", backgroundColor: selectedOrg?.id === org.id ? "#F7F4EF" : "transparent" }}
                  >
                    <td className="px-5 py-3.5">
                      <div className="font-bold" style={{ color: "#1E1A16" }}>{org.name}</div>
                      <div className="text-[11px] mt-0.5" style={{ color: "#6B645B" }}>{org.contactName}</div>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="font-mono text-[12px] font-bold" style={{ color: "#1E1A16" }}>{org.email}</div>
                      <div className="text-[10px] font-bold mt-0.5" style={{ color: "#50381F" }}>Customer Admin</div>
                    </td>
                    <td className="px-4 py-3.5"><PlanBadge plan={org.plan} /></td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-1">
                        {org.subscribedAgents.map((a) => <AgentPill key={a} agentId={a} />)}
                      </div>
                    </td>
                    <td className="px-4 py-3.5"><StatusBadge status={org.status} /></td>
                    <td className="px-5 py-3.5 text-right font-bold" style={{ color: "#1E1A16" }}>{org.totalCalls.toLocaleString()}</td>
                    <td className="px-4 py-3.5">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedOrg(org); }}
                        className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-[#E7DFC8] transition-colors cursor-pointer border-none bg-transparent"
                      >
                        <MoreVertical size={15} style={{ color: "#6B645B" }} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selectedOrg && <OrgDrawer org={selectedOrg} onClose={() => setSelectedOrg(null)} />}
      {showCreate && <CreateAccountModal onClose={() => setShowCreate(false)} />}
    </div>
  );
}
