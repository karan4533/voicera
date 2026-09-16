# Voicera Frontend — Source Structure

Canonical layout after cleanup (September 2026).

```
voicera/
├── index.html
├── package.json
├── vite.config.ts
├── .env.example
├── README.md
├── OVERALL_DOCUMENTATION.md
├── FRONTEND_SOLUTION_DOC.md
├── BACKEND_INTEGRATION_GUIDE.md
└── src/
    ├── main.tsx                 # Bootstrap
    ├── vite-env.d.ts
    ├── assets/                  # Logos / static images
    ├── styles/                  # index.css → fonts, tailwind, theme
    └── app/
        ├── App.tsx              # Providers + routes
        ├── context/
        │   ├── AuthContext.tsx
        │   └── AgentContext.tsx
        ├── layouts/
        │   ├── DashboardLayout.tsx
        │   └── AdminLayout.tsx
        ├── pages/               # Customer workspace
        │   ├── DashboardPage.tsx
        │   ├── AgentLibraryPage.tsx
        │   ├── CustomizePage.tsx
        │   ├── AgentsPage.tsx
        │   ├── LiveCallsPage.tsx
        │   ├── AnalyticsPage.tsx
        │   ├── KnowledgePage.tsx
        │   ├── CallRemindersPage.tsx   # /dashboard/campaigns
        │   ├── TeamPage.tsx
        │   ├── UsagePage.tsx
        │   └── admin/           # Platform admin
        │       ├── AdminOverviewPage.tsx
        │       ├── CustomerAccountsPage.tsx
        │       ├── CreateAccountModal.tsx
        │       ├── SubscriptionsPage.tsx
        │       ├── PlatformAnalyticsPage.tsx
        │       ├── SystemHealthPage.tsx
        │       └── SecurityPage.tsx
        ├── components/
        │   ├── LoginScreen.tsx
        │   ├── RoleRoute.tsx
        │   ├── SuspendedAccountScreen.tsx
        │   ├── AgentSwitcher.tsx
        │   ├── NotificationBell.tsx
        │   ├── ErrorBoundary.tsx
        │   ├── OfflineBanner.tsx
        │   ├── shared/          # UiKit, PageHeader
        │   └── ui/              # Used shadcn primitives only
        │       ├── badge.tsx
        │       ├── button.tsx
        │       ├── card.tsx
        │       ├── checkbox.tsx
        │       ├── input.tsx
        │       ├── select.tsx
        │       ├── sheet.tsx
        │       ├── table.tsx
        │       └── utils.ts
        └── lib/
            ├── api.ts           # REST / mock facade
            ├── mock-api.ts
            ├── auth.ts
            ├── authErrors.ts
            ├── firebase.ts
            ├── rbac.ts
            ├── tenantMemberships.ts
            ├── adminApi.ts
            ├── workflow.ts
            ├── notifications.ts
            ├── types.ts
            ├── csv.ts
            ├── validate.ts
            ├── rateLimit.ts
            └── safeLog.ts
```

## Removed in cleanup

| Removed | Why |
|---------|-----|
| `CallQueuePage.tsx` | Empty stub, not routed |
| `ProtectedRoute.tsx` | Replaced by `RoleRoute` |
| `components/figma/` | Unused Figma leftover |
| `components/shared/StatusBadge.tsx` | Unused (pages use local badges) |
| `src/imports/` | Design prompt paste, unused |
| `src/styles/globals.css` | Empty; not in CSS chain |
| `default_shadcn_theme.css` | Orphan root theme dump |
| Unused `components/ui/*` | Kept only AnalyticsPage deps |

## Conventions

- Pages import data only from `lib/api.ts` (not `mock-api.ts`).
- Route guards: `RoleRoute` (+ nested admin-only routes).
- Shared chrome: `layouts/` + `components/shared/UiKit.tsx`.
- Do not re-add full shadcn dump unless a page needs a new primitive.
