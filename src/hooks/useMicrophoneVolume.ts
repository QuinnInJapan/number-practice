import { useEffect, useRef, useState } from 'react';

/**
 * Returns a 0–1 volume level from the microphone, updated via requestAnimationFrame.
 * Starts/stops the mic stream based on the `active` flag.
 */
export function useMicrophoneVolume(active: boolean): number {
  const [volume, setVolume] = useState(0);
  const contextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    if (!active) {
      setVolume(0);
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

        const dataArray = new Uint8Array(analyser.fftSize);

        function tick() {
          if (cancelled) return;
          analyser.getByteTimeDomainData(dataArray);

          // Compute RMS (root mean square) for volume level
          let sum = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const normalized = (dataArray[i] - 128) / 128;
            sum += normalized * normalized;
          }
          const rms = Math.sqrt(sum / dataArray.length);

          // Scale to 0–1 range (rms is typically 0–0.5 for speech)
          const scaled = Math.min(rms / 0.35, 1);
          setVolume(scaled);

          rafRef.current = requestAnimationFrame(tick);
        }

        rafRef.current = requestAnimationFrame(tick);
      } catch {
        // Mic permission denied or unavailable — silently degrade
      }
    }

    start();

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafRef.current);
      streamRef.current?.getTracks().forEach(t => t.stop());
      streamRef.current = null;
      contextRef.current?.close();
      contextRef.current = null;
      analyserRef.current = null;
      setVolume(0);
    };
  }, [active]);

  return volume;
}
