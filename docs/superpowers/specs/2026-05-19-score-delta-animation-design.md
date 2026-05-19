# Design: Score Delta Animation

**Date:** 2026-05-19
**Scope:** After each round is submitted, show a floating +/- delta above each player's score in ScoreBoard. The number floats upward and fades out over ~1.8s.

---

## Goals

Show the player's net score change immediately after submitting a round, making the game feel more dynamic and responsive.

## Out of scope

- Showing delta in RoundHistory
- Animation on undo
- Custom animation duration settings

---

## Behaviour

**Trigger:** `handleSubmitRound` succeeds in `App.tsx`.

**Value:** `newTotals[playerId] - oldTotals[playerId]` for each player. Zero deltas are not shown.

**Colour:** green (`#4ade80`) for positive, red (`#f87171`) for negative.

**Duration:** animation runs 1.8s, cleared from state after 2s.

**Special cases** — all handled automatically via `calculateGameTotals`:
- First Б → delta 0 (not shown)
- Subsequent Б → delta includes `secondBPenalty` (e.g. −100)
- ВіС win → delta includes `hangingScore` bonus
- ВіС loss → delta reflects penalty

**Re-trigger:** each submit increments `deltaKey`; React uses it as `key` on the delta element so the CSS animation restarts from scratch even if the value is the same as the previous round.

---

## Architecture

### State in `App.tsx`

```ts
const [roundDeltas, setRoundDeltas] = useState<Record<string, number> | null>(null);
const [deltaKey, setDeltaKey] = useState(0);
```

After a successful submit:
```ts
const oldTotals = calculateGameTotals(game.rounds, game.players, gameRules);
// ... add new round ...
const newTotals = calculateGameTotals(updatedRounds, game.players, gameRules);
const deltas: Record<string, number> = {};
for (const p of game.players) {
  deltas[String(p.id)] = (newTotals[String(p.id)] ?? 0) - (oldTotals[String(p.id)] ?? 0);
}
setRoundDeltas(deltas);
setDeltaKey(k => k + 1);
setTimeout(() => setRoundDeltas(null), 2000);
```

### ScoreBoard.tsx

New props:
```ts
deltas?: Record<string, number> | null;
deltaKey?: number;
```

For each player card, if `deltas?.[String(p.id)]` is non-zero, render:
```tsx
<div
  key={deltaKey}
  className={`score-delta ${delta > 0 ? 'pos' : 'neg'}`}
>
  {delta > 0 ? '+' : ''}{delta}
</div>
```

The player card's wrapper needs `position: relative` (already has it).

### CSS in `src/styles/index.css`

```css
@keyframes scoreDeltaFloat {
  0%   { opacity: 0; transform: translateX(-50%) translateY(4px); }
  15%  { opacity: 1; transform: translateX(-50%) translateY(0); }
  60%  { opacity: 1; transform: translateX(-50%) translateY(-28px); }
  85%  { opacity: 0; transform: translateX(-50%) translateY(-40px); }
  100% { opacity: 0; }
}
.score-delta {
  position: absolute;
  top: -4px;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  font-weight: 700;
  font-family: monospace;
  pointer-events: none;
  white-space: nowrap;
  animation: scoreDeltaFloat 1.8s ease-out forwards;
}
.score-delta.pos { color: #4ade80; }
.score-delta.neg { color: #f87171; }
```

---

## Files changed

| File | Change |
|---|---|
| `src/App.tsx` | Add `roundDeltas` + `deltaKey` state; compute deltas after submit; setTimeout 2000ms to clear |
| `src/components/ScoreBoard.tsx` | Add `deltas` + `deltaKey` props; render `.score-delta` element per player |
| `src/styles/index.css` | Add `@keyframes scoreDeltaFloat` + `.score-delta` classes |

---

## Testing

Manual only — CSS animation has no testable logic. Verify:
- Positive delta: green number floats up after submit
- Negative delta (Б, штраф): red number floats up
- Zero delta (first Б): nothing shown
- ВіС win/lose: correct delta reflects bonus/penalty
- Two rounds in a row: animation restarts correctly each time
- Regression: `bun run test` — no existing tests should break
