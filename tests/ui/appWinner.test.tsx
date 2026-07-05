// @vitest-environment jsdom
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

const winCounts = (): Record<string, number> => JSON.parse(localStorage.getItem('playerWinCounts') ?? '{}');

/** Fills the round form and submits it. */
const playRound = async (user: ReturnType<typeof userEvent.setup>, aliceScore: string, bohdanScore: string) => {
  const inputs = screen.getAllByLabelText(/Рахунок для/);
  // When no winner is shown, RoundForm inputs are the empty ones (edit inputs are prefilled)
  const alice = inputs.find((i) => (i as HTMLInputElement).value === '' && i.getAttribute('aria-label')?.includes('Аліса'));
  const bohdan = inputs.find((i) => (i as HTMLInputElement).value === '' && i.getAttribute('aria-label')?.includes('Богдан'));
  await user.type(alice as HTMLElement, aliceScore);
  await user.type(bohdan as HTMLElement, bohdanScore);
  await user.click(screen.getByRole('button', { name: '✅ Додати раунд' }));
};

/** Opens the history editor for round 1 and replaces Аліса's score. */
const editRoundOneAlice = async (user: ReturnType<typeof userEvent.setup>, newScore: string) => {
  await user.click(screen.getByRole('button', { name: 'Редагувати' }));
  const editInput = screen
    .getAllByLabelText('Рахунок для Аліса')
    .find((i) => (i as HTMLInputElement).value !== '') as HTMLElement;
  await user.clear(editInput);
  await user.type(editInput, newScore);
  await user.click(screen.getByRole('button', { name: 'Зберегти' }));
};

describe('App — winner winCount transitions (regression)', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(cleanup);

  it('increments winCount once, reverts it when the win is edited away, and does not double-count on re-win', async () => {
    const user = userEvent.setup();
    render(<App />);

    // Setup: 2 players, target 510
    await user.click(screen.getByRole('button', { name: '510 — швидка' }));
    await user.type(screen.getByPlaceholderText('Гравець 1'), 'Аліса');
    await user.type(screen.getByPlaceholderText('Гравець 2'), 'Богдан');
    await user.click(screen.getByRole('button', { name: '🎴 Почати гру' }));

    // Round 1: Аліса reaches the target and wins
    await playRound(user, '510', '20');
    expect(await screen.findByText('ПЕРЕМОЖЕЦЬ')).toBeTruthy();
    expect(winCounts()['аліса']).toBe(1);

    // Open history (needed for editing)
    await user.click(screen.getByRole('button', { name: 'Показати або сховати історію раундів' }));

    // Edit the winning round below the target — winner must be reverted
    await editRoundOneAlice(user, '100');
    await waitFor(() => expect(screen.queryByText('ПЕРЕМОЖЕЦЬ')).toBeNull());
    expect(winCounts()['аліса']).toBe(0);

    // Edit it back above the target — winner returns, but the count must be 1, not 2
    await editRoundOneAlice(user, '520');
    expect(await screen.findByText('ПЕРЕМОЖЕЦЬ')).toBeTruthy();
    expect(winCounts()['аліса']).toBe(1);

    // Editing an unrelated value while the winner stays must NOT bump the count again
    await editRoundOneAlice(user, '530');
    expect(await screen.findByText('ПЕРЕМОЖЕЦЬ')).toBeTruthy();
    expect(winCounts()['аліса']).toBe(1);
  });

  it('starts a game with win counts restored by player name', async () => {
    localStorage.setItem('playerWinCounts', JSON.stringify({ 'аліса': 3 }));
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText('Гравець 1'), 'Аліса');
    await user.type(screen.getByPlaceholderText('Гравець 2'), 'Богдан');
    await user.click(screen.getByRole('button', { name: '🎴 Почати гру' }));

    // Win a quick game and confirm the count builds on the restored value
    await playRound(user, '1020', '0');
    expect(await screen.findByText('ПЕРЕМОЖЕЦЬ')).toBeTruthy();
    expect(winCounts()['аліса']).toBe(4);
  });
});
