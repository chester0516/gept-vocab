import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useLocalStorageState } from './useLocalStorageState';

describe('useLocalStorageState', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('uses initialValue when nothing is stored', () => {
    const { result } = renderHook(() => useLocalStorageState('k', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('reads existing value from localStorage on mount', () => {
    window.localStorage.setItem('k', JSON.stringify('stored'));
    const { result } = renderHook(() => useLocalStorageState('k', 'fallback'));
    expect(result.current[0]).toBe('stored');
  });

  it('persists value to localStorage when setter is called', () => {
    const { result } = renderHook(() => useLocalStorageState<number>('k', 0));
    act(() => {
      result.current[1](42);
    });
    expect(result.current[0]).toBe(42);
    expect(JSON.parse(window.localStorage.getItem('k') ?? 'null')).toBe(42);
  });

  it('falls back to initialValue when stored JSON is malformed', () => {
    window.localStorage.setItem('k', '{not json');
    const { result } = renderHook(() => useLocalStorageState('k', 'fallback'));
    expect(result.current[0]).toBe('fallback');
  });

  it('preserves complex object types through the round-trip', () => {
    const initial = { count: 0, tags: ['a', 'b'] };
    const { result, rerender } = renderHook(() => useLocalStorageState('k', initial));
    act(() => {
      result.current[1]({ count: 5, tags: ['c'] });
    });
    rerender();
    expect(result.current[0]).toEqual({ count: 5, tags: ['c'] });
  });

  it('supports a function updater', () => {
    const { result } = renderHook(() => useLocalStorageState<number>('k', 10));
    act(() => {
      result.current[1]((prev) => prev + 5);
    });
    expect(result.current[0]).toBe(15);
  });
});
