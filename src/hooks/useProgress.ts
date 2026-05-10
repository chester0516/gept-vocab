import { useCallback, useEffect, useState } from 'react';
import type { ProgressState, QuizRecord } from '../types';
import {
  addId,
  appendRecord,
  loadProgress,
  mergeProgress,
  removeId,
  saveProgress,
  toggleId,
} from '../lib/progress';

export function useProgress() {
  const [state, setState] = useState<ProgressState>(() => loadProgress());

  useEffect(() => {
    saveProgress(state);
  }, [state]);

  const toggleKnown = useCallback((id: string) => {
    setState((s) => ({ ...s, knownIds: toggleId(s.knownIds, id) }));
  }, []);

  const toggleFavorite = useCallback((id: string) => {
    setState((s) => ({ ...s, favoriteIds: toggleId(s.favoriteIds, id) }));
  }, []);

  const markWrong = useCallback((id: string) => {
    setState((s) => ({ ...s, wrongIds: addId(s.wrongIds, id) }));
  }, []);

  const clearWrong = useCallback((id: string) => {
    setState((s) => ({ ...s, wrongIds: removeId(s.wrongIds, id) }));
  }, []);

  const recordQuiz = useCallback((record: QuizRecord) => {
    setState((s) => ({ ...s, history: appendRecord(s.history, record) }));
  }, []);

  const resetAll = useCallback(() => {
    setState({ knownIds: {}, favoriteIds: {}, wrongIds: {}, history: [] });
  }, []);

  const replace = useCallback((next: ProgressState) => {
    setState(next);
  }, []);

  const merge = useCallback((other: ProgressState) => {
    setState((s) => mergeProgress(s, other));
  }, []);

  return {
    state,
    toggleKnown,
    toggleFavorite,
    markWrong,
    clearWrong,
    recordQuiz,
    resetAll,
    replace,
    merge,
  };
}

export type UseProgress = ReturnType<typeof useProgress>;
