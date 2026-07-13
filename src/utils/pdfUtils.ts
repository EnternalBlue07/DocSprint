import { PDFDocument, degrees, rgb } from 'pdf-lib';

/**
 * PDF Toolkit processing utility running 100% in-browser.
 * Complies with the zero-retention privacy mandate.
 */

// Standard page sizes in PDF points (1pt = 1/72 inch)
export const PAGE_SIZES = {
  a4: { width: 595.28, height: 841.89 },
  letter: { width: 612, height: 792 },
  legal: { width: 612, height: 1008 },
  a5: { width: 419.53, height: 595.28 },
} as const;

export type PageSizeKey = keyof typeof PAGE_SIZES;

// Merges multiple PDF ArrayBuffers into a single PDF
export async function mergePDFs(buffers: ArrayBuffer[]): Promise<Uint8Array> {
  const mergedPdf = await PDFDocument.create();
  for (const buffer of buffers) {
    const pdfDoc = await PDFDocument.load(buffer);
    const pageIndices = pdfDoc.getPageIndices();
    const copiedPages = await mergedPdf.copyPages(pdfDoc, pageIndices);
    copiedPages.forEach((page) => mergedPdf.addPage(page));
  }
  return await mergedPdf.save({ useObjectStreams: true });
}

// Splits a PDF returning only the specified page indices (0-indexed)
export async function splitPDF(buffer: ArrayBuffer, pageRangeText: string): Promise<Uint8Array> {
  const sourcePdf = await PDFDocument.load(buffer);
  const totalPages = sourcePdf.getPageCount();
  const splitPdf = await PDFDocument.create();
  const targetPages: number[] = [];
  const parts = pageRangeText.split(',');

  for (const part of parts) {
    const trimmed = part.trim();
    if (trimmed.includes('-')) {
      const [startStr, endStr] = trimmed.split('-');
      const start = parseInt(startStr, 10);
      const end = parseInt(endStr, 10);
      if (!isNaN(start) && !isNaN(end)) {
        for (let i = start; i <= end; i++) {
          if (i >= 1 && i <= totalPages) targetPages.push(i - 1);
        }
      }
    } else {
      const pageNum = parseInt(trimmed, 10);
      if (!isNaN(pageNum) && pageNum >= 1 && pageNum <= totalPages) targetPages.push(pageNum - 1);
    }
  }

  const uniquePages = Array.from(new Set(targetPages)).sort((a, b) => a - b);
  if (uniquePages.length === 0) throw new Error('No valid pages selected for splitting');

  const copiedPages = await splitPdf.copyPages(sourcePdf, uniquePages);
  copiedPages.forEach((page) => splitPdf.addPage(page));
  return await splitPdf.save({ useObjectStreams: true });
}

// Rotates page(s) of a PDF file by 90-degree increments
export async function rotatePDF(
  buffer: ArrayBuffer,
  angle: number,
  targetPageIndex: number = -1
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer);
  const pages = pdfDoc.getPages();

  const applyRotation = (idx: number) => {
    const page = pages[idx];
    const currentRotation = page.getRotation().angle;
    page.setRotation(degrees((currentRotation + angle) % 360));
  };

  if (targetPageIndex === -1) {
    for (let i = 0; i < pages.length; i++) applyRotation(i);
  } else if (targetPageIndex >= 0 && targetPageIndex < pages.length) {
    applyRotation(targetPageIndex);
  }

  return await pdfDoc.save({ useObjectStreams: true });
}

// Converts multiple images (JPEGs or PNGs) into a PDF document
// Each image is placed at its native size. Use scannedImagesToPDF for page-sized output.
export async function imagesToPDF(
  images: { dataUrl: string; type: string }[]
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();

  for (const img of images) {
    const base64Data = img.dataUrl.split(',')[1];
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

    let embeddedImage;
    if (img.type.includes('png')) {
      embeddedImage = await pdfDoc.embedPng(bytes);
    } else {
      embeddedImage = await pdfDoc.embedJpg(bytes);
    }

    const page = pdfDoc.addPage([embeddedImage.width, embeddedImage.height]);
    page.drawImage(embeddedImage, { x: 0, y: 0, width: embeddedImage.width, height: embeddedImage.height });
  }

  return await pdfDoc.save({ useObjectStreams: true });
}

/**
 * Converts scanned images into a properly sized PDF document (A4, Letter, etc.)
 * Each image is scaled to fit the page with margins, centered cleanly — like CamScanner output.
 */
export async function scannedImagesToPDF(
  images: { dataUrl: string; type: string }[],
  pageSize: PageSizeKey = 'a4',
  marginPt: number = 20,
  backgroundColor: { r: number; g: number; b: number } = { r: 1, g: 1, b: 1 }
): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const { width: pageW, height: pageH } = PAGE_SIZES[pageSize];

  for (const img of images) {
    const base64Data = img.dataUrl.split(',')[1];
    const binaryString = window.atob(base64Data);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) bytes[i] = binaryString.charCodeAt(i);

    let embeddedImage;
    try {
      if (img.type.includes('png')) {
        embeddedImage = await pdfDoc.embedPng(bytes);
      } else {
        embeddedImage = await pdfDoc.embedJpg(bytes);
      }
    } catch {
      // Try jpg fallback
      try {
        embeddedImage = await pdfDoc.embedJpg(bytes);
      } catch {
        continue;
      }
    }

    const page = pdfDoc.addPage([pageW, pageH]);

    // Fill background
    page.drawRectangle({
      x: 0, y: 0, width: pageW, height: pageH,
      color: rgb(backgroundColor.r, backgroundColor.g, backgroundColor.b),
    });

    // Calculate fitted dimensions preserving aspect ratio
    const availW = pageW - marginPt * 2;
    const availH = pageH - marginPt * 2;
    const imgW = embeddedImage.width;
    const imgH = embeddedImage.height;
    const scale = Math.min(availW / imgW, availH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    // Center image on page
    const drawX = (pageW - drawW) / 2;
    const drawY = (pageH - drawH) / 2;

    page.drawImage(embeddedImage, { x: drawX, y: drawY, width: drawW, height: drawH });
  }

  return await pdfDoc.save({ useObjectStreams: true });
}

// Compresses PDF size by rebuilding structures and optimizing layout streams
export async function optimizePDFStructure(buffer: ArrayBuffer): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.load(buffer);
  return await pdfDoc.save({ useObjectStreams: true });
}

// Compresses a PDF in-browser RAM by rendering pages via PDF.js to compressed JPEGs and rebuilding the document
export async function compressPDF(
  buffer: ArrayBuffer,
  quality: number = 0.6,
  scale: number = 1.2
): Promise<Uint8Array> {
  const pdfjsLib = (window as any).pdfjsLib;
  if (!pdfjsLib) {
    throw new Error('PDF.js library is not loaded. Please verify your internet connection.');
  }

  const loadingTask = pdfjsLib.getDocument({ data: buffer.slice(0) });
  const pdfDoc = await loadingTask.promise;
  const numPages = pdfDoc.numPages;
  const images: { dataUrl: string; type: string }[] = [];

  for (let pageNum = 1; pageNum <= numPages; pageNum++) {
    const page = await pdfDoc.getPage(pageNum);
    const viewport = page.getViewport({ scale });
    
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    if (!context) throw new Error('Could not create 2D canvas context');
    
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    
    const renderContext = {
      canvasContext: context,
      viewport: viewport
    };
    
    await page.render(renderContext).promise;
    
    const dataUrl = canvas.toDataURL('image/jpeg', quality);
    images.push({ dataUrl, type: 'image/jpeg' });
  }

  return await scannedImagesToPDF(images, 'a4', 0);
}

// Compresses or pads a PDF in-browser RAM to match a user-specified target size in KB (on the safer side, strictly below the target)
export async function compressPDFToTarget(
  buffer: ArrayBuffer,
  targetSizeKb: number,
  onProgress?: (msg: string) => void
): Promise<Uint8Array> {
  // Proportional safety margin: 6 KB minimum, up to 26 KB (e.g. 26 KB safety buffer for 1024 KB target to hit 998 KB exactly)
  const safetyMarginKb = Math.max(6, Math.min(26, Math.round(targetSizeKb * 0.025)));
  const targetSizeBytes = (targetSizeKb - safetyMarginKb) * 1024;
  
  // 1. Estimate initial parameters based on target size
  let scale = 1.2;
  let quality = 0.6;
  
  if (targetSizeKb < 300) {
    scale = 0.9;
    quality = 0.4;
  } else if (targetSizeKb > 800) {
    scale = 1.8;
    quality = 0.85;
  }

  onProgress?.("Rendering initial compression draft...");
  let pdfBytes = await compressPDF(buffer, quality, scale);

  // 2. Adjust parameters based on output size (max 3 iterations)
  let attempts = 0;
  
  while (attempts < 2) {
    const currentSize = pdfBytes.length;
    
    // If we are larger than the target, reduce quality/scale. No tolerance on upper side to keep it strictly below target size!
    if (currentSize > targetSizeBytes) {
      attempts++;
      scale = Math.max(0.7, scale * 0.85);
      quality = Math.max(0.3, quality * 0.8);
      onProgress?.(`File size (${Math.round(currentSize/1024)} KB) is above target. Reducing quality...`);
      pdfBytes = await compressPDF(buffer, quality, scale);
    }
    // If we are significantly smaller than target, increase quality/scale
    else if (currentSize < targetSizeBytes * 0.9 && (scale < 2.2 || quality < 0.9)) {
      attempts++;
      scale = Math.min(2.5, scale * 1.3);
      quality = Math.min(0.95, quality * 1.2);
      onProgress?.(`File size (${Math.round(currentSize/1024)} KB) is below target. Upscaling resolution...`);
      pdfBytes = await compressPDF(buffer, quality, scale);
    }
    else {
      break;
    }
  }

  // 3. If size is still smaller than the target, pad the file to the EXACT target byte size (including safety margin)
  if (pdfBytes.length < targetSizeBytes) {
    const paddingNeeded = targetSizeBytes - pdfBytes.length;
    if (paddingNeeded > 4) {
      onProgress?.(`Padding file size to match safer-side target (${Math.round(targetSizeBytes/1024)} KB)...`);
      // PDF allows comments anywhere. We append a comment line with padding characters at the end of the file.
      const commentString = `\n%padding_to_match_target_size_${'0'.repeat(paddingNeeded - 32)}\n`;
      const paddingBytes = new TextEncoder().encode(commentString);
      
      const paddedBytes = new Uint8Array(pdfBytes.length + paddingBytes.length);
      paddedBytes.set(pdfBytes);
      paddedBytes.set(paddingBytes, pdfBytes.length);
      return paddedBytes;
    }
  }

  return pdfBytes;
}


