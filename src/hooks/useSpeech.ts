import { useCallback, useEffect, useState } from 'react';

let cachedVoice: SpeechSynthesisVoice | null = null;
let voicesLoaded = false;

const RATE_KEY = 'gept-speech-rate';
const DEFAULT_RATE = 0.9;

function getStoredRate(): number {
  if (typeof window === 'undefined') return DEFAULT_RATE;
  try {
    const raw = window.localStorage.getItem(RATE_KEY);
    if (raw === null) return DEFAULT_RATE;
    const n = JSON.parse(raw);
    return typeof n === 'number' && n >= 0.5 && n <= 2.0 ? n : DEFAULT_RATE;
  } catch {
    return DEFAULT_RATE;
  }
}

function loadVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    const initial = synth.getVoices();
    if (initial.length > 0) {
      resolve(initial);
      return;
    }
    const onChange = () => {
      synth.removeEventListener('voiceschanged', onChange);
      resolve(synth.getVoices());
    };
    synth.addEventListener('voiceschanged', onChange);
    // Safety net in case 'voiceschanged' never fires
    setTimeout(() => {
      synth.removeEventListener('voiceschanged', onChange);
      resolve(synth.getVoices());
    }, 2000);
  });
}

/**
 * Score English voices and pick the most natural one available on this device.
 * Heuristics, ranked best→worst:
 *   - Modern neural / premium voices ("Premium", "Enhanced", "Neural", "Natural")
 *   - iOS Siri voices ("Siri")
 *   - Google's cloud-backed voices (good on Chrome / Android)
 *   - Known-good macOS/iOS voices (Samantha, Ava, Allison, Tom, Alex, Daniel, Karen)
 *   - en-US over other English locales
 */
function pickBestEnglishVoice(voices: SpeechSynthesisVoice[]): SpeechSynthesisVoice | null {
  if (voices.length === 0) return null;
  const english = voices.filter((v) => v.lang.toLowerCase().startsWith('en'));
  if (english.length === 0) return voices[0] ?? null;

  const scored = english.map((v) => {
    const name = v.name.toLowerCase();
    let score = 0;
    if (name.includes('premium')) score += 20;
    if (name.includes('enhanced')) score += 18;
    if (name.includes('neural')) score += 18;
    if (name.includes('natural')) score += 15;
    if (name.includes('siri')) score += 12;
    if (name.includes('google')) score += 10;
    if (name.includes('samantha')) score += 6;
    if (name.includes('ava')) score += 6;
    if (name.includes('allison')) score += 6;
    if (name.includes('tom')) score += 6;
    if (name.includes('alex')) score += 5;
    if (name.includes('daniel')) score += 5;
    if (name.includes('karen')) score += 5;
    if (v.lang === 'en-US') score += 3;
    else if (v.lang.toLowerCase().startsWith('en-')) score += 1;
    if (v.localService && !name.includes('google')) score += 1;
    return { voice: v, score };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].voice;
}

export function useSpeech() {
  const supported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const [voiceName, setVoiceName] = useState<string | null>(() => cachedVoice?.name ?? null);

  useEffect(() => {
    if (!supported || voicesLoaded) return;
    loadVoices().then((voices) => {
      voicesLoaded = true;
      cachedVoice = pickBestEnglishVoice(voices);
      setVoiceName(cachedVoice?.name ?? null);
    });
  }, [supported]);

  const speak = useCallback(
    (text: string, rateOverride?: number) => {
      if (!supported) return;
      const synth = window.speechSynthesis;
      synth.cancel();
      const utter = new SpeechSynthesisUtterance(text);
      utter.lang = 'en-US';
      utter.rate = rateOverride ?? getStoredRate();
      if (cachedVoice) utter.voice = cachedVoice;
      synth.speak(utter);
    },
    [supported],
  );

  return { speak, supported, voiceName };
}

export const SPEECH_RATE_KEY = RATE_KEY;
export const SPEECH_RATE_DEFAULT = DEFAULT_RATE;
