import React, { useState, useEffect } from 'react';
import { ConfidenceScore } from '../types';
import CountUp from './CountUp';

interface ConfidenceScoreRingProps {
  score: ConfidenceScore;
  size?: 'sm' | 'md' | 'lg';
  showBreakdown?: boolean;
}

// Continuous HSL color interpolation from Red (0) to Amber (38) to Emerald Green (140)
function getInterpolatedColor(overall: number): string {
  if (overall === 100) {
    return 'hsl(45, 85%, 45%)'; // Perfect gold Easter egg color
  }
  let hue = 0;
  if (overall < 50) {
    // 0 to 50: Hue goes from 0 (Red) to 38 (Orange/Amber)
    hue = (overall / 50) * 38;
  } else {
    // 50 to 100: Hue goes from 38 (Orange/Amber) to 140 (Emerald Green)
    hue = 38 + ((overall - 50) / 50) * 102;
  }
  return `hsl(${hue}, 85%, 42%)`;
}

function getCheckColor(detail: string, currentColor: string): string {
  if (detail.startsWith('✓')) return 'text-emerald-600 dark:text-emerald-400';
  if (detail.startsWith('~')) return 'text-amber-600 dark:text-amber-400';
  return 'text-red-500 dark:text-red-400';
}

const CHECK_LABELS: Record<string, string> = {
  size: 'File Size',
  aspectRatio: 'Aspect Ratio',
  dimensions: 'Dimensions',
  background: 'Background',
  sharpness: 'Sharpness',
  face: 'Face Position',
};

const MAX_PTS: Record<string, number> = {
  size: 20,
  aspectRatio: 15,
  dimensions: 15,
  background: 20,
  sharpness: 15,
  face: 15,
};

/**
 * SVG ring + breakdown table showing the 0–100 Confidence Score.
 * Replaces the old binary PASS/FAIL badge in Photo Studio & ChecklistHub.
 */
export default function ConfidenceScoreRing({
  score,
  size = 'md',
  showBreakdown = true,
}: ConfidenceScoreRingProps) {
  // Trigger spring animation on mount by transition from 0 to score.overall
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setAnimatedScore(score.overall);
    }, 50);
    return () => clearTimeout(t);
  }, [score.overall]);

  const currentColor = getInterpolatedColor(animatedScore);
  const badgeBg = `color-mix(in srgb, ${currentColor} 8%, transparent)`;

  const radius = size === 'lg' ? 48 : size === 'sm' ? 30 : 38;
  const stroke = size === 'lg' ? 7 : size === 'sm' ? 5 : 6;
  const svgSize = (radius + stroke) * 2 + 4;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - animatedScore / 100);

  const fontSize = size === 'lg' ? 'text-2xl' : size === 'sm' ? 'text-sm' : 'text-xl';
  const subFont = size === 'sm' ? 'text-[8px]' : 'text-[10px]';

  return (
    <div className="flex flex-col gap-4" id="confidence-score-ring">
      {/* Ring + Score */}
      <div className="flex items-center gap-4">
        <div className="relative flex-shrink-0">
          <svg width={svgSize} height={svgSize} viewBox={`0 0 ${svgSize} ${svgSize}`} className="rotate-[-90deg]">
            {/* Background track */}
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              fill="none"
              stroke="var(--border-hairline)"
              strokeWidth={stroke}
            />
            {/* Score arc with spring easing */}
            <circle
              cx={svgSize / 2}
              cy={svgSize / 2}
              r={radius}
              fill="none"
              stroke={currentColor}
              strokeWidth={stroke}
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              strokeLinecap="round"
              style={{ transition: 'stroke-dashoffset 800ms cubic-bezier(0.34, 1.56, 0.64, 1), stroke 800ms ease' }}
            />
          </svg>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`${fontSize} font-black font-mono leading-none tracking-tight`} style={{ color: currentColor }}>
              <CountUp end={animatedScore} duration={850} />
            </span>
            <span className={`${subFont} font-bold font-mono text-zinc-400 dark:text-zinc-650 uppercase tracking-wide`}>
              /100
            </span>
          </div>
        </div>

        {/* Label + badge */}
        <div className="flex flex-col gap-1.5">
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wide ${
              score.overall === 100 ? 'ring-2 ring-amber-400 dark:ring-amber-500 animate-pulse' : ''
            }`}
            style={{ backgroundColor: badgeBg, color: currentColor }}
          >
            {score.overall === 100 ? '🏆' : score.label === 'Excellent' ? '🎯' : score.label === 'Good' ? '✅' : score.label === 'Fair' ? '⚠️' : '❌'}
            {score.overall === 100 ? 'Perfect 100 Score' : `${score.label} — Acceptance Confidence`}
          </span>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[180px]">
            {score.overall >= 88
              ? 'Very likely to be accepted by the portal.'
              : score.overall >= 70
              ? 'Should pass — minor issues detected.'
              : score.overall >= 50
              ? 'May fail — review flagged checks.'
              : 'Likely to be rejected — fix issues before submitting.'}
          </p>
        </div>
      </div>

      {/* Per-check breakdown */}
      {showBreakdown && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/20 p-3.5 space-y-2.5" id="confidence-breakdown">
          <span className="text-[9px] font-bold font-mono text-zinc-400 dark:text-zinc-600 uppercase tracking-widest block">
            Score Breakdown
          </span>
          {Object.entries(score.breakdown).map(([key, pts]) => {
            const maxPts = MAX_PTS[key] ?? 15;
            const detail = score.details[key] ?? '';
            const pct = (pts / maxPts) * 100;
            const checkColor = getCheckColor(detail, currentColor);

            return (
              <div key={key} className="space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-zinc-700 dark:text-zinc-300">
                    {CHECK_LABELS[key] ?? key}
                  </span>
                  <span className="text-[10px] font-mono font-bold text-zinc-500">
                    {Math.round(pts)}/{maxPts}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-800"
                    style={{
                      width: `${pct}%`,
                      backgroundColor: getInterpolatedColor(pct),
                      transitionTimingFunction: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                </div>
                {detail && (
                  <p className={`text-[10px] ${checkColor} leading-tight font-semibold`}>
                    {detail.replace(/^[✓~✗] /, '')}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
