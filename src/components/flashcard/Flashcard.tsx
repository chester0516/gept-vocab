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
        className={`card-flip-inner relative w-full min-h-[20rem] cursor-pointer ${
          flipped ? 'is-flipped' : ''
        }`}
        onClick={() => setFlipped((f) => !f)}
      >
        {/* Front — paper-white card with serif headword */}
        <div className="card-face bg-surface rounded-md border border-line shadow-soft flex flex-col items-center justify-center px-8 pt-12 pb-12">
          <div className="absolute top-4 right-4 flex gap-1.5">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite();
              }}
              aria-label="收藏"
              className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                isFavorite ? 'text-warn bg-warn/10' : 'text-ink-mute hover:text-ink hover:bg-paper'
              }`}
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill={isFavorite ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth="1.5"
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
                  ? 'text-success bg-success/10'
                  : 'text-ink-mute hover:text-ink hover:bg-paper'
              }`}
            >
              <svg
                width="18"
                height="18"
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
          </div>
          <div className="absolute top-4 left-4">
            <span className="label-sc">{word.level === 'elementary' ? '初級' : '中級'}</span>
          </div>

          <div className="text-center">
            <div className="font-bold text-5xl sm:text-6xl text-ink tracking-tight break-all leading-[1.05]">
              {word.word}
            </div>
            <div className="mt-4 text-sm italic text-ink-soft">{word.pos}</div>
          </div>

          <div className="absolute bottom-4 right-4" onClick={(e) => e.stopPropagation()}>
            <SpeakerButton text={word.word} size="md" />
          </div>
          <div className="absolute bottom-4 left-4 label-sc">空白鍵 翻面</div>
        </div>

        {/* Back — deep ink card with cream type */}
        <div className="card-face card-face-back bg-ink text-paper rounded-md border border-ink shadow-soft flex flex-col items-center justify-center gap-5 px-8 pt-12 pb-14">
          <div className="text-center">
            <div className="font-bold text-4xl sm:text-5xl tracking-tight break-all leading-tight">
              {word.zh}
            </div>
            <div className="mt-3 text-sm italic text-paper/60">{word.pos}</div>
            <div className="mt-6 text-base font-medium text-paper/75 tracking-wide">
              {word.word}
            </div>
          </div>
          {word.example && (
            <div className="px-5 py-4 border border-paper/15 bg-paper/5 rounded-md text-sm max-w-sm">
              <p className="italic text-paper leading-relaxed">{word.example}</p>
              <p className="mt-2 text-paper/65 text-xs leading-relaxed">{word.example_zh}</p>
              <div className="mt-3 flex justify-center">
                <SpeakerButton text={word.example} size="sm" variant="dark" />
              </div>
            </div>
          )}
          <div className="absolute bottom-4 left-4 text-[10px] uppercase tracking-[0.14em] text-paper/45">
            點擊翻回正面
          </div>
        </div>
      </div>
    </div>
  );
}
