import { useEffect, useState } from 'react';
import { useSpeech } from '../../hooks/useSpeech';
import type { QuizAnswer, QuizQuestion } from '../../types';
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
  const prompt =
    q.type === 'en2zh'
      ? '請選擇正確的中文意思'
      : q.type === 'zh2en'
        ? '請選擇對應的英文單字'
        : '聽發音選正確拼寫';

  return (
    <div className="max-w-xl mx-auto px-5 py-8 space-y-6">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="text-sm text-ink-soft hover:text-ink transition-colors"
        >
          ← 結束測驗
        </button>
        <div className="text-sm font-mono text-ink-soft">
          第 <span className="font-medium text-ink">{index + 1}</span>
          <span className="text-ink-mute"> / </span>
          {questions.length} 題
        </div>
      </div>

      <div className="h-px bg-line relative overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 bg-accent transition-all"
          style={{ width: `${((index + 1) / questions.length) * 100}%` }}
        />
      </div>

      <div className="bg-surface rounded-md border border-line p-6 sm:p-8 space-y-5">
        <div className="label-sc">{prompt}</div>
        <div className="text-center py-4">
          {q.type === 'en2zh' && (
            <div className="font-bold text-4xl sm:text-5xl text-ink tracking-tight">
              {q.word.word}
            </div>
          )}
          {q.type === 'zh2en' && (
            <div className="font-bold text-3xl sm:text-4xl text-ink tracking-tight">
              {q.word.zh}
            </div>
          )}
          {q.type === 'listen' && (
            <div className="flex flex-col items-center gap-3">
              <SpeakerButton text={q.word.word} size="lg" />
              <div className="label-sc">點擊喇叭再聽一次</div>
            </div>
          )}
        </div>

        <div className="grid gap-2">
          {q.options.map((opt, i) => {
            const isSelected = selected === i;
            const isAnswer = i === q.answerIndex;
            const showCorrect = selected !== null && isAnswer;
            const showWrong = isSelected && !isAnswer;
            const base =
              'text-left px-4 py-3 rounded-md border transition-colors flex items-baseline gap-3';
            const variant = showCorrect
              ? 'bg-success/10 border-success text-success'
              : showWrong
                ? 'bg-danger/10 border-danger text-danger'
                : selected !== null
                  ? 'bg-surface border-line text-ink-mute'
                  : 'bg-surface border-line text-ink hover:border-ink/40 hover:bg-paper';
            return (
              <button
                type="button"
                key={opt}
                onClick={() => submit(i)}
                disabled={selected !== null}
                className={`${base} ${variant}`}
              >
                <span className="font-mono text-xs text-ink-mute w-5 shrink-0">{i + 1}</span>
                <span className="font-medium text-base">{opt}</span>
              </button>
            );
          })}
        </div>

        {selected !== null && (
          <div className="flex items-center justify-between animate-fade-in pt-2">
            <div className={`text-sm font-medium ${isCorrect ? 'text-success' : 'text-danger'}`}>
              {isCorrect ? '✓ 答對了' : `✗ 正確答案：${q.options[q.answerIndex]}`}
            </div>
            <button
              type="button"
              onClick={next}
              className="px-4 py-2 rounded-md bg-ink hover:bg-ink/90 text-paper font-medium transition-colors"
            >
              {index === questions.length - 1 ? '看結果' : '下一題 →'}
            </button>
          </div>
        )}
      </div>

      <div className="text-[11px] text-ink-mute text-center tracking-wide">
        鍵盤 1–4 選答 · Enter 下一題
      </div>
    </div>
  );
}
