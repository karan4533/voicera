import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AgentType, AgentDefinition, AgentStatus } from "../lib/types";

const AGENT_KEY = "vocera_selected_agent";

// ── Full Agent Catalog ─────────────────────────────────────────────────────────

export const AGENT_TYPES: { id: AgentType; label: string; category: string; icon: string; color: string; description: string }[] = [
  { id: "restaurant",       label: "Restaurant Agent",       category: "Food & Beverage",  icon: "Utensils",       color: "#16A34A", description: "Order taking, reservations, and delivery management" },
  { id: "loan",             label: "Loan Collection Agent",  category: "Finance",          icon: "Landmark",       color: "#2563EB", description: "EMI reminders, payment commitments, and follow-ups" },
  { id: "shop",             label: "Shop Agent",             category: "Retail",           icon: "ShoppingBag",    color: "#9333EA", description: "Product queries, orders, and customer support" },
  { id: "customer-support", label: "Customer Support Agent", category: "Support",          icon: "HeadphonesIcon", color: "#0891B2", description: "Issue resolution, escalation, and satisfaction" },
  { id: "healthcare",       label: "Healthcare Agent",       category: "Healthcare",       icon: "Stethoscope",    color: "#DC2626", description: "Appointment booking, reminders, and patient follow-up" },
  { id: "real-estate",      label: "Real Estate Agent",      category: "Real Estate",      icon: "Building2",      color: "#D97706", description: "Property enquiries, site visits, and lead nurturing" },
  { id: "insurance",        label: "Insurance Agent",        category: "Insurance",        icon: "Shield",         color: "#7C3AED", description: "Policy renewals, claims, and customer onboarding" },
  { id: "hr",               label: "HR Agent",               category: "Human Resources",  icon: "Users",          color: "#059669", description: "Candidate screening, scheduling, and HR queries" },
  { id: "banking",          label: "Banking Agent",          category: "Finance",          icon: "CreditCard",     color: "#1D4ED8", description: "Account services, fraud alerts, and support" },
  { id: "custom",           label: "Custom Agent",           category: "Enterprise",       icon: "Cpu",            color: "#50381F", description: "Fully configurable agent for any business domain" },
];

// ── Active deployed agents (mock initial state) ────────────────────────────────

export const AGENTS: { id: AgentType; label: string }[] = [
  { id: "restaurant", label: "Restaurant Ordering" },
  { id: "loan",       label: "AI Feedback" },
];

// ── Default agent definitions ──────────────────────────────────────────────────

const defaultAgentDefs: AgentDefinition[] = [
  {
    id: "agent-restaurant-1",
    name: "Restaurant Ordering",
    type: "restaurant",
    category: "Food & Beverage",
    description: "Handles inbound order calls, table reservations, and delivery queries for the restaurant.",
    icon: "Utensils",
    color: "#16A34A",
    status: "active",
    stats: { callsToday: 48, resolutionRate: 94, avgDuration: "02:48" },
    tone: "Friendly & Warm",
    languages: ["English", "Hindi", "Tamil"],
    createdAt: "Jun 1, 2026",
  },
  {
    id: "agent-loan-1",
    name: "AI Feedback",
    type: "loan",
    category: "Finance",
    description: "Follows up on overdue EMIs, collects payment commitments, and avoids escalation.",
    icon: "Landmark",
    color: "#2563EB",
    status: "active",
    stats: { callsToday: 21, resolutionRate: 78, avgDuration: "06:10" },
    tone: "Professional & Empathetic",
    languages: ["English", "Hindi", "Gujarati"],
    createdAt: "Jun 5, 2026",
  },
];

// ── Context ────────────────────────────────────────────────────────────────────

interface AgentContextValue {
  agent: AgentType;
  agentLabel: string;
  setAgent: (agent: AgentType) => void;
  agentDefs: AgentDefinition[];
  addAgentDef: (def: Omit<AgentDefinition, "id" | "createdAt" | "stats">) => void;
  updateAgentStatus: (id: string, status: AgentStatus) => void;
  cloneAgent: (id: string) => void;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agent, setAgentState] = useState<AgentType>(() => {
    const stored = sessionStorage.getItem(AGENT_KEY) as AgentType | null;
    return stored && AGENTS.some((a) => a.id === stored) ? stored : "restaurant";
  });

  const [agentDefs, setAgentDefs] = useState<AgentDefinition[]>(defaultAgentDefs);

  const setAgent = useCallback((a: AgentType) => {
    setAgentState(a);
    sessionStorage.setItem(AGENT_KEY, a);
  }, []);

  const addAgentDef = useCallback((def: Omit<AgentDefinition, "id" | "createdAt" | "stats">) => {
    const newDef: AgentDefinition = {
      ...def,
      id: `agent-${def.type}-${Date.now()}`,
      createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
      stats: { callsToday: 0, resolutionRate: 0, avgDuration: "00:00" },
    };
    setAgentDefs((prev) => [newDef, ...prev]);
  }, []);

  const updateAgentStatus = useCallback((id: string, status: AgentStatus) => {
    setAgentDefs((prev) => prev.map((d) => d.id === id ? { ...d, status } : d));
  }, []);

  const cloneAgent = useCallback((id: string) => {
    setAgentDefs((prev) => {
      const original = prev.find((d) => d.id === id);
      if (!original) return prev;
      const cloned: AgentDefinition = {
        ...original,
        id: `agent-${original.type}-${Date.now()}`,
        name: `${original.name} (Copy)`,
        status: "draft",
        createdAt: new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }),
        stats: { callsToday: 0, resolutionRate: 0, avgDuration: "00:00" },
      };
      return [cloned, ...prev];
    });
  }, []);

  const agentLabel = AGENTS.find((a) => a.id === agent)?.label ?? "Restaurant Ordering";

  return (
    <AgentContext.Provider value={{ agent, agentLabel, setAgent, agentDefs, addAgentDef, updateAgentStatus, cloneAgent }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within AgentProvider");
  return ctx;
}
