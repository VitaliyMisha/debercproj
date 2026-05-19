# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## ⚡ Session Continuity (CRITICAL)
- **Session Start — ПЕРШЕ ЩО РОБИШ**: Читай `PROGRESS.md` — там поточний стан, завершені задачі та next steps. Без цього не відповідай на запитання про стан проєкту.
- **Session End — ПЕРЕД ЗАВЕРШЕННЯМ**: Онови `PROGRESS.md` — додай що зробив, нові архітектурні рішення, блокери, плани. Дата у заголовку — сьогоднішня.
- **Context Limits**: Ігноруй `node_modules`, `.next`, `public/assets`, `dist` та `mcp_config.json`.
- **Selective Reading**: Використовуй skill `superpowers:writing-plans` для визначення лише необхідних файлів перед їх читанням.

## Commands

```bash
bun run dev          # start dev server
bun run build        # production build
bun run preview      # preview production build
bun run test         # run tests (vitest run)
bun run lint         # biome check (read-only)
bun run lint:fix     # biome check --write (auto-fix)
bun run type-check   # tsc --noEmit
```

Run a single test file: `bun x vitest run tests/game.test.ts`

## Architecture

Single-page React app for scoring the Ukrainian card game Деберц (Deberc). No routing, no server — all state lives in `App.tsx` and persists to `localStorage`.

**Core data flow:**
- `src/types.ts` — `Player`, `Round`, `Game`, `GameRulesConfig`, `SavedGameState` interfaces (source of truth for shape)
- `src/utils/gameHelpers.ts` — all pure game logic: `calculateGameTotals`, `parseScore`, `isValidScore`, `getVisDisplayValue`, `loadWinCounts`, `saveWinCounts`, `generateUniqueId`, `saveGameState`, `loadGameState`, `clearSavedGame`, `loadPlayerNames`, `savePlayerNames`
- `src/hooks/useSound.ts` — Web Audio API hook: `fanfare` (used in WinnerScreen on mount), plus `chipClick`, `roundSubmit`, `undoPop` (implemented, not wired)
- `src/App.tsx` — owns all game state, orchestrates components, calls helpers

**Key components:**
- `SetupScreen.tsx` — game setup with `NameInput` for player names
- `NameInput.tsx` — input with dropdown autocomplete from player name history (iOS-safe)
- `RecoverScreen.tsx` — shown at startup if saved game exists; offers Resume or New Game
- `ScoreBoard.tsx` — live scores with leader highlight, progress bars, close-to-finish indicator
- `RoundForm.tsx` — per-player score entry with casino chip buttons (Б/ХВ/ВіС)
- `RoundHistory.tsx` — history table with undo chip, inline edit
- `GameHeader.tsx` — sound toggle, undo, new game (via ConfirmSheet)
- `ConfirmSheet.tsx` — reusable bottom sheet for confirmations
- `WinnerScreen.tsx` — victory screen with CardSuitsRain + fanfare

**Score entry values (stored in `Round.scores` as `Record<string, number | string>`):**
- Number → plain points (negative allowed)
- `'Б'` — first occurrence stored as string `'Б'` (worth 0); every subsequent Б adds `secondBPenalty` (-100)
- `ХВ` — converted by `parseScore` to `hvPenalty` (number, default -100) before storage
- `'ВІС'` — stored as uppercase string `'ВІС'` (U+0406); deferred until the next round. Win (own score > best opponent) → earn `hangingScore` bonus. Tie (equal) → carry forward another round. Loss (own score < best opponent) → take a Б (counted in bCounts).

`calculateGameTotals` iterates rounds in order, tracks `bCounts` and `pendingVis`, and returns `Record<playerId, totalScore>`.

`getVisDisplayValue` resolves what to show in the history for a ВіС cell — returns `'ВіС'` (lowercase U+0456, display token) when won/pending/tied, `'Б'` on first loss, or penalty number on subsequent losses. Accepts both `'ВіС'` and `'ВІС'` via `.toUpperCase()` normalization.

**localStorage keys:**
- `gameId` — auto-incrementing game counter
- `gameRules` — `GameRulesConfig` JSON
- `playerWinCounts` — `Record<playerId, winCount>` persisted across games
- `savedGame` — `SavedGameState` JSON: auto-saved active game; shown in RecoverScreen on next launch
- `playerNames` — `string[]` JSON: deduped list of all player names used (powers NameInput dropdown)

## Code style

Linter/formatter: **Biome** (not ESLint/Prettier). Config in `biome.json`:
- 2-space indent, single quotes, semicolons required, ES5 trailing commas, line width 140
- Import organisation is enforced automatically

## 🚀 Deployment (CRITICAL)
- **ЄДИНИЙ спосіб деплою**: `git push origin main` — Vercel підхоплює автоматично.
- **ЗАБОРОНЕНО**: запускати `vercel`, `npx vercel`, або будь-які команди Vercel CLI — це створює дублікат деплою.

## Guidelines & Skills
- **UI/UX**: Викликай skill `ui-ux-pro-max` для складних дизайн-рішень.
- **Logic**: Дотримуйся TDD для бізнес-логіки в `src/utils/` (Vitest). Повний набір тестів у `tests/helpers.test.ts`.
- **Rules**: Джерело правди для правил гри — `docs/GAME_RULES.md`.
- **Linting**: `bun run lint` (Biome) — обов'язково перед commit.

## Continuity
- **Session Start**: Читай `PROGRESS.md` ПЕРШИМ — там поточний стан та next steps.
- **Session End**: Перед завершенням — онови `PROGRESS.md`: завершені задачі, нові архітектурні рішення, блокери, плани. Оновлюй дату в заголовку.