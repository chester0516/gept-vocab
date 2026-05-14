export interface BlankSpan {
  start: number;
  end: number;
  matchedForm: string;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function candidatesFromRules(word: string): string[] {
  const out = [word, word + 's', word + 'es', word + 'ed'];
  if (word.endsWith('e')) out.push(word + 'd');
  out.push(word + 'ing');
  if (word.endsWith('e')) out.push(word.slice(0, -1) + 'ing');
  if (word.endsWith('y')) {
    out.push(word.slice(0, -1) + 'ies');
    out.push(word.slice(0, -1) + 'ied');
  }
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
