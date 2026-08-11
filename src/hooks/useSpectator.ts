import { onValue, ref } from 'firebase/database';
import { useEffect, useRef, useState } from 'react';
import { db } from '../config/firebase';
import type { Game, GameRulesConfig } from '../types';
import { DEFAULT_GAME_RULES } from '../utils/gameHelpers';

export type SpectatorStatus = 'loading' | 'live' | 'ended' | 'not_found';

export interface SpectatorState {
  game: Game | null;
  targetScore: number;
  winnerPlayer: number | null;
  gameRules: GameRulesConfig | null;
  status: SpectatorStatus;
}

export function useSpectator(watchId: string | null): SpectatorState {
  const [state, setState] = useState<SpectatorState>({
    game: null,
    targetScore: 1020,
    winnerPlayer: null,
    gameRules: null,
    status: watchId ? 'loading' : 'not_found',
  });
  // Whether we've ever seen live game data for the current watchId — decides
  // 'not_found' vs 'ended' once the debounce below commits an empty snapshot.
  const sawDataRef = useRef(false);
  // Debounce every empty snapshot (not just later ones) to survive transient nulls:
  // Firebase can briefly report the path as empty during host reconnect/continuation.
  // A spectator who refreshes mid-blip is a fresh 'first call' too, so this must not
  // be skipped for the first snapshot — otherwise a refresh during a momentary host
  // disconnect permanently shows "game not found" instead of recovering.
  const endedTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (!watchId) return;
    sawDataRef.current = false;

    const gameRef = ref(db, `games/${watchId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      if (!snapshot.exists()) {
        // Wait before committing 'not_found'/'ended' — a 'live' update may arrive
        // within ms if the host just reconnected or continued the game.
        // Clear any earlier timer so repeated empty snapshots restart the debounce.
        if (endedTimerRef.current !== null) clearTimeout(endedTimerRef.current);
        endedTimerRef.current = setTimeout(() => {
          setState((prev) => ({ ...prev, status: sawDataRef.current ? 'ended' : 'not_found' }));
        }, 1500);
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

      // Firebase omits empty arrays — restore them so game.rounds is always an array.
      const game: Game | null = data.game ? { ...data.game, rounds: data.game.rounds ?? [], players: data.game.players ?? [] } : null;

      sawDataRef.current = true;
      setState({
        game,
        targetScore: data.targetScore ?? 1020,
        winnerPlayer: data.winnerPlayer ?? null,
        gameRules: data.gameRules ?? DEFAULT_GAME_RULES,
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
