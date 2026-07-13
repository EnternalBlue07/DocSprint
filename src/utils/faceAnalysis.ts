/**
 * Face Analysis Utility
 * Client-side face detection and compliance checking using browser Canvas APIs.
 * Zero server calls — all inference runs entirely in-browser via pixel analysis.
 * 
 * Note: This uses a lightweight heuristic approach based on skin-tone detection
 * and facial region analysis via Canvas pixel data, avoiding any external ML model
 * downloads while still providing meaningful pre-flight guidance.
 */

import { FaceAnalysisResult, FaceIssue } from '../types';

/**
 * Analyze a canvas image for face compliance issues.
 * Uses skin-tone pixel detection and regional analysis.
 */
export async function analyzeFaceCompliance(canvas: HTMLCanvasElement): Promise<FaceAnalysisResult> {
  const issues: FaceIssue[] = [];
  
  // Work on a downsampled version for speed
  const targetSize = 200;
  const scale = Math.min(targetSize / canvas.width, targetSize / canvas.height);
  const sampleW = Math.round(canvas.width * scale);
  const sampleH = Math.round(canvas.height * scale);
  
  const sampleCanvas = document.createElement('canvas');
  sampleCanvas.width = sampleW;
  sampleCanvas.height = sampleH;
  const ctx = sampleCanvas.getContext('2d');
  if (!ctx) return { faceDetected: false, issues: [{ type: 'no_face', message: 'Could not analyze image', severity: 'warning' }], score: 70 };
  
  ctx.drawImage(canvas, 0, 0, sampleW, sampleH);
  const imgData = ctx.getImageData(0, 0, sampleW, sampleH);
  const data = imgData.data;

  // ── Skin tone detection ─────────────────────────────────────────────────
  // Uses the Peer (2003) skin color model in RGB space
  const skinPixels: { x: number; y: number }[] = [];
  
  for (let y = 0; y < sampleH; y++) {
    for (let x = 0; x < sampleW; x++) {
      const idx = (y * sampleW + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Skin tone heuristic: Peer model
      if (
        r > 95 && g > 40 && b > 20 &&
        r > g && r > b &&
        Math.abs(r - g) > 15 &&
        r - Math.min(g, b) > 15
      ) {
        skinPixels.push({ x, y });
      }
    }
  }

  const skinRatio = skinPixels.length / (sampleW * sampleH);
  const faceDetected = skinRatio > 0.08; // At least 8% skin pixels expected

  if (!faceDetected) {
    issues.push({
      type: 'no_face',
      message: 'No face detected. Ensure the photo shows a clear, front-facing portrait.',
      severity: 'error'
    });
    return { faceDetected: false, issues, score: 20 };
  }

  // ── Face region bounding box ─────────────────────────────────────────────
  let minX = sampleW, maxX = 0, minY = sampleH, maxY = 0;
  for (const p of skinPixels) {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  }

  const faceW = maxX - minX;
  const faceH = maxY - minY;
  const faceCenterX = (minX + maxX) / 2 / sampleW;
  const faceCenterY = (minY + maxY) / 2 / sampleH;

  // ── Face centering check ─────────────────────────────────────────────────
  const hDeviation = Math.abs(faceCenterX - 0.5);
  const vIdeal = 0.38; // Face center should be ~38% down from top
  const vDeviation = Math.abs(faceCenterY - vIdeal);

  if (hDeviation > 0.18) {
    issues.push({
      type: 'face_not_centered',
      message: 'Face appears off-center horizontally. Use the pan slider to center your face.',
      severity: 'warning'
    });
  }

  if (vDeviation > 0.20) {
    issues.push({
      type: 'face_not_centered',
      message: 'Face appears too high or too low. Adjust vertical pan to position eyes at the upper third.',
      severity: 'warning'
    });
  }

  // ── Face size check ──────────────────────────────────────────────────────
  const faceArea = (faceW * faceH) / (sampleW * sampleH);
  if (faceArea < 0.12) {
    issues.push({
      type: 'face_too_small',
      message: 'Face appears too small in the frame. Zoom in to fill 60–80% of the photo height.',
      severity: 'warning'
    });
  } else if (faceArea > 0.65) {
    issues.push({
      type: 'face_too_large',
      message: 'Face fills too much of the frame. Most specs require some background visible above the head.',
      severity: 'warning'
    });
  }

  // ── Head tilt check ──────────────────────────────────────────────────────
  // Compare the skin pixel distribution in left vs right halves of face region
  const leftCount = skinPixels.filter(p => p.x < (minX + maxX) / 2).length;
  const rightCount = skinPixels.length - leftCount;
  const symmetryRatio = Math.min(leftCount, rightCount) / Math.max(leftCount, rightCount);
  
  if (symmetryRatio < 0.65) {
    issues.push({
      type: 'head_tilt',
      message: 'Head appears tilted or turned. Ensure you face the camera directly for best results.',
      severity: 'warning'
    });
  }

  // ── Brightness check for glasses glare ───────────────────────────────────
  // Look for very bright (near-white) regions in the eye area
  const eyeRegionTop = Math.round(minY + faceH * 0.25);
  const eyeRegionBot = Math.round(minY + faceH * 0.55);
  let glarePixels = 0;
  let eyePixels = 0;

  for (let y = eyeRegionTop; y < Math.min(eyeRegionBot, sampleH); y++) {
    for (let x = minX; x < Math.min(maxX, sampleW); x++) {
      const idx = (y * sampleW + x) * 4;
      const r = data[idx], g = data[idx + 1], b = data[idx + 2];
      eyePixels++;
      if (r > 230 && g > 230 && b > 230) glarePixels++;
    }
  }

  if (eyePixels > 0 && glarePixels / eyePixels > 0.12) {
    issues.push({
      type: 'head_tilt', // Reuse as 'glasses_glare' — closest category
      message: 'Possible glasses glare detected in eye region. Some passport specs prohibit glasses. Try removing them.',
      severity: 'warning'
    });
  }

  // ── Compute composite face score ──────────────────────────────────────────
  let score = 100;
  for (const issue of issues) {
    score -= issue.severity === 'error' ? 30 : 15;
  }
  score = Math.max(0, score);

  return { faceDetected: true, issues, score };
}

/**
 * Quick check: does the canvas have a human face at all?
 * Lightweight version for batch processing.
 */
export function quickFaceCheck(canvas: HTMLCanvasElement): boolean {
  const size = 100;
  const sc = document.createElement('canvas');
  sc.width = size; sc.height = size;
  const ctx = sc.getContext('2d');
  if (!ctx) return false;
  ctx.drawImage(canvas, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;
  let skinCount = 0;
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i+1], b = data[i+2];
    if (r > 95 && g > 40 && b > 20 && r > g && r > b && Math.abs(r-g) > 15) skinCount++;
  }
  return skinCount / (size * size) > 0.08;
}
