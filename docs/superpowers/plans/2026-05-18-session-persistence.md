# Session Persistence Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Зберігати поточну гру в localStorage після кожної зміни так, щоб при перезавантаженні додатку показувався RecoverScreen з пропозицією продовжити.

**Architecture:** Три нові чисті утиліти в `gameHelpers.ts` (saveGameState / loadGameState / clearGameState), новий компонент `RecoverScreen.tsx` зі скорбордом та двома кнопками, і мінімальні зміни в `App.tsx` — один `useEffect` для автозбереження плюс `recoveredState` для flow відновлення.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest, localStorage

---

## File Map

| Файл | Зміни |
|------|-------|
| `src/types.ts` | Додати тип `SavedGameState` |
| `src/utils/gameHelpers.ts` | Додати 3 утиліти: `saveGameState`, `loadGameState`, `clearGameState` |
| `tests/savedGame.test.ts` | Нові unit-тести для 3 утиліт |
| `src/components/RecoverScreen.tsx` | Новий компонент |
| `src/App.tsx` | Auto-save effect + `recoveredState` state + recovery flow |

---

### Task 1: SavedGameState тип + утиліти + тести

**Files:**
- Modify: `src/types.ts`
- Modify: `src/utils/gameHelpers.ts`
- Create: `tests/savedGame.test.ts`

- [ ] **Step 1: Написати тести, що падають**

Створити `tests/savedGame.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveGameState, loadGameState, clearGameState } from '../src/utils/gameHelpers';
import type { SavedGameState } from '../src/types';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => { store[key] = value; },
    removeItem: (key: string) => { delete store[key]; },
    clear: () => { store = {}; },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() { return Object.keys(store).length; },
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

const mockState: SavedGameState = {
  game: {
    id: 1,
    createdAt: '2026-05-18T00:00:00.000Z',
    players: [
      { id: 1001, name: 'Віталій', winCount: 0 },
      { id: 1002, name: 'Іванко', winCount: 1 },
    ],
    rounds: [{ id: 1, number: 1, scores: { '1001': 120, '1002': 80 }, dealerId: 1001 }],
    dealerId: 1002,
  },
  targetScore: 1020,
  winnerPlayer: null,
};

describe('savedGame persistence', () => {
  beforeEach(() => localStorage.clear());

  it('saveGameState + loadGameState round-trip', () => {
    saveGameState(mockState);
    expect(loadGameState()).toEqual(mockState);
  });

  it('loadGameState returns null when key absent', () => {
    expect(loadGameState()).toBeNull();
  });

  it('loadGameState returns null on corrupted JSON', () => {
    localStorage.setItem('savedGame', '{ broken json !!');
    expect(loadGameState()).toBeNull();
  });

  it('clearGameState removes the key', () => {
    saveGameState(mockState);
    clearGameState();
    expect(localStorage.getItem('savedGame')).toBeNull();
  });
});
```

- [ ] **Step 2: Запустити тести — переконатись що падають**

```bash
bun x vitest run tests/savedGame.test.ts
```

Очікувано: FAIL з "saveGameState is not a function" або подібне.

- [ ] **Step 3: Додати тип `SavedGameState` до `src/types.ts`**

Після рядка `export interface GameRulesConfig { ... }` (після закриваючої `}` на рядку 28) додати:

```typescript
export type SavedGameState = {
  game: Game;
  targetScore: number;
  winnerPlayer: number | null;
};
```

- [ ] **Step 4: Додати утиліти до `src/utils/gameHelpers.ts`**

В кінець файлу (після останнього рядку) додати:

```typescript
const SAVED_GAME_KEY = 'savedGame';

export function saveGameState(state: SavedGameState): void {
  localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(state));
}

export function loadGameState(): SavedGameState | null {
  try {
    const raw = localStorage.getItem(SAVED_GAME_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as SavedGameState;
  } catch {
    return null;
  }
}

export function clearGameState(): void {
  localStorage.removeItem(SAVED_GAME_KEY);
}
```

Також додати `SavedGameState` до import у верхній рядок файлу:

```typescript
import { Round, Game, GameRulesConfig, SavedGameState } from '../types';
```

- [ ] **Step 5: Запустити тести — переконатись що проходять**

```bash
bun x vitest run tests/savedGame.test.ts
```

Очікувано: PASS, 4/4.

- [ ] **Step 6: Запустити повний suite + type-check**

```bash
bun run test && bun run type-check
```

Очікувано: всі тести зелені, 0 type errors.

- [ ] **Step 7: Lint + commit**

```bash
bun run lint:fix
git add src/types.ts src/utils/gameHelpers.ts tests/savedGame.test.ts
git commit -m "feat: add SavedGameState type and localStorage persistence utilities"
```

---

### Task 2: RecoverScreen компонент

**Files:**
- Create: `src/components/RecoverScreen.tsx`

- [ ] **Step 1: Створити `src/components/RecoverScreen.tsx`**

```tsx
import React from 'react';
import { SavedGameState } from '../types';
import { GameRulesConfig } from '../types';
import { calculateGameTotals } from '../utils/gameHelpers';
import { Button } from './Button';

interface RecoverScreenProps {
  savedState: SavedGameState;
  gameRules: GameRulesConfig;
  onRecover: () => void;
  onDiscard: () => void;
}

export const RecoverScreen: React.FC<RecoverScreenProps> = ({
  savedState,
  gameRules,
  onRecover,
  onDiscard,
}) => {
  const { game, targetScore, winnerPlayer } = savedState;
  const totals = calculateGameTotals(game, gameRules);
  const roundCount = game.rounds.length;
  const isFinished = winnerPlayer !== null;
  const maxTotal = Math.max(...game.players.map((p) => totals[p.id] ?? 0));

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 py-6 px-4">
      {/* Header */}
      <div className="text-center">
        <h1 className="font-display text-4xl gold-gradient-text">Деберц ♠</h1>
      </div>

      {/* Card */}
      <div className="rounded-2xl bg-card-bg border border-white/10 p-5 flex flex-col gap-4">
        {/* Title row */}
        <div>
          <h2 className="font-display text-xl gold-gradient-text">
            {isFinished ? `Завершена гра #${game.id}` : `Незавершена гра #${game.id}`}
          </h2>
          <p className="text-muted text-sm mt-0.5">
            Раунд {roundCount} · до <span className="text-white font-semibold">{targetScore}</span> очок
          </p>
        </div>

        {/* Mini scoreboard */}
        <div className="flex flex-col gap-3">
          {game.players.map((player) => {
            const score = totals[player.id] ?? 0;
            const progress = Math.min(Math.max(score / targetScore, 0), 1);
            const isWinner = player.id === winnerPlayer;

            return (
              <div key={player.id} className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-sm font-display text-white/70">
                      {player.name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white text-sm font-medium font-sans">
                      {player.name}
                      {isWinner && <span className="ml-1.5 text-xs text-[#FBBF24]">👑</span>}
                    </span>
                  </div>
                  <span className="font-score text-white font-semibold tabular-nums">{score}</span>
                </div>
                {/* Progress bar */}
                <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-none"
                    style={{
                      width: `${progress * 100}%`,
                      background: isWinner
                        ? 'linear-gradient(90deg, #D97706, #FBBF24)'
                        : score >= targetScore * 0.85
                        ? 'linear-gradient(90deg, #EA580C, #FBBF24)'
                        : 'linear-gradient(90deg, #1D4ED8, #3B82F6)',
                      maxWidth: score >= targetScore ? '100%' : undefined,
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Buttons */}
      <div className="flex flex-col gap-3">
        <Button fullWidth onClick={onRecover} className="py-4 text-lg">
          {isFinished ? '🏆 Переглянути результат' : '▶ Продовжити гру'}
        </Button>
        <button
          type="button"
          onClick={onDiscard}
          className="w-full py-3 rounded-xl bg-card-bg border border-white/10 text-muted text-sm font-semibold
            hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60"
        >
          Нова гра
        </button>
      </div>
    </div>
  );
};

export default RecoverScreen;
```

- [ ] **Step 2: Перевірити type-check**

```bash
bun run type-check
```

Очікувано: 0 errors.

- [ ] **Step 3: Lint + commit**

```bash
bun run lint:fix
git add src/components/RecoverScreen.tsx
git commit -m "feat: add RecoverScreen component for saved game recovery"
```

---

### Task 3: App.tsx інтеграція

**Files:**
- Modify: `src/App.tsx`

- [ ] **Step 1: Додати імпорти в `src/App.tsx`**

Знайти рядок:
```typescript
import { generateUniqueId, isValidScore, loadWinCounts, parseScore, saveWinCounts, calculateGameTotals } from './utils/gameHelpers';
```

Замінити на:
```typescript
import { generateUniqueId, isValidScore, loadWinCounts, parseScore, saveWinCounts, calculateGameTotals, saveGameState, loadGameState, clearGameState } from './utils/gameHelpers';
import RecoverScreen from './components/RecoverScreen';
```

Також додати `SavedGameState` до import типів (рядок 2):
```typescript
import { Game, GameRulesConfig, Player, Round, SavedGameState } from './types';
```

- [ ] **Step 2: Додати `recoveredState` useState після існуючих useState**

Після рядка `const [snapshotRound, setSnapshotRound] = useState<number | null>(null);` (приблизно рядок 40) додати:

```typescript
const [recoveredState, setRecoveredState] = useState<SavedGameState | null>(() => loadGameState());
```

- [ ] **Step 3: Додати `useEffect` для auto-save після існуючих useEffect**

Після блоку `useEffect` з `beforeunload` (приблизно після рядка 72) додати:

```typescript
useEffect(() => {
  if (!game || game.rounds.length === 0) return;
  saveGameState({ game, targetScore, winnerPlayer });
}, [game, targetScore, winnerPlayer]);
```

- [ ] **Step 4: Додати `clearGameState()` у `resetGame` і `continueGame`**

Знайти функцію `resetGame`:
```typescript
const resetGame = () => {
  setGame(null);
  setNames(Array(playerCount).fill(''));
  setDealerIndex((dealerIndex + 1) % playerCount);
  setWinnerPlayer(null);
  setError('');
  setHasHistoryShown(false);
  setShowStatistics(false);
  setGameId(1);
  localStorage.removeItem(GAME_ID);
};
```

Замінити на:
```typescript
const resetGame = () => {
  clearGameState();
  setGame(null);
  setNames(Array(playerCount).fill(''));
  setDealerIndex((dealerIndex + 1) % playerCount);
  setWinnerPlayer(null);
  setError('');
  setHasHistoryShown(false);
  setShowStatistics(false);
  setGameId(1);
  localStorage.removeItem(GAME_ID);
};
```

Знайти функцію `continueGame`:
```typescript
const continueGame = () => {
  if (game) {
    createGame(game.players, true, true, game.dealerId);
  }
};
```

Замінити на:
```typescript
const continueGame = () => {
  if (game) {
    clearGameState();
    createGame(game.players, true, true, game.dealerId);
  }
};
```

- [ ] **Step 5: Додати `onRecover` і `onDiscard` handlers перед `return`**

Перед рядком `return (` додати:

```typescript
const handleRecover = () => {
  if (!recoveredState) return;
  setGame(recoveredState.game);
  setTargetScore(recoveredState.targetScore);
  setWinnerPlayer(recoveredState.winnerPlayer);
  setScores(Object.fromEntries(recoveredState.game.players.map((p) => [p.id.toString(), ''])));
  setRecoveredState(null);
};

const handleDiscard = () => {
  clearGameState();
  setRecoveredState(null);
};
```

- [ ] **Step 6: Вставити RecoverScreen у render**

Знайти у JSX блок:
```tsx
{!game ? (
  <main className="flex items-center justify-center min-h-dvh py-4 px-4">
    <SetupScreen
      ...
    />
  </main>
) : (
```

Замінити `{!game ? (` на умову з `recoveredState`:
```tsx
{recoveredState && !game ? (
  <main className="flex items-center justify-center min-h-dvh py-4 px-4">
    <RecoverScreen
      savedState={recoveredState}
      gameRules={gameRules}
      onRecover={handleRecover}
      onDiscard={handleDiscard}
    />
  </main>
) : !game ? (
  <main className="flex items-center justify-center min-h-dvh py-4 px-4">
    <SetupScreen
      playerCount={playerCount}
      onPlayerCountChange={setPlayerCount}
      targetScore={targetScore}
      onTargetScoreChange={setTargetScore}
      names={names}
      onNamesChange={setNames}
      dealerIndex={dealerIndex}
      onDealerIndexChange={setDealerIndex}
      gameRules={gameRules}
      onRulesChange={setGameRules}
      onStart={() => createGame()}
    />
  </main>
) : (
```

Закриваючий `)}` залишити без змін.

- [ ] **Step 7: Перевірити type-check + тести**

```bash
bun run test && bun run type-check
```

Очікувано: всі тести зелені, 0 type errors.

- [ ] **Step 8: Lint + commit**

```bash
bun run lint:fix
git add src/App.tsx
git commit -m "feat: wire session persistence — auto-save and RecoverScreen recovery flow"
```

---

## Self-Review

### Spec coverage
- ✅ Auto-save після `addRound`, `updateRound`, `handleUndoLastRound` — покривається `useEffect` на `[game, targetScore, winnerPlayer]`
- ✅ Не зберігається якщо `game.rounds.length === 0`
- ✅ Зберігається якщо є переможець (WinnerScreen відновлюється)
- ✅ Очищується при `resetGame()` і `continueGame()`
- ✅ localStorage key: `savedGame`
- ✅ Тип `SavedGameState = { game, targetScore, winnerPlayer }`
- ✅ RecoverScreen: заголовок "Незавершена/Завершена гра #N"
- ✅ RecoverScreen: підзаголовок "Раунд X · до Y очок"
- ✅ RecoverScreen: міні-скорборд з аватаром, іменем, рахунком, progress bar
- ✅ RecoverScreen: кнопка "Продовжити" (primary) + "Нова гра" (secondary)
- ✅ Casino dark theme
- ✅ `loadGameState` повертає null при пошкодженому JSON — try/catch в утиліті
- ✅ Тести: round-trip, null при відсутньому ключі, null при пошкодженому JSON, clearGameState видаляє ключ

### Placeholder scan
Жодних TBD, TODO або неповних кроків.

### Type consistency
- `SavedGameState` визначається в Task 1 (`src/types.ts`) і використовується в Task 2 (`RecoverScreen`) і Task 3 (`App.tsx`) — консистентно.
- `saveGameState`, `loadGameState`, `clearGameState` — однакові назви скрізь.
- `onRecover` / `onDiscard` в props RecoverScreen відповідають `handleRecover` / `handleDiscard` в App.tsx.
