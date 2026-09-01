# Changelog

All notable changes are tracked here. Versioning: `vX.Y.Z` git tags at the repo root (tags mark reversible checkpoints — `git checkout vX.Y.Z -- <path>` or `git revert <commit>` restores a version).

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
