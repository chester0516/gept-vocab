import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { beforeEach, describe, expect, it } from 'vitest';
import type { UseProgress } from '../../hooks/useProgress';
import type { ProgressState } from '../../types';
import { FlashcardView } from './FlashcardView';

function emptyState(): ProgressState {
  return { knownIds: {}, favoriteIds: {}, wrongIds: {}, history: [] };
}

/**
 * Wraps FlashcardView in a minimal stateful harness so that calling
 * `toggleFavorite` actually mutates the `progress.state.favoriteIds`
 * that flows back into the component as a new prop — mirroring how
 * useProgress works at runtime.
 */
function Harness() {
  const [state, setState] = useState<ProgressState>(emptyState);
  const noop = () => {};
  const progress: UseProgress = {
    state,
    toggleFavorite: (id: string) =>
      setState((s) => {
        if (s.favoriteIds[id]) {
          const next = { ...s.favoriteIds };
          delete next[id];
          return { ...s, favoriteIds: next };
        }
        return { ...s, favoriteIds: { ...s.favoriteIds, [id]: true } };
      }),
    toggleKnown: noop,
    markWrong: noop,
    clearWrong: noop,
    recordQuiz: noop,
    resetAll: noop,
    replace: noop,
    merge: noop,
  };
  return <FlashcardView progress={progress} />;
}

describe('FlashcardView', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('keeps the visible card stable when toggling favorite (regression: PR #14)', () => {
    // Default scope is 'random' and hideKnown=true. With ~1800 elementary words
    // in the deck, the chance of an unrelated reshuffle accidentally landing on
    // the same word at index 0 is ~1/1800 — acceptable as a regression smoke test.
    render(<Harness />);

    const headword = screen.getByTestId('flashcard-headword');
    const wordBefore = headword.textContent;
    expect(wordBefore).toBeTruthy();

    // The card front's star button has aria-label="收藏". The 範圍 row also has
    // a "收藏" button (text content). Card star is rendered first → DOM index 0.
    const starButton = screen.getAllByRole('button', { name: '收藏' })[0];
    fireEvent.click(starButton);

    expect(screen.getByTestId('flashcard-headword').textContent).toBe(wordBefore);
  });

  it('clears the legacy gept-flashcard-order key on mount', () => {
    window.localStorage.setItem('gept-flashcard-order', '"shuffled"');
    expect(window.localStorage.getItem('gept-flashcard-order')).not.toBeNull();

    render(<Harness />);

    expect(window.localStorage.getItem('gept-flashcard-order')).toBeNull();
  });
});
