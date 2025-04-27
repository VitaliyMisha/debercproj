import { Round } from '../types';
const WIN_COUNTS_KEY = 'playerWinCounts';

export const loadWinCounts = (): Record<string, number> => {
    const stored = localStorage.getItem(WIN_COUNTS_KEY);
    return stored ? JSON.parse(stored) : {};
};

export const saveWinCounts = (counts: Record<string, number>) => {
    localStorage.setItem(WIN_COUNTS_KEY, JSON.stringify(counts));
};

export const isValidScore = (val: string | number): boolean => {
    const trimmed = val.toString().trim().toUpperCase();
    return /^\d+$/.test(trimmed) || trimmed === 'Б' || trimmed === 'ХВ'|| trimmed === 'ВІС';
};

export const parseScore = (value: string | number, pid: string, playerRounds: Round[]): number | string => {
    if (typeof value === 'number') return value;
    const trimmed = value.toString().trim().toUpperCase();
    if (trimmed === 'ХВ') return -100;
    if (trimmed === 'Б') {
        const hadBBefore = playerRounds.some(r => r.scores[pid] === 'Б');
        return hadBBefore ? -100 : 'Б';
    }
    if (trimmed === 'ВІС') {
        return 'ВІС';
    }

    const parsed = parseInt(trimmed);
    return isNaN(parsed) ? 0 : parsed;
};
