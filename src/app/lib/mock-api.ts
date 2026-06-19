import type {
  ActiveCall,
  AppSettings,
  CallDetail,
  CampaignCustomer,
  CampaignState,
  CampaignStats,
  CompletedCall,
  DataSource,
  KnowledgeFile,
  SystemHealth,
  DashboardMetrics,
  ClientDomain,
  ExtractedEntity,
  TranscriptTurn,
  ReminderContact,
  ReminderDomain,
  ReminderStatus,
} from "./types";

// ── Call Reminders Mock Data ───────────────────────────────────────────────────

let reminderContacts: ReminderContact[] = [
  {
    id: "r1", name: "Amit Sharma", phone: "+91 98765 43210",
    location: "Mumbai, MH", priority: "High",
    tags: ["Overdue 60+", "High Value"], notes: "Prefers morning calls. Very responsive.",
    domain: "loan", status: "pending",
    scheduledAt: "2026-06-12T10:00:00Z",
    attributes: { loanType: "Personal Loan", loanAmount: 250000, emiStatus: "Overdue", followUpDate: "2026-06-15", leadSource: "Branch Walk-in" },
    callHistory: [
      { id: "ch1", calledAt: "2026-06-08 10:32", duration: "02:15", outcome: "No Answer", summary: "Called but no response. Voicemail left." },
    ],
    attemptNumber: 2, totalAttempts: 3,
  },
  {
    id: "r2", name: "Priya Nair", phone: "+91 91234 56789",
    location: "Bangalore, KA", priority: "Normal",
    tags: ["VIP Customer", "Regular"], notes: "Prefers pasta and Italian. Table for 2.",
    domain: "restaurant", status: "pending",
    scheduledAt: "2026-06-12T19:00:00Z",
    attributes: { visitCount: 12, lastVisitDate: "2026-06-01", preferredFood: "Pasta Arrabbiata", reservationHistory: "Monthly regulars" },
    callHistory: [],
    attemptNumber: 1, totalAttempts: 2,
  },

  {
    id: "r6", name: "Meena Krishnan", phone: "+91 88990 11223",
    location: "Chennai, TN", priority: "Normal",
    tags: ["First Contact", "New Lead"], notes: "New inquiry via website contact form.",
    domain: "loan", status: "no-answer",
    scheduledAt: "2026-06-12T15:00:00Z",
    attributes: { loanType: "Home Loan", loanAmount: 3500000, emiStatus: "Prospective", followUpDate: "2026-06-13", leadSource: "Website" },
    callHistory: [
      { id: "ch4", calledAt: "2026-06-11 15:00", duration: "00:30", outcome: "No Answer", summary: "Phone rang but no one picked up. Retry scheduled." },
    ],
    attemptNumber: 1, totalAttempts: 3,
  },
  {
    id: "r7", name: "Suresh Joshi", phone: "+91 96321 47850",
    location: "Pune, MH", priority: "High",
    tags: ["Birthday", "Special Offer"], notes: "Birthday offer call — 20% discount on next visit.",
    domain: "restaurant", status: "pending",
    scheduledAt: "2026-06-12T12:00:00Z",
    attributes: { visitCount: 28, lastVisitDate: "2026-05-15", preferredFood: "Butter Chicken", reservationHistory: "Usually weekends" },
    callHistory: [],
    attemptNumber: 1, totalAttempts: 1,
  },

];

// ── Conversation Scripts ───────────────────────────────────────────────────────

export const PAYMENT_SCRIPT: Omit<TranscriptTurn, "id" | "timestamp">[] = [
  { speaker: "AI",       text: "Namaste! I'm Aria calling from Heuristic Finance. Am I speaking with {name}?" },
  { speaker: "Customer", text: "Yes, this is {firstName}. What's this regarding?" },
  { speaker: "AI",       text: "I'm following up on your EMI payment of ₹{amount} which was due on the 5th. We noticed it hasn't been processed yet." },
  { speaker: "Customer", text: "Yes, I know. I've had some unexpected expenses this month. It's been difficult." },
  { speaker: "AI",       text: "I completely understand. These things happen. Would you be comfortable making a partial payment of ₹{partial} today and the rest by Friday?" },
  { speaker: "Customer", text: "Friday should work for me. Can you send me a payment link?" },
  { speaker: "AI",       text: "Absolutely! I'll send a secure payment link to your registered number right away. Your credit score will also be protected if we process this before the end of the month." },
  { speaker: "Customer", text: "That's good to know. Please send the link. Thank you." },
  { speaker: "AI",       text: "Done! You'll receive the SMS in a moment. Thank you for your time, {firstName}. Have a wonderful day!" },
];

let activeCalls: ActiveCall[] = [
  { id: "1", callerId: "+91 98765 43210", name: "Ramesh Kumar", startedAt: Date.now() - 135000, agent: "Restaurant", language: "Tamil", status: "Active" },
  { id: "2", callerId: "+91 91234 56789", name: "Priya Sharma", startedAt: Date.now() - 108000, agent: "Restaurant", language: "Hindi", status: "Active" },
  { id: "3", callerId: "+91 99887 76655", name: "Arun Dev", startedAt: Date.now() - 32000, agent: "Restaurant", language: "English", status: "Ringing" },
  { id: "4", callerId: "+91 87654 32109", name: "Meena R", startedAt: Date.now() - 310000, agent: "Restaurant", language: "Tamil", status: "Hold" },
];

let completedCalls: CompletedCall[] = [
  { id: "c1", callerId: "+91 90123 45678", name: "Suresh Patel", duration: "03:42", agent: "Restaurant", language: "Gujarati", outcome: "Order Placed", completedAt: "10 min ago" },
  { id: "c2", callerId: "+91 88990 11223", name: "Lakshmi N", duration: "01:55", agent: "Restaurant", language: "Tamil", outcome: "Resolved", completedAt: "25 min ago" },
  { id: "c3", callerId: "+91 77665 44332", name: "Amit Singh", duration: "06:10", agent: "AI Feedback", language: "Hindi", outcome: "Payment Committed", completedAt: "1 hr ago" },
];

const callDetails: Record<string, CallDetail> = {
  c1: {
    id: "c1", callerId: "+91 90123 45678", name: "Suresh Patel", duration: "03:42", agent: "Restaurant", language: "Gujarati", outcome: "Order Placed", date: "2026-06-09 14:32",
    sentiment: 0.82,
    summary: "Customer ordered 2 butter naans and paneer tikka. Confirmed delivery address and 30-min ETA.",
    transcript: "Agent: Welcome to Spice Garden...\nCustomer: I'd like to order butter naan and paneer tikka...\nAgent: Confirmed. Total ₹420. Delivery in 30 minutes.",
    actionItems: [
      { id: "a1", text: "Send order confirmation SMS", done: true },
      { id: "a2", text: "Flag repeat customer for loyalty offer", done: false },
    ],
  },
  c2: {
    id: "c2", callerId: "+91 88990 11223", name: "Lakshmi N", duration: "01:55", agent: "Restaurant", language: "Tamil", outcome: "Resolved", date: "2026-06-09 14:17",
    sentiment: 0.91,
    summary: "Customer inquired about operating hours. Issue resolved without escalation.",
    transcript: "Agent: Vanakkam, how can I help?\nCustomer: What time do you close?\nAgent: We close at 11 PM tonight.",
    actionItems: [{ id: "a3", text: "No follow-up required", done: true }],
  },
  c3: {
    id: "c3", callerId: "+91 77665 44332", name: "Amit Singh", duration: "06:10", agent: "AI Feedback", language: "Hindi", outcome: "Payment Committed", date: "2026-06-09 13:42",
    sentiment: 0.65,
    summary: "Customer committed to pay ₹12,500 by Friday. Escalation avoided after payment plan discussion.",
    transcript: "Agent: This is regarding your overdue payment...\nCustomer: I can pay by Friday...\nAgent: Noted. Sending payment link via SMS.",
    actionItems: [
      { id: "a4", text: "Send payment link SMS", done: true },
      { id: "a5", text: "Schedule follow-up call for Friday", done: false },
    ],
  },
};

let knowledgeFiles: KnowledgeFile[] = [
  { id: "f1", name: "menu-spring-2026.pdf", category: "menu", format: "PDF", size: "2.4 MB", status: "indexed", uploadedAt: "Jun 8, 2026" },
  { id: "f2", name: "combo-offers.xlsx", category: "menu", format: "XLSX", size: "890 KB", status: "indexed", uploadedAt: "Jun 7, 2026" },
  { id: "f3", name: "refund-policy.docx", category: "faq", format: "DOCX", size: "156 KB", status: "indexing", uploadedAt: "Jun 9, 2026" },
  { id: "f4", name: "delivery-faq.txt", category: "faq", format: "TXT", size: "24 KB", status: "pending", uploadedAt: "Jun 9, 2026" },
];

let dataSources: DataSource[] = [
  { id: "ds1", name: "POS DB", description: "Restaurant point-of-sale inventory sync", status: "connected", lastSync: "2 min ago" },
  { id: "ds2", name: "CRM API", description: "Customer profiles and order history", status: "syncing", lastSync: "Syncing now..." },
  { id: "ds3", name: "Delivery API", description: "Real-time delivery status and ETAs", status: "connected", lastSync: "5 min ago" },
];

let campaignCustomers: CampaignCustomer[] = [];
let campaignState: CampaignState = "idle";
let campaignStartedAt: number | null = null;

let settings: AppSettings = {
  sipProvider: "Exotel",
  concurrentChannels: 10,
  inboundDid: "+91 80 4567 8900",
  callRecording: true,
  sttEngine: "Deepgram Nova-2",
  ttsEngine: "ElevenLabs Multilingual v2",
  llmModel: "GPT-4o",
  languages: ["English", "Hindi", "Tamil", "Telugu"],
  agentTone: "Professional & Friendly",
  maxTurnsBeforeEscalation: 8,
  silenceTimeout: 5,
  escalationFallback: "Transfer to human agent",
  callingWindowStart: "09:00",
  callingWindowEnd: "20:00",
  maxDailyAttempts: 3,
  retryInterval: 60,
  outboundConcurrency: 5,
  postCallSms: true,
  traiDndCheck: true,
};

const ALLOWED_FORMATS = ["pdf", "docx", "xlsx", "txt"];
const MAX_FILE_SIZE = 25 * 1024 * 1024;

function delay(ms = 300) {
  return new Promise((r) => setTimeout(r, ms));
}

function randomLatency() {
  return 380 + Math.floor(Math.random() * 120);
}

// ── System Functions ────────────────────────────────────────────────────────────

export async function fetchSystemHealth(): Promise<SystemHealth> {
  await delay(100);
  return {
    status: "healthy",
    activeCalls: activeCalls.length,
    avgLatency: randomLatency(),
  };
}

export async function fetchDashboardMetrics(agent?: string): Promise<DashboardMetrics> {
  await delay(200);
  if (agent === "restaurant") {
    return {
      totalCalls: 840,
      activeCalls: 2,
      connectedCalls: 58,
      pendingFollowUps: 4,
      todayCalls: 48,
      avgDuration: "02:48",
      resolutionRate: 94,
      escalationCount: 0,
      activeChannels: 8,
      avgLatency: 390,
    };
  } else if (agent === "loan") {
    return {
      totalCalls: 405,
      activeCalls: 1,
      connectedCalls: 31,
      pendingFollowUps: 8,
      todayCalls: 21,
      avgDuration: "06:10",
      resolutionRate: 78,
      escalationCount: 3,
      activeChannels: 4,
      avgLatency: 450,
    };
  }
  return {
    totalCalls: 1245,
    activeCalls: 3,
    connectedCalls: 89,
    pendingFollowUps: 12,
    todayCalls: 69,
    avgDuration: "03:56",
    resolutionRate: 87,
    escalationCount: 3,
    activeChannels: 10,
    avgLatency: 418,
  };
}

export async function fetchClientDomains(): Promise<ClientDomain[]> {
  await delay(150);
  return [
    {
      id: "banking",
      name: "AI Feedback",
      description: "Customer feedback, surveys, and evaluation tracking",
      icon: "Building",
      status: "active",
    },
    {
      id: "restaurant",
      name: "Restaurant",
      description: "Order taking, reservations, and delivery management",
      icon: "Utensils",
      status: "active",
    },
  ];
}

export async function fetchExtractedData(agent?: string): Promise<ExtractedEntity[]> {
  await delay(180);
  const data: ExtractedEntity[] = [
    {
      id: "ext-101",
      type: "Booking",
      customerName: "Alice Johnson",
      contact: "+1 555-0101",
      attributes: { "Guests": 4, "Time": "8:00 PM", "Date": "Oct 12", "Requests": "Window Seat" },
      status: "Synced",
      timestamp: "10 mins ago",
      callId: "c2",
    },
    {
      id: "ext-102",
      type: "Payment",
      customerName: "Bob Smith",
      contact: "+1 555-0102",
      attributes: { "Amount Due": "$500", "DPD Bucket": "30-60 Days", "Promise": "Oct 15" },
      status: "Action Required",
      timestamp: "25 mins ago",
      callId: "c1",
    },
    {
      id: "ext-104",
      type: "Order",
      customerName: "Diana Prince",
      contact: "+1 555-0104",
      attributes: { "Items": "2x Pizza, 1x Garlic Bread", "Total": "$42", "Type": "Delivery" },
      status: "Pending",
      timestamp: "2 hours ago",
    },
  ];

  if (agent === "restaurant") {
    return data.filter(d => d.type === "Booking" || d.type === "Order");
  } else if (agent === "loan") {
    return data.filter(d => d.type === "Payment");
  }
  return data;
}

export async function fetchActiveCalls(): Promise<ActiveCall[]> {
  await delay(150);
  // Randomly transition a ringing call to active (simulates call being answered)
  if (Math.random() > 0.7 && activeCalls.length > 2) {
    const idx = Math.floor(Math.random() * activeCalls.length);
    if (activeCalls[idx].status === "Ringing") {
      activeCalls[idx] = { ...activeCalls[idx], status: "Active" };
    }
  }
  return [...activeCalls];
}

export async function fetchCompletedCalls(): Promise<CompletedCall[]> {
  await delay(100);
  return [...completedCalls];
}

export async function endCall(callId: string): Promise<void> {
  await delay(200);
  const call = activeCalls.find((c) => c.id === callId);
  if (!call) return;
  const duration = Math.floor((Date.now() - call.startedAt) / 1000);
  const mins = Math.floor(duration / 60);
  const secs = duration % 60;
  completedCalls.unshift({
    id: `c${Date.now()}`,
    callerId: call.callerId,
    name: call.name,
    duration: `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`,
    agent: call.agent,
    language: call.language,
    outcome: "Ended by operator",
    completedAt: "Just now",
  });
  activeCalls = activeCalls.filter((c) => c.id !== callId);
}

export async function fetchCallDetails(filters?: {
  agent?: string;
  language?: string;
  outcome?: string;
  search?: string;
}): Promise<CallDetail[]> {
  await delay(200);
  let results = Object.values(callDetails);
  if (filters?.agent && filters.agent !== "all") {
    results = results.filter((c) => {
      const filterAgent = filters.agent!.toLowerCase();
      const callAgent = c.agent.toLowerCase();
      if (filterAgent === "loan") {
        return callAgent.includes("loan") || callAgent.includes("feedback");
      }
      return callAgent.includes(filterAgent);
    });
  }
  if (filters?.language && filters.language !== "all") {
    results = results.filter((c) => c.language === filters.language);
  }
  if (filters?.outcome && filters.outcome !== "all") {
    results = results.filter((c) => c.outcome.toLowerCase().includes(filters.outcome!.toLowerCase()));
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase();
    results = results.filter((c) => c.name.toLowerCase().includes(q) || c.callerId.includes(q));
  }
  return results;
}

export async function toggleActionItem(callId: string, itemId: string): Promise<void> {
  await delay(100);
  const call = callDetails[callId];
  if (!call) return;
  const item = call.actionItems.find((i) => i.id === itemId);
  if (item) item.done = !item.done;
}

export async function fetchAnalyticsMetrics(agent?: string) {
  await delay(150);
  if (agent === "restaurant") {
    return {
      avgDuration: "02:48",
      sentimentTrend: "+4.8%",
      escalationCount: 0,
      csatScore: 4.4,
    };
  } else if (agent === "loan") {
    return {
      avgDuration: "06:10",
      sentimentTrend: "+3.0%",
      escalationCount: 1,
      csatScore: 3.3,
    };
  }
  return {
    avgDuration: "03:56",
    sentimentTrend: "+4.2%",
    escalationCount: 1,
    csatScore: 4.0,
  };
}

export async function fetchKnowledgeFiles(): Promise<KnowledgeFile[]> {
  await delay(150);
  knowledgeFiles = knowledgeFiles.map((f) => {
    if (f.status === "indexing" && Math.random() > 0.6) return { ...f, status: "indexed" as const };
    if (f.status === "pending" && Math.random() > 0.8) return { ...f, status: "indexing" as const };
    return f;
  });
  return [...knowledgeFiles];
}

export async function fetchDataSources(): Promise<DataSource[]> {
  await delay(100);
  return [...dataSources];
}

export async function uploadKnowledgeFile(file: File, category: "menu" | "faq"): Promise<KnowledgeFile> {
  await delay(400);
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  if (!ALLOWED_FORMATS.includes(ext)) throw new Error("Unsupported format. Use PDF, DOCX, XLSX, or TXT.");
  if (file.size > MAX_FILE_SIZE) throw new Error("File exceeds 25 MB limit.");

  const newFile: KnowledgeFile = {
    id: `f${Date.now()}`,
    name: file.name,
    category,
    format: ext.toUpperCase(),
    size: file.size > 1024 * 1024 ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` : `${Math.round(file.size / 1024)} KB`,
    status: "pending",
    uploadedAt: "Just now",
  };
  knowledgeFiles.unshift(newFile);
  setTimeout(() => {
    const f = knowledgeFiles.find((x) => x.id === newFile.id);
    if (f) f.status = "indexing";
  }, 2000);
  return newFile;
}

export async function deleteKnowledgeFile(fileId: string): Promise<void> {
  await delay(200);
  knowledgeFiles = knowledgeFiles.filter((f) => f.id !== fileId);
}

export async function reindexKnowledgeFile(fileId: string): Promise<void> {
  await delay(200);
  const f = knowledgeFiles.find((x) => x.id === fileId);
  if (f) f.status = "indexing";
}

export async function importCampaignCsv(rows: Record<string, string>[]): Promise<CampaignCustomer[]> {
  await delay(300);
  campaignCustomers = rows.map((row, i) => ({
    id: `cust-${i}`,
    name: row.name || row.customer_name || "Unknown",
    phone: row.phone || row.phone_number || "",
    amountDue: Number(row.amount_due || row.amount || 0),
    dpdBucket: row.dpd_bucket || row.dpd || "30+",
    status: "pending" as const,
    attempts: 0,
  }));
  campaignState = "idle";
  campaignStartedAt = null;
  return campaignCustomers;
}

export function getCampaignState(): CampaignState {
  return campaignState;
}

export function getCampaignStats(): CampaignStats {
  const stats: CampaignStats = { completed: 0, committed: 0, noAnswer: 0, escalated: 0, pending: 0, total: campaignCustomers.length };
  const map: Record<CampaignCustomer["status"], keyof Omit<CampaignStats, "total">> = {
    completed: "completed",
    committed: "committed",
    "no-answer": "noAnswer",
    escalated: "escalated",
    pending: "pending",
  };
  campaignCustomers.forEach((c) => { stats[map[c.status]]++; });
  return stats;
}

export async function fetchCampaignCustomers(): Promise<CampaignCustomer[]> {
  await delay(100);
  if (campaignState === "running" && campaignCustomers.length > 0 && Math.random() > 0.5) {
    const pending = campaignCustomers.find((c) => c.status === "pending");
    if (pending) {
      const outcomes: CampaignCustomer["status"][] = ["completed", "committed", "no-answer", "escalated"];
      pending.status = outcomes[Math.floor(Math.random() * outcomes.length)];
      pending.attempts += 1;
    }
  }
  return [...campaignCustomers];
}

export async function setCampaignState(state: CampaignState): Promise<void> {
  await delay(150);
  campaignState = state;
  if (state === "running" && !campaignStartedAt) campaignStartedAt = Date.now();
  // "stopped" is a transient action — it resets the campaign back to "idle" immediately
  if (state === "stopped") { campaignStartedAt = null; campaignState = "idle"; }
}

export function getEstimatedTimeRemaining(): string {
  const pending = campaignCustomers.filter((c) => c.status === "pending").length;
  if (pending === 0 || campaignState !== "running") return "—";
  const mins = Math.ceil((pending * 45) / (settings.outboundConcurrency * 60));
  return mins < 60 ? `${mins} min` : `${Math.floor(mins / 60)}h ${mins % 60}m`;
}

export async function fetchSettings(): Promise<AppSettings> {
  await delay(100);
  return { ...settings };
}

export async function saveSettings(updated: Partial<AppSettings>): Promise<AppSettings> {
  await delay(300);
  settings = { ...settings, ...updated };
  return { ...settings };
}

// ── Call Reminders Mock Functions ─────────────────────────────────────────────

export async function fetchReminderContacts(): Promise<ReminderContact[]> {
  await delay(250);
  return [...reminderContacts];
}

export async function addReminderContact(
  data: Omit<ReminderContact, "id" | "callHistory" | "attemptNumber" | "totalAttempts">
): Promise<ReminderContact> {
  await delay(300);
  const newContact: ReminderContact = {
    ...data,
    id: `r${Date.now()}`,
    callHistory: [],
    attemptNumber: 0,
    totalAttempts: 3,
  };
  reminderContacts = [newContact, ...reminderContacts];
  return newContact;
}

export async function updateReminderStatus(id: string, status: ReminderStatus): Promise<void> {
  await delay(150);
  reminderContacts = reminderContacts.map((c) =>
    c.id === id ? { ...c, status } : c
  );
}

export async function bulkImportReminders(
  rows: Record<string, string>[],
  domain: ReminderDomain
): Promise<ReminderContact[]> {
  await delay(500);
  const imported: ReminderContact[] = rows
    .filter((r) => r.name && r.phone)
    .map((r, i) => ({
      id: `r_import_${Date.now()}_${i}`,
      name: r.name ?? "Unknown",
      phone: r.phone ?? "",
      location: r.location ?? "",
      priority: (r.priority as ReminderContact["priority"]) ?? "Normal",
      tags: r.tags ? r.tags.split("|").map((t) => t.trim()) : [],
      notes: r.notes ?? "",
      domain,
      status: "pending" as ReminderStatus,
      scheduledAt: r.scheduled_at ?? null,
      attributes: Object.fromEntries(
        Object.entries(r).filter(
          ([k]) => !["name","phone","location","priority","tags","notes","scheduled_at"].includes(k)
        )
      ),
      callHistory: [],
      attemptNumber: 0,
      totalAttempts: 3,
    }));
  reminderContacts = [...imported, ...reminderContacts];
  return imported;
}
