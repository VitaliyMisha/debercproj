import {describe, expect, it} from 'vitest';
import {calculateGameTotals, isValidScore, parseScore} from "../src/utils/gameHelpers";
import {Game, Player, Round} from "../src/types";
import {GameRulesConfig} from '../src/types';

// Helpers shared across describe blocks
const mkRules = (overrides: Partial<GameRulesConfig> = {}): GameRulesConfig => ({
    secondBPenalty: -100,
    hvPenalty: -100,
    allowVis: true,
    customTargetScore: false,
    targetScoreOptions: [1020],
    ...overrides,
});

const mkPlayers = (...names: string[]): Player[] =>
    names.map((name, i) => ({ id: i + 1, name, winCount: 0 }));

const mkGame = (players: Player[], rounds: Round[]): Game => ({
    id: 1,
    createdAt: '',
    players,
    rounds,
    dealerId: players[0].id,
});

const mkRound = (number: number, scores: Record<string, number | string>, dealerId = 1): Round => ({
    id: number,
    number,
    scores,
    dealerId,
});


describe('Game Helpers Unit Tests', () => {
    const mockRules: GameRulesConfig = {
        secondBPenalty: -100,
        hvPenalty: -100,
        allowVis: true,
        customTargetScore: false,
        targetScoreOptions: [1020]
    };

    const players: Player[] = [
        {id: 1, name: 'Vitalii', winCount: 0},
        {id: 2, name: 'Emilia', winCount: 0}
    ];

    describe('isValidScore', () => {
        it('check valid inputs', () => {
            expect(isValidScore('50', mockRules)).toBe(true);
            expect(isValidScore('Б', mockRules)).toBe(true);
            expect(isValidScore('ХВ', mockRules)).toBe(true);
            expect(isValidScore('ВІС', mockRules)).toBe(true);
        });

        it('check specific symbols', () => {
            expect(isValidScore('abc', mockRules)).toBe(false);
            expect(isValidScore('?!', mockRules)).toBe(false);
        });
    });

    describe('calculateGameTotals', () => {
        it('check if second "Б" works correctly', () => {
            const game: Game = {
                id: 1,
                players,
                rounds: [
                    {id: 1, number: 1, scores: {'1': 'Б', '2': 50}},
                    {id: 2, number: 2, scores: {'1': 'Б', '2': 30}}
                ],
                dealerId: 1,
                createdAt: ''
            };

            const totals = calculateGameTotals(game, mockRules);
            expect(totals[1]).toBe(-100);
            expect(totals[2]).toBe(80);
        });

        it('check "ХВ" logic', () => {
            const game: Game = {
                id: 1,
                players,
                rounds: [
                    {id: 1, number: 1, scores: {'1': 'ХВ', '2': 20}}
                ],
                dealerId: 1,
                createdAt: ''
            };

            const totals = calculateGameTotals(game, mockRules);
            expect(totals[1]).toBe(-100);
            expect(totals[2]).toBe(20);
        });

        it('Check BIC logic if player win', () => {
            const game: Game = {
                id: 1,
                players,
                rounds: [
                    {id: 1, number: 1, scores: {'1': 50, '2': 'ВІС'}},
                    {id: 2, number: 2, scores: {'1': 40, '2': 60}}
                ],
                dealerId: 1,
                createdAt: ''
            };

            const totals = calculateGameTotals(game, mockRules);
            expect(totals[2]).toBe(110);
            expect(totals[1]).toBe(90);
        });
    });

    it('check Б for player who loss BIC', () => {
        const game: Game = {
            id: 1,
            players,
            rounds: [
                {id: 1, number: 1, scores: {'1': 100, '2': 'ВІС'}},
                {id: 2, number: 2, scores: {'1': 70, '2': 30}}
            ],
            dealerId: 1,
            createdAt: ''
        };

        const totals = calculateGameTotals(game, mockRules);
        expect(totals[2]).toBe(30);
        expect(totals[1]).toBe(270);
    });

    it('check total at the end of game', () => {
        const game: Game = {
            id: 1,
            players,
            rounds: [
                {id: 1, number: 1, scores: {'1': 500, '2': 200}},
                {id: 2, number: 2, scores: {'1': 520, '2': 100}}
            ],
            dealerId: 1,
            createdAt: ''
        };

        const totals = calculateGameTotals(game, mockRules);
        expect(totals[1]).toBeGreaterThanOrEqual(1020);
    });

    describe('parseScore', () => {
        it('Check spaces and lower case', () => {
            const playerRounds: Round[] = [];
            expect(parseScore('  хв  ', '1', playerRounds, mockRules)).toBe(-100);
            expect(parseScore('б', '1', playerRounds, mockRules)).toBe('Б');
        });

        it('check incorrect value', () => {
            expect(parseScore('не число', '1', [], mockRules)).toBe(0);
        });
    });

    it('check BIC with three players', () => {
        const players3 = [...players, {id: 3, name: 'Zaets', winCount: 0}];
        const game: Game = {
            id: 1,
            players: players3,
            rounds: [
                {id: 1, number: 1, scores: {'1': 100, '2': 'ВІС', '3': 20}},
                {id: 2, number: 2, scores: {'1': 10, '2': 10, '3': 80}}
            ],
            dealerId: 1,
            createdAt: ''
        };

        const totals = calculateGameTotals(game, mockRules);
        expect(totals[3]).toBe(200);
    });
});

// ─── Undo last round (handleUndoLastRound) ────────────────────────────────────
//
// handleUndoLastRound removes game.rounds.slice(0,-1) and restores dealerId.
// These tests verify calculateGameTotals produces correct results after that
// slice, covering all score-token combinations that can appear in the last round.

// ─── parseScore — Б editing regression ──────────────────────────────────────
//
// Bug: updateRound passed game.rounds (including the round being edited) to
// parseScore. When round N stored 'Б' (first Б, free), re-saving the same
// value found its own 'Б' and returned secondBPenalty instead of 'Б'.
// Fix: updateRound now passes roundsExcludingCurrent.

describe('parseScore — Б editing regression', () => {
    const rules = mkRules();

    it('first Б is free when no prior rounds', () => {
        expect(parseScore('Б', '1', [], rules)).toBe('Б');
    });

    it('second Б in a different round triggers penalty', () => {
        const r1 = mkRound(1, { '1': 'Б' });
        expect(parseScore('Б', '1', [r1], rules)).toBe(rules.secondBPenalty);
    });

    it('re-saving round 1 Б: must exclude that round from history or penalty fires incorrectly', () => {
        const round1WithB = mkRound(1, { '1': 'Б', '2': 50 });

        // Old (buggy) call — includes the round being edited → finds own Б → penalty
        const bugResult = parseScore('Б', '1', [round1WithB], rules);
        expect(bugResult).toBe(rules.secondBPenalty);

        // Fixed call — excludes the round being edited → no prior Б → free
        const fixedResult = parseScore('Б', '1', [], rules);
        expect(fixedResult).toBe('Б');
    });
});

// ─── Undo last round (handleUndoLastRound) ────────────────────────────────────
//
// handleUndoLastRound removes game.rounds.slice(0,-1) and restores dealerId.
// These tests verify calculateGameTotals produces correct results after that
// slice, covering all score-token combinations that can appear in the last round.

describe('undo last round — calculateGameTotals after rounds.slice(0,-1)', () => {
    const rules = mkRules();
    const [p1, p2] = mkPlayers('Alice', 'Bob');

    it('basic numeric scores: totals revert to state before last round', () => {
        const g = mkGame([p1, p2], [
            mkRound(1, { '1': 100, '2': 50 }),
            mkRound(2, { '1': 200, '2': 60 }),
            mkRound(3, { '1': 300, '2': 70 }),
        ]);

        const before = calculateGameTotals(g, rules);
        expect(before[1]).toBe(600);
        expect(before[2]).toBe(180);

        const afterUndo = { ...g, rounds: g.rounds.slice(0, -1) };
        const after = calculateGameTotals(afterUndo, rules);
        expect(after[1]).toBe(300);
        expect(after[2]).toBe(110);
    });

    it('undo round with first Б: player total reverts to 0', () => {
        const g = mkGame([p1, p2], [
            mkRound(1, { '1': 'Б', '2': 80 }),
        ]);

        // before undo: p1 has 1st Б (no penalty), p2=80
        const before = calculateGameTotals(g, rules);
        expect(before[1]).toBe(0);

        const after = calculateGameTotals({ ...g, rounds: [] }, rules);
        expect(after[1]).toBe(0);
        expect(after[2]).toBe(0);
    });

    it('undo round with second Б: -100 penalty disappears', () => {
        const g = mkGame([p1, p2], [
            mkRound(1, { '1': 'Б', '2': 50 }),
            mkRound(2, { '1': 'Б', '2': 30 }),
        ]);

        // 2nd Б triggers secondBPenalty=-100
        const before = calculateGameTotals(g, rules);
        expect(before[1]).toBe(-100);

        const afterUndo = { ...g, rounds: g.rounds.slice(0, -1) };
        const after = calculateGameTotals(afterUndo, rules);
        expect(after[1]).toBe(0);  // only 1st Б, no penalty
        expect(after[2]).toBe(50);
    });

    it('undo ВіС resolution round: winner bonus removed, ВіС treated as unresolved (0)', () => {
        // round1: p1=50, p2=ВІС (p2 hangs; hangingScore = p1's 50)
        // round2: p1=40, p2=60 → p2 wins: total = 60 + 50 (hangingScore) = 110
        const g = mkGame([p1, p2], [
            mkRound(1, { '1': 50, '2': 'ВІС' }),
            mkRound(2, { '1': 40, '2': 60 }),
        ]);

        const before = calculateGameTotals(g, rules);
        expect(before[1]).toBe(90);   // 50 + 40
        expect(before[2]).toBe(110);  // 60 + 50 hangingScore

        // undo round2 → only round1 left: p2 has unresolved ВіС → 0
        const afterUndo = { ...g, rounds: g.rounds.slice(0, -1) };
        const after = calculateGameTotals(afterUndo, rules);
        expect(after[1]).toBe(50);
        expect(after[2]).toBe(0);  // unresolved ВіС at game-end → ignored
    });

    it('undo ВіС loss round: Б penalty removed from ВіС player', () => {
        // round1: p1=100, p2=ВІС
        // round2: p1=70, p2=30 → p2 < p1, p2 loses → p2 gets Б
        // undo round2 → p2 has unresolved ВіС → 0 (no Б penalty)
        const g = mkGame([p1, p2], [
            mkRound(1, { '1': 100, '2': 'ВІС' }),
            mkRound(2, { '1': 70,  '2': 30 }),
        ]);

        const before = calculateGameTotals(g, rules);
        expect(before[2]).toBe(30);  // 30 from r2, ВіС loss = 1st Б (no penalty)

        const afterUndo = { ...g, rounds: g.rounds.slice(0, -1) };
        const after = calculateGameTotals(afterUndo, rules);
        expect(after[1]).toBe(100);
        expect(after[2]).toBe(0);  // only ВіС round, unresolved → 0
    });

    it('undo round that contained a new ВіС: pending entry removed', () => {
        // round1: p1=100, p2=200
        // round2: p1=ВіС (unresolved at game end), p2=50
        // before undo: p1=100 (ВіС worth 0), p2=250
        // after undo: p1=100, p2=200
        const g = mkGame([p1, p2], [
            mkRound(1, { '1': 100, '2': 200 }),
            mkRound(2, { '1': 'ВІС', '2': 50 }),
        ]);

        const before = calculateGameTotals(g, rules);
        expect(before[1]).toBe(100);  // ВіС unresolved → 0 for that round
        expect(before[2]).toBe(250);

        const afterUndo = { ...g, rounds: g.rounds.slice(0, -1) };
        const after = calculateGameTotals(afterUndo, rules);
        expect(after[1]).toBe(100);
        expect(after[2]).toBe(200);
    });

    it('undo only round: all totals reset to 0', () => {
        const g = mkGame([p1, p2], [
            mkRound(1, { '1': 300, '2': 150 }),
        ]);
        const after = calculateGameTotals({ ...g, rounds: [] }, rules);
        expect(after[1]).toBe(0);
        expect(after[2]).toBe(0);
    });

    it('undo last round with ХВ: hvPenalty removed', () => {
        const g = mkGame([p1, p2], [
            mkRound(1, { '1': 100, '2': 80 }),
            mkRound(2, { '1': rules.hvPenalty, '2': 40 }),  // ХВ already parsed to -100
        ]);

        const before = calculateGameTotals(g, rules);
        expect(before[1]).toBe(0);   // 100 - 100

        const afterUndo = { ...g, rounds: g.rounds.slice(0, -1) };
        const after = calculateGameTotals(afterUndo, rules);
        expect(after[1]).toBe(100);
        expect(after[2]).toBe(80);
    });
});

