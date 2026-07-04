import { Round, Game, GameRulesConfig, SavedGameState } from '../types';

/** Single source of truth for default rules (used by App and the spectator hook). */
export const DEFAULT_GAME_RULES: GameRulesConfig = {
  secondBPenalty: -100,
  hvPenalty: -100,
  allowVis: true,
  customTargetScore: false,
  targetScoreOptions: [510, 1020],
};

const WIN_COUNTS_KEY = 'playerWinCounts';

/**
 * Key for the persisted win-counts record. Player ids are regenerated every
 * game, so wins are keyed by normalised player name instead.
 */
export const winCountKey = (name: string): string => name.trim().toLowerCase();

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
    // `??` (not `||`): a configured penalty of 0 is a valid value and must not fall back to -100.
    const hvPenalty = gameRules?.hvPenalty ?? -100;
    const secondBPenalty = gameRules?.secondBPenalty ?? -100;

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
    const bestOppScore = bestOpponent(resolveRound.scores, playerId).score;

    if (visScore > bestOppScore) return 'ВіС'; // won — show original token
    if (visScore < bestOppScore) break;         // lost — fall through to Б logic
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
        const prevBestOpp = bestOpponent(prevResRound.scores, playerId).score;
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

/**
 * Returns the highest-scoring opponent of `playerId` in a round.
 * Token scores (Б / ХВ / ВіС) count as 0. Used for ВіС resolution.
 */
export const bestOpponent = (
  scores: Round['scores'],
  playerId: number,
): { playerId: number; score: number } =>
  Object.entries(scores)
    .filter(([id]) => Number(id) !== playerId)
    .map(([id, val]) => ({ playerId: Number(id), score: typeof val === 'number' ? val : 0 }))
    .reduce((best, curr) => (curr.score > best.score ? curr : best), { playerId: -1, score: -Infinity });

/**
 * Determines the winner of a game: the single player with the highest total
 * at or above the target score. Returns null when nobody reached the target
 * or when the top contenders are tied.
 */
export const findWinner = (game: Game, gameRules: GameRulesConfig, targetScore: number): number | null => {
  const totals = calculateGameTotals(game, gameRules);
  const contenders = game.players.filter((p) => totals[p.id] >= targetScore);
  if (contenders.length === 0) return null;
  const maxScore = Math.max(...contenders.map((p) => totals[p.id]));
  const winners = contenders.filter((p) => totals[p.id] === maxScore);
  return winners.length === 1 ? winners[0].id : null;
};

export type RoundTokenViolation = 'oneB' | 'oneVis';

/**
 * Game rule: at most one player may take Б and at most one may play ВіС per round.
 * Accepts raw form input (numbers or unnormalised token strings).
 */
export const validateRoundTokens = (scores: Record<string, number | string>): RoundTokenViolation | null => {
  const values = Object.values(scores).map((v) => String(v).trim().toUpperCase());
  if (values.filter((v) => v === 'Б').length > 1) return 'oneB';
  if (values.filter((v) => v === 'ВІС').length > 1) return 'oneVis';
  return null;
};

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
            const bestOpponentCurrent = bestOpponent(round.scores, visPlayerId);

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
  // Remove old case variant of each incoming name so the newer capitalisation wins.
  const existing = stored.filter(
    (e) => !trimmed.some((n) => n.toLowerCase() === e.toLowerCase()),
  );
  const merged = [...existing, ...trimmed];
  if (JSON.stringify(stored) !== JSON.stringify(merged)) {
    localStorage.setItem(PLAYER_NAMES_KEY, JSON.stringify(merged));
  }
}
