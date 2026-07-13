/**
 * Confidence Score Engine
 * Replaces binary PASS/FAIL with a 0–100 weighted acceptance confidence score.
 * Runs entirely in-browser RAM — zero server calls.
 */

import { SpecRequirement, ConfidenceScore, ConfidenceBreakdown } from '../types';
import { checkBackgroundColorHistogram, calculateLaplacianVariance } from './imageUtils';

// Maximum points per check — must sum to 100
const MAX_POINTS = {
  size: 20,
  aspectRatio: 15,
  dimensions: 15,
  background: 20,
  sharpness: 15,
  face: 15,
};

function getScoreLabel(overall: number): 'Excellent' | 'Good' | 'Fair' | 'Poor' {
  if (overall >= 88) return 'Excellent';
  if (overall >= 70) return 'Good';
  if (overall >= 50) return 'Fair';
  return 'Poor';
}

/**
 * Compute the full confidence score for a processed canvas against a spec.
 * @param canvas The processed output canvas
 * @param spec The target specification
 * @param documentType 'photo' | 'signature' | 'pdf' | 'document'
 * @param actualSizeBytes Actual compressed file size in bytes
 * @param faceScore Optional 0–100 score from face-analysis (for photos only)
 */
export function computeConfidenceScore(
  canvas: HTMLCanvasElement,
  spec: SpecRequirement,
  documentType: 'photo' | 'signature' | 'pdf' | 'document',
  actualSizeBytes: number,
  faceScore?: number
): ConfidenceScore {
  const details: Record<string, string> = {};
  const breakdown: ConfidenceBreakdown = {
    size: 0,
    aspectRatio: 0,
    dimensions: 0,
    background: 0,
    sharpness: 0,
    face: 0,
  };

  // ── 1. File Size Check (20 pts) ─────────────────────────────────────────
  const actualKb = actualSizeBytes / 1024;
  if (actualKb >= spec.minKb && actualKb <= spec.maxKb) {
    breakdown.size = MAX_POINTS.size;
    details.size = `✓ ${Math.round(actualKb)}KB — within target range (${spec.minKb}–${spec.maxKb}KB)`;
  } else if (actualKb < spec.minKb) {
    // Penalty proportional to how far below minimum
    const pct = Math.max(0, 1 - (spec.minKb - actualKb) / spec.minKb);
    breakdown.size = Math.round(MAX_POINTS.size * pct * 0.5);
    details.size = `⚠ ${Math.round(actualKb)}KB — below minimum ${spec.minKb}KB`;
  } else {
    // Over max — more severe penalty
    const overBy = ((actualKb - spec.maxKb) / spec.maxKb) * 100;
    const pct = Math.max(0, 1 - overBy / 100);
    breakdown.size = Math.round(MAX_POINTS.size * pct * 0.3);
    details.size = `✗ ${Math.round(actualKb)}KB — exceeds maximum ${spec.maxKb}KB`;
  }

  // ── 2. Aspect Ratio Check (15 pts) ──────────────────────────────────────
  if (spec.aspectRatio) {
    const actualAspect = canvas.width / canvas.height;
    const tolerance = 0.05; // 5% tolerance
    const deviation = Math.abs(actualAspect - spec.aspectRatio) / spec.aspectRatio;
    if (deviation <= tolerance) {
      breakdown.aspectRatio = MAX_POINTS.aspectRatio;
      details.aspectRatio = `✓ ${canvas.width}×${canvas.height}px — correct ratio ${spec.aspectRatio.toFixed(2)}`;
    } else {
      const pct = Math.max(0, 1 - deviation / 0.5);
      breakdown.aspectRatio = Math.round(MAX_POINTS.aspectRatio * pct);
      details.aspectRatio = `⚠ Ratio ${actualAspect.toFixed(2)} vs required ${spec.aspectRatio.toFixed(2)} (${(deviation * 100).toFixed(0)}% deviation)`;
    }
  } else {
    breakdown.aspectRatio = MAX_POINTS.aspectRatio; // No spec = full marks
    details.aspectRatio = '✓ No aspect ratio requirement';
  }

  // ── 3. Pixel Dimensions Check (15 pts) ──────────────────────────────────
  if (spec.widthPx) {
    const widthOk = Math.abs(canvas.width - spec.widthPx) / spec.widthPx <= 0.1;
    const heightOk = spec.heightMm ? true : true; // Height checked via aspect ratio
    if (widthOk) {
      breakdown.dimensions = MAX_POINTS.dimensions;
      details.dimensions = `✓ ${canvas.width}×${canvas.height}px — meets ${spec.widthPx}px target`;
    } else {
      const dev = Math.abs(canvas.width - spec.widthPx) / spec.widthPx;
      breakdown.dimensions = Math.round(MAX_POINTS.dimensions * Math.max(0, 1 - dev));
      details.dimensions = `⚠ ${canvas.width}px vs required ${spec.widthPx}px width`;
    }
  } else {
    breakdown.dimensions = MAX_POINTS.dimensions;
    details.dimensions = '✓ No pixel dimension requirement';
  }

  // ── 4. Background Color Check (20 pts) — histogram-based ────────────────
  if (spec.bgColors && !spec.bgColors.includes('any') && documentType === 'photo') {
    const bgResult = checkBackgroundColorHistogram(canvas);
    const requiredColors = spec.bgColors;

    if (requiredColors.includes(bgResult.dominantColor)) {
      breakdown.background = MAX_POINTS.background;
      details.background = `✓ Background detected as ${bgResult.dominantColor} (confidence: ${bgResult.confidence}%)`;
    } else if (requiredColors.includes('white') && bgResult.dominantColor === 'off-white') {
      // Off-white is usually acceptable when white is required
      breakdown.background = Math.round(MAX_POINTS.background * 0.85);
      details.background = `~ Background is off-white — may be accepted (confidence: ${bgResult.confidence}%)`;
    } else {
      const pct = bgResult.confidence / 100;
      breakdown.background = Math.round(MAX_POINTS.background * (1 - pct) * 0.2);
      details.background = `✗ Background appears ${bgResult.dominantColor}, expected ${requiredColors.join(' or ')}`;
    }
  } else {
    breakdown.background = MAX_POINTS.background;
    details.background = '✓ No background color requirement';
  }

  // ── 5. Sharpness Check (15 pts) — Laplacian variance ────────────────────
  const sharpnessResult = calculateLaplacianVariance(canvas);
  // Laplacian variance: >100 = very sharp, 50–100 = acceptable, 20–50 = soft, <20 = blurry
  if (sharpnessResult.variance >= 80) {
    breakdown.sharpness = MAX_POINTS.sharpness;
    details.sharpness = `✓ Sharp image (Laplacian: ${Math.round(sharpnessResult.variance)})`;
  } else if (sharpnessResult.variance >= 40) {
    const pct = (sharpnessResult.variance - 40) / 40;
    breakdown.sharpness = Math.round(MAX_POINTS.sharpness * (0.5 + pct * 0.5));
    details.sharpness = `~ Acceptable sharpness (Laplacian: ${Math.round(sharpnessResult.variance)}) — may appear soft`;
  } else {
    const pct = sharpnessResult.variance / 40;
    breakdown.sharpness = Math.round(MAX_POINTS.sharpness * pct * 0.3);
    details.sharpness = `✗ Image appears blurry (Laplacian: ${Math.round(sharpnessResult.variance)})`;
  }

  // ── 6. Face Score (15 pts) — from face-api.js, photos only ─────────────
  if (documentType === 'photo') {
    if (faceScore !== undefined) {
      breakdown.face = Math.round((faceScore / 100) * MAX_POINTS.face);
      if (faceScore >= 90) {
        details.face = `✓ Face detected, well-positioned (score: ${faceScore}/100)`;
      } else if (faceScore >= 60) {
        details.face = `~ Face detected with minor issues (score: ${faceScore}/100)`;
      } else {
        details.face = `✗ Face positioning issues detected (score: ${faceScore}/100)`;
      }
    } else {
      // Face analysis not run yet — give partial credit
      breakdown.face = Math.round(MAX_POINTS.face * 0.7);
      details.face = '~ Face analysis pending (upload a photo to enable)';
    }
  } else {
    // Non-photo document — face check doesn't apply, redistribute points
    breakdown.face = MAX_POINTS.face;
    details.face = '✓ Face check not required for this document type';
  }

  const overall = Math.round(
    breakdown.size + breakdown.aspectRatio + breakdown.dimensions +
    breakdown.background + breakdown.sharpness + breakdown.face
  );

  return {
    overall: Math.min(100, Math.max(0, overall)),
    label: getScoreLabel(overall),
    breakdown,
    details,
  };
}
