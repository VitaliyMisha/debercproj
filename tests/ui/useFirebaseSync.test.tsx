// @vitest-environment jsdom

import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Game, GameRulesConfig } from '../../src/types';

const setMock = vi.fn((..._args: unknown[]) => {});
const removeMock = vi.fn((..._args: unknown[]) => {});
const onValueMock = vi.fn((..._args: unknown[]) => vi.fn());
const onDisconnectRemoveMock = vi.fn();
const onDisconnectCancelMock = vi.fn();
const onDisconnectMock = vi.fn((_arg: unknown) => ({
  remove: onDisconnectRemoveMock,
  cancel: onDisconnectCancelMock,
}));

vi.mock('../../src/config/firebase', () => ({ db: {} }));
vi.mock('firebase/database', () => ({
  ref: (_db: unknown, path?: string) => ({ path }),
  set: (...args: unknown[]) => setMock(...args),
  remove: (...args: unknown[]) => removeMock(...args),
  onValue: (...args: unknown[]) => onValueMock(...args),
  onDisconnect: (arg: unknown) => onDisconnectMock(arg),
}));

import { useFirebaseSync } from '../../src/hooks/useFirebaseSync';

const rules: GameRulesConfig = {
  secondBPenalty: -100,
  hvPenalty: -100,
  allowVis: true,
  customTargetScore: false,
  targetScoreOptions: [510, 1020],
};

const game: Game = {
  id: 1,
  createdAt: '2026-07-05T00:00:00Z',
  players: [{ id: 1, name: 'Заєць', winCount: 0 }],
  rounds: [],
  dealerId: 1,
};

const params = { game, targetScore: 510, winnerPlayer: null, gameRules: rules, isSharing: true, shareCode: 'abc123' };

/** Fires the '.info/connected' listener registered by the hook. */
const emitConnected = (connected: boolean) => {
  const call = onValueMock.mock.calls.find((c) => (c[0] as { path?: string })?.path === '.info/connected');
  expect(call).toBeDefined();
  (call?.[1] as (snap: { val: () => boolean }) => void)({ val: () => connected });
};

describe('useFirebaseSync — onDisconnect cleanup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('writes game state while sharing', () => {
    renderHook(() => useFirebaseSync(params));
    expect(setMock).toHaveBeenCalledWith(
      expect.objectContaining({ path: 'games/abc123' }),
      expect.objectContaining({ game, targetScore: 510 })
    );
  });

  it('registers server-side onDisconnect removal when the connection is up', () => {
    renderHook(() => useFirebaseSync(params));
    emitConnected(true);
    expect(onDisconnectMock).toHaveBeenCalledWith(expect.objectContaining({ path: 'games/abc123' }));
    expect(onDisconnectRemoveMock).toHaveBeenCalled();
  });

  it('re-writes the latest state on reconnect (transient disconnect may have wiped it)', () => {
    renderHook(() => useFirebaseSync(params));
    setMock.mockClear();
    emitConnected(true);
    expect(setMock).toHaveBeenCalledWith(expect.objectContaining({ path: 'games/abc123' }), expect.objectContaining({ game }));
  });

  it('does not register onDisconnect while not sharing', () => {
    renderHook(() => useFirebaseSync({ ...params, isSharing: false, shareCode: null }));
    expect(onDisconnectMock).not.toHaveBeenCalled();
    expect(setMock).not.toHaveBeenCalled();
  });

  it('cancels onDisconnect and removes the record on unmount', () => {
    const { unmount } = renderHook(() => useFirebaseSync(params));
    unmount();
    expect(onDisconnectCancelMock).toHaveBeenCalled();
    expect(removeMock).toHaveBeenCalledWith(expect.objectContaining({ path: 'games/abc123' }));
  });
});
