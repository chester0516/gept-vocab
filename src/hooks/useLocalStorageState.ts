import { type Dispatch, type SetStateAction, useEffect, useState } from 'react';

/**
 * useState that mirrors its value into localStorage under `key`.
 * Falls back to `initialValue` if no entry exists, parse fails, or storage is unavailable.
 */
export function useLocalStorageState<T>(
  key: string,
  initialValue: T,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initialValue;
    try {
      const raw = window.localStorage.getItem(key);
      return raw !== null ? (JSON.parse(raw) as T) : initialValue;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // quota / serialization error — silently ignore
    }
  }, [key, value]);

  return [value, setValue];
}
