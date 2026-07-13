import React, { useState, useRef } from 'react';
import { FileText, Plus, Trash2, ArrowUp, ArrowDown, Settings, Download, AlertCircle, FilePlus, RefreshCw, Layers, Eye } from 'lucide-react';
import { mergePDFs, splitPDF, rotatePDF, imagesToPDF, optimizePDFStructure, compressPDF, compressPDFToTarget } from '../utils/pdfUtils';
import ProcessingProgress from './ProcessingProgress';

interface PdfToolkitProps {
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

interface SelectedFile {
  name: string;
  size: number;
  buffer: ArrayBuffer;
}

interface ImageFile {
  name: string;
  size: number;
  dataUrl: string;
  type: string;
}

export default function PdfToolkit({
  onAddDeletionLog,
  onSaveProcessedFile
}: PdfToolkitProps) {
  const [activeTab, setActiveTab] = useState<'merge' | 'split' | 'rotate' | 'images-to-pdf' | 'compress'>('merge');

  // MERGE STATE
  const [mergeQueue, setMergeQueue] = useState<SelectedFile[]>([]);
  const mergeInputRef = useRef<HTMLInputElement | null>(null);

  // SPLIT STATE
  const [splitFile, setSplitFile] = useState<SelectedFile | null>(null);
  const [pageRange, setPageRange] = useState<string>('1');
  const splitInputRef = useRef<HTMLInputElement | null>(null);

  // ROTATE STATE
  const [rotateFile, setRotateFile] = useState<SelectedFile | null>(null);
  const [rotationAngle, setRotationAngle] = useState<number>(90);
  const [rotatePageIndex, setRotatePageIndex] = useState<number>(-1); // -1 is all pages
  const rotateInputRef = useRef<HTMLInputElement | null>(null);

  // IMAGES TO PDF STATE
  const [imagesQueue, setImagesQueue] = useState<ImageFile[]>([]);
  const imagesInputRef = useRef<HTMLInputElement | null>(null);

  // COMPRESS STATE
  const [compressFile, setCompressFile] = useState<SelectedFile | null>(null);
  const [compressionPreset, setCompressionPreset] = useState<'high' | 'medium' | 'low'>('medium');
  const [useTargetSize, setUseTargetSize] = useState<boolean>(false);
  const [targetSizeKb, setTargetSizeKb] = useState<number>(500);
  const [compressionProgressMsg, setCompressionProgressMsg] = useState<string>('');
  const compressInputRef = useRef<HTMLInputElement | null>(null);

  // General execution states
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [outcomeUrl, setOutcomeUrl] = useState<string | null>(null);
  const [outcomeSize, setOutcomeSize] = useState<number>(0);
  const [outcomeName, setOutcomeName] = useState<string>('');
  
  // Track all generated PDFs in this session for easy batch downloading
  const [generatedFiles, setGeneratedFiles] = useState<{id: string, name: string, dataUrl: string, size: number}[]>([]);

  const clearOutcome = () => {
    setOutcomeUrl(null);
    setOutcomeSize(0);
    setOutcomeName('');
  };

  // Automatically scroll outcome panel into view when PDF processing completes
  React.useEffect(() => {
    if (outcomeUrl) {
      setTimeout(() => {
        const el = document.getElementById('pdf-outcome-card');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
      }, 100);
    }
  }, [outcomeUrl]);

  // Helper: Read file buffer
  const readFileAsBuffer = (file: File): Promise<ArrayBuffer> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as ArrayBuffer);
      reader.onerror = (e) => reject(e);
      reader.readAsArrayBuffer(file);
    });
  };

  // Reusable bulletproof download utility using Blobs to avoid browser restrictions on data URL downloads
  const downloadFileFromDataUrl = (dataUrl: string, fileName: string) => {
    try {
      const parts = dataUrl.split(',');
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const byteStr = atob(parts[1]);
      const arr = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) {
        arr[i] = byteStr.charCodeAt(i);
      }
      // Use File object instead of Blob: it natively carries filename and extension metadata
      const fileObj = new File([arr], fileName, { type: mime });
      const blobUrl = URL.createObjectURL(fileObj);
      
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      // Clean up the URL object after download triggers
      setTimeout(() => URL.revokeObjectURL(blobUrl), 10000);
    } catch (err) {
      console.error('File download failed, trying fallback data URL:', err);
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = fileName;
      a.style.display = 'none';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  // Reusable utility to open generated PDF in a new tab for direct viewing, saving, or printing
  const openPdfInNewTab = (dataUrl: string, fileName: string) => {
    try {
      const parts = dataUrl.split(',');
      const byteStr = atob(parts[1]);
      const arr = new Uint8Array(byteStr.length);
      for (let i = 0; i < byteStr.length; i++) {
        arr[i] = byteStr.charCodeAt(i);
      }
      // Use File object to carry filename metadata to browser's native save dialog
      const fileObj = new File([arr], fileName, { type: 'application/pdf' });
      const blobUrl = URL.createObjectURL(fileObj);
      window.open(blobUrl, '_blank');
    } catch (err) {
      console.error('Failed to open PDF in new tab, trying data URL fallback:', err);
      window.open(dataUrl, '_blank');
    }
  };

  // MERGE LOGIC
  const handleMergeUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newFiles: SelectedFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type === 'application/pdf' || file.name.endsWith('.pdf')) {
          try {
            const buffer = await readFileAsBuffer(file);
            newFiles.push({ name: file.name, size: file.size, buffer });
          } catch (err) {
            console.error(err);
          }
        }
      }
      setMergeQueue((prev) => [...prev, ...newFiles]);
      clearOutcome();
    }
  };

  const moveItem = (index: number, direction: 'up' | 'down') => {
    const newQueue = [...mergeQueue];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx >= 0 && targetIdx < newQueue.length) {
      const temp = newQueue[index];
      newQueue[index] = newQueue[targetIdx];
      newQueue[targetIdx] = temp;
      setMergeQueue(newQueue);
    }
  };

  const handleMergeSubmit = async () => {
    if (mergeQueue.length < 2) {
      alert('Please upload at least 2 PDF files to merge.');
      return;
    }
    setIsProcessing(true);
    // Yield to let React paint the Loading Progress Overlay before pdf-lib operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const buffers = mergeQueue.map((f) => f.buffer);
      const mergedBytes = await mergePDFs(buffers);
      const optimizedBytes = await optimizePDFStructure(mergedBytes.buffer);

      const blob = new Blob([optimizedBytes], { type: 'application/pdf' });
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setOutcomeUrl(dataUrl);
      setOutcomeSize(blob.size);
      setOutcomeName(`merged_document_${Date.now()}.pdf`);

      // Record logs
      mergeQueue.forEach((f) => onAddDeletionLog(f.name));
      
      const newFile = {
        id: `pdf-merged-${Date.now()}`,
        name: `merged_${Date.now()}.pdf`,
        type: 'application/pdf',
        size: blob.size,
        dataUrl,
        originalName: `${mergeQueue.length} merged PDFs`,
        originalSize: mergeQueue.reduce((acc, curr) => acc + curr.size, 0),
        validated: true,
        issues: []
      };
      
      setGeneratedFiles(prev => [...prev, { id: newFile.id, name: newFile.name, dataUrl: newFile.dataUrl, size: newFile.size }]);

      // Save inside parent context session
      onSaveProcessedFile(newFile);
    } catch (err: any) {
      alert(`Merge failed: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // SPLIT LOGIC
  const handleSplitUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      const buffer = await readFileAsBuffer(file);
      setSplitFile({ name: file.name, size: file.size, buffer });
      clearOutcome();
    }
  };

  const handleSplitSubmit = async () => {
    if (!splitFile) return;
    setIsProcessing(true);
    // Yield to let React paint the Loading Progress Overlay before pdf-lib operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const splitBytes = await splitPDF(splitFile.buffer, pageRange);
      const optimizedBytes = await optimizePDFStructure(splitBytes.buffer);

      const blob = new Blob([optimizedBytes], { type: 'application/pdf' });
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setOutcomeUrl(dataUrl);
      setOutcomeSize(blob.size);
      setOutcomeName(`extracted_pages_${Date.now()}.pdf`);

      onAddDeletionLog(splitFile.name);

      const newFile = {
        id: `pdf-split-${Date.now()}`,
        name: `split_${Date.now()}.pdf`,
        type: 'application/pdf',
        size: blob.size,
        dataUrl,
        originalName: splitFile.name,
        originalSize: splitFile.size,
        validated: true,
        issues: []
      };

      setGeneratedFiles(prev => [...prev, { id: newFile.id, name: newFile.name, dataUrl: newFile.dataUrl, size: newFile.size }]);

      onSaveProcessedFile(newFile);
    } catch (err: any) {
      alert(`Splitting failed: ${err?.message || 'Check your page ranges e.g. "1, 2-3"'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // ROTATE LOGIC
  const handleRotateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      const buffer = await readFileAsBuffer(file);
      setRotateFile({ name: file.name, size: file.size, buffer });
      clearOutcome();
    }
  };

  const handleRotateSubmit = async () => {
    if (!rotateFile) return;
    setIsProcessing(true);
    // Yield to let React paint the Loading Progress Overlay before pdf-lib operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const rotatedBytes = await rotatePDF(rotateFile.buffer, rotationAngle, rotatePageIndex);
      const optimizedBytes = await optimizePDFStructure(rotatedBytes.buffer);

      const blob = new Blob([optimizedBytes], { type: 'application/pdf' });
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setOutcomeUrl(dataUrl);
      setOutcomeSize(blob.size);
      setOutcomeName(`rotated_document_${Date.now()}.pdf`);

      onAddDeletionLog(rotateFile.name);

      const newFile = {
        id: `pdf-rotated-${Date.now()}`,
        name: `rotated_${Date.now()}.pdf`,
        type: 'application/pdf',
        size: blob.size,
        dataUrl,
        originalName: rotateFile.name,
        originalSize: rotateFile.size,
        validated: true,
        issues: []
      };

      setGeneratedFiles(prev => [...prev, { id: newFile.id, name: newFile.name, dataUrl: newFile.dataUrl, size: newFile.size }]);

      onSaveProcessedFile(newFile);
    } catch (err: any) {
      alert(`Rotation failed: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // IMAGES TO PDF LOGIC
  const handleImagesUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      const newImages: ImageFile[] = [];
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        if (file.type.includes('image/jpeg') || file.type.includes('image/png')) {
          const dataUrl = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onload = (ev) => resolve(ev.target?.result as string);
            reader.readAsDataURL(file);
          });
          newImages.push({
            name: file.name,
            size: file.size,
            dataUrl,
            type: file.type
          });
        }
      }
      setImagesQueue((prev) => [...prev, ...newImages]);
      clearOutcome();
    }
  };

  const handleImagesToPdfSubmit = async () => {
    if (imagesQueue.length === 0) {
      alert('Please upload at least 1 image.');
      return;
    }
    setIsProcessing(true);
    // Yield to let React paint the Loading Progress Overlay before pdf-lib operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      const pdfBytes = await imagesToPDF(imagesQueue);
      const optimizedBytes = await optimizePDFStructure(pdfBytes.buffer);

      const blob = new Blob([optimizedBytes], { type: 'application/pdf' });
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      setOutcomeUrl(dataUrl);
      setOutcomeSize(blob.size);
      setOutcomeName(`compiled_images_${Date.now()}.pdf`);

      imagesQueue.forEach((img) => onAddDeletionLog(img.name));

      const newFile = {
        id: `pdf-from-images-${Date.now()}`,
        name: `compiled_pdf_${Date.now()}.pdf`,
        type: 'application/pdf',
        size: blob.size,
        dataUrl,
        originalName: `${imagesQueue.length} Images`,
        originalSize: imagesQueue.reduce((acc, curr) => acc + curr.size, 0),
        validated: true,
        issues: []
      };

      setGeneratedFiles(prev => [...prev, { id: newFile.id, name: newFile.name, dataUrl: newFile.dataUrl, size: newFile.size }]);

      onSaveProcessedFile(newFile);
    } catch (err: any) {
      alert(`PDF Compilation failed: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
    }
  };

  // COMPRESS LOGIC
  const handleCompressUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && (file.type === 'application/pdf' || file.name.endsWith('.pdf'))) {
      const buffer = await readFileAsBuffer(file);
      setCompressFile({ name: file.name, size: file.size, buffer });
      clearOutcome();
    }
  };

  const handleCompressSubmit = async () => {
    if (!compressFile) return;
    setIsProcessing(true);
    setCompressionProgressMsg("Starting compression...");
    // Yield to let React paint the Loading Progress Overlay before PDF operations
    await new Promise((resolve) => setTimeout(resolve, 100));

    try {
      let compressedBytes: Uint8Array;
      if (useTargetSize) {
        compressedBytes = await compressPDFToTarget(
          compressFile.buffer,
          targetSizeKb,
          (msg) => setCompressionProgressMsg(msg)
        );
      } else {
        let quality = 0.6;
        let scale = 1.2;

        if (compressionPreset === 'high') {
          quality = 0.4;
          scale = 1.0;
        } else if (compressionPreset === 'low') {
          quality = 0.8;
          scale = 1.5;
        }
        compressedBytes = await compressPDF(compressFile.buffer, quality, scale);
      }

      const blob = new Blob([compressedBytes], { type: 'application/pdf' });
      
      // Use blob URL for reliable downloads (data: URLs are silently blocked by browsers for large files)
      const blobUrl = URL.createObjectURL(blob);
      
      // Also generate dataUrl for state storage
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const downloadName = `compressed_${compressFile.name}`;

      setOutcomeUrl(dataUrl);
      setOutcomeSize(blob.size);
      setOutcomeName(downloadName);

      onAddDeletionLog(compressFile.name);

      const newFile = {
        id: `pdf-compressed-${Date.now()}`,
        name: downloadName,
        type: 'application/pdf',
        size: blob.size,
        dataUrl,
        originalName: compressFile.name,
        originalSize: compressFile.size,
        validated: true,
        issues: []
      };

      setGeneratedFiles(prev => [...prev, { id: newFile.id, name: newFile.name, dataUrl: newFile.dataUrl, size: newFile.size }]);

      onSaveProcessedFile(newFile);

      // Auto-trigger download using our bulletproof utility
      downloadFileFromDataUrl(dataUrl, downloadName);
      
    } catch (err: any) {
      alert(`Compression failed: ${err?.message || err}`);
    } finally {
      setIsProcessing(false);
      setCompressionProgressMsg('');
    }
  };

  const handleDownload = () => {
    if (!outcomeUrl) return;
    downloadFileFromDataUrl(outcomeUrl, outcomeName || 'document.pdf');
  };

  return (
    <div className="grid gap-8 lg:grid-cols-12 font-sans" id="pdf-toolkit-component">
      {/* Sub-navigation Tabs Left/Top */}
      <div className="lg:col-span-3 flex flex-row lg:flex-col gap-1 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 border-b lg:border-b-0 lg:border-r border-zinc-200">
        {[
          { id: 'merge', label: 'Merge PDFs', desc: 'Combine documents' },
          { id: 'split', label: 'Split PDF Pages', desc: 'Extract custom page ranges' },
          { id: 'rotate', label: 'Rotate PDF', desc: 'Correct orientations' },
          { id: 'images-to-pdf', label: 'Images to PDF', desc: 'Scanned marksheet compiler' },
          { id: 'compress', label: 'Compress PDF', desc: 'Reduce file size' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              clearOutcome();
            }}
            className={`flex flex-col items-start rounded-lg px-4 py-3 text-left transition shrink-0 lg:shrink ${
              activeTab === tab.id
                ? 'bg-indigo-50 text-indigo-950 border-l-2 border-indigo-800'
                : 'hover:bg-zinc-50 text-zinc-600'
            }`}
          >
            <span className="text-xs font-bold font-mono tracking-wide">{tab.label}</span>
            <span className="text-[10px] text-zinc-400 mt-0.5 hidden sm:inline">{tab.desc}</span>
          </button>
        ))}
      </div>

      {/* Workshop Workspace Middle/Right Column */}
      <div className="lg:col-span-9 flex flex-col gap-6">
        {/* MERGE VIEW */}
        {activeTab === 'merge' && (
          <div className="space-y-4" id="pdf-merge-view">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Merge PDF Files</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Select and drag/move files to define merge arrangement order.</p>
              </div>
              <button
                onClick={() => mergeInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-xs font-semibold text-indigo-950 hover:bg-indigo-50 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add Files
              </button>
              <input
                type="file"
                ref={mergeInputRef}
                onChange={handleMergeUpload}
                accept=".pdf"
                multiple
                className="hidden"
              />
            </div>

            {mergeQueue.length === 0 ? (
              <div 
                onClick={() => mergeInputRef.current?.click()}
                className="flex flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/40 hover:bg-zinc-50 rounded-xl py-12 text-center cursor-pointer group transition"
              >
                <Layers className="h-10 w-10 text-zinc-400 group-hover:text-indigo-600 transition" />
                <h4 className="mt-3 text-xs font-bold text-zinc-700 uppercase tracking-wider font-mono">No Files in Merge Queue</h4>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">Upload 2 or more PDFs. Merging is handled 100% in RAM.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="max-h-60 overflow-y-auto space-y-1.5 pr-1">
                  {mergeQueue.map((file, idx) => (
                    <div key={idx} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-white p-3 shadow-3xs hover:border-zinc-300 transition">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <FileText className="h-4.5 w-4.5 text-indigo-700 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-zinc-800 truncate">{file.name}</p>
                          <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => moveItem(idx, 'up')}
                          disabled={idx === 0}
                          className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 text-zinc-500"
                        >
                          <ArrowUp className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => moveItem(idx, 'down')}
                          disabled={idx === mergeQueue.length - 1}
                          className="p-1 rounded bg-zinc-100 hover:bg-zinc-200 disabled:opacity-30 text-zinc-500"
                        >
                          <ArrowDown className="h-3 w-3" />
                        </button>
                        <button
                          onClick={() => setMergeQueue(mergeQueue.filter((_, i) => i !== idx))}
                          className="p-1 rounded bg-rose-50 hover:bg-rose-100 text-rose-600 ml-1"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleMergeSubmit}
                  disabled={isProcessing || mergeQueue.length < 2}
                  className="w-full h-10 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-2xs disabled:opacity-50"
                >
                  {isProcessing ? 'Merging PDFs in RAM...' : `Merge ${mergeQueue.length} Files`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* SPLIT VIEW */}
        {activeTab === 'split' && (
          <div className="space-y-4" id="pdf-split-view">
            <div className="border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">Extract PDF Pages</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Isolate page selections from a multi-page PDF.</p>
            </div>

            {!splitFile ? (
              <div
                onClick={() => splitInputRef.current?.click()}
                className="flex flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/40 hover:bg-zinc-50 rounded-xl py-12 text-center cursor-pointer group transition"
              >
                <Layers className="h-10 w-10 text-zinc-400 group-hover:text-indigo-600 transition" />
                <h4 className="mt-3 text-xs font-bold text-zinc-700 uppercase tracking-wider font-mono">Upload PDF to Split</h4>
                <input
                  type="file"
                  ref={splitInputRef}
                  onChange={handleSplitUpload}
                  accept=".pdf"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-700" />
                    <div>
                      <p className="text-xs font-bold text-zinc-800">{splitFile.name}</p>
                      <p className="text-[10px] font-mono text-zinc-500">{(splitFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSplitFile(null)}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Clear File
                  </button>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-700 flex justify-between">
                    <span>Enter Page Selection Range</span>
                    <span className="text-[10px] text-zinc-400">e.g. 1, 3-5 (1-indexed)</span>
                  </label>
                  <input
                    type="text"
                    value={pageRange}
                    onChange={(e) => setPageRange(e.target.value)}
                    placeholder="e.g. 1, 3-5"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-mono text-zinc-800 focus:border-indigo-500 focus:outline-none"
                  />
                </div>

                <button
                  onClick={handleSplitSubmit}
                  disabled={isProcessing}
                  className="w-full h-10 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-2xs"
                >
                  {isProcessing ? 'Slicing pages...' : 'Extract & Compile Selected Pages'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ROTATE VIEW */}
        {activeTab === 'rotate' && (
          <div className="space-y-4" id="pdf-rotate-view">
            <div className="border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">Rotate PDF Document</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Rotate inverted or landscape sheets back to vertical format.</p>
            </div>

            {!rotateFile ? (
              <div
                onClick={() => rotateInputRef.current?.click()}
                className="flex flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/40 hover:bg-zinc-50 rounded-xl py-12 text-center cursor-pointer group transition"
              >
                <Layers className="h-10 w-10 text-zinc-400 group-hover:text-indigo-600 transition" />
                <h4 className="mt-3 text-xs font-bold text-zinc-700 uppercase tracking-wider font-mono">Upload PDF to Rotate</h4>
                <input
                  type="file"
                  ref={rotateInputRef}
                  onChange={handleRotateUpload}
                  accept=".pdf"
                  className="hidden"
                />
              </div>
            ) : (
              <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
                <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-indigo-700" />
                    <div>
                      <p className="text-xs font-bold text-zinc-800">{rotateFile.name}</p>
                      <p className="text-[10px] font-mono text-zinc-500">{(rotateFile.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setRotateFile(null)}
                    className="text-xs font-medium text-rose-600 hover:underline"
                  >
                    Clear File
                  </button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Rotation Degrees</label>
                    <select
                      value={rotationAngle}
                      onChange={(e) => setRotationAngle(parseInt(e.target.value))}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs text-zinc-800 focus:outline-none"
                    >
                      <option value="90">90° Clockwise</option>
                      <option value="180">180° Half Turn</option>
                      <option value="270">270° Counter-Clockwise</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-zinc-700">Target Page Index</label>
                    <input
                      type="number"
                      value={rotatePageIndex}
                      onChange={(e) => setRotatePageIndex(parseInt(e.target.value))}
                      placeholder="-1 for All Pages"
                      className="w-full rounded-lg border border-zinc-200 px-3 py-1.5 text-xs text-zinc-800 focus:outline-none"
                    />
                    <span className="text-[9px] text-zinc-400">Specify 1-indexed page number or -1 for all pages.</span>
                  </div>
                </div>

                <button
                  onClick={handleRotateSubmit}
                  disabled={isProcessing}
                  className="w-full h-10 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-2xs"
                >
                  {isProcessing ? 'Rotating pages...' : 'Rotate Pages'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* IMAGES TO PDF VIEW */}
        {activeTab === 'images-to-pdf' && (
          <div className="space-y-4" id="pdf-images-view">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Compile Images into PDF</h3>
                <p className="text-xs text-zinc-500 mt-0.5">Combine photos of marksheets or documents into a single PDF.</p>
              </div>
              <button
                onClick={() => imagesInputRef.current?.click()}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50/50 px-3 py-1.5 text-xs font-semibold text-indigo-950 hover:bg-indigo-50 transition"
              >
                <Plus className="h-3.5 w-3.5" /> Add Images
              </button>
              <input
                type="file"
                ref={imagesInputRef}
                onChange={handleImagesUpload}
                accept="image/jpeg,image/jpg,image/png"
                multiple
                className="hidden"
              />
            </div>

            {imagesQueue.length === 0 ? (
              <div 
                onClick={() => imagesInputRef.current?.click()}
                className="flex flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/40 hover:bg-zinc-50 rounded-xl py-12 text-center cursor-pointer group transition"
              >
                <FilePlus className="h-10 w-10 text-zinc-400 group-hover:text-indigo-600 transition" />
                <h4 className="mt-3 text-xs font-bold text-zinc-700 uppercase tracking-wider font-mono">No Images Uploaded</h4>
                <p className="text-xs text-zinc-500 max-w-xs mt-1">Upload images to bundle. Output PDF will be structured in RAM.</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="grid gap-2 grid-cols-2 sm:grid-cols-4 max-h-52 overflow-y-auto pr-1">
                  {imagesQueue.map((img, idx) => (
                    <div key={idx} className="relative rounded-lg border border-zinc-200 p-1 bg-white flex flex-col justify-between group">
                      <img src={img.dataUrl} alt="Thumbnail" className="h-20 w-full object-cover rounded" />
                      <div className="p-1 min-w-0">
                        <p className="text-[10px] font-medium text-zinc-700 truncate">{img.name}</p>
                        <p className="text-[9px] text-zinc-400 font-mono">{(img.size / 1024).toFixed(0)} KB</p>
                      </div>
                      <button
                        onClick={() => setImagesQueue(imagesQueue.filter((_, i) => i !== idx))}
                        className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white p-1 rounded-md opacity-90 transition shadow-2xs"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleImagesToPdfSubmit}
                  disabled={isProcessing || imagesQueue.length === 0}
                  className="w-full h-10 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-2xs mt-4"
                >
                  {isProcessing ? 'Generating unified PDF...' : `Compile ${imagesQueue.length} Images to PDF`}
                </button>
              </div>
            )}
          </div>
        )}

        {/* COMPRESS VIEW */}
        {activeTab === 'compress' && (
          <div className="space-y-4" id="pdf-compress-view">
            <div className="border-b border-zinc-100 pb-3">
              <h3 className="text-sm font-bold text-zinc-900">Compress PDF File</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Reduce PDF file size by compressing embedded page scans.</p>
            </div>

            {/* === AFTER PROCESSING: SHOW DOWNLOAD RESULT SCREEN === */}
            {outcomeUrl && compressFile ? (
              <div className="rounded-xl border-2 border-emerald-300 bg-gradient-to-b from-emerald-50 to-white p-6 space-y-6" id="compress-download-result">
                {/* Success header */}
                <div className="flex flex-col items-center text-center space-y-3">
                  <div className="h-16 w-16 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center border-2 border-emerald-300">
                    <Download className="h-8 w-8" />
                  </div>
                  <h3 className="text-lg font-black text-emerald-900">Compression Complete!</h3>
                  <p className="text-xs text-zinc-600 max-w-sm">Your PDF has been compressed successfully. The file should have auto-downloaded — if not, click the button below.</p>
                </div>

                {/* Size comparison */}
                <div className="grid grid-cols-3 gap-3 bg-white rounded-lg border border-zinc-200 p-4">
                  <div className="text-center">
                    <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Original</p>
                    <p className="text-sm font-black text-zinc-800 mt-1">{(compressFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <div className="text-center flex flex-col items-center justify-center">
                    <span className="text-lg">→</span>
                    <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded-full ${
                      outcomeSize < compressFile.size
                        ? 'text-emerald-700 bg-emerald-100'
                        : 'text-amber-700 bg-amber-100'
                    }`}>
                      {outcomeSize < compressFile.size
                        ? `-${Math.round(((compressFile.size - outcomeSize) / compressFile.size) * 100)}%`
                        : `+${Math.round(((outcomeSize - compressFile.size) / compressFile.size) * 100)}%`
                      }
                    </span>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider">Compressed</p>
                    <p className="text-sm font-black text-emerald-700 mt-1">{(outcomeSize / 1024).toFixed(0)} KB</p>
                  </div>
                </div>

                {/* GIANT DOWNLOAD BUTTON */}
                <button
                  onClick={handleDownload}
                  className="w-full h-16 flex items-center justify-center gap-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-black text-xl transition-all shadow-lg hover:shadow-xl cursor-pointer border-2 border-emerald-400 hover:scale-[1.02]"
                  id="compress-download-btn"
                >
                  <Download className="h-7 w-7" />
                  DOWNLOAD COMPRESSED PDF
                </button>

                {/* Secondary actions */}
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      clearOutcome();
                      setCompressFile(null);
                    }}
                    className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-lg border border-zinc-300 bg-white hover:bg-zinc-50 text-zinc-700 font-semibold text-sm transition cursor-pointer"
                  >
                    <RefreshCw className="h-4 w-4" />
                    Compress Another
                  </button>
                  <button
                    onClick={() => openPdfInNewTab(outcomeUrl, outcomeName || 'compressed.pdf')}
                    className="flex-1 h-10 flex items-center justify-center gap-1.5 rounded-lg border border-indigo-300 bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-semibold text-sm transition cursor-pointer"
                  >
                    <Eye className="h-4 w-4" />
                    Open / Print PDF
                  </button>
                </div>

                <p className="text-center text-[10px] text-zinc-400 font-mono">
                  File: {outcomeName} · {(outcomeSize / 1024).toFixed(1)} KB · 100% RAM processed
                </p>
              </div>
            ) : (
              /* === BEFORE PROCESSING: SHOW COMPRESS FORM === */
              <>
                {!compressFile ? (
                  <div
                    onClick={() => compressInputRef.current?.click()}
                    className="flex flex-col items-center justify-center border border-dashed border-zinc-200 bg-zinc-50/40 hover:bg-zinc-50 rounded-xl py-12 text-center cursor-pointer group transition"
                  >
                    <Layers className="h-10 w-10 text-zinc-400 group-hover:text-indigo-650 transition" />
                    <h4 className="mt-3 text-xs font-bold text-zinc-700 uppercase tracking-wider font-mono">Upload PDF to Compress</h4>
                    <input
                      type="file"
                      ref={compressInputRef}
                      onChange={handleCompressUpload}
                      accept=".pdf"
                      className="hidden"
                    />
                  </div>
                ) : (
                  <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4">
                    <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-700" />
                        <div>
                          <p className="text-xs font-bold text-zinc-800">{compressFile.name}</p>
                          <p className="text-[10px] font-mono text-zinc-500">{(compressFile.size / 1024).toFixed(1)} KB</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCompressFile(null)}
                        className="text-xs font-medium text-rose-600 hover:underline"
                      >
                        Clear File
                      </button>
                    </div>

                    <div className="flex items-center gap-4 border-b border-zinc-100 pb-3">
                      <span className="text-xs font-semibold text-zinc-700">Mode:</span>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setUseTargetSize(false)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                            !useTargetSize
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-3xs'
                              : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          Use Presets
                        </button>
                        <button
                          type="button"
                          onClick={() => setUseTargetSize(true)}
                          className={`px-3 py-1.5 text-xs font-bold rounded-lg border transition cursor-pointer ${
                            useTargetSize
                              ? 'border-indigo-600 bg-indigo-50 text-indigo-950 shadow-3xs'
                              : 'border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50'
                          }`}
                        >
                          Target Specific Size
                        </button>
                      </div>
                    </div>

                    {useTargetSize ? (
                      <div className="space-y-3 bg-zinc-50/50 p-4 rounded-xl border border-zinc-200">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-bold text-zinc-800">Target File Size (KB)</label>
                          <span className="text-xs font-black font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                            {targetSizeKb} KB ({(targetSizeKb / 1024).toFixed(2)} MB)
                          </span>
                        </div>
                        
                        <input
                          type="range"
                          min="100"
                          max="2000"
                          step="50"
                          value={targetSizeKb}
                          onChange={(e) => setTargetSizeKb(parseInt(e.target.value))}
                          className="w-full h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-indigo-700"
                        />
                        
                        <div className="flex justify-between text-[9px] text-zinc-400 font-mono">
                          <span>100 KB</span>
                          <span>500 KB</span>
                          <span>1.0 MB</span>
                          <span>1.5 MB</span>
                          <span>2.0 MB</span>
                        </div>

                        <p className="text-[10px] text-zinc-500 leading-normal">
                          The engine will dynamically downscale the PDF if it is larger than the target, or upscale and add safe binary padding if it is smaller, approaching your target size as closely as possible.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className="text-xs font-semibold text-zinc-700">Select Compression Level</label>
                        <div className="grid gap-3 sm:grid-cols-3">
                          {[
                            { id: 'high', label: 'High Compression', desc: 'Smallest size, lower quality (0.4x quality, 1.0x scale)' },
                            { id: 'medium', label: 'Medium (Balanced)', desc: 'Optimized size & good quality (0.6x quality, 1.2x scale)' },
                            { id: 'low', label: 'Low Compression', desc: 'Larger size, best quality (0.8x quality, 1.5x scale)' }
                          ].map((preset) => (
                            <div
                              key={preset.id}
                              onClick={() => setCompressionPreset(preset.id as any)}
                              className={`p-3 rounded-lg border text-left cursor-pointer transition flex flex-col justify-between ${
                                compressionPreset === preset.id
                                  ? 'border-indigo-600 bg-indigo-50/20'
                                  : 'border-zinc-200 hover:border-zinc-300 bg-white'
                              }`}
                            >
                              <span className="text-xs font-bold text-zinc-900">{preset.label}</span>
                              <span className="text-[10px] text-zinc-500 leading-snug mt-1">{preset.desc}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 flex gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="text-[10px] text-amber-800 leading-relaxed">
                        <span className="font-semibold">Note:</span> Client-side compression flattens pages into optimized images. Selectable/searchable text in the PDF will be flattened. The process runs 100% in your browser's memory.
                      </div>
                    </div>

                    <button
                      onClick={handleCompressSubmit}
                      disabled={isProcessing}
                      className="w-full h-10 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-800 hover:bg-indigo-700 text-white font-semibold text-sm transition shadow-2xs cursor-pointer"
                    >
                      {isProcessing ? compressionProgressMsg || 'Compressing PDF in RAM...' : 'Process PDF'}
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* COMPREHENSIVE OUTCOME PREVIEW PANEL */}
        {outcomeUrl && (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-5 space-y-3 animate-fadeIn" id="pdf-outcome-card">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-800">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-emerald-950 uppercase tracking-wider font-mono">
                  PDF Processed Successfully (RAM Only)
                </h4>
                <p className="text-[11px] text-emerald-800 mt-0.5">
                  Size: <strong className="font-semibold">{(outcomeSize / 1024).toFixed(1)} KB</strong> · Struct optimized
                  {activeTab === 'compress' && compressFile && (
                    <span className="ml-2 rounded-full bg-emerald-100 text-emerald-800 px-2 py-0.5 text-[9px] font-bold">
                      {outcomeSize < compressFile.size
                        ? `Saved ${Math.round(((compressFile.size - outcomeSize) / compressFile.size) * 100)}% of file size!`
                        : `Adjusted size: +${Math.round(((outcomeSize - compressFile.size) / compressFile.size) * 100)}% (Upscaled/Padded to target)`}
                    </span>
                  )}
                </p>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleDownload}
                className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs transition shadow-2xs"
              >
                <Download className="h-3.5 w-3.5" /> Download Result PDF
              </button>
              <button
                onClick={() => openPdfInNewTab(outcomeUrl, outcomeName || 'document.pdf')}
                className="flex-1 flex h-9 items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-800 text-xs font-semibold transition"
              >
                <Eye className="h-3.5 w-3.5" /> Open / Print
              </button>
              <button
                onClick={clearOutcome}
                className="px-3 rounded-lg border border-emerald-200 bg-white hover:bg-emerald-100 text-emerald-800 text-xs font-semibold transition"
              >
                Reset
              </button>
            </div>
          </div>
        )}

        {/* GENERATED FILES HISTORY */}
        {generatedFiles.length > 0 && (
          <div className="rounded-xl border border-zinc-200 bg-white p-5 space-y-4 shadow-3xs" id="pdf-generated-files">
            <div className="flex items-center justify-between border-b border-zinc-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-zinc-900">Processed & Compressed PDFs</h3>
                <p className="text-[10px] text-zinc-500 mt-0.5">Your generated files during this session.</p>
              </div>
              <button
                onClick={() => {
                  generatedFiles.forEach((file, idx) => {
                    setTimeout(() => {
                      downloadFileFromDataUrl(file.dataUrl, file.name);
                    }, idx * 300);
                  });
                }}
                className="flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 px-3 py-1.5 text-xs font-semibold transition"
              >
                <Download className="h-3.5 w-3.5" /> Download All
              </button>
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
              {generatedFiles.map((file) => (
                <div key={file.id} className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 p-3 hover:border-indigo-300 transition">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded bg-indigo-100 text-indigo-700">
                      <FileText className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-zinc-800 truncate">{file.name}</p>
                      <p className="text-[10px] text-zinc-500 font-mono mt-0.5">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      onClick={() => openPdfInNewTab(file.dataUrl, file.name)}
                      className="flex items-center gap-1 rounded-lg border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 px-2.5 py-1.5 text-xs font-semibold transition"
                    >
                      <Eye className="h-3.5 w-3.5" /> Open
                    </button>
                    <button
                      onClick={() => downloadFileFromDataUrl(file.dataUrl, file.name)}
                      className="flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 text-xs font-semibold transition shadow-sm"
                    >
                      <Download className="h-3.5 w-3.5" /> Download
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <ProcessingProgress 
        isProcessing={isProcessing} 
        type={activeTab === 'images-to-pdf' ? 'pdf-images' : activeTab === 'merge' ? 'pdf-merge' : activeTab === 'split' ? 'pdf-split' : 'pdf-rotate'} 
      />
    </div>
  );
}
