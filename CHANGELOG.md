# Changelog

All notable changes are tracked here. Versioning: `vX.Y.Z` git tags at the repo root (tags mark reversible checkpoints — `git checkout vX.Y.Z -- <path>` or `git revert <commit>` restores a version).

## v4.5.1 — 2026-11-12 — Games: no error box after a try

> Reversibility: baseline `v4.5.0`. Revert with `git checkout v4.5.0 -- apps/ve-faq/src/components/GamesPage.jsx apps/ve-faq/src/components/games/MarcieFlight.jsx apps/ve-faq/src/index.css apps/teamfundsheets/lib/games.ts`.

### Fixed
- After each try the page reloaded tries and the leaderboard with a second request; one failed reload replaced the game with a red "Try again" box. `POST /api/games/finish` now returns the fresh state, loads retry 3 times quietly, and a failed refresh keeps the current view.

### Changed
- First load shows a neutral spinner panel ("Loading your tries…", then "Still connecting…" with Retry now) instead of an error.
- Buttons say "Starting…" / "Saving score…"; a status line under the game shows saving, leaderboard updates and today's best. Score saves retry once on network or server errors.

## v4.5.0 — 2026-11-12 — Games page (Marcie's flight) + Team Fund year selector

> Reversibility: baseline `v4.4.1`. Revert with `git checkout v4.4.1 -- apps/ve-faq/src/ apps/teamfundsheets/` (then delete `apps/teamfundsheets/app/api/games/`, `apps/teamfundsheets/lib/games.ts`, `apps/teamfundsheets/lib/cors.ts`, `apps/ve-faq/src/components/GamesPage.jsx`, `apps/ve-faq/src/components/games/`). The `GameScores` tab in the Team Fund sheet stays; it is harmless without the page.

### Added
- **Games tab** in the hub nav → `GamesPage.jsx`: daily mini games, 3 tries per person per game per day (WIB), leaderboard "This month" / "All time" (best score per person, top 10 + your row). Built to hold more games (`GAMES` list).
- **Marcie's flight** (`components/games/MarcieFlight.jsx`): original one-tap canvas flying game; side-view Marcie drawn in canvas (cap, goggles, scarf, flapping wing). Space / Arrow up / tap to flap; one point per tower.
- **Game score API in the Team Fund app** (`lib/games.ts`, `lib/cors.ts`, `app/api/games/{state,start,finish}`): stores tries in a new `GameScores` tab of the Team Fund spreadsheet; a try is recorded on start, its score on finish; impossible scores for the time played are rejected; CORS allows only the hub origins (`HUB_ORIGINS` env overrides).
- **Team Fund year selector** in the header: goal progress, the monthly chart and the expenses donut follow the chosen year (current year by default; past years show the full year); top totals stay all time and say so.

## v4.4.1 — 2026-11-09 — Team Fund mobile overflow fixes + hub iframe offset

> Reversibility: baseline `v4.4.0`. Revert with `git checkout v4.4.0 -- apps/teamfundsheets/components/ apps/ve-faq/src/index.css apps/ve-faq/src/App.jsx`.

### Fixed
- **Team Fund on phones**: no more horizontal overflow (page was 454px wide inside a 375px iframe) — goal rows wrap the amount to the next line, grid items/bar tracks are `min-w-0`, card padding `p-4 sm:p-6`
- **Transaction history**: pagination row and page buttons wrap on narrow widths
- **Expenses by category**: donut and table stack inside the card on lg+ and no longer overflow; `table-fixed` with fixed amount/share column widths; category rows truncate safely
- **Monthly chart**: shortened Y axis labels (`Rp 350 rb`, `Rp 1,05 jt`), axis width 76px; tooltip still shows full amounts
- **Hub iframes**: SOW / Admin / Team Fund iframes now start exactly below the nav at every width — the offset comes from a measured CSS variable `--app-nav-height` (62px ≤768px, ~65px desktop) instead of a hardcoded 56px

### Changed
- `ARCHITECTURE.md`: documented the broken gh credential helper workaround and which Vercel project redeploys per app

## v4.4.0 — 2026-11-09 — Hub UI revamp phases 3–4 (SOW Generator, Team Fund) + expense donut

> Reversibility: baseline `v4.3.0`. Revert with `git checkout v4.3.0 -- apps/sow-generator/frontend/ apps/teamfundsheets/`.

### Added
- **SOW** `components/page-header.tsx`: `PageHeader` (same layout as the hub) and `EditorHeader` (44px back button + title) for the split-screen editors
- **SOW landing**: two columns on desktop. Left: "Document types" rows with description, "You will fill in" field chips and a "Create document" button. Right: "How it works" (3 steps with icons) and "Latest updates" (every note from `/api/updates` with its description, one scroll list with an always-visible scrollbar). Both columns end on the same line; one column below 1024px
- **Team Fund** `components/page-header.tsx` and `components/expense-donut.tsx`: "Expenses by category" donut, year to date in WIB, total + entry count in the center, hover tooltip, and a table with amount and share per category (validated categorical colors in fixed category order; unknown categories fold into Other)

### Changed
- **SOW forms** (SDK Liveness, API PrivyPass, Credential): shared `EditorHeader`, form panel 45% wide in all three, doubled side padding removed, section headings 16px sentence case
- **SOW admin**: shared page header ("SOW admin") with labelled Refresh and Update notes buttons; content max 1440px
- **SOW text**: 9–11px text raised to 12px and all-caps labels removed across forms, admin and update notes (document previews unchanged on purpose)
- **Team Fund**: left-aligned shared header ("Team fund") with Export CSV / Refresh / Add expense / Add income; content 1280px with 32px/16px gutters; sentence-case headings and card labels; status text 14px; monthly chart Y axis widened with id-ID number format
- `ARCHITECTURE.md`: UI conventions now cover SOW and Team Fund

## v4.3.0 — 2026-11-06 — Hub UI revamp phases 1–2 (nav, shared header, FAQ, Questionnaire)

> Reversibility: baseline `v4.2.0`. Revert with `git checkout v4.2.0 -- apps/ve-faq/src/`. SOW and Team Fund are unchanged in this release (phases 3–4 pending).

### Added
- **Shared page header** `apps/ve-faq/src/components/PageHeader.jsx` + `.page-header` CSS: left-aligned 28px title, subtitle, actions on the right
- `.claude/launch.json` — local definitions for all 5 dev servers

### Changed
- **Nav** (`AppNav.jsx`): `<nav aria-label>`, `aria-current` on the active tab, 14px/40px tabs, labels visually hidden below 600px (still read by screen readers), "Log out" accessible name
- **FAQ page**: centered banner + utility strip replaced by the shared header (Leaderboard, Activity log, Refresh, Add FAQ as the single red action); full-width search; contributors as a compact row; 40px category chips (one scrollable row on mobile); sentence-case labels and badges; `aria-pressed` on filters and sort; 16px answers; content max 1280px with 32px/16px gutters
- **Leaderboard / Activity log drawers**: close on Escape, `role="dialog"`, sentence-case titles and tabs; top-rated bars use success green instead of warning brown
- **Questionnaire page**: shared header ("Client questionnaire"), tablist semantics, 44px inputs, blue question selection, sentence-case filter labels, "Submitted between (WIB)" date range, duplicate "Clear Filters" removed, filters stack full width on mobile
- `ARCHITECTURE.md`: how the one-page hub works, UI conventions, checks, known risks

### Fixed
- Long URLs in FAQ answers overflowed the card (now wrap)

## v4.2.0 — 2026-11-06 — Marcie chatbot + reply references fix

> Reversibility: baseline `v4.1.0`. Revert with `git checkout v4.1.0 -- apps/ve-faq/`. This tag is also the baseline for the hub-wide UI revamp.

### Changed
- **Chatbot renamed Privy T-3000 → Marcie** (`apps/ve-faq/src/components/FAQChatbot.jsx`, system prompt in `apps/ve-faq/api/index.js`): owl sticker icon `apps/ve-faq/src/assets/marcie.png` (wording and background removed) on the floating button, panel header and reply avatars; avatar padding tightened in `index.css`

### Fixed
- **Stray `---REFS:` line in chatbot replies** — empty or "none" reference lists now parse and are stripped; unrelated top-scored FAQ chips only appear when the model omits the REFS line entirely

## v4.1.0 — 2026-09-23 — Team Fund page header + latest-first sorting

> Reversibility: baseline `v4.0.0`. Revert with `git checkout v4.0.0 -- apps/teamfundsheets/`.

### Changed
- **Team Fund header** (`apps/teamfundsheets/components/header.tsx`): removed sticky nav-bar treatment (sticky top bar, Privy logo, divider) that stacked under the hub AppNav as "header within header". Now a FAQ-style centered page header (28px/600 title + muted subtitle + centered action row). User shown as "Signed in as …" subtitle.
- **Transaction ordering** (`apps/teamfundsheets/components/transaction-history.tsx`, `home-content.tsx` CSV export): payments sorted by `transferDate` desc, expenses by `date` desc, tiebreak by numeric `id` (creation timestamp) desc. Invalid dates sort last.

## v4.0.0 — 2026-09-17 — Privy App Design Guideline V2 Revamp (all apps)

> Reversibility: baseline `v3.0.0`. Revert all with `git checkout v3.0.0 -- apps/` (per app: `apps/ve-faq/`, `apps/sow-generator/`, `apps/teamfundsheets/`).

### Added
- **Google Sans self-hosted** in all three apps — v70 variable font (400–700, OFL) latin + latin-ext WOFF2 + `LICENSE.txt`: `apps/ve-faq/src/assets/fonts/`, `apps/sow-generator/frontend/public/fonts/`, `apps/teamfundsheets/public/fonts/` (replaces Inter / Geist / Geist Mono / Merriweather)
- **V2 design tokens** per app — Privy Red `#E60034`, Burgundy `#430A23`, Warm Canvas `#F7F5F2`, selection `#1D4ED8`/`#EAF2FF`, focus `#2563EB`, success/warning/danger/info pairs, input boundary `#8E7D87`, radii 6/8/12/16, 44px controls, reduced-motion support
- `apps/teamfundsheets/public/Privy_Logo_Red.png` + approved Privy logo now used in the Team Fund header and ve-faq (login, nav, questionnaire, chatbot)

### Changed
- **ve-faq**: full theme rewrite to V2 (3.4k-line `index.css` swept; login orbs, background orbs, hero gradient, chatbot glow/sparkles, red-gradient chrome all removed); FAQ dashboard rebuilt with a compact page header (centered title), quiet white cards, blue selection states; chatbot renamed **Indra → Privy T-3000** with the Privy logo as its icon (floating button, header, message avatars); emoji replaced with the react-icons set; nav de-striped
- **sow-generator**: V2 tokens + fonts; landing page rebuilt (decorative orbs removed, unified cards); ~680 class replacements across forms/admin (grays → tokens, `#F8001A` → `#E60034`, TBC → warning tones, selected options/checkboxes → selection blue, status badges → V2 semantics); document previews kept paper-like intentionally
- **teamfundsheets**: V2 tokens + fonts; header uses the Privy logo with Income as the single filled red action; net-balance card → burgundy; chart recolored (income = success, expenses = danger); tables get right-aligned tabular amounts, sentence-case headers, 40px pagination; modals get `role="dialog"`, Escape-to-close, focus return; `alert()` → sonner toasts (Toaster mounted)

### Fixed
- **Privy logo 404 in ve-faq** — the remote `privy.id/_nuxt/...` asset URL is dead (site rebuild); now bundled locally via Vite
- **Team Fund chart** tick color bug (`hsl(var(--oklch))` → invalid color) and hardcoded white tooltip
- **Team Fund modal type imports** (`@/app/page` → `@/lib/types`)
- **ve-faq undefined CSS variables** (`--accent`, `--surface-card`, `--primary-dark`) that broke PIN UI and scrollbars

## v3.0.0 — 2026-09-01 — Pastel Brown Theme + Indra Chatbot + Team Fund Cold-Start Fix

> Reversibility: baseline `v2.0.0`. Revert with `git checkout v2.0.0 -- apps/ve-faq/` or `git revert <commit>`.

### Changed
- **Theme → simple pastel brown** (`index.css`): Merah Putih red palette remapped to warm browns — `--primary: #A98467`, `--primary-hover: #8E6F57`, cream background `--bg-color: #F7F1E8`, dark brown text tones (`#4A3826`/`#6B4F35`). Orbs, hero (soft tan gradient with brown title/search), FAQ cards, chips, buttons, pagination, scrollbar all in the brown family. Error/danger reds kept for semantics.
- **Chatbot Gatotkaca → Indra** (`FAQChatbot.jsx` + CSS): image replaced with `public/indra.png`, FAB/header/msg avatar sizes reduced (80→64px FAB, 44→36px header, 34→28px msg, mobile 60→48px), `image-rendering: pixelated` removed (photo asset). Label "Ask Pak Gatotkaca" → "Ask Mas Indra", welcome message + placeholder use "Indra".
- **Indonesian flag removed** from the top nav (`AppNav.jsx` + CSS).

### Fixed
- **Team Fund cold-start "Failed to fetch"** (`apps/teamfundsheets/components/home-content.tsx`): `Promise.all` → `Promise.allSettled` so one failed request no longer blanks all three data sets; initial load auto-retries once after 2s (first `/api/payments` call can take ~10s during Turbopack compile + Google Sheets cold start).

## v2.0.0 — 2026-08-11 — Independence Day Theme (Merah Putih) + Gatotkaca Chatbot

> Reversibility: baseline tagged `v1.0.0`. Revert with `git checkout v1.0.0 -- apps/ve-faq/`.

### Added
- **Indonesian flag** badge in the top nav (inline SVG, red & white)
- `public/gatotkaca.webp` — Gatotkaca chatbot character asset (converted from `Gatotkaca copy.tiff`)

### Changed
- **Theme → Merah Putih (red & white)** for Independence Day month: RO pink/orange/cream palette remapped to flag red `#CE1126` + white/red tints throughout `index.css` (background, orbs, hero, search bar, FAQ cards, chips, buttons, pagination, scrollbar)
- **Bolder iteration**: solid white background, bold red hero panel (`#CE1126 → #A50F1E`) with white title/search, saturated red orbs (opacity 0.25–0.4), 4px red stripe on top of the nav, red accents on cards/chips/scrollbar
- `:root` variables: `--primary: #CE1126` (flag red), `--primary-hover: #A50F1E`, `--primary-glow` updated
- **Chatbot renamed Angeling → Gatotkaca**: icon, name, alt texts, placeholder, welcome message
- CSS section comment renamed to Gatotkaca styles

## v1.0.0 — 2026-08-11 — Baseline

- Pre-theme-change checkpoint. Includes: order-independent FAQ search, chatbot reference pagination fix, SOW Generator fixes, Team Fund, questionnaire email (Gmail API).
