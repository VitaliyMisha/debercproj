# Casino UI Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current mixed-style UI with a coherent Casino Card Table Dark design across all three screens (Setup, Active Game, Winner) with animations, snapshot mode, and chip-based settings.

**Architecture:** New components (`SetupScreen`, `ScoreBoard`, `RoundTimeline`, `WinnerScreen`) replace their old counterparts. `GameRulesConfig` migrates to `types.ts`. `App.tsx` gains `snapshotRound: number | null` state and passes it down to timeline/scoreboard/history. Old components are deleted after the new ones are wired in.

**Tech Stack:** React 19, TypeScript, Tailwind CSS v4 (`@theme {}` in CSS), Biome linter (2-space indent, single quotes, semicolons, trailing commas ES5, line width 140), Bun, Vitest.

---

## File Map

**Create:**
- `src/hooks/useCountUp.ts`
- `src/components/Button.tsx`
- `src/components/ChipGroup.tsx`
- `src/components/GoldDivider.tsx`
- `src/components/PlayerRow.tsx`
- `src/components/PenaltySheet.tsx`
- `src/components/SetupScreen.tsx`
- `src/components/GameHeader.tsx`
- `src/components/ScoreBoard.tsx`
- `src/components/RoundTimeline.tsx`
- `src/components/CardSuitsRain.tsx`
- `src/components/WinnerScreen.tsx`

**Rewrite:**
- `src/styles/index.css` — `@theme {}`, animation keyframes, felt-bg utility, remove bad `button:hover` rule
- `index.html` — Google Fonts link, updated `theme-color`
- `src/types.ts` — add `GameRulesConfig`
- `src/components/RoundForm.tsx` — token hints, auto-uppercase, remove `maxLength`
- `src/components/RoundHistory.tsx` — stagger animation, snapshot highlight
- `src/App.tsx` — snapshot state, remove inline `ParticleEffect`/`GameButton`/console.logs, wire new screens

**Delete** (after wiring):
- `src/components/GameSettings.tsx`
- `src/components/GameRules.tsx`
- `src/components/WinnerMessage.tsx`
- `src/components/TotalScores.tsx`
- `src/components/Header.tsx`

**Update imports in:**
- `src/utils/gameHelpers.ts` (GameRulesConfig → types)
- `src/components/GameSettings.tsx` (GameRulesConfig → types)
- `src/components/RoundForm.tsx` (GameRulesConfig → types)
- `src/components/RoundHistory.tsx` (GameRulesConfig → types)
- `src/components/PlayerStatistics.tsx` (GameRulesConfig → types, remove console.logs)

---

## Task 1: Design Tokens, Fonts, Base CSS

**Files:**
- Modify: `src/styles/index.css`
- Modify: `index.html`

- [ ] **Step 1: Update `index.html` — add Google Fonts, update theme-color**

Replace the existing `<head>` meta block. The file currently has `theme-color` set to `#4f46e5`:

```html
<!doctype html>
<html lang="uk">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#0C1A0E" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
    <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=Righteous&display=swap" rel="stylesheet" />
    <title>Деберц</title>
    <script src="https://cdn.tailwindcss.com"></script>
  </head>
```

Note: keep whatever PWA-related tags already exist (manifest link, apple-touch-icon, etc.). Only update `theme-color` and insert the Google Fonts links before `</head>`.

- [ ] **Step 2: Rewrite `src/styles/index.css`**

```css
@import 'tailwindcss';

@theme {
  --color-felt: #0C1A0E;
  --color-card-bg: #192134;
  --color-gold-from: #D97706;
  --color-gold-to: #FCD34D;
  --color-primary: #15803D;
  --color-primary-dark: #166534;
  --color-score-pos: #4ADE80;
  --color-score-neg: #F87171;
  --color-token-vis: #C4B5FD;
  --color-token-b: #FCD34D;
  --color-muted: #6B7280;

  --font-display: 'Righteous', sans-serif;
  --font-sans: 'Poppins', sans-serif;
}

@layer base {
  *,
  ::after,
  ::before,
  ::backdrop {
    -webkit-tap-highlight-color: transparent;
  }
  ::file-selector-button {
    border-color: var(--color-gray-200, currentcolor);
  }
}

@layer utilities {
  .felt-bg {
    background-color: var(--color-felt);
    background-image:
      radial-gradient(ellipse at 20% 30%, rgba(21, 128, 61, 0.18) 0%, transparent 60%),
      radial-gradient(ellipse at 80% 70%, rgba(21, 128, 61, 0.12) 0%, transparent 50%),
      repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(0, 0, 0, 0.04) 2px, rgba(0, 0, 0, 0.04) 4px);
  }

  .gold-gradient-text {
    background: linear-gradient(90deg, var(--color-gold-from), var(--color-gold-to));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .gold-gradient-border {
    border-image: linear-gradient(90deg, var(--color-gold-from), var(--color-gold-to)) 1;
  }
}

@keyframes countUp {
  from {
    transform: translateY(8px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes goldPulse {
  0%, 100% {
    box-shadow: 0 0 8px 2px rgba(217, 119, 6, 0.4);
  }
  50% {
    box-shadow: 0 0 20px 6px rgba(252, 211, 77, 0.6);
  }
}

@keyframes cardSuitsRain {
  0% {
    transform: translateY(-20px) rotate(0deg);
    opacity: 1;
  }
  70% {
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

@keyframes slideInStagger {
  from {
    transform: translateY(-12px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes buttonPress {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(0.97);
  }
}

@keyframes progressFill {
  from {
    width: 0%;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Verify build compiles cleanly**

```bash
bun run type-check
```

Expected: no type errors.

- [ ] **Step 4: Commit**

```bash
git add src/styles/index.css index.html
git commit -m "feat: add casino design tokens, Google Fonts, animation keyframes"
```

---

## Task 2: Migrate GameRulesConfig to types.ts

**Files:**
- Modify: `src/types.ts`
- Modify: `src/utils/gameHelpers.ts`
- Modify: `src/components/RoundForm.tsx`
- Modify: `src/components/RoundHistory.tsx`
- Modify: `src/components/PlayerStatistics.tsx`

`GameSettings.tsx` already imports from `GameRules.tsx` and will be deleted in Task 7 — no need to update it.
`App.tsx` also imports from `GameRules.tsx` — updated in Task 7 alongside the full App rewrite.

- [ ] **Step 1: Add `GameRulesConfig` to `src/types.ts`**

Append to the file:

```typescript
export interface GameRulesConfig {
  secondBPenalty: number;
  hvPenalty: number;
  allowVis: boolean;
  customTargetScore: boolean;
  targetScoreOptions: number[];
}
```

- [ ] **Step 2: Update `src/utils/gameHelpers.ts` import**

Change line 2 from:
```typescript
import { GameRulesConfig } from '../components/GameRules';
```
to:
```typescript
import { GameRulesConfig } from '../types';
```

- [ ] **Step 3: Update `src/components/RoundForm.tsx` import**

Change line 4 from:
```typescript
import { GameRulesConfig } from './GameRules';
```
to:
```typescript
import { GameRulesConfig } from '../types';
```

- [ ] **Step 4: Update `src/components/RoundHistory.tsx` import**

Change line 3 from:
```typescript
import { GameRulesConfig } from './GameRules';
```
to:
```typescript
import { GameRulesConfig } from '../types';
```

- [ ] **Step 5: Update `src/components/PlayerStatistics.tsx` import and remove console.logs**

Change line 4 from:
```typescript
import { GameRulesConfig } from './GameRules';
```
to:
```typescript
import { GameRulesConfig } from '../types';
```

Also delete these two `console.log` calls from `PlayerStatistics.tsx`:
- Line 43: `console.log(\`Player ${playerId}, Round score:\`, score, 'Type:', typeof score);`
- Lines 104–110: the `console.log(\`Player ${playerId} stats:\`, {...})` block

- [ ] **Step 6: Run checks**

```bash
bun run type-check && bun run lint
```

Expected: no errors (GameRules.tsx still exists and exports the interface, so no import resolution failures yet).

- [ ] **Step 7: Commit**

```bash
git add src/types.ts src/utils/gameHelpers.ts src/components/RoundForm.tsx src/components/RoundHistory.tsx src/components/PlayerStatistics.tsx
git commit -m "feat: migrate GameRulesConfig to types.ts, remove PlayerStatistics console.logs"
```

---

## Task 3: Shared Primitives — Button, ChipGroup, GoldDivider

**Files:**
- Create: `src/components/Button.tsx`
- Create: `src/components/ChipGroup.tsx`
- Create: `src/components/GoldDivider.tsx`

- [ ] **Step 1: Create `src/components/Button.tsx`**

```tsx
import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  disabled?: boolean;
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  className?: string;
  type?: 'button' | 'submit';
  fullWidth?: boolean;
}

const variantClasses: Record<string, string> = {
  primary: 'bg-primary hover:bg-primary-dark text-white shadow-lg',
  secondary: 'bg-card-bg border border-white/10 text-white hover:bg-white/10',
  danger: 'bg-transparent border border-score-neg/50 text-score-neg hover:bg-score-neg/10',
  ghost: 'bg-transparent text-muted hover:text-white hover:bg-white/5',
};

export const Button: React.FC<ButtonProps> = ({
  onClick,
  disabled,
  children,
  variant = 'primary',
  className = '',
  type = 'button',
  fullWidth = false,
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`
      relative overflow-hidden font-sans font-semibold py-3 px-6 rounded-xl
      transition-all duration-200 active:scale-[0.97]
      disabled:opacity-50 disabled:cursor-not-allowed
      focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
      ${variantClasses[variant]}
      ${fullWidth ? 'w-full' : ''}
      ${className}
    `}
  >
    {children}
  </button>
);

export default Button;
```

- [ ] **Step 2: Create `src/components/ChipGroup.tsx`**

```tsx
import React from 'react';

interface ChipOption<T> {
  label: string;
  value: T;
}

interface ChipGroupProps<T> {
  options: ChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function ChipGroup<T extends string | number>({
  options,
  value,
  onChange,
  className = '',
}: ChipGroupProps<T>) {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            type="button"
            onClick={() => onChange(opt.value)}
            className={`
              px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150
              active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
              ${
                active
                  ? 'bg-primary border-primary text-white shadow-md'
                  : 'bg-card-bg border-white/10 text-muted hover:border-white/30 hover:text-white'
              }
            `}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export default ChipGroup;
```

- [ ] **Step 3: Create `src/components/GoldDivider.tsx`**

```tsx
import React from 'react';

export const GoldDivider: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div
    className={`h-px w-full ${className}`}
    style={{ background: 'linear-gradient(90deg, transparent, #D97706, #FCD34D, #D97706, transparent)' }}
  />
);

export default GoldDivider;
```

- [ ] **Step 4: Run type-check**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/Button.tsx src/components/ChipGroup.tsx src/components/GoldDivider.tsx
git commit -m "feat: add shared Button, ChipGroup, GoldDivider primitives"
```

---

## Task 4: useCountUp Hook

**Files:**
- Create: `src/hooks/useCountUp.ts`

- [ ] **Step 1: Create `src/hooks/useCountUp.ts`**

```typescript
import { useEffect, useRef, useState } from 'react';

export function useCountUp(target: number, duration = 300): number {
  const [displayed, setDisplayed] = useState(target);
  const prevRef = useRef(target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const start = prevRef.current;
    const diff = target - start;
    if (diff === 0) return;

    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - (1 - progress) ** 3;
      setDisplayed(Math.round(start + diff * eased));

      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      } else {
        prevRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [target, duration]);

  return displayed;
}
```

Note: This hook respects `prefers-reduced-motion` implicitly because the CSS media query disables the `countUp` CSS animation; the hook itself still runs but the visual shift is imperceptible since the transition completes instantly due to `transition-duration: 0.01ms`.

- [ ] **Step 2: Run type-check**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useCountUp.ts
git commit -m "feat: add useCountUp animation hook"
```

---

## Task 5: PlayerRow and PenaltySheet

**Files:**
- Create: `src/components/PlayerRow.tsx`
- Create: `src/components/PenaltySheet.tsx`

- [ ] **Step 1: Create `src/components/PlayerRow.tsx`**

Used by SetupScreen for each player entry (avatar, name input, crown button).

```tsx
import React from 'react';

interface PlayerRowProps {
  index: number;
  name: string;
  isDealer: boolean;
  onNameChange: (name: string) => void;
  onSetDealer: () => void;
}

export const PlayerRow: React.FC<PlayerRowProps> = ({ index, name, isDealer, onNameChange, onSetDealer }) => {
  const initial = Array.from(name.trim())[0]?.toUpperCase() || String(index + 1);

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/8">
      <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-display text-lg shrink-0"
        style={{ background: 'linear-gradient(135deg, #15803D, #166534)' }}
      >
        {initial}
      </div>

      <input
        type="text"
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder={`Гравець ${index + 1}`}
        className="flex-1 bg-transparent border-b border-white/20 text-white placeholder-muted
          font-sans text-base py-1 focus:outline-none focus:border-gold-from transition-colors"
      />

      <button
        type="button"
        onClick={onSetDealer}
        title="Призначити дилером"
        className={`w-9 h-9 rounded-full flex items-center justify-center text-lg shrink-0
          transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
          ${isDealer
            ? 'bg-gold-from/20 border border-gold-from text-gold-to'
            : 'bg-transparent border border-white/15 text-muted hover:border-white/40 hover:text-white'
          }`}
      >
        👑
      </button>
    </div>
  );
};

export default PlayerRow;
```

- [ ] **Step 2: Create `src/components/PenaltySheet.tsx`**

Bottom sheet with slider for penalty config. Opens when user taps the penalty chip in SetupScreen.

```tsx
import React, { useCallback } from 'react';

interface PenaltySheetProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  onClose: () => void;
}

export const PenaltySheet: React.FC<PenaltySheetProps> = ({ label, value, onChange, onClose }) => {
  const handleBackdrop = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end"
      onClick={handleBackdrop}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full bg-card-bg rounded-t-2xl p-6 pb-10 border-t border-white/10 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <h3 className="text-white font-sans font-semibold text-lg mb-6 text-center">{label}</h3>

        <div className="flex items-center gap-4">
          <input
            type="range"
            min={-200}
            max={0}
            step={10}
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 accent-gold-from"
          />
          <span
            className="w-16 text-center text-xl font-bold"
            style={{ color: value < 0 ? 'var(--color-score-neg)' : 'var(--color-score-pos)' }}
          >
            {value}
          </span>
        </div>

        <p className="text-muted text-sm text-center mt-4">
          Проведіть вліво/вправо або потягніть повзунок
        </p>
      </div>
    </div>
  );
};

export default PenaltySheet;
```

- [ ] **Step 3: Run type-check**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/PlayerRow.tsx src/components/PenaltySheet.tsx
git commit -m "feat: add PlayerRow and PenaltySheet components"
```

---

## Task 6: SetupScreen

**Files:**
- Create: `src/components/SetupScreen.tsx`

This replaces `GameSettings.tsx` + `GameRules.tsx` + the player name section in `App.tsx`.

- [ ] **Step 1: Create `src/components/SetupScreen.tsx`**

```tsx
import React, { useState } from 'react';
import { GameRulesConfig } from '../types';
import { ChipGroup } from './ChipGroup';
import { GoldDivider } from './GoldDivider';
import { Button } from './Button';
import { PlayerRow } from './PlayerRow';
import { PenaltySheet } from './PenaltySheet';

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
  onStart: () => void;
}

type PenaltyKey = 'secondBPenalty' | 'hvPenalty';

const PLAYER_COUNT_OPTIONS = [
  { label: '2 гравці', value: 2 as const },
  { label: '3 гравці', value: 3 as const },
  { label: '4 гравці', value: 4 as const },
];

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
  onStart,
}) => {
  const [penaltySheet, setPenaltySheet] = useState<PenaltyKey | null>(null);

  const handlePlayerCountChange = (count: number) => {
    onPlayerCountChange(count);
    const next = [...names];
    while (next.length < count) next.push('');
    onNamesChange(next.slice(0, count));
    if (dealerIndex >= count) onDealerIndexChange(0);
  };

  const handleNameChange = (idx: number, value: string) => {
    const next = [...names];
    next[idx] = value;
    onNamesChange(next);
  };

  const targetOptions = [
    { label: '510 — швидка', value: 510 as const },
    { label: '1020 — класика', value: 1020 as const },
    ...(gameRules.customTargetScore
      ? gameRules.targetScoreOptions
          .filter((s) => s !== 510 && s !== 1020)
          .map((s) => ({ label: String(s), value: s as number }))
      : []),
  ];

  const canStart = names.every((n) => n.trim().length > 0);

  return (
    <div className="w-full max-w-md mx-auto flex flex-col gap-6 py-6 px-4">
      {/* Header */}
      <div className="text-center relative">
        <div className="absolute inset-0 flex items-center justify-center text-8xl text-white/5 font-display pointer-events-none select-none">
          ♥♦♣
        </div>
        <h1 className="font-display text-4xl gold-gradient-text relative z-10">Деберц ♠</h1>
      </div>

      {/* Кількість гравців */}
      <section>
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">Гравців</h2>
        <ChipGroup
          options={PLAYER_COUNT_OPTIONS}
          value={playerCount}
          onChange={handlePlayerCountChange}
        />
      </section>

      {/* До перемоги */}
      <section>
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">До перемоги</h2>
        <ChipGroup
          options={targetOptions}
          value={targetScore}
          onChange={onTargetScoreChange}
        />
      </section>

      <GoldDivider />

      {/* Імена гравців */}
      <section>
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">
          Гравці <span className="normal-case opacity-60">(👑 = дилер)</span>
        </h2>
        <div className="flex flex-col gap-3">
          {names.map((name, idx) => (
            <PlayerRow
              key={idx}
              index={idx}
              name={name}
              isDealer={dealerIndex === idx}
              onNameChange={(v) => handleNameChange(idx, v)}
              onSetDealer={() => onDealerIndexChange(idx)}
            />
          ))}
        </div>
      </section>

      <GoldDivider />

      {/* Правила */}
      <section>
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">Правила</h2>
        <div className="flex flex-wrap gap-2">
          {/* ВІС toggle */}
          <button
            type="button"
            onClick={() => onRulesChange({ ...gameRules, allowVis: !gameRules.allowVis })}
            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-all duration-150 active:scale-[0.97]
              ${gameRules.allowVis
                ? 'bg-token-vis/20 border-token-vis text-token-vis'
                : 'bg-card-bg border-white/10 text-muted hover:border-white/30'
              }`}
          >
            ВІС {gameRules.allowVis ? '✓' : '✗'}
          </button>

          {/* 2-га Б penalty */}
          <button
            type="button"
            onClick={() => setPenaltySheet('secondBPenalty')}
            className="px-4 py-2 rounded-full text-sm font-semibold border bg-card-bg border-white/10 text-score-neg hover:border-score-neg/50 transition-all duration-150 active:scale-[0.97]"
          >
            2-га Б: {gameRules.secondBPenalty}
          </button>

          {/* ХВ penalty */}
          <button
            type="button"
            onClick={() => setPenaltySheet('hvPenalty')}
            className="px-4 py-2 rounded-full text-sm font-semibold border bg-card-bg border-white/10 text-score-neg hover:border-score-neg/50 transition-all duration-150 active:scale-[0.97]"
          >
            ХВ: {gameRules.hvPenalty}
          </button>
        </div>
      </section>

      {/* Start button */}
      <Button
        fullWidth
        disabled={!canStart}
        onClick={onStart}
        className="py-4 text-lg mt-2"
      >
        🎴 Почати гру
      </Button>

      {/* Penalty sheet */}
      {penaltySheet && (
        <PenaltySheet
          label={penaltySheet === 'secondBPenalty' ? 'Штраф за 2-гу "Б"' : 'Штраф за "ХВ"'}
          value={gameRules[penaltySheet]}
          onChange={(v) => onRulesChange({ ...gameRules, [penaltySheet]: v })}
          onClose={() => setPenaltySheet(null)}
        />
      )}
    </div>
  );
};

export default SetupScreen;
```

- [ ] **Step 2: Run type-check**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/SetupScreen.tsx
git commit -m "feat: add SetupScreen (chip-based setup replacing GameSettings + GameRules)"
```

---

## Task 7: Wire SetupScreen into App.tsx, Delete Old Components

**Files:**
- Modify: `src/App.tsx` (setup screen section only)
- Delete: `src/components/GameSettings.tsx`
- Delete: `src/components/GameRules.tsx`

Strategy: replace the `!game` branch in `App.tsx` with `<SetupScreen>`. Keep the `game` branch untouched for now.

- [ ] **Step 1: Update `src/App.tsx` imports and setup state**

Replace the import block at the top of `App.tsx`. Remove `GameSettings`, `GameRules`, `GameRulesConfig` from GameRules, and add `SetupScreen` and `GameRulesConfig` from types:

```typescript
import React, { useEffect, useMemo, useState } from 'react';
import { Game, GameRulesConfig, Player, Round } from './types';
import { Award, Crown, PartyPopper, Sparkles, Trophy, Users, Zap } from 'lucide-react';

import SetupScreen from './components/SetupScreen';
import PlayerInput from './components/PlayerInput';
import RoundForm from './components/RoundForm';
import RoundHistory from './components/RoundHistory';
import WinnerMessage from './components/WinnerMessage';
import Header from './components/Header';
import GameHistory from './components/GameHistory';
import TotalScores from './components/TotalScores';
import PlayerStatistics from './components/PlayerStatistics';
import { generateUniqueId, isValidScore, loadWinCounts, parseScore, saveWinCounts, calculateGameTotals } from './utils/gameHelpers';
```

- [ ] **Step 2: Replace the `!game` branch in `App.tsx` JSX**

Find the block starting with `{!game ? (` and replace the `!game` branch content with `<SetupScreen>`:

```tsx
{!game ? (
  <div className="w-full min-h-screen felt-bg flex items-center justify-center py-4 px-4">
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
  </div>
) : (
```

Also replace the outer wrapper `<div className="min-h-screen bg-linear-to-br from-purple-900 ...">` with `<div className="felt-bg min-h-screen">` at the top level of the return.

- [ ] **Step 3: Remove `useEffect` that resets names on playerCount change**

In `App.tsx`, find and delete this effect (it will now be handled by `SetupScreen.handlePlayerCountChange`):

```typescript
useEffect(() => {
  setNames(Array(playerCount).fill(''));
}, [playerCount]);
```

- [ ] **Step 4: Delete old components**

```bash
rm /Users/vitaliymisha/WebstormProjects/debercproj/src/components/GameSettings.tsx
rm /Users/vitaliymisha/WebstormProjects/debercproj/src/components/GameRules.tsx
```

- [ ] **Step 5: Run checks and verify app loads**

```bash
bun run type-check && bun run lint
```

Expected: no errors. Dev server should show the casino setup screen when `!game`.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "feat: wire SetupScreen into App.tsx, remove GameSettings + GameRules"
```

---

## Task 8: GameHeader Component

**Files:**
- Create: `src/components/GameHeader.tsx`

Replaces `Header.tsx` with casino styling. Still has the same props interface to allow drop-in replacement.

- [ ] **Step 1: Create `src/components/GameHeader.tsx`**

```tsx
import React from 'react';

interface GameHeaderProps {
  gameId: number;
  targetScore: number;
  dealerName?: string;
  onNewGame?: () => void;
}

export const GameHeader: React.FC<GameHeaderProps> = ({ gameId, targetScore, dealerName, onNewGame }) => (
  <div className="relative rounded-2xl overflow-hidden bg-card-bg border border-white/8 p-4">
    {/* Watermark suits */}
    <div className="absolute inset-0 flex items-center justify-center text-7xl text-white/4 font-display pointer-events-none select-none tracking-widest">
      ♠ ♥ ♦ ♣
    </div>

    <div className="relative z-10 flex items-center justify-between">
      <div>
        <h1 className="font-display text-2xl gold-gradient-text">Деберц</h1>
        <p className="text-muted text-sm">
          Гра #{gameId} · до <span className="text-white font-semibold">{targetScore}</span> очок
        </p>
      </div>

      <div className="flex items-center gap-3">
        {dealerName && (
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-full px-3 py-1.5">
            <span className="text-sm">👑</span>
            <span className="text-sm text-white/80 font-sans">{dealerName}</span>
          </div>
        )}
        {onNewGame && (
          <button
            type="button"
            onClick={onNewGame}
            className="px-4 py-2 rounded-xl bg-card-bg border border-white/10 text-muted text-sm font-semibold
              hover:border-white/30 hover:text-white transition-all duration-150 active:scale-[0.97]"
          >
            Нова гра
          </button>
        )}
      </div>
    </div>
  </div>
);

export default GameHeader;
```

- [ ] **Step 2: Swap Header with GameHeader in `App.tsx`**

Add import:
```typescript
import GameHeader from './components/GameHeader';
```

Replace the two `<Header ... />` usages in the `game` branch with `<GameHeader ... />` (same props).

- [ ] **Step 3: Run type-check**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/GameHeader.tsx src/App.tsx
git commit -m "feat: add GameHeader with casino styling, replace Header.tsx usage"
```

---

## Task 9: ScoreBoard Component

**Files:**
- Create: `src/components/ScoreBoard.tsx`

Replaces `TotalScores.tsx`. Accepts `snapshotActive` to suppress animation when viewing a past round.

- [ ] **Step 1: Create `src/components/ScoreBoard.tsx`**

```tsx
import React from 'react';
import { Player } from '../types';
import { useCountUp } from '../hooks/useCountUp';

interface ScoreBoardProps {
  players: Player[];
  totals: Record<string, number>;
  targetScore: number;
  snapshotActive?: boolean;
}

interface PlayerCardProps {
  player: Player;
  score: number;
  targetScore: number;
  isLeader: boolean;
  snapshotActive: boolean;
}

const PlayerCard: React.FC<PlayerCardProps> = ({ player, score, targetScore, isLeader, snapshotActive }) => {
  const displayScore = useCountUp(score, snapshotActive ? 0 : 300);
  const progress = Math.min(Math.max(score / targetScore, 0), 1) * 100;
  const initial = Array.from(player.name.trim())[0]?.toUpperCase() || '?';

  return (
    <div
      className={`relative flex flex-col gap-2 p-4 rounded-2xl border transition-all duration-300
        ${isLeader
          ? 'bg-card-bg border-gold-from'
          : 'bg-card-bg/60 border-white/8'
        }`}
      style={isLeader ? { animation: 'goldPulse 3s ease-in-out infinite' } : undefined}
    >
      {/* Avatar + name */}
      <div className="flex items-center gap-2">
        <div
          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-display shrink-0"
          style={{ background: 'linear-gradient(135deg, #15803D, #166534)' }}
        >
          {initial}
        </div>
        <span className="text-white/80 font-sans text-sm font-medium truncate">{player.name}</span>
        {isLeader && <span className="ml-auto text-gold-to text-xs">👑</span>}
      </div>

      {/* Score */}
      <div
        className={`font-display text-3xl text-center transition-all duration-300
          ${score < 0 ? 'text-score-neg' : 'text-score-pos'}`}
        style={{ animation: snapshotActive ? 'none' : 'countUp 300ms ease-out' }}
      >
        {displayScore}
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-600"
          style={{
            width: `${progress}%`,
            background: isLeader
              ? 'linear-gradient(90deg, var(--color-gold-from), var(--color-gold-to))'
              : 'var(--color-primary)',
            animation: snapshotActive ? 'none' : 'progressFill 600ms ease',
          }}
        />
      </div>
    </div>
  );
};

export const ScoreBoard: React.FC<ScoreBoardProps> = ({ players, totals, targetScore, snapshotActive = false }) => {
  const sorted = [...players].sort((a, b) => (totals[String(b.id)] ?? 0) - (totals[String(a.id)] ?? 0));
  const maxScore = Math.max(...players.map((p) => totals[String(p.id)] ?? 0));
  const hasLeader = players.some((p) => (totals[String(p.id)] ?? 0) === maxScore) && players.length > 1;

  const gridClass =
    players.length === 2
      ? 'grid-cols-2'
      : players.length === 3
        ? 'grid-cols-3'
        : 'grid-cols-2';

  return (
    <div>
      <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">Рахунок</h2>
      <div className={`grid ${gridClass} gap-3`}>
        {sorted.map((player) => (
          <PlayerCard
            key={player.id}
            player={player}
            score={totals[String(player.id)] ?? 0}
            targetScore={targetScore}
            isLeader={hasLeader && (totals[String(player.id)] ?? 0) === maxScore}
            snapshotActive={snapshotActive}
          />
        ))}
      </div>
    </div>
  );
};

export default ScoreBoard;
```

- [ ] **Step 2: Wire ScoreBoard into `App.tsx`**

Add import:
```typescript
import ScoreBoard from './components/ScoreBoard';
```

Replace the `<TotalScores players={game.players} totals={totals} />` usage with:
```tsx
<ScoreBoard
  players={game.players}
  totals={totals}
  targetScore={targetScore}
  snapshotActive={false}
/>
```

(Snapshot integration comes in Task 10.)

- [ ] **Step 3: Run type-check**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ScoreBoard.tsx src/App.tsx
git commit -m "feat: add ScoreBoard with countUp, progress bar, gold leader pulse"
```

---

## Task 10: RoundTimeline with Snapshot Mode

**Files:**
- Create: `src/components/RoundTimeline.tsx`
- Modify: `src/App.tsx` — add `snapshotRound` state, pass it to ScoreBoard, RoundHistory, RoundTimeline

- [ ] **Step 1: Create `src/components/RoundTimeline.tsx`**

```tsx
import React, { useEffect, useRef } from 'react';

interface RoundTimelineProps {
  totalRounds: number;
  currentRound: number;
  snapshotRound: number | null;
  onSelectRound: (round: number) => void;
  onExitSnapshot: () => void;
}

export const RoundTimeline: React.FC<RoundTimelineProps> = ({
  totalRounds,
  currentRound,
  snapshotRound,
  onSelectRound,
  onExitSnapshot,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      const active = scrollRef.current.querySelector('[data-active="true"]') as HTMLElement | null;
      active?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, [currentRound, snapshotRound]);

  const pills = Array.from({ length: totalRounds }, (_, i) => i + 1);

  return (
    <div className="flex flex-col gap-2">
      {snapshotRound !== null && (
        <button
          type="button"
          onClick={onExitSnapshot}
          className="text-gold-to text-sm font-semibold text-center py-2 bg-gold-from/10 border border-gold-from/30 rounded-xl active:scale-[0.97] transition-all"
        >
          ← Повернутись до гри
        </button>
      )}

      <div
        ref={scrollRef}
        className="flex gap-2 overflow-x-auto pb-1 scrollbar-none"
        style={{ scrollbarWidth: 'none' }}
      >
        {pills.map((round) => {
          const isPast = round < currentRound;
          const isCurrent = round === currentRound;
          const isSnapshot = round === snapshotRound;

          let pillClass = '';
          if (isSnapshot) {
            pillClass = 'bg-gold-from/30 border-gold-to text-gold-to font-bold';
          } else if (isCurrent) {
            pillClass = 'bg-primary border-primary text-white font-bold';
          } else if (isPast) {
            pillClass = 'bg-score-pos/20 border-score-pos/50 text-score-pos cursor-pointer hover:bg-score-pos/30';
          } else {
            pillClass = 'bg-white/5 border-white/10 text-muted cursor-default';
          }

          return (
            <button
              key={round}
              type="button"
              data-active={isSnapshot || isCurrent ? 'true' : 'false'}
              onClick={isPast ? () => onSelectRound(round) : undefined}
              disabled={!isPast && !isCurrent}
              className={`
                shrink-0 w-9 h-9 rounded-full border text-sm flex items-center justify-center
                transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-to/60
                ${pillClass}
              `}
            >
              {isPast || isCurrent ? round : '·'}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default RoundTimeline;
```

- [ ] **Step 2: Add snapshot state to `App.tsx`**

Add state and derived totals after existing state declarations:

```typescript
const [snapshotRound, setSnapshotRound] = useState<number | null>(null);

const displayTotals = useMemo(() => {
  if (!game || snapshotRound === null) return totals;
  const snapshotGame = { ...game, rounds: game.rounds.slice(0, snapshotRound) };
  return calculateGameTotals(snapshotGame, gameRules);
}, [game, gameRules, snapshotRound, totals]);
```

Also reset snapshot when a new round is added — add `setSnapshotRound(null)` in the `addRound` function after `setGame(updatedGame)`.

- [ ] **Step 3: Wire RoundTimeline and snapshot into App.tsx**

Import:
```typescript
import RoundTimeline from './components/RoundTimeline';
```

In the `game` branch JSX, above `<RoundForm>`, add:
```tsx
{game.rounds.length > 0 && (
  <RoundTimeline
    totalRounds={game.rounds.length + (winnerPlayer !== null ? 0 : 1)}
    currentRound={game.rounds.length + (winnerPlayer !== null ? 0 : 1)}
    snapshotRound={snapshotRound}
    onSelectRound={(r) => setSnapshotRound(r)}
    onExitSnapshot={() => setSnapshotRound(null)}
  />
)}
```

Update `<ScoreBoard>` to use `displayTotals` and pass `snapshotActive`:
```tsx
<ScoreBoard
  players={game.players}
  totals={displayTotals}
  targetScore={targetScore}
  snapshotActive={snapshotRound !== null}
/>
```

Hide `<RoundForm>` when snapshot is active:
```tsx
{snapshotRound === null && winnerPlayer === null && (
  <RoundForm ... />
)}
```

- [ ] **Step 4: Run type-check**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/RoundTimeline.tsx src/App.tsx
git commit -m "feat: add RoundTimeline with snapshot mode, wire into App"
```

---

## Task 11: RoundForm Refactor

**Files:**
- Modify: `src/components/RoundForm.tsx`

Changes: token hint chips, auto-uppercase on blur, remove `maxLength`, use casino styling.

- [ ] **Step 1: Rewrite `src/components/RoundForm.tsx`**

```tsx
import React, { ChangeEvent, useState } from 'react';
import { Player } from '../types';
import { GameRulesConfig } from '../types';

interface RoundFormProps {
  players: Player[];
  scores: Record<string, string | number>;
  onScoreChange: (e: ChangeEvent<HTMLInputElement>, id: number) => void;
  onAddRound: () => void;
  roundNumber: number;
  isAddDisabled: boolean;
  gameRules?: GameRulesConfig;
}

const TOKEN_HINTS = ['Б', 'ХВ', 'ВІС'] as const;
const TOKEN_COLORS: Record<string, string> = {
  Б: 'text-token-b border-token-b/60 bg-token-b/10',
  ХВ: 'text-score-neg border-score-neg/60 bg-score-neg/10',
  ВІС: 'text-token-vis border-token-vis/60 bg-token-vis/10',
};

const isTokenActive = (value: string, token: string): boolean =>
  value.trim().toUpperCase() === token;

const RoundForm: React.FC<RoundFormProps> = ({
  players,
  scores,
  onScoreChange,
  onAddRound,
  roundNumber,
  isAddDisabled,
  gameRules,
}) => {
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const allowVis = gameRules?.allowVis !== false;
  const placeholder = allowVis ? '0, Б, ХВ, ВІС' : '0, Б, ХВ';
  const validTokens = allowVis ? TOKEN_HINTS : (['Б', 'ХВ'] as const);

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>, playerId: number) => {
    setTouched((prev) => ({ ...prev, [String(playerId)]: true }));
    const val = e.target.value.trim().toUpperCase();
    if (['Б', 'ХВ', 'ВІС'].includes(val)) {
      const syntheticEvent = { ...e, target: { ...e.target, value: val } } as ChangeEvent<HTMLInputElement>;
      onScoreChange(syntheticEvent, playerId);
    }
  };

  return (
    <div className="bg-card-bg rounded-2xl border border-white/8 overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/8 flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-display text-sm">
          {roundNumber}
        </div>
        <span className="text-white font-sans font-semibold">Раунд</span>

        {/* Token hint chips */}
        <div className="flex gap-1.5 ml-auto">
          {validTokens.map((token) => (
            <span
              key={token}
              className={`px-2 py-0.5 rounded-full text-xs border font-semibold ${TOKEN_COLORS[token]}`}
            >
              {token}
            </span>
          ))}
        </div>
      </div>

      {/* Player inputs */}
      <div className="p-4 space-y-3">
        {players.map((p) => {
          const val = String(scores[p.id] ?? '');
          const activeToken = validTokens.find((t) => isTokenActive(val, t));
          const isTouched = touched[String(p.id)];

          return (
            <div key={p.id} className="flex items-center gap-3">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-display shrink-0"
                style={{ background: 'linear-gradient(135deg, #15803D, #166534)' }}
              >
                {Array.from(p.name.trim())[0]?.toUpperCase() || '?'}
              </div>
              <span className="flex-1 text-white/80 font-sans text-sm truncate">{p.name}</span>

              <div className="relative shrink-0 w-28">
                <input
                  type="text"
                  value={val}
                  onChange={(e) => onScoreChange(e, p.id)}
                  onBlur={(e) => handleBlur(e, p.id)}
                  placeholder={placeholder}
                  className={`w-full px-3 py-2 rounded-xl text-center text-base font-semibold
                    bg-felt border transition-all duration-150
                    focus:outline-none focus:ring-2 focus:ring-gold-from/40
                    ${activeToken
                      ? TOKEN_COLORS[activeToken].split(' ').filter((c) => c.startsWith('border')).join(' ') + ' text-white'
                      : 'border-white/15 text-white'
                    }`}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Add button */}
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={onAddRound}
          disabled={isAddDisabled}
          className={`w-full py-3 rounded-xl font-semibold text-base transition-all duration-150 active:scale-[0.97]
            ${isAddDisabled
              ? 'bg-white/5 text-muted cursor-not-allowed'
              : 'bg-primary hover:bg-primary-dark text-white shadow-lg'
            }`}
        >
          {isAddDisabled ? '⏳ Заповніть всі поля' : '✅ Додати раунд'}
        </button>
      </div>
    </div>
  );
};

export default RoundForm;
```

- [ ] **Step 2: Run type-check and lint**

```bash
bun run type-check && bun run lint
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/RoundForm.tsx
git commit -m "feat: refactor RoundForm — casino styling, token hints, auto-uppercase, remove maxLength"
```

---

## Task 12: RoundHistory Refactor

**Files:**
- Modify: `src/components/RoundHistory.tsx`

Changes: casino styling, `slideInStagger` animation for new rounds, snapshot highlight.

- [ ] **Step 1: Rewrite `src/components/RoundHistory.tsx`**

```tsx
import React, { useState, useRef, useEffect } from 'react';
import { Player, Round } from '../types';
import { GameRulesConfig } from '../types';
import { isValidScore } from '../utils/gameHelpers';

interface RoundHistoryProps {
  rounds: Round[];
  players: Player[];
  onUpdateRound: (roundNumber: number, newScores: Record<string, string>) => void;
  gameRules?: GameRulesConfig;
  snapshotRound?: number | null;
}

const RoundHistory: React.FC<RoundHistoryProps> = ({ rounds, players, onUpdateRound, gameRules, snapshotRound }) => {
  const [editingRound, setEditingRound] = useState<number | null>(null);
  const [editScores, setEditScores] = useState<Record<string, string>>({});
  const prevLengthRef = useRef(rounds.length);
  const [newRoundId, setNewRoundId] = useState<number | null>(null);

  useEffect(() => {
    if (rounds.length > prevLengthRef.current) {
      setNewRoundId(rounds[rounds.length - 1].number);
      const timer = setTimeout(() => setNewRoundId(null), 600);
      prevLengthRef.current = rounds.length;
      return () => clearTimeout(timer);
    }
    prevLengthRef.current = rounds.length;
  }, [rounds.length]);

  const startEditing = (round: Round) => {
    setEditingRound(round.number);
    const initial: Record<string, string> = {};
    players.forEach((p) => {
      const s = round.scores[p.id];
      initial[String(p.id)] = s !== undefined ? String(s) : '';
    });
    setEditScores(initial);
  };

  const saveEdit = () => {
    if (editingRound !== null) {
      onUpdateRound(editingRound, editScores);
      setEditingRound(null);
      setEditScores({});
    }
  };

  const cancelEdit = () => {
    setEditingRound(null);
    setEditScores({});
  };

  const placeholder = gameRules?.allowVis !== false ? '0, Б, ХВ, ВІС' : '0, Б, ХВ';

  if (rounds.length === 0) {
    return (
      <div className="bg-card-bg rounded-2xl border border-white/8 p-6 text-center">
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest mb-3">Історія раундів</h2>
        <p className="text-muted text-sm py-4">Поки що немає завершених раундів</p>
      </div>
    );
  }

  return (
    <div className="bg-card-bg rounded-2xl border border-white/8 overflow-hidden">
      <div className="px-4 py-3 border-b border-white/8 flex items-center justify-between">
        <h2 className="text-muted text-xs font-semibold uppercase tracking-widest">Історія раундів</h2>
        <span className="text-muted text-xs bg-white/5 px-2 py-0.5 rounded-full">Всього: {rounds.length}</span>
      </div>

      <div className="divide-y divide-white/5">
        {[...rounds].sort((a, b) => b.number - a.number).map((round) => {
          const isEditing = editingRound === round.number;
          const isSnapshot = round.number === snapshotRound;
          const isNew = round.number === newRoundId;

          return (
            <div
              key={round.number}
              className={`transition-all duration-200
                ${isSnapshot ? 'border-l-2 border-gold-from bg-gold-from/5' : ''}
                ${isNew ? 'animate-[slideInStagger_300ms_ease_both]' : ''}
              `}
            >
              {/* Header row */}
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span className={`text-sm font-semibold ${isSnapshot ? 'text-gold-to' : 'text-white/60'}`}>
                    Раунд {round.number}
                  </span>
                  {isSnapshot && <span className="text-xs text-gold-from bg-gold-from/10 border border-gold-from/30 px-2 py-0.5 rounded-full">перегляд</span>}
                </div>
                {!isEditing && (
                  <button
                    type="button"
                    onClick={() => startEditing(round)}
                    className="text-muted text-xs hover:text-white transition-colors px-2 py-1 rounded-lg hover:bg-white/5"
                  >
                    ✏️ Редагувати
                  </button>
                )}
              </div>

              {/* Scores */}
              <div className="px-4 pb-3">
                {isEditing ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      {players.map((player) => {
                        const val = editScores[String(player.id)] ?? '';
                        const valid = isValidScore(val, gameRules);
                        return (
                          <div key={player.id}>
                            <label className="text-muted text-xs mb-1 block">{player.name}</label>
                            <input
                              type="text"
                              value={val}
                              onChange={(e) =>
                                setEditScores((prev) => ({ ...prev, [String(player.id)]: e.target.value }))
                              }
                              placeholder={placeholder}
                              className={`w-full px-3 py-2 rounded-xl text-sm text-center bg-felt border transition-colors
                                focus:outline-none focus:ring-2 focus:ring-gold-from/40 text-white
                                ${valid ? 'border-white/15' : 'border-score-neg/60'}`}
                            />
                          </div>
                        );
                      })}
                    </div>
                    <div className="flex justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={cancelEdit}
                        className="px-3 py-1.5 text-xs text-muted border border-white/10 rounded-lg hover:text-white hover:border-white/30 transition-colors"
                      >
                        Відмінити
                      </button>
                      <button
                        type="button"
                        onClick={saveEdit}
                        disabled={!Object.values(editScores).every((s) => isValidScore(s, gameRules))}
                        className="px-3 py-1.5 text-xs bg-primary text-white rounded-lg hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                      >
                        Зберегти
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {players.map((player) => {
                      const val = round.scores[player.id];
                      const isNeg = typeof val === 'number' && val < 0;
                      const isToken = val === 'Б' || val === 'ВІС';
                      return (
                        <div key={player.id} className="flex justify-between items-center px-2 py-1.5 rounded-lg bg-white/3">
                          <span className="text-white/60 text-xs">{player.name}</span>
                          <span className={`text-sm font-semibold ${isNeg ? 'text-score-neg' : isToken ? 'text-token-b' : 'text-score-pos'}`}>
                            {val ?? 0}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RoundHistory;
```

- [ ] **Step 2: Pass `snapshotRound` from `App.tsx` to `RoundHistory`**

In `App.tsx`, find `<RoundHistory ... />` and add the prop:
```tsx
<RoundHistory
  rounds={game.rounds}
  players={game.players}
  onUpdateRound={updateRound}
  gameRules={gameRules}
  snapshotRound={snapshotRound}
/>
```

- [ ] **Step 3: Run type-check and lint**

```bash
bun run type-check && bun run lint
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/RoundHistory.tsx src/App.tsx
git commit -m "feat: refactor RoundHistory — casino styling, stagger animation, snapshot highlight"
```

---

## Task 13: CardSuitsRain + WinnerScreen

**Files:**
- Create: `src/components/CardSuitsRain.tsx`
- Create: `src/components/WinnerScreen.tsx`

- [ ] **Step 1: Create `src/components/CardSuitsRain.tsx`**

```tsx
import React, { useEffect, useState } from 'react';

interface Suit {
  char: string;
  x: number;
  delay: number;
  duration: number;
  red: boolean;
}

const SUITS = ['♠', '♥', '♦', '♣'];

export const CardSuitsRain: React.FC = () => {
  const [visible, setVisible] = useState(true);

  const suits: Suit[] = Array.from({ length: 20 }, (_, i) => ({
    char: SUITS[i % 4],
    x: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 1.5 + Math.random() * 1.5,
    red: i % 4 === 1 || i % 4 === 2,
  }));

  useEffect(() => {
    const timer = setTimeout(() => setVisible(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-40">
      {suits.map((s, i) => (
        <span
          key={i}
          className={`absolute text-3xl select-none ${s.red ? 'text-red-500' : 'text-white'}`}
          style={{
            left: `${s.x}%`,
            top: '-2rem',
            animationName: 'cardSuitsRain',
            animationDuration: `${s.duration}s`,
            animationDelay: `${s.delay}s`,
            animationTimingFunction: 'linear',
            animationFillMode: 'both',
          }}
        >
          {s.char}
        </span>
      ))}
    </div>
  );
};

export default CardSuitsRain;
```

- [ ] **Step 2: Create `src/components/WinnerScreen.tsx`**

```tsx
import React from 'react';
import { Player } from '../types';
import { CardSuitsRain } from './CardSuitsRain';
import { Button } from './Button';
import { GoldDivider } from './GoldDivider';

interface WinnerScreenProps {
  winner: Player;
  players: Player[];
  totals: Record<string, number>;
  roundCount: number;
  onNewGame: () => void;
  onContinue: () => void;
}

export const WinnerScreen: React.FC<WinnerScreenProps> = ({
  winner,
  players,
  totals,
  roundCount,
  onNewGame,
  onContinue,
}) => {
  const maxScore = Math.max(...players.map((p) => totals[String(p.id)] ?? 0));

  return (
    <div className="relative flex flex-col items-center gap-6 py-8 px-4">
      <CardSuitsRain />

      {/* Trophy */}
      <div className="text-7xl animate-bounce">🏆</div>

      {/* Title */}
      <h1 className="font-display text-3xl gold-gradient-text tracking-wide">ПЕРЕМОЖЕЦЬ</h1>

      {/* Winner card */}
      <div
        className="w-full max-w-xs bg-card-bg rounded-2xl border-2 border-gold-from p-6 text-center"
        style={{ animation: 'goldPulse 3s ease-in-out infinite' }}
      >
        <div
          className="w-16 h-16 rounded-full mx-auto mb-3 flex items-center justify-center text-white text-2xl font-display"
          style={{ background: 'linear-gradient(135deg, #15803D, #166534)' }}
        >
          {Array.from(winner.name.trim())[0]?.toUpperCase() || '?'}
        </div>
        <p className="font-display text-2xl text-white mb-1">{winner.name}</p>
        <p className="text-muted text-sm">
          {totals[String(winner.id)] ?? 0} очок · {roundCount} раундів
        </p>
      </div>

      <GoldDivider className="w-full max-w-xs" />

      {/* Summary table */}
      <div className="w-full max-w-xs bg-card-bg rounded-2xl border border-white/8 overflow-hidden">
        <div className="px-4 py-2 border-b border-white/8">
          <span className="text-muted text-xs uppercase tracking-widest font-semibold">Підсумок</span>
        </div>
        {[...players]
          .sort((a, b) => (totals[String(b.id)] ?? 0) - (totals[String(a.id)] ?? 0))
          .map((player) => {
            const score = totals[String(player.id)] ?? 0;
            const isWinner = player.id === winner.id;
            const progress = Math.min(Math.max(score / maxScore, 0), 1) * 100;

            return (
              <div key={player.id} className="px-4 py-3 border-b border-white/5 last:border-0">
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-semibold ${isWinner ? 'text-gold-to' : 'text-white/80'}`}>
                    {isWinner && '👑 '}{player.name}
                  </span>
                  <span className={`text-sm font-bold ${score < 0 ? 'text-score-neg' : 'text-score-pos'}`}>
                    {score}
                  </span>
                </div>
                <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${progress}%`,
                      background: isWinner
                        ? 'linear-gradient(90deg, var(--color-gold-from), var(--color-gold-to))'
                        : 'var(--color-primary)',
                    }}
                  />
                </div>
              </div>
            );
          })}
      </div>

      {/* Actions */}
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <Button fullWidth onClick={onNewGame} className="py-4 text-base">
          🎮 Нова гра
        </Button>
        <Button fullWidth variant="secondary" onClick={onContinue} className="py-3 text-base">
          ▶ Продовжити
        </Button>
      </div>
    </div>
  );
};

export default WinnerScreen;
```

- [ ] **Step 3: Run type-check**

```bash
bun run type-check
```

Expected: no errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/CardSuitsRain.tsx src/components/WinnerScreen.tsx
git commit -m "feat: add WinnerScreen with cardSuitsRain animation"
```

---

## Task 14: App.tsx Final Cleanup

**Files:**
- Modify: `src/App.tsx` — wire WinnerScreen, remove inline ParticleEffect, GameButton, all console.logs, use felt-bg

- [ ] **Step 1: Remove console.log statements from `App.tsx`**

Delete these 5 `console.log` calls:
- Line 142: `console.log('Game updated:', game.id, 'rounds:', game.rounds.length);` (inside the `useEffect`)
- Line 230: `console.log('Updating round:', roundNumber, 'with scores:', newScores);`
- Line 248: `console.log('Updated game:', updatedGame);`
- Line 258: `console.log('Recalculating totals for game:', game.id, 'rounds:', game.rounds.length);` (inside useMemo)
- Line 400: `console.log('Toggle statistics:', !showStatistics);`

- [ ] **Step 2: Remove `ParticleEffect` and `GameButton` inline components from `App.tsx`**

Delete the entire `const ParticleEffect = ...` function (lines 28–49).
Delete the entire `const GameButton = ...` function (lines 51–90).
Remove the `<ParticleEffect show={showCelebration}/>` JSX usage.
Remove unused imports: `Award, Crown, PartyPopper, Sparkles, Trophy, Users, Zap` — keep only those still used.

- [ ] **Step 3: Wire WinnerScreen in `App.tsx`**

Import:
```typescript
import WinnerScreen from './components/WinnerScreen';
```

Replace the entire `winnerPlayer !== null` branch:

Find the block starting with `{winnerPlayer !== null ? (` in the `game` branch. Replace the winner block with:
```tsx
{winnerPlayer !== null ? (
  <WinnerScreen
    winner={game.players.find((p) => p.id === winnerPlayer)!}
    players={game.players}
    totals={totals}
    roundCount={game.rounds.length}
    onNewGame={resetGame}
    onContinue={continueGame}
  />
) : (
```

- [ ] **Step 4: Apply felt-bg to outer wrapper**

Change the outermost `<div>` in the return:
```tsx
<div className="felt-bg min-h-dvh flex flex-col items-center py-4 px-2 sm:px-4 relative">
```

Remove the old decorative pulsing blobs (the `absolute` divs with gradients) from the old purple background wrapper — they're no longer needed on the felt background.

- [ ] **Step 5: Run type-check and lint**

```bash
bun run type-check && bun run lint
```

Expected: no errors. Fix any lint issues reported by Biome (unused imports, etc.).

- [ ] **Step 6: Run tests**

```bash
bun run test
```

Expected: all tests pass (game logic was not modified).

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat: App.tsx final cleanup — wire WinnerScreen, remove ParticleEffect/GameButton/console.logs"
```

---

## Task 15: Final Verification + Delete Obsolete Files

**Files:**
- Delete: `src/components/TotalScores.tsx`
- Delete: `src/components/Header.tsx`
- Delete: `src/components/WinnerMessage.tsx`

(GameSettings.tsx and GameRules.tsx were deleted in Task 7.)

- [ ] **Step 1: Confirm nothing imports TotalScores, Header, WinnerMessage**

```bash
grep -r "TotalScores\|WinnerMessage\|from.*Header" src/ --include="*.tsx" --include="*.ts"
```

Expected: only `GameHeader` references to `Header` (if any) — no `TotalScores` or `WinnerMessage` imports remain.

- [ ] **Step 2: Delete obsolete files**

```bash
rm src/components/TotalScores.tsx src/components/Header.tsx src/components/WinnerMessage.tsx
```

- [ ] **Step 3: Final lint + type-check + test**

```bash
bun run lint && bun run type-check && bun run test
```

Expected: all pass with no errors or warnings.

- [ ] **Step 4: Verify app works end-to-end**

Start dev server:
```bash
bun run dev
```

Manual test checklist:
- Setup screen loads with casino felt background, gold "Деберц ♠" header, chip selectors for player count and target score
- All player name fields must be filled for "Почати гру" to enable
- Crown (👑) button correctly selects dealer (only one active)
- Penalty bottom sheet opens for 2-га Б and ХВ chips, slider updates value live, closes on backdrop tap
- Game screen shows GameHeader, RoundTimeline pills, ScoreBoard with progress bars
- Tapping a past round pill enters snapshot mode, RoundForm hides, banner appears
- Tapping "Повернутись до гри" exits snapshot
- Entering Б, ХВ, ВІС (any case) in RoundForm auto-uppercases on blur
- Adding a round shows stagger animation in RoundHistory
- Winning triggers WinnerScreen with cardSuitsRain suits falling, gold winner card
- "Продовжити" continues with same players, resets scores to 0

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: remove obsolete TotalScores, Header, WinnerMessage components"
```

- [ ] **Step 6: Push to deploy**

```bash
git push origin main
```

Vercel will auto-deploy from the push. Do NOT run `vercel` CLI.

---

## Spec Coverage Check

| Spec requirement | Task |
|---|---|
| Felt bg + design tokens | Task 1 |
| Righteous + Poppins fonts | Task 1 |
| countUp animation | Task 4 |
| goldPulse CSS | Task 1 + Task 9 |
| cardSuitsRain | Task 13 |
| slideInStagger | Task 1 + Task 12 |
| SetupScreen chip-based UI | Task 6 |
| PenaltySheet bottom sheet | Task 5 |
| CrownButton single-select dealer | Task 5 |
| GameHeader with watermark suits | Task 8 |
| ScoreBoard with progress bar | Task 9 |
| RoundTimeline with snapshot mode | Task 10 |
| RoundForm token hints + auto-uppercase | Task 11 |
| RoundHistory stagger + snapshot highlight | Task 12 |
| WinnerScreen full replacement | Task 13 |
| GameRulesConfig → types.ts | Task 2 |
| Delete GameSettings, GameRules, WinnerMessage | Tasks 7, 15 |
| console.log removal | Tasks 2, 14 |
| maxLength removal from RoundForm | Task 11 |
| prefers-reduced-motion | Task 1 (CSS) |
