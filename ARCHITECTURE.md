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
| **8000** | Admin Backend | Python FastAPI | `apps/sow-generator/backend/main.py` |
| **3002** | Team Fund Tracker | Next.js | `apps/teamfundsheets/` |

## Start all servers

```bash
# Terminal 1 — VE FAQ
cd "apps/ve-faq" && npm run dev                     # :5173

# Terminal 2 — Express API
cd "apps/ve-faq" && node api/index.js               # :3001

# Terminal 3 — SOW Generator (use --webpack to avoid Turbopack crash)
cd "apps/sow-generator/frontend" && npm run dev -- --webpack  # :3000

# Terminal 4 — Admin
cd "apps/sow-generator/backend" && source venv/bin/activate && uvicorn main:app --port 8000  # :8000

# Terminal 5 — Team Fund
cd "apps/teamfundsheets" && npm run dev              # :3002
```

## Production (Vercel)

| Route | App | Build |
|-------|-----|-------|
| `/login/*` | VE FAQ (Vite) | `@vercel/static-build` |
| `/faq-api/*` | Express API | `@vercel/node` |
| `/fund/*` | Team Fund (Next.js + middleware) | `@vercel/next` |
| `/api/*` | SOW Admin (FastAPI) | `@vercel/python` |
| `/*` (catch-all) | SOW Generator (Next.js) | `@vercel/next` |

**⚠️ `basePath` not allowed with vercel.json `builds` array.** Use middleware.ts to strip `/fund` prefix instead.

## Env vars for Vercel

| Var | Used by |
|-----|---------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Express API (VE FAQ) |
| `GOOGLE_PRIVATE_KEY` | Express API (VE FAQ) |
| `GOOGLE_SPREADSHEET_ID` | Express API (VE FAQ) |
| `TF_GOOGLE_SERVICE_ACCOUNT_EMAIL` | Team Fund |
| `TF_GOOGLE_PRIVATE_KEY` | Team Fund |
| `TF_GOOGLE_SPREADSHEET_ID` | Team Fund |
| `TELEGRAM_BOT_TOKEN` | SOW Admin |
| `TELEGRAM_CHAT_ID` | SOW Admin |
| `DEEPSEEK_API_KEY` | Express API (chatbot) |

## Key files

- `apps/ve-faq/src/App.jsx` — Main app, tabs, iframe mounting
- `apps/ve-faq/src/components/AppNav.jsx` — Nav bar with tabs
- `apps/ve-faq/api/index.js` — Express API (auth, FAQ, users)
- `apps/ve-faq/src/users.json` — Fallback user registry
- `apps/teamfundsheets/middleware.ts` — Strips `/fund` prefix in production
- `apps/teamfundsheets/lib/api-base.ts` — Auto-detects prod vs localhost for API paths
- `apps/teamfundsheets/lib/google-sheets.ts` — Google Sheets CRUD (uses TF_* env vars)
- `apps/sow-generator/frontend/` — SOW Generator Next.js
- `apps/sow-generator/backend/main.py` — FastAPI admin
- `vercel.json` — Vercel build + routing config
