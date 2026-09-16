# Voicera Frontend — Overall Documentation

**Version:** 2.0  
**Date:** September 2026  
**Scope:** Frontend only (`src/`, Vite, `package.json`)

This is the **master map** of the Voicera frontend. Use it first; then open the specialist docs below for depth.

| Document | Audience | Purpose |
|----------|----------|---------|
| **This file** | Everyone | Big picture: product, flow, folders, modes |
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

## 11. Non-Technical Summary

You sign in. The app knows if you are a Voicera platform manager or a customer. Managers use the admin console. Customers open their company workspace (automatically or by picking one), choose which AI phone agent to manage, then use dashboards for calls, campaigns, and team. Each company only sees its own data. The product can run with sample demo data or connected to real cloud login and APIs.

---

## 12. Related Code Entry Points

- Routes & providers: `src/app/App.tsx`
- Auth: `src/app/context/AuthContext.tsx`
- Agents: `src/app/context/AgentContext.tsx`
- API switch: `src/app/lib/api.ts`
- Env template: `.env.example`
