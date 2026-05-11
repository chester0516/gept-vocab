import type { QuizAnswer } from '../../types';
import { SpeakerButton } from '../shared/SpeakerButton';

interface Props {
  answers: QuizAnswer[];
  durationMs: number;
  onRestart: () => void;
  onHome: () => void;
}

export function QuizResult({ answers, durationMs, onRestart, onHome }: Props) {
  const total = answers.length;
  const correct = answers.filter((a) => a.correct).length;
  const wrong = answers.filter((a) => !a.correct);
  const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
  const seconds = Math.round(durationMs / 1000);
  const mm = Math.floor(seconds / 60);
  const ss = seconds % 60;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 text-center">
        <div className="text-sm text-slate-500 dark:text-slate-400">本次得分</div>
        <div className="text-5xl font-bold text-blue-600 dark:text-blue-400 mt-2">{pct} 分</div>
        <div className="text-sm text-slate-600 dark:text-slate-300 mt-2">
          答對 {correct} / {total} · 用時 {mm > 0 ? `${mm} 分 ` : ''}
          {ss} 秒
        </div>
      </div>

      {wrong.length > 0 && (
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-700 font-semibold">
            錯題回顧（已加入錯題清單）
          </div>
          <ul className="divide-y divide-slate-100 dark:divide-slate-700">
            {wrong.map((a) => (
              <li key={a.question.word.id} className="px-4 py-3 flex items-center gap-3">
                <SpeakerButton text={a.question.word.word} size="sm" />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold">{a.question.word.word}</div>
                  <div className="text-sm text-slate-600 dark:text-slate-300 truncate">
                    {a.question.word.zh}
                  </div>
                </div>
                <div className="text-xs text-slate-400 dark:text-slate-500">
                  {a.question.word.level === 'elementary' ? '初級' : '中級'}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onHome}
          className="flex-1 py-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700"
        >
          回到首頁
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
        >
          再來一輪
        </button>
      </div>
    </div>
  );
}
