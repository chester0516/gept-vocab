export type Level = 'elementary' | 'intermediate';

export interface Word {
  word: string;
  pos: string;
  zh: string;
  example?: string;
  example_zh?: string;
}

export interface WordWithLevel extends Word {
  level: Level;
  id: string;
}

export type View = 'home' | 'flashcard' | 'quiz' | 'library';

export type QuizType = 'en2zh' | 'zh2en' | 'listen';

export interface QuizQuestion {
  type: QuizType;
  word: WordWithLevel;
  options: string[];
  answerIndex: number;
}

export interface QuizAnswer {
  question: QuizQuestion;
  selectedIndex: number;
  correct: boolean;
}

export interface QuizRecord {
  date: number;
  level: Level | 'mixed';
  total: number;
  correct: number;
  durationMs: number;
}

export interface ProgressState {
  knownIds: Record<string, true>;
  favoriteIds: Record<string, true>;
  wrongIds: Record<string, true>;
  history: QuizRecord[];
}

export type WordSource =
  | 'all'
  | 'favorites'
  | 'wrong'
  | 'excludeKnown';
