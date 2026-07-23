# Project Architecture

## Overview

```
┌──────────────────────────────────────────────────┐
│  VE FAQ (Vite/React)         localhost:5173       │
│  ┌──────────────────────────────────────────────┐ │
│  │  Login → AppNav → FAQ Dashboard             │ │
│  │                    SOW (iframe → :3000)      │ │
│  │                    Admin (iframe → :8000)    │ │
│  └──────────────────────────────────────────────┘ │
│                    API :3001                       │
└──────────────────────────────────────────────────┘
```

Single-page app hosted at `/login/` with tabs for FAQ, SOW Generator, and Admin. Auth handled here, other apps embedded as iframes.

## Ports

| Port | App | Type | Directory |
|------|-----|------|-----------|
| **5173** | VE FAQ | Vite/React | `apps/ve-faq/` |
| **3001** | Express API | Node/Express | `apps/ve-faq/api/index.js` |
| **3000** | SOW Generator | Next.js | `apps/sow-generator/frontend/` |
| **8000** | Admin Backend | Python FastAPI | `apps/sow-generator/backend/main.py` |

## How to start all servers

```bash
# Terminal 1 — VE FAQ frontend
cd "apps/ve-faq" && npm run dev          # :5173

# Terminal 2 — Express API (FAQ API + login auth)
# ⚠️  MUST cd here first — dotenv.config() loads .env from CWD, not script dir.
#     Running from the wrong folder silently skips .env → Google Sheets fails → login broken.
cd "apps/ve-faq" && node api/index.js    # :3001

# Terminal 3 — SOW Generator (Next.js)
cd "apps/sow-generator/frontend" && npm run dev  # :3000

# Terminal 4 — Admin (FastAPI)
cd "apps/sow-generator/backend" && source venv/bin/activate && uvicorn main:app --port 8000  # :8000
```

## How they connect

- VE FAQ embeds SOW Generator and Admin page as `<iframe>` elements
- Communication uses `postMessage` between parent (VE FAQ) and iframes
- Express API handles all FAQ-related endpoints (`/faq-api/*`) and serves Google Sheets data
- SOW Generator frontend calls FastAPI directly at `http://localhost:8000/api/*` (configured via `NEXT_PUBLIC_API_URL`)
- All apps share auth via the VE FAQ login page — userId/userName passed as URL params to iframes
- When in iframe, SOW Generator hides its internal header; Admin page always shows its header

## Auth & User Login

- **Login uses the FAQ API (Express, port 3001)** at `POST /faq-api/auth`. This is the ONLY auth source — there is no separate auth service.
- **User data** (PrivyID, Name, PIN, Email, Position) comes from the **Google Sheets `Users` sheet**, NOT from `apps/ve-faq/src/users.json`.
- `users.json` is only a local fallback when Google Sheets is unreachable (e.g. Express API started from wrong directory without `.env`).
- On every login attempt, the Express API refreshes the user registry from Google Sheets, so edits to the sheet take effect immediately.
- **If login fails with "PrivyID or email not found":** the Express API is likely running without Google Sheets access. Check the server log for `Google Sheets NOT configured` — if present, restart from the correct directory (see above).

## Key files

- `apps/ve-faq/src/App.jsx` — Main app with AppNav, tabs, iframe mounting
- `apps/ve-faq/src/components/FAQChatbot.jsx` — Floating chatbot component
- `apps/ve-faq/api/index.js` — Express API with FAQ, auth, chatbot endpoints
- `apps/sow-generator/frontend/` — Next.js app for SOW document generation
- `apps/sow-generator/backend/main.py` — FastAPI backend for SOW/admin

## Note on `.opencode/session.md`

Check `session.md` for the most recent work done and pending items.
