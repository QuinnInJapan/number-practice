import { useEffect, useRef } from 'react';
import './Waveform.css';

interface WaveformProps {
  analyserRef: React.RefObject<AnalyserNode | null>;
  active: boolean;
}

export function Waveform({ analyserRef, active }: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    if (!active) return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resolve CSS variables for theming
    const style = getComputedStyle(canvas);
    const color = style.getPropertyValue('--color-primary').trim() || '#d48a18';

    function draw() {
      rafRef.current = requestAnimationFrame(draw);

      const analyser = analyserRef.current;
      if (!analyser || !canvas || !ctx) return;

      const bufferLength = analyser.fftSize;
      const dataArray = new Uint8Array(bufferLength);
      analyser.getByteTimeDomainData(dataArray);

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      // Size canvas backing store for sharp rendering
      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, width, height);

      ctx.lineWidth = 2;
      ctx.strokeStyle = color;
      ctx.beginPath();

      const sliceWidth = width / (bufferLength - 1);
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const v = dataArray[i] / 128.0; // 0–2 centered at 1
        const y = (v * height) / 2;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
        x += sliceWidth;
      }

      ctx.stroke();
    }

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(rafRef.current);
    };
  }, [active, analyserRef]);

  return <canvas ref={canvasRef} className="waveform-canvas" />;
}
