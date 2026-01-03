import {describe, expect, it} from 'vitest';
import {calculateGameTotals, isValidScore, parseScore} from "../src/utils/gameHelpers";
import {Game, Player, Round} from "../src/types";
import {GameRulesConfig} from "../src/components/GameRules";


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

