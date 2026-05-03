Run the RestoFlow test suite, identify all failures, and generate targeted fixes.

## About the Test Setup

- **Test runner:** Vitest
- **Run command:** `pnpm test`
- **Known state:** 143/244 tests passing, 101 failing
- **Test files:** `tests/` directory (22 test files)
- **Known fixed:** `profitability.test.ts`, `financial-analytics.test.ts`

## Steps

### 1. Run Tests
```bash
pnpm test --reporter=verbose 2>&1 | head -200
```
Capture all failing test names, file paths, and error messages.

### 2. Categorise Failures
Group failures by type:
- **DB connection errors** — TiDB/MySQL connection issues (fix: mock DB in tests)
- **Type errors** — TypeScript mismatches
- **Logic errors** — Wrong expected values
- **Missing mocks** — External services not mocked
- **Import errors** — Missing modules or bad paths

### 3. Prioritise
Focus on failures that:
1. Block the most code paths
2. Are quick wins (type fixes, import fixes)
3. Are in core modules (POS, Inventory, Financial)

### 4. Generate Fixes
For each failing test (or batch of similar failures):
- Show the failing assertion
- Explain why it's failing
- Provide the exact fix (code diff or replacement)
- Flag if the fix requires a source code change vs test-only change

### 5. Apply Fixes
- ALWAYS read the file before editing
- Make the smallest possible change to fix the test
- Never change test assertions to match wrong behaviour — fix the source code

### 6. Verify
After fixes:
```bash
pnpm test
```
Report: X/244 now passing (up from 143).

## Output

ONE message when complete:
- Summary of failures found
- Fixes applied (file + change description)
- New test pass rate
- Remaining failures (if any) with explanation of why they need more investigation

Do NOT give step-by-step updates. ONE summary when complete.
