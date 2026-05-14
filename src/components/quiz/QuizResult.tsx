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
    <div className="max-w-xl mx-auto px-5 py-8 space-y-8">
      <div className="bg-surface rounded-md border border-line p-8 text-center">
        <p className="label-sc">本次得分</p>
        <div className="font-mono font-semibold text-7xl text-ink tabular-nums mt-4 leading-none">
          {pct}
          <span className="font-sans font-normal text-3xl text-ink-mute ml-2 align-baseline">
            分
          </span>
        </div>
        <div className="mt-5 flex items-center justify-center gap-3 text-sm text-ink-soft">
          <span>
            答對 <span className="font-mono font-medium text-ink tabular-nums">{correct}</span>
            <span className="text-ink-mute"> / </span>
            <span className="font-mono tabular-nums">{total}</span>
          </span>
          <span className="text-ink-mute">·</span>
          <span>
            用時{' '}
            <span className="font-mono text-ink">
              {mm > 0 ? `${mm}'` : ''}
              {String(ss).padStart(2, '0')}"
            </span>
          </span>
        </div>
      </div>

      {wrong.length > 0 && (
        <div className="bg-surface rounded-md border border-line overflow-hidden">
          <div className="px-5 py-4 border-b border-line flex items-baseline justify-between">
            <h2 className="font-bold text-lg text-ink">錯題回顧</h2>
            <span className="label-sc">已加入錯題清單</span>
          </div>
          <ul className="divide-y divide-line">
            {wrong.map((a) => {
              const q = a.question;
              if (q.type === 'cloze') {
                const example = q.word.example ?? '';
                const idx = q.blankAnswer ? example.indexOf(q.blankAnswer) : -1;
                const before = idx >= 0 ? example.slice(0, idx) : example;
                const after =
                  idx >= 0 && q.blankAnswer ? example.slice(idx + q.blankAnswer.length) : '';
                return (
                  <li key={q.word.id} className="px-5 py-3 space-y-1">
                    <div className="text-sm text-ink leading-relaxed">
                      {before}
                      <span className="font-semibold text-success">[{q.blankAnswer}]</span>
                      {after}
                    </div>
                    <div className="text-xs text-ink-mute">
                      你選：
                      <span className="font-medium text-danger">{q.options[a.selectedIndex]}</span>
                      <span className="ml-2 text-ink-mute">正解：{q.options[q.answerIndex]}</span>
                    </div>
                  </li>
                );
              }
              return (
                <li key={q.word.id} className="px-5 py-3 flex items-center gap-3">
                  <SpeakerButton text={q.word.word} size="sm" />
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-lg text-ink">{q.word.word}</div>
                    <div className="text-sm text-ink-soft truncate">{q.word.zh}</div>
                  </div>
                  <div className="label-sc">{q.word.level === 'elementary' ? '初級' : '中級'}</div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onHome}
          className="flex-1 py-3 rounded-md bg-surface border border-line text-ink hover:border-ink/30 transition-colors"
        >
          回到首頁
        </button>
        <button
          type="button"
          onClick={onRestart}
          className="flex-1 py-3 rounded-md bg-ink hover:bg-ink/90 text-paper font-medium transition-colors"
        >
          再來一輪
        </button>
      </div>
    </div>
  );
}
