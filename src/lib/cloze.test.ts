import { describe, expect, it } from 'vitest';
import { findBlankSpan } from './cloze';

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
});
