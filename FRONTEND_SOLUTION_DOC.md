# Voicera Frontend — Solution Document

**Version:** 1.0  
**Date:** June 2026  
**Branch:** `feature/backend-integration`  
**Repository:** [github.com/imarnv/HL-Eloquent](https://github.com/imarnv/HL-Eloquent)

---

## 1. Overview

Voicera is a **Voice AI Platform Dashboard** built for Heuristic Labs. It provides real-time monitoring and analytics for AI-powered voice agents handling calls across multiple business domains (Restaurant ordering, Loan follow-up, etc.).

The frontend is a React single-page application (SPA) that currently runs with mock data and is fully prepared to connect to the HL-Eloquent FastAPI backend via a single environment variable toggle.

---

## 2. Technology Stack

| Category | Technology | Version |
|---|---|---|
| Framework | React | 18.3.1 |
| Language | TypeScript | ~5.x |
| Build Tool | Vite | 6.3.5 |
| Routing | React Router | 7.13.0 |
| Styling | TailwindCSS v4 | 4.1.12 |
| UI Components | Radix UI + Shadcn UI | Latest |
| Charts | Recharts | 2.15.2 |
| Icons | Lucide React | 0.487.0 |
| Animations | Motion (Framer Motion) | 12.x |
| Package Manager | pnpm | — |

---

## 3. Project Structure

```
c:/pms/vocera/
├── src/
│   ├── main.tsx                    # App entry point
│   ├── app/
│   │   ├── App.tsx                 # Root router & providers
│   │   ├── context/
│   │   │   ├── AuthContext.tsx     # JWT session management
│   │   │   └── AgentContext.tsx    # Global agent type selector
│   │   ├── layouts/
│   │   │   └── DashboardLayout.tsx # Sidebar + header shell
│   │   ├── pages/
│   │   │   ├── DashboardPage.tsx   # Overview + extracted data feed
│   │   │   ├── LiveCallsPage.tsx   # Real-time active call monitor
│   │   │   └── AnalyticsPage.tsx   # Call analytics, transcripts, AI summaries
│   │   ├── components/
│   │   │   ├── LoginScreen.tsx     # Auth login UI
│   │   │   ├── ProtectedRoute.tsx  # Route guard (requires session)
│   │   │   ├── shared/
│   │   │   │   ├── PageHeader.tsx  # Reusable page title + metric cards
│   │   │   │   └── StatusBadge.tsx # Color-coded status pill
│   │   │   └── ui/                 # Full Shadcn UI component library
│   │   └── lib/
│   │       ├── api.ts              # ★ Single source of truth for all API calls
│   │       ├── mock-api.ts         # Mock data for dev/demo mode
│   │       ├── auth.ts             # JWT storage and session helpers
│   │       ├── csv.ts              # CSV parser + exporter utilities
│   │       └── types.ts            # All TypeScript type definitions
│   ├── assets/
│   │   └── heuristic-labs-logo.png
│   └── styles/
│       ├── globals.css
│       ├── index.css
│       └── theme.css
├── .env.example                    # Environment variable template
├── BACKEND_INTEGRATION_GUIDE.md   # Guide for backend developer
├── vite.config.ts
├── tsconfig.json
└── package.json
```

---

## 4. Architecture & Data Flow

```
User Action
    │
    ▼
React Page (e.g. DashboardPage.tsx)
    │  calls
    ▼
lib/api.ts  ──── VITE_USE_MOCK=true  ──► lib/mock-api.ts (local fake data)
    │
    └──── VITE_USE_MOCK=false ──► Real Backend (FastAPI @ VITE_API_BASE_URL)
                                       All requests include:
                                       Authorization: Bearer <jwt>
```

**The key design principle**: React components **never** import from `mock-api.ts` directly. All data flows through `api.ts`. This means switching from mock to real backend requires **only a change in `.env.local`** — zero code changes in any component.

---

## 5. Application Pages

### 5.1 Login Page (`/login`)
- Full-screen branded login form
- Guest route: automatically redirects to `/dashboard` if already logged in
- In mock mode: accepts **any** email + password (bypass for demo)
- In real mode: calls `POST /auth/login` on the backend

### 5.2 Dashboard Overview (`/dashboard`)
- **Metrics Row**: Total Calls Today, CSAT Score, Avg Latency, Active Agents
- **Extracted Data Feed**: Live table of AI-extracted entities (bookings, orders, payments)
  - Dynamically filters based on the **Agent Selector** in the header
  - Supports `restaurant` → shows Bookings + Orders
  - Supports `loan` → shows Payments
  - `attributes` field renders any key-value pair automatically (domain-agnostic)
- Polls every 5 seconds for live data

### 5.3 Live Calls (`/dashboard/live-calls`)
- **Active Calls Table**: Real-time call list with caller ID, duration (live ticker), agent, language, status (Active/Ringing/Hold)
- **Actions**: Monitor call (Eye) and End Call (Phone Off)
- **Recent Completed Calls**: Chronological list with click-through to Analytics detail
- Polls every 5 seconds

### 5.4 Analytics (`/dashboard/analytics`)
- **Metrics Row**: Avg Duration, Sentiment Trend, Escalation Count, CSAT Score
- **Filter Bar**:
  - Text search (caller name / phone)
  - Agent Type dropdown
  - Language dropdown
  - Outcome dropdown
- **Call Log Table**: All completed calls with Sentiment badge (color-coded)
- **Call Detail Panel (Slide-out Sheet)**:
  - Call metadata (date, agent, duration, sentiment)
  - AI-generated summary
  - Action items checklist (checkboxes toggle via backend API)
  - Full raw transcript
- **CSV Export**: Downloads current filtered view as `.csv`

---

## 6. Global State Management

### AuthContext (`context/AuthContext.tsx`)
Manages the authenticated user session.

| Property | Type | Description |
|---|---|---|
| `session` | `AuthSession \| null` | Current logged-in user + JWT token |
| `login(email, password, rememberMe)` | function | Authenticates user |
| `logout()` | function | Clears session from storage |

Session persists across page reloads via `localStorage` (if "Remember Me") or `sessionStorage`.

### AgentContext (`context/AgentContext.tsx`)
Manages the globally selected AI agent type.

| Property | Type | Description |
|---|---|---|
| `agent` | `"restaurant" \| "loan"` | Currently selected domain |
| `agentLabel` | `string` | Human-readable label |
| `setAgent(id)` | function | Updates agent + persists to sessionStorage |

The agent selector lives in the header and filters the Dashboard data feed in real time.

---

## 7. API Service Layer (`lib/api.ts`)

Every API function follows the same pattern:

```typescript
export async function getFoo(): Promise<Foo> {
  if (USE_MOCK) return mock.fetchFoo();   // ← mock mode
  return apiFetch<Foo>("/foo");           // ← real backend
}
```

All authenticated requests automatically attach the JWT:
```
Authorization: Bearer <token>
```

### Active Endpoints (MVP)

| Function | Method | URL | Used By |
|---|---|---|---|
| `loginUser` | POST | `/auth/login` | Login screen |
| `getSystemHealth` | GET | `/system/health` | Header (5s poll) |
| `getDashboardMetrics` | GET | `/dashboard/metrics` | Dashboard |
| `getExtractedData` | GET | `/dashboard/extractions?agent=` | Dashboard |
| `getActiveCalls` | GET | `/calls/active` | Live Calls |
| `getCompletedCalls` | GET | `/calls/completed` | Live Calls |
| `endActiveCall` | POST | `/calls/:id/end` | Live Calls |
| `getAnalyticsMetrics` | GET | `/analytics/metrics` | Analytics |
| `getCallDetails` | GET | `/analytics/calls` | Analytics |
| `toggleCallActionItem` | POST | `/analytics/calls/:id/action-items/:itemId/toggle` | Analytics |

### Future Endpoints (not live yet)

These are coded but pages are not yet built: Knowledge Base, Outbound Campaign, Settings.

---

## 8. Type Definitions (`lib/types.ts`)

All data shapes used across the application:

| Type | Description |
|---|---|
| `AgentType` | `"restaurant" \| "loan"` |
| `ActiveCall` | Live call with status, caller, duration |
| `CompletedCall` | Finished call summary |
| `CallDetail` | Full call record with transcript, summary, action items |
| `ActionItem` | `{ id, text, done }` checkbox item |
| `ExtractedEntity` | AI-extracted data: type, customer, dynamic `attributes` |
| `DashboardMetrics` | Top-level KPI numbers |
| `SystemHealth` | `{ status, activeCalls, avgLatency }` |
| `AnalyticsMetrics` | `{ avgDuration, sentimentTrend, escalationCount, csatScore }` |

---

## 9. Running the Project

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Development (Mock Mode)
```bash
cd c:/pms/vocera
pnpm install        # or npm install
npm run dev         # runs on http://localhost:5173
```

Log in with **any email and any password** — mock mode accepts all credentials.

### Connect to Real Backend
1. Copy `.env.example` to `.env.local`
2. Edit `.env.local`:
   ```env
   VITE_API_BASE_URL=https://your-backend.com
   VITE_USE_MOCK=false
   ```
3. Restart the dev server: `npm run dev`

---

## 10. Git Branches

| Branch | Purpose |
|---|---|
| `main` | Original backend code (HL-Eloquent) |
| `feature/backend-integration` | ✅ Current frontend (all MVP work lives here) |
| `frontend--integration-part` | Renamed by GitHub — same as above |

The backend developer should pull `feature/backend-integration` and implement the 9 REST endpoints described in `BACKEND_INTEGRATION_GUIDE.md`.

---

## 11. Key Design Decisions

1. **Single API file (`api.ts`)**: All components import from one place. No scattered `fetch()` calls in components.

2. **Mock/Real toggle via env var**: `VITE_USE_MOCK=true/false` controls the entire data layer without touching React code.

3. **Domain-agnostic `attributes` field**: Instead of building separate dashboards per domain, the `ExtractedEntity.attributes` field is a flexible `Record<string, string | number>`. The UI renders any key-value pair automatically. Adding a new domain (e.g. Healthcare) requires **zero frontend changes**.

4. **Agent selector in header**: Global context filters all data. No separate dashboard per domain — one smart dashboard that reacts to the selected agent.

5. **Sheet over Modal for detail view**: The Analytics detail panel slides in from the right, keeping the call table visible for context comparison.
