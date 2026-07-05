import { useEffect, useRef } from 'react';
import { ref, set, remove, onValue, onDisconnect } from 'firebase/database';
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
  // Latest state snapshot for the reconnect handler (it lives in an effect
  // keyed only by shareCode, so it can't close over fresh props).
  const latestRef = useRef({ game, targetScore, winnerPlayer, gameRules });
  latestRef.current = { game, targetScore, winnerPlayer, gameRules };

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

  // Server-side cleanup for abandoned games: if the host closes the browser or
  // loses connection without pressing "Stop sharing", Firebase removes the
  // record itself. onDisconnect must be re-registered after every reconnect
  // (the server forgets it once it fires), hence the '.info/connected' listener.
  useEffect(() => {
    if (!isSharing || !shareCode) return;
    const gameRef = ref(db, `games/${shareCode}`);
    const disconnect = onDisconnect(gameRef);

    const unsubscribe = onValue(ref(db, '.info/connected'), (snapshot) => {
      if (snapshot.val() !== true) return;
      disconnect.remove();
      // A transient disconnect may have already wiped the record — restore it.
      const latest = latestRef.current;
      if (latest.game) {
        set(gameRef, {
          game: latest.game,
          targetScore: latest.targetScore,
          winnerPlayer: latest.winnerPlayer ?? null,
          gameRules: latest.gameRules,
          hostUpdatedAt: Date.now(),
        });
      }
    });

    return () => {
      unsubscribe();
      disconnect.cancel();
    };
  }, [isSharing, shareCode]);

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
