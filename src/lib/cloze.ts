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
