import { useEffect, useRef } from 'react';
import './Waveform.css';

interface WaveformProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  active: boolean;
}

const BAR_WIDTH = 3;
const BAR_GAP = 2;
const SAMPLE_INTERVAL_MS = 50;

export function Waveform({ analyserRef, active }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);
  const barsRef = useRef<number[]>([]);
  const lastSampleRef = useRef(0);

  useEffect(() => {
    if (!active) {
      barsRef.current = [];
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const style = getComputedStyle(canvas);
    const color = style.getPropertyValue('--color-primary').trim() || '#d48a18';

    function draw(time: number) {
      rafRef.current = requestAnimationFrame(draw);

      const analyser = analyserRef.current;
      if (!analyser || !canvas || !ctx) return;

      // Sample volume at fixed intervals
      if (time - lastSampleRef.current >= SAMPLE_INTERVAL_MS) {
        lastSampleRef.current = time;

        const dataArray = new Uint8Array(analyser.fftSize);
        analyser.getByteTimeDomainData(dataArray);

        // Compute RMS volume
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const v = (dataArray[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const volume = Math.min(rms / 0.35, 1);

        // Calculate max bars that fit
        const maxBars = Math.floor(canvas.clientWidth / (BAR_WIDTH + BAR_GAP));
        barsRef.current.push(volume);
        if (barsRef.current.length > maxBars) {
          barsRef.current.shift();
        }
      }

      // Draw
      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      const bars = barsRef.current;
      const totalBarWidth = BAR_WIDTH + BAR_GAP;
      const centerY = height / 2;
      const minBarHeight = 2;
      const maxBarHeight = height * 0.9;

      // Draw bars right-aligned (newest on right)
      const startX = width - bars.length * totalBarWidth;

      ctx.fillStyle = color;

      for (let i = 0; i < bars.length; i++) {
        const barHeight = Math.max(minBarHeight, bars[i] * maxBarHeight);
        const x = startX + i * totalBarWidth;
        const y = centerY - barHeight / 2;

        // Rounded bars via small radius
        const radius = BAR_WIDTH / 2;
        ctx.beginPath();
        ctx.roundRect(x, y, BAR_WIDTH, barHeight, radius);
        ctx.fill();
      }
    }

    lastSampleRef.current = 0;
    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, analyserRef]);

  return <canvas ref={canvasRef} className="waveform-canvas" />;
}
