import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { SavedGameState } from '../src/types';
import { clearGameState, loadGameState, saveGameState } from '../src/utils/gameHelpers';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] ?? null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
    key: (index: number) => Object.keys(store)[index] ?? null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

const mockState: SavedGameState = {
  game: {
    id: 1,
    createdAt: '2026-05-18T00:00:00.000Z',
    players: [
      { id: 1001, name: 'Віталій', winCount: 0 },
      { id: 1002, name: 'Іванко', winCount: 1 },
    ],
    rounds: [{ id: 1, number: 1, scores: { '1001': 120, '1002': 80 }, dealerId: 1001 }],
    dealerId: 1002,
  },
  targetScore: 1020,
  winnerPlayer: null,
};

describe('savedGame persistence', () => {
  beforeEach(() => localStorage.clear());

  it('saveGameState + loadGameState round-trip', () => {
    saveGameState(mockState);
    expect(loadGameState()).toEqual(mockState);
  });

  it('loadGameState returns null when key absent', () => {
    expect(loadGameState()).toBeNull();
  });

  it('loadGameState returns null on corrupted JSON', () => {
    localStorage.setItem('savedGame', '{ broken json !!');
    expect(loadGameState()).toBeNull();
  });

  it('clearGameState removes the key', () => {
    saveGameState(mockState);
    clearGameState();
    expect(localStorage.getItem('savedGame')).toBeNull();
  });

  it('persists gameRules and restores them on load', () => {
    const withRules: SavedGameState = {
      ...mockState,
      gameRules: {
        secondBPenalty: -200,
        hvPenalty: -50,
        allowVis: false,
        customTargetScore: false,
        targetScoreOptions: [510, 1020],
      },
    };
    saveGameState(withRules);
    expect(loadGameState()?.gameRules?.hvPenalty).toBe(-50);
  });

  it('legacy save without gameRules still loads (gameRules absent)', () => {
    saveGameState(mockState);
    const loaded = loadGameState();
    expect(loaded).not.toBeNull();
    expect(loaded?.gameRules).toBeUndefined();
  });
});
