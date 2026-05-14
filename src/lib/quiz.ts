import type {
  Level,
  ProgressState,
  QuizQuestion,
  QuizType,
  WordSource,
  WordWithLevel,
} from '../types';
import { allWords, elementaryWords, getWordsByLevel, intermediateWords } from './data';

function shuffle<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pickDistractors(
  pool: WordWithLevel[],
  exclude: WordWithLevel,
  count: number,
  field: 'word' | 'zh',
): string[] {
  const seen = new Set<string>([exclude[field]]);
  const out: string[] = [];
  const shuffled = shuffle(pool);
  for (const w of shuffled) {
    if (out.length === count) break;
    const v = w[field];
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
  }
  return out;
}

export function buildQuestion(
  word: WordWithLevel,
  type: QuizType,
  pool: WordWithLevel[],
): QuizQuestion {
  if (type === 'en2zh') {
    const distractors = pickDistractors(pool, word, 3, 'zh');
    const options = shuffle([word.zh, ...distractors]);
    return {
      type,
      word,
      options,
      answerIndex: options.indexOf(word.zh),
    };
  }
  if (type === 'zh2en') {
    const distractors = pickDistractors(pool, word, 3, 'word');
    const options = shuffle([word.word, ...distractors]);
    return {
      type,
      word,
      options,
      answerIndex: options.indexOf(word.word),
    };
  }
  // listen
  const distractors = pickDistractors(pool, word, 3, 'word');
  const options = shuffle([word.word, ...distractors]);
  return {
    type,
    word,
    options,
    answerIndex: options.indexOf(word.word),
  };
}

export interface QuizConfig {
  level: Level | 'mixed';
  types: QuizType[];
  count: number;
  source: WordSource;
  showClozeHint?: boolean;
}

export function selectSourceWords(config: QuizConfig, progress: ProgressState): WordWithLevel[] {
  let pool: WordWithLevel[];
  if (config.level === 'mixed') pool = allWords;
  else pool = getWordsByLevel(config.level);

  if (config.source === 'favorites') {
    pool = pool.filter((w) => progress.favoriteIds[w.id]);
  } else if (config.source === 'wrong') {
    pool = pool.filter((w) => progress.wrongIds[w.id]);
  } else if (config.source === 'excludeKnown') {
    pool = pool.filter((w) => !progress.knownIds[w.id]);
  }
  return pool;
}

export function buildQuiz(config: QuizConfig, progress: ProgressState): QuizQuestion[] {
  const sourcePool = selectSourceWords(config, progress);
  if (sourcePool.length === 0) return [];

  // Distractor pool: prefer the same level for similarity, fall back to all.
  const distractorPool =
    config.level === 'mixed'
      ? allWords
      : config.level === 'elementary'
        ? elementaryWords
        : intermediateWords;

  const types = config.types.length > 0 ? config.types : ['en2zh' as QuizType];

  const picked = shuffle(sourcePool).slice(0, Math.min(config.count, sourcePool.length));

  return picked.map((word, i) => {
    const type = types[i % types.length];
    return buildQuestion(word, type, distractorPool);
  });
}
