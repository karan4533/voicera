# Voicera Frontend — Solution Document

**Version:** 2.0  
**Date:** September 2026  
**Companion:** [`OVERALL_DOCUMENTATION.md`](./OVERALL_DOCUMENTATION.md) (start here for the big picture)

---

## 1. Overview

Voicera is a **multi-tenant Voice AI platform dashboard** for Heuristic Labs. It supports:

- **Platform admins** — manage tenants, subscriptions, health, and security (`/admin`)
- **Customers** — configure and operate purchased voice agents (`/dashboard`)

The SPA uses **Firebase Authentication** (or local **demo auth** when Firebase env is missing). **Page data** flows through `lib/api.ts`, which switches between `mock-api.ts` and a REST backend via `VITE_USE_MOCK` / `VITE_API_BASE_URL`.

---

## 2. Technology Stack

| Category | Technology | Notes |
|---|---|---|
| Framework | React 18.3 | Peer dependency |
| Language | TypeScript | Via Vite |
| Build | Vite 6 | `@vitejs/plugin-react`, Tailwind plugin |
| Routing | React Router 7 | `BrowserRouter` in `App.tsx` |
| Styling | Tailwind CSS v4 | `src/styles/` |
| UI | Radix + shadcn-style | `src/app/components/ui/` |
| Shared chrome | UiKit, PageHeader | `components/shared/` |
| Charts | Recharts | Analytics / dashboard |
| Icons | Lucide React | |
| Auth | Firebase Auth | Optional; demo fallback |
| Data store (org) | Firestore | Via `rbac.ts` when configured |
| Admin ops | Firebase Functions | `adminApi.ts` |
| Package manager | pnpm | Prefer over npm |

---

## 3. Project Structure

```
voicera/
├── src/
│   ├── main.tsx                      # Entry — mounts App
│   ├── app/
│   │   ├── App.tsx                   # AuthProvider → AgentProvider → routes
│   │   ├── context/
│   │   │   ├── AuthContext.tsx       # Session, demo/Firebase login, switchTenant
│   │   │   └── AgentContext.tsx      # Active agent + defs from subscriptions
│   │   ├── layouts/
│   │   │   ├── DashboardLayout.tsx   # Customer shell + tenant gate
│   │   │   └── AdminLayout.tsx       # Platform admin shell
│   │   ├── pages/                    # Customer pages
│   │   │   └── admin/                # Admin pages
│   │   ├── components/
│   │   │   ├── LoginScreen.tsx
│   │   │   ├── RoleRoute.tsx         # Primary role + suspended guard
│   │   │   ├── ProtectedRoute.tsx    # Session-only guard (legacy/simple)
│   │   │   ├── AgentSwitcher.tsx
│   │   │   ├── shared/               # UiKit, PageHeader, StatusBadge
│   │   │   └── ui/                   # Shadcn/Radix primitives
│   │   └── lib/
│   │       ├── firebase.ts
│   │       ├── auth.ts               # AuthSession + sync token cache
│   │       ├── rbac.ts
│   │       ├── tenantMemberships.ts  # Demo memberships
│   │       ├── api.ts                # ★ Page data API facade
│   │       ├── mock-api.ts
│   │       ├── adminApi.ts
│   │       ├── workflow.ts           # Nav groups
│   │       ├── notifications.ts
│   │       └── types.ts
│   ├── assets/
│   └── styles/
├── .env.example
├── OVERALL_DOCUMENTATION.md
├── BACKEND_INTEGRATION_GUIDE.md
├── vite.config.ts
└── package.json
```

---

## 4. Architecture & Data Flow

### 4.1 Identity → product

```
LoginScreen
  → AuthContext.login / Google / MFA
  → session { role, orgId, subscribedAgents, orgStatus, token }
  → GuestRoute / RoleRoute
  → AdminLayout  OR  DashboardLayout (tenant picker / auto-bind → switchTenant)
  → AgentContext (active agent)
  → Pages
```

### 4.2 Page data

```
React Page
  → lib/api.ts
       ├─ USE_MOCK → mock-api.ts
       └─ else    → fetch(VITE_API_BASE_URL + path)
                    Authorization: Bearer <Firebase ID token | demo-token>
```

**Rule:** Components import from `api.ts` only — never from `mock-api.ts` directly.

### 4.3 Auth vs API login

Login is **not** driven by `POST /auth/login` in the happy path. `AuthContext` uses Firebase Auth (or demo). `api.ts` → `loginUser()` is retained for API-layer completeness; live page calls use the session cache from `auth.ts`.

---

## 5. Application Pages

### 5.1 Login (`/login`)
- Email/password, Google SSO, forgot password (Firebase), MFA (TOTP when enrolled)
- Demo: provisioned emails from `tenantMemberships` / platform admin list; password required but not verified against Firebase
- Post-login: admin → `/admin`; customer → `/dashboard` (multi-tenant may show picker)

### 5.2 Customer workspace (`/dashboard/*`)
| Area | Routes | Highlights |
|------|--------|------------|
| Setup | `/`, `library`, `configure`, `agents` | PRD flow: Dashboard → Library → Configure → My Agents |
| Ops | `live-calls`, `analytics`, `knowledge`, `campaigns` | Live poll; campaigns admin-only |
| Org | `team`, `usage` | Team admin-only |

Dashboard extracted-data feed is **agent-scoped** via `AgentContext`. Flexible `attributes` on entities keep the UI domain-agnostic.

### 5.3 Admin console (`/admin/*`)
Overview, customers, subscriptions, platform analytics, system health, security (incl. MFA enrollment UI).

---

## 6. Global State

### AuthContext

| API | Description |
|-----|-------------|
| `session` | Current `AuthSession` or null |
| `loading` | Initial auth resolve |
| `demoMode` | `!isFirebaseConfigured` |
| `userTenants` | Tenants the user may enter |
| `login` / `loginWithGoogle` / `completeMfaLogin` | Sign-in |
| `switchTenant(orgId)` | Bind org + subscribed agents |
| `logout` | Clear session; Firebase signOut + revoke when live |

Roles: `platform_admin` | `customer_admin` | `customer_user`.

### AgentContext

| API | Description |
|-----|-------------|
| `agent` / `agentLabel` | Active agent type + display name |
| `agentDefs` | Built from `subscribedAgents` (or full catalog for platform admin) |
| `setAgent` | Persist to `sessionStorage` |
| `addAgentDef` / `updateAgentStatus` / `cloneAgent` | Local catalog mutations |

### Guards
- **RoleRoute** — role allow-list, suspended org screen, cross-redirect
- **GuestRoute** — keep signed-in users off `/login`

---

## 7. API Service Layer (`lib/api.ts`)

```typescript
export async function getFoo(): Promise<Foo> {
  if (USE_MOCK) return mock.fetchFoo();
  return apiFetch<Foo>("/foo");
}
```

`USE_MOCK` is forced off in production builds even if env says `true`.

### Representative endpoints

| Function | Method | Path |
|---|---|---|
| `getDashboardMetrics` | GET | `/dashboard/metrics` |
| `getExtractedData` | GET | `/dashboard/extractions` |
| `getActiveCalls` | GET | `/calls/active` |
| `getCompletedCalls` | GET | `/calls/completed` |
| `endActiveCall` | POST | `/calls/:id/end` |
| `getCallDetails` | GET | `/analytics/calls` |
| `getAnalyticsMetrics` | GET | `/analytics/metrics` |
| `getKnowledgeFiles` / upload / delete | GET/POST/DELETE | `/kb/files…` |
| Campaign + reminders | various | `/outbound…`, reminder helpers |
| `getSettings` / `saveSettings` | GET/PUT | `/settings` |
| `getSystemHealth` | GET | `/system/health` |

Full list and integration order: [`BACKEND_INTEGRATION_GUIDE.md`](./BACKEND_INTEGRATION_GUIDE.md).

### Admin Functions (`lib/adminApi.ts`)
Callable: `recordAuditEvent`, `revokeMySessions`, `adminUpdateOrganization`, `offboardCustomer` (when Functions configured).

---

## 8. Types (`lib/types.ts`)

| Type | Description |
|---|---|
| `AgentType` | restaurant, loan, shop, healthcare, … custom |
| `AgentDefinition` | Catalog entry + status/stats |
| `ActiveCall` / `CompletedCall` / `CallDetail` | Call lifecycle |
| `ExtractedEntity` | Domain-agnostic extraction + `attributes` |
| `ReminderContact` | Campaign / reminder rows |
| `DashboardMetrics` / `AnalyticsMetrics` / `SystemHealth` | KPIs |

---

## 9. Multi-Tenancy & RBAC

- **Demo memberships:** `tenantMemberships.ts` (email → org ids)
- **Live:** Custom claims + Firestore `organizations/{orgId}` via `rbac.ts`
- **Tenant UI:** `DashboardLayout` picker / auto-bind
- **Permissions:** `hasPermission(role, capability)` in `rbac.ts`; route-level admin-only pages for configure / team / campaigns

---

## 10. Running the Project

See [`README.md`](./README.md).

Demo accounts (when in demo auth) include emails listed in `DEMO_LOGIN_ACCOUNTS` inside `tenantMemberships.ts` (e.g. spicegarden, swiftfinance, multi-tenant, `admin@voicera.ai`).

---

## 11. Key Design Decisions

1. **Single `api.ts` facade** — no scattered `fetch` in pages for domain data.
2. **Mock/real toggle** — env-driven; components unchanged.
3. **Firebase for identity; REST for product data** — clear split of concerns.
4. **Domain-agnostic `attributes`** — new verticals without new dashboard UIs.
5. **Agent selector** — one workspace filtered by active agent, not one app per domain.
6. **Tenant before agent** — org switch resets/rebuilds subscribed agent list.
7. **RoleRoute nesting** — platform vs customer, then customer_admin vs customer_user.

---

## 12. Doc Index

| Doc | Use when |
|-----|----------|
| `OVERALL_DOCUMENTATION.md` | Onboarding, architecture review |
| This file | Implementation detail |
| `BACKEND_INTEGRATION_GUIDE.md` | Wiring FastAPI / REST |
| `README.md` | Local setup |
