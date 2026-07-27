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

Single-page app hosted at `/login/` with tabs for FAQ, SOW Generator, Admin, and Team Fund. Auth handled here, other apps embedded as iframes.

## Ports

| Port | App | Type | Directory |
|------|-----|------|-----------|
| **5173** | VE FAQ | Vite/React | `apps/ve-faq/` |
| **3001** | Express API | Node/Express | `apps/ve-faq/api/index.js` |
| **3000** | SOW Generator | Next.js | `apps/sow-generator/frontend/` |
| **8000** | Admin Backend | Python FastAPI | `apps/sow-generator/backend/main.py` |
| **3002** | Team Fund Tracker | Next.js | `apps/teamfundsheets/` |

## How to start all servers

```bash
# Terminal 1 — VE FAQ frontend
cd "apps/ve-faq" && npm run dev          # :5173

# Terminal 2 — Express API (FAQ API + login auth)
# ⚠️  MUST cd here first — dotenv.config() loads .env from CWD, not script dir.
#     Running from the wrong folder silently skips .env → Google Sheets fails → login broken.
cd "apps/ve-faq" && node api/index.js    # :3001

# Terminal 3 — SOW Generator (Next.js)
cd "apps/sow-generator/frontend" && npm run dev -- --webpack  # :3000 (use --webpack to avoid Turbopack crash)

# Terminal 4 — Admin (FastAPI)
cd "apps/sow-generator/backend" && source venv/bin/activate && uvicorn main:app --port 8000  # :8000

# Terminal 5 — Team Fund (Next.js with basePath /fund)
cd "apps/teamfundsheets" && npm run dev  # :3002 → http://localhost:3002/fund/
```

## How they connect

- VE FAQ embeds SOW Generator, Admin page, and Team Fund as `<iframe>` elements
- Communication uses `postMessage` between parent (VE FAQ) and iframes
- Express API handles all FAQ-related endpoints (`/faq-api/*`) and serves Google Sheets data
- SOW Generator frontend calls FastAPI directly at `http://localhost:8000/api/*` (configured via `NEXT_PUBLIC_API_URL`)
- Team Fund uses its own Google Sheets spreadsheet (configured via `.env` with `GOOGLE_SPREADSHEET_ID`)
- All apps share auth via the VE FAQ login page — userId/userName/position passed as URL params to iframes
- When in iframe, SOW Generator hides its internal header; Admin page always shows its header
- Team Fund uses position-based auth: `Support` users can edit, others view-only + export CSV

## Auth & User Login

- **Login uses the FAQ API (Express, port 3001)** at `POST /faq-api/auth`. This is the ONLY auth source — there is no separate auth service.
- **User data** (PrivyID, Name, PIN, Email, Position) comes from the **Google Sheets `Users` sheet**, NOT from `apps/ve-faq/src/users.json`.
- `users.json` is only a local fallback when Google Sheets is unreachable (e.g. Express API started from wrong directory without `.env`).
- On every login attempt, the Express API refreshes the user registry from Google Sheets, so edits to the sheet take effect immediately.
- **If login fails with "PrivyID or email not found":** the Express API is likely running without Google Sheets access. Check the server log for `Google Sheets NOT configured` — if present, restart from the correct directory (see above).
- **Team Fund auth**: Reads `position` from iframe URL params. Users with `position=Support` can add/edit/delete. All others are view-only.

## Production (Vercel)

| Route | App | Build |
|-------|-----|-------|
| `/login/*` | VE FAQ (Vite/React) | `@vercel/static-build` |
| `/faq-api/*` | Express API | `@vercel/node` |
| `/fund/*` | Team Fund Tracker (Next.js, basePath: `/fund`) | `@vercel/next` |
| `/api/*` | SOW Admin (FastAPI) | `@vercel/python` |
| `/*` (catch-all) | SOW Generator (Next.js) | `@vercel/next` |

## Vercel env vars needed

| Var | Used by |
|-----|---------|
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Express API, Team Fund |
| `GOOGLE_PRIVATE_KEY` | Express API, Team Fund |
| `GOOGLE_SPREADSHEET_ID` | Express API (VE FAQ), Team Fund (separate sheet) |
| `TELEGRAM_BOT_TOKEN` | SOW Admin (FastAPI) |
| `TELEGRAM_CHAT_ID` | SOW Admin (FastAPI) |
| `DEEPSEEK_API_KEY` | Express API (chatbot) |

## Key files

- `apps/ve-faq/src/App.jsx` — Main app with AppNav, tabs, iframe mounting
- `apps/ve-faq/src/components/FAQChatbot.jsx` — Floating chatbot component
- `apps/ve-faq/src/components/AppNav.jsx` — Navigation bar with tabs
- `apps/ve-faq/api/index.js` — Express API with FAQ, auth, chatbot, users endpoints
- `apps/sow-generator/frontend/` — Next.js app for SOW document generation
- `apps/sow-generator/backend/main.py` — FastAPI backend for SOW/admin
- `apps/teamfundsheets/` — Next.js Team Fund Tracker (payments, expenses, yearly targets)
- `apps/teamfundsheets/lib/google-sheets.ts` — Google Sheets CRUD (Payments, Expenses, YearlyTarget sheets)
- `apps/teamfundsheets/components/income-modal.tsx` — Add income with user dropdown from Express API
- `apps/teamfundsheets/components/targets-config.tsx` — Yearly target config (Support-only)
- `apps/teamfundsheets/components/transaction-history.tsx` — Paginated, filterable transactions
- `apps/ve-faq/src/users.json` — Fallback user registry (when Google Sheets unreachable)

## Note on `.opencode/session.md`

Check `session.md` for the most recent work done and pending items.
