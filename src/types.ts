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

export type QuizType = 'en2zh' | 'zh2en' | 'listen' | 'cloze';

export interface QuizQuestion {
  type: QuizType;
  word: WordWithLevel;
  options: string[];
  answerIndex: number;
  // cloze 專用（其他題型為 undefined）
  prompt?: string; // 已挖空例句: "The doctor ______ me to drink more water"
  promptZh?: string; // example_zh，僅在 showClozeHint=true 時填入
  blankAnswer?: string; // 原例句中該字實際出現的形態（變形原樣，保留大小寫）
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

export type WordSource = 'all' | 'favorites' | 'wrong' | 'excludeKnown';
