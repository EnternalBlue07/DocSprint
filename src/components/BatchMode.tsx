import React, { useState, useRef } from 'react';
import { Upload, Download, CheckCircle2, XCircle, Loader2, Layers, FileText, Package, ToggleLeft, ToggleRight } from 'lucide-react';
import { ApplicationProfile, ProcessedFile, ConfidenceScore } from '../types';
import { compressImageToTargetKB, replaceBackgroundColor, checkBackgroundColor, calculateBlurScore } from '../utils/imageUtils';
import { computeConfidenceScore } from '../utils/confidenceEngine';
import { imagesToPDF } from '../utils/pdfUtils';

interface BatchModeProps {
  activeProfile: ApplicationProfile | null;
  onAddDeletionLog: (fileName: string) => void;
  onSaveProcessedFile: (file: any) => void;
}

type BatchFileStatus = 'queued' | 'processing' | 'done' | 'failed';

interface BatchFile {
  id: string;
  file: File;
  originalUrl: string;
  status: BatchFileStatus;
  resultUrl?: string;
  resultSize?: number;
  confidenceScore?: ConfidenceScore;
  error?: string;
}

function generateZip(files: { name: string; dataUrl: string }[]): void {
  files.forEach((f, i) => {
    setTimeout(() => {
      const a = document.createElement('a');
      a.href = f.dataUrl;
      a.download = f.name;
      a.click();
    }, i * 400);
  });
}

const blobToDataUrl = (blob: Blob): Promise<string> =>
  new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.readAsDataURL(blob);
  });

export default function BatchMode({ activeProfile, onAddDeletionLog, onSaveProcessedFile }: BatchModeProps) {
  const [batchFiles, setBatchFiles] = useState<BatchFile[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [exportAsPdf, setExportAsPdf] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const photoSpec = activeProfile?.documents.find((d) => d.type === 'photo')?.spec;

  const loadFiles = async (files: FileList) => {
    const newBatch: BatchFile[] = [];
    for (let i = 0; i < Math.min(files.length, 10); i++) {
      const file = files[i];
      if (!file.type.includes('image')) continue;
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.readAsDataURL(file);
      });
      newBatch.push({
        id: `batch-${Date.now()}-${i}`,
        file,
        originalUrl: dataUrl,
        status: 'queued',
      });
    }
    setBatchFiles((prev) => [...prev, ...newBatch].slice(0, 10));
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    await loadFiles(e.dataTransfer.files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) await loadFiles(e.target.files);
  };

  const processFile = async (bf: BatchFile): Promise<BatchFile> => {
    return new Promise(async (resolve) => {
      try {
        const img = new Image();
        await new Promise<void>((res, rej) => {
          img.onload = () => res();
          img.onerror = () => rej(new Error('Load failed'));
          img.src = bf.originalUrl;
        });

        const canvas = document.createElement('canvas');
        const spec = photoSpec;
        const aspect = spec?.aspectRatio ?? (3.5 / 4.5);
        const targetW = spec?.widthPx ?? 413;
        const targetH = Math.round(targetW / aspect);
        canvas.width = targetW; canvas.height = targetH;

        const ctx = canvas.getContext('2d')!;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetW, targetH);

        const imgAspect = img.naturalWidth / img.naturalHeight;
        let drawW = targetW, drawH = targetW / imgAspect;
        if (drawH < targetH) { drawH = targetH; drawW = targetH * imgAspect; }
        ctx.drawImage(img, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH);

        if (spec?.bgColors?.includes('white')) {
          const bgCanvas = replaceBackgroundColor(canvas, 'white');
          ctx.clearRect(0, 0, targetW, targetH);
          ctx.drawImage(bgCanvas, 0, 0);
        }

        const minKb = spec?.minKb ?? 20;
        const maxKb = spec?.maxKb ?? 50;
        const fmt = spec?.formats?.[0].includes('png') ? 'image/png' : 'image/jpeg';
        const result = await compressImageToTargetKB(canvas, minKb, maxKb, fmt);
        const cs = computeConfidenceScore(canvas, spec as any ?? { minKb, maxKb, formats: [fmt] }, 'photo', result.size);

        onAddDeletionLog(bf.file.name);
        resolve({
          ...bf,
          status: 'done',
          resultUrl: result.dataUrl,
          resultSize: result.size,
          confidenceScore: cs,
        });
      } catch (err: any) {
        resolve({ ...bf, status: 'failed', error: err.message ?? 'Processing failed' });
      }
    });
  };

  const runBatch = async () => {
    if (isRunning || batchFiles.length === 0) return;
    setIsRunning(true);

    const updatedFiles = [...batchFiles];

    for (let i = 0; i < updatedFiles.length; i++) {
      if (updatedFiles[i].status !== 'queued') continue;

      setBatchFiles((prev) =>
        prev.map((f, idx) => idx === i ? { ...f, status: 'processing' } : f)
      );
      await new Promise((r) => setTimeout(r, 50));

      const result = await processFile(updatedFiles[i]);
      updatedFiles[i] = result;

      setBatchFiles((prev) =>
        prev.map((f, idx) => idx === i ? result : f)
      );
    }

    setIsRunning(false);
  };

  const downloadAll = async () => {
    const done = batchFiles.filter((f) => f.status === 'done' && f.resultUrl);

    if (exportAsPdf && done.length > 0) {
      // Bundle all into one PDF
      try {
        const images = done.map((f) => ({
          dataUrl: f.resultUrl!,
          type: f.file.type.includes('png') ? 'image/png' : 'image/jpeg',
        }));
        const pdfBytes = await imagesToPDF(images);
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const pdfUrl = await blobToDataUrl(pdfBlob);
        const a = document.createElement('a');
        a.href = pdfUrl;
        a.download = `DocSprint_Batch_${Date.now()}.pdf`;
        a.click();
      } catch (e) {
        console.error('PDF bundling failed:', e);
        alert('Failed to generate PDF. Try downloading individually.');
      }
    } else {
      generateZip(done.map((f, i) => ({
        name: `DocSprint_Batch_${i + 1}_${f.file.name}`,
        dataUrl: f.resultUrl!,
      })));
    }
  };

  const clearAll = () => setBatchFiles([]);

  const completedCount = batchFiles.filter((f) => f.status === 'done').length;
  const failedCount = batchFiles.filter((f) => f.status === 'failed').length;
  const totalQueued = batchFiles.filter((f) => f.status === 'queued').length;

  return (
    <div className="space-y-6 font-sans" id="batch-mode-component">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-700" />
            Batch Processing Mode
          </h2>
          <p className="text-sm text-zinc-500 mt-1">
            Upload up to 10 photos at once. All processed through the {activeProfile ? `${activeProfile.name} ` : ''}spec pipeline sequentially in RAM.
          </p>
        </div>
        {batchFiles.length > 0 && (
          <button onClick={clearAll} className="text-xs text-zinc-500 hover:text-zinc-700 underline">
            Clear All
          </button>
        )}
      </div>

      {/* Drop Zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`flex flex-col items-center justify-center border-2 border-dashed rounded-xl p-10 cursor-pointer transition-all ${
          isDragging
            ? 'border-indigo-500 bg-indigo-50/60 scale-[1.01]'
            : 'border-zinc-200 bg-zinc-50/50 hover:border-indigo-300 hover:bg-zinc-50'
        }`}
        id="batch-dropzone"
      >
        <Layers className={`h-10 w-10 mb-3 transition-colors ${isDragging ? 'text-indigo-600' : 'text-zinc-400'}`} />
        <h3 className="text-sm font-semibold text-zinc-800">Drop up to 10 photos here</h3>
        <p className="text-xs text-zinc-500 mt-1">
          {activeProfile
            ? `Will process using ${activeProfile.name} photo spec`
            : 'No profile selected — will use default 20–50KB JPEG settings'}
        </p>
        <span className="mt-3 text-[10px] font-mono bg-white border border-zinc-200 px-2 py-1 rounded text-zinc-500">
          JPEG · PNG · Max 10 files
        </span>
        <input type="file" ref={fileInputRef} onChange={handleFileInput} accept="image/*" multiple className="hidden" />
      </div>

      {/* File Conveyor Belt */}
      {batchFiles.length > 0 && (
        <div className="space-y-3" id="batch-conveyor">
          <div className="flex items-center justify-between text-xs text-zinc-500 font-mono">
            <span>{batchFiles.length} file{batchFiles.length !== 1 ? 's' : ''} queued</span>
            <span className="flex gap-3">
              {completedCount > 0 && <span className="text-emerald-600">✓ {completedCount} done</span>}
              {failedCount > 0 && <span className="text-red-600">✗ {failedCount} failed</span>}
              {totalQueued > 0 && <span className="text-zinc-400">⏳ {totalQueued} waiting</span>}
            </span>
          </div>

          <div className="space-y-2">
            {batchFiles.map((bf, idx) => (
              <div
                key={bf.id}
                className={`flex items-center gap-3 rounded-xl border px-4 py-3 transition-all duration-300 ${
                  bf.status === 'done' ? 'border-emerald-200 bg-emerald-50/50' :
                  bf.status === 'failed' ? 'border-red-200 bg-red-50/30' :
                  bf.status === 'processing' ? 'border-indigo-300 bg-indigo-50/50 shadow-sm' :
                  'border-zinc-200 bg-white'
                }`}
                id={`batch-file-${idx}`}
              >
                <div className="h-12 w-12 rounded-lg overflow-hidden bg-zinc-100 flex-shrink-0 border border-zinc-200">
                  {bf.resultUrl ? (
                    <img src={bf.resultUrl} alt={bf.file.name} className="h-full w-full object-cover" />
                  ) : (
                    <img src={bf.originalUrl} alt={bf.file.name} className="h-full w-full object-cover opacity-60" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-zinc-800 truncate">{bf.file.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {(bf.file.size / 1024).toFixed(0)}KB original
                    </span>
                    {bf.resultSize && (
                      <span className="text-[10px] text-emerald-600 font-mono">
                        → {(bf.resultSize / 1024).toFixed(0)}KB
                      </span>
                    )}
                    {bf.confidenceScore && (
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full font-mono ${
                        bf.confidenceScore.overall >= 88 ? 'bg-emerald-100 text-emerald-700' :
                        bf.confidenceScore.overall >= 70 ? 'bg-blue-100 text-blue-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {bf.confidenceScore.overall}/100
                      </span>
                    )}
                  </div>
                  {bf.error && <p className="text-[10px] text-red-600 mt-0.5">{bf.error}</p>}
                </div>

                <div className="flex-shrink-0">
                  {bf.status === 'queued' && <div className="h-6 w-6 rounded-full border-2 border-zinc-200 bg-zinc-100" />}
                  {bf.status === 'processing' && <Loader2 className="h-6 w-6 text-indigo-600 animate-spin" />}
                  {bf.status === 'done' && <CheckCircle2 className="h-6 w-6 text-emerald-500" />}
                  {bf.status === 'failed' && <XCircle className="h-6 w-6 text-red-500" />}
                </div>

                {bf.status === 'done' && bf.resultUrl && (
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = bf.resultUrl!;
                      a.download = `DocSprint_${bf.file.name}`;
                      a.click();
                    }}
                    className="flex-shrink-0 text-[10px] font-medium text-zinc-500 hover:text-indigo-700 underline"
                  >
                    ↓
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action Buttons */}
      {batchFiles.length > 0 && (
        <div className="space-y-3">
          {/* PDF toggle */}
          {completedCount > 0 && (
            <div className="flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-indigo-600" />
                <div>
                  <p className="text-xs font-semibold text-zinc-800">Bundle into PDF</p>
                  <p className="text-[10px] text-zinc-500">Download all {completedCount} images as one PDF file</p>
                </div>
              </div>
              <button
                onClick={() => setExportAsPdf((v) => !v)}
                className="flex-shrink-0"
                aria-label="Toggle PDF export"
              >
                {exportAsPdf
                  ? <ToggleRight className="h-7 w-7 text-indigo-600" />
                  : <ToggleLeft className="h-7 w-7 text-zinc-400" />}
              </button>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={runBatch}
              disabled={isRunning || totalQueued === 0}
              className="flex-1 flex items-center justify-center gap-2 h-11 rounded-xl bg-indigo-800 hover:bg-indigo-700 text-white font-bold text-sm transition disabled:opacity-50 shadow-sm"
              id="run-batch-btn"
            >
              {isRunning ? <><Loader2 className="h-4 w-4 animate-spin" />Processing…</> : <><Layers className="h-4 w-4" />Run Batch ({totalQueued} queued)</>}
            </button>

            {completedCount > 0 && (
              <button
                onClick={downloadAll}
                className="flex items-center justify-center gap-2 h-11 px-5 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-sm transition"
                id="download-all-btn"
              >
                {exportAsPdf ? <FileText className="h-4 w-4" /> : <Download className="h-4 w-4" />}
                {exportAsPdf ? `PDF (${completedCount})` : `Download All (${completedCount})`}
              </button>
            )}
          </div>
        </div>
      )}

      <div className="text-center text-[10px] text-zinc-400 font-mono">
        All batch processing runs sequentially in browser RAM · No files uploaded to any server
      </div>
    </div>
  );
}
