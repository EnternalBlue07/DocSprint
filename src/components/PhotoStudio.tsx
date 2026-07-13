import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, RefreshCw, ZoomIn, Eye, Sliders, CheckCircle2, User, Calendar, AlertTriangle, Loader2 } from 'lucide-react';
import { SpecRequirement, UndoState, ConfidenceScore } from '../types';
import { compressImageToTargetKB, replaceBackgroundColor, addUPSCNameDateOverlay, checkBackgroundColor, calculateBlurScore } from '../utils/imageUtils';
import { computeConfidenceScore } from '../utils/confidenceEngine';
import { analyzeFaceCompliance } from '../utils/faceAnalysis';
import ProcessingProgress from './ProcessingProgress';
import BeforeAfterSlider from './BeforeAfterSlider';
import UndoFilmstrip from './UndoFilmstrip';
import ConfidenceScoreRing from './ConfidenceScoreRing';

interface PhotoStudioProps {
  onSaveProcessedFile: (file: {
    id: string; name: string; type: string; size: number; dataUrl: string;
    width: number; height: number; originalName: string; originalSize: number;
    validated: boolean; issues: string[]; confidenceScore?: ConfidenceScore;
  }) => void;
  targetSpec?: SpecRequirement;
  onAddDeletionLog: (fileName: string) => void;
  undoStack: UndoState[];
  onPushUndo: (state: UndoState) => void;
  onClearUndo: () => void;
}

/** Generate a small thumbnail dataUrl from a canvas for the undo filmstrip */
async function makeThumbnail(canvas: HTMLCanvasElement): Promise<string> {
  const th = document.createElement('canvas');
  th.width = 80; th.height = Math.round(80 / (canvas.width / canvas.height));
  const ctx = th.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(canvas, 0, 0, th.width, th.height);
  return th.toDataURL('image/jpeg', 0.6);
}

export default function PhotoStudio({
  onSaveProcessedFile, targetSpec, onAddDeletionLog,
  undoStack, onPushUndo, onClearUndo,
}: PhotoStudioProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [originalSize, setOriginalSize] = useState(0);
  const [imageType, setImageType] = useState('image/jpeg');

  const [scale, setScale] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);
  const [selectedBg, setSelectedBg] = useState<'original' | 'white' | 'blue' | 'red' | 'transparent'>('original');

  const [enableUPSC, setEnableUPSC] = useState(false);
  const [upscName, setUpscName] = useState('');
  const [upscDate, setUpscDate] = useState(new Date().toISOString().split('T')[0]);

  const defaultMin = targetSpec?.minKb ?? 20;
  const defaultMax = targetSpec?.maxKb ?? 50;
  const [minKb, setMinKb] = useState(defaultMin);
  const [maxKb, setMaxKb] = useState(defaultMax);
  const [outputFormat, setOutputFormat] = useState('image/jpeg');

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedSize, setProcessedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Face pre-flight
  const [faceAnalysisRunning, setFaceAnalysisRunning] = useState(false);
  const [faceIssues, setFaceIssues] = useState<{ message: string; severity: 'warning' | 'error' }[]>([]);
  const [faceScore, setFaceScore] = useState<number | undefined>(undefined);

  // Confidence score
  const [confidenceScore, setConfidenceScore] = useState<ConfidenceScore | null>(null);

  // Before/After slider visibility
  const [showComparison, setShowComparison] = useState(false);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    if (targetSpec) {
      setMinKb(targetSpec.minKb);
      setMaxKb(targetSpec.maxKb);
      if (targetSpec.formats?.length > 0) {
        setOutputFormat(targetSpec.formats[0].includes('png') ? 'image/png' : 'image/jpeg');
      }
    }
  }, [targetSpec]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const arr = new Uint8Array(event.target?.result as ArrayBuffer).subarray(0, 4);
      let header = '';
      for (let i = 0; i < arr.length; i++) header += arr[i].toString(16);
      if (!header.startsWith('89504e47') && !header.startsWith('ffd8')) {
        alert('Strict validation failed: File must be a valid JPEG or PNG image.');
        return;
      }
      const urlReader = new FileReader();
      urlReader.onload = (urlevent) => {
        const src = urlevent.target?.result as string;
        setImageSrc(src);
        setOriginalPreviewUrl(src);
        setOriginalFileName(file.name);
        setOriginalSize(file.size);
        setImageType(file.type);
        setScale(1.0); setPanX(0); setPanY(0);
        setProcessedUrl(null); setConfidenceScore(null);
        setFaceIssues([]); setFaceScore(undefined);
        setShowComparison(false);
        onClearUndo();

        // Run face pre-flight after image loads
        runFacePreFlight(src);
      };
      urlReader.readAsDataURL(file);
    };
    reader.readAsArrayBuffer(file);
  };

  const runFacePreFlight = async (src: string) => {
    setFaceAnalysisRunning(true);
    const img = new Image();
    img.onload = async () => {
      const tmpCanvas = document.createElement('canvas');
      tmpCanvas.width = img.naturalWidth; tmpCanvas.height = img.naturalHeight;
      const ctx = tmpCanvas.getContext('2d');
      if (ctx) { ctx.drawImage(img, 0, 0); }
      try {
        const result = await analyzeFaceCompliance(tmpCanvas);
        setFaceIssues(result.issues);
        setFaceScore(result.score);
      } catch { /* graceful fallback */ }
      setFaceAnalysisRunning(false);
    };
    img.src = src;
  };

  const handleDragOver = (e: React.DragEvent) => e.preventDefault();
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && (file.type.includes('image/jpeg') || file.type.includes('image/png'))) {
      if (fileInputRef.current) {
        const dt = new DataTransfer(); dt.items.add(file);
        fileInputRef.current.files = dt.files;
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }
  };

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const aspect = targetSpec?.aspectRatio ?? (3.5 / 4.5);
    const targetW = targetSpec?.widthPx ?? (aspect === 1 ? 600 : 413);
    const targetH = Math.round(targetW / aspect);
    canvas.width = targetW; canvas.height = targetH;

    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, targetW, targetH);
    ctx.save();
    ctx.translate(targetW / 2 + panX, targetH / 2 + panY);
    ctx.scale(scale, scale);

    const imgAspect = img.naturalWidth / img.naturalHeight;
    let drawW = targetW, drawH = targetW / imgAspect;
    if (drawH < targetH) { drawH = targetH; drawW = targetH * imgAspect; }
    ctx.drawImage(img, -drawW / 2, -drawH / 2, drawW, drawH);
    ctx.restore();

    if (selectedBg !== 'original') {
      const tempCanvas = replaceBackgroundColor(canvas, selectedBg);
      ctx.clearRect(0, 0, targetW, targetH); ctx.drawImage(tempCanvas, 0, 0);
    }
    if (enableUPSC && upscName) {
      const tempCanvas = addUPSCNameDateOverlay(canvas, upscName, upscDate);
      ctx.clearRect(0, 0, targetW, targetH); ctx.drawImage(tempCanvas, 0, 0);
    }
  }, [imageSrc, scale, panX, panY, selectedBg, enableUPSC, upscName, upscDate, targetSpec]);

  useEffect(() => {
    if (imageSrc) {
      const t = setTimeout(() => drawCanvas(), 50);
      return () => clearTimeout(t);
    }
  }, [drawCanvas, imageSrc]);

  const handleProcessAndSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Push current state to undo stack before processing
    const thumbnail = await makeThumbnail(canvas);
    const currentDataUrl = canvas.toDataURL('image/jpeg', 0.7);
    onPushUndo({
      dataUrl: currentDataUrl,
      timestamp: Date.now(),
      label: `Scale ${Math.round(scale * 100)}%`,
      thumbnailUrl: thumbnail,
    });

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 100));

    try {
      const format = outputFormat === 'image/png' ? 'image/png' : 'image/jpeg';
      const compressionResult = await compressImageToTargetKB(canvas, minKb, maxKb, format);

      const bgAnalysis = checkBackgroundColor(canvas);
      const blurAnalysis = calculateBlurScore(canvas);
      const issues: string[] = [];

      const kbSize = compressionResult.size / 1024;
      if (kbSize > maxKb) issues.push(`File exceeds maximum size (${Math.round(kbSize)}KB > ${maxKb}KB)`);
      if (kbSize < minKb) issues.push(`File below minimum size (${Math.round(kbSize)}KB < ${minKb}KB)`);
      if (blurAnalysis.isBlurry) issues.push(`Image appears blurry (sharpness: ${blurAnalysis.score})`);
      if (targetSpec?.bgColors && !targetSpec.bgColors.includes('any')) {
        if (!targetSpec.bgColors.includes(bgAnalysis.color)) {
          issues.push(`Background mismatch: detected ${bgAnalysis.color}`);
        }
      }

      // Compute confidence score
      const spec = targetSpec ?? { minKb, maxKb, formats: [outputFormat] };
      const cs = computeConfidenceScore(canvas, spec as any, 'photo', compressionResult.size, faceScore);
      setConfidenceScore(cs);

      // Push processed state to undo stack
      const procThumb = await makeThumbnail(canvas);
      onPushUndo({
        dataUrl: compressionResult.dataUrl,
        timestamp: Date.now(),
        label: `Processed ${Math.round(kbSize)}KB`,
        thumbnailUrl: procThumb,
      });

      onSaveProcessedFile({
        id: 'photo',
        name: `processed_photo_${Date.now()}.${format === 'image/png' ? 'png' : 'jpg'}`,
        type: outputFormat,
        size: compressionResult.size,
        dataUrl: compressionResult.dataUrl,
        width: canvas.width,
        height: canvas.height,
        originalName: originalFileName,
        originalSize,
        validated: issues.length === 0,
        issues,
        confidenceScore: cs,
      });

      onAddDeletionLog(originalFileName);
      setProcessedUrl(compressionResult.dataUrl);
      setProcessedSize(compressionResult.size);
      setShowComparison(true);
    } catch (err) {
      console.error(err);
      alert('Error processing photo.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreUndo = (state: UndoState) => {
    setProcessedUrl(state.dataUrl);
    setShowComparison(false);
    // Reload canvas from undo state
    const img = new Image();
    img.onload = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      canvas.width = img.naturalWidth; canvas.height = img.naturalHeight;
      ctx.drawImage(img, 0, 0);
    };
    img.src = state.dataUrl;
  };

  const handleDownload = () => {
    if (!processedUrl) return;
    const a = document.createElement('a');
    a.href = processedUrl;
    a.download = `DocSprint_Photo_${Date.now()}.${outputFormat === 'image/png' ? 'png' : 'jpg'}`;
    a.click();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 font-sans" id="photo-studio-component">
      {/* Left Column */}
      <div className="lg:col-span-7 flex flex-col gap-5">

        {/* Face Pre-Flight Warning */}
        {imageSrc && faceIssues.length > 0 && !faceAnalysisRunning && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 space-y-2 animate-fadeIn" id="face-preflight-warning">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider font-mono">
                Face Compliance Pre-Flight
              </h4>
            </div>
            <ul className="space-y-1.5">
              {faceIssues.map((issue, i) => (
                <li key={i} className={`text-xs flex items-start gap-1.5 ${issue.severity === 'error' ? 'text-red-700' : 'text-amber-800'}`}>
                  <span className="flex-shrink-0 mt-0.5">{issue.severity === 'error' ? '✗' : '⚠'}</span>
                  {issue.message}
                </li>
              ))}
            </ul>
            <p className="text-[10px] text-amber-600 font-mono">You can still proceed — these are advisory warnings.</p>
          </div>
        )}

        {faceAnalysisRunning && (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 flex items-center gap-2">
            <Loader2 className="h-4 w-4 text-indigo-600 animate-spin" />
            <span className="text-xs text-zinc-600">Running face compliance pre-flight...</span>
          </div>
        )}

        {/* Upload zone / Canvas workbench */}
        {!imageSrc ? (
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl p-12 bg-zinc-50/50 hover:bg-zinc-50 hover:border-indigo-400 transition cursor-pointer text-center group"
            id="photo-dropzone"
          >
            <Upload className="h-10 w-10 text-zinc-400 group-hover:text-indigo-600 transition" />
            <h3 className="mt-4 text-sm font-semibold text-zinc-900">Upload Passport Photo</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-xs leading-relaxed">
              Drag & drop, or click to browse. Face pre-flight compliance check runs automatically.
            </p>
            <span className="mt-3 rounded-md bg-white px-2.5 py-1 text-[10px] font-mono text-zinc-500 border border-zinc-200 shadow-2xs">
              JPEG · PNG · Magic-byte verified
            </span>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-zinc-950 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[380px]" id="photo-workbench">
            <img ref={imgRef} src={imageSrc} alt="Source" className="hidden" onLoad={() => drawCanvas()} />
            <div className="relative max-w-full flex justify-center">
              <canvas
                ref={canvasRef}
                className="max-h-[340px] max-w-full rounded-lg shadow-lg border border-zinc-800 bg-white"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[62%] h-[74%] rounded-[50%/45%] border-2 border-dashed border-emerald-400/70 bg-emerald-400/5 flex flex-col items-center justify-center">
                  <div className="w-[85%] border-t border-dashed border-emerald-400/40 mt-[30%]" />
                  <span className="text-[9px] text-emerald-400 font-bold bg-zinc-950/80 px-1.5 py-0.5 rounded mt-auto mb-3 tracking-wider font-mono uppercase">
                    FACE GUIDE
                  </span>
                </div>
              </div>
            </div>
            <button
              onClick={() => { setImageSrc(null); setProcessedUrl(null); setFaceIssues([]); onClearUndo(); }}
              className="absolute top-4 right-4 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 rounded-lg p-2 text-xs transition border border-zinc-800 flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" /> Clear
            </button>
          </div>
        )}

        {/* Before/After Comparison Slider */}
        {showComparison && originalPreviewUrl && processedUrl && (
          <div className="space-y-2 animate-fadeIn">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono px-1">
              Before / After Comparison
            </h3>
            <BeforeAfterSlider
              beforeUrl={originalPreviewUrl}
              afterUrl={processedUrl}
              className="min-h-[220px]"
            />
          </div>
        )}

        {/* Alignment Panel */}
        {imageSrc && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4" id="photo-alignment-panel">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-indigo-700" /> Interactive Face Alignment
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Zoom Scale', val: scale, set: setScale, min: 0.5, max: 3.0, step: 0.01, display: `${Math.round(scale * 100)}%` },
                { label: 'Horizontal Pan', val: panX, set: setPanX, min: -200, max: 200, step: 1, display: `${panX}px` },
                { label: 'Vertical Pan', val: panY, set: setPanY, min: -200, max: 200, step: 1, display: `${panY}px` },
              ].map((ctrl) => (
                <div key={ctrl.label} className="space-y-1">
                  <label className="text-xs font-medium text-zinc-700 flex justify-between">
                    <span>{ctrl.label}</span>
                    <span className="font-mono text-[10px] text-zinc-500">{ctrl.display}</span>
                  </label>
                  <input type="range" min={ctrl.min} max={ctrl.max} step={ctrl.step}
                    value={ctrl.val} onChange={(e) => ctrl.set(parseFloat(e.target.value) as any)}
                    className="w-full accent-indigo-800" />
                </div>
              ))}
              <div className="flex items-center justify-end">
                <button onClick={() => { setScale(1.0); setPanX(0); setPanY(0); }}
                  className="text-xs font-medium text-zinc-600 hover:text-indigo-800 underline decoration-indigo-800/20 underline-offset-4">
                  Reset Positioning
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Undo Filmstrip */}
        {undoStack.length > 0 && (
          <UndoFilmstrip
            states={undoStack}
            onRestore={handleRestoreUndo}
            currentIndex={undoStack.length - 1}
          />
        )}
      </div>

      {/* Right Column — Controls */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        {imageSrc ? (
          <>
            {/* Background Changer */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-3" id="bg-replace-controls">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Chroma BG Replacement</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {(['original', 'white', 'blue', 'red', 'transparent'] as const).map((bg) => (
                  <button key={bg} onClick={() => setSelectedBg(bg)}
                    className={`rounded-lg border px-3 py-2 text-xs font-medium transition ${
                      selectedBg === bg ? 'border-indigo-600 bg-indigo-50 text-indigo-950' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}>
                    {bg.charAt(0).toUpperCase() + bg.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {/* UPSC Overlays */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4" id="upsc-controls">
              <div className="flex items-center justify-between border-b border-zinc-100 pb-2">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">UPSC Name & Date Block</h3>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" checked={enableUPSC} onChange={(e) => setEnableUPSC(e.target.checked)} className="sr-only peer" />
                  <div className="w-9 h-5 bg-zinc-200 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-800" />
                </label>
              </div>
              {enableUPSC && (
                <div className="space-y-3 pt-1">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 flex items-center gap-1">
                      <User className="h-3 w-3 text-zinc-400" /> Candidate Full Name
                    </label>
                    <input type="text" placeholder="e.g. ANJALI SHARMA" value={upscName}
                      onChange={(e) => setUpscName(e.target.value.toUpperCase())}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-zinc-400" /> Date of Photograph
                    </label>
                    <input type="date" value={upscDate} onChange={(e) => setUpscDate(e.target.value)}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-800 focus:border-indigo-500 focus:outline-none" />
                  </div>
                </div>
              )}
            </div>

            {/* Target Size */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4" id="target-kb-controls">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Target Compression Limits</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700">Min File Size (KB)</label>
                  <input type="number" value={minKb} onChange={(e) => setMinKb(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-mono text-zinc-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700">Max File Size (KB)</label>
                  <input type="number" value={maxKb} onChange={(e) => setMaxKb(Math.max(minKb + 1, parseInt(e.target.value) || minKb + 1))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-mono text-zinc-800" />
                </div>
              </div>
              <div className="space-y-2 pt-2">
                <label className="text-xs font-medium text-zinc-700">Output Format</label>
                <div className="flex gap-2">
                  {['image/jpeg', 'image/png'].map((fmt) => (
                    <button key={fmt} onClick={() => setOutputFormat(fmt)}
                      className={`flex-1 rounded-lg border py-2 text-xs font-medium transition ${
                        outputFormat === fmt ? 'border-indigo-600 bg-indigo-50 text-indigo-950' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                      }`}>
                      {fmt === 'image/jpeg' ? 'JPEG' : 'PNG'}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={handleProcessAndSave} disabled={isProcessing}
                className="w-full flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-2xs mt-4 disabled:opacity-50">
                {isProcessing ? 'Processing...' : 'Apply Filters & Process ✦'}
              </button>
            </div>

            {/* Confidence Score Result */}
            {confidenceScore && (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 animate-fadeIn" id="photo-confidence-score">
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono mb-4">
                  Acceptance Confidence Score
                </h3>
                <ConfidenceScoreRing score={confidenceScore} size="md" showBreakdown={true} />
                <div className="mt-4 flex gap-2">
                  <button onClick={handleDownload}
                    className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-2xs">
                    <Download className="h-3.5 w-3.5" /> Download
                  </button>
                  <button onClick={() => setShowComparison(!showComparison)}
                    className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-zinc-200 bg-zinc-50 hover:bg-zinc-100 text-zinc-700 font-semibold text-xs transition">
                    <Eye className="h-3.5 w-3.5" /> {showComparison ? 'Hide' : 'Compare'}
                  </button>
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center text-zinc-500 py-12 flex flex-col items-center justify-center">
            <Eye className="h-8 w-8 text-zinc-400 mb-3" />
            <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider font-mono">Awaiting Upload</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
              Upload a photo to activate face compliance pre-flight, background replacement, and confidence scoring.
            </p>
          </div>
        )}
      </div>

      <ProcessingProgress isProcessing={isProcessing} type="photo" />
    </div>
  );
}
