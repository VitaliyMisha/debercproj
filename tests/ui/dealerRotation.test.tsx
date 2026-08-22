// @vitest-environment jsdom

import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../src/i18n';

vi.mock('../../src/config/firebase', () => ({ db: {} }));
vi.mock('firebase/database', () => ({
  ref: () => ({}),
  set: () => {},
  remove: () => {},
  onValue: () => () => {},
  onDisconnect: () => ({ remove: () => {}, cancel: () => {} }),
}));

import App from '../../src/App';

// jsdom does not implement scrollIntoView (used by RoundTimeline)
Element.prototype.scrollIntoView = vi.fn();

const NAMES = ['Аліса', 'Богдан', 'Ірина', 'Дмитро'];

/** Sets up a fresh 4-player, 510-target game with the fixture names above. */
const setupFourPlayerGame = async (user: ReturnType<typeof userEvent.setup>) => {
  render(<App />);
  await user.click(screen.getByRole('button', { name: '4 гравці' }));
  await user.click(screen.getByRole('button', { name: '510 — швидка' }));
  for (let i = 0; i < NAMES.length; i++) {
    await user.type(screen.getByPlaceholderText(`Гравець ${i + 1}`), NAMES[i]);
  }
  await user.click(screen.getByRole('button', { name: '🎴 Почати гру' }));
};

/** Fills every player's score input for the current round and submits it. */
const playRoundFor = async (user: ReturnType<typeof userEvent.setup>, scores: string[]) => {
  for (let i = 0; i < NAMES.length; i++) {
    const inputs = screen.getAllByLabelText(/Рахунок для/);
    const input = inputs.find(
      (el) => (el as HTMLInputElement).value === '' && el.getAttribute('aria-label')?.includes(NAMES[i])
    ) as HTMLElement;
    await user.type(input, scores[i]);
  }
  await user.click(screen.getByRole('button', { name: '✅ Додати раунд' }));
};

const openHistory = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('button', { name: 'Показати або сховати історію раундів' }));
};

/** Reads the "Д: <name>" badge shown in the history row for the given round number. */
const dealerOfRound = (roundNumber: number): string => {
  const header = screen.getByText(`Раунд ${roundNumber}`).closest('div') as HTMLElement;
  return within(header).getByText(/^Д: /).textContent ?? '';
};

describe('Dealer rotation (regression)', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(cleanup);

  it('wraps around to the first player after the last player deals (4 players)', async () => {
    const user = userEvent.setup();
    await setupFourPlayerGame(user);

    for (let i = 0; i < 5; i++) {
      await playRoundFor(user, ['10', '10', '10', '10']);
    }

    await openHistory(user);
    expect(dealerOfRound(1)).toBe('Д: Аліса');
    expect(dealerOfRound(2)).toBe('Д: Богдан');
    expect(dealerOfRound(3)).toBe('Д: Ірина');
    expect(dealerOfRound(4)).toBe('Д: Дмитро');
    expect(dealerOfRound(5)).toBe('Д: Аліса'); // wrap-around: (3 + 1) % 4 === 0
  });

  it('undo restores the dealer that was active for the removed round', async () => {
    const user = userEvent.setup();
    await setupFourPlayerGame(user);

    await playRoundFor(user, ['10', '10', '10', '10']); // round 1, dealer Аліса
    await playRoundFor(user, ['10', '10', '10', '10']); // round 2, dealer Богдан

    await openHistory(user);
    await user.click(screen.getByRole('button', { name: 'Скасувати останній раунд' }));
    await user.click(screen.getByRole('button', { name: 'Скасувати раунд' }));

    // Re-play round 2: dealer must be Богдан again, proving undo restored the
    // pre-round-2 dealer rather than leaving the post-round-1 rotation in place.
    await playRoundFor(user, ['20', '20', '20', '20']);
    expect(dealerOfRound(2)).toBe('Д: Богдан');
  });
});
