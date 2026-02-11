import { useRef, useCallback, useState } from 'react';
import type { Language } from '../types';

// After receiving a final speech result, wait this long for more speech
// before auto-stopping. This prevents the recording from hanging after
// the user has finished speaking.
const SILENCE_AFTER_SPEECH_MS = 800;

// TypeScript declarations for Web Speech API
interface SpeechRecognitionEvent extends Event {
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionResultList {
  length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}

interface SpeechRecognitionResult {
  length: number;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
  isFinal: boolean;
}

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: Event & { error: string }) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

function createRecognition(lang: string): SpeechRecognition {
  const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognitionCtor();
  recognition.continuous = true;
  recognition.interimResults = false;
  recognition.maxAlternatives = 3;
  recognition.lang = lang;
  return recognition;
}

export function useSpeechRecognition() {
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isListening, setIsListening] = useState(false);
  const resolveRef = useRef<((value: string) => void) | null>(null);
  const rejectRef = useRef<((reason: Error) => void) | null>(null);
  const settledRef = useRef(false);
  const stoppedRef = useRef(false);
  const langRef = useRef('en-US');

  const transcriptRef = useRef('');
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSilenceTimer = useCallback(() => {
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const setupRecognition = useCallback((recognition: SpeechRecognition) => {
    // Capture instance identity so stale events from aborted/replaced
    // recognition objects are ignored (fixes restart() race condition).
    const thisRecognition = recognition;

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      if (recognitionRef.current !== thisRecognition) return;

      // Accumulate all final results
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal && event.results[i].length > 0) {
          transcriptRef.current += event.results[i][0].transcript;
        }
      }

      // Start/reset silence timer — if no more speech comes, auto-stop
      clearSilenceTimer();
      silenceTimerRef.current = setTimeout(() => {
        if (recognitionRef.current !== thisRecognition) return;
        stoppedRef.current = true;
        if (!settledRef.current) {
          settledRef.current = true;
          setIsListening(false);
          resolveRef.current?.(transcriptRef.current);
        }
        recognitionRef.current.stop();
      }, SILENCE_AFTER_SPEECH_MS);
    };

    recognition.onerror = (event) => {
      if (recognitionRef.current !== thisRecognition) return;
      if (settledRef.current) return;
      // With continuous mode, no-speech just means silence — ignore it
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') {
        // stop() or abort() was called — if already replaced by restart(), ignore
        return;
      }
      settledRef.current = true;
      setIsListening(false);
      clearSilenceTimer();
      rejectRef.current?.(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition.onend = () => {
      if (recognitionRef.current !== thisRecognition) return;

      // In continuous mode, the browser may still end (e.g., long silence).
      // If we haven't been stopped, try to keep listening.
      if (!stoppedRef.current && !settledRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // Can't restart same instance — try a fresh one
          try {
            const fresh = createRecognition(langRef.current);
            recognitionRef.current = fresh;
            setupRecognition(fresh);
            fresh.start();
            return;
          } catch {
            // Truly can't recover — resolve with what we have
          }
        }
      }
      if (!settledRef.current) {
        settledRef.current = true;
        setIsListening(false);
        clearSilenceTimer();
        resolveRef.current?.(transcriptRef.current);
      }
    };
  }, [clearSilenceTimer]);

  const listen = useCallback(async (language: Language): Promise<string> => {
    return new Promise((resolve, reject) => {
      const SpeechRecognitionCtor = window.SpeechRecognition || window.webkitSpeechRecognition;

      if (!SpeechRecognitionCtor) {
        reject(new Error('Speech Recognition not supported'));
        return;
      }

      settledRef.current = false;
      stoppedRef.current = false;
      transcriptRef.current = '';
      resolveRef.current = resolve;
      rejectRef.current = reject;
      clearSilenceTimer();

      const lang = language === 'ja' ? 'ja-JP' : 'en-US';
      langRef.current = lang;

      const recognition = createRecognition(lang);
      recognitionRef.current = recognition;
      setupRecognition(recognition);

      setIsListening(true);
      recognition.start();
    });
  }, [setupRecognition, clearSilenceTimer]);

  const stop = useCallback(() => {
    stoppedRef.current = true;
    clearSilenceTimer();
    if (recognitionRef.current) {
      // Resolve with accumulated transcript before stopping
      if (!settledRef.current) {
        settledRef.current = true;
        setIsListening(false);
        resolveRef.current?.(transcriptRef.current);
      }
      recognitionRef.current.stop();
    }
  }, [clearSilenceTimer]);

  const restart = useCallback(() => {
    clearSilenceTimer();

    const old = recognitionRef.current;

    // Create the new instance and update recognitionRef BEFORE aborting the
    // old one. This way, even if abort() fires events synchronously, the
    // stale-instance guard (recognitionRef.current !== thisRecognition) in
    // the old handlers will see the ref has changed and bail out.
    const recognition = createRecognition(langRef.current);
    recognitionRef.current = recognition;

    if (old) {
      try { old.abort(); } catch { /* ignore */ }
    }

    // Reset state for fresh recording
    transcriptRef.current = '';
    settledRef.current = false;
    stoppedRef.current = false;

    setupRecognition(recognition);
    setIsListening(true);
    recognition.start();
  }, [setupRecognition, clearSilenceTimer]);

  return { listen, stop, restart, isListening };
}

export function checkSpeechSupport(): boolean {
  return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
}
