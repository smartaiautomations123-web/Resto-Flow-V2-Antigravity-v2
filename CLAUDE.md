# RestoFlow — Workshop (2026-03-31)

## What This Folder Is

This is the **active working directory** for RestoFlow development.
Open this folder in Claude Code / Antigravity / VS Code to start working.

| Location | Purpose |
|----------|---------|
| This folder (`D:\Resto-Flow_2026-03-31\`) | Working code — clean copy, no node_modules |
| Original full project (`D:\_Archive\Resto-Flow-Old\`) | Full codebase with node_modules, logs, build artifacts |
| Obsidian vault (`C:\Users\alexb\Desktop\Obsidian - The Vault\01_Projects\Resto_Flow\`) | PRDs, audits, marketing docs, AI conversation history |

**To run this project:** `pnpm install` then start dev server.

## Business Context

**Product:** RestoFlow — Restaurant Management Platform
**Type:** SaaS B2B
**Target Market:** UK/US restaurants, cafes, food service businesses
**Founder:** Alex Braga (alexbraga31@gmail.com)

RestoFlow is a comprehensive restaurant management system covering POS, inventory, labour, CRM, online ordering, reservations, and analytics. Built as a full-stack TypeScript web app.

**Status (as of Feb 2026):** ~80% complete — 285/356 features built.

## Tech Stack

```
client/               React frontend (Vite)
  src/
    pages/            40+ pages
    components/       Reusable components
server/               tRPC backend
  _core/              Core utilities
  *.ts                Route handlers and DB procedures
shared/               Shared types and constants
drizzle/              Database migrations (MySQL)
scripts/              Build and utility scripts
```

**Frontend:** React, Vite, TailwindCSS
**Backend:** Node.js, tRPC, 248+ API procedures
**Database:** MySQL with Drizzle ORM, 67 tables, 310+ DB helpers
**Tests:** Vitest, 22 test files (143/244 passing — 101 still failing)
**Package manager:** pnpm
**Deployment:** Base44 / Vercel

## Deployment & GitHub (from Antigravity sessions)

| Item | Detail |
|------|--------|
| GitHub repo | `smartaiautomations123-web/Resto-Flow-V2-Antigravity` |
| Frontend deployment | Vercel (configured — `vercel.json` exists in this folder) |
| Backend deployment | Vercel Serverless Functions via `api/index.ts` |
| Database | Needs hosted MySQL (Neon/PlanetScale/Supabase) — set `DATABASE_URL` in Vercel env |

### Stub Pages Completed in Antigravity (already in codebase)
These pages were fully implemented (not stubs):
- `LabourManagement.tsx` — Compliance rules, overtime alerts, staff availability, timesheets, certifications, PTO
- `ComboBuilder.tsx` — Full CRUD for combo/bundle management
- `EmailCampaigns.tsx` — Campaign list, template builder, stats
- `SmsSettings.tsx` — Twilio config + SMS history
- `NotificationCenter.tsx` — Notification list, unread badge, archive, filters
- `RecipeAnalysis.tsx` — Menu item cost analysis, recipe breakdown
- `PaymentManagement.tsx` — Payments list, gateway settings, disputes, refunds

### Test Fixes Applied
- `profitability.test.ts` — Fixed (TiDB connection handling)
- `financial-analytics.test.ts` — Fixed

## Module Completion

| Module | Status | Features |
|--------|--------|---------|
| 5.1 POS & Order Management | COMPLETE | 54/54 |
| 5.2 Inventory & Supply Chain | COMPLETE | 50/50 |
| 5.3 Labour Management | COMPLETE | 50/50 |
| 5.4 Financial Management | COMPLETE | 131/131 |
| 5.5 Customer & Reservations | COMPLETE | ~50/50 |
| Phase 4: Multi-location enterprise | NOT STARTED | ~36 |
| Phase 5: AI/ML automation | NOT STARTED | ~35 |

## Key Files

| File | Purpose |
|------|---------|
| `COMPREHENSIVE_AUDIT_2026.md` (in Obsidian) | Full feature audit |
| `DATA_FLOW_MAP.md` (in Obsidian) | System architecture |
| `todo.md` | Current task list |
| `drizzle.config.ts` | DB connection config |
| `server/db.ts` | Database client |
| `shared/types.ts` | Shared TypeScript types |

## Active To-Dos

- [ ] Fix 101 failing Vitest tests before production launch
- [ ] Phase 4: Multi-location support
- [ ] Phase 5: AI demand forecasting, churn prediction, anomaly detection
- [ ] Marketing: create demo video and pitch deck for investors/restaurants
- [ ] Decide on go-to-market: SaaS subscription vs white-label

## AI Key Files in Obsidian

All planning docs are at:
`C:\Users\alexb\Desktop\Obsidian - The Vault\01_Projects\Resto_Flow\`

Key docs to read before making architectural decisions:
- `03_Marketing_&_Presentations\RestoFlow_Unique_Selling_Points.md`
- `03_Marketing_&_Presentations\RestoFlow_Financial_Guide.md`
- `03_Marketing_&_Presentations\RestoFlow_Business_and_Marketing_Proposal.md`
- `02_Architecture_&_Audits\COMPREHENSIVE_AUDIT_2026.md`

## Behavioral Rules

- ALWAYS read a file before editing it
- NEVER commit secrets or credentials
- ALWAYS run tests after code changes: `pnpm test`
- ALWAYS verify build: `pnpm build`
- Use UK spelling for all customer-facing content

## Database Setup

MySQL required. Connection config in `drizzle.config.ts`.
Run migrations: `pnpm drizzle-kit push`
Test connection: `npx tsx server/test-db.ts`

## Build & Test

```bash
pnpm install          # Install dependencies
pnpm dev              # Start dev server
pnpm build            # Production build
pnpm test             # Run Vitest tests
pnpm lint             # Lint
pnpm drizzle-kit push # Push DB schema
```

## Security
- NEVER hardcode API keys or secrets
- NEVER commit .env files
- MySQL credentials in .env only
- UK company — GDPR compliance for customer data
