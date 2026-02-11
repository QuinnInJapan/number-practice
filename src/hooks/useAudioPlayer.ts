import { useRef, useCallback, useEffect, useState } from 'react';
import type { Language } from '../types';
import { NumberConverter } from '../services/NumberConverter';

const converter = new NumberConverter();

export function useAudioPlayer() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load TTS voices when available
  useEffect(() => {
    const loadVoices = () => {
      const availableVoices = speechSynthesis.getVoices();
      if (availableVoices.length > 0) {
        setVoices(availableVoices);
      }
    };

    loadVoices();
    speechSynthesis.addEventListener('voiceschanged', loadVoices);

    return () => {
      speechSynthesis.removeEventListener('voiceschanged', loadVoices);
    };
  }, []);

  const getVoice = useCallback((language: Language): SpeechSynthesisVoice | null => {
    const langCode = language === 'ja' ? 'ja' : 'en';

    // Prefer native voices over Google voices
    const nativeVoice = voices.find(v =>
      v.lang.startsWith(langCode) && !v.name.includes('Google')
    );
    if (nativeVoice) return nativeVoice;

    // Fall back to any voice for the language
    const anyVoice = voices.find(v => v.lang.startsWith(langCode));
    return anyVoice || null;
  }, [voices]);

  /**
   * Try to play a single audio file path
   */
  const tryPlayPath = useCallback((audioPath: string): Promise<boolean> => {
    return new Promise((resolve) => {
      const audio = new Audio(audioPath);
      audioRef.current = audio;

      audio.onended = () => {
        audioRef.current = null;
        resolve(true);
      };

      audio.onerror = () => {
        audioRef.current = null;
        resolve(false);
      };

      audio.play().catch(() => {
        audioRef.current = null;
        resolve(false);
      });
    });
  }, []);

  /**
   * Try to play audio file, trying multiple extensions. Returns true if successful.
   */
  const tryPlayFile = useCallback(async (number: number, language: Language): Promise<boolean> => {
    // Try mp3 first (OpenAI TTS output), then wav (legacy)
    const extensions = ['mp3', 'wav'];

    for (const ext of extensions) {
      const audioPath = `${import.meta.env.BASE_URL}audio/${number}_${language}.${ext}`;
      const success = await tryPlayPath(audioPath);
      if (success) {
        return true;
      }
    }

    return false;
  }, [tryPlayPath]);

  /**
   * Play using Text-to-Speech as fallback
   */
  const playTTS = useCallback((number: number, language: Language): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Convert number to text
      const text = language === 'ja'
        ? converter.toJapanese(number)
        : converter.toEnglish(number);

      const utterance = new SpeechSynthesisUtterance(text);
      utteranceRef.current = utterance;

      // Set language
      utterance.lang = language === 'ja' ? 'ja-JP' : 'en-US';

      // Set voice if available
      const voice = getVoice(language);
      if (voice) {
        utterance.voice = voice;
      }

      // Adjust rate for clarity
      utterance.rate = language === 'ja' ? 0.9 : 1.0;

      utterance.onend = () => {
        utteranceRef.current = null;
        resolve();
      };

      utterance.onerror = (event) => {
        utteranceRef.current = null;
        if (event.error === 'interrupted' || event.error === 'canceled') {
          resolve();
        } else {
          reject(new Error(`Speech synthesis error: ${event.error}`));
        }
      };

      speechSynthesis.speak(utterance);
    });
  }, [getVoice]);

  /**
   * Play a number: try pre-recorded file first, fallback to TTS
   */
  const playNumber = useCallback(async (number: number, language: Language): Promise<void> => {
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    speechSynthesis.cancel();

    // Try file first
    const fileSuccess = await tryPlayFile(number, language);
    if (fileSuccess) {
      return;
    }

    // Fallback to TTS
    console.log(`Audio file not found for ${number}_${language}, using TTS`);
    await playTTS(number, language);
  }, [tryPlayFile, playTTS]);

  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    speechSynthesis.cancel();
    utteranceRef.current = null;
  }, []);

  return { playNumber, stop };
}
