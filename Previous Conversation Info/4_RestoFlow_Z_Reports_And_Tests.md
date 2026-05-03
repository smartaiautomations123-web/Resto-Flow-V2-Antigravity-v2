# Implementation Plan - zReports CRUD & Aggregation
*Preserved from chat ID: 4da6acab-7a4b-4391-b006-f6ac49a9de82*

Complete the backend implementation for Z-Reports (End-of-Day summaries), including multi-location support, detailed order aggregation, and shift reconciliation.

## User Review Required
> [!IMPORTANT]
> I will add a `locationId` column to `zReports`, `zReportItems`, and `zReportShifts` to support the requested location-based filtering.
> The `generateZReport` function will be updated to perform a full aggregation of daily orders, including breakdown by payment method and menu category.

## Proposed Changes

### Database Schema (drizzle/schema.ts)
- Add `locationId: int("locationId")` to `zReports`, `zReportItems`, and `zReportShifts`.

### Database Layer (server/db.ts)
- **Implement `generateZReport(date, staffId, locationId)`**:
  - Aggregate totals: revenue, orders, discounts, voids, tips.
  - Breakdown by payment: cash, card, split.
  - Breakdown by category (populate `zReportItems`).
- **Implement `getZReportByLocation(locationId, limit)`**.
- **Implement `reconcileShiftCash(reportId, shiftNumber, actualCash, staffId)`**:
  - Update/Create `zReportShifts` with reconcile data.
- **Update existing functions**: `getZReportDetails`, `getZReportsByDateRange` to support `locationId`.

### API Router (server/routers.ts)
- Update `zReports` router:
  - Add `getByLocation: protectedProcedure.input(z.object({ locationId: z.number() })).query(...)`.
  - Add `reconcileShift: adminProcedure.input(z.object({ reportId: z.number(), shiftNumber: z.number(), actualCash: z.string(), staffId: z.number().optional() })).mutation(...)`.
  - Ensure `generate` accepts `locationId`.

## Verification Plan
1. Run `npx vitest run server/zreports.test.ts`.
2. Verify aggregation correctness by comparing with `financial-analytics` results for the same day.
3. Generate a Z-Report for a day with sample orders and verify the breakdown in the UI.
