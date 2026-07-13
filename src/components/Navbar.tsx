import React from 'react';
import { Shield, Clock, RotateCcw, Zap, Sun, Moon, Sparkles, ChevronDown } from 'lucide-react';
import { ApplicationProfile } from '../types';

interface NavbarProps {
  activeProfile: ApplicationProfile | null;
  onSelectProfile: (profile: ApplicationProfile | null) => void;
  onWipeSession: () => void;
  onPanic: () => void;
  sessionTimeRemaining: number;
  resetTimer: () => void;
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onToggleProfileSwitcher: () => void;
  activeStudio: 'home' | 'photo' | 'signature' | 'pdf' | 'document' | 'privacy' | 'batch' | 'examkit' | 'playbook';
}

export default function Navbar({
  activeProfile,
  onSelectProfile,
  onWipeSession,
  onPanic,
  sessionTimeRemaining,
  resetTimer,
  isDarkMode,
  onToggleDarkMode,
  onToggleProfileSwitcher,
  activeStudio,
}: NavbarProps) {
  const [activeProfileId, setActiveProfileId] = React.useState(activeProfile?.id || null);
  const [isFading, setIsFading] = React.useState(false);

  React.useEffect(() => {
    if (activeProfile?.id !== activeProfileId) {
      setIsFading(true);
      const t = setTimeout(() => {
        setActiveProfileId(activeProfile?.id || null);
        setIsFading(false);
      }, 150);
      return () => clearTimeout(t);
    }
  }, [activeProfile?.id, activeProfileId]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const isLowTime = sessionTimeRemaining < 120;
  const isStudioContext = ['photo', 'signature', 'pdf', 'document'].includes(activeStudio);

  const getActiveSpecLabel = () => {
    if (!activeProfile) return null;
    const docTypeMap: Record<string, string> = {
      photo: 'photo',
      signature: 'signature',
      pdf: 'pdf',
      document: 'document',
    };
    const docType = docTypeMap[activeStudio];
    if (!docType) return null;

    const doc = activeProfile.documents.find((d) => d.type === docType);
    if (!doc) return null;

    const parts: string[] = [];
    if (doc.spec.widthMm && doc.spec.heightMm) {
      parts.push(`${(doc.spec.widthMm / 10).toFixed(1)}×${(doc.spec.heightMm / 10).toFixed(1)}cm`);
    } else if (doc.spec.widthPx && doc.spec.heightPx) {
      parts.push(`${doc.spec.widthPx}×${doc.spec.heightPx}px`);
    }
    
    parts.push(`${doc.spec.minKb}–${doc.spec.maxKb}KB`);
    
    if (doc.spec.formats && doc.spec.formats.length > 0) {
      const formatLabels = doc.spec.formats.map((f) => f.split('/')[1]?.toUpperCase() || f);
      parts.push(formatLabels.join('/'));
    }

    return {
      title: doc.name,
      specString: parts.join(' · '),
    };
  };

  const specLabel = getActiveSpecLabel();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-zinc-200/50 dark:border-zinc-800/50 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md transition-colors duration-300" id="navbar">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8 gap-3">

        {/* Brand Logo */}
        <div
          className="flex items-center gap-3 cursor-pointer flex-shrink-0 group"
          onClick={() => onSelectProfile(null)}
          id="brand-logo"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-700 to-violet-600 text-white shadow-md shadow-indigo-500/20 group-hover:shadow-indigo-500/40 group-hover:scale-105 transition-all duration-300">
            <Shield className="h-5 w-5" />
          </div>
          <div className="hidden sm:block">
            <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-white font-heading">
              Doc<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500 dark:from-indigo-400 dark:to-violet-400">Sprint</span>
            </span>
            <div className="text-[9px] text-zinc-500 font-bold font-mono flex items-center gap-1 tracking-wider mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
              ZERO-RETENTION
            </div>
          </div>
        </div>

        {/* Active Profile Spec Pill (center, persistent on all breakpoints when inside studio) */}
        <div className="flex-1 flex justify-center items-center px-2">
          {isStudioContext && (
            <div
              onClick={onToggleProfileSwitcher}
              className="flex items-center gap-2 rounded-full border border-indigo-200/60 dark:border-indigo-800/60 bg-indigo-50/40 dark:bg-indigo-950/20 px-4 py-1.5 text-xs text-indigo-950 dark:text-indigo-200 font-semibold cursor-pointer hover:bg-indigo-100/50 dark:hover:bg-indigo-950/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/5 hover:border-indigo-400/50 overflow-hidden max-w-xs md:max-w-md"
              id="active-profile-pill"
            >
              <div className={`flex items-center gap-2 transition-opacity duration-150 ${isFading ? 'opacity-0' : 'opacity-100'}`}>
                <Sparkles className="h-3.5 w-3.5 text-indigo-650 dark:text-indigo-400 animate-float" />
                {activeProfile ? (
                  <div className="flex items-center gap-1.5">
                    <span className="hidden md:inline text-zinc-450 font-normal">Profile:</span>
                    <strong className="font-extrabold text-zinc-900 dark:text-white">{activeProfile.name}</strong>
                    {specLabel && (
                      <span className="text-[10px] font-extrabold font-mono px-2 py-0.5 bg-indigo-100/70 dark:bg-indigo-900/60 rounded text-indigo-700 dark:text-indigo-300">
                        {specLabel.specString}
                      </span>
                    )}
                  </div>
                ) : (
                  <span className="font-extrabold text-zinc-900 dark:text-white">Custom Mode (No Rules Profile)</span>
                )}
                <ChevronDown className="h-3.5 w-3.5 text-zinc-450" />
              </div>
            </div>
          )}
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* Theme Toggle Button */}
          <button
            onClick={onToggleDarkMode}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:border-indigo-400/50 text-zinc-500 dark:text-zinc-400 transition-all duration-300 cursor-pointer hover:shadow-sm"
            title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            id="theme-toggle-btn"
          >
            {isDarkMode ? <Sun className="h-4.5 w-4.5 text-amber-500 animate-spin-slow" /> : <Moon className="h-4.5 w-4.5" />}
          </button>

          {/* Timer Badge */}
          <div
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-mono font-bold shadow-2xs transition-all duration-300 ${
              isLowTime
                ? 'border-rose-200 bg-rose-50/80 text-rose-700 dark:border-rose-800/80 dark:bg-rose-950/20 dark:text-rose-400 animate-pulse'
                : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 text-zinc-700 dark:text-zinc-300'
            }`}
            title="Time remaining before auto-wipe"
            id="session-timer-badge"
          >
            <Clock className={`h-3.5 w-3.5 ${isLowTime ? 'text-rose-600 dark:text-rose-455' : 'text-zinc-500'}`} />
            <span className="hidden lg:inline text-zinc-400 font-normal">RAM: </span>
            <span>{formatTime(sessionTimeRemaining)}</span>
          </div>

          {/* Wipe RAM Button */}
          <button
            onClick={onWipeSession}
            className="flex h-9 items-center gap-1.5 rounded-lg border border-rose-200/80 dark:border-rose-800/80 bg-rose-50/60 dark:bg-rose-950/20 px-3.5 text-xs font-semibold text-rose-750 dark:text-rose-300 hover:bg-rose-100/60 dark:hover:bg-rose-950/40 hover:border-rose-300/80 active:bg-rose-200 transition-all duration-300 shadow-2xs cursor-pointer"
            title="Clear all session files from browser memory"
            id="wipe-session-btn"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Wipe RAM</span>
          </button>

          {/* ⚡ PANIC BUTTON — always visible, always accessible */}
          <button
            onClick={onPanic}
            className="flex h-9 items-center gap-1.5 rounded-lg border-2 border-red-650 bg-red-600 px-3.5 text-xs font-extrabold text-white hover:bg-red-700 hover:border-red-700 active:scale-95 transition-all duration-300 shadow-md shadow-red-500/20 hover:shadow-lg hover:shadow-red-500/35 cursor-pointer"
            title="PANIC: Instantly wipe ALL session data and return to home"
            id="panic-button"
          >
            <Zap className="h-3.5 w-3.5" />
            <span className="tracking-wide">PANIC</span>
          </button>
        </div>
      </div>
    </header>
  );
}
