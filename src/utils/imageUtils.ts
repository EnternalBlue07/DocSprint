import { SpecRequirement } from '../types';

// ─────────────────────────────────────────────────────────────────────────────
// Phase 2 additions: Laplacian variance sharpness + histogram background check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Compute proper Laplacian-variance sharpness score.
 * Convolves the image with a 3×3 Laplacian kernel and measures variance of the output.
 * Higher variance = sharper image. Blurry images produce near-zero Laplacian response.
 */
export function calculateLaplacianVariance(canvas: HTMLCanvasElement): { variance: number; isBlurry: boolean } {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { variance: 0, isBlurry: true };

  // Sample at most 300×300 for speed
  const targetW = Math.min(canvas.width, 300);
  const targetH = Math.min(canvas.height, 300);
  const sc = document.createElement('canvas');
  sc.width = targetW; sc.height = targetH;
  const sCtx = sc.getContext('2d');
  if (!sCtx) return { variance: 0, isBlurry: true };
  sCtx.drawImage(canvas, 0, 0, targetW, targetH);

  const imgData = sCtx.getImageData(0, 0, targetW, targetH);
  const src = imgData.data;

  // Convert to grayscale float array
  const gray = new Float32Array(targetW * targetH);
  for (let i = 0; i < targetW * targetH; i++) {
    gray[i] = 0.299 * src[i * 4] + 0.587 * src[i * 4 + 1] + 0.114 * src[i * 4 + 2];
  }

  // Laplacian kernel: [0, 1, 0, 1, -4, 1, 0, 1, 0]
  const lap: number[] = [];
  for (let y = 1; y < targetH - 1; y++) {
    for (let x = 1; x < targetW - 1; x++) {
      const idx = y * targetW + x;
      const val =
        gray[idx - targetW] +
        gray[idx + targetW] +
        gray[idx - 1] +
        gray[idx + 1] -
        4 * gray[idx];
      lap.push(val);
    }
  }

  // Compute variance of Laplacian response
  const mean = lap.reduce((s, v) => s + v, 0) / lap.length;
  const variance = lap.reduce((s, v) => s + (v - mean) ** 2, 0) / lap.length;

  return { variance, isBlurry: variance < 25 };
}

/**
 * Histogram-based background color detection.
 * Samples border pixels, builds RGB histogram, finds dominant color with confidence.
 * Returns category + confidence % (much more nuanced than simple threshold check).
 */
export function checkBackgroundColorHistogram(canvas: HTMLCanvasElement): {
  dominantColor: 'white' | 'off-white' | 'light-gray' | 'blue' | 'dark' | 'other';
  confidence: number; // 0–100
  avgRgb: { r: number; g: number; b: number };
} {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { dominantColor: 'other', confidence: 0, avgRgb: { r: 0, g: 0, b: 0 } };

  const w = canvas.width, h = canvas.height;
  const border = Math.max(4, Math.round(Math.min(w, h) * 0.05));
  const samples: { r: number; g: number; b: number }[] = [];

  // Sample border pixels (top, bottom, left, right strips)
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const addSample = (x: number, y: number) => {
    const idx = (y * w + x) * 4;
    samples.push({ r: data[idx], g: data[idx + 1], b: data[idx + 2] });
  };

  // Top + bottom strips
  for (let x = border; x < w - border; x += Math.max(1, Math.floor(w / 20))) {
    for (let b2 = 0; b2 < border; b2++) {
      addSample(x, b2);
      addSample(x, h - 1 - b2);
    }
  }
  // Left + right strips
  for (let y = border; y < h - border; y += Math.max(1, Math.floor(h / 20))) {
    for (let b2 = 0; b2 < border; b2++) {
      addSample(b2, y);
      addSample(w - 1 - b2, y);
    }
  }

  if (samples.length === 0) return { dominantColor: 'other', confidence: 0, avgRgb: { r: 0, g: 0, b: 0 } };

  let avgR = 0, avgG = 0, avgB = 0;
  samples.forEach(s => { avgR += s.r; avgG += s.g; avgB += s.b; });
  avgR /= samples.length; avgG /= samples.length; avgB /= samples.length;

  const avg = { r: Math.round(avgR), g: Math.round(avgG), b: Math.round(avgB) };

  // Determine category with confidence bands
  const brightness = (avgR + avgG + avgB) / 3;
  const saturation = Math.max(avgR, avgG, avgB) - Math.min(avgR, avgG, avgB);

  let dominantColor: 'white' | 'off-white' | 'light-gray' | 'blue' | 'dark' | 'other';
  let confidence: number;

  if (avgR > 230 && avgG > 230 && avgB > 230) {
    dominantColor = 'white';
    confidence = Math.round(((avgR + avgG + avgB) / 3 - 230) / 25 * 100);
    confidence = Math.min(100, Math.max(0, confidence + 60));
  } else if (avgR > 200 && avgG > 200 && avgB > 200 && saturation < 25) {
    dominantColor = 'off-white';
    confidence = Math.round(75 - saturation * 2);
  } else if (brightness > 155 && brightness <= 210 && saturation < 30) {
    dominantColor = 'light-gray';
    confidence = Math.round(70 - Math.abs(brightness - 182) / 27 * 30);
  } else if (avgB > 120 && avgB > avgR + 30 && avgB > avgG + 15) {
    dominantColor = 'blue';
    confidence = Math.round(Math.min(100, (avgB - avgR) / 100 * 80 + 20));
  } else if (brightness < 60) {
    dominantColor = 'dark';
    confidence = Math.round((60 - brightness) / 60 * 100);
  } else {
    dominantColor = 'other';
    confidence = 50;
  }

  return { dominantColor, confidence: Math.min(100, Math.max(0, confidence)), avgRgb: avg };
}

/**
 * Image processing, compression, and analysis utilities running entirely in-browser RAM.
 * Canvas drawing inherently strips EXIF metadata, preserving privacy.
 */

// Compresses an image canvas using binary search to find the highest quality that fits in target KB range
export async function compressImageToTargetKB(
  canvas: HTMLCanvasElement,
  minKb: number,
  maxKb: number,
  format: string = 'image/jpeg'
): Promise<{ blob: Blob; size: number; quality: number; dataUrl: string }> {
  // Convert png or other mime types if required
  const targetMime = format === 'image/jpg' ? 'image/jpeg' : format;

  let min = 0.05;
  let max = 1.0;
  let quality = 0.85;
  let bestBlob: Blob | null = null;
  let bestSize = 0;
  let bestQuality = 0.85;

  // Run up to 9 binary search iterations
  for (let i = 0; i < 9; i++) {
    quality = (min + max) / 2;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), targetMime, quality);
    });
    
    if (!blob) break;
    const sizeKb = blob.size / 1024;

    if (sizeKb <= maxKb && sizeKb >= minKb) {
      bestBlob = blob;
      bestSize = blob.size;
      bestQuality = quality;
      // We want to try to get even higher quality if possible
      min = quality;
    } else if (sizeKb > maxKb) {
      // Too large, decrease quality upper bound
      max = quality;
    } else {
      // Too small, increase quality lower bound but keep this as a fallback
      bestBlob = blob;
      bestSize = blob.size;
      bestQuality = quality;
      min = quality;
    }
  }

  // Fallback if binary search didn't locate a perfect match
  if (!bestBlob) {
    const finalQuality = minKb > 200 ? 0.95 : 0.75;
    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), targetMime, finalQuality);
    });
    bestBlob = blob || new Blob();
    bestSize = bestBlob.size;
    bestQuality = finalQuality;
  }

  // Generate memory URL
  const dataUrl = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(bestBlob!);
  });

  return {
    blob: bestBlob!,
    size: bestSize,
    quality: bestQuality,
    dataUrl
  };
}

// Estimates image blur — legacy wrapper around the new Laplacian variance function
// Kept for backward compatibility with PhotoStudio.tsx
export function calculateBlurScore(canvas: HTMLCanvasElement): { score: number; isBlurry: boolean } {
  const result = calculateLaplacianVariance(canvas);
  return {
    score: Math.round(result.variance * 10) / 10,
    isBlurry: result.isBlurry
  };
}

// Analyzes the borders of the image to detect the background color category
export function checkBackgroundColor(canvas: HTMLCanvasElement): { color: 'white' | 'blue' | 'dark' | 'other'; rgb: string } {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { color: 'other', rgb: 'rgb(0,0,0)' };

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // We sample 40 border pixels
  const samples: { r: number; g: number; b: number }[] = [];
  const inset = 3; // Avoid edge-most artifacts

  // Top and bottom borders
  for (let x = inset; x < w - inset; x += Math.max(1, Math.floor(w / 10))) {
    const topIdx = (inset * w + x) * 4;
    const botIdx = ((h - 1 - inset) * w + x) * 4;
    samples.push({ r: data[topIdx], g: data[topIdx + 1], b: data[topIdx + 2] });
    samples.push({ r: data[botIdx], g: data[botIdx + 1], b: data[botIdx + 2] });
  }

  // Left and right borders
  for (let y = inset; y < h - inset; y += Math.max(1, Math.floor(h / 10))) {
    const leftIdx = (y * w + inset) * 4;
    const rightIdx = (y * w + (w - 1 - inset)) * 4;
    samples.push({ r: data[leftIdx], g: data[leftIdx + 1], b: data[leftIdx + 2] });
    samples.push({ r: data[rightIdx], g: data[rightIdx + 1], b: data[rightIdx + 2] });
  }

  let avgR = 0, avgG = 0, avgB = 0;
  samples.forEach(s => {
    avgR += s.r;
    avgG += s.g;
    avgB += s.b;
  });
  avgR /= samples.length;
  avgG /= samples.length;
  avgB /= samples.length;

  const isWhite = avgR > 215 && avgG > 215 && avgB > 215;
  const isBlue = avgB > 120 && avgB > avgR + 30 && avgB > avgG + 15;
  const isDark = avgR < 65 && avgG < 65 && avgB < 65;

  let label: 'white' | 'blue' | 'dark' | 'other' = 'other';
  if (isWhite) label = 'white';
  else if (isBlue) label = 'blue';
  else if (isDark) label = 'dark';

  return {
    color: label,
    rgb: `rgb(${Math.round(avgR)}, ${Math.round(avgG)}, ${Math.round(avgB)})`
  };
}

// Performs a background replacement by finding pixels matching the corner colors
// and replacing them with White, Blue, Red, or transparent
export function replaceBackgroundColor(
  canvas: HTMLCanvasElement,
  targetBgColor: 'white' | 'blue' | 'red' | 'transparent'
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  // Let's sample a few corners to identify the current background color
  const corners = [
    { r: data[0], g: data[1], b: data[2] },
    { r: data[(w - 1) * 4], g: data[(w - 1) * 4 + 1], b: data[(w - 1) * 4 + 2] },
    { r: data[(h - 1) * w * 4], g: data[(h - 1) * w * 4 + 1], b: data[(h - 1) * w * 4 + 2] }
  ];

  // Median/Average of corners background
  const bgR = (corners[0].r + corners[1].r + corners[2].r) / 3;
  const bgG = (corners[0].g + corners[1].g + corners[2].g) / 3;
  const bgB = (corners[0].b + corners[1].b + corners[2].b) / 3;

  // Define target RGB colors
  let tr = 255, tg = 255, tb = 255, ta = 255;
  if (targetBgColor === 'blue') {
    tr = 30; tg = 100; tb = 230; // Solid royal blue
  } else if (targetBgColor === 'red') {
    tr = 210; tg = 35; tb = 35; // Solid pass red
  } else if (targetBgColor === 'transparent') {
    ta = 0;
  }

  const threshold = 65; // Tolerance range for color matching

  // Create output canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return canvas;

  const outputImgData = outCtx.createImageData(w, h);
  const outData = outputImgData.data;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = (y * w + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      const a = data[idx + 3];

      // Calculate distance to sampled background color
      const dist = Math.sqrt(
        Math.pow(r - bgR, 2) + 
        Math.pow(g - bgG, 2) + 
        Math.pow(b - bgB, 2)
      );

      // Feather/antialiasing edge factor for soft transition
      if (dist < threshold) {
        const factor = Math.min(1, dist / threshold); // 0 (exact match) to 1 (near threshold)
        if (targetBgColor === 'transparent') {
          outData[idx] = r;
          outData[idx + 1] = g;
          outData[idx + 2] = b;
          outData[idx + 3] = Math.round(a * factor);
        } else {
          // Blend background with current color to avoid jagged edges
          outData[idx] = Math.round(tr * (1 - factor) + r * factor);
          outData[idx + 1] = Math.round(tg * (1 - factor) + g * factor);
          outData[idx + 2] = Math.round(tb * (1 - factor) + b * factor);
          outData[idx + 3] = a;
        }
      } else {
        // Foreground pixel
        outData[idx] = r;
        outData[idx + 1] = g;
        outData[idx + 2] = b;
        outData[idx + 3] = a;
      }
    }
  }

  outCtx.putImageData(outputImgData, 0, 0);
  return outCanvas;
}

// Appends name and current date centered inside a white block at the bottom of the photo
export function addUPSCNameDateOverlay(
  canvas: HTMLCanvasElement,
  nameText: string,
  dateText: string
): HTMLCanvasElement {
  const w = canvas.width;
  const h = canvas.height;

  // Clone canvas
  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const ctx = outCanvas.getContext('2d');
  if (!ctx) return canvas;

  // Draw original image
  ctx.drawImage(canvas, 0, 0);

  // Height of overlay banner - about 15-20% of image height
  const bannerH = Math.round(h * 0.18);
  const bannerY = h - bannerH;

  // White background banner
  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, bannerY, w, bannerH);

  // Thin black border on top of white banner
  ctx.strokeStyle = '#E2E8F0';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, bannerY);
  ctx.lineTo(w, bannerY);
  ctx.stroke();

  // Typography settings
  ctx.fillStyle = '#000000';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Scale font sizes based on banner size
  const fontSize1 = Math.max(10, Math.round(bannerH * 0.35));
  const fontSize2 = Math.max(8, Math.round(bannerH * 0.28));

  // Render Name
  ctx.font = `bold ${fontSize1}px Inter, sans-serif`;
  ctx.fillText(nameText.toUpperCase(), w / 2, bannerY + bannerH * 0.3);

  // Render Date of Photograph
  ctx.font = `${fontSize2}px JetBrains Mono, monospace`;
  ctx.fillText(`DATE: ${dateText}`, w / 2, bannerY + bannerH * 0.7);

  return outCanvas;
}

// Adjusts image contrast, brightness and sharpness to maximize signature legibility
export function enhanceSignature(
  canvas: HTMLCanvasElement,
  brightness: number = 10,  // -50 to 50
  contrast: number = 40,    // -50 to 50
  strokeThickness: number = 0 // -2 to 2 (0 is default)
): HTMLCanvasElement {
  const ctx = canvas.getContext('2d');
  if (!ctx) return canvas;

  const w = canvas.width;
  const h = canvas.height;
  const imgData = ctx.getImageData(0, 0, w, h);
  const data = imgData.data;

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  const outCtx = outCanvas.getContext('2d');
  if (!outCtx) return canvas;

  const outputImgData = outCtx.createImageData(w, h);
  const outData = outputImgData.data;

  // Convert contrast value to standard factor
  const contrastFactor = (259 * (contrast + 255)) / (255 * (259 - contrast));

  for (let idx = 0; idx < data.length; idx += 4) {
    const r = data[idx];
    const g = data[idx + 1];
    const b = data[idx + 2];
    const a = data[idx + 3];

    // Grayscale luminance
    const gray = 0.299 * r + 0.587 * g + 0.114 * b;

    // Apply brightness
    let newGray = gray + brightness;

    // Apply contrast
    newGray = contrastFactor * (newGray - 128) + 128;

    // Clamp between 0 and 255
    newGray = Math.min(255, Math.max(0, newGray));

    // Threshold high-brightness background to solid clean white
    if (newGray > 195) {
      newGray = 255;
    } else if (newGray < 90) {
      newGray = Math.max(0, newGray - 15); // Darken signature pen stroke
    }

    outData[idx] = newGray;
    outData[idx + 1] = newGray;
    outData[idx + 2] = newGray;
    outData[idx + 3] = a;
  }

  outCtx.putImageData(outputImgData, 0, 0);

  // If thickness modification is requested, apply 2D blur or dilation
  if (strokeThickness !== 0) {
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = w;
    tempCanvas.height = h;
    const tempCtx = tempCanvas.getContext('2d');
    if (tempCtx) {
      tempCtx.putImageData(outputImgData, 0, 0);
      
      // Clear outCanvas
      outCtx.clearRect(0, 0, w, h);
      
      // Render offset copies to dilate (thicken) the dark stroke
      if (strokeThickness > 0) {
        outCtx.drawImage(tempCanvas, 0, 0);
        outCtx.globalCompositeOperation = 'multiply';
        outCtx.drawImage(tempCanvas, -0.7, 0);
        outCtx.drawImage(tempCanvas, 0, -0.7);
        outCtx.drawImage(tempCanvas, 0.7, 0);
        outCtx.drawImage(tempCanvas, 0, 0.7);
      } else {
        // Erode/thin signature stroke (by screen blending)
        outCtx.drawImage(tempCanvas, 0, 0);
        outCtx.globalCompositeOperation = 'screen';
        outCtx.drawImage(tempCanvas, -0.5, 0);
        outCtx.drawImage(tempCanvas, 0, -0.5);
      }
      // Reset composite mode
      outCtx.globalCompositeOperation = 'source-over';
    }
  }

  return outCanvas;
}
