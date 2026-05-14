import type { WordWithLevel } from '../types';

export interface BlankSpan {
  start: number;
  end: number;
  matchedForm: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const IRREGULAR_FORMS: Record<string, string[]> = {
  shake: ['shook', 'shaken', 'shaking'],
  shoot: ['shot', 'shooting'],
  sting: ['stung', 'stinging'],
  swear: ['swore', 'sworn', 'swearing'],
};

const CVC_PATTERN = /[bcdfghjklmnpqrstvz][aeiou][bcdfghjklmnprstvz]$/i;

function candidatesFromRules(word: string): string[] {
  const out = [word, word + 's', word + 'es', word + 'ed'];
  if (word.endsWith('e')) out.push(word + 'd');
  out.push(word + 'ing');
  if (word.endsWith('e')) out.push(word.slice(0, -1) + 'ing');
  if (word.endsWith('y')) {
    out.push(word.slice(0, -1) + 'ies');
    out.push(word.slice(0, -1) + 'ied');
  }
  if (CVC_PATTERN.test(word)) {
    const last = word[word.length - 1];
    out.push(word + last + 'ed', word + last + 'ing', word + last + 'er');
  }
  const irregular = IRREGULAR_FORMS[word.toLowerCase()];
  if (irregular) out.push(...irregular);
  return out;
}

function findFirstMatch(forms: string[], example: string): BlankSpan | null {
  for (const f of forms) {
    const re = new RegExp(`\\b${escapeRegex(f)}\\b`, 'i');
    const m = re.exec(example);
    if (m) {
      return { start: m.index, end: m.index + m[0].length, matchedForm: m[0] };
    }
  }
  return null;
}

export function findBlankSpan(word: string, example: string): BlankSpan | null {
  return findFirstMatch(candidatesFromRules(word), example);
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function pickClozeDistractors(
  pool: WordWithLevel[],
  target: WordWithLevel,
  count: number,
): string[] {
  const seen = new Set<string>([target.word]);
  const out: string[] = [];

  const samePos = shuffle(pool.filter((w) => w.id !== target.id && w.pos === target.pos));
  for (const w of samePos) {
    if (out.length === count) break;
    if (seen.has(w.word)) continue;
    seen.add(w.word);
    out.push(w.word);
  }

  if (out.length < count) {
    const rest = shuffle(pool.filter((w) => w.id !== target.id && w.pos !== target.pos));
    for (const w of rest) {
      if (out.length === count) break;
      if (seen.has(w.word)) continue;
      seen.add(w.word);
      out.push(w.word);
    }
  }

  return out;
}
