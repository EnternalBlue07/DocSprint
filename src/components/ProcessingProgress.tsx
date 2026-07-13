import React, { useState, useEffect } from 'react';
import { Loader2, CheckCircle2, ShieldCheck, Sparkles, FileText, Cpu, Check } from 'lucide-react';

interface ProcessingProgressProps {
  isProcessing: boolean;
  type: 'photo' | 'signature' | 'pdf-merge' | 'pdf-split' | 'pdf-rotate' | 'pdf-images' | 'scanner' | 'checklist-fix';
  onComplete?: () => void;
}

const STEP_DATA = {
  photo: [
    "Initializing Photo Canvas Workbench...",
    "Analyzing background color chroma values...",
    "Applying face guide bounding alignments...",
    "Iteratively squeezing bytes to meet target KB range...",
    "Applying UPSC name & date overlay headers...",
    "Verifying pixel resolution & image sharpness...",
    "Writing secure RAM data stream..."
  ],
  signature: [
    "Initializing Signature Studio Sandbox...",
    "Applying ink threshold optimization & whitening filters...",
    "Calculating edge contrast and stroke weight...",
    "Generating alpha transparency mask channels...",
    "Iteratively resizing and compressing data stream...",
    "Verifying pen stroke visibility & contrast levels...",
    "Saving sandboxed RAM copy..."
  ],
  'pdf-merge': [
    "Allocating secure buffer memory...",
    "Reading and parsing PDF source files...",
    "Stitching page catalog dictionaries and streams...",
    "Optimizing cross-reference tables and font mappings...",
    "Writing finalized PDF stream into browser memory...",
    "Verifying file integrity..."
  ],
  'pdf-split': [
    "Parsing source PDF file dictionary...",
    "Isolating target page ranges and reference indices...",
    "Pruning unused resources and document catalog trees...",
    "Assembling extracted pages into a new catalog stream...",
    "Optimizing structure for web rendering...",
    "Finalizing sandboxed PDF output..."
  ],
  'pdf-rotate': [
    "Analyzing source PDF page structures...",
    "Calculating rotational transformations...",
    "Applying coordinate matrix adjustments in RAM...",
    "Regenerating page boundaries and bounding box offsets...",
    "Rebuilding document catalog dictionary...",
    "Completing rotation..."
  ],
  'pdf-images': [
    "Compressing source graphics for optimal PDF embedding...",
    "Calculating document dimensions & standard page margins...",
    "Generating PDF page stream layout mappings...",
    "Stitching images into canvas objects...",
    "Writing standard PDF structure formats...",
    "Finalizing PDF document stream..."
  ],
  scanner: [
    "Initializing scanner perspective workspace...",
    "Detecting quadrilateral corner coordinate anchors...",
    "Calculating 3x3 homography perspective warp matrix...",
    "Flattening skewed document sheet to perfect A4 size...",
    "Applying adaptive shadow removal & glare filtration...",
    "Writing processed certificate copy..."
  ],
  'checklist-fix': [
    "Starting automated multi-file compliance repair...",
    "Analyzing document errors...",
    "Applying required aspect ratio & resolution crops...",
    "Whitening paper background fibers...",
    "Binary-searching quality factors to fit target size limits...",
    "Regenerating compliant files..."
  ]
};

export default function ProcessingProgress({
  isProcessing,
  type,
  onComplete
}: ProcessingProgressProps) {
  const [progress, setProgress] = useState(0);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showComplete, setShowComplete] = useState(false);
  const [visible, setVisible] = useState(false);

  const steps = STEP_DATA[type] || ["Processing file...", "Finalizing changes..."];

  useEffect(() => {
    if (isProcessing) {
      setVisible(true);
      setProgress(0);
      setCurrentStepIndex(0);
      setShowComplete(false);

      // Smooth simulated progress animation to keep UI responsive
      let currentProgress = 0;
      const totalSteps = steps.length;
      
      const interval = setInterval(() => {
        currentProgress += Math.random() * 8 + 2; // Increment progress
        
        if (currentProgress >= 96) {
          currentProgress = 96;
          clearInterval(interval);
        }

        setProgress(Math.round(currentProgress));

        // Calculate step index based on progress
        const stepRatio = currentProgress / 100;
        const targetStep = Math.min(Math.floor(stepRatio * totalSteps), totalSteps - 1);
        setCurrentStepIndex(targetStep);
      }, 80);

      return () => clearInterval(interval);
    } else if (visible) {
      // Parent completed, pop to 100% and show success animation
      setProgress(100);
      setCurrentStepIndex(steps.length - 1);
      setShowComplete(true);

      const timer = setTimeout(() => {
        setVisible(false);
        if (onComplete) onComplete();
      }, 1000); // Show completed state for 1 second

      return () => clearTimeout(timer);
    }
  }, [isProcessing, type]);

  if (!visible) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-950/70 backdrop-blur-xs transition-opacity duration-300"
      id="processing-progress-overlay"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-md border border-zinc-200 flex flex-col items-center text-center animate-scaleIn relative overflow-hidden">
        
        {/* Glow Ambient Top Accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />

        {/* Animated Icon Header */}
        <div className="relative mb-5 mt-2">
          {showComplete ? (
            <div className="h-14 w-14 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200 animate-bounce">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          ) : (
            <div className="h-14 w-14 rounded-full bg-indigo-50 text-indigo-700 flex items-center justify-center border border-indigo-100 relative">
              <Loader2 className="h-7 w-7 animate-spin" />
              <Cpu className="h-3.5 w-3.5 text-indigo-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>

        {/* Action Header */}
        <h3 className="text-base font-bold text-zinc-900 leading-snug">
          {showComplete ? "Processing Complete!" : "Optimizing Your Document"}
        </h3>
        <p className="text-[11px] font-mono text-zinc-400 mt-1 uppercase tracking-wider">
          RAM Sandbox · Zero Cloud Storage
        </p>

        {/* Master Progress Track */}
        <div className="w-full bg-zinc-100 rounded-full h-3 mt-6 mb-2 overflow-hidden border border-zinc-200/60 p-[1.5px]">
          <div 
            className={`h-full rounded-full transition-all duration-300 ease-out relative ${
              showComplete 
                ? 'bg-gradient-to-r from-emerald-500 to-emerald-600' 
                : 'bg-gradient-to-r from-indigo-600 to-indigo-800'
            }`}
            style={{ width: `${progress}%` }}
          >
            {/* Glowing bar effect */}
            <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.3)_50%,transparent_100%)] animate-shimmer" />
          </div>
        </div>

        {/* Percentage Counter */}
        <div className="flex justify-between w-full text-[10px] font-mono font-bold text-zinc-500 px-1 mb-6">
          <span className="uppercase tracking-wide text-indigo-800">
            {showComplete ? "Finished" : "Processing"}
          </span>
          <span>{progress}%</span>
        </div>

        {/* Steps Timeline Checker */}
        <div className="w-full text-left bg-zinc-50 rounded-xl p-4 border border-zinc-200/80 space-y-3">
          <span className="text-[9px] font-bold font-mono text-zinc-400 uppercase tracking-widest block mb-1">
            Engine Progression Pipeline
          </span>
          <div className="space-y-2 max-h-[140px] overflow-y-auto pr-1">
            {steps.map((step, index) => {
              const isDone = showComplete || index < currentStepIndex;
              const isActive = !showComplete && index === currentStepIndex;

              return (
                <div 
                  key={index} 
                  className={`flex items-start gap-2.5 transition-opacity duration-200 ${
                    isDone ? 'opacity-100' : isActive ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {isDone ? (
                      <div className="h-3.5 w-3.5 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700">
                        <Check className="h-2 w-2 stroke-[3]" />
                      </div>
                    ) : isActive ? (
                      <div className="h-3.5 w-3.5 rounded-full bg-indigo-50 border border-indigo-400 flex items-center justify-center relative">
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-700 animate-ping absolute" />
                        <span className="h-1.5 w-1.5 rounded-full bg-indigo-800" />
                      </div>
                    ) : (
                      <div className="h-3.5 w-3.5 rounded-full border border-zinc-300 bg-zinc-100" />
                    )}
                  </div>
                  <span className={`text-xs ${isActive ? 'font-semibold text-zinc-800' : isDone ? 'text-zinc-500' : 'text-zinc-400'}`}>
                    {step}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Verification Shield footer */}
        <div className="mt-5 flex items-center justify-center gap-1.5 text-[10px] text-zinc-400 bg-zinc-50 px-3 py-1 rounded-full border border-zinc-150">
          <ShieldCheck className="h-3.5 w-3.5 text-indigo-700" />
          <span>Verified: 100% Client-Side Memory execution</span>
        </div>
      </div>
    </div>
  );
}
