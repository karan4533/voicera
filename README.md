# Voicera

Multi-tenant Voice AI dashboard (React + Vite) for Heuristic Labs.

## Docs

| Document | Description |
|----------|-------------|
| [OVERALL_DOCUMENTATION.md](./OVERALL_DOCUMENTATION.md) | Master architecture & product flow |
| [STRUCTURE.md](./STRUCTURE.md) | Canonical `src/` folder map |
| [FRONTEND_SOLUTION_DOC.md](./FRONTEND_SOLUTION_DOC.md) | Frontend solution detail |
| [BACKEND_INTEGRATION_GUIDE.md](./BACKEND_INTEGRATION_GUIDE.md) | Connect the REST backend |

## Prerequisites

- Node.js 18+
- [pnpm](https://pnpm.io) recommended (`npm install -g pnpm`)

## Setup

```bash
cd voicera
pnpm install
cp .env.example .env.local
```

Edit `.env.local` as needed (see below), then:

```bash
pnpm dev
```

App: [http://localhost:5173](http://localhost:5173)

Build:

```bash
pnpm build
```

## Environment

| Variable | Purpose |
|----------|---------|
| `VITE_FIREBASE_*` | Firebase Auth / Firestore / Functions. If missing → **demo auth** |
| `VITE_USE_MOCK` | `true` / unset in dev → mock page data; `false` → REST |
| `VITE_API_BASE_URL` | REST API origin (no trailing slash) |
| `VITE_WS_URL` | Future WebSocket URL |

Never commit `.env.local`.

### Demo auth (no Firebase keys)

Use provisioned demo emails from the login banner / `tenantMemberships.ts` (e.g. `demo@spicegarden.com`, `demo@swiftfinance.com`, `multi@heuristiclabs.ai`, `admin@voicera.ai`). Any non-empty password works in demo mode.

### Firebase auth

Fill all `VITE_FIREBASE_*` values from Firebase Console → Project settings. Restart `pnpm dev`.

### Live API data

```env
VITE_USE_MOCK=false
VITE_API_BASE_URL=https://your-api.example.com
```

Production builds never use mock mode even if `VITE_USE_MOCK=true`.

## App entry points

- `src/main.tsx` → `src/app/App.tsx`
- Customer console: `/dashboard`
- Admin console: `/admin`
- Login: `/login`
