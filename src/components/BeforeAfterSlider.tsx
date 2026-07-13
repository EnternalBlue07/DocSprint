import React, { useState, useRef, useCallback, useEffect } from 'react';

interface BeforeAfterSliderProps {
  beforeUrl: string;
  afterUrl: string;
  beforeLabel?: string;
  afterLabel?: string;
  className?: string;
}

/**
 * Draggable before/after comparison slider.
 * Renders two images stacked with a clip-path divider the user can drag.
 * Features smooth spring-back inertia on snap, click, and arrow keyboard adjustments.
 */
export default function BeforeAfterSlider({
  beforeUrl,
  afterUrl,
  beforeLabel = 'Original',
  afterLabel = 'Processed',
  className = '',
}: BeforeAfterSliderProps) {
  const [sliderX, setSliderX] = useState(50); // percentage 0–100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const dragActiveRef = useRef(false);

  const updateSlider = useCallback((clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();
    const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
    setSliderX((x / rect.width) * 100);
  }, []);

  const handleMouseDown = (e: React.MouseEvent) => {
    dragActiveRef.current = true;
    setIsDragging(true);
    updateSlider(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragActiveRef.current = true;
    setIsDragging(true);
    updateSlider(e.touches[0].clientX);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enable spring-back transition for keyboard controls
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setSliderX((prev) => Math.max(0, prev - 8));
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      setSliderX((prev) => Math.min(100, prev + 8));
    } else if (e.key === 'Home') {
      e.preventDefault();
      setSliderX(0);
    } else if (e.key === 'End') {
      e.preventDefault();
      setSliderX(100);
    }
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (dragActiveRef.current) updateSlider(e.clientX);
    };
    const handleTouchMove = (e: TouchEvent) => {
      if (dragActiveRef.current) updateSlider(e.touches[0].clientX);
    };
    const stopDrag = () => {
      dragActiveRef.current = false;
      setIsDragging(false);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', stopDrag);
    window.addEventListener('touchmove', handleTouchMove, { passive: true });
    window.addEventListener('touchend', stopDrag);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', stopDrag);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', stopDrag);
    };
  }, [updateSlider]);

  // Reduced motion query check
  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const transitionStyle = isDragging || prefersReduced
    ? 'none'
    : 'left 800ms cubic-bezier(0.34, 1.56, 0.64, 1), clip-path 800ms cubic-bezier(0.34, 1.56, 0.64, 1)';

  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl select-none cursor-col-resize border border-zinc-200 dark:border-zinc-800 bg-zinc-900 focus-visible:ring-2 focus-visible:ring-indigo-650 focus-visible:outline-none ${className}`}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      onDoubleClick={() => setSliderX(50)}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="slider"
      aria-valuenow={Math.round(sliderX)}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Before and after split image slider"
      id="before-after-slider"
    >
      {/* After image (full width, bottom layer) */}
      <img
        src={afterUrl}
        alt="Processed"
        className="block w-full h-full object-contain pointer-events-none"
        draggable={false}
      />

      {/* Before image clipped to left of slider */}
      <div
        className="absolute inset-0 overflow-hidden pointer-events-none"
        style={{ 
          clipPath: `inset(0 ${100 - sliderX}% 0 0)`,
          transition: transitionStyle
        }}
      >
        <img
          src={beforeUrl}
          alt="Original"
          className="block w-full h-full object-contain"
          draggable={false}
        />
      </div>

      {/* Divider line */}
      <div
        className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg pointer-events-none"
        style={{ 
          left: `${sliderX}%`, 
          transform: 'translateX(-50%)',
          transition: transitionStyle
        }}
      >
        {/* Handle circle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white shadow-xl border-2 border-indigo-600 dark:border-indigo-500 flex items-center justify-center cursor-col-resize z-20">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" className="text-indigo-700 dark:text-indigo-400">
            <path d="M4 7 L1 4 L1 10 Z" fill="currentColor" />
            <path d="M10 7 L13 4 L13 10 Z" fill="currentColor" />
          </svg>
        </div>
      </div>

      {/* Labels */}
      <div className="absolute bottom-3 left-3 bg-black/60 text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded backdrop-blur-sm tracking-wider pointer-events-none">
        {beforeLabel.toUpperCase()}
      </div>
      <div className="absolute bottom-3 right-3 bg-indigo-600/80 text-white text-[10px] font-bold font-mono px-2 py-0.5 rounded backdrop-blur-sm tracking-wider pointer-events-none">
        {afterLabel.toUpperCase()}
      </div>
    </div>
  );
}
