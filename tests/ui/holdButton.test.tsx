// @vitest-environment jsdom

import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import '../../src/i18n';
import { HOLD_MS, HoldButton } from '../../src/components/HoldButton';

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

const setup = () => {
  const onComplete = vi.fn();
  render(<HoldButton label="Нова гра" ariaLabel="Нова гра" onComplete={onComplete} />);
  return { onComplete, btn: screen.getByRole('button', { name: 'Нова гра' }) };
};

describe('HoldButton', () => {
  it('fires onComplete only after the full hold', () => {
    const { onComplete, btn } = setup();
    fireEvent.pointerDown(btn);
    act(() => vi.advanceTimersByTime(HOLD_MS - 50));
    expect(onComplete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(50));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('an early release cancels and shows the hold hint', () => {
    const { onComplete, btn } = setup();
    fireEvent.pointerDown(btn);
    act(() => vi.advanceTimersByTime(300));
    fireEvent.pointerUp(btn);
    act(() => vi.advanceTimersByTime(HOLD_MS));
    expect(onComplete).not.toHaveBeenCalled();
    expect(btn.textContent).toContain('Утримуйте');
  });

  it('sliding the finger off the button cancels', () => {
    const { onComplete, btn } = setup();
    fireEvent.pointerDown(btn);
    fireEvent.pointerLeave(btn);
    act(() => vi.advanceTimersByTime(HOLD_MS));
    expect(onComplete).not.toHaveBeenCalled();
  });

  it('holding Enter works from the keyboard; key repeat does not restart the hold', () => {
    const { onComplete, btn } = setup();
    fireEvent.keyDown(btn, { key: 'Enter' });
    act(() => vi.advanceTimersByTime(HOLD_MS / 2));
    fireEvent.keyDown(btn, { key: 'Enter', repeat: true });
    act(() => vi.advanceTimersByTime(HOLD_MS / 2));
    expect(onComplete).toHaveBeenCalledTimes(1);
  });

  it('assistive-tech activation (click with detail 0) confirms immediately', () => {
    const { onComplete, btn } = setup();
    fireEvent.click(btn, { detail: 0 });
    expect(onComplete).toHaveBeenCalledTimes(1);
  });
});
