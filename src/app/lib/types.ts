export type AgentType = "restaurant" | "loan";

export type CallStatus = "Active" | "Ringing" | "Hold" | "Completed";

export interface ActiveCall {
  id: string;
  callerId: string;
  name: string;
  startedAt: number;
  agent: string;
  language: string;
  status: CallStatus;
}

export interface CompletedCall {
  id: string;
  callerId: string;
  name: string;
  duration: string;
  agent: string;
  language: string;
  outcome: string;
  completedAt: string;
}

export interface ActionItem {
  id: string;
  text: string;
  done: boolean;
}

export interface CallDetail {
  id: string;
  callerId: string;
  name: string;
  duration: string;
  agent: string;
  language: string;
  outcome: string;
  date: string;
  sentiment: number;
  transcript: string;
  summary: string;
  actionItems: ActionItem[];
}

export type IndexStatus = "pending" | "indexing" | "indexed" | "error";

export interface KnowledgeFile {
  id: string;
  name: string;
  category: "menu" | "faq";
  format: string;
  size: string;
  status: IndexStatus;
  uploadedAt: string;
}

export type SyncStatus = "connected" | "syncing" | "error" | "disconnected";

export interface DataSource {
  id: string;
  name: string;
  description: string;
  status: SyncStatus;
  lastSync: string;
}

export interface CampaignCustomer {
  id: string;
  name: string;
  phone: string;
  amountDue: number;
  dpdBucket: string;
  status: "pending" | "completed" | "committed" | "no-answer" | "escalated";
  attempts: number;
}

export type CampaignState = "idle" | "running" | "paused" | "stopped";

export interface CampaignStats {
  completed: number;
  committed: number;
  noAnswer: number;
  escalated: number;
  pending: number;
  total: number;
}

export interface AppSettings {
  sipProvider: string;
  concurrentChannels: number;
  inboundDid: string;
  callRecording: boolean;
  sttEngine: string;
  ttsEngine: string;
  llmModel: string;
  languages: string[];
  agentTone: string;
  maxTurnsBeforeEscalation: number;
  silenceTimeout: number;
  escalationFallback: string;
  callingWindowStart: string;
  callingWindowEnd: string;
  maxDailyAttempts: number;
  retryInterval: number;
  outboundConcurrency: number;
  postCallSms: boolean;
  traiDndCheck: boolean;
}

export interface SystemHealth {
  status: "healthy" | "degraded" | "down";
  activeCalls: number;
  avgLatency: number;
}

export interface DashboardMetrics {
  totalCallsToday: number;
  overallCsat: number;
  avgLatencyMs: number;
  activeAgents: number;
}

export interface ClientDomain {
  id: string;
  name: string;
  description: string;
  icon: string;
  status: "active" | "draft";
}

export interface ExtractedEntity {
  id: string;
  type: "Lead" | "Booking" | "Order" | "Enquiry" | "Payment";
  customerName: string;
  contact: string;
  attributes: Record<string, string | number>;
  status: "Pending" | "Synced" | "Action Required";
  timestamp: string;
  callId?: string;
}
