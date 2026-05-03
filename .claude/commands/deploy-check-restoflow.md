Run a full pre-deployment verification for RestoFlow before pushing to production.

## Deployment Setup

- **GitHub repo:** `smartaiautomations123-web/Resto-Flow-V2-Antigravity`
- **Frontend:** Vercel (vercel.json configured in root)
- **Backend:** Vercel Serverless Functions via `api/index.ts`
- **Database:** MySQL (Neon/PlanetScale/Supabase) — `DATABASE_URL` in Vercel env
- **Package manager:** pnpm

## Checklist Steps

### 1. Build Verification
```bash
pnpm build
```
- Check for TypeScript errors
- Check for build warnings that could affect prod
- Report: ✅ Build passed / ❌ Build failed (with error details)

### 2. Test Suite
```bash
pnpm test
```
- Report current pass rate (target: 244/244, minimum acceptable: 200+/244)
- Flag any NEW failures vs known 101 failing baseline
- Block deployment if critical tests fail (POS, financial, auth)

### 3. Version Check
- Read `package.json` — report current `version` field
- Check if version was bumped since last deployment
- Suggest next version if not bumped (semantic versioning: patch / minor / major)

### 4. Vercel Config Check
- Confirm `vercel.json` exists in root
- Confirm `api/index.ts` exists (serverless function entry)
- Check for any hardcoded localhost URLs in the codebase:
  ```bash
  grep -r "localhost" client/src --include="*.ts" --include="*.tsx" | grep -v ".test."
  ```

### 5. Environment Variables Check
Confirm these are NOT hardcoded (must be in .env only):
- `DATABASE_URL`
- Any API keys in `server/`
- Any secrets in `shared/`

### 6. Git Status
```bash
git status
git log --oneline -5
```
- Report: uncommitted changes, last 5 commits
- Flag if there are untracked files that should be committed

### 7. GitHub Push
If all checks pass and user confirms:
```bash
git add [specific files]
git commit -m "chore: pre-deploy verification — vX.X.X"
git push origin main
```

## Output

ONE message with:
- ✅/❌ status for each check
- Overall: READY TO DEPLOY / NOT READY (with blockers listed)
- Version number confirmed
- Vercel dashboard URL: https://vercel.com/dashboard

Do NOT give step-by-step updates. ONE summary when complete.
