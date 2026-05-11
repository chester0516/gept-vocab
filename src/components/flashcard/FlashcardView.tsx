import { useEffect, useMemo, useState } from 'react';
import type { Level, WordWithLevel } from '../../types';
import type { UseProgress } from '../../hooks/useProgress';
import { getWordsByLevel } from '../../lib/data';
import { Flashcard } from './Flashcard';

interface Props {
  progress: UseProgress;
}

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function FlashcardView({ progress }: Props) {
  const [level, setLevel] = useState<Level>('elementary');
  const [hideKnown, setHideKnown] = useState(false);
  const [order, setOrder] = useState<'sequential' | 'shuffled'>('sequential');
  const [index, setIndex] = useState(0);

  const baseWords = useMemo(() => getWordsByLevel(level), [level]);

  const words = useMemo(() => {
    let list: WordWithLevel[] = baseWords;
    if (hideKnown) {
      list = list.filter((w) => !progress.state.knownIds[w.id]);
    }
    if (order === 'shuffled') {
      list = shuffle(list);
    }
    return list;
  }, [baseWords, hideKnown, order, progress.state.knownIds]);

  useEffect(() => {
    setIndex(0);
  }, [level, hideKnown, order]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'ArrowRight') {
        e.preventDefault();
        setIndex((i) => Math.min(words.length - 1, i + 1));
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        setIndex((i) => Math.max(0, i - 1));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [words.length]);

  if (words.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-12 text-center text-slate-500 dark:text-slate-400">
        目前沒有可顯示的單字。
        <br />
        試試取消「隱藏已學會」或切換等級。
      </div>
    );
  }

  const safeIndex = Math.min(index, words.length - 1);
  const word = words[safeIndex];

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div className="flex flex-wrap gap-2 justify-between items-center">
        <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-1">
          {(['elementary', 'intermediate'] as Level[]).map((lv) => (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
                level === lv
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {lv === 'elementary' ? '初級' : '中級'}
            </button>
          ))}
        </div>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          {safeIndex + 1} / {words.length}
        </div>
      </div>

      <Flashcard
        word={word}
        isKnown={!!progress.state.knownIds[word.id]}
        isFavorite={!!progress.state.favoriteIds[word.id]}
        onToggleKnown={() => progress.toggleKnown(word.id)}
        onToggleFavorite={() => progress.toggleFavorite(word.id)}
      />

      <div className="flex gap-2 justify-between">
        <button
          onClick={() => setIndex((i) => Math.max(0, i - 1))}
          disabled={safeIndex === 0}
          className="px-4 py-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          ← 上一張
        </button>
        <button
          onClick={() => setIndex((i) => Math.min(words.length - 1, i + 1))}
          disabled={safeIndex === words.length - 1}
          className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed"
        >
          下一張 →
        </button>
      </div>

      <div className="flex flex-wrap gap-3 items-center justify-between text-sm">
        <button
          onClick={() =>
            setOrder((o) => (o === 'sequential' ? 'shuffled' : 'sequential'))
          }
          className="px-3 py-1.5 rounded-md bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          {order === 'sequential' ? '🔀 隨機順序' : '🔢 字母順序'}
        </button>
        <label className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <input
            type="checkbox"
            checked={hideKnown}
            onChange={(e) => setHideKnown(e.target.checked)}
            className="rounded"
          />
          隱藏已學會
        </label>
      </div>

      <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
        鍵盤: ← / → 切換  ·  空白鍵 翻面
      </div>
    </div>
  );
}
