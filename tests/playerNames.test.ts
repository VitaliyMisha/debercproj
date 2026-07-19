import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadPlayerNames, savePlayerNames } from '../src/utils/gameHelpers';

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

describe('playerNames persistence', () => {
  beforeEach(() => localStorage.clear());

  it('savePlayerNames + loadPlayerNames round-trip', () => {
    savePlayerNames(['Ваня', 'Петро']);
    expect(loadPlayerNames()).toEqual(['Ваня', 'Петро']);
  });

  it('loadPlayerNames returns [] when key absent', () => {
    expect(loadPlayerNames()).toEqual([]);
  });

  it('loadPlayerNames returns [] on corrupted JSON', () => {
    localStorage.setItem('playerNames', '{ broken json !!');
    expect(loadPlayerNames()).toEqual([]);
  });

  it('deduplication: newer version wins (case-insensitive)', () => {
    savePlayerNames(['vasya']);
    savePlayerNames(['Vasya', 'Петро']);
    expect(loadPlayerNames()).toEqual(['Vasya', 'Петро']);
  });

  it('deduplication: re-adding existing name moves it to end', () => {
    savePlayerNames(['Ваня', 'Петро']);
    savePlayerNames(['Ваня']);
    expect(loadPlayerNames()).toEqual(['Петро', 'Ваня']);
  });

  it('empty and whitespace-only names are not saved', () => {
    savePlayerNames(['', '  ', 'Ваня']);
    expect(loadPlayerNames()).toEqual(['Ваня']);
  });
});
