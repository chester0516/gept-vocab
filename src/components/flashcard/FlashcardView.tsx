import { useEffect, useMemo, useState } from 'react';
import { useLocalStorageState } from '../../hooks/useLocalStorageState';
import type { UseProgress } from '../../hooks/useProgress';
import { SPEECH_RATE_DEFAULT, SPEECH_RATE_KEY } from '../../hooks/useSpeech';
import { getWordsByLevel } from '../../lib/data';
import type { Level, WordWithLevel } from '../../types';
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

interface SettingRowProps<T> {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (next: T) => void;
  isEqual?: (a: T, b: T) => boolean;
}

function SettingRow<T>({
  label,
  value,
  options,
  onChange,
  isEqual = (a, b) => a === b,
}: SettingRowProps<T>) {
  return (
    <div className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
      <span className="label-sc whitespace-nowrap">{label}</span>
      <div className="inline-flex rounded-md border border-line p-0.5 bg-paper/60">
        {options.map((opt) => {
          const active = isEqual(opt.value, value);
          return (
            <button
              type="button"
              key={String(opt.value)}
              onClick={() => onChange(opt.value)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                active
                  ? 'bg-surface text-ink shadow-sm font-medium'
                  : 'text-ink-soft hover:text-ink'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function FlashcardView({ progress }: Props) {
  const [level, setLevel] = useLocalStorageState<Level>('gept-flashcard-level', 'elementary');
  const [hideKnown, setHideKnown] = useLocalStorageState<boolean>(
    'gept-flashcard-hide-known',
    true,
  );
  const [scope, setScope] = useLocalStorageState<'random' | 'favorites' | 'wrong'>(
    'gept-flashcard-scope',
    'random',
  );
  const [speechRate, setSpeechRate] = useLocalStorageState<number>(
    SPEECH_RATE_KEY,
    SPEECH_RATE_DEFAULT,
  );
  const [index, setIndex] = useState(0);

  const baseWords = useMemo(() => getWordsByLevel(level), [level]);

  const words = useMemo(() => {
    let list: WordWithLevel[] = baseWords;
    if (scope === 'favorites') {
      list = list.filter((w) => progress.state.favoriteIds[w.id]);
    } else if (scope === 'wrong') {
      list = list.filter((w) => progress.state.wrongIds[w.id]);
    }
    if (hideKnown) {
      list = list.filter((w) => !progress.state.knownIds[w.id]);
    }
    return shuffle(list);
  }, [
    baseWords,
    hideKnown,
    scope,
    progress.state.knownIds,
    progress.state.favoriteIds,
    progress.state.wrongIds,
  ]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: reset index when level/filter/scope changes
  useEffect(() => {
    setIndex(0);
  }, [level, hideKnown, scope]);

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

  const isEmpty = words.length === 0;
  const safeIndex = Math.min(index, Math.max(0, words.length - 1));
  const word = isEmpty ? null : words[safeIndex];
  const emptyHint =
    scope === 'favorites'
      ? '目前沒有收藏的單字。點字卡上的星號加入收藏。'
      : scope === 'wrong'
        ? '目前沒有錯題單字。答錯的單字會自動加入這裡。'
        : '目前沒有可顯示的單字。試試切換顯示為「全部」或換等級。';

  return (
    <div className="max-w-xl mx-auto px-5 py-8 space-y-6">
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
        <div className="text-sm text-ink-soft tabular-nums font-mono">
          {isEmpty ? 0 : safeIndex + 1} <span className="text-ink-mute">/</span> {words.length}
        </div>
      </div>

      {isEmpty ? (
        <div className="bg-surface border border-line border-dashed rounded-md py-16 px-6 text-center text-ink-soft italic">
          {emptyHint}
        </div>
      ) : (
        <>
          <div className="flex gap-2 justify-between">
            <button
              type="button"
              onClick={() => setIndex((i) => Math.max(0, i - 1))}
              disabled={safeIndex === 0}
              className="px-4 py-2 rounded-md bg-surface border border-line text-ink disabled:opacity-40 disabled:cursor-not-allowed hover:border-ink/30 transition-colors"
            >
              ← 上一張
            </button>
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(words.length - 1, i + 1))}
              disabled={safeIndex === words.length - 1}
              className="px-5 py-2 rounded-md bg-ink hover:bg-ink/90 text-paper font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              下一張 →
            </button>
          </div>

          {word && (
            <Flashcard
              word={word}
              isKnown={!!progress.state.knownIds[word.id]}
              isFavorite={!!progress.state.favoriteIds[word.id]}
              onToggleKnown={() => progress.toggleKnown(word.id)}
              onToggleFavorite={() => progress.toggleFavorite(word.id)}
            />
          )}

          <div className="text-[11px] text-ink-mute text-center tracking-wide">
            鍵盤 ← / → 切換 · 空白鍵 翻面
          </div>
        </>
      )}

      <div className="bg-surface border border-line rounded-md p-5 text-sm divide-y divide-line">
        <SettingRow
          label="順序"
          value={scope}
          options={[
            { value: 'random', label: '隨機' },
            { value: 'favorites', label: '收藏' },
            { value: 'wrong', label: '錯題' },
          ]}
          onChange={setScope}
        />
        <SettingRow
          label="顯示"
          value={hideKnown}
          options={[
            { value: false, label: '全部' },
            { value: true, label: '未學會' },
          ]}
          onChange={setHideKnown}
        />
        <SettingRow
          label="語速"
          value={speechRate}
          options={[
            { value: 0.7, label: '慢' },
            { value: 0.9, label: '中' },
            { value: 1.1, label: '快' },
          ]}
          onChange={setSpeechRate}
          isEqual={(a, b) => Math.abs(a - b) < 0.01}
        />
      </div>
    </div>
  );
}
