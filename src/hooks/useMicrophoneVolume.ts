import { useEffect, useRef } from 'react';

export interface MicrophoneHandle {
  /** AnalyserNode for reading waveform/frequency data. Null when inactive. */
  analyserRef: React.RefObject<AnalyserNode | null>;
}

/**
 * Opens a microphone stream and exposes the AnalyserNode for visualization.
 * Starts/stops based on the `active` flag. Cleans up on deactivation.
 */
export function useMicrophone(active: boolean): MicrophoneHandle {
  const analyserRef = useRef<AnalyserNode | null>(null);
  const contextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (!active) {
      return;
    }

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach(t => t.stop());
          return;
        }
        streamRef.current = stream;

        const ctx = new AudioContext();
        contextRef.current = ctx;

        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
      } catch {
        // Mic permission denied or unavailable — silently degrade
      }
    }

    start();

    return () => {
      cancelled = true;
      analyserRef.current = null;
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      contextRef.current?.close();
      contextRef.current = null;
    };
  }, [active]);

  return { analyserRef };
}
