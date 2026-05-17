# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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
- `src/types.ts` — `Player`, `Round`, `Game` interfaces (source of truth for shape)
- `src/components/GameRules.tsx` — also exports the `GameRulesConfig` interface (imported widely)
- `src/utils/gameHelpers.ts` — all pure game logic: `calculateGameTotals`, `parseScore`, `isValidScore`, `loadWinCounts`, `saveWinCounts`, `generateUniqueId`
- `src/App.tsx` — owns all game state, orchestrates components, calls helpers

**Score entry values:**
- Number → plain points
- `Б` — first occurrence stored as string `'Б'`; second occurrence triggers `secondBPenalty`
- `ХВ` — immediately converted to `hvPenalty` (number, default -100)
- `ВІС` — deferred: resolved the *next* round; if the ВІС player wins that round they earn the pending points, otherwise they take a `Б` penalty

`calculateGameTotals` iterates rounds in order, tracks `bCounts` and `pendingVis`, and returns `Record<playerId, totalScore>`.

**localStorage keys:**
- `gameId` — auto-incrementing game counter
- `gameRules` — `GameRulesConfig` JSON
- `playerWinCounts` — `Record<playerId, winCount>` persisted across games

## Code style

Linter/formatter: **Biome** (not ESLint/Prettier). Config in `biome.json`:
- 2-space indent, single quotes, semicolons required, ES5 trailing commas, line width 140
- Import organisation is enforced automatically

## 🚀 Deployment (CRITICAL)
- **ЄДИНИЙ спосіб деплою**: `git push origin main` — Vercel підхоплює автоматично.
- **ЗАБОРОНЕНО**: запускати `vercel`, `npx vercel`, або будь-які команди Vercel CLI — це створює дублікат деплою.

## Guidelines & Skills
- **UI/UX**: Викликай skill `ui-ux-pro-max` для складних дизайн-рішень.
- **Logic**: Дотримуйся TDD для бізнес-логіки в `src/lib/` (Vitest).
- **Linting**: `bun run lint` (Biome) — обов'язково перед commit.

## Continuity
- **Session Start**: Читай `PROGRESS.md` — там поточний стан, блокери та next steps.
- **Session End**: Оновлюй `PROGRESS.md` — виконані задачі, нові блокери, плани.