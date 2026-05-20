# Spectator Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add real-time game spectating via QR code — host shares an active game, anyone who scans sees a live read-only view synced through Firebase Realtime DB.

**Architecture:** Firebase Realtime DB stores game state under `games/{shareCode}`; the host pushes updates on every game change via `useFirebaseSync`; spectators subscribe via `useSpectator` using `onValue()`; spectator entry detected from `?watch=` URL param.

**Tech Stack:** `firebase` v10 (modular), `qrcode.react` v3, existing React + TypeScript + Tailwind + i18next stack.

---

## Prerequisites (manual, one-time setup)

Before running any task, the developer must:

1. Create a Firebase project at https://console.firebase.google.com
2. In the project: Build → Realtime Database → Create database (Start in **test mode** is fine, we'll set rules after)
3. In Database → Rules, paste:
```json
{
  "rules": {
    "games": {
      "$gameId": {
        ".read": true,
        ".write": "newData.child('hostUpdatedAt').exists()"
      }
    }
  }
}
```
4. In Project Settings → General → Your apps → Add web app → copy the config object
5. Create `/Users/vitaliymisha/WebstormProjects/debercproj/.env.local` with:
```
VITE_FIREBASE_API_KEY=<from config>
VITE_FIREBASE_AUTH_DOMAIN=<from config>
VITE_FIREBASE_DATABASE_URL=<from config, e.g. https://myproject-default-rtdb.firebaseio.com>
VITE_FIREBASE_PROJECT_ID=<from config>
VITE_FIREBASE_APP_ID=<from config>
```
6. In Vercel dashboard → Project → Settings → Environment Variables — add the same 5 variables

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `src/config/firebase.ts` | Create | Firebase app + db instance |
| `src/hooks/useFirebaseSync.ts` | Create | Host: write game state to Firebase |
| `src/hooks/useSpectator.ts` | Create | Spectator: subscribe to Firebase game state |
| `src/components/ShareSheet.tsx` | Create | QR code bottom sheet |
| `src/i18n/locales/uk.ts` | Modify | Add `share` i18n section |
| `src/i18n/locales/en.ts` | Modify | Add `share` i18n section |
| `src/components/RoundHistory.tsx` | Modify | Add `readOnly` prop |
| `src/components/WinnerScreen.tsx` | Modify | Make `onNewGame`/`onContinue` optional |
| `src/components/GameHeader.tsx` | Modify | Add 📡 share button |
| `src/App.tsx` | Modify | Host side + spectator layout |
| `.env.local.example` | Create | Template for env vars |

---

## Task 1: Install dependencies + Firebase config

**Files:**
- Create: `src/config/firebase.ts`
- Create: `.env.local.example`

- [ ] **Step 1: Install packages**

```bash
cd /Users/vitaliymisha/WebstormProjects/debercproj
bun add firebase qrcode.react
```

Expected: packages added to `package.json` and `bun.lock`.

- [ ] **Step 2: Create `.env.local.example`**

Create `/Users/vitaliymisha/WebstormProjects/debercproj/.env.local.example`:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_DATABASE_URL=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_APP_ID=
```

- [ ] **Step 3: Create `src/config/firebase.ts`**

```ts
import { initializeApp } from 'firebase/app';
import { getDatabase } from 'firebase/database';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
```

- [ ] **Step 4: Type-check**

```bash
bun run type-check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/config/firebase.ts .env.local.example package.json bun.lock
git commit -m "feat(spectator): add Firebase + qrcode.react deps and config"
```

---

## Task 2: i18n keys for share/spectator UI

**Files:**
- Modify: `src/i18n/locales/uk.ts`
- Modify: `src/i18n/locales/en.ts`

- [ ] **Step 1: Add `share` section to `uk.ts`**

In `src/i18n/locales/uk.ts`, add after the `error` block (before the closing `};`):

```ts
  share: {
    title: 'Поділитися грою',
    copyLink: 'Копіювати посилання',
    copied: '✓ Скопійовано',
    stopSharing: 'Зупинити шеринг',
    spectatorBanner: '👁 Режим перегляду · Гра #{{id}}',
    spectatorLoading: 'Завантаження гри...',
    spectatorEnded: 'Гру завершено або шеринг зупинено',
    spectatorNotFound: 'Гру не знайдено. Перевірте посилання.',
  },
```

- [ ] **Step 2: Add `share` section to `en.ts`**

In `src/i18n/locales/en.ts`, add the same block after the `error` block:

```ts
  share: {
    title: 'Share Game',
    copyLink: 'Copy Link',
    copied: '✓ Copied',
    stopSharing: 'Stop Sharing',
    spectatorBanner: '👁 Spectator Mode · Game #{{id}}',
    spectatorLoading: 'Loading game...',
    spectatorEnded: 'Game ended or sharing was stopped',
    spectatorNotFound: 'Game not found. Check the link.',
  },
```

- [ ] **Step 3: Type-check (verifies `en` satisfies `typeof uk`)**

```bash
bun run type-check
```

Expected: 0 errors. TypeScript will catch if the new keys in `en.ts` don't match `uk.ts`.

- [ ] **Step 4: Commit**

```bash
git add src/i18n/locales/uk.ts src/i18n/locales/en.ts
git commit -m "feat(spectator): add share/spectator i18n keys (uk + en)"
```

---

## Task 3: `useFirebaseSync` hook

**Files:**
- Create: `src/hooks/useFirebaseSync.ts`

This hook runs on the **host side**. It writes game state to Firebase when `isSharing` is true, and deletes the record when sharing stops or the component unmounts.

- [ ] **Step 1: Create `src/hooks/useFirebaseSync.ts`**

```ts
import { useEffect } from 'react';
import { ref, set, remove } from 'firebase/database';
import { db } from '../config/firebase';
import type { Game, GameRulesConfig } from '../types';

interface FirebaseSyncParams {
  game: Game | null;
  targetScore: number;
  winnerPlayer: number | null;
  gameRules: GameRulesConfig;
  isSharing: boolean;
  shareCode: string | null;
}

export function useFirebaseSync({
  game,
  targetScore,
  winnerPlayer,
  gameRules,
  isSharing,
  shareCode,
}: FirebaseSyncParams): void {
  // Write game state to Firebase on every change while sharing is active
  useEffect(() => {
    if (!isSharing || !shareCode || !game) return;
    set(ref(db, `games/${shareCode}`), {
      game,
      targetScore,
      winnerPlayer: winnerPlayer ?? null,
      gameRules,
      hostUpdatedAt: Date.now(),
    });
  }, [game, targetScore, winnerPlayer, gameRules, isSharing, shareCode]);

  // Delete Firebase record when shareCode is removed (sharing stopped) or on unmount
  useEffect(() => {
    const code = shareCode;
    return () => {
      if (code) {
        remove(ref(db, `games/${code}`));
      }
    };
  }, [shareCode]);
}
```

How the cleanup works: when `shareCode` changes from a value to `null` (host stopped sharing), the cleanup of the previous effect fires with the captured `code` value → deletes the Firebase record. Same on unmount if `shareCode` is still set.

- [ ] **Step 2: Type-check**

```bash
bun run type-check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useFirebaseSync.ts
git commit -m "feat(spectator): add useFirebaseSync hook"
```

---

## Task 4: `useSpectator` hook

**Files:**
- Create: `src/hooks/useSpectator.ts`

This hook runs on the **spectator side**. It subscribes to `games/{watchId}` in Firebase and returns live game state.

- [ ] **Step 1: Create `src/hooks/useSpectator.ts`**

```ts
import { useEffect, useRef, useState } from 'react';
import { ref, onValue } from 'firebase/database';
import { db } from '../config/firebase';
import type { Game, GameRulesConfig } from '../types';

export type SpectatorStatus = 'loading' | 'live' | 'ended' | 'not_found';

export interface SpectatorState {
  game: Game | null;
  targetScore: number;
  winnerPlayer: number | null;
  gameRules: GameRulesConfig | null;
  status: SpectatorStatus;
}

const DEFAULT_RULES: GameRulesConfig = {
  secondBPenalty: -100,
  hvPenalty: -100,
  allowVis: true,
  customTargetScore: false,
  targetScoreOptions: [510, 1020],
};

export function useSpectator(watchId: string | null): SpectatorState {
  const [state, setState] = useState<SpectatorState>({
    game: null,
    targetScore: 1020,
    winnerPlayer: null,
    gameRules: null,
    status: watchId ? 'loading' : 'not_found',
  });
  // Track whether the first Firebase callback has fired
  const firstCallRef = useRef(true);

  useEffect(() => {
    if (!watchId) return;
    firstCallRef.current = true;

    const gameRef = ref(db, `games/${watchId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const isFirst = firstCallRef.current;
      firstCallRef.current = false;

      if (!snapshot.exists()) {
        setState((prev) => ({
          ...prev,
          status: isFirst ? 'not_found' : 'ended',
        }));
        return;
      }

      const data = snapshot.val() as {
        game: Game;
        targetScore: number;
        winnerPlayer: number | null;
        gameRules: GameRulesConfig;
      };

      setState({
        game: data.game ?? null,
        targetScore: data.targetScore ?? 1020,
        winnerPlayer: data.winnerPlayer ?? null,
        gameRules: data.gameRules ?? DEFAULT_RULES,
        status: 'live',
      });
    });

    return () => unsubscribe();
  }, [watchId]);

  return state;
}
```

- [ ] **Step 2: Type-check**

```bash
bun run type-check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/hooks/useSpectator.ts
git commit -m "feat(spectator): add useSpectator hook"
```

---

## Task 5: `ShareSheet` component

**Files:**
- Create: `src/components/ShareSheet.tsx`

Bottom sheet that shows the QR code, a copy-link button, and a stop-sharing button. Matches the visual style of `ConfirmSheet.tsx`.

- [ ] **Step 1: Create `src/components/ShareSheet.tsx`**

```tsx
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { QRCodeSVG } from 'qrcode.react';

interface ShareSheetProps {
  shareUrl: string;
  onStopSharing: () => void;
  onClose: () => void;
}

export const ShareSheet: React.FC<ShareSheetProps> = ({ shareUrl, onStopSharing, onClose }) => {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleStop = () => {
    onStopSharing();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          WebkitBackdropFilter: 'blur(4px)',
          animation: 'fadeInBackdrop 200ms ease-out',
        }}
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Sheet */}
      <div
        className="relative bg-card-bg border-t border-white/10 rounded-t-3xl px-5 pt-4 pb-10"
        style={{
          animation: 'slideUpSheet 280ms cubic-bezier(0.34, 1.06, 0.64, 1)',
          boxShadow: '0 -8px 40px rgba(0,0,0,0.6)',
        }}
        role="dialog"
        aria-modal="true"
        aria-labelledby="share-sheet-title"
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-white/20 rounded-full mx-auto mb-6" />

        <h3 id="share-sheet-title" className="text-white text-lg font-semibold text-center font-sans mb-6">
          {t('share.title')}
        </h3>

        {/* QR Code */}
        <div className="flex justify-center mb-6">
          <div className="p-4 bg-white rounded-2xl">
            <QRCodeSVG value={shareUrl} size={180} />
          </div>
        </div>

        <div className="flex flex-col gap-3">
          {/* Copy link */}
          <button
            type="button"
            onClick={handleCopy}
            className="w-full h-12 rounded-2xl font-semibold text-sm text-white
              bg-white/10 border border-white/15
              hover:border-white/30 transition-all duration-150 active:scale-[0.97]"
          >
            {copied ? t('share.copied') : t('share.copyLink')}
          </button>

          {/* Stop sharing */}
          <button
            type="button"
            onClick={handleStop}
            className="w-full h-12 rounded-2xl font-semibold text-sm
              transition-all duration-150 active:scale-[0.97]"
            style={{
              color: '#FCA5A5',
              background: '#7F1D1D44',
              border: '1px solid #DC262640',
            }}
          >
            {t('share.stopSharing')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ShareSheet;
```

- [ ] **Step 2: Type-check**

```bash
bun run type-check
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add src/components/ShareSheet.tsx
git commit -m "feat(spectator): add ShareSheet component with QR code"
```

---

## Task 6: `RoundHistory` — add `readOnly` prop

**Files:**
- Modify: `src/components/RoundHistory.tsx`

Add a `readOnly` prop. When true: hide the undo button in the header and hide the ✏️ edit button per row.

- [ ] **Step 1: Add `readOnly` to the props interface**

In `src/components/RoundHistory.tsx`, find the `interface RoundHistoryProps` block and add `readOnly?: boolean`:

```ts
interface RoundHistoryProps {
  rounds: Round[];
  players: Player[];
  onUpdateRound: (roundNumber: number, newScores: Record<string, string>) => void;
  gameRules?: GameRulesConfig;
  snapshotRound?: number | null;
  onUndoLastRound?: () => void;
  readOnly?: boolean;
}
```

- [ ] **Step 2: Destructure `readOnly` in the component**

Find the component function signature:

```ts
const RoundHistory: React.FC<RoundHistoryProps> = ({ rounds, players, onUpdateRound, gameRules, snapshotRound, onUndoLastRound }) => {
```

Replace with:

```ts
const RoundHistory: React.FC<RoundHistoryProps> = ({ rounds, players, onUpdateRound, gameRules, snapshotRound, onUndoLastRound, readOnly = false }) => {
```

- [ ] **Step 3: Hide undo button when readOnly**

Find the undo button render (inside the header, checks `!collapsed && onUndoLastRound`):

```tsx
{!collapsed && onUndoLastRound && (
  <button ...>
    ↩ {t('history.undoBtn')}
  </button>
)}
```

Replace with:

```tsx
{!collapsed && onUndoLastRound && !readOnly && (
  <button ...>
    ↩ {t('history.undoBtn')}
  </button>
)}
```

- [ ] **Step 4: Hide edit button per round when readOnly**

In `RoundHistory.tsx`, find where the edit button is rendered. It looks like this (search for `t('history.edit')`):

```tsx
<button
  type="button"
  onClick={() => startEditing(round)}
  ...
>
  {t('history.edit')}
</button>
```

Wrap it in a `!readOnly` condition:

```tsx
{!readOnly && (
  <button
    type="button"
    onClick={() => startEditing(round)}
    ...
  >
    {t('history.edit')}
  </button>
)}
```

- [ ] **Step 5: Type-check + tests**

```bash
bun run type-check && bun run test
```

Expected: 0 errors, 107 tests pass.

- [ ] **Step 6: Commit**

```bash
git add src/components/RoundHistory.tsx
git commit -m "feat(spectator): add readOnly prop to RoundHistory"
```

---

## Task 7: `WinnerScreen` — make `onNewGame`/`onContinue` optional

**Files:**
- Modify: `src/components/WinnerScreen.tsx`

Spectators should see the winner announcement but not the action buttons.

- [ ] **Step 1: Make props optional in the interface**

In `src/components/WinnerScreen.tsx`, find:

```ts
interface WinnerScreenProps {
  winner: Player;
  players: Player[];
  totals: Record<string, number>;
  roundCount: number;
  onNewGame: () => void;
  onContinue: () => void;
  soundEnabled?: boolean;
}
```

Change `onNewGame` and `onContinue` to optional:

```ts
interface WinnerScreenProps {
  winner: Player;
  players: Player[];
  totals: Record<string, number>;
  roundCount: number;
  onNewGame?: () => void;
  onContinue?: () => void;
  soundEnabled?: boolean;
}
```

- [ ] **Step 2: Update the component to handle missing handlers**

Find the destructuring in the component function and add defaults:

```ts
export const WinnerScreen: React.FC<WinnerScreenProps> = ({
  winner,
  players,
  totals,
  roundCount,
  onNewGame,
  onContinue,
  soundEnabled = true,
}) => {
```

(No change needed here — just leave as-is since the props are now optional.)

Find the buttons that call `onNewGame` and `onContinue`. They look like:

```tsx
<Button onClick={onNewGame}>...</Button>
<Button onClick={onContinue}>...</Button>
```

Wrap each in a conditional:

```tsx
{onNewGame && <Button onClick={onNewGame}>...</Button>}
{onContinue && <Button onClick={onContinue}>...</Button>}
```

Read `src/components/WinnerScreen.tsx` fully to find the exact JSX for these buttons before editing.

- [ ] **Step 3: Type-check + tests**

```bash
bun run type-check && bun run test
```

Expected: 0 errors, 107 tests pass.

- [ ] **Step 4: Commit**

```bash
git add src/components/WinnerScreen.tsx
git commit -m "feat(spectator): make WinnerScreen action buttons optional"
```

---

## Task 8: `GameHeader` — share button

**Files:**
- Modify: `src/components/GameHeader.tsx`

Add `isSharing` and `onShareOpen` props. Render a 📡 button that pulses gold when sharing is active.

- [ ] **Step 1: Add new props to the interface**

In `src/components/GameHeader.tsx`, find `interface GameHeaderProps` and add two new props:

```ts
interface GameHeaderProps {
  gameId: number;
  targetScore: number;
  dealerName?: string;
  onNewGame?: () => void;
  hasRounds?: boolean;
  soundEnabled?: boolean;
  onSoundToggle?: () => void;
  lang?: 'uk' | 'en';
  onLangChange?: () => void;
  isSharing?: boolean;
  onShareOpen?: () => void;
}
```

- [ ] **Step 2: Destructure new props**

Find the component function signature and add `isSharing = false` and `onShareOpen`:

```ts
export const GameHeader: React.FC<GameHeaderProps> = ({
  gameId,
  targetScore,
  dealerName,
  onNewGame,
  hasRounds = false,
  soundEnabled = true,
  onSoundToggle,
  lang = 'uk',
  onLangChange,
  isSharing = false,
  onShareOpen,
}) => {
```

- [ ] **Step 3: Add 📡 button before the lang toggle button**

Find the buttons area. Locate the `{onLangChange && (` block and add the share button before it:

```tsx
{onShareOpen && (
  <button
    type="button"
    onClick={onShareOpen}
    aria-label={t('share.title')}
    className={`w-9 h-9 rounded-xl border text-base
      hover:border-white/30 transition-all duration-150 active:scale-[0.97]
      flex items-center justify-center
      ${isSharing
        ? 'bg-gold-from/20 border-gold-from/60'
        : 'bg-card-bg border-white/10'
      }`}
  >
    📡
  </button>
)}

{onLangChange && (
  // existing lang button...
```

- [ ] **Step 4: Type-check**

```bash
bun run type-check
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/components/GameHeader.tsx
git commit -m "feat(spectator): add share button to GameHeader"
```

---

## Task 9: `App.tsx` — host side (isSharing + ShareSheet)

**Files:**
- Modify: `src/App.tsx`

Add sharing state, wire `useFirebaseSync`, show `ShareSheet`, pass new props to `GameHeader`, reset sharing on new game.

- [ ] **Step 1: Add imports**

At the top of `src/App.tsx`, add:

```ts
import { useFirebaseSync } from './hooks/useFirebaseSync';
import ShareSheet from './components/ShareSheet';
```

- [ ] **Step 2: Add sharing state**

After the existing `useState` declarations (e.g., after `const [playerNames, ...]`), add:

```ts
const [isSharing, setIsSharing] = useState(false);
const [shareCode, setShareCode] = useState<string | null>(null);
const [showShareSheet, setShowShareSheet] = useState(false);
```

- [ ] **Step 3: Add share handlers**

After the `handleLangChange` callback, add:

```ts
const handleShareOpen = useCallback(() => {
  if (!isSharing) {
    const code = crypto.randomUUID().replace(/-/g, '').slice(0, 10);
    setShareCode(code);
    setIsSharing(true);
  }
  setShowShareSheet(true);
}, [isSharing]);

const handleStopSharing = useCallback(() => {
  setIsSharing(false);
  setShareCode(null);
  setShowShareSheet(false);
}, []);
```

- [ ] **Step 4: Wire `useFirebaseSync`**

After the `useSound` destructuring line, add:

```ts
useFirebaseSync({ game, targetScore, winnerPlayer, gameRules, isSharing, shareCode });
```

- [ ] **Step 5: Reset sharing in `resetGame`**

Find the `resetGame` function and add three lines at the top:

```ts
const resetGame = () => {
  setIsSharing(false);
  setShareCode(null);
  setShowShareSheet(false);
  clearGameState();
  // ... rest unchanged
```

- [ ] **Step 6: Pass new props to `GameHeader`**

Find the `<GameHeader` JSX block and add:

```tsx
<GameHeader
  gameId={game.id}
  targetScore={targetScore}
  dealerName={game.players.find((p) => p.id === game.dealerId)?.name || ''}
  onNewGame={resetGame}
  hasRounds={game.rounds.length > 0}
  soundEnabled={soundEnabled}
  onSoundToggle={() => setSoundEnabled((prev) => !prev)}
  lang={lang}
  onLangChange={handleLangChange}
  isSharing={isSharing}
  onShareOpen={handleShareOpen}
/>
```

- [ ] **Step 7: Render `ShareSheet`**

At the bottom of the game `<main>` section (after `</main>`), add the ShareSheet:

```tsx
{showShareSheet && shareCode && game && (
  <ShareSheet
    shareUrl={`${window.location.origin}?watch=${shareCode}`}
    onStopSharing={handleStopSharing}
    onClose={() => setShowShareSheet(false)}
  />
)}
```

Place this just before the closing `</div>` of the root `<div className="felt-bg ...">`.

- [ ] **Step 8: Type-check + tests**

```bash
bun run type-check && bun run test
```

Expected: 0 errors, 107 tests pass.

- [ ] **Step 9: Commit**

```bash
git add src/App.tsx
git commit -m "feat(spectator): wire host-side sharing — useFirebaseSync + ShareSheet + GameHeader"
```

---

## Task 10: `App.tsx` — spectator layout

**Files:**
- Modify: `src/App.tsx`

Detect `?watch=` URL param, call `useSpectator`, render read-only game view with status banners.

- [ ] **Step 1: Add imports**

Add to the existing imports at the top of `src/App.tsx`:

```ts
import { useSpectator } from './hooks/useSpectator';
```

- [ ] **Step 2: Detect `watchId` and call `useSpectator`**

At the top of the `App` function body (before all other `useState` calls), add:

```ts
const watchId = useMemo(() => new URLSearchParams(window.location.search).get('watch'), []);
const spectator = useSpectator(watchId);
```

- [ ] **Step 3: Compute spectator totals**

After the existing `totals` useMemo, add:

```ts
const spectatorTotals = useMemo(() => {
  if (!watchId || !spectator.game || !spectator.gameRules) return {};
  return calculateGameTotals(spectator.game, spectator.gameRules);
}, [watchId, spectator.game, spectator.gameRules]);

const spectatorWinnerObj = useMemo(
  () =>
    spectator.game && spectator.winnerPlayer !== null
      ? (spectator.game.players.find((p) => p.id === spectator.winnerPlayer) ?? null)
      : null,
  [spectator.game, spectator.winnerPlayer],
);
```

- [ ] **Step 4: Add spectator layout branch**

In the JSX `return`, after the corner-suits decorations div and before the global lang toggle button, add a spectator early-return block:

```tsx
{watchId && (
  (() => {
    if (spectator.status === 'loading') {
      return (
        <main className="flex items-center justify-center min-h-dvh">
          <p className="text-muted text-sm">{t('share.spectatorLoading')}</p>
        </main>
      );
    }
    if (spectator.status === 'not_found' || spectator.status === 'ended') {
      return (
        <main className="flex items-center justify-center min-h-dvh px-6 text-center">
          <p className="text-muted text-sm">
            {spectator.status === 'not_found'
              ? t('share.spectatorNotFound')
              : t('share.spectatorEnded')}
          </p>
        </main>
      );
    }
    // status === 'live'
    const sg = spectator.game!;
    return (
      <main className="w-full max-w-2xl mx-auto flex flex-col gap-4 p-4">
        {/* Spectator banner */}
        <div className="rounded-2xl bg-card-bg border border-white/8 px-4 py-3 text-center">
          <p className="text-sm font-semibold text-white/70">
            {t('share.spectatorBanner', { id: sg.id })}
          </p>
        </div>

        <ScoreBoard
          players={sg.players}
          totals={spectatorTotals as Record<string, number>}
          targetScore={spectator.targetScore}
          dealerId={sg.dealerId}
          snapshotActive={false}
          deltas={null}
          deltaKey={0}
        />

        {spectatorWinnerObj ? (
          <Suspense fallback={null}>
            <WinnerScreen
              winner={spectatorWinnerObj}
              players={sg.players}
              totals={spectatorTotals as Record<string, number>}
              roundCount={sg.rounds.length}
              soundEnabled={false}
            />
          </Suspense>
        ) : null}

        <RoundHistory
          rounds={sg.rounds}
          players={sg.players}
          onUpdateRound={() => {}}
          gameRules={spectator.gameRules ?? undefined}
          readOnly
        />
      </main>
    );
  })()
)}
```

Place this block so it **replaces** the existing ternary render when `watchId` is set. The cleanest approach: wrap the entire existing JSX content (everything after the corner suits div) in `{!watchId ? ( <existing content> ) : ( <spectator block above> )}`.

- [ ] **Step 5: Type-check + tests**

```bash
bun run type-check && bun run test
```

Expected: 0 errors, 107 tests pass.

- [ ] **Step 6: Lint**

```bash
bun run lint
```

Fix any issues reported, then run `bun run lint:fix` if needed.

- [ ] **Step 7: Commit**

```bash
git add src/App.tsx
git commit -m "feat(spectator): add spectator layout — watchId detection + live read-only view"
```

- [ ] **Step 8: Push to deploy**

```bash
git push origin main
```

Then verify on the deployed URL:
1. Start a game, tap 📡 in GameHeader → ShareSheet with QR opens
2. Open the `?watch=CODE` URL in another tab → spectator banner + ScoreBoard appear
3. Add a round in the host tab → spectator tab updates within ~1 second
4. Tap "Stop Sharing" in host → spectator tab shows "ended" message

---

## Self-review

**Spec coverage:**
- ✅ Firebase Realtime DB sync → Tasks 1, 3
- ✅ QR code → Task 5 (ShareSheet with `QRCodeSVG`)
- ✅ Share button in GameHeader → Task 8
- ✅ `?watch=` URL entry point → Task 10
- ✅ Spectator sees ScoreBoard + RoundHistory (no RoundForm) → Task 10
- ✅ readOnly (no edit/undo) → Task 6
- ✅ WinnerScreen without action buttons → Task 7
- ✅ Status states: loading / live / ended / not_found → Task 4 + 10
- ✅ isSharing toggle + cleanup on new game → Task 9
- ✅ i18n for all new strings → Task 2
- ✅ Firebase Security Rules → Prerequisites

**No placeholders found.**

**Type consistency:** `SpectatorState` defined in Task 4, used in Task 10. `shareCode` is `string | null` throughout Tasks 3, 9. `readOnly` prop added in Task 6, used in Task 10. All consistent.
