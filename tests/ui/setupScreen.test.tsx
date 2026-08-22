// @vitest-environment jsdom

import { cleanup, render, screen } from '@testing-library/react';
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

const startButton = () => screen.getByRole('button', { name: '🎴 Почати гру' }) as HTMLButtonElement;

describe('SetupScreen — duplicate player names', () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(cleanup);

  it('blocks start and shows a warning on an exact duplicate name', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText('Гравець 1'), 'Іван');
    await user.type(screen.getByPlaceholderText('Гравець 2'), 'Іван');

    expect(startButton().disabled).toBe(true);
    expect(screen.getByText('Імена гравців мають бути унікальними')).toBeTruthy();
  });

  it('blocks start on a case- and whitespace-insensitive duplicate', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText('Гравець 1'), ' іван ');
    await user.type(screen.getByPlaceholderText('Гравець 2'), 'ІВАН');

    expect(startButton().disabled).toBe(true);
  });

  it('unblocks start once the duplicate name is fixed', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByPlaceholderText('Гравець 1'), 'Іван');
    await user.type(screen.getByPlaceholderText('Гравець 2'), 'Іван');
    expect(startButton().disabled).toBe(true);

    await user.type(screen.getByPlaceholderText('Гравець 2'), '2');
    expect(startButton().disabled).toBe(false);
    expect(screen.queryByText('Імена гравців мають бути унікальними')).toBeNull();
  });

  it('does not warn while names are simply empty (not yet a duplicate)', async () => {
    render(<App />);
    expect(startButton().disabled).toBe(true);
    expect(screen.queryByText('Імена гравців мають бути унікальними')).toBeNull();
  });
});
