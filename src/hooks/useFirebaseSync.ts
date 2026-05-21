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
