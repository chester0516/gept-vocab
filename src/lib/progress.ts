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

interface ProgressExport {
  app: 'gept-vocab';
  version: 1;
  exportedAt: string;
  progress: ProgressState;
}

export function buildExport(state: ProgressState): ProgressExport {
  return {
    app: 'gept-vocab',
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: state,
  };
}

export function parseImport(text: string): ProgressState {
  const data = JSON.parse(text) as Partial<ProgressExport>;
  if (data.app !== 'gept-vocab') {
    throw new Error('檔案不是 GEPT 單字學習進度檔');
  }
  if (data.version !== 1) {
    throw new Error(`不支援的版本：${data.version}`);
  }
  const p = data.progress;
  if (!p || typeof p !== 'object') {
    throw new Error('進度資料缺失');
  }
  return {
    knownIds: p.knownIds ?? {},
    favoriteIds: p.favoriteIds ?? {},
    wrongIds: p.wrongIds ?? {},
    history: Array.isArray(p.history) ? p.history : [],
  };
}

export function mergeProgress(
  a: ProgressState,
  b: ProgressState,
): ProgressState {
  const mergeBag = (
    x: Record<string, true>,
    y: Record<string, true>,
  ): Record<string, true> => ({ ...x, ...y });
  const seen = new Set<string>();
  const dedupHistory = [...a.history, ...b.history]
    .sort((m, n) => n.date - m.date)
    .filter((r) => {
      const key = `${r.date}-${r.total}-${r.correct}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 30);
  return {
    knownIds: mergeBag(a.knownIds, b.knownIds),
    favoriteIds: mergeBag(a.favoriteIds, b.favoriteIds),
    wrongIds: mergeBag(a.wrongIds, b.wrongIds),
    history: dedupHistory,
  };
}
