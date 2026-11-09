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

**Shortcut:** `.claude/launch.json` defines all 5 servers (`ve-faq`, `ve-faq-api`, `sow-frontend`, `sow-backend`, `team-fund`) for the Claude desktop preview pane. The SOW backend `venv` is broken (shebang points to an old folder name), so it starts with system `python3 -m uvicorn main:app --port 8000`. Recreate the venv to go back to `source venv/bin/activate`.

⚠️ **CRITICAL**: All 5 servers must be running for local dev. If SOW Admin Backend (:8000) is not started, the SOW Generator iframe will fail auth and redirect to the login page.

## How the hub works (one page, many tools)

The product is **one page**: the VE FAQ app at `:5173` (prod `/login/`) is the shell. After sign-in, `AppNav` switches between sections; SOW, Admin and Team Fund are **iframes** inside that page, kept mounted after first open.

| Nav tab | Rendered by | Visible to |
|---|---|---|
| FAQ | `FAQDashboard.jsx` (+ Marcie chatbot) | everyone |
| Questionnaire | `SendQuestionnaire.jsx` | position contains `vp` or `manager` |
| SOW Generator | iframe → SOW frontend (`?userId&userName`) | everyone |
| Team Fund | iframe → Team Fund (`?userId&userName&position`) | everyone |
| Admin | iframe → SOW `/admin` | position = `support` |

- **Sign-in:** PrivyID or email + 6-digit PIN against the `Users` sheet (`POST /faq-api/auth`); session kept in `sessionStorage` (`ve_hub_user`). SOW re-checks via `POST /api/verify-user` (PrivyID only). Team Fund trusts the URL params.
- **Data:** everything lives in Google Sheets. Local dev reads and writes the **production** sheets — adding/editing FAQs, payments or SOWs locally changes live data; sending a questionnaire sends a real Gmail email.
- **Chatbot (Marcie):** `POST /faq-api/chatbot` scores FAQs by token overlap, sends the top 10 to DeepSeek (`deepseek-chat`) with a system prompt (`api/index.js`). The model ends with `---REFS: id, id`; the server strips that line and maps IDs to reference chips. Top-scored fallback chips appear only when the REFS line is missing entirely. Icon: `src/assets/marcie.png`.

## UI conventions (Privy App Design V2, hub revamp from v4.3.0)

- **Every page uses the shared left-aligned header** (`title`, `subtitle`, `actions`; 28px/600 title, one red primary action max). Three copies keep the same layout: `apps/ve-faq/src/components/PageHeader.jsx`, `apps/sow-generator/frontend/components/page-header.tsx` (also `EditorHeader` for the form editors), `apps/teamfundsheets/components/page-header.tsx`. Change all three together.
- **Charts:** categorical colors come from the dataviz default palette in fixed order and are validated with its script; every chart value is also shown as text (table or labels). Example: `apps/teamfundsheets/components/expense-donut.tsx`.
- **Page width:** content max 1280px (SOW admin 1440px), 32px gutters desktop, 16px at ≤768px (`.dashboard-container`, `.questionnaire-page`, `max-w-[1280px] px-8 max-md:px-4` in the Next.js apps).
- **Controls:** 44px inputs/buttons, 40px chips/nav tabs, 14px control text, 16px body, sentence case everywhere, selection = blue (`--selection`), red only for the primary action and the active-tab underline.
- **Accessibility:** icon-only buttons need `aria-label`; toggles use `aria-pressed`; tab sets use `role="tablist"`/`aria-selected`; drawers (`StatsDashboard`, `ActivityLog`) are `role="dialog"` and close on Escape.
- **Where the CSS lives:** `apps/ve-faq/src/index.css` (~3.3k lines). Revamp overrides are appended at the end in blocks labelled `Phase 2: …` — edit those first; they win over older rules by source order.

## Checks

- Builds: `npm run build` in `apps/ve-faq`, `apps/sow-generator/frontend`, `apps/teamfundsheets` (all pass as of v4.3.0).
- Lint: `npx eslint` in `apps/ve-faq` reports ~50 pre-existing problems. The two Next.js apps have no ESLint installed, so `npx eslint` downloads ESLint 10 and crashes — install a pinned ESLint before relying on lint there.
- No automated tests exist. Connection checks: `GET /faq-api/debug` (dev only) tests the Sheets connection; SOW `GET /api/master-data`; Team Fund `GET /api/payments`.

## Known risks (not fixed yet)

- `apps/ve-faq/gmail api/client_secret_*.json` is untracked but **not gitignored** — never `git add .`.
- Write endpoints trust the client-sent `userId`; Team Fund role comes from the `position` URL param; PINs are plain 6 digits with no rate limit; CORS is open on both APIs.
- The old `.envstg` token remains in GitHub history via tag `v4.0.0` — rotate it and never push all tags (`git push --tags`); push tags by name.
- Team Fund fetches payments/expenses/targets 3× per load; hub sends some requests twice.

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
| `GMAIL_CLIENT_ID` | Express API (questionnaire emails) |
| `GMAIL_CLIENT_SECRET` | Express API (questionnaire emails) |
| `GMAIL_REFRESH_TOKEN` | Express API (questionnaire emails) |
| `GMAIL_USER` | Express API (questionnaire emails) |
| `BASE_URL` | Express API (questionnaire link construction) |

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
6. **Versioning** — every notable change gets a `vX.Y.Z` annotated git tag + a `CHANGELOG.md` entry at repo root. Large UI/UX changes: tag a baseline first (e.g. `v1.0.0`), then tag the new state (`v2.0.0`) — revert with `git checkout vX.Y.Z -- <path>` or `git revert <commit>`. Independence Day theme change: baseline `v1.0.0`, new state `v2.0.0`.

## Key files

- `apps/ve-faq/src/App.jsx` — Main app, tabs, iframe mounting, `TEAM_FUND_ORIGIN` URL
- `apps/ve-faq/src/components/AppNav.jsx` — Nav bar with tabs (`<nav>`, `aria-current`, labels visually hidden <600px)
- `apps/ve-faq/src/components/PageHeader.jsx` — Shared page header used by every hub page
- `apps/ve-faq/src/components/FAQChatbot.jsx` — Marcie chatbot UI (`BOT_NAME`, icon `src/assets/marcie.png`)
- `.claude/launch.json` — Local dev server definitions for all 5 servers
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
