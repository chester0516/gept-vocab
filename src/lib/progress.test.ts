import { beforeEach, describe, expect, it } from 'vitest';
import type { ProgressState, QuizRecord } from '../types';
import {
  addId,
  appendRecord,
  buildExport,
  loadProgress,
  mergeProgress,
  parseImport,
  removeId,
  saveProgress,
  toggleId,
} from './progress';

const emptyState = (): ProgressState => ({
  knownIds: {},
  favoriteIds: {},
  wrongIds: {},
  history: [],
});

const record = (date: number, total = 10, correct = 8): QuizRecord => ({
  date,
  level: 'elementary',
  total,
  correct,
  durationMs: 60000,
});

describe('toggleId', () => {
  it('adds an id when absent', () => {
    expect(toggleId({}, 'a')).toEqual({ a: true });
  });

  it('removes an id when present', () => {
    expect(toggleId({ a: true, b: true }, 'a')).toEqual({ b: true });
  });

  it('does not mutate the input bag', () => {
    const bag = { a: true } as const;
    toggleId(bag, 'b');
    expect(bag).toEqual({ a: true });
  });
});

describe('addId / removeId', () => {
  it('addId returns the same reference when the id is already present', () => {
    const bag = { a: true } as Record<string, true>;
    expect(addId(bag, 'a')).toBe(bag);
  });

  it('addId returns a new object when adding a new id', () => {
    const bag = { a: true } as Record<string, true>;
    const next = addId(bag, 'b');
    expect(next).not.toBe(bag);
    expect(next).toEqual({ a: true, b: true });
  });

  it('removeId returns the same reference when the id is absent', () => {
    const bag = { a: true } as Record<string, true>;
    expect(removeId(bag, 'b')).toBe(bag);
  });

  it('removeId returns a new object without the id', () => {
    expect(removeId({ a: true, b: true }, 'a')).toEqual({ b: true });
  });
});

describe('appendRecord', () => {
  it('prepends the new record', () => {
    const history = [record(1), record(2)];
    const next = appendRecord(history, record(3));
    expect(next[0]).toEqual(record(3));
    expect(next).toHaveLength(3);
  });

  it('caps history at 30 entries', () => {
    const history = Array.from({ length: 30 }, (_, i) => record(i));
    const next = appendRecord(history, record(100));
    expect(next).toHaveLength(30);
    expect(next[0].date).toBe(100);
  });
});

describe('loadProgress / saveProgress', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('returns an empty state when nothing is stored', () => {
    expect(loadProgress()).toEqual(emptyState());
  });

  it('round-trips a saved state', () => {
    const state: ProgressState = {
      knownIds: { 'a-1': true },
      favoriteIds: {},
      wrongIds: { 'b-2': true },
      history: [record(1)],
    };
    saveProgress(state);
    expect(loadProgress()).toEqual(state);
  });

  it('returns empty state for malformed JSON', () => {
    window.localStorage.setItem('gept-vocab-progress-v1', '{not json');
    expect(loadProgress()).toEqual(emptyState());
  });

  it('fills in missing fields from partial stored state', () => {
    window.localStorage.setItem(
      'gept-vocab-progress-v1',
      JSON.stringify({ knownIds: { a: true } }),
    );
    expect(loadProgress()).toEqual({
      knownIds: { a: true },
      favoriteIds: {},
      wrongIds: {},
      history: [],
    });
  });
});

describe('buildExport / parseImport', () => {
  it('round-trips through JSON', () => {
    const state: ProgressState = {
      knownIds: { 'a-1': true },
      favoriteIds: { 'a-2': true },
      wrongIds: {},
      history: [record(1)],
    };
    const text = JSON.stringify(buildExport(state));
    expect(parseImport(text)).toEqual(state);
  });

  it('rejects files from a different app', () => {
    expect(() => parseImport('{}')).toThrow(/不是 GEPT/);
    expect(() => parseImport(JSON.stringify({ app: 'other', version: 1, progress: {} }))).toThrow(
      /不是 GEPT/,
    );
  });

  it('rejects unsupported versions', () => {
    expect(() =>
      parseImport(JSON.stringify({ app: 'gept-vocab', version: 99, progress: {} })),
    ).toThrow(/不支援的版本/);
  });

  it('rejects missing progress', () => {
    expect(() => parseImport(JSON.stringify({ app: 'gept-vocab', version: 1 }))).toThrow(
      /進度資料缺失/,
    );
  });
});

describe('mergeProgress', () => {
  it('unions the id bags', () => {
    const a: ProgressState = {
      knownIds: { a: true },
      favoriteIds: { f: true },
      wrongIds: {},
      history: [],
    };
    const b: ProgressState = {
      knownIds: { b: true },
      favoriteIds: { g: true },
      wrongIds: { w: true },
      history: [],
    };
    const merged = mergeProgress(a, b);
    expect(merged.knownIds).toEqual({ a: true, b: true });
    expect(merged.favoriteIds).toEqual({ f: true, g: true });
    expect(merged.wrongIds).toEqual({ w: true });
  });

  it('merges history newest-first and dedupes by date/total/correct', () => {
    const a: ProgressState = {
      ...emptyState(),
      history: [record(10, 10, 8), record(5, 10, 7)],
    };
    const b: ProgressState = {
      ...emptyState(),
      history: [record(10, 10, 8), record(20, 10, 9)],
    };
    const merged = mergeProgress(a, b);
    expect(merged.history.map((r) => r.date)).toEqual([20, 10, 5]);
  });

  it('caps merged history at 30 entries', () => {
    const a: ProgressState = {
      ...emptyState(),
      history: Array.from({ length: 25 }, (_, i) => record(i)),
    };
    const b: ProgressState = {
      ...emptyState(),
      history: Array.from({ length: 25 }, (_, i) => record(100 + i)),
    };
    expect(mergeProgress(a, b).history).toHaveLength(30);
  });
});
