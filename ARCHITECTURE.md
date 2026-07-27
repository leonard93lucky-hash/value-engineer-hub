# Project Architecture

## Overview

```
┌──────────────────────────────────────────────────┐
│  VE FAQ (Vite/React)         localhost:5173       │
│  ┌──────────────────────────────────────────────┐ │
│  │  Login → AppNav → FAQ Dashboard             │ │
│  │                    SOW (iframe → :3000)      │ │
│  │                    Admin (iframe → :8000)    │ │
│  │                    Team Fund (iframe :3002)  │ │
│  └──────────────────────────────────────────────┘ │
│              Express API :3001                     │
└──────────────────────────────────────────────────┘
```

## Ports (local dev)

| Port | App | Type | Directory |
|------|-----|------|-----------|
| **5173** | VE FAQ | Vite/React | `apps/ve-faq/` |
| **3001** | Express API | Node/Express | `apps/ve-faq/api/index.js` |
| **3000** | SOW Generator | Next.js | `apps/sow-generator/frontend/` |
| **8000** | SOW Admin Backend | Python FastAPI | `apps/sow-generator/backend/main.py` |
| **3002** | Team Fund Tracker | Next.js | `apps/teamfundsheets/` |

⚠️ **PORT CONFLICTS**: SOW Generator and Team Fund both default to Next.js port 3000. Team Fund MUST run on port 3002 using `next dev -p 3002`.

## Start all servers (5 terminals required)

```bash
# Terminal 1 — VE FAQ
cd "apps/ve-faq" && npm run dev                     # :5173

# Terminal 2 — Express API
cd "apps/ve-faq" && node api/index.js               # :3001

# Terminal 3 — SOW Generator Frontend (use --webpack to avoid Turbopack crash)
cd "apps/sow-generator/frontend" && npm run dev -- --webpack  # :3000

# Terminal 4 — SOW Admin Backend (REQUIRED for SOW auth to work)
cd "apps/sow-generator/backend" && source venv/bin/activate && uvicorn main:app --port 8000  # :8000

# Terminal 5 — Team Fund (MUST use -p 3002, not default 3000)
cd "apps/teamfundsheets" && npx next dev -p 3002    # :3002
```

⚠️ **CRITICAL**: All 5 servers must be running for local dev. If SOW Admin Backend (:8000) is not started, the SOW Generator iframe will fail auth and redirect to the login page.

## Vercel Production — Project Mapping

| Vercel Project | GitHub Repo | Root Directory | Framework | Prod URL |
|---------------|-------------|---------------|-----------|----------|
| **ve-hub** | `value-engineer-hub` | `.` (monorepo root) | Uses `vercel.json` builds | `https://valueengineeringhub.vercel.app` |
| **v0-team-fund-idr-tracker** | `value-engineer-hub` | `apps/teamfundsheets` | Next.js | `https://v0-team-fund-idr-tracker-leonard93lucky-2074s-projects.vercel.app` |

### Production Routing (ve-hub, via vercel.json)

| Route | App | Build |
|-------|-----|-------|
| `/login/*` | VE FAQ (Vite) | `@vercel/static-build` |
| `/faq-api/*` | Express API | `@vercel/node` |
| `/api/*` | SOW Admin (FastAPI) | `@vercel/python` |
| `/*` (catch-all) | SOW Generator (Next.js) | `@vercel/next` |

### ⚠️ Team Fund is a SEPARATE Vercel project

- **NOT part of the monorepo build** in `vercel.json` (removed — caused "basePath not allowed" error)
- Deployed independently via `v0-team-fund-idr-tracker` project
- Root Directory MUST be `apps/teamfundsheets` (NOT `.`)
- Framework: Next.js
- Uses `TF_GOOGLE_*` env vars (different service account than the hub)

## Env vars for Vercel

### ve-hub project

| Var | Used by |
|-----|---------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Express API |
| `GOOGLE_PRIVATE_KEY` | Express API |
| `GOOGLE_SPREADSHEET_ID` | Express API |
| `TELEGRAM_BOT_TOKEN` | SOW Admin |
| `TELEGRAM_CHAT_ID` | SOW Admin |
| `DEEPSEEK_API_KEY` | Express API (chatbot) |

### v0-team-fund-idr-tracker project

| Var | Used by |
|-----|---------|
| `TF_GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google Sheets |
| `TF_GOOGLE_PRIVATE_KEY` | Google Sheets |
| `TF_GOOGLE_SPREADSHEET_ID` | Google Sheets |
| `NEXT_PUBLIC_HUB_URL` | Income modal user dropdown (`https://valueengineeringhub.vercel.app`) |

## Deploy Rules (MUST FOLLOW)

1. **Deploy ONLY via GitHub push** — never use `vercel --prod` CLI command. Push commits to `main` branch, Vercel auto-deploys both projects.
2. **Never convert API to CommonJS** — `apps/ve-faq/api/index.js` and `google-sheets.js` must remain ESM (`.js` extension with `import`/`export`). Converting to `.cjs` breaks the deployment.
3. **Team Fund root directory** — on `v0-team-fund-idr-tracker` Vercel project, root directory MUST be `apps/teamfundsheets`. If it's `.`, it will deploy the hub code instead.
4. **Team Fund port** — locally must use port 3002 (`next dev -p 3002`) to not conflict with SOW Generator on 3000.
5. **SOW backend must run** — without `:8000`, SOW iframe auth fails and redirects to login page.

## Key files

- `apps/ve-faq/src/App.jsx` — Main app, tabs, iframe mounting, `TEAM_FUND_ORIGIN` URL
- `apps/ve-faq/src/components/AppNav.jsx` — Nav bar with tabs
- `apps/ve-faq/api/index.js` — Express API (auth, FAQ, users) — **ESM, NOT CommonJS**
- `apps/ve-faq/api/google-sheets.js` — Google Sheets CRUD — **ESM, NOT CommonJS**
- `apps/ve-faq/src/users.json` — Fallback user registry
- `apps/teamfundsheets/app/providers.tsx` — Auth context, reads position/userId/userName from URL params
- `apps/teamfundsheets/components/home-content.tsx` — Main page, fetches payments/expenses/targets
- `apps/teamfundsheets/components/income-modal.tsx` — Income form with user dropdown from hub API
- `apps/teamfundsheets/lib/google-sheets.ts` — Google Sheets CRUD (uses TF_* env vars)
- `apps/teamfundsheets/lib/api-base.ts` — API path utility (prepends NEXT_PUBLIC_BASE_PATH)
- `apps/sow-generator/frontend/components/app-wrapper.tsx` — SOW auth flow, verify-user call
- `apps/sow-generator/frontend/lib/constants.ts` — API_BASE_URL = NEXT_PUBLIC_API_URL || "/api"
- `apps/sow-generator/frontend/.env` — NEXT_PUBLIC_API_URL=http://localhost:8000/api
- `apps/sow-generator/backend/main.py` — FastAPI admin, /api/verify-user endpoint
- `vercel.json` — Vercel build + routing config (hub only, Team Fund NOT included)
