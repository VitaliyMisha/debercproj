# Score Delta Animation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** After each round is submitted, show a floating +/- delta above each player's score in ScoreBoard that floats upward and fades out over 1.8s.

**Architecture:** New `roundDeltas` + `deltaKey` state in `App.tsx` computed from totals before/after submit; passed as props to `ScoreBoard` → `PlayerCard`; rendered as an absolutely-positioned element that triggers a CSS float-up animation. `deltaKey` increments on each submit so React re-mounts the element and restarts the animation even when the value is unchanged.

**Tech Stack:** React 18, TypeScript, CSS `@keyframes`, `useRef` for timeout cleanup.

---

## File structure

| File | Change |
|---|---|
| `src/styles/index.css` | Add `@keyframes scoreDeltaFloat` + `.score-delta` classes |
| `src/components/ScoreBoard.tsx` | Add `deltas`/`deltaKey` props; wrap score in `relative` div; render `.score-delta` |
| `src/App.tsx` | Add `roundDeltas`/`deltaKey` state + `deltaTimerRef`; compute deltas in `addRound`; pass to `ScoreBoard` |

---

### Task 1: Add CSS animation

**Files:**
- Modify: `src/styles/index.css` (after line 150, before `@media (prefers-reduced-motion)`)

No tests for CSS. Visual-only.

- [ ] **Step 1: Add keyframe + classes to `src/styles/index.css`**

Insert this block between the closing `}` of `@keyframes goldGlow` (line 150) and the `@media (prefers-reduced-motion: reduce)` block (line 152):

```css
@keyframes scoreDeltaFloat {
  0%   { opacity: 0; transform: translateX(-50%) translateY(0px); }
  15%  { opacity: 1; transform: translateX(-50%) translateY(-4px); }
  60%  { opacity: 1; transform: translateX(-50%) translateY(-28px); }
  85%  { opacity: 0; transform: translateX(-50%) translateY(-40px); }
  100% { opacity: 0; }
}

.score-delta {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  font-size: 14px;
  font-weight: 700;
  font-family: 'Share Tech Mono', monospace;
  pointer-events: none;
  white-space: nowrap;
  z-index: 10;
  animation: scoreDeltaFloat 1.8s ease-out forwards;
}

.score-delta.pos { color: #4ade80; }
.score-delta.neg { color: #f87171; }
```

- [ ] **Step 2: Verify linter passes**

Run: `bun run lint`
Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add src/styles/index.css
git commit -m "feat: add scoreDeltaFloat CSS animation"
```

---

### Task 2: Update ScoreBoard to render delta

**Files:**
- Modify: `src/components/ScoreBoard.tsx`

No unit tests — pure rendering. Manual verification after Task 3.

- [ ] **Step 1: Add delta props to interfaces**

Replace the existing `ScoreBoardProps` and `PlayerCardProps` interfaces (lines 5–20) with:

```ts
interface ScoreBoardProps {
  players: Player[];
  totals: Record<string, number>;
  targetScore: number;
  dealerId?: number;
  snapshotActive?: boolean;
  deltas?: Record<string, number> | null;
  deltaKey?: number;
}

interface PlayerCardProps {
  player: Player;
  score: number;
  targetScore: number;
  isLeader: boolean;
  isDealer: boolean;
  snapshotActive: boolean;
  delta?: number;
  deltaKey?: number;
}
```

- [ ] **Step 2: Wrap score div in a `relative` container and render delta**

In `PlayerCard`, replace the score div block (lines 68–78):

```tsx
{/* Score — relative wrapper lets delta float from this position */}
<div className="relative">
  <div
    className={`text-3xl text-center transition-all duration-300
      ${score < 0 ? 'text-score-neg' : 'text-score-pos'}`}
    style={{
      fontFamily: "'Share Tech Mono', monospace",
      animation: snapshotActive ? 'none' : 'countUp 300ms ease-out',
    }}
  >
    {displayScore}
  </div>
  {delta !== undefined && delta !== 0 && (
    <div key={deltaKey} className={`score-delta ${delta > 0 ? 'pos' : 'neg'}`}>
      {delta > 0 ? '+' : ''}{delta}
    </div>
  )}
</div>
```

- [ ] **Step 3: Pass delta props from ScoreBoard to PlayerCard**

Replace the `ScoreBoard` component's return (lines 102–133) with:

```tsx
export const ScoreBoard: React.FC<ScoreBoardProps> = ({
  players,
  totals,
  targetScore,
  dealerId,
  snapshotActive = false,
  deltas,
  deltaKey,
}) => {
  const sorted = [...players].sort((a, b) => (totals[String(b.id)] ?? 0) - (totals[String(a.id)] ?? 0));
  const maxScore = players.length > 0 ? Math.max(...players.map((p) => totals[String(p.id)] ?? 0)) : 0;
  // Only highlight a leader once at least one score is non-zero (game has started).
  const hasLeader = players.length > 1 && players.some((p) => (totals[String(p.id)] ?? 0) !== 0);

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
            isDealer={player.id === dealerId}
            snapshotActive={snapshotActive}
            delta={snapshotActive ? undefined : (deltas?.[String(player.id)] ?? undefined)}
            deltaKey={deltaKey}
          />
        ))}
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Verify type-check passes**

Run: `bun run type-check`
Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/ScoreBoard.tsx
git commit -m "feat: add delta props to ScoreBoard and PlayerCard"
```

---

### Task 3: Compute and manage delta state in App.tsx

**Files:**
- Modify: `src/App.tsx`

No unit tests — delta computation is a subtraction of two `calculateGameTotals` calls (already tested). Manual testing steps at the end of this task.

- [ ] **Step 1: Add state and ref for delta**

After line 52 (`const closeFinishFiredRef = useRef...`), add:

```ts
const [roundDeltas, setRoundDeltas] = useState<Record<string, number> | null>(null);
const [deltaKey, setDeltaKey] = useState(0);
const deltaTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
```

- [ ] **Step 2: Compute deltas in `addRound` and set state**

In `addRound`, find the line `setGame(updatedGame);` (line 179). Insert this block directly **before** that line:

```ts
// Compute per-player score deltas for the floating animation
const newTotals = calculateGameTotals(updatedGame, gameRules);
const deltas: Record<string, number> = {};
for (const p of game.players) {
  const key = String(p.id);
  deltas[key] = (newTotals[key] ?? 0) - (totals[key] ?? 0);
}
if (deltaTimerRef.current) clearTimeout(deltaTimerRef.current);
setRoundDeltas(deltas);
setDeltaKey((k) => k + 1);
deltaTimerRef.current = setTimeout(() => setRoundDeltas(null), 2000);
```

Note: `totals` in scope here is the `useMemo` value from line 238 — it reflects totals **before** the new round, which is exactly the `oldTotals` we need. `calculateGameTotals` is already imported.

- [ ] **Step 3: Pass deltas to ScoreBoard**

Find the `<ScoreBoard ... />` JSX block (lines 406–416) and add the two new props:

```tsx
<ScoreBoard
  players={game.players}
  totals={displayTotals}
  targetScore={targetScore}
  dealerId={
    snapshotRound !== null
      ? game.rounds[snapshotRound - 1]?.dealerId
      : game.dealerId
  }
  snapshotActive={snapshotRound !== null}
  deltas={roundDeltas}
  deltaKey={deltaKey}
/>
```

- [ ] **Step 4: Verify type-check and tests**

Run: `bun run type-check && bun run test`
Expected: no type errors, 107 tests passing.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat: compute and show score delta animation after round submit"
```

---

### Manual testing checklist

After all tasks are done, verify in `bun run dev`:

- [ ] Submit a round with positive scores → green `+N` floats up above each player's score, disappears after ~1.8s
- [ ] Submit a round with ХВ penalty → red `−100` shows for that player
- [ ] Submit a round where a player gets first Б (delta = 0) → no delta shown
- [ ] Submit a round where a player gets second Б → red `−100` shown
- [ ] Submit two rounds in quick succession → second animation starts cleanly, no stale clear from first timeout
- [ ] Use Timeline to view snapshot → no deltas shown in snapshot mode
- [ ] Run `bun run test` → 107 tests still passing
