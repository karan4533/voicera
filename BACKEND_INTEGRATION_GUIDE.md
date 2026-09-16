# Voicera Frontend — Backend Integration Guide

This guide is for backend developers connecting the Voicera React app to a real API.

**Also read:** [`OVERALL_DOCUMENTATION.md`](./OVERALL_DOCUMENTATION.md) (auth / tenancy overview).

---

## Architecture Overview

```
React Pages  →  lib/api.ts  →  mock-api.ts (dev)  |  REST backend (prod)
Auth / org   →  AuthContext + Firebase Auth + Firestore (or demo seed)
Admin ops    →  lib/adminApi.ts → Firebase Callable Functions
```

**Design rule:** Pages import **only** `lib/api.ts` for product data. Never import `mock-api.ts` from UI code.

When the backend is ready:

1. Set `VITE_USE_MOCK=false` in `.env.local`
2. Set `VITE_API_BASE_URL` to your API origin (no trailing slash)
3. Implement the REST routes below; keep response shapes aligned with `src/app/lib/types.ts`

---

## Step 1 — Environment Setup

Copy `.env.example` → `.env.local`:

```env
VITE_API_BASE_URL=https://your-backend.api.com
VITE_WS_URL=wss://your-backend.api.com/ws
VITE_USE_MOCK=false

# Firebase (required for production auth — not the same as REST login)
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

> Never commit `.env.local`. Production builds ignore `VITE_USE_MOCK=true`.

---

## Step 2 — Authentication (Important)

### Current frontend behavior

| Concern | Implementation |
|---------|----------------|
| Sign-in UI | `LoginScreen` → `AuthContext` |
| Live auth | **Firebase Auth** (email/password, Google, TOTP MFA) |
| Demo auth | Local session when Firebase env is missing (`tenantMemberships` seed) |
| Token on API calls | Firebase **ID token** (or `demo-token`) via `getSession()` → `Authorization: Bearer …` |

`api.ts` still exports `loginUser()` / `POST /auth/login` for historical completeness. **The login screen does not use this path for Firebase or demo auth.** Prefer verifying Firebase ID tokens on your API (or your own exchange), not a separate password login that duplicates Firebase.

### Recommended backend auth

1. Accept `Authorization: Bearer <Firebase ID token>` on all protected routes.
2. Verify the token with Firebase Admin SDK.
3. Read custom claims (`role`, `orgId`) and enforce tenant isolation server-side.
4. Optional: if you keep `POST /auth/login`, treat it as legacy; do not assume the SPA will call it after Firebase is configured.

### Roles the frontend expects

- `platform_admin` — `/admin` only
- `customer_admin` — full tenant console (including configure / team / campaigns)
- `customer_user` — limited tenant console

---

## Step 3 — Incremental Integration Order

Integrate and verify in this order:

| Priority | Feature | Function in `api.ts` | Endpoint |
|---|---|---|---|
| 1 | Token acceptance | `apiFetch` helper | All routes — Bearer Firebase ID token |
| 2 | Dashboard metrics | `getDashboardMetrics` | `GET /dashboard/metrics?agent=` |
| 3 | Extracted data | `getExtractedData` | `GET /dashboard/extractions?agent=` |
| 4 | Domains | `getClientDomains` | `GET /dashboard/domains` |
| 5 | Live calls | `getActiveCalls`, `endActiveCall` | `GET /calls/active`, `POST /calls/:id/end` |
| 6 | Completed calls | `getCompletedCalls` | `GET /calls/completed` |
| 7 | Analytics | `getCallDetails`, `getAnalyticsMetrics`, `toggleCallActionItem` | `GET /analytics/calls`, `GET /analytics/metrics`, `POST /analytics/calls/:id/action-items/:itemId/toggle` |
| 8 | Knowledge base | `getKnowledgeFiles`, `uploadKnowledgeFile`, `deleteKnowledgeFile`, `reindexKnowledgeFile` | `GET/POST/DELETE /kb/files…` |
| 9 | Data sources | `getDataSources` | (see `api.ts`) |
| 10 | Outbound campaign | `getCampaignCustomers`, `uploadCampaignCustomers`, `getCampaignStatus`, `setCampaignStatus`, `getCampaignStatsData`, `getCampaignEta` | Campaign routes in `api.ts` |
| 11 | Reminders | `getReminderContacts`, `addReminderContact`, `updateReminderStatus`, `bulkImportReminders` | Reminder routes in `api.ts` |
| 12 | Settings | `getSettings`, `saveSettings` | `GET /settings`, `PUT /settings` |
| 13 | System health | `getSystemHealth` | `GET /system/health` |

Open `src/app/lib/api.ts` for exact paths, methods, and TypeScript return types.

---

## Step 4 — Domain-Agnostic Payloads

### Extracted data feed

Dashboard “extracted entities” use a flexible `attributes` object (`Record<string, string | number | …>`). The UI renders key/value badges without per-domain components.

Examples:

- Restaurant booking: `{ "Guests": 4, "Time": "8:00 PM" }`
- Loan payment: `{ "Amount Due": "500", "DPD Bucket": "30-60 Days" }`

Filter by `agent` query param so restaurant vs loan (etc.) stay separated.

### Agent scoping

The SPA sends the active agent type from `AgentContext`. Backend should scope results by **org (tenant)** from the verified token **and** by agent when requested.

---

## Step 5 — Real-time Updates (WebSocket)

Today the UI **polls** (~5s) for:

- Active calls (`/calls/active`)
- Campaign / health-style updates (see `LiveCallsPage`, `DashboardLayout`)

When ready, use `VITE_WS_URL` and replace polling hooks with subscriptions. Keep REST as fallback.

---

## Step 6 — Firebase / Admin (Separate from REST)

Platform admin mutations and audit often go through Cloud Functions (`src/app/lib/adminApi.ts`):

- `recordAuditEvent`
- `revokeMySessions`
- `adminUpdateOrganization`
- `offboardCustomer`

Org `subscribedAgents` and `status` are also read from Firestore in `rbac.ts`. Coordinate Admin SDK rules with the frontend claims model.

---

## Multi-Tenant Checklist for Backend

- [ ] Every customer query filtered by `orgId` from verified token
- [ ] Platform admin routes rejected for customer tokens (and vice versa)
- [ ] Suspended orgs return a clear status the SPA can map to `orgStatus: "suspended"`
- [ ] Agent subscription list matches what the UI shows in AgentContext

---

## Summary of Frontend Touchpoints

| File | Purpose |
|------|---------|
| `src/app/lib/api.ts` | Single facade for REST / mock page data |
| `src/app/lib/mock-api.ts` | Local fake data |
| `src/app/lib/auth.ts` | Sync session cache for Bearer token |
| `src/app/context/AuthContext.tsx` | Firebase / demo login |
| `src/app/lib/firebase.ts` | Firebase init |
| `src/app/lib/adminApi.ts` | Callable Functions |
| `.env.example` | Env template |

---

## Quick Verify

1. `VITE_USE_MOCK=true` (dev) → UI works offline with mock data.  
2. `VITE_USE_MOCK=false` + live `VITE_API_BASE_URL` → network tab shows Bearer calls to your API.  
3. Firebase configured → login creates real ID tokens; API must accept them.
