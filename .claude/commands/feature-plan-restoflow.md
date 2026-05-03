Use the SPARC methodology to turn a feature request into a full implementation plan for RestoFlow.

## About RestoFlow

- **Product:** RestoFlow — Restaurant Management Platform (SaaS B2B)
- **Stack:** React (Vite) + tRPC + Node.js + MySQL (Drizzle ORM)
- **Structure:** `client/src/pages/` + `client/src/components/` + `server/` routes + `shared/types.ts`
- **Test runner:** Vitest (`pnpm test`)
- **Package manager:** pnpm

## Steps (SPARC)

### 1. SPECIFICATION
- Restate the feature request in clear terms
- Define: who uses it, what it does, what it does NOT do
- List acceptance criteria (5–10 bullet points)
- Identify which existing module this belongs to (POS / Inventory / Labour / Financial / CRM / Reservations)

### 2. PSEUDOCODE
- Write high-level pseudocode for the core logic
- Identify DB tables affected (reference `drizzle/` schema files)
- List new tRPC procedures needed (add to which `server/*.ts` file)
- List UI components needed (new vs reuse existing)

### 3. ARCHITECTURE
- Describe data flow: UI → tRPC → DB → response
- New DB tables or columns required (Drizzle migration needed?)
- Shared types to add in `shared/types.ts`
- API procedure names (following existing naming convention)

### 4. IMPLEMENTATION PLAN
Break into tasks with clear file paths:

| # | Task | File | Effort |
|---|------|------|--------|
| 1 | Add DB schema | `drizzle/schema.ts` | S |
| 2 | Add tRPC procedure | `server/[module].ts` | M |
| 3 | Add shared types | `shared/types.ts` | S |
| 4 | Build page component | `client/src/pages/[Page].tsx` | L |
| 5 | Add route | `client/src/App.tsx` | S |
| 6 | Write tests | `tests/[feature].test.ts` | M |

Effort: S = <1hr, M = 1–3hr, L = 3–8hr

### 5. RISKS & CONSIDERATIONS
- Any breaking changes to existing features?
- DB migration required (will affect prod)?
- Tests currently failing that might interact (101 known failing tests)?
- Any security considerations (input validation, auth checks)?

## Output

ONE message with the complete SPARC plan. No step-by-step updates.

The user can then run `/sparc:code` with this plan to begin implementation.
