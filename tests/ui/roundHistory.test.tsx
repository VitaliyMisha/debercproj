// @vitest-environment jsdom
import { describe, it, expect, afterEach, vi } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '../../src/i18n';
import RoundHistory from '../../src/components/RoundHistory';
import { DEFAULT_GAME_RULES } from '../../src/utils/gameHelpers';
import type { Player, Round } from '../../src/types';

const players: Player[] = [
  { id: 1, name: 'Аліса', winCount: 0 },
  { id: 2, name: 'Богдан', winCount: 0 },
];

const rounds: Round[] = [{ id: 1, number: 1, scores: { '1': 120, '2': 80 }, dealerId: 1 }];

afterEach(cleanup);

const openEditor = async (onUpdateRound = vi.fn()) => {
  const user = userEvent.setup();
  render(
    <RoundHistory rounds={rounds} players={players} onUpdateRound={onUpdateRound} gameRules={DEFAULT_GAME_RULES} />,
  );
  await user.click(screen.getByRole('button', { name: 'Показати або сховати історію раундів' }));
  await user.click(screen.getByRole('button', { name: 'Редагувати' }));
  return { user, onUpdateRound };
};

describe('RoundHistory — inline edit validation', () => {
  it('disables Save and shows a hint when two players get Б', async () => {
    const { user } = await openEditor();
    const inputs = screen.getAllByLabelText(/Рахунок для/);
    await user.clear(inputs[0]);
    await user.type(inputs[0], 'Б');
    await user.clear(inputs[1]);
    await user.type(inputs[1], 'Б');

    expect(screen.getByText('Лише один гравець може отримати Б за раунд.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Зберегти' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('disables Save when two players play ВіС', async () => {
    const { user } = await openEditor();
    const inputs = screen.getAllByLabelText(/Рахунок для/);
    await user.clear(inputs[0]);
    await user.type(inputs[0], 'ВІС');
    await user.clear(inputs[1]);
    await user.type(inputs[1], 'віс');

    expect(screen.getByText('Лише один гравець може грати ВіС за раунд.')).toBeTruthy();
    expect((screen.getByRole('button', { name: 'Зберегти' }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('keeps the editor open when onUpdateRound returns false', async () => {
    const onUpdateRound = vi.fn(() => false);
    const { user } = await openEditor(onUpdateRound);
    await user.click(screen.getByRole('button', { name: 'Зберегти' }));

    expect(onUpdateRound).toHaveBeenCalledWith(1, { '1': '120', '2': '80' });
    expect(screen.getByRole('button', { name: 'Зберегти' })).toBeTruthy(); // editor still open
  });

  it('closes the editor and passes edited scores when onUpdateRound succeeds', async () => {
    const onUpdateRound = vi.fn(() => true);
    const { user } = await openEditor(onUpdateRound);
    const inputs = screen.getAllByLabelText(/Рахунок для/);
    await user.clear(inputs[0]);
    await user.type(inputs[0], '200');
    await user.click(screen.getByRole('button', { name: 'Зберегти' }));

    expect(onUpdateRound).toHaveBeenCalledWith(1, { '1': '200', '2': '80' });
    expect(screen.queryByRole('button', { name: 'Зберегти' })).toBeNull(); // editor closed
  });

  it('hides undo and edit controls in readOnly (spectator) mode', async () => {
    const user = userEvent.setup();
    render(
      <RoundHistory rounds={rounds} players={players} onUpdateRound={vi.fn()} gameRules={DEFAULT_GAME_RULES} readOnly onUndoLastRound={vi.fn()} />,
    );
    await user.click(screen.getByRole('button', { name: 'Показати або сховати історію раундів' }));
    expect(screen.queryByRole('button', { name: 'Редагувати' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Скасувати останній раунд' })).toBeNull();
  });
});
