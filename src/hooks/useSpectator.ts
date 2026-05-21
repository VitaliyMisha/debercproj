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
  const firstCallRef = useRef(true);
  // Debounce 'ended' to survive transient null snapshots during game continuation.
  // When host continues a game, Firebase may briefly report the path as empty before
  // the new game data arrives. Without the debounce the spectator flashes "game ended".
  const endedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!watchId) return;
    firstCallRef.current = true;

    const gameRef = ref(db, `games/${watchId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const isFirst = firstCallRef.current;
      firstCallRef.current = false;

      if (!snapshot.exists()) {
        if (isFirst) {
          setState((prev) => ({ ...prev, status: 'not_found' }));
        } else {
          // Wait before committing 'ended' — a 'live' update may arrive within ms
          // if the host just continued the game (transient empty snapshot).
          endedTimerRef.current = setTimeout(() => {
            setState((prev) => ({ ...prev, status: 'ended' }));
          }, 1500);
        }
        return;
      }

      // Live data arrived — cancel any pending 'ended' transition.
      if (endedTimerRef.current !== null) {
        clearTimeout(endedTimerRef.current);
        endedTimerRef.current = null;
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

    return () => {
      unsubscribe();
      if (endedTimerRef.current !== null) {
        clearTimeout(endedTimerRef.current);
        endedTimerRef.current = null;
      }
    };
  }, [watchId]);

  return state;
}
