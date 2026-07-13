import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Upload, Download, RefreshCw, Sliders, CheckCircle2, Eye, AlertTriangle, AlertCircle } from 'lucide-react';
import { SpecRequirement, UndoState, SignatureConsistencyResult } from '../types';
import { compressImageToTargetKB, enhanceSignature, checkBackgroundColor } from '../utils/imageUtils';
import { checkSignatureConsistencyAgainstHistory } from '../utils/signatureConsistency';
import ProcessingProgress from './ProcessingProgress';
import BeforeAfterSlider from './BeforeAfterSlider';
import UndoFilmstrip from './UndoFilmstrip';

interface SignatureStudioProps {
  onSaveProcessedFile: (file: {
    id: string; name: string; type: string; size: number; dataUrl: string;
    width: number; height: number; originalName: string; originalSize: number;
    validated: boolean; issues: string[];
  }) => void;
  targetSpec?: SpecRequirement;
  onAddDeletionLog: (fileName: string) => void;
  undoStack: UndoState[];
  onPushUndo: (state: UndoState) => void;
  onClearUndo: () => void;
  sessionSignatures: string[];
  onAddSessionSignature: (dataUrl: string) => void;
}

async function makeThumbnail(canvas: HTMLCanvasElement): Promise<string> {
  const th = document.createElement('canvas');
  th.width = 80; th.height = Math.round(80 / (canvas.width / canvas.height));
  const ctx = th.getContext('2d');
  if (!ctx) return '';
  ctx.drawImage(canvas, 0, 0, th.width, th.height);
  return th.toDataURL('image/jpeg', 0.6);
}

export default function SignatureStudio({
  onSaveProcessedFile, targetSpec, onAddDeletionLog,
  undoStack, onPushUndo, onClearUndo,
  sessionSignatures, onAddSessionSignature,
}: SignatureStudioProps) {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [originalFileName, setOriginalFileName] = useState('');
  const [originalSize, setOriginalSize] = useState(0);

  const [scale, setScale] = useState(1.0);
  const [panX, setPanX] = useState(0);
  const [panY, setPanY] = useState(0);

  const [brightness, setBrightness] = useState(15);
  const [contrast, setContrast] = useState(45);
  const [strokeWeight, setStrokeWeight] = useState(0);
  const [backgroundType, setBackgroundType] = useState<'white' | 'transparent'>('white');

  const defaultMin = targetSpec?.minKb ?? 10;
  const defaultMax = targetSpec?.maxKb ?? 20;
  const [minKb, setMinKb] = useState(defaultMin);
  const [maxKb, setMaxKb] = useState(defaultMax);
  const [outputFormat, setOutputFormat] = useState('image/jpeg');

  const imgRef = useRef<HTMLImageElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tactical Ink Trail refs
  const trailCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const trailPoints = useRef<{ x: number; y: number; age: number; maxAge: number }[]>([]);

  const animateTrail = useCallback(() => {
    const canvas = trailCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const points = trailPoints.current;
    if (points.length === 0) return;

    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    for (let i = 1; i < points.length; i++) {
      const p1 = points[i - 1];
      const p2 = points[i];
      const alpha = 1 - p2.age / p2.maxAge;
      ctx.strokeStyle = `rgba(99, 102, 241, ${alpha * 0.45})`; // Indigo-500 ink color
      ctx.beginPath();
      ctx.moveTo(p1.x, p1.y);
      ctx.lineTo(p2.x, p2.y);
      ctx.stroke();
    }

    points.forEach(p => p.age++);
    trailPoints.current = points.filter(p => p.age < p.maxAge);

    if (trailPoints.current.length > 0) {
      requestAnimationFrame(animateTrail);
    }
  }, []);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    if (x >= 0 && x <= rect.width && y >= 0 && y <= rect.height) {
      const overlay = trailCanvasRef.current;
      if (overlay) {
        if (overlay.width !== rect.width || overlay.height !== rect.height) {
          overlay.width = rect.width;
          overlay.height = rect.height;
        }
      }
      
      const wasEmpty = trailPoints.current.length === 0;
      trailPoints.current.push({ x, y, age: 0, maxAge: 20 });
      if (wasEmpty) {
        requestAnimationFrame(animateTrail);
      }
    }
  };

  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [processedSize, setProcessedSize] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  // Before/After
  const [showComparison, setShowComparison] = useState(false);
  const [originalPreviewUrl, setOriginalPreviewUrl] = useState<string | null>(null);

  // Signature consistency
  const [consistencyResult, setConsistencyResult] = useState<SignatureConsistencyResult | null>(null);

  useEffect(() => {
    if (targetSpec) {
      setMinKb(targetSpec.minKb);
      setMaxKb(targetSpec.maxKb);
      if (targetSpec.formats?.length > 0) {
        setOutputFormat(targetSpec.formats[0].includes('png') ? 'image/png' : 'image/jpeg');
      }
    }
  }, [targetSpec]);

  useEffect(() => {
    if (backgroundType === 'transparent') {
      setOutputFormat('image/png');
    } else if (targetSpec) {
      setOutputFormat(targetSpec.formats[0].includes('png') ? 'image/png' : 'image/jpeg');
    } else {
      setOutputFormat('image/jpeg');
    }
  }, [backgroundType, targetSpec]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const arr = new Uint8Array(event.target?.result as ArrayBuffer).subarray(0, 4);
      let header = '';
      for (let i = 0; i < arr.length; i++) header += arr[i].toString(16);
      if (!header.startsWith('89504e47') && !header.startsWith('ffd8')) {
        alert('File must be a valid JPEG or PNG image.');
        return;
      }
      const urlReader = new FileReader();
      urlReader.onload = (urlevent) => {
        const src = urlevent.target?.result as string;
        setImageSrc(src);
        setOriginalPreviewUrl(src);
        setOriginalFileName(file.name);
        setOriginalSize(file.size);
        setScale(1.0); setPanX(0); setPanY(0);
        setProcessedUrl(null); setShowComparison(false); setConsistencyResult(null);
        onClearUndo();
      };
      urlReader.readAsDataURL(file);
    };
    reader.readAsArrayBuffer(file);
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

    const aspect = targetSpec?.aspectRatio ?? (3.5 / 1.5);
    const targetW = targetSpec?.widthPx ?? 420;
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

    const tempCanvas = enhanceSignature(canvas, brightness, contrast, strokeWeight);
    ctx.clearRect(0, 0, targetW, targetH); ctx.drawImage(tempCanvas, 0, 0);

    if (backgroundType === 'transparent') {
      const imgData = ctx.getImageData(0, 0, targetW, targetH);
      const d = imgData.data;
      for (let i = 0; i < d.length; i += 4) {
        const lum = (d[i] + d[i + 1] + d[i + 2]) / 3;
        if (lum > 220) d[i + 3] = 0;
      }
      ctx.putImageData(imgData, 0, 0);
    }
  }, [imageSrc, scale, panX, panY, brightness, contrast, strokeWeight, backgroundType, targetSpec]);

  useEffect(() => {
    if (imageSrc) {
      const t = setTimeout(() => drawCanvas(), 50);
      return () => clearTimeout(t);
    }
  }, [drawCanvas, imageSrc]);

  const handleProcessAndSave = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Push current canvas state to undo stack
    const thumbnail = await makeThumbnail(canvas);
    onPushUndo({ dataUrl: canvas.toDataURL('image/jpeg', 0.7), timestamp: Date.now(), label: `Scale ${Math.round(scale * 100)}%`, thumbnailUrl: thumbnail });

    setIsProcessing(true);
    await new Promise((r) => setTimeout(r, 100));

    try {
      const format = outputFormat === 'image/png' ? 'image/png' : 'image/jpeg';
      const compressionResult = await compressImageToTargetKB(canvas, minKb, maxKb, format);
      const issues: string[] = [];
      const kbSize = compressionResult.size / 1024;

      if (kbSize > maxKb) issues.push(`Exceeds max size (${Math.round(kbSize)}KB > ${maxKb}KB)`);
      if (kbSize < minKb) issues.push(`Below min size (${Math.round(kbSize)}KB < ${minKb}KB)`);

      // Dark pixel check
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
        let darkCount = 0;
        for (let i = 0; i < data.length; i += 4) {
          if ((data[i] + data[i + 1] + data[i + 2]) / 3 < 100) darkCount++;
        }
        if (darkCount / (canvas.width * canvas.height) < 0.005) {
          issues.push('Strokes appear extremely faint. Decrease brightness or increase contrast.');
        }
      }

      // ── Signature Consistency Check ──────────────────────────────────────
      if (sessionSignatures.length > 0) {
        try {
          const result = await checkSignatureConsistencyAgainstHistory(canvas, sessionSignatures);
          if (result) setConsistencyResult(result);
        } catch { /* non-fatal */ }
      }

      // Push processed state to undo stack
      const procThumb = await makeThumbnail(canvas);
      onPushUndo({ dataUrl: compressionResult.dataUrl, timestamp: Date.now(), label: `Processed ${Math.round(kbSize)}KB`, thumbnailUrl: procThumb });

      onSaveProcessedFile({
        id: 'signature',
        name: `processed_signature_${Date.now()}.${format === 'image/png' ? 'png' : 'jpg'}`,
        type: outputFormat, size: compressionResult.size, dataUrl: compressionResult.dataUrl,
        width: canvas.width, height: canvas.height, originalName: originalFileName, originalSize,
        validated: issues.length === 0, issues,
      });

      // Register this signature in session history for future consistency checks
      onAddSessionSignature(compressionResult.dataUrl);
      onAddDeletionLog(originalFileName);
      setProcessedUrl(compressionResult.dataUrl);
      setProcessedSize(compressionResult.size);
      setShowComparison(true);
    } catch (err) {
      console.error(err);
      alert('Error compressing signature.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRestoreUndo = (state: UndoState) => {
    setProcessedUrl(state.dataUrl);
    setShowComparison(false);
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
    a.download = `DocSprint_Signature_${Date.now()}.${outputFormat === 'image/png' ? 'png' : 'jpg'}`;
    a.click();
  };

  const consistencyColor = consistencyResult?.verdict === 'consistent' ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
    : consistencyResult?.verdict === 'slightly_different' ? 'border-amber-200 bg-amber-50 text-amber-800'
    : 'border-red-200 bg-red-50 text-red-800';

  return (
    <div className="grid gap-8 lg:grid-cols-12 font-sans" id="signature-studio-component">
      {/* Left Column */}
      <div className="lg:col-span-7 flex flex-col gap-5">

        {/* Consistency Warning */}
        {consistencyResult && consistencyResult.verdict !== 'consistent' && (
          <div className={`rounded-xl border p-4 space-y-1.5 animate-fadeIn ${consistencyColor}`} id="sig-consistency-warning">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              <h4 className="text-xs font-bold uppercase tracking-wider font-mono">Signature Consistency Check</h4>
            </div>
            <p className="text-xs leading-relaxed">{consistencyResult.message}</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-white/50 rounded-full h-1.5">
                <div className="h-full rounded-full bg-current opacity-60" style={{ width: `${consistencyResult.similarity}%` }} />
              </div>
              <span className="text-[10px] font-mono font-bold">{consistencyResult.similarity}%</span>
            </div>
          </div>
        )}

        {/* Upload / Workbench */}
        {!imageSrc ? (
          <div onDragOver={handleDragOver} onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 rounded-xl p-12 bg-zinc-50/50 hover:bg-zinc-50 hover:border-indigo-400 transition cursor-pointer text-center group"
            id="signature-dropzone">
            <Upload className="h-10 w-10 text-zinc-400 group-hover:text-indigo-600 transition" />
            <h3 className="mt-4 text-sm font-semibold text-zinc-900">Upload Signature Scan</h3>
            <p className="mt-1 text-xs text-zinc-500 max-w-xs leading-relaxed">
              Upload a scan or photo of your signature on white paper. Ink optimization runs automatically.
            </p>
            <span className="mt-3 rounded-md bg-white px-2.5 py-1 text-[10px] font-mono text-zinc-500 border border-zinc-200 shadow-2xs">JPEG · PNG</span>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
          </div>
        ) : (
          <div className="rounded-xl border border-zinc-200 bg-zinc-950 p-6 flex flex-col items-center justify-center relative overflow-hidden min-h-[300px]" id="signature-workbench">
            <img ref={imgRef} src={imageSrc} alt="Source" className="hidden" onLoad={() => drawCanvas()} />
            <div className="relative max-w-full flex justify-center" onMouseMove={handleMouseMove}>
              <canvas ref={canvasRef} className="max-h-[160px] max-w-full rounded-lg shadow-lg border border-zinc-800 bg-white" />
              <canvas ref={trailCanvasRef} className="absolute inset-0 pointer-events-none z-10" />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-[90%] h-[80%] border border-dashed border-emerald-400/50 flex items-center justify-center">
                  <span className="text-[8px] font-mono font-bold text-emerald-400/80 tracking-wider">SIGNATURE BLOCK GUIDE</span>
                </div>
              </div>
            </div>
            <button onClick={() => { setImageSrc(null); setProcessedUrl(null); onClearUndo(); }}
              className="absolute top-4 right-4 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 rounded-lg p-2 text-xs transition border border-zinc-800 flex items-center gap-1">
              <RefreshCw className="h-3 w-3" /> Clear
            </button>
          </div>
        )}

        {/* Before/After Comparison */}
        {showComparison && originalPreviewUrl && processedUrl && (
          <div className="space-y-2 animate-fadeIn">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono px-1">Before / After Comparison</h3>
            <BeforeAfterSlider beforeUrl={originalPreviewUrl} afterUrl={processedUrl} beforeLabel="Raw Scan" afterLabel="Enhanced" className="min-h-[120px]" />
          </div>
        )}

        {/* Alignment Panel */}
        {imageSrc && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4" id="sig-alignment-panel">
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Sliders className="h-4 w-4 text-indigo-700" /> Signature Crop Positioning
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {[
                { label: 'Sizing Zoom', val: scale, set: setScale, min: 0.4, max: 3.0, step: 0.01, display: `${Math.round(scale * 100)}%` },
                { label: 'Pan Horizontally', val: panX, set: setPanX, min: -200, max: 200, step: 1, display: `${panX}px` },
                { label: 'Pan Vertically', val: panY, set: setPanY, min: -200, max: 200, step: 1, display: `${panY}px` },
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
                  Reset
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Undo Filmstrip */}
        {undoStack.length > 0 && (
          <UndoFilmstrip states={undoStack} onRestore={handleRestoreUndo} currentIndex={undoStack.length - 1} />
        )}
      </div>

      {/* Right Column */}
      <div className="lg:col-span-5 flex flex-col gap-5">
        {imageSrc ? (
          <>
            {/* Ink Enhancement Controls */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4" id="signature-enhancer-controls">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Ink Optimization Filters</h3>
              <div className="space-y-3">
                {[
                  { label: 'Paper Brightness (Bleach)', val: brightness, set: setBrightness, min: -10, max: 60, hint: 'Removes paper shadows and guidelines.' },
                  { label: 'Stroke Ink Contrast', val: contrast, set: setContrast, min: 10, max: 90, hint: 'Darkens and sharpens signature pen lines.' },
                ].map((ctrl) => (
                  <div key={ctrl.label} className="space-y-1">
                    <label className="text-xs font-medium text-zinc-700 flex justify-between">
                      <span>{ctrl.label}</span>
                      <span className="font-mono text-[10px] text-zinc-500">{ctrl.val}</span>
                    </label>
                    <input type="range" min={ctrl.min} max={ctrl.max} value={ctrl.val}
                      onChange={(e) => ctrl.set(parseInt(e.target.value))}
                      className="w-full accent-indigo-800" />
                    <span className="text-[9px] text-zinc-400">{ctrl.hint}</span>
                  </div>
                ))}

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-700">Stroke Thickness</label>
                  <div className="flex gap-2">
                    {[{ id: -1, label: 'Thinner' }, { id: 0, label: 'Default' }, { id: 1, label: 'Thicker' }].map((w) => (
                      <button key={w.id} onClick={() => setStrokeWeight(w.id)}
                        className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                          strokeWeight === w.id ? 'border-indigo-600 bg-indigo-50 text-indigo-950' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}>{w.label}</button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-medium text-zinc-700">Background Mask</label>
                  <div className="flex gap-2">
                    {[{ id: 'white', label: 'Solid White' }, { id: 'transparent', label: 'Transparent PNG' }].map((bg) => (
                      <button key={bg.id} onClick={() => setBackgroundType(bg.id as any)}
                        className={`flex-1 rounded-lg border py-1.5 text-xs font-medium transition ${
                          backgroundType === bg.id ? 'border-indigo-600 bg-indigo-50 text-indigo-950' : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                        }`}>{bg.label}</button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Compression Controls */}
            <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4" id="sig-size-controls">
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">Target Size</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700">Min (KB)</label>
                  <input type="number" value={minKb} onChange={(e) => setMinKb(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-mono text-zinc-800" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700">Max (KB)</label>
                  <input type="number" value={maxKb} onChange={(e) => setMaxKb(Math.max(minKb + 1, parseInt(e.target.value) || minKb + 1))}
                    className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-mono text-zinc-800" />
                </div>
              </div>

              {backgroundType === 'white' && (
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
              )}

              <button onClick={handleProcessAndSave} disabled={isProcessing}
                className="w-full flex h-10 items-center justify-center gap-2 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-2xs mt-4 disabled:opacity-50">
                {isProcessing ? 'Processing...' : 'Clean & Compress Signature ✦'}
              </button>
            </div>

            {/* Success Card */}
            {processedUrl && (
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-3 animate-fadeIn" id="sig-processed-card">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  <div>
                    <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider font-mono">Signature Saved</h4>
                    <p className="text-[11px] text-emerald-800 mt-0.5">
                      Size: <strong>{(processedSize / 1024).toFixed(1)} KB</strong>
                      {sessionSignatures.length > 1 && (
                        <span className="ml-2 text-[10px] text-emerald-600">· Consistency checked</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
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
          <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center py-12 flex flex-col items-center justify-center">
            <Eye className="h-8 w-8 text-zinc-400 mb-3" />
            <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wider font-mono">Awaiting Upload</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs leading-relaxed">
              Upload a signature scan to activate ink optimization, before/after comparison, and session consistency checking.
            </p>
          </div>
        )}
      </div>

      <ProcessingProgress isProcessing={isProcessing} type="signature" />
    </div>
  );
}
