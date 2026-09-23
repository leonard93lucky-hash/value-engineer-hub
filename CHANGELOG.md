# Changelog

All notable changes are tracked here. Versioning: `vX.Y.Z` git tags at the repo root (tags mark reversible checkpoints — `git checkout vX.Y.Z -- <path>` or `git revert <commit>` restores a version).

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
