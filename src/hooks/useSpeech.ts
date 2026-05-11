import { useCallback } from 'react';

export function useSpeech() {
  const speak = useCallback((text: string, rate = 0.9) => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    utter.rate = rate;
    synth.speak(utter);
  }, []);

  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;

  return { speak, supported };
}
