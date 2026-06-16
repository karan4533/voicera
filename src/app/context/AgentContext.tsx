import { createContext, useContext, useState, useCallback, type ReactNode } from "react";
import type { AgentType } from "../lib/types";

const AGENT_KEY = "vocera_selected_agent";

export const AGENTS = [
  { id: "restaurant" as AgentType, label: "Restaurant Ordering" },
  { id: "loan" as AgentType, label: "AI Feedback" },
];

interface AgentContextValue {
  agent: AgentType;
  agentLabel: string;
  setAgent: (agent: AgentType) => void;
}

const AgentContext = createContext<AgentContextValue | null>(null);

export function AgentProvider({ children }: { children: ReactNode }) {
  const [agent, setAgentState] = useState<AgentType>(() => {
    const stored = sessionStorage.getItem(AGENT_KEY) as AgentType | null;
    return stored && AGENTS.some((a) => a.id === stored) ? stored : "restaurant";
  });

  const setAgent = useCallback((a: AgentType) => {
    setAgentState(a);
    sessionStorage.setItem(AGENT_KEY, a);
  }, []);

  const agentLabel = AGENTS.find((a) => a.id === agent)?.label ?? "Restaurant Ordering";

  return (
    <AgentContext.Provider value={{ agent, agentLabel, setAgent }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgent() {
  const ctx = useContext(AgentContext);
  if (!ctx) throw new Error("useAgent must be used within AgentProvider");
  return ctx;
}
