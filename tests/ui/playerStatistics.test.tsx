// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import '../../src/i18n';
import PlayerStatistics from '../../src/components/PlayerStatistics';
import type { Game, Player } from '../../src/types';
import { DEFAULT_GAME_RULES } from '../../src/utils/gameHelpers';

afterEach(cleanup);

const players: Player[] = [
  { id: 1, name: 'Аліса', winCount: 0 },
  { id: 2, name: 'Богдан', winCount: 0 },
];

/** Value cell next to a token label (Б / ХВ) in the tokens row. */
const tokenCount = (label: string) => screen.getByText(label, { selector: 'span' }).nextElementSibling?.textContent;

describe('PlayerStatistics — Б vs ХВ', () => {
  it('counts Б → ХВ → Б as two Б and one ХВ (2nd Б and ХВ share the same penalty number)', () => {
    const game: Game = {
      id: 1,
      createdAt: '2026-11-05',
      players,
      dealerId: 1,
      rounds: [
        { id: 1, number: 1, scores: { '1': 'Б', '2': 80 }, tokens: { '1': 'Б' } },
        { id: 2, number: 2, scores: { '1': -100, '2': 60 }, tokens: { '1': 'ХВ' } },
        { id: 3, number: 3, scores: { '1': -100, '2': 40 }, tokens: { '1': 'Б' } },
      ],
    };
    render(<PlayerStatistics game={game} players={players} gameRules={DEFAULT_GAME_RULES} />);
    expect(tokenCount('Б')).toBe('2');
    expect(tokenCount('ХВ')).toBe('1');
  });
});
