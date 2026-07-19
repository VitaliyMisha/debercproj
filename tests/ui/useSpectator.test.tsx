// @vitest-environment jsdom

import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

type SnapshotCb = (snap: { exists: () => boolean; val: () => unknown }) => void;

const onValueMock = vi.fn((..._args: unknown[]) => vi.fn());

vi.mock('../../src/config/firebase', () => ({ db: {} }));
vi.mock('firebase/database', () => ({
  ref: (_db: unknown, path?: string) => ({ path }),
  onValue: (...args: unknown[]) => onValueMock(...args),
}));

import { useSpectator } from '../../src/hooks/useSpectator';

const emit = (data: unknown) => {
  const cb = onValueMock.mock.calls.at(-1)?.[1] as unknown as SnapshotCb;
  act(() => {
    cb({ exists: () => data !== null, val: () => data });
  });
};

const liveData = {
  game: { id: 7, createdAt: 'x', dealerId: 1 }, // no rounds/players — Firebase strips empty arrays
  targetScore: 510,
  winnerPlayer: null,
  gameRules: null,
};

describe('useSpectator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it('reports not_found without a watchId', () => {
    const { result } = renderHook(() => useSpectator(null));
    expect(result.current.status).toBe('not_found');
    expect(onValueMock).not.toHaveBeenCalled();
  });

  it('reports not_found when the very first snapshot is empty', () => {
    const { result } = renderHook(() => useSpectator('abc'));
    emit(null);
    expect(result.current.status).toBe('not_found');
  });

  it('restores empty arrays stripped by Firebase (rounds/players)', () => {
    const { result } = renderHook(() => useSpectator('abc'));
    emit(liveData);
    expect(result.current.status).toBe('live');
    expect(result.current.game?.rounds).toEqual([]);
    expect(result.current.game?.players).toEqual([]);
  });

  it("debounces 'ended': transient null does not flash the ended screen", () => {
    const { result } = renderHook(() => useSpectator('abc'));
    emit(liveData);
    emit(null);
    expect(result.current.status).toBe('live'); // still within debounce
    act(() => vi.advanceTimersByTime(1000));
    emit(liveData); // host continued the game — cancels the pending 'ended'
    act(() => vi.advanceTimersByTime(2000));
    expect(result.current.status).toBe('live');
  });

  it("commits 'ended' after the debounce when data is really gone", () => {
    const { result } = renderHook(() => useSpectator('abc'));
    emit(liveData);
    emit(null);
    act(() => vi.advanceTimersByTime(1600));
    expect(result.current.status).toBe('ended');
  });

  it('repeated empty snapshots restart the debounce instead of stacking timers', () => {
    const { result } = renderHook(() => useSpectator('abc'));
    emit(liveData);
    emit(null);
    act(() => vi.advanceTimersByTime(1000));
    emit(null); // restarts the 1.5s window
    act(() => vi.advanceTimersByTime(1000));
    expect(result.current.status).toBe('live'); // old timer must not have fired at 1.5s total
    act(() => vi.advanceTimersByTime(600));
    expect(result.current.status).toBe('ended');
  });
});
