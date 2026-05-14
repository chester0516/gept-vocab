import { useState } from 'react';
import type { UseProgress } from '../../hooks/useProgress';
import { selectSourceWords } from '../../lib/quiz';
import type { Level, QuizType, WordSource } from '../../types';

interface Props {
  progress: UseProgress;
  onStart: (config: {
    level: Level | 'mixed';
    types: QuizType[];
    count: number;
    source: WordSource;
  }) => void;
}

const allTypes: { id: QuizType; label: string; desc: string }[] = [
  { id: 'en2zh', label: '英選中', desc: '看英文選中譯' },
  { id: 'zh2en', label: '中選英', desc: '看中譯選英文' },
  { id: 'listen', label: '聽音選詞', desc: '播放發音選拼寫' },
  { id: 'cloze', label: '例句填空', desc: '看上下文選單字' },
];

const sources: { id: WordSource; label: string }[] = [
  { id: 'all', label: '全部' },
  { id: 'excludeKnown', label: '排除已學會' },
  { id: 'favorites', label: '收藏' },
  { id: 'wrong', label: '錯題清單' },
];

export function QuizSetup({ progress, onStart }: Props) {
  const [level, setLevel] = useState<Level | 'mixed'>('elementary');
  const [types, setTypes] = useState<QuizType[]>(['en2zh']);
  const [count, setCount] = useState<number>(10);
  const [source, setSource] = useState<WordSource>('all');

  const toggleType = (id: QuizType) => {
    setTypes((cur) => (cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id]));
  };

  const available = selectSourceWords({ level, types, count, source }, progress.state).length;

  const canStart = types.length > 0 && available > 0;

  return (
    <div className="max-w-xl mx-auto px-5 py-8 space-y-8">
      <header className="space-y-2">
        <p className="label-sc">Quiz Setup</p>
        <h1 className="font-bold text-3xl text-ink tracking-tight">測驗設定</h1>
      </header>

      <section>
        <h2 className="label-sc mb-3">等級</h2>
        <div className="inline-flex rounded-md border border-line p-0.5 bg-paper/60">
          {(['elementary', 'intermediate', 'mixed'] as const).map((lv) => (
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
              {lv === 'elementary' ? '初級' : lv === 'intermediate' ? '中級' : '混合'}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="label-sc mb-3">題型（可複選）</h2>
        <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2">
          {allTypes.map((t) => {
            const active = types.includes(t.id);
            return (
              <button
                type="button"
                key={t.id}
                onClick={() => toggleType(t.id)}
                className={`text-left px-4 py-3 rounded-md border transition-colors ${
                  active
                    ? 'bg-accent-soft border-accent text-accent'
                    : 'bg-surface border-line hover:border-ink/30'
                }`}
              >
                <div className="font-semibold text-base text-ink">{t.label}</div>
                <div className="text-xs text-ink-soft mt-0.5">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="label-sc mb-3">範圍</h2>
        <div className="flex flex-wrap gap-1.5">
          {sources.map((s) => (
            <button
              type="button"
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                source === s.id
                  ? 'bg-ink border-ink text-paper'
                  : 'bg-surface border-line text-ink-soft hover:text-ink hover:border-ink/30'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-3 text-xs text-ink-mute">
          可用單字：<span className="font-mono font-medium text-ink-soft">{available}</span> 個
        </div>
      </section>

      <section>
        <h2 className="label-sc mb-3">題數</h2>
        <div className="flex flex-wrap gap-1.5">
          {[10, 20, 50].map((n) => (
            <button
              type="button"
              key={n}
              onClick={() => setCount(n)}
              className={`px-4 py-1.5 rounded-full text-sm border transition-colors ${
                count === n
                  ? 'bg-ink border-ink text-paper'
                  : 'bg-surface border-line text-ink-soft hover:text-ink hover:border-ink/30'
              }`}
            >
              {n} 題
            </button>
          ))}
        </div>
      </section>

      <button
        type="button"
        disabled={!canStart}
        onClick={() => onStart({ level, types, count, source })}
        className="w-full py-3 rounded-md bg-ink hover:bg-ink/90 text-paper font-medium tracking-wide disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        {canStart ? '開始測驗' : types.length === 0 ? '請至少選一種題型' : '此範圍沒有單字'}
      </button>
    </div>
  );
}
