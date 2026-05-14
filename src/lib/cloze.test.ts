import { describe, expect, it } from 'vitest';
import type { WordWithLevel } from '../types';
import { buildClozeQuestion, findBlankSpan, pickClozeDistractors } from './cloze';
import { allWords } from './data';

describe('findBlankSpan', () => {
  it('matches exact word', () => {
    expect(findBlankSpan('abandon', 'She decided to abandon her plan.')).toMatchObject({
      matchedForm: 'abandon',
    });
  });

  it('matches plural +s', () => {
    expect(findBlankSpan('bean', 'My mother always adds a few beans to the soup.')).toMatchObject({
      matchedForm: 'beans',
    });
  });

  it('matches +es', () => {
    expect(findBlankSpan('wash', 'He washes his hands every hour.')).toMatchObject({
      matchedForm: 'washes',
    });
  });

  it('matches past tense +ed', () => {
    expect(findBlankSpan('call', 'She called her mother.')).toMatchObject({
      matchedForm: 'called',
    });
  });

  it('matches +d when word ends in e', () => {
    expect(findBlankSpan('care', 'She really cares about her friends.')).toMatchObject({
      matchedForm: 'cares',
    });
    expect(findBlankSpan('advise', 'The doctor advised me to drink water.')).toMatchObject({
      matchedForm: 'advised',
    });
  });

  it('matches -ing', () => {
    expect(findBlankSpan('camp', 'We camped near the river.')).toMatchObject({
      matchedForm: 'camped',
    });
    expect(findBlankSpan('play', 'They are playing soccer outside.')).toMatchObject({
      matchedForm: 'playing',
    });
  });

  it('matches e→ing', () => {
    expect(findBlankSpan('care', 'She is caring for the children.')).toMatchObject({
      matchedForm: 'caring',
    });
  });

  it('matches y→ies', () => {
    expect(findBlankSpan('study', 'She studies hard every day.')).toMatchObject({
      matchedForm: 'studies',
    });
  });

  it('matches y→ied', () => {
    expect(findBlankSpan('study', 'She studied hard yesterday.')).toMatchObject({
      matchedForm: 'studied',
    });
  });

  it('returns null when no form matches', () => {
    expect(findBlankSpan('abandon', 'Completely unrelated sentence here.')).toBeNull();
  });

  it('returns start/end pointing to the matched substring', () => {
    const ex = 'She called her mother.';
    const r = findBlankSpan('call', ex);
    expect(r).not.toBeNull();
    if (r) expect(ex.slice(r.start, r.end)).toBe('called');
  });

  it('matches case-insensitively but preserves original case', () => {
    const ex = 'Abandon all hope, ye who enter.';
    const r = findBlankSpan('abandon', ex);
    expect(r).not.toBeNull();
    if (r) expect(ex.slice(r.start, r.end)).toBe('Abandon');
  });

  it('matches CVC doubling: nod → nodded', () => {
    expect(findBlankSpan('nod', 'He nodded his head.')).toMatchObject({ matchedForm: 'nodded' });
  });

  it('matches CVC doubling: tap → tapped', () => {
    expect(findBlankSpan('tap', 'She tapped on the shoulder.')).toMatchObject({
      matchedForm: 'tapped',
    });
  });

  it('matches CVC doubling: shrug → shrugged', () => {
    expect(findBlankSpan('shrug', 'He shrugged his shoulders.')).toMatchObject({
      matchedForm: 'shrugged',
    });
  });

  it('matches irregular: shake → shook', () => {
    expect(findBlankSpan('shake', 'The boy shook the bottle.')).toMatchObject({
      matchedForm: 'shook',
    });
  });

  it('matches irregular: shoot → shot', () => {
    expect(findBlankSpan('shoot', 'The archer shot an arrow.')).toMatchObject({
      matchedForm: 'shot',
    });
  });

  it('matches irregular: sting → stung', () => {
    expect(findBlankSpan('sting', 'The bee stung her finger.')).toMatchObject({
      matchedForm: 'stung',
    });
  });

  it('matches irregular: swear → swore', () => {
    expect(findBlankSpan('swear', 'She swore to protect her sister.')).toMatchObject({
      matchedForm: 'swore',
    });
  });
});

describe('findBlankSpan dataset coverage', () => {
  it('matches at least 99% of words in their own example', () => {
    let hit = 0;
    const miss: string[] = [];
    for (const w of allWords) {
      if (findBlankSpan(w.word, w.example ?? '')) hit++;
      else miss.push(w.word);
    }
    const rate = hit / allWords.length;
    if (rate < 0.99) {
      console.log('miss samples:', miss.slice(0, 20));
    }
    expect(rate).toBeGreaterThanOrEqual(0.99);
  });
});

const w = (id: string, word: string, pos: string): WordWithLevel => ({
  id,
  word,
  pos,
  zh: '',
  example: '',
  example_zh: '',
  level: 'elementary',
});

describe('pickClozeDistractors', () => {
  const target = w('1', 'cat', 'n.');

  it('returns 3 distractors all matching POS', () => {
    const pool = [
      target,
      w('2', 'dog', 'n.'),
      w('3', 'bird', 'n.'),
      w('4', 'fish', 'n.'),
      w('5', 'run', 'v.'),
      w('6', 'fast', 'adj.'),
    ];
    const out = pickClozeDistractors(pool, target, 3);
    expect(out).toHaveLength(3);
    expect(out).not.toContain('cat');
    expect(new Set(out).size).toBe(3);
    const posOf = (word: string) => pool.find((p) => p.word === word)?.pos;
    for (const word of out) expect(posOf(word)).toBe('n.');
  });

  it('falls back to other POS when same-pos pool is too small', () => {
    const pool = [
      target,
      w('2', 'dog', 'n.'),
      w('3', 'run', 'v.'),
      w('4', 'jump', 'v.'),
      w('5', 'fast', 'adj.'),
    ];
    const out = pickClozeDistractors(pool, target, 3);
    expect(out).toHaveLength(3);
    expect(out).toContain('dog');
  });

  it('returns fewer than count when whole pool cannot supply enough', () => {
    const pool = [target, w('2', 'dog', 'n.')];
    const out = pickClozeDistractors(pool, target, 3);
    expect(out).toHaveLength(1);
  });
});

describe('buildClozeQuestion', () => {
  const target: WordWithLevel = {
    id: '1',
    word: 'advise',
    pos: 'v.',
    zh: '建議',
    example: 'The doctor advised me to drink more water.',
    example_zh: '醫生建議我多喝水。',
    level: 'elementary',
  };
  const pool: WordWithLevel[] = [
    target,
    w('2', 'agree', 'v.'),
    w('3', 'ask', 'v.'),
    w('4', 'bring', 'v.'),
    w('5', 'cat', 'n.'),
  ];

  it('produces prompt with blank replacing the variant form', () => {
    const q = buildClozeQuestion(target, pool, false);
    expect(q).not.toBeNull();
    if (!q) return;
    expect(q.type).toBe('cloze');
    expect(q.prompt).toBe('The doctor ______ me to drink more water.');
    expect(q.blankAnswer).toBe('advised');
  });

  it('options contain the base form, not the variant', () => {
    const q = buildClozeQuestion(target, pool, false);
    if (!q) throw new Error('expected question');
    expect(q.options).toContain('advise');
    expect(q.options).not.toContain('advised');
    expect(q.options[q.answerIndex]).toBe('advise');
    expect(q.options).toHaveLength(4);
  });

  it('omits promptZh when includeHint=false', () => {
    const q = buildClozeQuestion(target, pool, false);
    if (!q) throw new Error('expected question');
    expect(q.promptZh).toBeUndefined();
  });

  it('includes promptZh when includeHint=true', () => {
    const q = buildClozeQuestion(target, pool, true);
    if (!q) throw new Error('expected question');
    expect(q.promptZh).toBe('醫生建議我多喝水。');
  });

  it('returns null when the example does not contain the word', () => {
    const broken: WordWithLevel = {
      ...target,
      example: 'Completely unrelated example sentence.',
    };
    expect(buildClozeQuestion(broken, pool, false)).toBeNull();
  });
});
