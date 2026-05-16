import {Round, Game, GameRulesConfig} from '../types';

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

    return /^\d+$/.test(trimmed) ||
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

    const parsed = parseInt(trimmed);
    return isNaN(parsed) ? 0 : parsed;
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

            const visScore = typeof round.scores[visPlayerId] === 'number' ? round.scores[visPlayerId] as number : 0;

            if (visScore > bestOpponentCurrent.score) {
                totals[visPlayerId] += hangingScore;
            } else {
                bCounts[visPlayerId] += 1;
                if (bCounts[visPlayerId] === 2) {
                    totals[visPlayerId] += gameRules.secondBPenalty;
                }
                currentRoundBonuses[bestOpponentCurrent.playerId] = (currentRoundBonuses[bestOpponentCurrent.playerId] || 0) + hangingScore;
            }

            pendingVis.splice(pendingVis.findIndex(p => p.playerId === visPlayerId && p.roundIndex === roundIndex), 1);
        });

        for (const [pid, val] of Object.entries(round.scores)) {
            const playerId = Number(pid);
            if (val === 'Б') {
                bCounts[playerId] += 1;
                if (bCounts[playerId] === 2) {
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