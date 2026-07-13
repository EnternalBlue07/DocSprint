import React, { useState, useEffect } from 'react';
import { Trash2, ShieldCheck, Info, X, ChevronDown, ChevronUp } from 'lucide-react';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error' | 'delete';
  fileName?: string;
  explainer?: string;
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onRemove: (id: string) => void;
}

export default function ToastContainer({ toasts, onRemove }: ToastContainerProps) {
  return (
    <div
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 z-[200] flex flex-col gap-3 pointer-events-none max-w-sm w-full mx-auto sm:mx-0"
      id="global-toast-container"
    >
      {toasts.map((toast) => (
        <ToastCard key={toast.id} toast={toast} onRemove={onRemove} />
      ))}
    </div>
  );
}

function ToastCard({ toast, onRemove }: { toast: ToastMessage; onRemove: (id: string) => void }) {
  const [expanded, setExpanded] = useState(false);

  // Auto remove after 5.5 seconds (gives time for slide up and reading)
  useEffect(() => {
    const timer = setTimeout(() => {
      onRemove(toast.id);
    }, 5500);
    return () => clearTimeout(timer);
  }, [toast.id, onRemove]);

  const isDelete = toast.type === 'delete';

  return (
    <div
      className={`pointer-events-auto w-full rounded-2xl border bg-white dark:bg-zinc-100 shadow-2xl p-4 flex flex-col gap-2.5 transition-all duration-200 ease-out translate-y-0 animate-slideUp border-zinc-200 dark:border-zinc-800`}
      role="alert"
      id={`toast-message-${toast.id}`}
    >
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
          isDelete 
            ? 'bg-rose-50 text-rose-600 dark:bg-rose-950 dark:text-rose-400' 
            : 'bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400'
        }`}>
          {isDelete ? <Trash2 className="h-4.5 w-4.5" /> : <ShieldCheck className="h-4.5 w-4.5" />}
        </div>

        {/* Message */}
        <div className="flex-1 min-w-0 pt-0.5">
          <p className="text-xs font-extrabold text-zinc-900 leading-snug">
            {toast.message}
          </p>
          {toast.fileName && (
            <p className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
              File: {toast.fileName}
            </p>
          )}
        </div>

        {/* Close Button */}
        <button
          onClick={() => onRemove(toast.id)}
          className="text-zinc-400 hover:text-zinc-600 p-0.5 rounded-lg transition shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Trust Explainer */}
      {isDelete && (
        <div className="border-t border-zinc-100 dark:border-zinc-800 pt-2 flex flex-col gap-1.5">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1 text-[10px] font-bold text-indigo-700 hover:text-indigo-800 tracking-wide font-mono self-start uppercase cursor-pointer"
          >
            <Info className="h-3 w-3" />
            {expanded ? 'Hide Security Details' : 'Verify Security Audit'}
            {expanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
          </button>
          {expanded && (
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed font-semibold animate-fadeIn bg-zinc-50 dark:bg-zinc-900/50 p-2.5 rounded-lg border border-zinc-200/50 dark:border-zinc-800">
              {toast.explainer ?? "This document was compressed and processed entirely inside browser memory (RAM). The original unoptimized data buffer has been shredded and purged from active browser scope."}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
