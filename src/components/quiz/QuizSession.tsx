import { useEffect, useState } from 'react';
import type { QuizAnswer, QuizQuestion } from '../../types';
import { useSpeech } from '../../hooks/useSpeech';
import { SpeakerButton } from '../shared/SpeakerButton';

interface Props {
  questions: QuizQuestion[];
  onFinish: (answers: QuizAnswer[], durationMs: number) => void;
  onCancel: () => void;
}

export function QuizSession({ questions, onFinish, onCancel }: Props) {
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [startTime] = useState(() => Date.now());
  const { speak } = useSpeech();

  const q = questions[index];

  useEffect(() => {
    if (q.type === 'listen') {
      const t = setTimeout(() => speak(q.word.word), 200);
      return () => clearTimeout(t);
    }
  }, [q, speak]);

  const submit = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    const correct = i === q.answerIndex;
    const next: QuizAnswer = { question: q, selectedIndex: i, correct };
    setAnswers((a) => [...a, next]);
  };

  const next = () => {
    if (index === questions.length - 1) {
      onFinish(answers, Date.now() - startTime);
    } else {
      setIndex(index + 1);
      setSelected(null);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (selected === null && /^[1-4]$/.test(e.key)) {
        const i = parseInt(e.key, 10) - 1;
        if (i < q.options.length) submit(i);
      } else if (selected !== null && e.code === 'Enter') {
        next();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  });

  const isCorrect = selected !== null && selected === q.answerIndex;

  return (
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
        >
          ← 結束測驗
        </button>
        <div className="text-sm text-slate-600 dark:text-slate-400">
          第 {index + 1} / {questions.length} 題
        </div>
      </div>

      <div className="h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div
          className="h-full bg-blue-600 dark:bg-blue-500 transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 sm:p-8">
        <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-3">
          {q.type === 'en2zh'
            ? '請選擇正確的中文意思'
            : q.type === 'zh2en'
              ? '請選擇對應的英文單字'
              : '聽發音選正確拼寫'}
        </div>
        <div className="text-center py-6">
          {q.type === 'en2zh' && (
            <div className="text-3xl sm:text-4xl font-bold">{q.word.word}</div>
          )}
          {q.type === 'zh2en' && (
            <div className="text-2xl sm:text-3xl font-semibold">
              {q.word.zh}
            </div>
          )}
          {q.type === 'listen' && (
            <div className="flex flex-col items-center gap-3">
              <SpeakerButton text={q.word.word} size="lg" />
              <div className="text-xs text-slate-400 dark:text-slate-500">
                點擊喇叭再聽一次
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-2">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isAnswer = i === q.answerIndex;
            const showCorrect = selected !== null && isAnswer;
            const showWrong = isSelected && !isAnswer;
            return (
              <button
                key={i}
                onClick={() => submit(i)}
                disabled={selected !== null}
                className={`text-left px-4 py-3 rounded-lg border transition-colors ${
                  showCorrect
                    ? 'bg-emerald-50 dark:bg-emerald-900/30 border-emerald-500 dark:border-emerald-400 text-emerald-900 dark:text-emerald-200'
                    : showWrong
                      ? 'bg-rose-50 dark:bg-rose-900/30 border-rose-500 dark:border-rose-400 text-rose-900 dark:text-rose-200'
                      : selected !== null
                        ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400'
                        : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-400 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30'
                }`}
              >
                <span className="inline-block w-6 text-slate-400 dark:text-slate-500">
                  {i + 1}.
                </span>
                {opt}
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="mt-4 flex items-center justify-between animate-fade-in">
            <div
              className={`text-sm font-semibold ${
                isCorrect
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {isCorrect
                ? '✓ 答對了'
                : `✗ 正確答案：${q.options[q.answerIndex]}`}
            </div>
            <button
              onClick={next}
              className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white"
            >
              {index === questions.length - 1 ? '看結果' : '下一題 →'}
            </button>
          </div>
        )}
      </div>

      <div className="text-xs text-slate-400 dark:text-slate-500 text-center">
        鍵盤: 1–4 選答  ·  Enter 下一題
      </div>
    </div>
  );
}
