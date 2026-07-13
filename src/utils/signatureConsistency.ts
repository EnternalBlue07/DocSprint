/**
 * Signature Consistency Checker
 * Compares two signature canvases to detect if they look significantly different.
 * Uses stroke density histogram comparison with Pearson correlation coefficient.
 * Runs entirely in-browser RAM — zero server calls.
 */

import { SignatureConsistencyResult } from '../types';

/**
 * Convert a canvas to a normalized stroke-density histogram.
 * Divides the canvas into a grid and counts dark (ink) pixels per cell.
 */
function getStrokeDensityHistogram(canvas: HTMLCanvasElement, gridSize = 16): number[] {
  // Downsample to standard size for comparison
  const stdSize = 160;
  const sc = document.createElement('canvas');
  sc.width = stdSize; sc.height = Math.round(stdSize / (canvas.width / canvas.height));
  const ctx = sc.getContext('2d');
  if (!ctx) return [];
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, sc.width, sc.height);
  ctx.drawImage(canvas, 0, 0, sc.width, sc.height);

  const data = ctx.getImageData(0, 0, sc.width, sc.height).data;
  const cellW = Math.ceil(sc.width / gridSize);
  const cellH = Math.ceil(sc.height / gridSize);
  const histogram: number[] = new Array(gridSize * gridSize).fill(0);

  for (let cy = 0; cy < gridSize; cy++) {
    for (let cx = 0; cx < gridSize; cx++) {
      let darkPixels = 0;
      let totalPixels = 0;
      const startX = cx * cellW;
      const startY = cy * cellH;

      for (let y = startY; y < Math.min(startY + cellH, sc.height); y++) {
        for (let x = startX; x < Math.min(startX + cellW, sc.width); x++) {
          const idx = (y * sc.width + x) * 4;
          const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
          if (gray < 128) darkPixels++; // ink pixel
          totalPixels++;
        }
      }

      histogram[cy * gridSize + cx] = totalPixels > 0 ? darkPixels / totalPixels : 0;
    }
  }

  return histogram;
}

/**
 * Compute Pearson correlation coefficient between two histograms.
 * Returns -1 to 1, where 1 = identical, 0 = uncorrelated, -1 = inverse.
 */
function pearsonCorrelation(a: number[], b: number[]): number {
  if (a.length !== b.length || a.length === 0) return 0;
  const n = a.length;
  const meanA = a.reduce((s, v) => s + v, 0) / n;
  const meanB = b.reduce((s, v) => s + v, 0) / n;

  let num = 0, denomA = 0, denomB = 0;
  for (let i = 0; i < n; i++) {
    const dA = a[i] - meanA;
    const dB = b[i] - meanB;
    num += dA * dB;
    denomA += dA * dA;
    denomB += dB * dB;
  }

  const denom = Math.sqrt(denomA * denomB);
  return denom === 0 ? 1 : num / denom;
}

/**
 * Compare two signature images for consistency.
 * @param canvas1 First signature canvas
 * @param canvas2 Second signature canvas
 */
export function checkSignatureConsistency(
  canvas1: HTMLCanvasElement,
  canvas2: HTMLCanvasElement
): SignatureConsistencyResult {
  const hist1 = getStrokeDensityHistogram(canvas1);
  const hist2 = getStrokeDensityHistogram(canvas2);

  const correlation = pearsonCorrelation(hist1, hist2);
  // Map correlation (-1 to 1) to similarity (0 to 100)
  const similarity = Math.round(((correlation + 1) / 2) * 100);

  let verdict: SignatureConsistencyResult['verdict'];
  let message: string;

  if (similarity >= 70) {
    verdict = 'consistent';
    message = `Signatures look consistent (${similarity}% similarity). Good — application portals rarely flag this.`;
  } else if (similarity >= 45) {
    verdict = 'slightly_different';
    message = `Signatures show some variation (${similarity}% similarity). Some portals may flag this — consider re-signing for a closer match.`;
  } else {
    verdict = 'significantly_different';
    message = `Signatures look significantly different (${similarity}% similarity). This may cause a "signature mismatch" rejection. Please re-upload a consistent signature.`;
  }

  return { similarity, verdict, message };
}

/**
 * Compare a new signature canvas against an array of prior signature dataUrls.
 * Returns the lowest similarity found (worst case comparison).
 */
export async function checkSignatureConsistencyAgainstHistory(
  newCanvas: HTMLCanvasElement,
  priorSignatureUrls: string[]
): Promise<SignatureConsistencyResult | null> {
  if (priorSignatureUrls.length === 0) return null;

  let worstResult: SignatureConsistencyResult | null = null;

  for (const url of priorSignatureUrls) {
    const img = new Image();
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject();
      img.src = url;
    });

    const refCanvas = document.createElement('canvas');
    refCanvas.width = img.naturalWidth;
    refCanvas.height = img.naturalHeight;
    const ctx = refCanvas.getContext('2d');
    if (!ctx) continue;
    ctx.drawImage(img, 0, 0);

    const result = checkSignatureConsistency(newCanvas, refCanvas);
    if (worstResult === null || result.similarity < worstResult.similarity) {
      worstResult = result;
    }
  }

  return worstResult;
}
