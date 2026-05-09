import { useState } from 'react';
import type {
  Level,
  QuizAnswer,
  QuizQuestion,
  QuizType,
  WordSource,
} from '../../types';
import type { UseProgress } from '../../hooks/useProgress';
import { buildQuiz } from '../../lib/quiz';
import { QuizSetup } from './QuizSetup';
import { QuizSession } from './QuizSession';
import { QuizResult } from './QuizResult';

type Stage =
  | { kind: 'setup' }
  | { kind: 'session'; questions: QuizQuestion[]; level: Level | 'mixed' }
  | {
      kind: 'result';
      answers: QuizAnswer[];
      durationMs: number;
      level: Level | 'mixed';
    };

interface Props {
  progress: UseProgress;
  onHome: () => void;
}

export function QuizView({ progress, onHome }: Props) {
  const [stage, setStage] = useState<Stage>({ kind: 'setup' });

  const startQuiz = (config: {
    level: Level | 'mixed';
    types: QuizType[];
    count: number;
    source: WordSource;
  }) => {
    const questions = buildQuiz(config, progress.state);
    if (questions.length === 0) return;
    setStage({ kind: 'session', questions, level: config.level });
  };

  const finishQuiz = (answers: QuizAnswer[], durationMs: number) => {
    if (stage.kind !== 'session') return;
    answers.forEach((a) => {
      if (!a.correct) progress.markWrong(a.question.word.id);
      else progress.clearWrong(a.question.word.id);
    });
    progress.recordQuiz({
      date: Date.now(),
      level: stage.level,
      total: answers.length,
      correct: answers.filter((a) => a.correct).length,
      durationMs,
    });
    setStage({
      kind: 'result',
      answers,
      durationMs,
      level: stage.level,
    });
  };

  if (stage.kind === 'setup') {
    return <QuizSetup progress={progress} onStart={startQuiz} />;
  }
  if (stage.kind === 'session') {
    return (
      <QuizSession
        questions={stage.questions}
        onFinish={finishQuiz}
        onCancel={() => setStage({ kind: 'setup' })}
      />
    );
  }
  return (
    <QuizResult
      answers={stage.answers}
      durationMs={stage.durationMs}
      onRestart={() => setStage({ kind: 'setup' })}
      onHome={onHome}
    />
  );
}
