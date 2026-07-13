import React from 'react';
import { UndoState } from '../types';
import { RotateCcw, History } from 'lucide-react';

interface UndoFilmstripProps {
  states: UndoState[];
  onRestore: (state: UndoState, index: number) => void;
  currentIndex?: number; // index of the "current" (latest) state — highlighted differently
}

/**
 * Horizontal scrollable filmstrip of undo states.
 * Each chip shows a thumbnail + label + timestamp.
 * Click any chip to restore that state.
 */
export default function UndoFilmstrip({ states, onRestore, currentIndex }: UndoFilmstripProps) {
  if (states.length === 0) return null;

  const currentIdx = currentIndex ?? states.length - 1;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const nextIdx = Math.max(0, currentIdx - 1);
      onRestore(states[nextIdx], nextIdx);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const nextIdx = Math.min(states.length - 1, currentIdx + 1);
      onRestore(states[nextIdx], nextIdx);
    }
  };

  return (
    <div
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-3 focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:outline-none"
      id="undo-filmstrip"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      role="toolbar"
      aria-label="Undo history state timeline"
    >
      <div className="flex items-center gap-2 mb-2.5">
        <History className="h-3.5 w-3.5 text-indigo-400" />
        <span className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-widest">
          Time Machine — {states.length} state{states.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-thumb-zinc-700 scrollbar-track-transparent">
        {states.map((state, idx) => {
          const isLatest = idx === currentIdx;
          return (
            <button
              key={`${state.timestamp}-${idx}`}
              onClick={() => onRestore(state, idx)}
              title={`Restore: ${state.label}`}
              tabIndex={-1} // Handled by container keyboard navigation
              className={`flex-shrink-0 group flex flex-col items-center gap-1.5 rounded-lg border p-1.5 transition-all duration-150 animate-slide-in ${
                isLatest
                  ? 'border-2 border-indigo-500 ring-2 ring-indigo-500/30 bg-indigo-950/60 shadow-[0_0_8px_rgba(99,102,241,0.4)]'
                  : 'border-zinc-750 bg-zinc-900 hover:border-zinc-500 hover:bg-zinc-800'
              }`}
              id={`undo-state-${idx}`}
            >
              {/* Thumbnail */}
              <div className="relative w-14 h-14 rounded overflow-hidden bg-zinc-800 border border-zinc-700">
                <img
                  src={state.thumbnailUrl}
                  alt={state.label}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
                {isLatest && (
                  <div className="absolute inset-0 bg-indigo-600/20 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-indigo-300 bg-indigo-900/80 px-1 py-0.5 rounded font-mono">NOW</span>
                  </div>
                )}
                {!isLatest && (
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 flex items-center justify-center transition-all">
                    <RotateCcw className="h-4 w-4 text-white opacity-0 group-hover:opacity-80 transition-all" />
                  </div>
                )}
              </div>

              {/* Label */}
              <span className={`text-[9px] font-mono max-w-[56px] truncate text-center ${
                isLatest ? 'text-indigo-300 font-bold' : 'text-zinc-500 group-hover:text-zinc-300'
              }`}>
                {state.label}
              </span>
            </button>
          );
        })}
      </div>

      {states.length > 1 && (
        <p className="text-[9px] text-zinc-650 font-mono mt-1.5 text-center">
          ← Focus and use Arrow Left / Right to travel back in history · stored in RAM only
        </p>
      )}
    </div>
  );
}
