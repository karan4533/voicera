/**
 * api.ts — Voicera Frontend API Service Layer
 *
 * All data fetching in the app flows through this file.
 * - When VITE_USE_MOCK=true  → delegates to mock-api.ts (for development/demo).
 * - When VITE_USE_MOCK=false → calls the real backend REST API using the
 *   base URL defined in VITE_API_BASE_URL.
 *
 * ─── HOW TO INTEGRATE ────────────────────────────────────────────────────────
 * 1. Set VITE_USE_MOCK=false in your .env.local.
 * 2. Set VITE_API_BASE_URL to your backend URL (e.g. https://api.voicera.ai).
 * 3. Implement each function below by replacing the mock call with a real fetch.
 *    Each function is clearly labelled with the expected HTTP method and path.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import * as mock from "./mock-api";
import { getSession } from "./auth";
import { parseCsv } from "./csv";
import { safeLog } from "./safeLog";
import type {
  ActiveCall,
  CompletedCall,
  CallDetail,
  KnowledgeFile,
  DataSource,
  CampaignCustomer,
  CampaignState,
  CampaignStats,
  AppSettings,
  SystemHealth,
  DashboardMetrics,
  AnalyticsMetrics,
  ClientDomain,
  ExtractedEntity,
  ReminderContact,
  ReminderDomain,
  ReminderStatus,
} from "./types";

// ── Config ────────────────────────────────────────────────────────────────────

const isProd = import.meta.env.PROD;
const USE_MOCK =
  import.meta.env.VITE_USE_MOCK === "true"
    ? !isProd // never allow mock in production builds
    : import.meta.env.VITE_USE_MOCK !== "false" && !isProd;

if (isProd && import.meta.env.VITE_USE_MOCK === "true") {
  safeLog.warn("VITE_USE_MOCK=true is ignored in production builds.");
}
const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string) ?? "http://localhost:8000";
const DEFAULT_TIMEOUT_MS = 12_000;
const RETRY_STATUSES = new Set([408, 429, 502, 503, 504]);

/** Typed API failure so pages can branch on status / network / timeout. */
export class ApiError extends Error {
  readonly status: number | null;
  readonly path: string;
  readonly kind: "http" | "network" | "timeout" | "abort";

  constructor(
    message: string,
    opts: { status?: number | null; path?: string; kind?: ApiError["kind"] },
  ) {
    super(message);
    this.name = "ApiError";
    this.status = opts.status ?? null;
    this.path = opts.path ?? "";
    this.kind = opts.kind ?? "http";
  }
}

export function isApiError(err: unknown): err is ApiError {
  return err instanceof ApiError;
}

/** User-facing copy for banners / toasts. */
export function getFriendlyApiMessage(err: unknown): string {
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return "You appear to be offline. Check your connection and try again.";
  }
  if (isApiError(err)) {
    if (err.kind === "timeout") return "The server took too long to respond. Please try again.";
    if (err.kind === "network") return "Cannot reach the server. It may be down or unreachable.";
    if (err.status === 401) return "Your session expired. Please sign in again.";
    if (err.status === 403) return "You do not have permission for this action.";
    if (err.status === 404) return "The requested resource was not found.";
    if (err.status !== null && err.status >= 500) {
      return "The service is temporarily unavailable. Please try again shortly.";
    }
  }
  if (err instanceof Error && err.message) return err.message;
  return "Something went wrong. Please try again.";
}

type UnauthorizedHandler = () => void;
let unauthorizedHandler: UnauthorizedHandler | null = null;

/** Register once from App (logout + navigate to /login). */
export function setUnauthorizedHandler(handler: UnauthorizedHandler | null) {
  unauthorizedHandler = handler;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function mergeAbortSignals(a?: AbortSignal | null, b?: AbortSignal | null): AbortSignal | undefined {
  if (!a && !b) return undefined;
  if (a && !b) return a;
  if (!a && b) return b;
  const ctrl = new AbortController();
  const onAbort = () => ctrl.abort();
  a!.addEventListener("abort", onAbort);
  b!.addEventListener("abort", onAbort);
  if (a!.aborted || b!.aborted) ctrl.abort();
  return ctrl.signal;
}

interface ApiFetchOptions extends RequestInit {
  /** Override default 12s timeout. */
  timeoutMs?: number;
  /** Extra retries for idempotent GET (default 1). */
  retries?: number;
  /** Skip JSON parse (e.g. 204). */
  emptyResponse?: boolean;
}

/**
 * Authenticated fetch — Bearer token, timeout, GET retry on transient errors,
 * and 401 → registered unauthorized handler (logout / login redirect).
 */
async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const {
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retries,
    emptyResponse,
    signal: userSignal,
    headers: userHeaders,
    ...rest
  } = options;

  const method = (rest.method ?? "GET").toUpperCase();
  const maxAttempts = method === "GET" ? 1 + (retries ?? 1) : 1 + (retries ?? 0);

  let lastError: unknown;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    if (attempt > 0) await sleep(400 * attempt);

    const timeoutCtrl = new AbortController();
    const timer = window.setTimeout(() => timeoutCtrl.abort(), timeoutMs);
    const signal = mergeAbortSignals(userSignal, timeoutCtrl.signal);

    try {
      const session = getSession();
      const headers: Record<string, string> = {
        ...(rest.body instanceof FormData ? {} : { "Content-Type": "application/json" }),
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
        ...(userHeaders as Record<string, string> | undefined),
      };

      const res = await fetch(`${BASE_URL}${path}`, { ...rest, method, headers, signal });

      if (res.status === 401) {
        unauthorizedHandler?.();
        throw new ApiError("Unauthorized", { status: 401, path, kind: "http" });
      }

      if (!res.ok) {
        const body = await res.text().catch(() => "");
        const err = new ApiError(
          `API ${method} ${path} failed [${res.status}]: ${body}`,
          { status: res.status, path, kind: "http" },
        );
        if (attempt < maxAttempts - 1 && RETRY_STATUSES.has(res.status)) {
          lastError = err;
          continue;
        }
        throw err;
      }

      if (emptyResponse || res.status === 204) return undefined as T;
      const text = await res.text();
      if (!text.trim()) return undefined as T;
      return JSON.parse(text) as T;
    } catch (err) {
      if (isApiError(err)) throw err;

      const aborted = err instanceof DOMException && err.name === "AbortError";
      if (aborted && userSignal?.aborted) {
        throw new ApiError("Request cancelled", { path, kind: "abort" });
      }
      if (aborted) {
        const timeoutErr = new ApiError("Request timed out", { path, kind: "timeout" });
        if (attempt < maxAttempts - 1) {
          lastError = timeoutErr;
          continue;
        }
        throw timeoutErr;
      }

      const networkErr = new ApiError(
        err instanceof Error ? err.message : "Network error",
        { path, kind: "network" },
      );
      if (attempt < maxAttempts - 1) {
        lastError = networkErr;
        continue;
      }
      throw networkErr;
    } finally {
      window.clearTimeout(timer);
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new ApiError("Request failed", { path, kind: "network" });
}

// ── Auth ──────────────────────────────────────────────────────────────────────

/**
 * POST /auth/login
 * Body:   { email, password }
 * Returns: { access_token, user: { email, name, role } }
 *
 * ⚠️  TEMPORARY BYPASS — mock mode uses auth.ts directly (no backend needed).
 * To integrate real auth: set VITE_USE_MOCK=false and implement POST /auth/login
 * on the backend returning { access_token, user: { email, name, role } }.
 */
export async function loginUser(email: string, password: string) {
  if (USE_MOCK) {
    // Firebase Authentication handles login in AuthContext — this function is
    // no longer called for auth, but is kept for API-layer completeness.
    return getSession();
  }
  return apiFetch("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

// ── Dashboard ─────────────────────────────────────────────────────────────────

/**
 * GET /dashboard/metrics
 * Returns: { totalCalls, activeCalls, connectedCalls, pendingFollowUps }
 */
export async function getDashboardMetrics(agent?: string): Promise<DashboardMetrics> {
  if (USE_MOCK) return mock.fetchDashboardMetrics(agent);
  return apiFetch<DashboardMetrics>(`/dashboard/metrics${agent ? `?agent=${agent}` : ""}`);
}

/**
 * GET /dashboard/extractions
 * Query params: agent
 * Returns: ExtractedEntity[]  (Bookings, Orders, Payments, etc.)
 */
export async function getExtractedData(agent?: string): Promise<ExtractedEntity[]> {
  if (USE_MOCK) return mock.fetchExtractedData(agent);
  return apiFetch<ExtractedEntity[]>(`/dashboard/extractions${agent ? `?agent=${agent}` : ""}`);
}

/**
 * GET /dashboard/domains
 * Returns: ClientDomain[]
 */
export async function getClientDomains(): Promise<ClientDomain[]> {
  if (USE_MOCK) return mock.fetchClientDomains();
  return apiFetch<ClientDomain[]>("/dashboard/domains");
}

// ── Live Calls ────────────────────────────────────────────────────────────────

/**
 * GET /calls/active
 * Returns: ActiveCall[]
 */
export async function getActiveCalls(): Promise<ActiveCall[]> {
  if (USE_MOCK) return mock.fetchActiveCalls();
  return apiFetch<ActiveCall[]>("/calls/active");
}

/**
 * GET /calls/completed
 * Returns: CompletedCall[]
 */
export async function getCompletedCalls(): Promise<CompletedCall[]> {
  if (USE_MOCK) return mock.fetchCompletedCalls();
  return apiFetch<CompletedCall[]>("/calls/completed");
}

/**
 * POST /calls/:id/end
 * Returns: void
 */
export async function endActiveCall(id: string): Promise<void> {
  if (USE_MOCK) return mock.endCall(id);
  return apiFetch<void>(`/calls/${id}/end`, { method: "POST" });
}

// ── Analytics ─────────────────────────────────────────────────────────────────

/**
 * GET /analytics/calls
 * Query params: agent, language, outcome, search
 * Returns: CallDetail[]
 */
export async function getCallDetails(filters: Record<string, string>): Promise<CallDetail[]> {
  if (USE_MOCK) return mock.fetchCallDetails(filters as Parameters<typeof mock.fetchCallDetails>[0]);
  const qs = new URLSearchParams(filters).toString();
  return apiFetch<CallDetail[]>(`/analytics/calls?${qs}`);
}

/**
 * GET /analytics/metrics
 * Returns: { avgDuration, sentimentTrend, escalationCount, csatScore }
 */
export async function getAnalyticsMetrics(agent?: string): Promise<AnalyticsMetrics> {
  if (USE_MOCK) return mock.fetchAnalyticsMetrics(agent);
  return apiFetch<AnalyticsMetrics>(`/analytics/metrics?agent=${agent}`);
}

/**
 * POST /analytics/calls/:callId/action-items/:itemId/toggle
 * Returns: void
 */
export async function toggleCallActionItem(callId: string, itemId: string): Promise<void> {
  if (USE_MOCK) return mock.toggleActionItem(callId, itemId);
  return apiFetch<void>(`/analytics/calls/${callId}/action-items/${itemId}/toggle`, { method: "POST" });
}

// ── Knowledge Base ────────────────────────────────────────────────────────────

/**
 * GET /kb/files
 * Returns: KnowledgeFile[]
 */
export async function getKnowledgeFiles(): Promise<KnowledgeFile[]> {
  if (USE_MOCK) return mock.fetchKnowledgeFiles();
  return apiFetch<KnowledgeFile[]>("/kb/files");
}

/**
 * POST /kb/files/upload
 * Body: FormData  ({ file, category })
 * Returns: KnowledgeFile
 */
export async function uploadKnowledgeFile(file: File, category: "menu" | "faq"): Promise<KnowledgeFile> {
  if (USE_MOCK) return mock.uploadKnowledgeFile(file, category);
  const form = new FormData();
  form.append("file", file);
  form.append("category", category);
  return apiFetch<KnowledgeFile>("/kb/files/upload", {
    method: "POST",
    body: form,
    timeoutMs: 60_000,
  });
}

/**
 * DELETE /kb/files/:id
 */
export async function deleteKnowledgeFile(id: string): Promise<void> {
  if (USE_MOCK) return mock.deleteKnowledgeFile(id);
  return apiFetch<void>(`/kb/files/${id}`, { method: "DELETE" });
}

/**
 * POST /kb/files/:id/reindex
 */
export async function reindexKnowledgeFile(id: string): Promise<void> {
  if (USE_MOCK) return mock.reindexKnowledgeFile(id);
  return apiFetch<void>(`/kb/files/${id}/reindex`, { method: "POST" });
}

/**
 * GET /kb/data-sources
 * Returns: DataSource[]
 */
export async function getDataSources(): Promise<DataSource[]> {
  if (USE_MOCK) return mock.fetchDataSources();
  return apiFetch<DataSource[]>("/kb/data-sources");
}

// ── Outbound Campaign ─────────────────────────────────────────────────────────

/**
 * GET /outbound/customers
 * Returns: CampaignCustomer[]
 */
export async function getCampaignCustomers(): Promise<CampaignCustomer[]> {
  if (USE_MOCK) return mock.fetchCampaignCustomers();
  return apiFetch<CampaignCustomer[]>("/outbound/customers");
}

/**
 * GET /outbound/state
 * Returns: { state: CampaignState }
 */
export async function getCampaignStatus(): Promise<CampaignState> {
  if (USE_MOCK) return mock.getCampaignState();
  const data = await apiFetch<{ state: CampaignState }>("/outbound/state");
  return data.state;
}

/**
 * GET /outbound/stats
 * Returns: CampaignStats
 */
export async function getCampaignStatsData(): Promise<CampaignStats> {
  if (USE_MOCK) return mock.getCampaignStats();
  return apiFetch<CampaignStats>("/outbound/stats");
}

/**
 * POST /outbound/state
 * Body: { state: CampaignState }
 */
export async function setCampaignStatus(state: CampaignState): Promise<void> {
  if (USE_MOCK) return mock.setCampaignState(state);
  return apiFetch<void>("/outbound/state", {
    method: "POST",
    body: JSON.stringify({ state }),
  });
}

/**
 * GET /outbound/eta
 * Returns estimated time remaining for the running campaign queue.
 */
export async function getCampaignEta(): Promise<string> {
  if (USE_MOCK) return mock.getEstimatedTimeRemaining();
  const data = await apiFetch<{ eta: string }>("/outbound/eta");
  return data.eta;
}

/**
 * POST /outbound/customers/upload
 * Body: FormData ({ file })
 * Returns: CampaignCustomer[]
 */
export async function uploadCampaignCustomers(file: File): Promise<CampaignCustomer[]> {
  if (USE_MOCK) {
    const text = await file.text();
    const rows = parseCsv(text);
    return mock.importCampaignCsv(rows);
  }
  const form = new FormData();
  form.append("file", file);
  return apiFetch<CampaignCustomer[]>("/outbound/customers/upload", {
    method: "POST",
    body: form,
    timeoutMs: 60_000,
  });
}

// ── Settings ──────────────────────────────────────────────────────────────────

/**
 * GET /settings
 * Returns: AppSettings
 */
export async function getSettings(): Promise<AppSettings> {
  if (USE_MOCK) return mock.fetchSettings();
  return apiFetch<AppSettings>("/settings");
}

/**
 * PUT /settings
 * Body: Partial<AppSettings>
 * Returns: AppSettings
 */
export async function saveSettings(settings: Partial<AppSettings>): Promise<AppSettings> {
  if (USE_MOCK) return mock.saveSettings(settings as AppSettings);
  return apiFetch<AppSettings>("/settings", {
    method: "PUT",
    body: JSON.stringify(settings),
  });
}

// ── System ────────────────────────────────────────────────────────────────────

/**
 * GET /system/health
 * Returns: SystemHealth
 */
export async function getSystemHealth(): Promise<SystemHealth> {
  if (USE_MOCK) return mock.fetchSystemHealth();
  return apiFetch<SystemHealth>("/system/health");
}

// ── Call Reminders ─────────────────────────────────────────────────────────────

/**
 * GET /reminders
 * Returns: ReminderContact[]
 */
export async function getReminderContacts(): Promise<ReminderContact[]> {
  if (USE_MOCK) return mock.fetchReminderContacts();
  return apiFetch<ReminderContact[]>("/reminders");
}

/**
 * POST /reminders
 * Body: Omit<ReminderContact, "id" | "callHistory" | "attemptNumber" | "totalAttempts">
 * Returns: ReminderContact
 */
export async function addReminderContact(
  data: Omit<ReminderContact, "id" | "callHistory" | "attemptNumber" | "totalAttempts">
): Promise<ReminderContact> {
  if (USE_MOCK) return mock.addReminderContact(data);
  return apiFetch<ReminderContact>("/reminders", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * PATCH /reminders/:id/status
 * Body: { status }
 */
export async function updateReminderStatus(id: string, status: ReminderStatus): Promise<void> {
  if (USE_MOCK) return mock.updateReminderStatus(id, status);
  return apiFetch<void>(`/reminders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

/**
 * POST /reminders/bulk-import
 * Body: { rows: Record<string, string>[], domain: ReminderDomain }
 * Returns: ReminderContact[]
 */
export async function bulkImportReminders(
  file: File,
  domain: ReminderDomain
): Promise<ReminderContact[]> {
  if (USE_MOCK) {
    const text = await file.text();
    const rows = parseCsv(text);
    return mock.bulkImportReminders(rows, domain);
  }
  const form = new FormData();
  form.append("file", file);
  form.append("domain", domain);
  return apiFetch<ReminderContact[]>("/reminders/bulk-import", {
    method: "POST",
    body: form,
    timeoutMs: 60_000,
  });
}

