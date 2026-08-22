import { describe, expect, it } from 'vitest';
import type { Game, GameRulesConfig, Player } from '../src/types';
import {
  bestOpponent,
  calculateGameTotals,
  findWinner,
  generateUniqueId,
  getVisDisplayValue,
  isValidScore,
  parseScore,
  validateRoundTokens,
  winStreak,
} from '../src/utils/gameHelpers';

// ─── Fixtures ────────────────────────────────────────────────────────────────

const rules: GameRulesConfig = {
  secondBPenalty: -100,
  hvPenalty: -100,
  allowVis: true,
  customTargetScore: false,
  targetScoreOptions: [510, 1020],
};

const strictRules: GameRulesConfig = { ...rules, allowVis: false };
const customRules: GameRulesConfig = { ...rules, hvPenalty: -50, secondBPenalty: -200 };

const p1: Player = { id: 1, name: 'Alice', winCount: 0 };
const p2: Player = { id: 2, name: 'Bob', winCount: 0 };
const p3: Player = { id: 3, name: 'Carol', winCount: 0 };

const game = (rounds: Game['rounds'], players = [p1, p2]): Game => ({
  id: 1,
  createdAt: '2026-01-01T00:00:00Z',
  players,
  rounds,
  dealerId: 1,
});

const round = (id: number, scores: Game['rounds'][number]['scores']): Game['rounds'][number] => ({
  id,
  number: id,
  scores,
  dealerId: 1,
});

// ─── isValidScore ─────────────────────────────────────────────────────────────

describe('isValidScore', () => {
  describe('valid inputs', () => {
    it('accepts zero', () => expect(isValidScore('0', rules)).toBe(true));
    it('accepts positive integers', () => {
      expect(isValidScore('1', rules)).toBe(true);
      expect(isValidScore('50', rules)).toBe(true);
      expect(isValidScore('1000', rules)).toBe(true);
    });
    it('accepts negative integers', () => {
      expect(isValidScore('-1', rules)).toBe(true);
      expect(isValidScore('-20', rules)).toBe(true);
      expect(isValidScore('-100', rules)).toBe(true);
    });
    it('accepts number type', () => expect(isValidScore(42, rules)).toBe(true));
    it('accepts tokens Б, ХВ, ВІС', () => {
      expect(isValidScore('Б', rules)).toBe(true);
      expect(isValidScore('ХВ', rules)).toBe(true);
      expect(isValidScore('ВІС', rules)).toBe(true);
    });
    it('accepts lowercase tokens', () => {
      expect(isValidScore('б', rules)).toBe(true);
      expect(isValidScore('хв', rules)).toBe(true);
      expect(isValidScore('віс', rules)).toBe(true);
    });
    it('trims surrounding whitespace', () => {
      expect(isValidScore('  50  ', rules)).toBe(true);
      expect(isValidScore('  Б  ', rules)).toBe(true);
    });
  });

  describe('invalid inputs', () => {
    it('rejects empty string', () => expect(isValidScore('', rules)).toBe(false));
    it('rejects random text', () => expect(isValidScore('abc', rules)).toBe(false));
    it('rejects special chars', () => expect(isValidScore('?!', rules)).toBe(false));
    it('rejects floats', () => expect(isValidScore('50.5', rules)).toBe(false));
    it('rejects scientific notation', () => expect(isValidScore('1e5', rules)).toBe(false));
    it('rejects lone minus sign', () => expect(isValidScore('-', rules)).toBe(false));
    it('rejects ВіС when allowVis is false', () => expect(isValidScore('ВІС', strictRules)).toBe(false));
    it('rejects lowercase ВіС when allowVis is false', () => expect(isValidScore('віс', strictRules)).toBe(false));
  });
});

// ─── parseScore ──────────────────────────────────────────────────────────────

describe('parseScore', () => {
  describe('numeric values', () => {
    it('parses positive integer string', () => expect(parseScore('150', '1', [], rules)).toBe(150));
    it('parses negative integer string', () => expect(parseScore('-20', '1', [], rules)).toBe(-20));
    it('parses zero', () => expect(parseScore('0', '1', [], rules)).toBe(0));
    it('returns number type as-is', () => expect(parseScore(99, '1', [], rules)).toBe(99));
    it('returns 0 for unrecognised string', () => expect(parseScore('xyz', '1', [], rules)).toBe(0));
  });

  describe('ХВ token', () => {
    it('returns hvPenalty', () => expect(parseScore('ХВ', '1', [], rules)).toBe(-100));
    it('handles lowercase хв', () => expect(parseScore('  хв  ', '1', [], rules)).toBe(-100));
    it('uses custom hvPenalty', () => expect(parseScore('ХВ', '1', [], customRules)).toBe(-50));
  });

  describe('Б token', () => {
    it('returns Б string on first occurrence', () => expect(parseScore('Б', '1', [], rules)).toBe('Б'));
    it('handles lowercase б', () => expect(parseScore('б', '1', [], rules)).toBe('Б'));
    it('returns secondBPenalty on second Б', () => {
      const prevRounds = [round(1, { '1': 'Б', '2': 50 })];
      expect(parseScore('Б', '1', prevRounds, rules)).toBe(-100);
    });
    it('uses custom secondBPenalty', () => {
      const prevRounds = [round(1, { '1': 'Б', '2': 50 })];
      expect(parseScore('Б', '1', prevRounds, customRules)).toBe(-200);
    });
    it('first Б is not penalised even if other players had Б', () => {
      const prevRounds = [round(1, { '1': 50, '2': 'Б' })];
      expect(parseScore('Б', '1', prevRounds, rules)).toBe('Б');
    });
    it('returns secondBPenalty on third Б', () => {
      const prevRounds = [
        round(1, { '1': 'Б', '2': 50 }), // 1st Б stored as string
        round(2, { '1': -100, '2': 50 }), // 2nd Б stored as penalty number
      ];
      expect(parseScore('Б', '1', prevRounds, rules)).toBe(-100);
    });
  });

  describe('ВіС token', () => {
    it('returns ВіС string when allowed', () => expect(parseScore('ВІС', '1', [], rules)).toBe('ВІС'));
    it('returns 0 when allowVis is false', () => expect(parseScore('ВІС', '1', [], strictRules)).toBe(0));
  });
});

// ─── calculateGameTotals ─────────────────────────────────────────────────────

describe('calculateGameTotals', () => {
  describe('basic scoring', () => {
    it('returns zeros for empty rounds', () => {
      const totals = calculateGameTotals(game([]), rules);
      expect(totals[1]).toBe(0);
      expect(totals[2]).toBe(0);
    });

    it('accumulates numeric scores across rounds', () => {
      const g = game([round(1, { '1': 100, '2': 200 }), round(2, { '1': 50, '2': 70 })]);
      const totals = calculateGameTotals(g, rules);
      expect(totals[1]).toBe(150);
      expect(totals[2]).toBe(270);
    });

    it('handles negative scores in rounds', () => {
      const g = game([round(1, { '1': -20, '2': 80 })]);
      const totals = calculateGameTotals(g, rules);
      expect(totals[1]).toBe(-20);
      expect(totals[2]).toBe(80);
    });

    it('accumulates negative scores over multiple rounds', () => {
      const g = game([round(1, { '1': -20, '2': 100 }), round(2, { '1': -30, '2': 50 })]);
      const totals = calculateGameTotals(g, rules);
      expect(totals[1]).toBe(-50);
      expect(totals[2]).toBe(150);
    });
  });

  describe('Б logic', () => {
    it('first Б contributes 0 to total', () => {
      const g = game([round(1, { '1': 'Б', '2': 80 })]);
      const totals = calculateGameTotals(g, rules);
      expect(totals[1]).toBe(0);
      expect(totals[2]).toBe(80);
    });

    it('second Б applies secondBPenalty', () => {
      const g = game([round(1, { '1': 'Б', '2': 50 }), round(2, { '1': 'Б', '2': 30 })]);
      const totals = calculateGameTotals(g, rules);
      expect(totals[1]).toBe(-100);
      expect(totals[2]).toBe(80);
    });

    it('uses custom secondBPenalty', () => {
      const g = game([round(1, { '1': 'Б', '2': 50 }), round(2, { '1': 'Б', '2': 30 })]);
      const totals = calculateGameTotals(g, customRules);
      expect(totals[1]).toBe(-200);
    });

    it('third Б also applies secondBPenalty', () => {
      const g = game([round(1, { '1': 'Б', '2': 10 }), round(2, { '1': 'Б', '2': 10 }), round(3, { '1': 'Б', '2': 10 })]);
      const totals = calculateGameTotals(g, rules);
      // 2nd Б: -100; 3rd Б: another -100
      expect(totals[1]).toBe(-200);
    });

    it('Б from one player does not affect another', () => {
      const g = game([round(1, { '1': 200, '2': 'Б' })]);
      const totals = calculateGameTotals(g, rules);
      expect(totals[1]).toBe(200);
      expect(totals[2]).toBe(0);
    });
  });

  describe('ХВ logic', () => {
    it('ХВ applies hvPenalty', () => {
      const g = game([round(1, { '1': 'ХВ', '2': 50 })]);
      const totals = calculateGameTotals(g, rules);
      expect(totals[1]).toBe(-100);
      expect(totals[2]).toBe(50);
    });

    it('multiple ХВ accumulate separately per player', () => {
      const g = game([round(1, { '1': 'ХВ', '2': 50 }), round(2, { '1': 'ХВ', '2': 30 })]);
      const totals = calculateGameTotals(g, rules);
      expect(totals[1]).toBe(-200);
    });

    it('uses custom hvPenalty', () => {
      const g = game([round(1, { '1': 'ХВ', '2': 50 })]);
      const totals = calculateGameTotals(g, customRules);
      expect(totals[1]).toBe(-50);
    });
  });

  describe('ВіС logic', () => {
    it('ВіС win: earns the hanging score in next round', () => {
      const g = game([round(1, { '1': 50, '2': 'ВІС' }), round(2, { '1': 40, '2': 60 })]);
      const totals = calculateGameTotals(g, rules);
      // p2 wins vis: earns hanging (50) + round2 score (60) = 110
      // p1: round1 (50) + round2 (40) = 90
      expect(totals[2]).toBe(110);
      expect(totals[1]).toBe(90);
    });

    it('ВіС loss: vis player gets Б, opponent earns hanging score', () => {
      const g = game([round(1, { '1': 100, '2': 'ВІС' }), round(2, { '1': 70, '2': 30 })]);
      const totals = calculateGameTotals(g, rules);
      // p2 loses vis: gets Б (first, no penalty), p1 earns hanging (100) as bonus
      // p1: 100 + 70 + 100 (bonus) = 270; p2: 0 (vis pending) + 30 = 30
      expect(totals[1]).toBe(270);
      expect(totals[2]).toBe(30);
    });

    it('ВіС loss triggers second Б penalty when player already had one Б', () => {
      const g = game([
        round(1, { '1': 'Б', '2': 50 }), // p1 first Б
        round(2, { '1': 'ВІС', '2': 30 }), // p1 plays ВіС, hanging = 30
        round(3, { '1': 40, '2': 50 }), // p1 loses vis (40 < 50) → 2nd Б
      ]);
      const totals = calculateGameTotals(g, rules);
      // p1: 0 (Б) + 0 (vis pending) + 40 (round3) - 100 (2nd Б penalty) = -60
      // p2: 50 + 30 + 50 + 30 (bonus) = 160
      expect(totals[1]).toBe(-60);
      expect(totals[2]).toBe(160);
    });

    it('ВіС tie carry-forward then win: tie-round scores are counted', () => {
      const g = game([
        round(1, { '1': 50, '2': 'ВІС' }), // hanging = 50
        round(2, { '1': 60, '2': 60 }), // tie → carry forward; both scores counted
        round(3, { '1': 40, '2': 80 }), // p2 wins (80 > 40)
      ]);
      const totals = calculateGameTotals(g, rules);
      // p2: 0 (vis) + 60 (tie, counted) + 80 (win) + 50 (hanging) = 190
      // p1: 50 + 60 + 40 = 150
      expect(totals[2]).toBe(190);
      expect(totals[1]).toBe(150);
    });

    it('ВіС tie carry-forward then loss: vis player gets Б, opponent gets hanging', () => {
      const g = game([
        round(1, { '1': 50, '2': 'ВІС' }), // hanging = 50
        round(2, { '1': 60, '2': 60 }), // tie → carry forward; both scores counted
        round(3, { '1': 90, '2': 30 }), // p2 loses (30 < 90) → 1st Б, p1 gets hanging
      ]);
      const totals = calculateGameTotals(g, rules);
      // p2: 0 (vis) + 60 (tie) + 30 (loss) = 90; 1st Б, no penalty
      // p1: 50 + 60 + 90 + 50 (hanging) = 250
      expect(totals[2]).toBe(90);
      expect(totals[1]).toBe(250);
    });

    it('ВіС loss as 3rd Б applies another penalty', () => {
      const g = game([
        round(1, { '1': 'Б', '2': 50 }), // p1 1st Б
        round(2, { '1': 'Б', '2': 50 }), // p1 2nd Б → -100
        round(3, { '1': 'ВІС', '2': 30 }), // p1 plays ВіС, hanging = 30
        round(4, { '1': 10, '2': 50 }), // p1 loses vis (10 < 50) → 3rd Б → -100 again
      ]);
      const totals = calculateGameTotals(g, rules);
      // p1: 0 + (-100) + 0(vis) + 10 + (-100)(3rd Б) = -190
      // p2: 50 + 50 + 30 + 50 + 30(hanging) = 210
      expect(totals[1]).toBe(-190);
      expect(totals[2]).toBe(210);
    });

    it('ВіС with all non-numeric opponent scores: hangingScore is 0', () => {
      const g = game([
        round(1, { '1': 'Б', '2': 'ВІС' }), // both non-numeric → hangingScore = 0
        round(2, { '1': 30, '2': 50 }), // p2 wins vis (50 > 30)
      ]);
      const totals = calculateGameTotals(g, rules);
      // hanging = max(0, 0) = 0; p2 wins: earns 0 bonus + 50 round score
      // p1: 0 (Б) + 30 = 30; p2: 0 (vis) + 50 + 0(hanging) = 50
      expect(totals[2]).toBe(50);
      expect(totals[1]).toBe(30);
    });

    it('ВіС treated as 0 when allowVis is false', () => {
      const g = game([round(1, { '1': 'ВІС', '2': 50 }), round(2, { '1': 80, '2': 40 })]);
      const totals = calculateGameTotals(g, strictRules);
      // p1 ВіС stored but not pushed to pendingVis → contributes 0
      expect(totals[1]).toBe(80);
      expect(totals[2]).toBe(90);
    });

    it('3 players: ВіС loss bonus goes to player with best current-round score', () => {
      const g = game(
        [
          round(1, { '1': 'ВІС', '2': 40, '3': 20 }), // hanging = 40
          round(2, { '1': 30, '2': 25, '3': 50 }), // p3 best opponent (50 > 30)
        ],
        [p1, p2, p3]
      );
      const totals = calculateGameTotals(g, rules);
      // p1 loses vis: p3 gets hanging (40) bonus
      // p1: 0 (vis) + 30 = 30; p2: 40 + 25 = 65; p3: 20 + 50 + 40 = 110
      expect(totals[1]).toBe(30);
      expect(totals[2]).toBe(65);
      expect(totals[3]).toBe(110);
    });

    it('ВіС win hanging score is max of numeric scores in vis round', () => {
      // If vis round has another player with a high score, that is the prize
      const g = game([round(1, { '1': 300, '2': 'ВІС' }), round(2, { '1': 100, '2': 200 })]);
      const totals = calculateGameTotals(g, rules);
      // hanging = 300; p2 wins (200 > 100): earns 300 + 200 = 500
      expect(totals[2]).toBe(500);
      expect(totals[1]).toBe(400);
    });

    it('two independent pending ВіС can coexist when the 2nd ВіС ties the 1st mid-resolution', () => {
      const g = game([
        round(1, { '1': 'ВІС', '2': 20 }), // pending #1, hangingScore = 20
        round(2, { '1': 'ВІС', '2': 'Б' }), // p2's Б counts as 0, ties pending #1 (0=0) → carries forward; p1's ВіС here opens pending #2, hangingScore = 0
        round(3, { '1': 5, '2': 3 }), // resolves BOTH pending vis using the same round data (5 > 3): both win
      ]);
      const totals = calculateGameTotals(g, rules);
      // p1: 0 (vis #1) + 0 (vis #2) + 5 (own, r3) + 20 (pending#1 bonus) + 0 (pending#2 bonus) = 25
      // p2: 20 (r1) + 0 (Б, r2, 1st Б no penalty) + 3 (own, r3) = 23
      expect(totals[1]).toBe(25);
      expect(totals[2]).toBe(23);
    });

    it('Б entered in the round that resolves a pending ВіС counts as two separate Б-events (penalties stack)', () => {
      const g = game([
        round(1, { '1': 'Б', '2': 0 }), // p1's 1st Б
        round(2, { '1': 40, '2': 0 }),
        round(3, { '1': 'ВІС', '2': 20 }), // pending, hangingScore = 20
        round(4, { '1': 'Б', '2': 50 }), // p1's own Б (2nd real Б-event) AND it resolves the vis as a loss (0 < 50, 3rd Б-event)
      ]);
      const totals = calculateGameTotals(g, rules);
      // p1: 0 (Б, r1) + 40 (r2) + 0 (ВіС pending, r3) + 0 (own Б contributes 0, r4)
      //     - 100 (vis-loss penalty, 2nd Б-event) - 100 (own Б penalty, 3rd Б-event) = -160
      // p2: 0 (r1) + 0 (r2) + 20 (r3) + 50 (r4) + 20 (hanging bonus from vis loss) = 90
      expect(totals[1]).toBe(-160);
      expect(totals[2]).toBe(90);
    });

    it('non-numeric token in a ВіС-resolution round wins when the opponent scores negative', () => {
      const g = game([
        round(1, { '1': 'Б', '2': 20 }), // p1's 1st Б
        round(2, { '1': 'ВІС', '2': 30 }), // pending, hangingScore = 30
        round(3, { '1': 'Б', '2': -10 }), // p1 enters Б (2nd Б-event); vis compares 0 > -10 → WIN
      ]);
      const totals = calculateGameTotals(g, rules);
      // p1: 0 (Б, r1) + 0 (ВіС pending, r2) + 30 (hanging bonus, vis win) + 0 (own Б, r3)
      //     - 100 (2nd Б penalty, own Б entered r3) = -70
      // p2: 20 (r1) + 30 (r2) - 10 (r3) = 40
      expect(totals[1]).toBe(-70);
      expect(totals[2]).toBe(40);
    });
  });

  describe('mixed scenarios', () => {
    it('combines Б + ХВ correctly', () => {
      const g = game([round(1, { '1': 'Б', '2': 100 }), round(2, { '1': 'ХВ', '2': 80 })]);
      const totals = calculateGameTotals(g, rules);
      expect(totals[1]).toBe(-100); // 0 (Б) + (-100) (ХВ)
      expect(totals[2]).toBe(180);
    });

    it('player with all-zero rounds stays at 0', () => {
      const g = game([round(1, { '1': 0, '2': 50 }), round(2, { '1': 0, '2': 70 })]);
      const totals = calculateGameTotals(g, rules);
      expect(totals[1]).toBe(0);
    });

    it('three players — independent score tracking', () => {
      const g = game([round(1, { '1': 100, '2': 200, '3': 50 }), round(2, { '1': 50, '2': 100, '3': 150 })], [p1, p2, p3]);
      const totals = calculateGameTotals(g, rules);
      expect(totals[1]).toBe(150);
      expect(totals[2]).toBe(300);
      expect(totals[3]).toBe(200);
    });
  });
});

// ─── getVisDisplayValue ───────────────────────────────────────────────────────

describe('getVisDisplayValue', () => {
  it('returns raw value when score is not ВіС', () => {
    const rounds = [round(1, { '1': 150, '2': 80 })];
    expect(getVisDisplayValue(0, 1, rounds, rules)).toBe(150);
  });

  it('returns Б raw value unchanged', () => {
    const rounds = [round(1, { '1': 'Б', '2': 80 })];
    expect(getVisDisplayValue(0, 1, rounds, rules)).toBe('Б');
  });

  it('returns ВіС when allowVis is false', () => {
    // In practice this shouldn't be stored, but handles defensive case
    const rounds = [round(1, { '1': 'ВіС', '2': 80 })];
    expect(getVisDisplayValue(0, 1, rounds, strictRules)).toBe(0);
  });

  it('returns ВіС when no next round (still pending)', () => {
    const rounds = [round(1, { '1': 'ВіС', '2': 80 })];
    expect(getVisDisplayValue(0, 1, rounds, rules)).toBe('ВіС');
  });

  it('returns ВіС when vis player wins resolution round', () => {
    const rounds = [
      round(1, { '1': 'ВіС', '2': 80 }),
      round(2, { '1': 100, '2': 60 }), // p1 wins (100 > 60)
    ];
    expect(getVisDisplayValue(0, 1, rounds, rules)).toBe('ВіС');
  });

  it('returns Б when vis player loses (first Б)', () => {
    const rounds = [
      round(1, { '1': 'ВіС', '2': 80 }),
      round(2, { '1': 50, '2': 90 }), // p1 loses (50 < 90)
    ];
    expect(getVisDisplayValue(0, 1, rounds, rules)).toBe('Б');
  });

  it('returns secondBPenalty when vis loss is second Б (had regular Б before)', () => {
    const rounds = [
      round(1, { '1': 'Б', '2': 50 }), // p1 first Б
      round(2, { '1': 'ВіС', '2': 30 }), // p1 plays ВіС
      round(3, { '1': 40, '2': 50 }), // p1 loses vis → 2nd Б
    ];
    expect(getVisDisplayValue(1, 1, rounds, rules)).toBe(-100);
  });

  it('returns secondBPenalty with custom value', () => {
    const rounds = [round(1, { '1': 'Б', '2': 50 }), round(2, { '1': 'ВіС', '2': 30 }), round(3, { '1': 40, '2': 50 })];
    expect(getVisDisplayValue(1, 1, rounds, customRules)).toBe(-200);
  });

  it('returns ВіС when tie (carry-forward, no further round)', () => {
    const rounds = [
      round(1, { '1': 'ВіС', '2': 80 }),
      round(2, { '1': 60, '2': 60 }), // tie → carry forward
    ];
    // no resolution round after tie → still pending
    expect(getVisDisplayValue(0, 1, rounds, rules)).toBe('ВіС');
  });

  it('returns ВіС when tie then win', () => {
    const rounds = [
      round(1, { '1': 'ВіС', '2': 80 }),
      round(2, { '1': 60, '2': 60 }), // tie
      round(3, { '1': 90, '2': 50 }), // p1 wins (90 > 50)
    ];
    expect(getVisDisplayValue(0, 1, rounds, rules)).toBe('ВіС');
  });

  it('returns Б when tie then loss (first Б)', () => {
    const rounds = [
      round(1, { '1': 'ВіС', '2': 80 }),
      round(2, { '1': 60, '2': 60 }), // tie
      round(3, { '1': 40, '2': 90 }), // p1 loses (40 < 90)
    ];
    expect(getVisDisplayValue(0, 1, rounds, rules)).toBe('Б');
  });

  it('second ВіС loss counts previous ВіС loss as prior Б', () => {
    const rounds = [
      round(1, { '1': 'ВіС', '2': 50 }), // vis round 1 — hanging = 50
      round(2, { '1': 30, '2': 60 }), // p1 loses 1st ВіС → counts as 1st Б
      round(3, { '1': 'ВіС', '2': 50 }), // vis round 2
      round(4, { '1': 20, '2': 80 }), // p1 loses 2nd ВіС → should be 2nd Б = penalty
    ];
    expect(getVisDisplayValue(2, 1, rounds, rules)).toBe(-100);
  });

  it('handles uppercase ВІС token (production stored format) — loss', () => {
    const rounds = [
      round(1, { '1': 'ВІС', '2': 80 }), // uppercase І (U+0406) — actual stored format
      round(2, { '1': 50, '2': 90 }), // p1 loses (50 < 90)
    ];
    expect(getVisDisplayValue(0, 1, rounds, rules)).toBe('Б');
  });

  it('handles uppercase ВІС token (production stored format) — win', () => {
    const rounds = [
      round(1, { '1': 'ВІС', '2': 80 }), // uppercase І (U+0406)
      round(2, { '1': 100, '2': 40 }), // p1 wins (100 > 40)
    ];
    expect(getVisDisplayValue(0, 1, rounds, rules)).toBe('ВіС');
  });

  it('does not affect non-ВіС players in same round', () => {
    const rounds = [round(1, { '1': 'ВіС', '2': 80 }), round(2, { '1': 50, '2': 90 })];
    // p2's score in round 1 is 80 — not ВіС, returned as-is
    expect(getVisDisplayValue(0, 2, rounds, rules)).toBe(80);
  });
});

// ─── generateUniqueId ────────────────────────────────────────────────────────

describe('generateUniqueId', () => {
  it('returns a number', () => {
    expect(typeof generateUniqueId()).toBe('number');
  });

  it('two consecutive calls produce different values', () => {
    const a = generateUniqueId();
    const b = generateUniqueId();
    expect(a).not.toBe(b);
  });
});

// ─── parseScore — нульові штрафи (?? замість ||) ─────────────────────────────

describe('parseScore with zero penalties', () => {
  const zeroRules: GameRulesConfig = { ...rules, hvPenalty: 0, secondBPenalty: 0 };

  it('ХВ returns 0 when hvPenalty is configured as 0', () => {
    expect(parseScore('ХВ', '1', [], zeroRules)).toBe(0);
  });

  it('second Б returns 0 when secondBPenalty is configured as 0', () => {
    const prior = [round(1, { '1': 'Б', '2': 50 })];
    expect(parseScore('Б', '1', prior, zeroRules)).toBe(0);
  });
});

// ─── findWinner ──────────────────────────────────────────────────────────────

describe('findWinner', () => {
  it('returns null when nobody reached the target', () => {
    const g = game([round(1, { '1': 100, '2': 90 })]);
    expect(findWinner(g, rules, 510)).toBeNull();
  });

  it('returns the single player at or above target', () => {
    const g = game([round(1, { '1': 510, '2': 90 })]);
    expect(findWinner(g, rules, 510)).toBe(1);
  });

  it('returns null when two contenders tie at the max score', () => {
    const g = game([round(1, { '1': 520, '2': 520 })]);
    expect(findWinner(g, rules, 510)).toBeNull();
  });

  it('returns the highest of several contenders', () => {
    const g = game([round(1, { '1': 520, '2': 530 })]);
    expect(findWinner(g, rules, 510)).toBe(2);
  });
});

// ─── validateRoundTokens ─────────────────────────────────────────────────────

describe('validateRoundTokens', () => {
  it('returns null for a valid round', () => {
    expect(validateRoundTokens({ '1': '120', '2': 'Б' })).toBeNull();
  });

  it("returns 'oneB' when two players have Б", () => {
    expect(validateRoundTokens({ '1': 'Б', '2': 'Б' })).toBe('oneB');
  });

  it("returns 'oneVis' when two players have ВіС", () => {
    expect(validateRoundTokens({ '1': 'ВІС', '2': 'віс' })).toBe('oneVis');
  });

  it('normalises case and whitespace', () => {
    expect(validateRoundTokens({ '1': ' б ', '2': 'Б' })).toBe('oneB');
  });

  it('allows one Б and one ВіС in the same round', () => {
    expect(validateRoundTokens({ '1': 'Б', '2': 'ВІС', '3': '50' })).toBeNull();
  });
});

// ─── bestOpponent ────────────────────────────────────────────────────────────

describe('bestOpponent', () => {
  it('returns the highest-scoring opponent with their id', () => {
    expect(bestOpponent({ '1': 50, '2': 90, '3': 70 }, 1)).toEqual({ playerId: 2, score: 90 });
  });

  it('treats token scores (Б/ХВ/ВіС) as 0', () => {
    expect(bestOpponent({ '1': 50, '2': 'Б', '3': 'ВІС' }, 1)).toEqual({ playerId: 2, score: 0 });
  });

  it('ignores the own score even if it is the highest', () => {
    expect(bestOpponent({ '1': 999, '2': 10 }, 1)).toEqual({ playerId: 2, score: 10 });
  });
});

// ─── winStreak ───────────────────────────────────────────────────────────────

describe('winStreak', () => {
  it('returns 0 for no rounds', () => {
    expect(winStreak([], 1)).toBe(0);
  });

  it('counts consecutive round wins from the latest round backwards', () => {
    const rounds = [
      round(1, { '1': 10, '2': 90 }), // loss
      round(2, { '1': 80, '2': 40 }), // win
      round(3, { '1': 120, '2': 60 }), // win
      round(4, { '1': 70, '2': 30 }), // win
    ];
    expect(winStreak(rounds, 1)).toBe(3);
    expect(winStreak(rounds, 2)).toBe(0);
  });

  it('breaks the streak on a tie', () => {
    const rounds = [
      round(1, { '1': 80, '2': 40 }),
      round(2, { '1': 50, '2': 50 }), // tie — not a win
      round(3, { '1': 90, '2': 10 }),
    ];
    expect(winStreak(rounds, 1)).toBe(1);
  });

  it('treats token scores (Б/ХВ/ВіС) as 0', () => {
    const rounds = [
      round(1, { '1': 50, '2': 'Б' }), // 50 > 0 — win
      round(2, { '1': 30, '2': 'ВІС' }), // 30 > 0 — win
    ];
    expect(winStreak(rounds, 1)).toBe(2);
  });

  it('own token counts as 0 and usually breaks the streak', () => {
    const rounds = [
      round(1, { '1': 80, '2': 40 }),
      round(2, { '1': 'Б', '2': 40 }), // 0 < 40 — loss
    ];
    expect(winStreak(rounds, 1)).toBe(0);
  });
});
