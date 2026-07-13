import React, { useEffect, useState } from 'react';

interface CountUpProps {
  end: number;
  duration?: number;
  prefix?: string;
  suffix?: string;
}

/**
 * A lightweight, layout-stable numeral animator using requestAnimationFrame.
 * Automatically respects reduced-motion preferences by snapping directly to end value.
 */
export default function CountUp({ end, duration = 1000, prefix = '', suffix = '' }: CountUpProps) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    // Graceful reduced-motion fallback
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setCount(end);
      return;
    }

    let startTimestamp: number | null = null;
    let animFrameId: number;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Smooth ease-out quad curve
      const ease = progress * (2 - progress);
      setCount(ease * end);

      if (progress < 1) {
        animFrameId = window.requestAnimationFrame(step);
      }
    };

    animFrameId = window.requestAnimationFrame(step);

    return () => {
      if (animFrameId) {
        window.cancelAnimationFrame(animFrameId);
      }
    };
  }, [end, duration]);

  return (
    <span className="font-mono tabular-nums">
      {prefix}
      {Math.round(count)}
      {suffix}
    </span>
  );
}
