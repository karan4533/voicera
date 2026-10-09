# Voicera Frontend — Overall Documentation

**Version:** 2.0  
**Date:** September 2026  
**Scope:** Frontend only (`src/`, Vite, `package.json`)

This is the **master map** of the Voicera frontend. Use it first; then open the specialist docs below for depth.

| Document | Audience | Purpose |
|----------|----------|---------|
| **This file** | Everyone | Big picture: product, flow, folders, modes |
| [`STRUCTURE.md`](./STRUCTURE.md) | Engineers | Canonical `src/` tree after cleanup |
| [`FRONTEND_SOLUTION_DOC.md`](./FRONTEND_SOLUTION_DOC.md) | Engineers / PMs | Stack, routes, contexts, pages, design decisions |
| [`BACKEND_INTEGRATION_GUIDE.md`](./BACKEND_INTEGRATION_GUIDE.md) | Backend team | REST endpoints, env, mock → live switch |
| [`README.md`](./README.md) | Developers | How to install and run locally |

---

## 1. What Voicera Is

Voicera is a **multi-tenant voice-agent SaaS dashboard** for Heuristic Labs. Businesses run AI phone agents (restaurant orders, loan follow-ups, support, and more).

| Who | Console | Purpose |
|-----|---------|---------|
| **Platform admin** | `/admin` | Customers, subscriptions, health, security |
| **Customer admin / user** | `/dashboard` | Agents, calls, campaigns, team, analytics |

**Plain-language flow:** Sign in → app knows your role → customers pick company (if needed) and agent → work only in that space.

---

## 2. Architecture at a Glance

```
Login
  → AuthContext (identity + role + org + subscribed agents)
      → RoleRoute
          → platform_admin → /admin (AdminLayout)
          → customer_*     → /dashboard (DashboardLayout)
                → tenant picker / auto-bind
                → switchTenant()
                → AgentContext (active agent)
                → pages (setup, ops, team, campaigns, analytics)
  → Data:
        Auth / org     → Firebase Auth + Firestore (+ demo seed)
        Page data      → api.ts → mock-api.ts OR REST backend
        Admin actions  → adminApi.ts → Firebase Callable Functions
```

Core chain: **identity → role → tenant → permissions → active agent → product screens**.

---

## 3. Tech Stack

| Area | Choice |
|------|--------|
| Framework | React 18 + TypeScript |
| Build | Vite 6 |
| Routing | React Router 7 |
| Styling | Tailwind CSS v4 |
| UI | Radix / shadcn-style (`components/ui`) + shared `UiKit` |
| Charts | Recharts |
| Icons | Lucide React |
| Motion | Motion (Framer) |
| Auth | Firebase Auth (or local demo if Firebase env missing) |
| Package manager | pnpm (preferred) |

---

## 4. `src/` Folder Map

| Path | Purpose |
|------|---------|
| `src/main.tsx` | Bootstrap — mounts App + global CSS |
| `src/app/App.tsx` | Providers, router, all routes |
| `src/app/context/` | `AuthContext`, `AgentContext` |
| `src/app/layouts/` | `DashboardLayout`, `AdminLayout` |
| `src/app/pages/` | Customer workspace pages |
| `src/app/pages/admin/` | Platform admin pages |
| `src/app/components/` | Login, RoleRoute, AgentSwitcher, shared UI, `ui/` |
| `src/app/lib/` | firebase, auth, api, rbac, tenants, workflow, notifications |
| `src/styles/` | Theme and Tailwind entry |
| `src/assets/` | Logos and static images |

---

## 5. Bootstrap Flow

1. `main.tsx` → `createRoot` → `<App />`
2. `AuthProvider` wraps everything
3. `AgentProvider` (depends on auth session for subscribed agents)
4. `BrowserRouter` + Sonner toaster
5. Routes: `/login` | `/admin/*` | `/dashboard/*` | `*` → login

---

## 6. Route Map

### Public
- `/login` — `LoginScreen` inside `GuestRoute` (redirects if already signed in)

### Admin — `RoleRoute(platform_admin)` + `AdminLayout`
| Path | Page |
|------|------|
| `/admin` | Admin overview |
| `/admin/customers` | Customer accounts |
| `/admin/subscriptions` | Purchased agents / plans |
| `/admin/analytics` | Platform analytics |
| `/admin/system-health` | System health |
| `/admin/security` | Security / MFA |

### Customer — `RoleRoute(customer_admin \| customer_user)` + `DashboardLayout`
| Path | Page | Notes |
|------|------|--------|
| `/dashboard` | Dashboard | |
| `/dashboard/library` | Agent library | |
| `/dashboard/configure` | Configure & launch | `customer_admin` only |
| `/dashboard/agents` | My agents | |
| `/dashboard/live-calls` | Live calls | |
| `/dashboard/analytics` | Call analytics | |
| `/dashboard/knowledge` | Knowledge base | |
| `/dashboard/campaigns` | Outbound campaign | `customer_admin` only |
| `/dashboard/team` | Team & users | `customer_admin` only |
| `/dashboard/usage` | Usage & credits | |

Legacy redirects: `customize` → `configure`, `call-reminders` → `campaigns`, etc.

---

## 7. Contexts & Lib Layer

### AuthContext
Owns: `session`, `loading`, `demoMode`, `userTenants`, login (password / Google / MFA), `switchTenant`, logout.

Session user fields: `role`, `orgId`, `subscribedAgents`, `orgStatus`.

### AgentContext
Owns: active `agent`, `agentDefs` (from subscriptions), `setAgent`, clone / status helpers. Persists selection in `sessionStorage` (`vocera_selected_agent`).

### Key libs
| File | Role |
|------|------|
| `lib/firebase.ts` | Firebase app / auth / Firestore / Functions (or null → demo) |
| `lib/auth.ts` | `AuthSession` types + sync cache for `apiFetch` |
| `lib/rbac.ts` | Role/claims, permissions, org + agent lookups |
| `lib/tenantMemberships.ts` | Demo email → org memberships; picker helpers |
| `lib/api.ts` | Page data: mock vs REST |
| `lib/adminApi.ts` | Callable Functions (audit, revoke, org update) |
| `lib/workflow.ts` | Sidebar nav groups |
| `lib/notifications.ts` | In-app notification helpers |
| `lib/mock-api.ts` | Demo/dev fake data |

---

## 8. Multi-Tenancy (Client)

1. Memberships come from demo seed (`tenantMemberships.ts`) or Firebase claims / Firestore.
2. **One org** → auto-bind in `DashboardLayout`.
3. **Multiple orgs** → tenant picker until user chooses; then `switchTenant(orgId)`.
4. Switch updates `orgId` + `subscribedAgents`; AgentContext rebuilds agents.
5. Platform admins skip tenant binding.

---

## 9. Demo vs Firebase vs API Mock

| Mode | Trigger | Behavior |
|------|---------|----------|
| **Demo auth** | Missing `VITE_FIREBASE_*` | Local session; demo memberships; password not verified against Firebase |
| **Firebase auth** | Firebase env configured | Real sign-in, tokens, Firestore org status/agents |
| **API mock** | `VITE_USE_MOCK` not `false` in dev | `api.ts` → `mock-api.ts` |
| **API live** | `VITE_USE_MOCK=false` | `api.ts` → `VITE_API_BASE_URL` with Bearer token |

Production builds ignore `VITE_USE_MOCK=true`.

---

## 10. End-to-End Data Path

1. Login → AuthContext builds session (demo or Firebase).
2. `RoleRoute` sends user to `/admin` or `/dashboard`.
3. Customer layout resolves tenant → `switchTenant` → AgentContext.
4. Pages call `api.ts` (token from `getSession()`).
5. Admin screens use Firestore / `adminApi` as needed.

---

## 11. UX Experience (what the user feels)

Architecture alone is not the product. This section documents **frontend UX behavior** that already exists in code.

### 11.1 Primary user journeys

| Journey | UX path |
|---------|---------|
| First login | Branded `/login` → role redirect → admin console **or** customer dashboard |
| Restaurant manager | Auto-enter tenant (or picker) → choose agent → Setup → Ops → Team |
| Restaurant staff (`customer_user`) | Same dashboard, but Configure / Campaigns / Team hidden or blocked |
| Platform admin | `/admin` only — no tenant picker, no customer call data |
| Suspended org | Full-page `SuspendedAccountScreen` (not a silent empty dashboard) |
| Multi-company user | Modal workspace picker before any agent work |

### 11.2 Feedback states (production UX)

| State | What the user sees | Where |
|-------|--------------------|--------|
| **Loading** | Spinners / skeletons (auth gate, KPI rows, lists) | `RoleRoute`, `MetricSkeleton`, pages |
| **Empty** | Clear empty copy + optional action | `EmptyState` in `UiKit` |
| **Error + Retry** | Red panel, message, Retry button | `LoadErrorPanel` on Dashboard, Analytics, Knowledge, Campaigns |
| **Mutation fail** | Toast (Sonner) | Upload/delete/campaign/toggle actions |
| **Offline** | Fixed top red banner | `OfflineBanner` |
| **Backend down / degraded** | Header “Service Unavailable” / “Degraded” + strip banner | `DashboardLayout` health poll |
| **Page crash** | “Something went wrong” + Try again | `ErrorBoundary` |
| **Session expired (401)** | Logged out → `/login` | `api.ts` + `ApiUnauthorizedBridge` |

### 11.3 Navigation & orientation UX

- **Sidebar workflow** (`workflow.ts`): Setup → Operations → Team/Usage — matches PRD order.
- **Active agent** always visible in header (`AgentSwitcher`) so data feels scoped.
- **Health + active-call chip** in header for operational awareness.
- **Notifications bell** for account/agent events (admin vs customer links differ).
- **Legacy URL redirects** avoid broken bookmarks (`customize` → `configure`, etc.).

### 11.4 Visual / interaction language

- Brand palette: warm paper background (`#F7F4EF`), accent brown (`#50381F`).
- Shared chrome: `vo-card`, `vo-btn`, `vo-input` in `styles/index.css` + `PageHeader` / `UiKit`.
- Responsive shells: mobile sidebar toggle in `DashboardLayout` / `AdminLayout`.
- Confirm dialogs for destructive actions (logout, delete).

### 11.5 UX gaps / known limits

| Gap | Notes |
|-----|--------|
| Live Calls still partly demo-simulated | Can look “live” even when API is down — weaker outage honesty |
| `customer_user` permissions | Route-blocked; deeper capability grants still scaffolded |
| Accessibility | Focus styles exist; no full a11y audit documented |
| i18n | UI copy is English-first |
| Onboarding tour | No first-run product tour beyond tenant picker |

### 11.6 UX checklist for QA

1. Login errors are human-readable (not raw Firebase codes).  
2. Wrong role never lands on the wrong console.  
3. Multi-tenant user must pick a workspace before seeing agents.  
4. Kill backend / go offline → banner + Retry, **not** endless skeleton.  
5. Admin-only nav items hidden for `customer_user`.  
6. Suspended tenant cannot use the dashboard.  
7. Mobile: open/close sidebar; pages remain usable.

---

## 12. Non-Technical Summary

You sign in. The app knows if you are a Voicera platform manager or a customer. Managers use the admin console. Customers open their company workspace (automatically or by picking one), choose which AI phone agent to manage, then use dashboards for calls, campaigns, and team. Each company only sees its own data. When something fails (offline, API down, crash), the UI should explain it and offer a way back — not hang forever. The product can run with sample demo data or connected to real cloud login and APIs.

---

## 13. Related Code Entry Points

- Routes & providers: `src/app/App.tsx`
- Auth: `src/app/context/AuthContext.tsx`
- Agents: `src/app/context/AgentContext.tsx`
- API switch: `src/app/lib/api.ts`
- UX resilience: `ErrorBoundary`, `OfflineBanner`, `LoadErrorPanel`, health banner in `DashboardLayout`
- Env template: `.env.example`
