import type { ProgressState, QuizRecord } from '../types';

const STORAGE_KEY = 'gept-vocab-progress-v1';

const empty = (): ProgressState => ({
  knownIds: {},
  favoriteIds: {},
  wrongIds: {},
  history: [],
});

export function loadProgress(): ProgressState {
  if (typeof window === 'undefined') return empty();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return empty();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    return {
      knownIds: parsed.knownIds ?? {},
      favoriteIds: parsed.favoriteIds ?? {},
      wrongIds: parsed.wrongIds ?? {},
      history: parsed.history ?? [],
    };
  } catch {
    return empty();
  }
}

export function saveProgress(state: ProgressState): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore quota errors
  }
}

export function toggleId(
  bag: Record<string, true>,
  id: string,
): Record<string, true> {
  if (bag[id]) {
    const next = { ...bag };
    delete next[id];
    return next;
  }
  return { ...bag, [id]: true };
}

export function addId(
  bag: Record<string, true>,
  id: string,
): Record<string, true> {
  if (bag[id]) return bag;
  return { ...bag, [id]: true };
}

export function removeId(
  bag: Record<string, true>,
  id: string,
): Record<string, true> {
  if (!bag[id]) return bag;
  const next = { ...bag };
  delete next[id];
  return next;
}

export function appendRecord(
  history: QuizRecord[],
  record: QuizRecord,
): QuizRecord[] {
  return [record, ...history].slice(0, 30);
}
