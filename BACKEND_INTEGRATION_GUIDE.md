# Voicera Frontend — Backend Integration Guide

This document is for the backend developer who will connect this frontend to the real API.

## Architecture Overview

```
React Pages  →  lib/api.ts  →  (mock-api.ts in dev | Real Backend in prod)
```

All data fetching in the app flows through a- **To Integrate**: When the backend is ready, simply replace the `fetchExtractedData(agent)` function in `mock-api.ts` with a real `fetch('/api/extractions?agent=' + agent)` call. The UI will instantly populate with live production data without requiring any changes to the React components.

---

## Step 1 — Environment Setup

Copy `.env.example` to `.env.local` and fill in:

```env
VITE_API_BASE_URL=https://your-backend.api.com
VITE_WS_URL=wss://your-backend.api.com/ws
VITE_USE_MOCK=false          # ← flip this to disable mock data
```

> [!CAUTION]
> Never commit `.env.local` — it is in `.gitignore`.

---

## Step 2 — Authentication

The frontend uses **JWT Bearer tokens** stored in `localStorage`/`sessionStorage`.

**Current auth flow (mock):**
1. User enters email + password on `/login`.
2. `AuthContext` calls `loginUser()` from `api.ts`.
3. A mock JWT is created locally and stored in storage.

**To integrate real auth:**

1. Implement `POST /auth/login` returning:
   ```json
   { "access_token": "<jwt>", "user": { "email": "...", "name": "...", "role": "admin" } }
   ```
2. In `api.ts` → `loginUser()`, replace the mock call with a real fetch.
3. In `lib/auth.ts` → `login()`, update `createMockJwt` to store the real token returned from the backend.

The `apiFetch()` helper in `api.ts` already attaches `Authorization: Bearer <token>` to every subsequent request automatically.

---

## Step 3 — Incremental Integration Order

Integrate endpoints in this order, verifying each before moving to the next:

| Priority | Feature | Function in `api.ts` | Endpoint |
|---|---|---|---|
| 1 | **Authentication** | `loginUser` | `POST /auth/login` |
| 2 | **Dashboard Metrics** | `getDashboardMetrics` | `GET /dashboard/metrics` |
| 3 | **Extracted Data** | `getExtractedData` | `GET /dashboard/extractions` |
| 4 | **Live Calls** | `getActiveCalls`, `endActiveCall` | `GET /calls/active`, `POST /calls/:id/end` |
| 5 | **Completed Calls** | `getCompletedCalls` | `GET /calls/completed` |
| 6 | **Transcripts / Analytics** | `getCallDetails`, `getAnalyticsMetrics` | `GET /analytics/calls`, `GET /analytics/metrics` |
| 7 | **Knowledge Base** | `getKnowledgeFiles`, `uploadKnowledgeFile` | `GET /kb/files`, `POST /kb/files/upload` |
| 8 | **Outbound Campaign** | `getCampaignCustomers`, `uploadCampaignCustomers` | `GET /outbound/customers`, `POST /outbound/customers/upload` |
| 9 | **Settings** | `getSettings`, `saveSettings` | `GET /settings`, `PUT /settings` |
| 10 | **System Health** | `getSystemHealth` | `GET /system/health` |

---

## Step 4

### 1. Actionable Data Feed
The primary module on the Dashboard is now "Recent Extracted Data". This feed takes up the full width of the screen space and displays:
- **Entity Type**: Clearly badged as `Lead`, `Booking`, `Order`, or `Payment` with distinct colors and icons.
- **Customer Info**: Name and contact details parsed from the call.
- **Extraction Details**: The actual business value extracted. This uses the dynamic `attributes` JSON payload so that it cleanly renders any data regardless of domain.
- **Status**: Whether the data is `Pending Review`, `Synced` (to a CRM/POS), or needs `Action Required`.

### 2. Context-Aware Filtering
The Dashboard is now directly wired to the **Agent Selector** in the top navigation bar. 
- If you select "Restaurant Ordering", you only see Bookings and Orders. 
- If you select "Loan Follow-up", the view switches to only show Payments and Leads.
- The Dashboard title automatically updates to reflect the active agent context.

> [!IMPORTANT]
> The `attributes` field is a **flexible key-value JSON object** — this is what powers the domain-agnostic dashboard. For a Restaurant booking, include `{"Guests": 4, "Time": "8:00 PM"}`. For a Payment, include `{"Amount Due": "$500", "DPD Bucket": "30-60 Days"}`. The frontend renders them automatically as badges without any code changes.

---

## Step 5 — Real-time Updates (WebSocket)

The frontend currently polls every 5 seconds for:
- Active calls (`/calls/active`)
- Campaign progress (`/outbound/state`)
- System health (`/system/health`)

When the backend is ready, replace polling with WebSocket subscriptions using `VITE_WS_URL`. The WebSocket integration point is the `useEffect` polling hooks in `LiveCallsPage.tsx` and `DashboardLayout.tsx`.

---

## Summary of Files Modified

| File | Purpose |
|---|---|
| `src/app/lib/api.ts` | **NEW** — Single source of truth for all API calls |
| `.env.example` | **NEW** — Documents all required environment variables |
| `.env.local` | **NEW** — Your local config (git-ignored) |
| `.gitignore` | **NEW** — Prevents committing secrets |
| All `pages/*.tsx` | Updated to import from `api.ts` instead of `mock-api.ts` |
| `layouts/DashboardLayout.tsx` | Updated to use `api.ts` |
| `context/AuthContext.tsx` | Updated to use `api.ts` |
