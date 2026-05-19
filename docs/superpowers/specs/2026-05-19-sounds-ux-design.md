# Design: Sounds + UX Polish

**Date:** 2026-05-19
**Scope:** Wire up existing sounds, add 8 new sounds via Web Audio API, add gold glow animation near finish, haptic feedback on submit/undo.

---

## Goals

1. Make the game feel alive — every meaningful action has audio feedback
2. Build tension as a player approaches the target score
3. Strengthen haptic feedback on the two most important actions

## Out of scope

- Swipe-to-undo (decided: existing button is sufficient)
- New sound files / external audio assets (all sounds stay Web Audio API, offline-safe)
- iPad layout improvements (deferred)

---

## 1. Sound System

### Existing sounds (connect only)

| Function | Trigger |
|---|---|
| `chipClick()` | Any chip button pressed in `RoundForm` (Б, ХВ, ВіС, number chips) |
| `roundSubmit()` | `App.tsx → handleSubmitRound` on success |
| `undoPop()` | `App.tsx → handleUndoLastRound` |

### New sounds (implement + connect)

All implemented in `useSound.ts` via Web Audio API. All respect `soundEnabled` flag.

| Function | Character | Trigger location |
|---|---|---|
| `bSound()` | Low "boom" | `App.tsx` after submit — token is `'Б'` and it's player's first Б |
| `secondBSound()` | Heavier boom | `App.tsx` after submit — token is `'Б'` and bCount ≥ 2 |
| `hvSound()` | Sharp crack | `RoundForm` — when ХВ chip is selected (at chip click time) |
| `visPlay()` | Mysterious/tense tone | `RoundForm` — when ВіС chip is selected |
| `visWin()` | Short victory fanfare | `App.tsx` after submit — pendingVis resolved as win |
| `visLose()` | Dramatic fail | `App.tsx` after submit — pendingVis resolved as lose |
| `closeFinish()` | Tension tick | `App.tsx` useEffect on totals — fires once when player first crosses `targetScore - 100` |
| `newGame()` | Card shuffle | `App.tsx → handleStartGame` |

### ВіС win/lose detection

In `handleSubmitRound`, capture `pendingVis` snapshot before calling `calculateGameTotals`. After recalculating:
- If `pendingVis[playerId]` existed before and is gone now → ВіС resolved
- Win: player's total increased by `hangingScore` bonus (total jumped more than their raw score)
- Lose: bCounts for that player increased

Simpler alternative: return a `visResult` flag from a helper, or detect by comparing bCounts before/after. **Decision:** compare bCounts before/after submit — if a player's bCount increased and they had `pendingVis`, it was a loss; otherwise a win.

### closeFinish — one-shot per player per game

Tracked via a `Set<string>` ref (`closeFinishFiredRef`) in `App.tsx`. Cleared when a new game starts. Fires `closeFinish()` the first time `targetScore - totals[playerId] <= 100` and `totals[playerId] > 0`.

### Sound design guidelines (Web Audio API)

| Sound | Approach |
|---|---|
| `bSound` | Sine wave 80Hz, 0.3s, fast attack, slow decay |
| `secondBSound` | Same but 60Hz + slight distortion (gain > 1 briefly) |
| `hvSound` | White noise burst 0.08s + low thump |
| `visPlay` | Rising tone 300→600Hz over 0.4s, reverb-like tail |
| `visWin` | Quick arpeggio C5→E5→G5, 0.5s |
| `visLose` | Descending tones G4→E4→C4, 0.4s |
| `closeFinish` | High click + subtle pulse, 0.15s |
| `newGame` | Rapid filtered noise burst (card shuffle feel), 0.3s |

---

## 2. Gold Glow Animation (ScoreBoard.tsx)

**Condition:** `targetScore - playerScore <= 100` and `playerScore > 0`

**Implementation:** Conditional CSS class `player-card--danger` on the player card element.

```css
@keyframes gold-glow {
  0%, 100% { box-shadow: 0 0 0px rgba(255,215,0,0); }
  50%       { box-shadow: 0 0 20px rgba(255,215,0,0.5); }
}
.player-card--danger {
  animation: gold-glow 1.4s ease-in-out infinite;
}
```

- Does not conflict with existing brass-border leader highlight (leader gets border, danger player gets glow)
- A player can have both if they're both the leader and close to finishing

---

## 3. Haptic Feedback (App.tsx)

Guard already in codebase: `if ('vibrate' in navigator)`.

| Action | Pattern |
|---|---|
| Submit round | `navigator.vibrate(30)` — single short pulse |
| Undo round | `navigator.vibrate([20, 30, 20])` — double tap feel |

Win haptic (already implemented in WinnerScreen) — unchanged.

---

## Architecture notes

- `useSound.ts` exports all sound functions; `App.tsx` and `RoundForm.tsx` import what they need
- Sound functions are pure fire-and-forget; no return values, no state
- `soundEnabled` is checked inside each function — callers don't need to guard
- `closeFinishFiredRef` is a `useRef<Set<string>>` in `App.tsx`, reset in `handleStartGame`

---

## Files changed

| File | Change |
|---|---|
| `src/hooks/useSound.ts` | Add 8 new sound functions |
| `src/App.tsx` | Wire roundSubmit, undoPop, bSound, secondBSound, visWin, visLose, newGame, closeFinish; add closeFinishFiredRef; haptic on submit + undo |
| `src/components/RoundForm.tsx` | Wire chipClick, hvSound, visPlay on chip selection |
| `src/components/ScoreBoard.tsx` | Add gold-glow class + CSS animation |
| `src/styles/index.css` | Add `@keyframes gold-glow` + `.player-card--danger` |

---

## Testing

- Sounds: manual only (Web Audio API doesn't render in Vitest)
- Gold glow: visual check — enable game, set score near target
- Haptic: test on real Android device
- Regression: run `bun run test` — no new unit tests needed (no new logic)
