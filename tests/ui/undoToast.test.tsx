// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../src/i18n';
import { UNDO_TOAST_MS, UndoToast } from '../../src/components/UndoToast';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('UndoToast', () => {
  it('announces the round and counts the seconds down', () => {
    render(<UndoToast roundNumber={3} onUndo={vi.fn()} onExpire={vi.fn()} />);
    expect(screen.getByRole('status').textContent).toContain('Раунд 3 додано');
    expect(screen.getByLabelText('5')).toBeTruthy();
    act(() => vi.advanceTimersByTime(1000));
    expect(screen.getByLabelText('4')).toBeTruthy();
  });

  it('undo button calls onUndo', () => {
    const onUndo = vi.fn();
    render(<UndoToast roundNumber={3} onUndo={onUndo} onExpire={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: 'Скасувати додавання раунду 3' }));
    expect(onUndo).toHaveBeenCalledTimes(1);
  });

  it('expires after the countdown', () => {
    const onExpire = vi.fn();
    render(<UndoToast roundNumber={3} onUndo={vi.fn()} onExpire={onExpire} />);
    act(() => vi.advanceTimersByTime(UNDO_TOAST_MS - 1));
    expect(onExpire).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(1));
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
