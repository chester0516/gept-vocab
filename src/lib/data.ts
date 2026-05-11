import elementaryRaw from '../data/elementary.json';
import intermediateRaw from '../data/intermediate.json';
import type { Level, Word, WordWithLevel } from '../types';

const annotate = (level: Level, words: Word[]): WordWithLevel[] =>
  words.map((w, i) => ({
    ...w,
    level,
    id: `${level}-${i}-${w.word}`,
  }));

export const elementaryWords: WordWithLevel[] = annotate('elementary', elementaryRaw as Word[]);

export const intermediateWords: WordWithLevel[] = annotate(
  'intermediate',
  intermediateRaw as Word[],
);

export const allWords: WordWithLevel[] = [...elementaryWords, ...intermediateWords];

export function getWordsByLevel(level: Level): WordWithLevel[] {
  return level === 'elementary' ? elementaryWords : intermediateWords;
}

export function getLevelStats(level: Level) {
  return getWordsByLevel(level).length;
}
