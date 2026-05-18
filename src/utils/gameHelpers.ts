import { Round, Game, GameRulesConfig, SavedGameState } from '../types';

const WIN_COUNTS_KEY = 'playerWinCounts';

export const loadWinCounts = (): Record<string, number> => {
    const stored = localStorage.getItem(WIN_COUNTS_KEY);
    return stored ? JSON.parse(stored) : {};
};

export const saveWinCounts = (counts: Record<string, number>) => {
    localStorage.setItem(WIN_COUNTS_KEY, JSON.stringify(counts));
};

export const isValidScore = (val: string | number, gameRules?: GameRulesConfig): boolean => {
    const trimmed = val.toString().trim().toUpperCase();
    const allowVis = gameRules?.allowVis !== false;

    return /^-?\d+$/.test(trimmed) ||
        trimmed === 'Б' ||
        trimmed === 'ХВ' ||
        (allowVis && trimmed === 'ВІС');
};

export const parseScore = (
    value: string | number,
    pid: string,
    playerRounds: Round[],
    gameRules?: GameRulesConfig
): number | string => {
    if (typeof value === 'number') return value;

    const trimmed = value.toString().trim().toUpperCase();
    const hvPenalty = gameRules?.hvPenalty || -100;
    const secondBPenalty = gameRules?.secondBPenalty || -100;

    if (trimmed === 'ХВ') return hvPenalty;

    if (trimmed === 'Б') {
        const hadBBefore = playerRounds.some(r => r.scores[pid] === 'Б');
        return hadBBefore ? secondBPenalty : 'Б';
    }

    if (trimmed === 'ВІС' && gameRules?.allowVis !== false) {
        return 'ВІС';
    }

    const parsed = parseInt(trimmed, 10);
    return isNaN(parsed) ? 0 : parsed;
};

/**
 * Returns the value to display in round history for a given score cell.
 * For ВіС: shows 'ВіС' while pending or won, 'Б' / penalty when lost.
 * A tie in the resolution round carries ВіС forward to the next round.
 */
export const getVisDisplayValue = (
  roundIndex: number,
  playerId: number,
  rounds: Round[],
  gameRules: GameRulesConfig,
): string | number => {
  const pid = String(playerId);
  const val = rounds[roundIndex]?.scores[pid];
  const isVis = (v: unknown): boolean =>
    typeof v === 'string' && v.toUpperCase() === 'ВІС';

  if (!isVis(val)) return val ?? 0;
  if (!gameRules.allowVis) return 0;

  // Follow the chain of ties to find the actual resolution round.
  let resolveIdx = roundIndex + 1;
  while (resolveIdx < rounds.length) {
    const resolveRound = rounds[resolveIdx];
    const resolveVal = resolveRound.scores[pid];
    const visScore = typeof resolveVal === 'number' ? resolveVal : 0;
    const bestOpponent = Object.entries(resolveRound.scores)
      .filter(([id]) => id !== pid)
      .reduce((max, [, v]) => Math.max(max, typeof v === 'number' ? v : 0), -Infinity);

    if (visScore > bestOpponent) return 'ВіС'; // won — show original token
    if (visScore < bestOpponent) break;         // lost — fall through to Б logic
    resolveIdx++;                               // tie — carry forward
  }

  // Won or still pending (no round with strict loss found).
  if (resolveIdx >= rounds.length) return 'ВіС';

  // Lost — count prior Б-equivalent events (regular Б + ВіС losses) before this roundIndex.
  let bCount = 0;
  for (let i = 0; i < roundIndex; i++) {
    const prevVal = rounds[i].scores[pid];
    if (prevVal === 'Б') {
      bCount++;
    } else if (isVis(prevVal) && gameRules.allowVis) {
      // Follow tie chain for this prior ВіС, but only up to roundIndex.
      let prevResolveIdx = i + 1;
      while (prevResolveIdx < roundIndex) {
        const prevResRound = rounds[prevResolveIdx];
        const prevResVal = prevResRound.scores[pid];
        const prevVisScore = typeof prevResVal === 'number' ? prevResVal : 0;
        const prevBestOpp = Object.entries(prevResRound.scores)
          .filter(([id]) => id !== pid)
          .reduce((max, [, v]) => Math.max(max, typeof v === 'number' ? v : 0), -Infinity);
        if (prevVisScore < prevBestOpp) { bCount++; break; }
        if (prevVisScore > prevBestOpp) break;
        prevResolveIdx++;
      }
    }
  }

  return bCount >= 1 ? (gameRules.secondBPenalty ?? -100) : 'Б';
};

export function generateUniqueId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
}

export const calculateGameTotals = (game: Game, gameRules: GameRulesConfig): Record<number, number> => {
    const totals: Record<number, number> = {};
    const bCounts: Record<number, number> = {};

    game.players.forEach(p => {
        totals[p.id] = 0;
        bCounts[p.id] = 0;
    });

    const pendingVis: { playerId: number; roundIndex: number }[] = [];

    game.rounds.forEach((round, idx, allRounds) => {
        const currentRoundBonuses: Record<number, number> = {};

        const stillPendingVis = [...pendingVis];
        stillPendingVis.forEach(({ playerId: visPlayerId, roundIndex }) => {
            const prevRound = allRounds[roundIndex];
            const hangingScore = Math.max(
                ...Object.values(prevRound.scores)
                    .map(val => typeof val === 'number' ? val : 0)
            );
            const opponentEntriesCurrent = Object.entries(round.scores)
                .filter(([id]) => Number(id) !== visPlayerId)
                .map(([id, val]) => ({
                    playerId: Number(id),
                    score: typeof val === 'number' ? val : 0
                }));

            const bestOpponentCurrent = opponentEntriesCurrent.reduce((best, curr) =>
                curr.score > best.score ? curr : best, { playerId: -1, score: -Infinity }
            );

            const rawVisVal = round.scores[visPlayerId];
            const visScore = typeof rawVisVal === 'number' ? rawVisVal : 0;

            if (visScore > bestOpponentCurrent.score) {
                // WIN: ВіС player earns the hanging score (their round score is counted below).
                totals[visPlayerId] += hangingScore;
                pendingVis.splice(pendingVis.findIndex(p => p.playerId === visPlayerId && p.roundIndex === roundIndex), 1);
            } else if (visScore < bestOpponentCurrent.score) {
                // LOSS: ВіС player gets Б; best opponent earns the hanging score.
                bCounts[visPlayerId] += 1;
                if (bCounts[visPlayerId] >= 2) {
                    totals[visPlayerId] += gameRules.secondBPenalty;
                }
                currentRoundBonuses[bestOpponentCurrent.playerId] = (currentRoundBonuses[bestOpponentCurrent.playerId] || 0) + hangingScore;
                pendingVis.splice(pendingVis.findIndex(p => p.playerId === visPlayerId && p.roundIndex === roundIndex), 1);
            }
            // TIE: ВіС carries forward — entry stays in pendingVis; no bonus or penalty applied.
        });

        for (const [pid, val] of Object.entries(round.scores)) {
            const playerId = Number(pid);
            if (val === 'Б') {
                bCounts[playerId] += 1;
                if (bCounts[playerId] >= 2) {
                    totals[playerId] += gameRules.secondBPenalty;
                }
            } else if (val === 'ВІС' && gameRules.allowVis) {
                pendingVis.push({ playerId, roundIndex: idx });
            }
        }
        for (const [pid, val] of Object.entries(round.scores)) {
            const playerId = Number(pid);
            const isCurrentlyPending = pendingVis.some(p => p.playerId === playerId && p.roundIndex === idx);

            if (!isCurrentlyPending) {
                let roundScore = 0;
                if (typeof val === 'number') {
                    roundScore = val;
                } else if (val === 'ХВ') {
                    roundScore = gameRules.hvPenalty;
                }
                totals[playerId] += roundScore + (currentRoundBonuses[playerId] || 0);
            }
        }
    });

    return totals;
};

const SAVED_GAME_KEY = 'savedGame';

export function saveGameState(state: SavedGameState): void {
  localStorage.setItem(SAVED_GAME_KEY, JSON.stringify(state));
}

export function loadGameState(): SavedGameState | null {
  try {
    const raw = localStorage.getItem(SAVED_GAME_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.game?.players || !Array.isArray(parsed.game.rounds)) return null;
    return parsed as SavedGameState;
  } catch {
    return null;
  }
}

export function clearGameState(): void {
  localStorage.removeItem(SAVED_GAME_KEY);
}

const PLAYER_NAMES_KEY = 'playerNames';

export function loadPlayerNames(): string[] {
  try {
    const raw = localStorage.getItem(PLAYER_NAMES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function savePlayerNames(newNames: string[]): void {
  const trimmed = newNames.map((n) => n.trim()).filter(Boolean);
  const stored = loadPlayerNames();
  const existing = stored.filter(
    (e) => !trimmed.some((n) => n.toLowerCase() === e.toLowerCase()),
  );
  const merged = [...existing, ...trimmed];
  if (JSON.stringify(stored) !== JSON.stringify(merged)) {
    localStorage.setItem(PLAYER_NAMES_KEY, JSON.stringify(merged));
  }
}
