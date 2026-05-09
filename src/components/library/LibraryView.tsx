import { useMemo, useState } from 'react';
import type { Level, WordWithLevel } from '../../types';
import type { UseProgress } from '../../hooks/useProgress';
import { getWordsByLevel } from '../../lib/data';
import { SpeakerButton } from '../shared/SpeakerButton';

interface Props {
  progress: UseProgress;
}

type Filter = 'all' | 'favorites' | 'wrong' | 'unknown' | 'known';

const filters: { id: Filter; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'unknown', label: '未學會' },
  { id: 'known', label: '已學會' },
  { id: 'favorites', label: '收藏' },
  { id: 'wrong', label: '錯題' },
];

export function LibraryView({ progress }: Props) {
  const [level, setLevel] = useState<Level>('elementary');
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const baseWords = useMemo(() => getWordsByLevel(level), [level]);

  const filtered = useMemo(() => {
    let list: WordWithLevel[] = baseWords;
    if (filter === 'favorites') {
      list = list.filter((w) => progress.state.favoriteIds[w.id]);
    } else if (filter === 'wrong') {
      list = list.filter((w) => progress.state.wrongIds[w.id]);
    } else if (filter === 'unknown') {
      list = list.filter((w) => !progress.state.knownIds[w.id]);
    } else if (filter === 'known') {
      list = list.filter((w) => progress.state.knownIds[w.id]);
    }
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(
        (w) => w.word.toLowerCase().includes(q) || w.zh.includes(q),
      );
    }
    return list;
  }, [baseWords, filter, query, progress.state]);

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          {(['elementary', 'intermediate'] as Level[]).map((lv) => (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                level === lv
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {lv === 'elementary' ? '初級' : '中級'}
            </button>
          ))}
        </div>
        <input
          type="search"
          placeholder="搜尋單字或中文…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="px-3 py-1.5 rounded-md border border-slate-200 text-sm w-48 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {filters.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-full text-sm transition-colors ${
              filter === f.id
                ? 'bg-blue-600 text-white'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="text-sm text-slate-600">
        共 {filtered.length} 字
      </div>

      <ul className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 overflow-hidden">
        {filtered.length === 0 ? (
          <li className="px-4 py-8 text-center text-slate-400">
            沒有符合的單字
          </li>
        ) : (
          filtered.map((w) => (
            <li
              key={w.id}
              className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50"
            >
              <SpeakerButton text={w.word} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-semibold text-slate-900 truncate">
                    {w.word}
                  </span>
                  <span className="text-xs text-slate-500">{w.pos}</span>
                </div>
                <div className="text-sm text-slate-600 truncate">{w.zh}</div>
              </div>
              <button
                onClick={() => progress.toggleFavorite(w.id)}
                aria-label="收藏"
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  progress.state.favoriteIds[w.id]
                    ? 'text-amber-500'
                    : 'text-slate-300 hover:text-slate-500'
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={
                    progress.state.favoriteIds[w.id] ? 'currentColor' : 'none'
                  }
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
              <button
                onClick={() => progress.toggleKnown(w.id)}
                aria-label="已學會"
                className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  progress.state.knownIds[w.id]
                    ? 'text-emerald-600'
                    : 'text-slate-300 hover:text-slate-500'
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </button>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
