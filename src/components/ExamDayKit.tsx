import React, { useState, useRef } from 'react';
import { Download, Layout, Image as ImageIcon, PenLine, FileText, AlertCircle } from 'lucide-react';
import { ProcessedFile, ApplicationProfile } from '../types';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

interface ExamDayKitProps {
  sessionFiles: Record<string, ProcessedFile>;
  activeProfile: ApplicationProfile | null;
}

/**
 * Exam Day Kit Generator
 * Bundles validated photo + signature into a print-ready A4 contact-sheet PDF.
 * Entirely client-side — uses pdf-lib (already installed) with in-memory canvas composition.
 * Zero server calls.
 */
export default function ExamDayKit({ sessionFiles, activeProfile }: ExamDayKitProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const photoFile = sessionFiles['photo'];
  const signatureFile = sessionFiles['signature'];

  const hasPhoto = !!(photoFile?.dataUrl);
  const hasSignature = !!(signatureFile?.dataUrl);

  const buildPreviewCanvas = async (): Promise<HTMLCanvasElement> => {
    // A4 at 96dpi = 794 × 1123 px
    const W = 794, H = 1123;
    const canvas = document.createElement('canvas');
    canvas.width = W; canvas.height = H;
    const ctx = canvas.getContext('2d')!;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, W, H);

    // Header band
    ctx.fillStyle = '#312e81';
    ctx.fillRect(0, 0, W, 80);
    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 22px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    ctx.fillText('DocSprint — Exam Day Kit', 36, 40);

    ctx.font = '13px monospace';
    ctx.fillStyle = '#a5b4fc';
    ctx.textAlign = 'right';
    ctx.fillText(new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }), W - 36, 40);

    if (activeProfile) {
      ctx.font = '11px monospace';
      ctx.fillStyle = '#c7d2fe';
      ctx.fillText(activeProfile.name, W - 36, 60);
    }

    // Section: Passport Photos (3×2 grid)
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('PASSPORT PHOTOS (6 copies)', 36, 100);

    if (hasPhoto) {
      const photoImg = new Image();
      await new Promise<void>((res, rej) => {
        photoImg.onload = () => res();
        photoImg.onerror = () => rej();
        photoImg.src = photoFile.dataUrl;
      });

      // 3 columns × 2 rows of passport photos
      const photoW = 175, photoH = 220;
      const cols = 3, rows = 2;
      const startX = 36, startY = 118;
      const gapX = 18, gapY = 14;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const x = startX + col * (photoW + gapX);
          const y = startY + row * (photoH + gapY);
          // White bg + subtle shadow border
          ctx.fillStyle = '#f4f4f5';
          ctx.fillRect(x - 2, y - 2, photoW + 4, photoH + 4);
          ctx.drawImage(photoImg, x, y, photoW, photoH);
        }
      }
    } else {
      ctx.fillStyle = '#e4e4e7';
      ctx.fillRect(36, 118, 722, 220);
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '13px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No photo in session — process a photo first', 398, 228);
    }

    // Divider
    const divY = 600;
    ctx.strokeStyle = '#e4e4e7';
    ctx.lineWidth = 1;
    ctx.setLineDash([6, 4]);
    ctx.beginPath(); ctx.moveTo(36, divY); ctx.lineTo(W - 36, divY); ctx.stroke();
    ctx.setLineDash([]);

    // Section: Signatures
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('SIGNATURES (3 copies)', 36, 614);

    if (hasSignature) {
      const sigImg = new Image();
      await new Promise<void>((res, rej) => {
        sigImg.onload = () => res();
        sigImg.onerror = () => rej();
        sigImg.src = signatureFile.dataUrl;
      });

      const sigW = 200, sigH = 70;
      const sigStartX = 36, sigStartY = 632;
      const sigGap = 24;

      for (let i = 0; i < 3; i++) {
        const x = sigStartX + i * (sigW + sigGap);
        ctx.fillStyle = '#f8f8f9';
        ctx.strokeStyle = '#e4e4e7';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(x - 2, sigStartY - 2, sigW + 4, sigH + 4, 4);
        ctx.fill();
        ctx.stroke();
        ctx.drawImage(sigImg, x, sigStartY, sigW, sigH);
      }
    } else {
      ctx.fillStyle = '#e4e4e7';
      ctx.fillRect(36, 632, 670, 70);
      ctx.fillStyle = '#a1a1aa';
      ctx.font = '12px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('No signature in session', 380, 667);
    }

    // Section: Checklist
    const checklistY = 740;
    ctx.fillStyle = '#1e1b4b';
    ctx.font = 'bold 13px Inter, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    ctx.fillText('EXAM DAY CHECKLIST', 36, checklistY);

    const checkItems = [
      'Admit Card — printed + digital copy',
      'Passport photo (3 copies minimum)',
      'ID proof: Aadhaar / PAN / Passport (original)',
      'Pen (blue/black ballpoint)',
      'Signed declaration form if applicable',
      ...(activeProfile?.documents.map((d) => `${d.name} — ${d.required ? 'REQUIRED' : 'Optional'}`) ?? []),
    ];

    ctx.font = '12px Inter, sans-serif';
    ctx.fillStyle = '#3f3f46';
    checkItems.slice(0, 8).forEach((item, i) => {
      const y = checklistY + 22 + i * 22;
      // Checkbox
      ctx.strokeStyle = '#6366f1';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.roundRect(36, y, 14, 14, 2);
      ctx.stroke();
      ctx.fillStyle = '#3f3f46';
      ctx.fillText(item, 60, y + 1);
    });

    // Footer
    ctx.fillStyle = '#f4f4f5';
    ctx.fillRect(0, H - 48, W, 48);
    ctx.fillStyle = '#71717a';
    ctx.font = '10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(
      `Generated by DocSprint · ${new Date().toLocaleString('en-IN')} · All data processed in-browser RAM only`,
      W / 2, H - 24
    );

    return canvas;
  };

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    try {
      const canvas = await buildPreviewCanvas();
      setPreviewUrl(canvas.toDataURL('image/png'));

      // Generate PDF via pdf-lib
      const pdfDoc = await PDFDocument.create();
      const page = pdfDoc.addPage([595.28, 841.89]); // A4 in points

      // Embed canvas as image
      const imgBytes = await fetch(canvas.toDataURL('image/png')).then((r) => r.arrayBuffer());
      const img = await pdfDoc.embedPng(imgBytes);
      page.drawImage(img, { x: 0, y: 0, width: 595.28, height: 841.89 });

      const pdfBytes = await pdfDoc.save();
      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocSprint_ExamDayKit_${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Exam kit generation failed:', err);
      alert('Failed to generate Exam Day Kit PDF.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownloadImage = async () => {
    setIsGenerating(true);
    try {
      const canvas = await buildPreviewCanvas();
      const url = canvas.toDataURL('image/png');
      setPreviewUrl(url);
      const a = document.createElement('a');
      a.href = url;
      a.download = `DocSprint_ExamDayKit_${Date.now()}.png`;
      a.click();
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 font-sans" id="exam-day-kit-component">
      {/* Header */}
      <div>
        <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
          <Layout className="h-5 w-5 text-indigo-700" />
          Exam Day Kit Generator
        </h2>
        <p className="text-sm text-zinc-500 mt-1">
          Bundles your validated photo and signature into a single print-ready A4 sheet — exactly what exam centers want.
        </p>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <div className={`rounded-xl border p-4 space-y-1 ${hasPhoto ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className="flex items-center gap-2">
            <ImageIcon className={`h-4 w-4 ${hasPhoto ? 'text-emerald-600' : 'text-zinc-400'}`} />
            <span className="text-xs font-semibold text-zinc-700">Passport Photo</span>
          </div>
          <p className={`text-[11px] font-mono ${hasPhoto ? 'text-emerald-700' : 'text-zinc-400'}`}>
            {hasPhoto ? `✓ ${(photoFile.size / 1024).toFixed(0)}KB · ${photoFile.width}×${photoFile.height}px` : 'Not in session yet'}
          </p>
        </div>

        <div className={`rounded-xl border p-4 space-y-1 ${hasSignature ? 'border-emerald-200 bg-emerald-50' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className="flex items-center gap-2">
            <PenLine className={`h-4 w-4 ${hasSignature ? 'text-emerald-600' : 'text-zinc-400'}`} />
            <span className="text-xs font-semibold text-zinc-700">Signature</span>
          </div>
          <p className={`text-[11px] font-mono ${hasSignature ? 'text-emerald-700' : 'text-zinc-400'}`}>
            {hasSignature ? `✓ ${(signatureFile.size / 1024).toFixed(0)}KB ready` : 'Not in session yet'}
          </p>
        </div>

        <div className={`rounded-xl border p-4 space-y-1 col-span-2 sm:col-span-1 ${activeProfile ? 'border-indigo-200 bg-indigo-50' : 'border-zinc-200 bg-zinc-50'}`}>
          <div className="flex items-center gap-2">
            <FileText className={`h-4 w-4 ${activeProfile ? 'text-indigo-600' : 'text-zinc-400'}`} />
            <span className="text-xs font-semibold text-zinc-700">Profile</span>
          </div>
          <p className={`text-[11px] font-mono ${activeProfile ? 'text-indigo-700' : 'text-zinc-400'}`}>
            {activeProfile ? activeProfile.name : 'No profile selected'}
          </p>
        </div>
      </div>

      {/* Warning if neither file available */}
      {!hasPhoto && !hasSignature && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertCircle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs text-amber-800">
            <strong>No session files found.</strong> Process a photo in Photo Studio first, then come back here to generate your kit.
            The kit works with whatever is in your current session — even just a photo alone.
          </div>
        </div>
      )}

      {/* Preview */}
      {previewUrl && (
        <div className="rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
          <div className="bg-zinc-100 border-b border-zinc-200 px-4 py-2 text-[10px] font-mono text-zinc-500 uppercase tracking-wider">
            A4 Preview — Print at 100% scale
          </div>
          <img src={previewUrl} alt="Exam Day Kit Preview" className="w-full" />
        </div>
      )}

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={handleGeneratePDF}
          disabled={isGenerating || (!hasPhoto && !hasSignature)}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-sm transition disabled:opacity-50 shadow-sm"
          id="generate-pdf-btn"
        >
          <Download className="h-4 w-4" />
          {isGenerating ? 'Generating...' : 'Download as PDF'}
        </button>
        <button
          onClick={handleDownloadImage}
          disabled={isGenerating || (!hasPhoto && !hasSignature)}
          className="flex-1 flex items-center justify-center gap-2 h-12 rounded-xl border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-semibold text-sm transition disabled:opacity-50"
          id="download-image-btn"
        >
          <ImageIcon className="h-4 w-4" />
          Download as PNG
        </button>
      </div>

      <p className="text-center text-[10px] text-zinc-400 font-mono">
        Layout composed in browser RAM · No data leaves your device · Print at 100% scale on A4
      </p>
    </div>
  );
}
