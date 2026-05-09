import { useState } from 'react';
import type { Level, QuizType, WordSource } from '../../types';
import type { UseProgress } from '../../hooks/useProgress';
import { selectSourceWords } from '../../lib/quiz';

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
    setTypes((cur) =>
      cur.includes(id) ? cur.filter((t) => t !== id) : [...cur, id],
    );
  };

  const available = selectSourceWords(
    { level, types, count, source },
    progress.state,
  ).length;

  const canStart = types.length > 0 && available > 0;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h2 className="text-lg font-semibold mb-3">等級</h2>
        <div className="inline-flex rounded-lg bg-slate-100 p-1">
          {(['elementary', 'intermediate', 'mixed'] as const).map((lv) => (
            <button
              key={lv}
              onClick={() => setLevel(lv)}
              className={`px-4 py-1.5 text-sm rounded-md ${
                level === lv
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600'
              }`}
            >
              {lv === 'elementary'
                ? '初級'
                : lv === 'intermediate'
                  ? '中級'
                  : '混合'}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">題型（可複選）</h2>
        <div className="grid sm:grid-cols-3 gap-2">
          {allTypes.map((t) => {
            const active = types.includes(t.id);
            return (
              <button
                key={t.id}
                onClick={() => toggleType(t.id)}
                className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                  active
                    ? 'bg-blue-50 border-blue-500 text-blue-900'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="font-semibold">{t.label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{t.desc}</div>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">範圍</h2>
        <div className="flex flex-wrap gap-2">
          {sources.map((s) => (
            <button
              key={s.id}
              onClick={() => setSource(s.id)}
              className={`px-3 py-1.5 rounded-full text-sm ${
                source === s.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mt-2 text-sm text-slate-500">
          可用單字：{available} 個
        </div>
      </div>

      <div>
        <h2 className="text-lg font-semibold mb-3">題數</h2>
        <div className="flex flex-wrap gap-2">
          {[10, 20, 50].map((n) => (
            <button
              key={n}
              onClick={() => setCount(n)}
              className={`px-4 py-1.5 rounded-full text-sm ${
                count === n
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-slate-200 text-slate-700'
              }`}
            >
              {n} 題
            </button>
          ))}
        </div>
      </div>

      <button
        disabled={!canStart}
        onClick={() => onStart({ level, types, count, source })}
        className="w-full py-3 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {canStart
          ? '開始測驗'
          : types.length === 0
            ? '請至少選一種題型'
            : '此範圍沒有單字'}
      </button>
    </div>
  );
}
