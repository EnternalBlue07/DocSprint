/**
 * Homography and Pixel-level Image Processing Utilities for Client-side Document Scanning
 * — Upgraded to CamScanner-level quality:
 *   • Bilinear interpolation (no more pixel jaggies)
 *   • Proper per-channel local illumination normalization
 *   • "Magic Color" mode (warm-white document look)
 *   • Auto corner detection (Sobel edge gradient sampling)
 */

export interface Point {
  x: number;
  y: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Homography solver
// ─────────────────────────────────────────────────────────────────────────────

export function getHomographyMatrix(src: Point[], dst: Point[]): number[] {
  const A: number[][] = [];
  for (let i = 0; i < 4; i++) {
    const { x: xs, y: ys } = src[i];
    const { x: xd, y: yd } = dst[i];
    A.push([xs, ys, 1, 0, 0, 0, -xd * xs, -xd * ys, xd]);
    A.push([0, 0, 0, xs, ys, 1, -yd * xs, -yd * ys, yd]);
  }
  const M: number[][] = [];
  const B: number[] = [];
  for (let i = 0; i < 8; i++) {
    M.push(A[i].slice(0, 8));
    B.push(A[i][8]);
  }
  const h = solveLinearSystem(M, B);
  if (!h) return [1, 0, 0, 0, 1, 0, 0, 0, 1];
  return [...h, 1];
}

function solveLinearSystem(A: number[][], B: number[]): number[] | null {
  const n = B.length;
  for (let i = 0; i < n; i++) {
    let maxEl = Math.abs(A[i][i]);
    let maxRow = i;
    for (let k = i + 1; k < n; k++) {
      if (Math.abs(A[k][i]) > maxEl) { maxEl = Math.abs(A[k][i]); maxRow = k; }
    }
    const tempRow = A[maxRow]; A[maxRow] = A[i]; A[i] = tempRow;
    const tempB = B[maxRow]; B[maxRow] = B[i]; B[i] = tempB;
    if (Math.abs(A[i][i]) < 1e-10) return null;
    for (let k = i + 1; k < n; k++) {
      const c = -A[k][i] / A[i][i];
      for (let j = i; j < n; j++) {
        A[k][j] = i === j ? 0 : A[k][j] + c * A[i][j];
      }
      B[k] += c * B[i];
    }
  }
  const x = new Array(n).fill(0);
  for (let i = n - 1; i >= 0; i--) {
    x[i] = B[i] / A[i][i];
    for (let k = i - 1; k >= 0; k--) B[k] -= A[k][i] * x[i];
  }
  return x;
}

// ─────────────────────────────────────────────────────────────────────────────
// Bilinear interpolation helper
// ─────────────────────────────────────────────────────────────────────────────

function bilinearSample(
  data: Uint8ClampedArray,
  srcW: number,
  srcH: number,
  sx: number,
  sy: number
): [number, number, number, number] {
  const x0 = Math.floor(sx);
  const y0 = Math.floor(sy);
  const x1 = Math.min(x0 + 1, srcW - 1);
  const y1 = Math.min(y0 + 1, srcH - 1);
  const fx = sx - x0;
  const fy = sy - y0;

  const getPixel = (px: number, py: number): [number, number, number, number] => {
    if (px < 0 || py < 0 || px >= srcW || py >= srcH) return [255, 255, 255, 255];
    const idx = (py * srcW + px) * 4;
    return [data[idx], data[idx + 1], data[idx + 2], data[idx + 3]];
  };

  const [r00, g00, b00, a00] = getPixel(x0, y0);
  const [r10, g10, b10, a10] = getPixel(x1, y0);
  const [r01, g01, b01, a01] = getPixel(x0, y1);
  const [r11, g11, b11, a11] = getPixel(x1, y1);

  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  return [
    Math.round(lerp(lerp(r00, r10, fx), lerp(r01, r11, fx), fy)),
    Math.round(lerp(lerp(g00, g10, fx), lerp(g01, g11, fx), fy)),
    Math.round(lerp(lerp(b00, b10, fx), lerp(b01, b11, fx), fy)),
    Math.round(lerp(lerp(a00, a10, fx), lerp(a01, a11, fx), fy)),
  ];
}

// ─────────────────────────────────────────────────────────────────────────────
// Perspective Warp (bilinear interpolated)
// ─────────────────────────────────────────────────────────────────────────────

export function warpPerspective(
  srcImg: HTMLImageElement | HTMLCanvasElement,
  srcPoints: Point[],
  destWidth: number,
  destHeight: number
): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = destWidth;
  canvas.height = destHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const srcCanvas = document.createElement('canvas');
  srcCanvas.width = srcImg instanceof HTMLImageElement ? srcImg.naturalWidth : srcImg.width;
  srcCanvas.height = srcImg instanceof HTMLImageElement ? srcImg.naturalHeight : srcImg.height;
  const srcCtx = srcCanvas.getContext('2d');
  if (!srcCtx) return canvas;
  srcCtx.drawImage(srcImg, 0, 0);

  const srcData = srcCtx.getImageData(0, 0, srcCanvas.width, srcCanvas.height);
  const destData = ctx.createImageData(destWidth, destHeight);

  const dstPoints: Point[] = [
    { x: 0, y: 0 },
    { x: destWidth, y: 0 },
    { x: destWidth, y: destHeight },
    { x: 0, y: destHeight },
  ];

  // Backward mapping (dst → src) to avoid holes
  const h = getHomographyMatrix(dstPoints, srcPoints);
  const [h0, h1, h2, h3, h4, h5, h6, h7, h8] = h;

  const srcW = srcCanvas.width;
  const srcH = srcCanvas.height;
  const sData = srcData.data;
  const dData = destData.data;

  for (let y = 0; y < destHeight; y++) {
    for (let x = 0; x < destWidth; x++) {
      const w_coord = h6 * x + h7 * y + h8;
      const src_x = (h0 * x + h1 * y + h2) / w_coord;
      const src_y = (h3 * x + h4 * y + h5) / w_coord;

      const destIdx = (y * destWidth + x) * 4;

      if (src_x >= 0 && src_x < srcW && src_y >= 0 && src_y < srcH) {
        // Bilinear interpolation for smooth output
        const [r, g, b, a] = bilinearSample(sData, srcW, srcH, src_x, src_y);
        dData[destIdx] = r;
        dData[destIdx + 1] = g;
        dData[destIdx + 2] = b;
        dData[destIdx + 3] = a;
      } else {
        dData[destIdx] = 255;
        dData[destIdx + 1] = 255;
        dData[destIdx + 2] = 255;
        dData[destIdx + 3] = 255;
      }
    }
  }

  ctx.putImageData(destData, 0, 0);
  return canvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// Enhanced shadow removal + scan modes
// ─────────────────────────────────────────────────────────────────────────────

export type ScanMode = 'color' | 'grayscale' | 'monochrome' | 'magic';

export interface EnhanceOptions {
  brightness?: number;  // -100 to +100, default 0
  contrast?: number;    // -100 to +100, default 0
  sharpness?: number;   // 0 to 100, default 0
}

export function removeShadowsAndEnhance(
  canvas: HTMLCanvasElement,
  mode: ScanMode = 'color',
  options: EnhanceOptions = {}
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const output = ctx.createImageData(w, h);
  const outData = output.data;

  const { brightness = 0, contrast = 0, sharpness = 0 } = options;

  // ── Pass 1: Build per-block background illumination map ──────────────────
  // Use larger 32x32 grid for finer local correction
  const gridX = 32;
  const gridY = 32;
  const blockW = Math.ceil(w / gridX);
  const blockH = Math.ceil(h / gridY);
  const bgMaxR = new Float32Array(gridX * gridY);
  const bgMaxG = new Float32Array(gridX * gridY);
  const bgMaxB = new Float32Array(gridX * gridY);

  for (let gy = 0; gy < gridY; gy++) {
    for (let gx = 0; gx < gridX; gx++) {
      let maxR = 0, maxG = 0, maxB = 0;
      const startX = gx * blockW;
      const startY = gy * blockH;
      const endX = Math.min(w, startX + blockW);
      const endY = Math.min(h, startY + blockH);

      for (let y = startY; y < endY; y++) {
        for (let x = startX; x < endX; x++) {
          const idx = (y * w + x) * 4;
          if (data[idx] > maxR) maxR = data[idx];
          if (data[idx + 1] > maxG) maxG = data[idx + 1];
          if (data[idx + 2] > maxB) maxB = data[idx + 2];
        }
      }
      const bi = gy * gridX + gx;
      bgMaxR[bi] = maxR || 255;
      bgMaxG[bi] = maxG || 255;
      bgMaxB[bi] = maxB || 255;
    }
  }

  // Smooth the background map (box blur over grid)
  const smoothBg = (arr: Float32Array) => {
    const out = new Float32Array(arr.length);
    for (let gy = 0; gy < gridY; gy++) {
      for (let gx = 0; gx < gridX; gx++) {
        let sum = 0, count = 0;
        for (let dy = -1; dy <= 1; dy++) {
          for (let dx = -1; dx <= 1; dx++) {
            const ny = gy + dy, nx = gx + dx;
            if (ny >= 0 && ny < gridY && nx >= 0 && nx < gridX) {
              sum += arr[ny * gridX + nx];
              count++;
            }
          }
        }
        out[gy * gridX + gx] = sum / count;
      }
    }
    return out;
  };

  const smR = smoothBg(bgMaxR);
  const smG = smoothBg(bgMaxG);
  const smB = smoothBg(bgMaxB);

  // Bilinear interpolation of bg map at pixel level
  const getBgValue = (arr: Float32Array, px: number, py: number): number => {
    const gxF = (px / blockW) - 0.5;
    const gyF = (py / blockH) - 0.5;
    const gx0 = Math.max(0, Math.floor(gxF));
    const gy0 = Math.max(0, Math.floor(gyF));
    const gx1 = Math.min(gridX - 1, gx0 + 1);
    const gy1 = Math.min(gridY - 1, gy0 + 1);
    const fx = gxF - Math.floor(gxF);
    const fy = gyF - Math.floor(gyF);
    const v00 = arr[gy0 * gridX + gx0];
    const v10 = arr[gy0 * gridX + gx1];
    const v01 = arr[gy1 * gridX + gx0];
    const v11 = arr[gy1 * gridX + gx1];
    return v00 * (1 - fx) * (1 - fy) + v10 * fx * (1 - fy) + v01 * (1 - fx) * fy + v11 * fx * fy;
  };

  // ── Contrast factor ────────────────────────────────────────────────────────
  const contrastFactor = contrast !== 0
    ? (259 * (contrast + 255)) / (255 * (259 - contrast))
    : 1;

  const applyBrightnessContrast = (v: number): number => {
    let val = v + brightness;
    if (contrast !== 0) val = contrastFactor * (val - 128) + 128;
    return Math.min(255, Math.max(0, val));
  };

  // ── Pass 2: Per-pixel enhancement ─────────────────────────────────────────
  if (mode === 'monochrome') {
    // Adaptive local thresholding (Sauvola-inspired)
    const s = Math.max(15, Math.floor(Math.min(w, h) / 20)) | 1;
    const halfS = Math.floor(s / 2);

    // Build integral image (grayscale)
    const integral = new Float64Array(w * h);
    const integralSq = new Float64Array(w * h);
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        const above = y > 0 ? integral[(y - 1) * w + x] : 0;
        const left = x > 0 ? integral[y * w + (x - 1)] : 0;
        const diag = (y > 0 && x > 0) ? integral[(y - 1) * w + (x - 1)] : 0;
        integral[y * w + x] = gray + above + left - diag;
        const aboveSq = y > 0 ? integralSq[(y - 1) * w + x] : 0;
        const leftSq = x > 0 ? integralSq[y * w + (x - 1)] : 0;
        const diagSq = (y > 0 && x > 0) ? integralSq[(y - 1) * w + (x - 1)] : 0;
        integralSq[y * w + x] = gray * gray + aboveSq + leftSq - diagSq;
      }
    }

    const k = 0.12; // Sauvola k parameter
    const R = 128;  // dynamic range

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];

        const x1 = Math.max(0, x - halfS);
        const y1 = Math.max(0, y - halfS);
        const x2 = Math.min(w - 1, x + halfS);
        const y2 = Math.min(h - 1, y + halfS);
        const count = (x2 - x1 + 1) * (y2 - y1 + 1);

        const getIntegral = (arr: Float64Array, px: number, py: number) =>
          arr[py * w + px];

        const sum =
          getIntegral(integral, x2, y2)
          - (y1 > 0 ? getIntegral(integral, x2, y1 - 1) : 0)
          - (x1 > 0 ? getIntegral(integral, x1 - 1, y2) : 0)
          + (x1 > 0 && y1 > 0 ? getIntegral(integral, x1 - 1, y1 - 1) : 0);

        const sumSq =
          getIntegral(integralSq, x2, y2)
          - (y1 > 0 ? getIntegral(integralSq, x2, y1 - 1) : 0)
          - (x1 > 0 ? getIntegral(integralSq, x1 - 1, y2) : 0)
          + (x1 > 0 && y1 > 0 ? getIntegral(integralSq, x1 - 1, y1 - 1) : 0);

        const mean = sum / count;
        const variance = Math.max(0, sumSq / count - mean * mean);
        const stdDev = Math.sqrt(variance);

        // Sauvola threshold
        const threshold = mean * (1 + k * (stdDev / R - 1));
        const resultVal = gray < threshold ? 0 : 255;

        outData[idx] = resultVal;
        outData[idx + 1] = resultVal;
        outData[idx + 2] = resultVal;
        outData[idx + 3] = data[idx + 3];
      }
    }
  } else if (mode === 'grayscale') {
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const bgR = getBgValue(smR, x, y);
        const gray = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
        const bgGray = (bgR + getBgValue(smG, x, y) + getBgValue(smB, x, y)) / 3;
        const scale = bgGray > 30 ? 255 / bgGray : 1;
        let out = Math.min(255, gray * scale);
        // Lift highlights, darken text
        if (out > 210) out = 255;
        else if (out < 50) out = Math.max(0, out - 15);
        out = applyBrightnessContrast(out);
        outData[idx] = out;
        outData[idx + 1] = out;
        outData[idx + 2] = out;
        outData[idx + 3] = data[idx + 3];
      }
    }
  } else if (mode === 'magic') {
    // CamScanner-style "Magic Color":
    // 1. Per-channel normalize background to white
    // 2. Boost saturation of remaining colors (stamps, highlights)
    // 3. Slightly warm the whites (paper look)
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const bgR = Math.max(30, getBgValue(smR, x, y));
        const bgG = Math.max(30, getBgValue(smG, x, y));
        const bgB = Math.max(30, getBgValue(smB, x, y));

        let r = Math.min(255, (data[idx] / bgR) * 255);
        let g = Math.min(255, (data[idx + 1] / bgG) * 255);
        let b = Math.min(255, (data[idx + 2] / bgB) * 255);

        // Saturation boost for non-white pixels
        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        const sat = 1.3; // 30% saturation boost
        r = Math.min(255, Math.max(0, lum + sat * (r - lum)));
        g = Math.min(255, Math.max(0, lum + sat * (g - lum)));
        b = Math.min(255, Math.max(0, lum + sat * (b - lum)));

        // Lift highlights to warm white (slight cream tint)
        if (lum > 210) { r = 255; g = 252; b = 248; }

        // Deepen shadows a bit
        if (lum < 40) { r = Math.max(0, r - 10); g = Math.max(0, g - 10); b = Math.max(0, b - 10); }

        r = applyBrightnessContrast(r);
        g = applyBrightnessContrast(g);
        b = applyBrightnessContrast(b);

        outData[idx] = r;
        outData[idx + 1] = g;
        outData[idx + 2] = b;
        outData[idx + 3] = data[idx + 3];
      }
    }
  } else {
    // Color mode: per-channel background normalization
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const idx = (y * w + x) * 4;
        const bgR = Math.max(30, getBgValue(smR, x, y));
        const bgG = Math.max(30, getBgValue(smG, x, y));
        const bgB = Math.max(30, getBgValue(smB, x, y));

        let r = Math.min(255, (data[idx] / bgR) * 255);
        let g = Math.min(255, (data[idx + 1] / bgG) * 255);
        let b = Math.min(255, (data[idx + 2] / bgB) * 255);

        const lum = 0.299 * r + 0.587 * g + 0.114 * b;
        if (lum > 215) { r = 255; g = 255; b = 255; }

        r = applyBrightnessContrast(r);
        g = applyBrightnessContrast(g);
        b = applyBrightnessContrast(b);

        outData[idx] = r;
        outData[idx + 1] = g;
        outData[idx + 2] = b;
        outData[idx + 3] = data[idx + 3];
      }
    }
  }

  // ── Pass 3: Sharpening (unsharp mask) ────────────────────────────────────
  let finalData = outData;
  if (sharpness > 0) {
    const amount = sharpness / 100;
    const sharpened = applyUnsharpMask(outData, w, h, amount);
    finalData = sharpened;
  }

  const resultCanvas = document.createElement('canvas');
  resultCanvas.width = w;
  resultCanvas.height = h;
  const resultCtx = resultCanvas.getContext('2d');
  if (resultCtx) {
    const finalImgData = resultCtx.createImageData(w, h);
    finalImgData.data.set(finalData);
    resultCtx.putImageData(finalImgData, 0, 0);
  }
  return resultCanvas;
}

// ─────────────────────────────────────────────────────────────────────────────
// Unsharp Mask for sharpening
// ─────────────────────────────────────────────────────────────────────────────

function applyUnsharpMask(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  amount: number
): Uint8ClampedArray {
  // Simple 3x3 Gaussian blur approximation
  const blurred = new Uint8ClampedArray(data.length);
  const kernel = [1, 2, 1, 2, 4, 2, 1, 2, 1];
  const kernelSum = 16;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      let r = 0, g = 0, b = 0;
      let ki = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const nx = Math.max(0, Math.min(w - 1, x + dx));
          const ny = Math.max(0, Math.min(h - 1, y + dy));
          const nidx = (ny * w + nx) * 4;
          r += data[nidx] * kernel[ki];
          g += data[nidx + 1] * kernel[ki];
          b += data[nidx + 2] * kernel[ki];
          ki++;
        }
      }
      blurred[idx] = r / kernelSum;
      blurred[idx + 1] = g / kernelSum;
      blurred[idx + 2] = b / kernelSum;
      blurred[idx + 3] = data[idx + 3];
    }
  }

  // Unsharp mask: output = original + amount * (original - blurred)
  const result = new Uint8ClampedArray(data.length);
  for (let i = 0; i < data.length; i += 4) {
    result[i] = Math.min(255, Math.max(0, data[i] + amount * (data[i] - blurred[i])));
    result[i + 1] = Math.min(255, Math.max(0, data[i + 1] + amount * (data[i + 1] - blurred[i + 1])));
    result[i + 2] = Math.min(255, Math.max(0, data[i + 2] + amount * (data[i + 2] - blurred[i + 2])));
    result[i + 3] = data[i + 3];
  }
  return result;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auto Corner Detection (Sobel edge + border scanning)
// ─────────────────────────────────────────────────────────────────────────────

export function autoDetectCorners(
  img: HTMLImageElement | HTMLCanvasElement
): { tl: Point; tr: Point; br: Point; bl: Point } {
  const defaultCorners = { tl: { x: 0.1, y: 0.1 }, tr: { x: 0.9, y: 0.1 }, br: { x: 0.9, y: 0.9 }, bl: { x: 0.1, y: 0.9 } };

  try {
    // Work at a small scale for speed
    const scale = 0.25;
    const srcW = img instanceof HTMLImageElement ? img.naturalWidth : img.width;
    const srcH = img instanceof HTMLImageElement ? img.naturalHeight : img.height;
    const sw = Math.floor(srcW * scale);
    const sh = Math.floor(srcH * scale);

    const sc = document.createElement('canvas');
    sc.width = sw; sc.height = sh;
    const sCtx = sc.getContext('2d');
    if (!sCtx) return defaultCorners;
    sCtx.drawImage(img, 0, 0, sw, sh);

    const imgData = sCtx.getImageData(0, 0, sw, sh);
    const d = imgData.data;

    // Build grayscale
    const gray = new Float32Array(sw * sh);
    for (let i = 0; i < sw * sh; i++) {
      gray[i] = 0.299 * d[i * 4] + 0.587 * d[i * 4 + 1] + 0.114 * d[i * 4 + 2];
    }

    // Sobel edge magnitude
    const edge = new Float32Array(sw * sh);
    let maxEdge = 0;
    for (let y = 1; y < sh - 1; y++) {
      for (let x = 1; x < sw - 1; x++) {
        const gx =
          -gray[(y - 1) * sw + (x - 1)] + gray[(y - 1) * sw + (x + 1)]
          - 2 * gray[y * sw + (x - 1)] + 2 * gray[y * sw + (x + 1)]
          - gray[(y + 1) * sw + (x - 1)] + gray[(y + 1) * sw + (x + 1)];
        const gy =
          -gray[(y - 1) * sw + (x - 1)] - 2 * gray[(y - 1) * sw + x] - gray[(y - 1) * sw + (x + 1)]
          + gray[(y + 1) * sw + (x - 1)] + 2 * gray[(y + 1) * sw + x] + gray[(y + 1) * sw + (x + 1)];
        const mag = Math.sqrt(gx * gx + gy * gy);
        edge[y * sw + x] = mag;
        if (mag > maxEdge) maxEdge = mag;
      }
    }

    const threshold = maxEdge * 0.18;

    // For each quadrant, find the edge pixel closest to the corner
    const searchCorner = (
      startX: number, endX: number, stepX: number,
      startY: number, endY: number, stepY: number
    ): Point => {
      let bestDist = Infinity;
      let bestX = startX, bestY = startY;
      const cx = startX < endX ? startX : endX;
      const cy = startY < endY ? startY : endY;

      for (let y = startY; stepY > 0 ? y <= endY : y >= endY; y += stepY) {
        for (let x = startX; stepX > 0 ? x <= endX : x >= endX; x += stepX) {
          if (edge[y * sw + x] > threshold) {
            const dist = Math.sqrt((x - cx) ** 2 + (y - cy) ** 2);
            if (dist < bestDist) { bestDist = dist; bestX = x; bestY = y; }
          }
        }
      }
      return { x: bestX / sw, y: bestY / sh };
    };

    const margin = Math.floor(Math.min(sw, sh) * 0.05);
    const midX = Math.floor(sw / 2);
    const midY = Math.floor(sh / 2);

    const tl = searchCorner(margin, midX, 1, margin, midY, 1);
    const tr = searchCorner(sw - margin, midX, -1, margin, midY, 1);
    const br = searchCorner(sw - margin, midX, -1, sh - margin, midY, -1);
    const bl = searchCorner(margin, midX, 1, sh - margin, midY, -1);

    // Clamp to safe range and add small inset
    const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
    const inset = 0.03;
    return {
      tl: { x: clamp(tl.x, inset, 0.5 - inset), y: clamp(tl.y, inset, 0.5 - inset) },
      tr: { x: clamp(tr.x, 0.5 + inset, 1 - inset), y: clamp(tr.y, inset, 0.5 - inset) },
      br: { x: clamp(br.x, 0.5 + inset, 1 - inset), y: clamp(br.y, 0.5 + inset, 1 - inset) },
      bl: { x: clamp(bl.x, inset, 0.5 - inset), y: clamp(bl.y, 0.5 + inset, 1 - inset) },
    };
  } catch {
    return defaultCorners;
  }
}
