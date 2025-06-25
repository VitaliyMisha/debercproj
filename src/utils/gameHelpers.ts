import { Round } from '../types';
import { GameRulesConfig } from '../components/GameRules';

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
    const allowVis = gameRules?.allowVis !== false; // За замовчуванням дозволено

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