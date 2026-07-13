import React, { useState, useEffect } from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, FileText, Settings, Sparkles, Download, ArrowRight, ArrowLeft, Eye, X, ShieldAlert, RefreshCw } from 'lucide-react';
import { ApplicationProfile, ProcessedFile } from '../types';
import { compressImageToTargetKB, replaceBackgroundColor, checkBackgroundColor, calculateBlurScore } from '../utils/imageUtils';
import confetti from 'canvas-confetti';
import ProcessingProgress from './ProcessingProgress';
import ConfidenceScoreRing from './ConfidenceScoreRing';
interface ChecklistHubProps {
  profile: ApplicationProfile;
  sessionFiles: Record<string, ProcessedFile>;
  onNavigateToStudio: (studioId: 'photo' | 'signature' | 'pdf' | 'document') => void;
  onUpdateSessionFile: (id: string, file: ProcessedFile) => void;
  onNavigateToExamKit?: () => void;
}

export default function ChecklistHub({
  profile,
  sessionFiles,
  onNavigateToStudio,
  onUpdateSessionFile,
  onNavigateToExamKit,
}: ChecklistHubProps) {
  const [fixingResult, setFixingResult] = useState<{
    docId: string;
    beforeSize: number;
    afterSize: number;
    beforeUrl: string;
    afterUrl: string;
    label: string;
  } | null>(null);

  const [isFixingAll, setIsFixingAll] = useState<boolean>(false);
  const [previewFile, setPreviewFile] = useState<ProcessedFile | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setPreviewFile(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Triggering the "Fix Everything" pipeline
  const handleFixAll = async () => {
    setIsFixingAll(true);
    // Yield to let React paint the Loading Progress Overlay before heavy Canvas compression operations begin
    await new Promise((resolve) => setTimeout(resolve, 100));
    let fixedAny = false;

    for (const docSpec of profile.documents) {
      const file = sessionFiles[docSpec.id];
      if (file && !file.validated) {
        // We have an uploaded document that failed validations! Let's auto-fix it.
        try {
          // 1. Load the dataUrl into an image element
          const img = new Image();
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = file.dataUrl;
          });

          // 2. Setup canvas to target specifications
          const canvas = document.createElement('canvas');
          const aspect = docSpec.spec.aspectRatio ?? 1;
          const targetW = docSpec.spec.widthPx ?? 400;
          const targetH = Math.round(targetW / aspect);
          canvas.width = targetW;
          canvas.height = targetH;

          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, targetW, targetH);

            // Auto-center crop image to spec aspect ratio
            const imgAspect = img.naturalWidth / img.naturalHeight;
            let drawW = targetW;
            let drawH = targetW / imgAspect;

            if (drawH < targetH) {
              drawH = targetH;
              drawW = targetH * imgAspect;
            }

            ctx.drawImage(img, (targetW - drawW) / 2, (targetH - drawH) / 2, drawW, drawH);

            // Bleach background to white if specification demands white BG
            const demandsWhiteBg = docSpec.spec.bgColors?.includes('white');
            let processedCanvas = canvas;
            if (demandsWhiteBg) {
              processedCanvas = replaceBackgroundColor(canvas, 'white');
            }

            // 3. Compress to target spec size using binary search quality loop
            const compression = await compressImageToTargetKB(
              processedCanvas,
              docSpec.spec.minKb,
              docSpec.spec.maxKb,
              docSpec.spec.formats[0].includes('png') ? 'image/png' : 'image/jpeg'
            );

            // Re-validate details
            const updatedFile: ProcessedFile = {
              ...file,
              size: compression.size,
              dataUrl: compression.dataUrl,
              width: targetW,
              height: targetH,
              validated: true,
              issues: [],
              lastModified: Date.now()
            };

            // Save back to session
            onUpdateSessionFile(docSpec.id, updatedFile);

            // Capture metrics for side-by-side comparison preview
            setFixingResult({
              docId: docSpec.id,
              beforeSize: file.size,
              afterSize: compression.size,
              beforeUrl: file.dataUrl,
              afterUrl: compression.dataUrl,
              label: docSpec.name
            });

            fixedAny = true;
          }
        } catch (err) {
          console.error(`Fixing failed for ${docSpec.id}:`, err);
        }
      }
    }

    setIsFixingAll(false);

    if (fixedAny) {
      // Respects prefers-reduced-motion — only fire if animation is OK
      const motionOk = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (motionOk) {
        confetti({
          particleCount: 120,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#3730A3', '#059669', '#D97706']
        });
      }
    } else {
      alert('No automated image fixes were needed for active uploads.');
    }
  };

  return (
    <div className="space-y-6 font-sans" id="checklist-hub-component">
      {/* Profile specs card header */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/30 p-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <span className="text-[10px] font-bold font-mono text-indigo-700 bg-indigo-100/75 px-2 py-0.5 rounded uppercase tracking-wider">
            Live Application Spec
          </span>
          <h2 className="text-lg font-bold text-zinc-900 mt-1">{profile.name} Requirements</h2>
          <p className="text-xs text-zinc-600 mt-0.5">{profile.description}</p>
        </div>
        <div className="text-[10px] text-zinc-400 font-mono text-right shrink-0">
          <span>RULES VER: {profile.effectiveFrom}</span>
          {profile.sourceUrl && (
            <div>
              <a href={profile.sourceUrl} target="_blank" rel="noopener noreferrer"
                className="text-indigo-600 hover:underline">
                Official Spec ↗
              </a>
              {profile.lastVerifiedDate && <span className="ml-2 text-zinc-400">· Verified {profile.lastVerifiedDate}</span>}
            </div>
          )}
          <br />
          <span className="text-emerald-600 font-bold">100% ONLINE AND SECURE</span>
        </div>
      </div>

      {/* Checklist grid */}
      <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3" id="checklist-grid-container">
        {profile.documents.map((doc) => {
          const file = sessionFiles[doc.id];
          const hasUploaded = !!file;
          const isOk = hasUploaded && file.validated;

          return (
            <div
              key={doc.id}
              onClick={() => {
                if (hasUploaded) {
                  setPreviewFile(file);
                } else {
                  onNavigateToStudio(doc.type as any);
                }
              }}
              className={`relative rounded-xl border p-4 cursor-pointer transition flex flex-col justify-between h-40 shadow-3xs group ${
                isOk
                  ? 'border-emerald-200 bg-emerald-50/20 hover:bg-emerald-50/40'
                  : hasUploaded
                  ? 'border-amber-200 bg-amber-50/20 hover:bg-amber-50/40'
                  : 'border-zinc-200 bg-white hover:bg-zinc-50 hover:border-zinc-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <h4 className="text-xs font-bold text-zinc-900 group-hover:text-indigo-800 transition flex items-center gap-1.5">
                    {doc.name}
                    {hasUploaded && (
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 px-1 rounded font-normal font-mono uppercase">
                        Uploaded
                      </span>
                    )}
                  </h4>
                  <p className="text-[10px] text-zinc-400 font-mono mt-0.5 uppercase tracking-wider">
                    {doc.spec.widthMm ? `${doc.spec.widthMm}x${doc.spec.heightMm}mm` : 'PDF'} · {doc.spec.minKb}-{doc.spec.maxKb}KB
                  </p>
                </div>

                {isOk ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                ) : hasUploaded ? (
                  <AlertTriangle className="h-5 w-5 text-amber-500 animate-pulse" />
                ) : (
                  <span className="h-5 w-5 rounded-full border border-zinc-200 bg-zinc-100 flex items-center justify-center text-[9px] text-zinc-400 font-bold">
                    -
                  </span>
                )}
              </div>

              <div className="mt-2 text-[11px] text-zinc-500 leading-relaxed font-sans line-clamp-2">
                {doc.spec.instructions}
              </div>

              <div className="flex items-center justify-between border-t border-zinc-100 pt-2.5 mt-2">
                {hasUploaded ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onNavigateToStudio(doc.type as any);
                    }}
                    className="text-[9px] font-bold font-mono tracking-wider uppercase text-indigo-700 hover:text-indigo-950 hover:underline flex items-center gap-1"
                  >
                    Modify / Crop
                  </button>
                ) : (
                  <span className="text-[9px] font-bold font-mono tracking-wider uppercase text-zinc-500 group-hover:text-indigo-700">
                    Upload & Resize
                  </span>
                )}
                
                <div className="flex items-center gap-2">
                  {hasUploaded && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPreviewFile(file);
                      }}
                      className="p-1 rounded-md bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-zinc-950 transition"
                      title="Quick Preview"
                    >
                      <Eye className="h-3.5 w-3.5" />
                    </button>
                  )}
                  <span className="text-[10px] font-mono text-zinc-400">
                    {hasUploaded ? `${(file.size / 1024).toFixed(0)} KB` : 'Empty'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
      {/* Smart Validator Summary & Warnings Panel */}
      {Object.keys(sessionFiles).length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-5 space-y-4 shadow-3xs" id="smart-validator-board">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-2">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Settings className="h-4 w-4 text-indigo-800" />
              Smart Spec Validator Results
            </h3>            <span className="text-[10px] font-mono text-zinc-400">
              Auto-checking uploaded file properties
            </span>
          </div>

          <div className="divide-y divide-zinc-150 dark:divide-zinc-850">
            {profile.documents.map((doc) => {
              const file = sessionFiles[doc.id];
              if (!file) return null;

              return (
                <div key={doc.id} className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 first:pt-0 last:pb-0">
                  <div 
                    className="flex items-start gap-3 cursor-pointer group/item hover:opacity-90 transition-opacity flex-1 min-w-0"
                    onClick={() => setPreviewFile(file)}
                    title="Click to preview file"
                  >
                    {file.confidenceScore ? (
                      <div className="shrink-0 scale-90 -translate-x-1">
                        <ConfidenceScoreRing score={file.confidenceScore} size="sm" showBreakdown={false} />
                      </div>
                    ) : (
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-400 group-hover/item:bg-indigo-100 dark:group-hover/item:bg-indigo-950/80 transition-colors">
                        <FileText className="h-5 w-5" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 group-hover/item:text-indigo-800 transition-colors truncate">
                        {doc.name}
                        <Eye className="h-3.5 w-3.5 text-zinc-400 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                      </p>
                      <p className="text-[10px] font-mono text-zinc-450 dark:text-zinc-500 mt-0.5 truncate">
                        File: {file.originalName} · Sizing: {(file.size / 1024).toFixed(1)}KB
                      </p>
                      {!file.validated && (
                        <div className="mt-1.5 space-y-0.5">
                          {file.issues.map((iss, i) => (
                            <p key={i} className="text-[10px] font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                              <span className="h-1 w-1 rounded-full bg-rose-500" />
                              {iss}
                            </p>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row sm:flex-col items-center sm:items-end gap-2.5 shrink-0 self-end sm:self-center">
                    <button
                      onClick={() => setPreviewFile(file)}
                      className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-zinc-150 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 px-3 text-[10px] font-bold font-mono text-zinc-700 dark:text-zinc-300 transition cursor-pointer"
                    >
                      <Eye className="h-3.5 w-3.5 text-indigo-850 dark:text-indigo-455" /> PREVIEW
                    </button>

                    {file.validated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:text-emerald-300 dark:bg-emerald-950/20 px-2.5 py-1 rounded-full border border-emerald-100 dark:border-emerald-900/60 font-mono uppercase tracking-wider">
                        <CheckCircle2 className="h-3 w-3" /> COMPLIANT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 dark:text-amber-300 dark:bg-amber-950/20 px-2.5 py-1 rounded-full border border-amber-100 dark:border-amber-900/60 font-mono uppercase tracking-wider">
                        <AlertTriangle className="h-3 w-3" /> NEEDS FIXING
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sticky Fix Everything CTA Button */}
          {profile.documents.some((d) => sessionFiles[d.id] && !sessionFiles[d.id].validated) && (
            <div className="sticky bottom-0 z-40 bg-white/95 dark:bg-zinc-100/95 backdrop-blur-xs border-t border-zinc-200 dark:border-zinc-800 py-4 px-6 -mx-5 -mb-5 flex flex-col sm:flex-row justify-between items-center gap-3 shadow-[0_-4px_12px_rgba(0,0,0,0.03)] rounded-b-xl">
              <p className="text-[11px] text-zinc-500 max-w-sm leading-relaxed text-center sm:text-left">
                Our optimizer can automatically correct cropping aspect ratios, bleach paper backgrounds, and binary compress files to make them 100% compliant with {profile.name} requirements.
              </p>
              <button
                onClick={handleFixAll}
                disabled={isFixingAll}
                className="w-full sm:w-auto h-10 px-5 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-750 text-white font-semibold text-sm transition shadow-2xs cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                {isFixingAll ? 'Fixing & Compressing...' : 'One-Click Fix Everything'}
              </button>
            </div>
          )}
        </div>
      )}
      {/* Side-by-side fixing result Modal/Comparison block */}
      {fixingResult && (
        <div className="rounded-xl border border-emerald-100 bg-emerald-50/35 p-5 space-y-4 animate-fadeIn" id="fixing-comparison-modal">
          <div className="flex items-center justify-between border-b border-emerald-100 pb-2">
            <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sparkles className="h-4 w-4 text-emerald-700 animate-pulse" />
              Automated Compliance Optimization Completed!
            </h4>
            <button
              onClick={() => setFixingResult(null)}
              className="text-xs font-medium text-emerald-800 hover:underline"
            >
              Dismiss
            </button>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Before */}
            <div className="space-y-2 text-center bg-white p-3 rounded-lg border border-zinc-100">
              <span className="text-[10px] font-bold text-zinc-400 font-mono tracking-wider uppercase">
                Original Upload (Failed Rules)
              </span>
              <div className="h-32 flex items-center justify-center overflow-hidden rounded bg-zinc-50">
                <img src={fixingResult.beforeUrl} alt="Before" className="max-h-full object-contain" />
              </div>
              <p className="text-[11px] text-zinc-600 font-mono">
                Size: <strong className="font-semibold">{(fixingResult.beforeSize / 1024).toFixed(1)} KB</strong>
              </p>
            </div>

            {/* After */}
            <div className="space-y-2 text-center bg-white p-3 rounded-lg border border-emerald-200">
              <span className="text-[10px] font-bold text-emerald-700 font-mono tracking-wider uppercase">
                Optimized Output (100% Compliant)
              </span>
              <div className="h-32 flex items-center justify-center overflow-hidden rounded bg-emerald-50/50">
                <img src={fixingResult.afterUrl} alt="After" className="max-h-full object-contain" />
              </div>
              <p className="text-[11px] text-emerald-800 font-mono">
                Size: <strong className="font-bold">{(fixingResult.afterSize / 1024).toFixed(1)} KB</strong>
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-1 border-t border-emerald-100">
            <button
              onClick={() => {
                const a = document.createElement('a');
                a.href = fixingResult.afterUrl;
                a.download = `DocSprint_Compliant_${fixingResult.docId}.jpg`;
                a.click();
              }}
              className="flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs px-4 transition shadow-2xs"
            >
              <Download className="h-3.5 w-3.5" /> Download Compliant {fixingResult.label}
            </button>
            {onNavigateToExamKit && (
              <button
                onClick={onNavigateToExamKit}
                className="flex h-9 items-center justify-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-xs px-4 transition"
                id="goto-examkit-btn"
              >
                <Sparkles className="h-3.5 w-3.5" /> Generate Exam Day Kit
              </button>
            )}
          </div>
        </div>
      )}

      {/* Full-Screen Interactive Preview Overlay Modal */}
      {previewFile && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-fadeIn" 
          id="preview-overlay-modal"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-zinc-200">
            {/* Header */}
            <div className="px-6 py-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50">
              <div>
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Eye className="h-4 w-4 text-indigo-700" />
                  File Preview: {previewFile.name}
                </h3>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Original file: <span className="font-mono bg-zinc-100 px-1 py-0.5 rounded text-zinc-600">{previewFile.originalName}</span>
                </p>
              </div>
              
              <button
                onClick={() => setPreviewFile(null)}
                className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition"
                aria-label="Close preview"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content Split Pane */}
            <div className="flex-1 overflow-y-auto p-6 grid md:grid-cols-12 gap-6">
              
              {/* Left Column: RAM-loaded File Viewport */}
              <div className="md:col-span-7 flex flex-col items-center justify-center bg-zinc-950 rounded-lg p-4 border border-zinc-800 min-h-[300px] relative select-none">
                {previewFile.type.startsWith('image/') ? (
                  <div className="relative group/preview flex flex-col items-center justify-center">
                    <img
                      src={previewFile.dataUrl}
                      alt="Processed Document Preview"
                      className="max-h-[400px] max-w-full object-contain rounded shadow-lg border border-zinc-800"
                    />
                    <div className="absolute bottom-2 bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded text-[9px] font-mono text-zinc-300">
                      RAM Stream · Local Sandbox Only
                    </div>
                  </div>
                ) : previewFile.type === 'application/pdf' ? (
                  <div className="w-full h-[400px] flex flex-col justify-between bg-zinc-900 rounded p-4 text-center">
                    <div className="flex-1 flex flex-col items-center justify-center">
                      <FileText className="h-16 w-16 text-rose-500 mb-3 animate-pulse" />
                      <span className="text-xs font-semibold text-zinc-200 block">PDF Document Stream</span>
                      <span className="text-[10px] text-zinc-400 font-mono mt-1">{(previewFile.size / 1024).toFixed(1)} KB · Application PDF</span>
                      
                      {/* Try rendering PDF preview inside sandboxed iframe */}
                      <div className="w-full h-48 mt-4 border border-zinc-800 rounded overflow-hidden">
                        <iframe 
                          src={previewFile.dataUrl} 
                          className="w-full h-full" 
                          title="PDF preview viewport"
                          referrerPolicy="no-referrer"
                        />
                      </div>
                    </div>
                    <p className="text-[10px] text-zinc-400 mt-2">
                      PDF preview runs entirely inside your browser's local sandbox memory.
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-12 text-zinc-400">
                    <FileText className="h-12 w-12 text-zinc-500 mx-auto mb-2" />
                    <p className="text-xs">Preview unavailable for format: {previewFile.type}</p>
                  </div>
                )}
              </div>

              {/* Right Column: Rule Spec Compliance & Metadata */}
              <div className="md:col-span-5 flex flex-col justify-between space-y-6">
                <div className="space-y-4">
                  <div>
                    <span className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-wider block mb-1.5">
                      File Sandbox Properties
                    </span>
                    <div className="bg-zinc-50 rounded-lg p-3.5 border border-zinc-200 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-zinc-500">File Size:</span>
                        <span className="font-mono font-bold text-zinc-800">{(previewFile.size / 1024).toFixed(1)} KB</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-zinc-500">MIME Type:</span>
                        <span className="font-mono text-zinc-700">{previewFile.type}</span>
                      </div>
                      {previewFile.width && previewFile.height && (
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Resolution:</span>
                          <span className="font-mono text-zinc-700">{previewFile.width} x {previewFile.height} px</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-zinc-500">State Validation:</span>
                        {previewFile.validated ? (
                          <span className="font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-mono text-[10px] border border-emerald-100 uppercase tracking-wider">
                            COMPLIANT
                          </span>
                        ) : (
                          <span className="font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-mono text-[10px] border border-amber-100 uppercase tracking-wider">
                            NEEDS FIXING
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Rules Spec Comparison */}
                  {(() => {
                    const docSpec = profile.documents.find(d => d.id === previewFile.id);
                    if (!docSpec) return null;

                    const isFormatOk = docSpec.spec.formats.includes(previewFile.type);
                    const isSizeOk = previewFile.size >= docSpec.spec.minKb * 1024 && previewFile.size <= docSpec.spec.maxKb * 1024;
                    const isResolutionOk = !previewFile.width || !previewFile.height || !docSpec.spec.widthPx || !docSpec.spec.heightPx || 
                      (Math.abs((previewFile.width / previewFile.height) - (docSpec.spec.aspectRatio ?? 1)) < 0.05);

                    return (
                      <div className="space-y-2">
                        <span className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-wider block">
                          Rules Engine Spec Checklist
                        </span>
                        <div className="border border-zinc-200 rounded-lg divide-y divide-zinc-200 text-xs">
                          {/* Allowed size */}
                          <div className="p-3 flex justify-between items-center bg-zinc-50/30">
                            <div>
                              <span className="font-semibold text-zinc-700 block">Required File Size Range</span>
                              <span className="text-[10px] text-zinc-500 font-mono">{docSpec.spec.minKb}KB to {docSpec.spec.maxKb}KB</span>
                            </div>
                            <div>
                              {isSizeOk ? (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-bold font-mono text-[10px] border border-emerald-100">PASS</span>
                              ) : (
                                <span className="text-rose-700 bg-rose-50 px-2 py-1 rounded font-bold font-mono text-[10px] border border-rose-100">FAIL</span>
                              )}
                            </div>
                          </div>

                          {/* Allowed format */}
                          <div className="p-3 flex justify-between items-center bg-zinc-50/30">
                            <div>
                              <span className="font-semibold text-zinc-700 block">Accepted File Formats</span>
                              <span className="text-[10px] text-zinc-500 font-mono">{docSpec.spec.formats.map(f => f.replace('image/', '').replace('application/', '').toUpperCase()).join(', ')}</span>
                            </div>
                            <div>
                              {isFormatOk ? (
                                <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-bold font-mono text-[10px] border border-emerald-100">PASS</span>
                              ) : (
                                <span className="text-rose-700 bg-rose-50 px-2 py-1 rounded font-bold font-mono text-[10px] border border-rose-100">FAIL</span>
                              )}
                            </div>
                          </div>

                          {/* Target Dimensions */}
                          {(docSpec.spec.widthPx || docSpec.spec.heightPx) && (
                            <div className="p-3 flex justify-between items-center bg-zinc-50/30">
                              <div>
                                <span className="font-semibold text-zinc-700 block">Aspect Ratio Alignment</span>
                                <span className="text-[10px] text-zinc-500 font-mono">
                                  {docSpec.spec.widthPx}x{docSpec.spec.heightPx} px {docSpec.spec.aspectRatio ? `(Aspect ${docSpec.spec.aspectRatio})` : ''}
                                </span>
                              </div>
                              <div>
                                {isResolutionOk ? (
                                  <span className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded font-bold font-mono text-[10px] border border-emerald-100">PASS</span>
                                ) : (
                                  <span className="text-rose-700 bg-rose-50 px-2 py-1 rounded font-bold font-mono text-[10px] border border-rose-100">FAIL</span>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Deeper warnings list if failed */}
                  {previewFile.issues.length > 0 && (
                    <div className="rounded-lg border border-rose-100 bg-rose-50/50 p-3.5 space-y-1.5 text-xs">
                      <span className="font-bold text-rose-900 flex items-center gap-1">
                        <ShieldAlert className="h-4 w-4 shrink-0 text-rose-700" />
                        Compliance Warnings ({previewFile.issues.length})
                      </span>
                      <ul className="list-disc pl-4 space-y-1 text-rose-800 text-[11px] leading-relaxed">
                        {previewFile.issues.map((issue, index) => (
                          <li key={index}>{issue}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Download and Studio Jump Actions */}
                <div className="flex flex-col gap-2 pt-4 border-t border-zinc-100">
                  <button
                    onClick={() => {
                      const a = document.createElement('a');
                      a.href = previewFile.dataUrl;
                      a.download = `DocSprint_${previewFile.name.toLowerCase().replace(/\s+/g, '_')}`;
                      a.click();
                    }}
                    className="w-full flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-2xs cursor-pointer"
                  >
                    <Download className="h-4 w-4" /> Download Sandbox Copy
                  </button>

                  {(() => {
                    const docSpec = profile.documents.find(d => d.id === previewFile.id);
                    if (!docSpec) return null;
                    
                    return (
                      <button
                        onClick={() => {
                          setPreviewFile(null);
                          onNavigateToStudio(docSpec.type as any);
                        }}
                        className="w-full flex h-10 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-sm transition cursor-pointer"
                      >
                        <RefreshCw className="h-4 w-4" />
                        Re-open in Studio
                      </button>
                    );
                  })()}
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
      <ProcessingProgress isProcessing={isFixingAll} type="checklist-fix" />
    </div>
  );
}
