# Player Name History Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Зберігати всі унікальні імена гравців у localStorage і показувати dropdown-підказки під час введення імені на SetupScreen.

**Architecture:** Дві нові утиліти в `gameHelpers.ts` для роботи з `playerNames` у localStorage; новий ізольований `NameInput.tsx` компонент з логікою dropdown; мінімальні зміни в `PlayerRow`, `SetupScreen` і `App.tsx` для передачі даних вниз.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4, Vitest, localStorage

---

## File Map

| Файл | Зміни |
|------|-------|
| `src/utils/gameHelpers.ts` | Додати `loadPlayerNames`, `savePlayerNames` |
| `tests/playerNames.test.ts` | Нові unit-тести |
| `src/components/NameInput.tsx` | Новий компонент (input + dropdown) |
| `src/components/PlayerRow.tsx` | Додати `suggestions?` prop, замінити `<input>` на `<NameInput>` |
| `src/components/SetupScreen.tsx` | Додати `playerNames?` prop, передати до PlayerRow |
| `src/App.tsx` | `playerNames` state, виклик `savePlayerNames` в `createGame`, передача до SetupScreen |

---

### Task 1: loadPlayerNames / savePlayerNames утиліти + тести

**Files:**
- Modify: `src/utils/gameHelpers.ts`
- Create: `tests/playerNames.test.ts`

- [ ] **Step 1: Написати тести, що падають**

Створити `tests/playerNames.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { savePlayerNames, loadPlayerNames } from '../src/utils/gameHelpers';

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

describe('playerNames persistence', () => {
  beforeEach(() => localStorage.clear());

  it('savePlayerNames + loadPlayerNames round-trip', () => {
    savePlayerNames(['Ваня', 'Петро']);
    expect(loadPlayerNames()).toEqual(['Ваня', 'Петро']);
  });

  it('loadPlayerNames returns [] when key absent', () => {
    expect(loadPlayerNames()).toEqual([]);
  });

  it('loadPlayerNames returns [] on corrupted JSON', () => {
    localStorage.setItem('playerNames', '{ broken json !!');
    expect(loadPlayerNames()).toEqual([]);
  });

  it('deduplication: newer version wins (case-insensitive)', () => {
    savePlayerNames(['vasya']);
    savePlayerNames(['Vasya', 'Петро']);
    expect(loadPlayerNames()).toEqual(['Vasya', 'Петро']);
  });

  it('deduplication: re-adding existing name moves it to end', () => {
    savePlayerNames(['Ваня', 'Петро']);
    savePlayerNames(['Ваня']);
    expect(loadPlayerNames()).toEqual(['Петро', 'Ваня']);
  });

  it('empty and whitespace-only names are not saved', () => {
    savePlayerNames(['', '  ', 'Ваня']);
    expect(loadPlayerNames()).toEqual(['Ваня']);
  });
});
```

- [ ] **Step 2: Запустити тести — переконатись що падають**

```bash
bun x vitest run tests/playerNames.test.ts
```

Очікувано: FAIL — "savePlayerNames is not a function"

- [ ] **Step 3: Додати утиліти в кінець `src/utils/gameHelpers.ts`**

Після останнього рядка файлу (після `clearGameState`) додати:

```typescript
const PLAYER_NAMES_KEY = 'playerNames';

export function loadPlayerNames(): string[] {
  try {
    const raw = localStorage.getItem(PLAYER_NAMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePlayerNames(newNames: string[]): void {
  const trimmed = newNames.map((n) => n.trim()).filter(Boolean);
  const existing = loadPlayerNames().filter(
    (e) => !trimmed.some((n) => n.toLowerCase() === e.toLowerCase()),
  );
  localStorage.setItem(PLAYER_NAMES_KEY, JSON.stringify([...existing, ...trimmed]));
}
```

- [ ] **Step 4: Запустити тести — переконатись що проходять**

```bash
bun x vitest run tests/playerNames.test.ts
```

Очікувано: PASS 6/6

- [ ] **Step 5: Запустити повний suite + type-check**

```bash
bun run test && bun run type-check
```

Очікувано: всі тести зелені, 0 type errors

- [ ] **Step 6: Lint + commit**

```bash
bun run lint:fix
git add src/utils/gameHelpers.ts tests/playerNames.test.ts
git commit -m "feat: add loadPlayerNames/savePlayerNames utilities"
```

---

### Task 2: NameInput компонент

**Files:**
- Create: `src/components/NameInput.tsx`

- [ ] **Step 1: Створити `src/components/NameInput.tsx`**

```tsx
import React, { useState } from 'react';

interface NameInputProps {
  id?: string;
  name?: string;
  value: string;
  placeholder?: string;
  suggestions: string[];
  onChange: (value: string) => void;
}

export const NameInput: React.FC<NameInputProps> = ({
  id,
  name,
  value,
  placeholder,
  suggestions,
  onChange,
}) => {
  const [open, setOpen] = useState(false);

  const filtered = value.trim().length > 0
    ? suggestions.filter(
        (s) =>
          s.toLowerCase().includes(value.trim().toLowerCase()) &&
          s.toLowerCase() !== value.trim().toLowerCase(),
      )
    : [];

  const showDropdown = open && filtered.length > 0;

  return (
    <div className="relative flex-1 min-w-0">
      <input
        id={id}
        name={name}
        type="text"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="w-full bg-transparent border-b border-white/20 text-white placeholder-muted
          font-sans text-base py-1 focus:outline-none focus:border-gold-from transition-colors"
      />
      {showDropdown && (
        <ul
          role="listbox"
          className="absolute top-full mt-1 w-full z-50 rounded-xl bg-card-bg border border-white/10
            shadow-lg shadow-black/40 overflow-hidden"
        >
          {filtered.map((s) => (
            <li
              key={s}
              role="option"
              aria-selected={false}
              onClick={() => {
                onChange(s);
                setOpen(false);
              }}
              className="px-4 py-2.5 text-sm text-white/80 font-sans cursor-pointer
                hover:bg-white/10 active:bg-white/15 select-none"
            >
              {s}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NameInput;
```

- [ ] **Step 2: Перевірити type-check**

```bash
bun run type-check
```

Очікувано: 0 errors

- [ ] **Step 3: Lint + commit**

```bash
bun run lint:fix
git add src/components/NameInput.tsx
git commit -m "feat: add NameInput component with dropdown autocomplete"
```

---

### Task 3: Інтеграція — PlayerRow, SetupScreen, App.tsx

**Files:**
- Modify: `src/components/PlayerRow.tsx`
- Modify: `src/components/SetupScreen.tsx`
- Modify: `src/App.tsx`

- [ ] **Step 1: Оновити `src/components/PlayerRow.tsx`**

Поточний файл починається з `import React from 'react';`. Повністю замінити вміст на:

```tsx
import React from 'react';
import { NameInput } from './NameInput';

const EASTER_EGGS: Array<{ keywords: string[]; emoji: string }> = [
  { keywords: ['заєць', 'заєц', 'заец', 'заець', 'косой'], emoji: '🐰' },
  { keywords: ['бая', 'кот'], emoji: '😸' },
  { keywords: ['киш', 'кіш'], emoji: '🥷' },
  { keywords: ['сірко', 'сирко'], emoji: '🐶' },
  { keywords: ['горох'], emoji: '🫛' },
  { keywords: ['ося'], emoji: '🥥' },
];

const applyEasterEgg = (value: string): string => {
  const trimmed = value.trim().toLowerCase();
  for (const { keywords, emoji } of EASTER_EGGS) {
    if (keywords.includes(trimmed)) return `${emoji} ${value}`;
  }
  return value;
};

interface PlayerRowProps {
  index: number;
  name: string;
  isDealer: boolean;
  onNameChange: (name: string) => void;
  onSetDealer: () => void;
  suggestions?: string[];
}

export const PlayerRow: React.FC<PlayerRowProps> = ({
  index,
  name,
  isDealer,
  onNameChange,
  onSetDealer,
  suggestions = [],
}) => {
  const initial = Array.from(name.trim())[0]?.toUpperCase() || String(index + 1);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
      <button
        type="button"
        onClick={onSetDealer}
        title="Призначити дилером"
        aria-pressed={isDealer}
        className={`w-10 h-10 rounded-full flex items-center justify-center font-display text-lg shrink-0
          transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
          ${isDealer
            ? 'text-gold-to ring-2 ring-gold-from'
            : 'text-white'
          }`}
        style={{ background: isDealer ? 'linear-gradient(135deg, #78350F, #92400E)' : 'linear-gradient(135deg, #15803D, #166534)' }}
      >
        {isDealer ? '👑' : initial}
      </button>

      <NameInput
        id={`player-name-${index}`}
        name={`player-name-${index}`}
        value={name}
        placeholder={`Гравець ${index + 1}`}
        suggestions={suggestions}
        onChange={(value) => onNameChange(applyEasterEgg(value))}
      />
    </div>
  );
};

export default PlayerRow;
```

- [ ] **Step 2: Оновити `src/components/SetupScreen.tsx`**

Знайти інтерфейс `SetupScreenProps` (рядок 9) та додати новий prop перед `onStart`:

```typescript
interface SetupScreenProps {
  playerCount: number;
  onPlayerCountChange: (count: number) => void;
  targetScore: number;
  onTargetScoreChange: (score: number) => void;
  names: string[];
  onNamesChange: (names: string[]) => void;
  dealerIndex: number;
  onDealerIndexChange: (index: number) => void;
  gameRules: GameRulesConfig;
  onRulesChange: (rules: GameRulesConfig) => void;
  playerNames?: string[];
  onStart: () => void;
}
```

Оновити destructuring у `SetupScreen` — додати `playerNames = []`:

```typescript
export const SetupScreen: React.FC<SetupScreenProps> = ({
  playerCount,
  onPlayerCountChange,
  targetScore,
  onTargetScoreChange,
  names,
  onNamesChange,
  dealerIndex,
  onDealerIndexChange,
  gameRules,
  onRulesChange,
  playerNames = [],
  onStart,
}) => {
```

Знайти `<PlayerRow` у JSX і додати `suggestions={playerNames}`:

```tsx
{names.map((name, idx) => (
  <PlayerRow
    key={idx}
    index={idx}
    name={name}
    isDealer={dealerIndex === idx}
    onNameChange={(v) => handleNameChange(idx, v)}
    onSetDealer={() => onDealerIndexChange(idx)}
    suggestions={playerNames}
  />
))}
```

- [ ] **Step 3: Оновити `src/App.tsx`**

**3a.** Знайти рядок 14 (import gameHelpers) та додати `loadPlayerNames, savePlayerNames`:

```typescript
import { generateUniqueId, isValidScore, loadWinCounts, parseScore, saveWinCounts, calculateGameTotals, saveGameState, loadGameState, clearGameState, loadPlayerNames, savePlayerNames } from './utils/gameHelpers';
```

**3b.** Після рядка 42 (`recoveredState` state) додати:

```typescript
const [playerNames, setPlayerNames] = useState<string[]>(() => loadPlayerNames());
```

**3c.** На початку функції `createGame` (рядок 84), перед `const winCounts = loadWinCounts();`, додати:

```typescript
if (!reusePlayers) {
  savePlayerNames(names);
  setPlayerNames(loadPlayerNames());
}
```

**3d.** Знайти `<SetupScreen` у JSX і додати `playerNames={playerNames}`:

```tsx
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
  playerNames={playerNames}
  onStart={() => createGame()}
/>
```

- [ ] **Step 4: Запустити тести + type-check**

```bash
bun run test && bun run type-check
```

Очікувано: всі тести зелені (107+ passes), 0 type errors

- [ ] **Step 5: Lint + commit**

```bash
bun run lint:fix
git add src/components/PlayerRow.tsx src/components/SetupScreen.tsx src/App.tsx
git commit -m "feat: integrate player name history into SetupScreen"
```

---

## Self-Review

### Spec coverage
- ✅ Dropdown при введенні (не при фокусі): `value.trim().length > 0` guard у `filtered`
- ✅ Фільтрація contains case-insensitive: `s.toLowerCase().includes(value.trim().toLowerCase())`
- ✅ Поточне значення виключається при точному збігу: `&& s.toLowerCase() !== value.trim().toLowerCase()`
- ✅ Закривається на blur з 150ms delay: `onBlur={() => setTimeout(() => setOpen(false), 150)}`
- ✅ Збереження при старті гри: `savePlayerNames(names)` в `createGame` коли `!reusePlayers`
- ✅ Дедупліkація newer wins: фільтр existing + push new в кінець
- ✅ Порожні/whitespace імена не зберігаються: `.filter(Boolean)` після `.trim()`
- ✅ Всі унікальні без ліміту: no slice/limit in savePlayerNames
- ✅ Тести: round-trip, null key, corrupted JSON, dedup newer wins, dedup moves to end, empty names

### Placeholder scan
Жодних TBD/TODO.

### Type consistency
- `loadPlayerNames(): string[]` — однаково в Task 1 і Task 3
- `savePlayerNames(newNames: string[]): void` — однаково скрізь
- `suggestions?: string[]` в PlayerRow (default `[]`) → `suggestions: string[]` в NameInput — prop передається коректно
- `playerNames?: string[]` в SetupScreen (default `[]`) → `suggestions={playerNames}` в PlayerRow — ✅
