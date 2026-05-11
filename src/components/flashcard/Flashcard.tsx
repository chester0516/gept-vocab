import { useEffect, useState } from 'react';
import type { WordWithLevel } from '../../types';
import { SpeakerButton } from '../shared/SpeakerButton';

interface Props {
  word: WordWithLevel;
  isKnown: boolean;
  isFavorite: boolean;
  onToggleKnown: () => void;
  onToggleFavorite: () => void;
}

export function Flashcard({ word, isKnown, isFavorite, onToggleKnown, onToggleFavorite }: Props) {
  const [flipped, setFlipped] = useState(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset flip state when navigating to a different word
  useEffect(() => {
    setFlipped(false);
  }, [word.id]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        setFlipped((f) => !f);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="card-flip-container w-full">
      <div
        className={`card-flip-inner relative w-full min-h-[18rem] cursor-pointer ${
          flipped ? 'is-flipped' : ''
        }`}
        onClick={() => setFlipped((f) => !f)}
      >
        {/* Front */}
        <div className="card-face bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center px-6 py-8">
          <div className="absolute top-4 right-4 flex gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              aria-label="收藏"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isFavorite
                  ? 'bg-amber-100 dark:bg-amber-900/40 text-amber-500 dark:text-amber-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="2"
                strokeLinejoin="round"
              >
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleKnown();
              }}
              aria-label="已學會"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isKnown
                  ? 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400'
                  : 'bg-slate-100 dark:bg-slate-700 text-slate-400 dark:text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-600'
              }`}
            >
              <svg
                width="18"
                height="18"
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
          </div>
          <div className="absolute top-4 left-4">
            <span className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
              {word.level === 'elementary' ? '初級' : '中級'}
            </span>
          </div>

          <div className="text-center">
            <div className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-slate-100 break-all">
              {word.word}
            </div>
            <div className="mt-3 text-sm text-slate-500 dark:text-slate-400">{word.pos}</div>
          </div>

          <div className="absolute bottom-4 right-4" onClick={(e) => e.stopPropagation()}>
            <SpeakerButton text={word.word} size="md" />
          </div>
          <div className="absolute bottom-4 left-4 text-xs text-slate-400 dark:text-slate-500">
            點擊翻面 / 空白鍵
          </div>
        </div>

        {/* Back */}
        <div className="card-face card-face-back bg-blue-600 text-white rounded-3xl shadow-xl flex flex-col items-center justify-center gap-4 px-6 pt-8 pb-10">
          <div className="text-center">
            <div className="text-3xl sm:text-4xl font-semibold break-all">{word.zh}</div>
            <div className="mt-3 text-sm text-blue-100">{word.pos}</div>
            <div className="mt-6 text-base text-blue-100">{word.word}</div>
          </div>
          {word.example && (
            <div className="px-4 py-3 bg-blue-700/60 rounded-xl text-sm max-w-xs text-center">
              <p className="text-white italic leading-snug">{word.example}</p>
              <p className="mt-1.5 text-blue-200 text-xs leading-snug">{word.example_zh}</p>
              <div className="mt-2 flex justify-center">
                <SpeakerButton text={word.example} size="sm" variant="dark" />
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 text-xs text-blue-200">再次點擊翻回正面</div>
        </div>
      </div>
    </div>
  );
}
