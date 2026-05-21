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
