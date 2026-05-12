import { describe, expect, it } from 'vitest';
import type { ProgressState, WordWithLevel } from '../types';
import { buildQuestion, buildQuiz, selectSourceWords } from './quiz';

const word = (
  id: string,
  w: string,
  zh: string,
  level: 'elementary' | 'intermediate' = 'elementary',
): WordWithLevel => ({
  id,
  word: w,
  zh,
  pos: 'n.',
  level,
});

const emptyProgress = (): ProgressState => ({
  knownIds: {},
  favoriteIds: {},
  wrongIds: {},
  history: [],
});

describe('buildQuestion', () => {
  const target = word('e-0-cat', 'cat', '貓');
  const pool: WordWithLevel[] = [
    target,
    word('e-1-dog', 'dog', '狗'),
    word('e-2-bird', 'bird', '鳥'),
    word('e-3-fish', 'fish', '魚'),
    word('e-4-horse', 'horse', '馬'),
  ];

  it('en2zh: options are 4 unique Chinese strings and answerIndex points to the right one', () => {
    const q = buildQuestion(target, 'en2zh', pool);
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4);
    expect(q.options[q.answerIndex]).toBe(target.zh);
    expect(q.options).toContain('貓');
  });

  it('zh2en: options are 4 unique English strings and answerIndex points to the right one', () => {
    const q = buildQuestion(target, 'zh2en', pool);
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4);
    expect(q.options[q.answerIndex]).toBe(target.word);
  });

  it('listen: options are 4 unique English strings', () => {
    const q = buildQuestion(target, 'listen', pool);
    expect(q.options).toHaveLength(4);
    expect(new Set(q.options).size).toBe(4);
    expect(q.options[q.answerIndex]).toBe(target.word);
  });
});

describe('selectSourceWords', () => {
  it('all returns elementary words when level is elementary', () => {
    const out = selectSourceWords(
      { level: 'elementary', types: ['en2zh'], count: 10, source: 'all' },
      emptyProgress(),
    );
    expect(out.every((w) => w.level === 'elementary')).toBe(true);
    expect(out.length).toBeGreaterThan(100);
  });

  it('mixed returns words from both levels', () => {
    const out = selectSourceWords(
      { level: 'mixed', types: ['en2zh'], count: 10, source: 'all' },
      emptyProgress(),
    );
    const levels = new Set(out.map((w) => w.level));
    expect(levels.has('elementary')).toBe(true);
    expect(levels.has('intermediate')).toBe(true);
  });

  it('favorites filters to only favorited words', () => {
    const out = selectSourceWords(
      { level: 'elementary', types: ['en2zh'], count: 10, source: 'favorites' },
      {
        ...emptyProgress(),
        favoriteIds: { 'elementary-0-a': true },
      },
    );
    expect(out).toHaveLength(1);
    expect(out[0].id).toBe('elementary-0-a');
  });

  it('excludeKnown removes known words from the pool', () => {
    const baseline = selectSourceWords(
      { level: 'elementary', types: ['en2zh'], count: 0, source: 'all' },
      emptyProgress(),
    );
    const withSomeKnown = selectSourceWords(
      { level: 'elementary', types: ['en2zh'], count: 0, source: 'excludeKnown' },
      { ...emptyProgress(), knownIds: { 'elementary-0-a': true, 'elementary-1-able': true } },
    );
    expect(withSomeKnown.length).toBe(baseline.length - 2);
    expect(withSomeKnown.some((w) => w.id === 'elementary-0-a')).toBe(false);
  });
});

describe('buildQuiz', () => {
  it('returns an empty array when the source pool is empty', () => {
    const out = buildQuiz(
      { level: 'elementary', types: ['en2zh'], count: 5, source: 'wrong' },
      emptyProgress(),
    );
    expect(out).toEqual([]);
  });

  it('produces the requested number of questions', () => {
    const out = buildQuiz(
      { level: 'elementary', types: ['en2zh'], count: 5, source: 'all' },
      emptyProgress(),
    );
    expect(out).toHaveLength(5);
  });

  it('caps at the source pool size when count exceeds it', () => {
    const out = buildQuiz(
      { level: 'elementary', types: ['en2zh'], count: 100, source: 'favorites' },
      {
        ...emptyProgress(),
        favoriteIds: { 'elementary-0-a': true, 'elementary-1-able': true },
      },
    );
    expect(out).toHaveLength(2);
  });

  it('cycles through the requested types in order', () => {
    const out = buildQuiz(
      { level: 'elementary', types: ['en2zh', 'zh2en', 'listen'], count: 6, source: 'all' },
      emptyProgress(),
    );
    expect(out.map((q) => q.type)).toEqual([
      'en2zh',
      'zh2en',
      'listen',
      'en2zh',
      'zh2en',
      'listen',
    ]);
  });

  it('every generated question has a valid answerIndex', () => {
    const out = buildQuiz(
      { level: 'mixed', types: ['en2zh', 'zh2en'], count: 10, source: 'all' },
      emptyProgress(),
    );
    for (const q of out) {
      expect(q.options).toHaveLength(4);
      expect(q.answerIndex).toBeGreaterThanOrEqual(0);
      expect(q.answerIndex).toBeLessThan(4);
    }
  });
});
