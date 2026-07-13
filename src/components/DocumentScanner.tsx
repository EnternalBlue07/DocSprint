import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Camera, Upload, RotateCw, Download, CheckCircle2, Sliders,
  RefreshCw, Sparkles, FileText, Plus, Trash2, ChevronLeft, ChevronRight,
  Zap, Layers, Eye, Sun, Contrast, ScanLine, Image as ImageIcon, X
} from 'lucide-react';
import { warpPerspective, removeShadowsAndEnhance, autoDetectCorners, Point, ScanMode, EnhanceOptions } from '../utils/scannerUtils';
import { scannedImagesToPDF, PageSizeKey } from '../utils/pdfUtils';
import ProcessingProgress from './ProcessingProgress';

interface DocumentScannerProps {
  onAddDeletionLog: (fileName: string) => void;
  onSaveProcessedFile: (file: {
    id: string;
    name: string;
    type: string;
    size: number;
    dataUrl: string;
    originalName: string;
    originalSize: number;
    validated: boolean;
    issues: string[];
  }) => void;
}

interface ScannedPage {
  id: string;
  imageSrc: string;
  fileName: string;
  originalSize: number;
  corners: { tl: Point; tr: Point; br: Point; bl: Point };
  resultUrl?: string;
  resultSize?: number;
}

const SCAN_MODES: { id: ScanMode; label: string; icon: React.ReactNode; desc: string; color: string }[] = [
  {
    id: 'color',
    label: 'Color',
    icon: <ImageIcon className="h-4 w-4" />,
    desc: 'Preserves stamps & color ink',
    color: 'from-blue-500 to-indigo-600',
  },
  {
    id: 'grayscale',
    label: 'Grayscale',
    icon: <Eye className="h-4 w-4" />,
    desc: 'Clean grey, shadow-free',
    color: 'from-zinc-400 to-zinc-600',
  },
  {
    id: 'monochrome',
    label: 'B&W',
    icon: <Contrast className="h-4 w-4" />,
    desc: 'Crisp adaptive binarization',
    color: 'from-zinc-800 to-black',
  },
  {
    id: 'magic',
    label: 'Magic',
    icon: <Sparkles className="h-4 w-4" />,
    desc: 'CamScanner warm-white look',
    color: 'from-amber-400 to-orange-500',
  },
];

const PAGE_SIZE_OPTIONS: { id: PageSizeKey; label: string; sub: string }[] = [
  { id: 'a4', label: 'A4', sub: '210 × 297 mm' },
  { id: 'letter', label: 'Letter', sub: '8.5 × 11 in' },
  { id: 'a5', label: 'A5', sub: '148 × 210 mm' },
  { id: 'legal', label: 'Legal', sub: '8.5 × 14 in' },
];

export default function DocumentScanner({ onAddDeletionLog, onSaveProcessedFile }: DocumentScannerProps) {
  // Pages queue (multi-page support)
  const [pages, setPages] = useState<ScannedPage[]>([]);
  const [activePageIndex, setActivePageIndex] = useState(0);

  // Processing/output
  const [scanMode, setScanMode] = useState<ScanMode>('magic');
  const [pageSize, setPageSize] = useState<PageSizeKey>('a4');
  const [outputFormat, setOutputFormat] = useState<'pdf' | 'jpeg' | 'png'>('pdf');
  const [brightness, setBrightness] = useState(0);
  const [contrast, setContrast] = useState(0);
  const [sharpness, setSharpness] = useState(20);
  const [isScanning, setIsScanning] = useState(false);
  const [isAutoDetecting, setIsAutoDetecting] = useState(false);

  // Final output
  const [finalUrl, setFinalUrl] = useState<string | null>(null);
  const [finalSize, setFinalSize] = useState(0);
  const [finalName, setFinalName] = useState('');

  // Active page's live preview canvas
  const [livePreviewUrl, setLivePreviewUrl] = useState<string | null>(null);
  const previewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  const activePage = pages[activePageIndex] ?? null;

  // ── File upload ────────────────────────────────────────────────────────────
  const loadImageFile = async (file: File): Promise<ScannedPage | null> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;
        const img = new Image();
        img.onload = () => {
          const corners = { tl: { x: 0.1, y: 0.1 }, tr: { x: 0.9, y: 0.1 }, br: { x: 0.9, y: 0.9 }, bl: { x: 0.1, y: 0.9 } };
          resolve({
            id: `page-${Date.now()}-${Math.random().toString(36).slice(2)}`,
            imageSrc: dataUrl,
            fileName: file.name,
            originalSize: file.size,
            corners,
          });
        };
        img.onerror = () => resolve(null);
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPages: ScannedPage[] = [];
    for (let i = 0; i < Math.min(files.length, 15); i++) {
      const file = files[i];
      if (!file.type.startsWith('image/')) continue;
      const page = await loadImageFile(file);
      if (page) newPages.push(page);
    }
    if (newPages.length === 0) return;
    setPages((prev) => [...prev, ...newPages]);
    setActivePageIndex((prev) => prev + newPages.length - 1);
    setFinalUrl(null);
    // Auto detect corners for last added page
    autoDetectForPage(newPages[newPages.length - 1]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (!files) return;
    const syntheticEvent = { target: { files }, currentTarget: null, nativeEvent: null, bubbles: false, cancelable: false, defaultPrevented: false, eventPhase: 0, isTrusted: false, preventDefault: () => {}, isDefaultPrevented: () => false, stopPropagation: () => {}, isPropagationStopped: () => false, persist: () => {}, timeStamp: 0, type: 'change' } as unknown as React.ChangeEvent<HTMLInputElement>;
    await handleFileChange(syntheticEvent);
  };

  // ── Auto corner detection ────────────────────────────────────────────────
  const autoDetectForPage = useCallback((page: ScannedPage) => {
    setIsAutoDetecting(true);
    const img = new Image();
    img.onload = () => {
      setTimeout(() => {
        const detected = autoDetectCorners(img);
        setPages((prev) =>
          prev.map((p) => p.id === page.id ? { ...p, corners: detected } : p)
        );
        setIsAutoDetecting(false);
      }, 50);
    };
    img.src = page.imageSrc;
  }, []);

  const handleAutoDetect = () => {
    if (activePage) autoDetectForPage(activePage);
  };

  // ── Corner dragging ────────────────────────────────────────────────────────
  const handlePointerDown = (corner: 'tl' | 'tr' | 'br' | 'bl', downEvent: React.PointerEvent<HTMLDivElement>) => {
    downEvent.preventDefault();
    const container = containerRef.current;
    if (!container) return;
    const rect = container.getBoundingClientRect();

    const handlePointerMove = (moveEvent: PointerEvent) => {
      const normX = Math.max(0.02, Math.min(0.98, (moveEvent.clientX - rect.left) / rect.width));
      const normY = Math.max(0.02, Math.min(0.98, (moveEvent.clientY - rect.top) / rect.height));
      setPages((prev) =>
        prev.map((p, i) =>
          i === activePageIndex ? { ...p, corners: { ...p.corners, [corner]: { x: normX, y: normY } } } : p
        )
      );
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // ── Live preview (debounced) ───────────────────────────────────────────────
  useEffect(() => {
    if (!activePage) { setLivePreviewUrl(null); return; }
    if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    previewTimerRef.current = setTimeout(() => {
      generatePreview(activePage);
    }, 280);
    return () => { if (previewTimerRef.current) clearTimeout(previewTimerRef.current); };
  }, [activePage?.corners, scanMode, brightness, contrast, sharpness]);

  const generatePreview = (page: ScannedPage) => {
    const img = new Image();
    img.onload = () => {
      const natW = img.naturalWidth;
      const natH = img.naturalHeight;
      const srcPoints: Point[] = [
        { x: page.corners.tl.x * natW, y: page.corners.tl.y * natH },
        { x: page.corners.tr.x * natW, y: page.corners.tr.y * natH },
        { x: page.corners.br.x * natW, y: page.corners.br.y * natH },
        { x: page.corners.bl.x * natW, y: page.corners.bl.y * natH },
      ];
      // Small preview: 150x200
      const warped = warpPerspective(img, srcPoints, 150, 200);
      const enhanced = removeShadowsAndEnhance(warped, scanMode, { brightness, contrast, sharpness });
      setLivePreviewUrl(enhanced.toDataURL('image/jpeg', 0.7));
    };
    img.src = page.imageSrc;
  };

  // ── Process a single page ─────────────────────────────────────────────────
  const processPage = async (page: ScannedPage): Promise<{ dataUrl: string; blob: Blob; type: string }> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = async () => {
        const natW = img.naturalWidth;
        const natH = img.naturalHeight;
        const srcPoints: Point[] = [
          { x: page.corners.tl.x * natW, y: page.corners.tl.y * natH },
          { x: page.corners.tr.x * natW, y: page.corners.tr.y * natH },
          { x: page.corners.br.x * natW, y: page.corners.br.y * natH },
          { x: page.corners.bl.x * natW, y: page.corners.bl.y * natH },
        ];

        // A4 output at 150 DPI equivalent
        const targetW = 1240;
        const targetH = 1754;
        const warped = warpPerspective(img, srcPoints, targetW, targetH);
        const enhanced = removeShadowsAndEnhance(warped, scanMode, { brightness, contrast, sharpness });

        const mime = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
        const quality = outputFormat === 'png' ? undefined : 0.88;

        enhanced.toBlob(async (blob) => {
          if (!blob) { reject(new Error('Canvas toBlob failed')); return; }
          const dataUrl = await blobToDataUrl(blob);
          resolve({ dataUrl, blob, type: mime });
        }, mime, quality);
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = page.imageSrc;
    });
  };

  // ── Main scan & export ────────────────────────────────────────────────────
  const handleScan = async () => {
    if (pages.length === 0) return;
    setIsScanning(true);
    await new Promise((r) => setTimeout(r, 80));

    try {
      const processedPages: { dataUrl: string; type: string }[] = [];
      const updatedPages = [...pages];

      for (let i = 0; i < pages.length; i++) {
        const result = await processPage(pages[i]);
        processedPages.push({ dataUrl: result.dataUrl, type: result.type });
        updatedPages[i] = { ...updatedPages[i], resultUrl: result.dataUrl, resultSize: result.blob.size };
        onAddDeletionLog(pages[i].fileName);
      }

      setPages(updatedPages);

      if (outputFormat === 'pdf') {
        // Bundle all pages into one PDF
        const pdfBytes = await scannedImagesToPDF(
          processedPages,
          pageSize,
          24,
          { r: 1, g: 1, b: 1 }
        );
        const pdfBlob = new Blob([pdfBytes], { type: 'application/pdf' });
        const pdfDataUrl = await blobToDataUrl(pdfBlob);
        const name = `DocSprint_Scan_${Date.now()}.pdf`;

        setFinalUrl(pdfDataUrl);
        setFinalSize(pdfBlob.size);
        setFinalName(name);

        onSaveProcessedFile({
          id: `scanned-${Date.now()}`,
          name,
          type: 'application/pdf',
          size: pdfBlob.size,
          dataUrl: pdfDataUrl,
          originalName: pages[0].fileName,
          originalSize: pages[0].originalSize,
          validated: true,
          issues: [],
        });
      } else {
        // Single image output (uses first/active page)
        const result = processedPages[activePageIndex] ?? processedPages[0];
        const ext = outputFormat;
        const name = `DocSprint_Scan_${Date.now()}.${ext}`;
        const mime = outputFormat === 'png' ? 'image/png' : 'image/jpeg';
        const blob = dataUrlToBlob(result.dataUrl, mime);

        setFinalUrl(result.dataUrl);
        setFinalSize(blob.size);
        setFinalName(name);

        onSaveProcessedFile({
          id: `scanned-${Date.now()}`,
          name,
          type: mime,
          size: blob.size,
          dataUrl: result.dataUrl,
          originalName: pages[activePageIndex]?.fileName ?? pages[0].fileName,
          originalSize: pages[activePageIndex]?.originalSize ?? pages[0].originalSize,
          validated: true,
          issues: [],
        });
      }
    } catch (err) {
      console.error(err);
      alert('Scan failed. Please try again.');
    } finally {
      setIsScanning(false);
    }
  };

  const handleDownload = () => {
    if (!finalUrl) return;
    try {
      const mime = outputFormat === 'pdf' ? 'application/pdf' : (outputFormat === 'png' ? 'image/png' : 'image/jpeg');
      const blob = dataUrlToBlob(finalUrl, mime);
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = finalName;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(blobUrl), 100);
    } catch (e) {
      const a = document.createElement('a');
      a.href = finalUrl;
      a.download = finalName;
      a.click();
    }
  };

  const removePage = (id: string) => {
    setPages((prev) => {
      const next = prev.filter((p) => p.id !== id);
      setActivePageIndex((ai) => Math.min(ai, Math.max(0, next.length - 1)));
      return next;
    });
    setFinalUrl(null);
  };

  // ── Helpers ────────────────────────────────────────────────────────────────
  const blobToDataUrl = (blob: Blob): Promise<string> =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.readAsDataURL(blob);
    });

  const dataUrlToBlob = (dataUrl: string, type: string): Blob => {
    const byteStr = atob(dataUrl.split(',')[1]);
    const arr = new Uint8Array(byteStr.length);
    for (let i = 0; i < byteStr.length; i++) arr[i] = byteStr.charCodeAt(i);
    return new Blob([arr], { type });
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  const hasPages = pages.length > 0;

  return (
    <div className="flex flex-col gap-6 font-sans" id="document-scanner-component">

      {/* ── Top strip: page queue ────────────────────────────────────────── */}
      {hasPages && (
        <div className="flex items-center gap-2 overflow-x-auto pb-1" id="scanner-page-strip">
          {pages.map((page, idx) => (
            <div
              key={page.id}
              onClick={() => setActivePageIndex(idx)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && setActivePageIndex(idx)}
              className={`relative flex-shrink-0 group rounded-lg overflow-hidden border-2 transition-all cursor-pointer select-none ${
                idx === activePageIndex
                  ? 'border-violet-500 shadow-lg shadow-violet-500/20'
                  : 'border-zinc-700 hover:border-zinc-500'
              }`}
              style={{ width: 56, height: 72 }}
            >
              <img src={page.resultUrl ?? page.imageSrc} alt={`Page ${idx + 1}`}
                className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                <span className="text-white text-[10px] font-bold">{idx + 1}</span>
              </div>
              <button
                onClick={(e) => { e.stopPropagation(); removePage(page.id); }}
                className="absolute top-0.5 right-0.5 bg-red-600 rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-2.5 w-2.5 text-white" />
              </button>
            </div>
          ))}

          {/* Add more pages */}
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex-shrink-0 flex flex-col items-center justify-center w-14 h-18 rounded-lg border-2 border-dashed border-zinc-600 hover:border-violet-500 hover:bg-violet-500/5 transition-all text-zinc-500 hover:text-violet-400"
            style={{ height: 72 }}
          >
            <Plus className="h-5 w-5" />
            <span className="text-[9px] mt-0.5 font-medium">Add</span>
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-12">

        {/* ── Workbench (left) ─────────────────────────────────────────────── */}
        <div className="lg:col-span-8 flex flex-col gap-4">

          {!hasPages ? (
            /* Drop zone */
            <div
              onClick={() => fileInputRef.current?.click()}
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              className="relative flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-indigo-400/40 dark:border-zinc-800 bg-white/40 dark:bg-zinc-900/20 p-16 cursor-pointer text-center group hover:border-indigo-500 dark:hover:border-indigo-400 hover:bg-indigo-50/10 dark:hover:bg-indigo-950/5 transition-all duration-300 overflow-hidden shadow-3xs"
              id="scanner-dropzone"
            >
              {/* Scanner line animation sweep */}
              <div className="scanner-line-sweep opacity-30 group-hover:opacity-100" />

              <div className="relative mb-4">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full blur-xl animate-pulse" />
                <div className="relative bg-zinc-100 dark:bg-zinc-805 rounded-2xl p-5 border border-zinc-200/50 dark:border-zinc-700/80 group-hover:border-indigo-400/50 dark:hover:border-indigo-500/50 transition duration-300">
                  <ScanLine className="h-10 w-10 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                </div>
              </div>
              <h3 className="text-base font-extrabold text-zinc-900 dark:text-white mt-2 font-heading group-hover:text-indigo-650 dark:group-hover:text-indigo-455 transition-colors">Drop images to scan</h3>
              <p className="text-sm text-zinc-505 dark:text-zinc-400 mt-1.5 max-w-xs leading-relaxed">
                Upload photos of documents, certificates, or any paper. Supports JPG, PNG, WEBP. Multi-page PDF output.
              </p>
              <div className="flex gap-2 mt-4 relative z-10">
                {['JPG', 'PNG', 'WEBP', 'Multi-page'].map((t) => (
                  <span key={t} className="bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/60 dark:border-zinc-700/60 text-zinc-505 dark:text-zinc-450 text-[10px] font-bold font-mono px-2.5 py-1 rounded-md shadow-3xs">
                    {t}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            /* Image workbench with corner handles */
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 overflow-hidden" id="scanner-workbench">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/80">
                <div className="flex items-center gap-2 text-xs text-zinc-400 font-mono">
                  <ScanLine className="h-3.5 w-3.5 text-violet-400" />
                  <span>Page {activePageIndex + 1} / {pages.length}</span>
                  {activePage?.fileName && (
                    <span className="truncate max-w-[140px] text-zinc-500">· {activePage.fileName}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleAutoDetect}
                    disabled={isAutoDetecting}
                    className="flex items-center gap-1.5 bg-violet-600/20 hover:bg-violet-600/30 border border-violet-500/30 text-violet-300 text-xs font-semibold px-3 py-1.5 rounded-lg transition disabled:opacity-50"
                  >
                    <Zap className="h-3 w-3" />
                    {isAutoDetecting ? 'Detecting…' : 'Auto-detect'}
                  </button>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 text-xs font-medium px-2.5 py-1.5 rounded-lg transition"
                  >
                    <Plus className="h-3 w-3" />
                    Add Page
                  </button>
                  <button
                    onClick={() => { setPages([]); setFinalUrl(null); setActivePageIndex(0); }}
                    className="flex items-center gap-1 text-zinc-500 hover:text-red-400 text-xs px-2.5 py-1.5 rounded-lg hover:bg-red-500/10 transition"
                  >
                    <RefreshCw className="h-3 w-3" />
                    Clear
                  </button>
                </div>
              </div>

              {/* Image with corner handles */}
              <div
                ref={containerRef}
                className="relative flex items-center justify-center bg-zinc-950 cursor-crosshair select-none"
                style={{ minHeight: 380, maxHeight: 520 }}
              >
                {activePage && (
                  <>
                    <img
                      ref={imageRef}
                      src={activePage.imageSrc}
                      alt="Document source"
                      className="pointer-events-none max-h-[480px] max-w-full object-contain"
                      style={{ display: 'block' }}
                    />

                    {/* SVG overlay: polygon + edge lines */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <defs>
                        <filter id="glow">
                          <feGaussianBlur stdDeviation="2" result="coloredBlur" />
                          <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
                        </filter>
                      </defs>
                      {/* Shadow polygon */}
                      <polygon
                        points={`
                          ${activePage.corners.tl.x * 100}%,${activePage.corners.tl.y * 100}%
                          ${activePage.corners.tr.x * 100}%,${activePage.corners.tr.y * 100}%
                          ${activePage.corners.br.x * 100}%,${activePage.corners.br.y * 100}%
                          ${activePage.corners.bl.x * 100}%,${activePage.corners.bl.y * 100}%
                        `}
                        className="fill-violet-500/10 stroke-violet-400"
                        strokeWidth="1.5"
                        strokeDasharray="6 3"
                      />
                      {/* Solid corner edge lines */}
                      {[
                        [activePage.corners.tl, activePage.corners.tr],
                        [activePage.corners.tr, activePage.corners.br],
                        [activePage.corners.br, activePage.corners.bl],
                        [activePage.corners.bl, activePage.corners.tl],
                      ].map(([a, b], i) => (
                        <line
                          key={i}
                          x1={`${a.x * 100}%`} y1={`${a.y * 100}%`}
                          x2={`${b.x * 100}%`} y2={`${b.y * 100}%`}
                          stroke="rgba(167,139,250,0.8)"
                          strokeWidth="1.5"
                          filter="url(#glow)"
                        />
                      ))}
                    </svg>

                    {/* Draggable corner handles */}
                    {(['tl', 'tr', 'br', 'bl'] as const).map((corner) => (
                      <div
                        key={corner}
                        onPointerDown={(e) => handlePointerDown(corner, e)}
                        className="absolute touch-none cursor-grab active:cursor-grabbing z-20 select-none focus:outline-none focus:ring-2 focus:ring-violet-500 rounded-full"
                        style={{
                          left: `${activePage.corners[corner].x * 100}%`,
                          top: `${activePage.corners[corner].y * 100}%`,
                          transform: 'translate(-50%, -50%)',
                        }}
                        tabIndex={0}
                        aria-label={`Adjust ${corner.toUpperCase()} corner anchor`}
                        onKeyDown={(e) => {
                          const step = e.shiftKey ? 0.05 : 0.01;
                          let dx = 0;
                          let dy = 0;
                          if (e.key === 'ArrowLeft') dx = -step;
                          else if (e.key === 'ArrowRight') dx = step;
                          else if (e.key === 'ArrowUp') dy = -step;
                          else if (e.key === 'ArrowDown') dy = step;
                          else return;

                          e.preventDefault();
                          setPages((prev) =>
                            prev.map((p, i) =>
                              i === activePageIndex
                                ? {
                                    ...p,
                                    corners: {
                                      ...p.corners,
                                      [corner]: {
                                        x: Math.max(0.02, Math.min(0.98, p.corners[corner].x + dx)),
                                        y: Math.max(0.02, Math.min(0.98, p.corners[corner].y + dy)),
                                      },
                                    },
                                  }
                                : p
                            )
                          );
                        }}
                      >
                        {/* Outer ring */}
                        <div className="relative flex items-center justify-center w-8 h-8">
                          <div className="absolute inset-0 rounded-full bg-violet-500/10 border border-violet-500/20" />
                          <div className="relative w-6 h-6 rounded-full bg-violet-600 border-2 border-white shadow-lg shadow-violet-500/40 flex items-center justify-center">
                            <div className="w-1.5 h-1.5 rounded-full bg-white" />
                          </div>
                        </div>
                      </div>
                    ))}

                  </>
                )}
              </div>
            </div>
          )}

          {/* Page nav arrows */}
          {hasPages && pages.length > 1 && (
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => setActivePageIndex((i) => Math.max(0, i - 1))}
                disabled={activePageIndex === 0}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 disabled:opacity-30 transition"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="text-xs text-zinc-400 font-mono">
                Page {activePageIndex + 1} of {pages.length}
              </span>
              <button
                onClick={() => setActivePageIndex((i) => Math.min(pages.length - 1, i + 1))}
                disabled={activePageIndex === pages.length - 1}
                className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 disabled:opacity-30 transition"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>

        {/* ── Control panel (right) ─────────────────────────────────────────── */}
        <div className="lg:col-span-4 flex flex-col gap-4" id="scanner-controls">

          {/* Scan Mode */}
          <div className="premium-card p-5 space-y-3.5 shadow-3xs" id="scanner-mode-panel">
            <h3 className="text-xs font-black text-zinc-450 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400 animate-float" /> Scan Mode
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {SCAN_MODES.map((mode) => (
                <button
                  key={mode.id}
                  onClick={() => setScanMode(mode.id)}
                  className={`relative flex flex-col items-start rounded-xl p-3 border text-left transition-all duration-300 overflow-hidden group cursor-pointer ${
                    scanMode === mode.id
                      ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-md shadow-indigo-500/5'
                      : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                  }`}
                >
                  {scanMode === mode.id && (
                    <div className={`absolute inset-0 bg-gradient-to-br ${mode.color} opacity-10`} />
                  )}
                  <div className={`relative p-1.5 rounded-lg mb-1.5 ${scanMode === mode.id ? `bg-gradient-to-br ${mode.color}` : 'bg-zinc-305 dark:bg-zinc-700'} ${scanMode === mode.id ? 'text-white' : 'text-zinc-505 dark:text-zinc-300'}`}>
                    {mode.icon}
                  </div>
                  <span className="relative text-xs font-extrabold text-zinc-900 dark:text-white font-heading">{mode.label}</span>
                  <span className="relative text-[10px] text-zinc-505 dark:text-zinc-450 mt-1 leading-snug">{mode.desc}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Enhancement Sliders */}
          {hasPages && (
            <div className="premium-card p-5 space-y-4 shadow-3xs" id="scanner-sliders">
              <h3 className="text-xs font-black text-zinc-450 uppercase tracking-wider flex items-center gap-1.5 font-mono">
                <Sliders className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" /> Tuning
              </h3>

              {[
                { label: 'Brightness', icon: <Sun className="h-3 w-3" />, value: brightness, onChange: setBrightness, min: -80, max: 80, color: 'accent-indigo-500 dark:accent-indigo-400' },
                { label: 'Contrast', icon: <Contrast className="h-3 w-3" />, value: contrast, onChange: setContrast, min: -80, max: 80, color: 'accent-indigo-500 dark:accent-indigo-400' },
                { label: 'Sharpness', icon: <Zap className="h-3 w-3" />, value: sharpness, onChange: setSharpness, min: 0, max: 100, color: 'accent-indigo-500 dark:accent-indigo-400' },
              ].map((s) => (
                <div key={s.label} className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="flex items-center gap-1.5 text-xs font-semibold text-zinc-700 dark:text-zinc-300">
                      <span className="text-zinc-500">{s.icon}</span>
                      {s.label}
                    </label>
                    <span className="text-[10px] font-mono text-zinc-555 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded">
                      {s.value > 0 ? `+${s.value}` : s.value}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={s.value}
                    onChange={(e) => s.onChange(Number(e.target.value))}
                    className={`w-full h-1.5 rounded-full bg-zinc-200 dark:bg-zinc-700 appearance-none cursor-pointer ${s.color}`}
                  />
                </div>
              ))}

              {/* Reset sliders */}
              <button
                onClick={() => { setBrightness(0); setContrast(0); setSharpness(20); }}
                className="text-[10px] text-zinc-500 hover:text-indigo-650 dark:hover:text-indigo-400 transition underline cursor-pointer"
              >
                Reset to defaults
              </button>
            </div>
          )}

          {/* Output Format & Page Size */}
          <div className="premium-card p-5 space-y-4 shadow-3xs" id="scanner-output-panel">
            <h3 className="text-xs font-black text-zinc-450 uppercase tracking-wider flex items-center gap-1.5 font-mono">
              <FileText className="h-3.5 w-3.5 text-indigo-500 dark:text-indigo-400" /> Output Config
            </h3>

            {/* Format */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">Format</label>
              <div className="grid grid-cols-3 gap-2">
                {(['pdf', 'jpeg', 'png'] as const).map((fmt) => (
                  <button
                    key={fmt}
                    onClick={() => setOutputFormat(fmt)}
                    className={`py-2 rounded-lg border text-xs font-extrabold uppercase tracking-wider transition-all duration-300 cursor-pointer ${
                      outputFormat === fmt
                        ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-750 dark:text-indigo-300 shadow-2xs shadow-indigo-500/5'
                        : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-505 dark:text-zinc-400 hover:border-zinc-300 dark:hover:border-zinc-700'
                    }`}
                  >
                    {fmt}
                  </button>
                ))}
              </div>
            </div>

            {/* Page size (only for PDF) */}
            {outputFormat === 'pdf' && (
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-650 dark:text-zinc-300">Page Size</label>
                <div className="grid grid-cols-2 gap-2">
                  {PAGE_SIZE_OPTIONS.map((sz) => (
                    <button
                      key={sz.id}
                      onClick={() => setPageSize(sz.id)}
                      className={`flex flex-col items-start p-2.5 rounded-lg border text-left transition-all duration-300 cursor-pointer ${
                        pageSize === sz.id
                          ? 'border-indigo-500 dark:border-indigo-400 bg-indigo-50/50 dark:bg-indigo-950/20 shadow-2xs shadow-indigo-500/5'
                          : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700'
                      }`}
                    >
                      <span className="text-xs font-bold text-zinc-900 dark:text-white font-heading">{sz.label}</span>
                      <span className="text-[10px] text-zinc-505 dark:text-zinc-500 mt-0.5">{sz.sub}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Live Preview */}
          {hasPages && livePreviewUrl && (
            <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 space-y-2" id="scanner-live-preview">
              <h3 className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Eye className="h-3.5 w-3.5 text-violet-400" /> Live Preview
              </h3>
              <div className="flex justify-center">
                <img
                  src={livePreviewUrl}
                  alt="Preview"
                  className="rounded-lg border border-zinc-700 shadow-lg"
                  style={{ maxHeight: 180, maxWidth: '100%', objectFit: 'contain' }}
                />
              </div>
            </div>
          )}

          {/* Scan button */}
          {hasPages && (
            <button
              onClick={handleScan}
              disabled={isScanning}
              className="w-full h-12 flex items-center justify-center gap-2 rounded-xl font-bold text-sm text-white transition disabled:opacity-50 relative overflow-hidden bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-600 hover:from-indigo-500 hover:via-indigo-400 hover:to-violet-500 shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-98 cursor-pointer"
              id="scanner-scan-btn"
            >
              {!isScanning && <div className="absolute inset-0 bg-white/5 hover:bg-white/10 transition" />}
              {isScanning ? (
                <>
                  <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  Processing {pages.length} page{pages.length > 1 ? 's' : ''}…
                </>
              ) : (
                <>
                  <ScanLine className="h-4 w-4" />
                  Scan & Export {outputFormat.toUpperCase()}
                  {pages.length > 1 && <span className="bg-white/20 text-[10px] px-1.5 py-0.5 rounded-full font-mono">{pages.length}p</span>}
                </>
              )}
            </button>
          )}

          {/* Result card */}
          {finalUrl && (
            <div className="rounded-2xl border border-emerald-700/50 bg-emerald-950/30 p-4 space-y-3 animate-fadeIn" id="scanner-result-card">
              <div className="flex items-start gap-2">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-bold text-emerald-300">Scan Complete</p>
                  <p className="text-xs text-emerald-600 mt-0.5">
                    {pages.length} page{pages.length > 1 ? 's' : ''} · <strong className="text-emerald-400">{(finalSize / 1024).toFixed(1)} KB</strong>
                  </p>
                  <p className="text-[10px] text-emerald-700 font-mono mt-0.5 truncate max-w-[200px]">{finalName}</p>
                </div>
              </div>
              <button
                onClick={handleDownload}
                className="w-full flex items-center justify-center gap-2 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-sm transition"
              >
                <Download className="h-4 w-4" />
                Download {outputFormat.toUpperCase()}
              </button>
            </div>
          )}
        </div>
      </div>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept="image/*"
        multiple
        className="hidden"
      />

      <ProcessingProgress isProcessing={isScanning} type="scanner" />
    </div>
  );
}
