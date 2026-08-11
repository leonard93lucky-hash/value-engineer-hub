# Changelog

All notable changes are tracked here. Versioning: `vX.Y.Z` git tags at the repo root (tags mark reversible checkpoints — `git checkout vX.Y.Z -- <path>` or `git revert <commit>` restores a version).

## v2.0.0 — 2026-08-11 — Independence Day Theme (Merah Putih) + Gatotkaca Chatbot

> Reversibility: baseline tagged `v1.0.0`. Revert with `git checkout v1.0.0 -- apps/ve-faq/`.

### Added
- **Indonesian flag** badge in the top nav (inline SVG, red & white)
- `public/gatotkaca.webp` — Gatotkaca chatbot character asset (converted from `Gatotkaca copy.tiff`)

### Changed
- **Theme → Merah Putih (red & white)** for Independence Day month: RO pink/orange/cream palette remapped to flag red `#CE1126` + white/red tints throughout `index.css` (background, orbs, hero, search bar, FAQ cards, chips, buttons, pagination, scrollbar)
- `:root` variables: `--primary: #CE1126` (flag red), `--primary-hover: #A50F1E`, `--primary-glow` updated
- **Chatbot renamed Angeling → Gatotkaca**: icon, name, alt texts, placeholder, welcome message
- CSS section comment renamed to Gatotkaca styles

## v1.0.0 — 2026-08-11 — Baseline

- Pre-theme-change checkpoint. Includes: order-independent FAQ search, chatbot reference pagination fix, SOW Generator fixes, Team Fund, questionnaire email (Gmail API).
