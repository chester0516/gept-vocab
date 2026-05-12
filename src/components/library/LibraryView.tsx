import { useMemo, useState } from 'react';
import type { UseProgress } from '../../hooks/useProgress';
import { getWordsByLevel } from '../../lib/data';
import type { Level, WordWithLevel } from '../../types';
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
      list = list.filter((w) => w.word.toLowerCase().includes(q) || w.zh.includes(q));
    }
    return list;
  }, [baseWords, filter, query, progress.state]);

  return (
    <div className="max-w-3xl mx-auto px-5 py-8 space-y-5">
      <header className="space-y-2">
        <p className="label-sc">Vocabulary Library</p>
        <h1 className="font-serif text-3xl text-ink tracking-tight">單字列表</h1>
      </header>

      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="inline-flex rounded-md border border-line p-0.5 bg-paper/60">
          {(['elementary', 'intermediate'] as Level[]).map((lv) => (
            <button
              type="button"
              key={lv}
              onClick={() => setLevel(lv)}
              className={`px-4 py-1.5 text-sm rounded transition-colors ${
                level === lv
                  ? 'bg-surface text-ink shadow-sm font-medium'
                  : 'text-ink-soft hover:text-ink'
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
          className="px-3 py-1.5 rounded-md border border-line bg-surface text-ink placeholder:text-ink-mute text-sm w-52 focus:outline-none focus:border-ink/40"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {filters.map((f) => (
          <button
            type="button"
            key={f.id}
            onClick={() => setFilter(f.id)}
            className={`px-3 py-1 rounded-full text-sm border transition-colors ${
              filter === f.id
                ? 'bg-ink border-ink text-paper'
                : 'bg-surface border-line text-ink-soft hover:text-ink hover:border-ink/30'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="text-xs text-ink-mute label-sc">
        共 <span className="font-mono normal-case tracking-normal">{filtered.length}</span> 字
      </div>

      <ul className="bg-surface border border-line rounded-md divide-y divide-line overflow-hidden">
        {filtered.length === 0 ? (
          <li className="px-6 py-10 text-center text-ink-mute font-serif italic">沒有符合的單字</li>
        ) : (
          filtered.map((w) => (
            <li key={w.id} className="flex items-center gap-3 px-5 py-3 hover:bg-paper/60">
              <SpeakerButton text={w.word} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="flex items-baseline gap-2">
                  <span className="font-serif text-lg text-ink truncate">{w.word}</span>
                  <span className="text-xs italic text-ink-mute">{w.pos}</span>
                </div>
                <div className="text-sm text-ink-soft truncate">{w.zh}</div>
              </div>
              <button
                type="button"
                onClick={() => progress.toggleFavorite(w.id)}
                aria-label="收藏"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  progress.state.favoriteIds[w.id]
                    ? 'text-warn'
                    : 'text-ink-mute/50 hover:text-ink-soft'
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill={progress.state.favoriteIds[w.id] ? 'currentColor' : 'none'}
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinejoin="round"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => progress.toggleKnown(w.id)}
                aria-label="已學會"
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
                  progress.state.knownIds[w.id]
                    ? 'text-success'
                    : 'text-ink-mute/50 hover:text-ink-soft'
                }`}
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.2"
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
