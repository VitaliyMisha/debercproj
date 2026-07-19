import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadWinCounts, saveWinCounts, winCountKey } from '../src/utils/gameHelpers';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value.toString();
    },
    clear: () => {
      store = {};
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    key: (index: number) => Object.keys(store)[index] || null,
    get length() {
      return Object.keys(store).length;
    },
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

describe('Win Counts Persistence', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('check saveWinCounts and loadWinCounts functions', () => {
    const testCounts = { '123': 5, '456': 2 };
    saveWinCounts(testCounts);
    const loaded = loadWinCounts();

    expect(loaded).toEqual(testCounts);
  });
});

describe('winCountKey', () => {
  it('lowercases and trims the name so counts survive re-typed names', () => {
    expect(winCountKey('  Заєць ')).toBe('заєць');
    expect(winCountKey('ЗАЄЦЬ')).toBe(winCountKey('заєць'));
  });

  it('keeps easter-egg emoji prefixes as part of the key', () => {
    expect(winCountKey('🐰 Заєць')).toBe('🐰 заєць');
  });
});
