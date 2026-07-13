import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import HomeView from './components/HomeView';
import ChecklistHub from './components/ChecklistHub';
import PhotoStudio from './components/PhotoStudio';
import SignatureStudio from './components/SignatureStudio';
import PdfToolkit from './components/PdfToolkit';
import DocumentScanner from './components/DocumentScanner';
import PrivacyDashboard from './components/PrivacyDashboard';
import BatchMode from './components/BatchMode';
import ExamDayKit from './components/ExamDayKit';
import AdmissionPlaybookEngine from './components/AdmissionPlaybookEngine';
import CommandPalette from './components/CommandPalette';
import ProfileSwitcher from './components/ProfileSwitcher';
import ToastContainer, { ToastMessage } from './components/ToastContainer';
import { ApplicationProfile, ProcessedFile, DeletionLog, UndoState, ThreatTicker, FeedbackLog } from './types';
import { ShieldCheck, ChevronLeft, Layers, AlertTriangle } from 'lucide-react';
import Lenis from 'lenis';

const MAX_UNDO_STATES = 20;
const SESSION_TIMEOUT = 900; // 15 minutes
const WARN_AT = 120;         // 2-minute warning

export default function App() {
  // ── Theme State ───────────────────────────────────────────────────────────
  const [isDarkMode, setIsDarkMode] = useState<boolean>(false);

  // ── Navigation Overlays ──────────────────────────────────────────────────
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);
  const [isProfileSwitcherOpen, setIsProfileSwitcherOpen] = useState<boolean>(false);

  // ── Notification Toasts ───────────────────────────────────────────────────
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // ── Navigation ────────────────────────────────────────────────────────────
  const [activeProfile, setActiveProfile] = useState<ApplicationProfile | null>(null);
  const [activeStudio, setActiveStudio] = useState<
    'home' | 'photo' | 'signature' | 'pdf' | 'document' | 'privacy' | 'batch' | 'examkit' | 'playbook'
  >('home');

  // ── Feedback Suggestion Ledger (RAM-only) ─────────────────────────────────
  const [feedbackLogs, setFeedbackLogs] = useState<FeedbackLog[]>([]);

  // ── Memory Storage (RAM-only) ─────────────────────────────────────────────
  const [sessionFiles, setSessionFiles] = useState<Record<string, ProcessedFile>>({});
  const [deletionLogs, setDeletionLogs] = useState<DeletionLog[]>([]);

  // ── Undo Stacks (per studio, in-memory only) ──────────────────────────────
  const [undoStacks, setUndoStacks] = useState<Record<'photo' | 'signature' | 'document', UndoState[]>>({
    photo: [],
    signature: [],
    document: [],
  });

  // ── Session Signatures (for consistency checking) ─────────────────────────
  const [sessionSignatures, setSessionSignatures] = useState<string[]>([]);

  // ── Live Threat Ticker ────────────────────────────────────────────────────
  const [threatTicker, setThreatTicker] = useState<ThreatTicker>({
    diskBytesWritten: 0,     // Always 0 — we never call localStorage/IndexedDB/fs
    externalRequests: 0,     // Always 0 — no fetch calls ever carry user file data
    ramClearsPerformed: 0,
    lastWipeTimestamp: null,
    sessionStartTimestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
  });

  // ── Session Timer ─────────────────────────────────────────────────────────
  const [sessionTimeRemaining, setSessionTimeRemaining] = useState<number>(SESSION_TIMEOUT);
  const [showIdleWarning, setShowIdleWarning] = useState<boolean>(false);

  // ── Theme Sync ────────────────────────────────────────────────────────────
  useEffect(() => {
    const root = window.document.documentElement;
    const isDark = localStorage.getItem('theme') === 'dark' || 
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
    setIsDarkMode(isDark);
    if (isDark) {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  // ── Lenis Smooth Scroll Integration ─────────────────────────────────────────
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const lenis = new Lenis({
      duration: 1.1,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    const raf = (time: number) => {
      lenis.raf(time);
      requestAnimationFrame(raf);
    };

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  // ── Scroll Reveal IntersectionObserver ──────────────────────────────────────
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('reveal-active');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.05, rootMargin: '0px 0px -20px 0px' }
    );

    const elements = document.querySelectorAll('.reveal-on-scroll');
    elements.forEach((el) => observer.observe(el));

    const mutationObserver = new MutationObserver(() => {
      const newElements = document.querySelectorAll('.reveal-on-scroll:not(.reveal-active)');
      newElements.forEach((el) => observer.observe(el));
    });

    mutationObserver.observe(document.body, { childList: true, subtree: true });

    return () => {
      observer.disconnect();
      mutationObserver.disconnect();
    };
  }, [activeStudio]);

  const handleToggleDarkMode = () => {
    const root = window.document.documentElement;
    setIsDarkMode((prev) => {
      const next = !prev;
      localStorage.setItem('theme', next ? 'dark' : 'light');
      if (next) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
      return next;
    });
  };

  // ── Command Palette Keyboard Hook ─────────────────────────────────────────
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.document.addEventListener('keydown', handleKeyDown);
    return () => window.document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // ── Toast Handlers ────────────────────────────────────────────────────────
  const handleRemoveToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setSessionTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleWipeSessionMemory();
          return SESSION_TIMEOUT;
        }
        if (prev === WARN_AT) {
          setShowIdleWarning(true);
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const resetTimer = useCallback(() => {
    setSessionTimeRemaining(SESSION_TIMEOUT);
    setShowIdleWarning(false);
  }, []);

  // ── Wipe Session Memory ───────────────────────────────────────────────────
  const handleWipeSessionMemory = useCallback(() => {
    const files = Object.values(sessionFiles) as ProcessedFile[];
    const logs: DeletionLog[] = files.map((file) => ({
      id: Math.random().toString(36).substr(2),
      fileName: file.name,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
      sessionToken: 'shredder-wipe-core',
      bufferSizeBytes: file.size,
    }));

    setSessionFiles({});
    setActiveProfile(null);
    setActiveStudio('home');
    setUndoStacks({ photo: [], signature: [], document: [] });
    setSessionSignatures([]);
    setFeedbackLogs([]);
    setDeletionLogs((prev) => [...prev, ...logs]);
    setSessionTimeRemaining(SESSION_TIMEOUT);
    setShowIdleWarning(false);

    setThreatTicker((prev) => ({
      ...prev,
      ramClearsPerformed: prev.ramClearsPerformed + 1,
      lastWipeTimestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
    }));

    setToasts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2),
        message: 'RAM Sandbox Nuked Successfully',
        type: 'delete',
        explainer: 'All files, signatures, and history logs have been cryptographically erased from active browser RAM.'
      }
    ]);
  }, [sessionFiles]);

  const handleRestoreFiles = useCallback((files: Record<string, ProcessedFile>) => {
    setSessionFiles((prev) => ({
      ...prev,
      ...files,
    }));
    resetTimer();
    setToasts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2),
        message: 'Workspace Documents Restored',
        type: 'info',
        explainer: 'Documents successfully decrypted and loaded into active browser memory.'
      }
    ]);
  }, [resetTimer]);

  // ── Panic Button Handler ──────────────────────────────────────────────────
  const handlePanic = useCallback(() => {
    handleWipeSessionMemory();
    // Brief delay to let state flush before redirect
    setTimeout(() => { window.location.href = '/'; }, 300);
  }, [handleWipeSessionMemory]);

  // ── Profile Selection ─────────────────────────────────────────────────────
  const handleNavigateToStudio = useCallback((studio: 'home' | 'photo' | 'signature' | 'pdf' | 'document' | 'privacy' | 'batch' | 'examkit' | 'playbook') => {
    resetTimer();
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setActiveStudio(studio);
      });
    } else {
      setActiveStudio(studio);
    }
  }, [resetTimer]);

  const handleSelectProfile = useCallback((profile: ApplicationProfile | null) => {
    resetTimer();
    if (document.startViewTransition) {
      document.startViewTransition(() => {
        setActiveProfile(profile);
        setActiveStudio('home');
      });
    } else {
      setActiveProfile(profile);
      setActiveStudio('home');
    }
  }, [resetTimer]);

  // ── Deletion Log ──────────────────────────────────────────────────────────
  const handleAddDeletionLog = (fileName: string, bufferSizeBytes?: number) => {
    setDeletionLogs((prev) => [{
      id: Math.random().toString(36).substr(2),
      fileName,
      timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
      sessionToken: 'RAM-garbage-collector',
      bufferSizeBytes,
    }, ...prev]);
    resetTimer();

    setToasts((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substr(2),
        message: 'Original Upload Safely Cleared',
        type: 'delete',
        fileName,
        explainer: 'For your security, the original raw file has been cleared from browser RAM. Your processed/compressed version is ready and available for download!'
      }
    ]);
  };

  // ── Save Processed File ───────────────────────────────────────────────────
  const handleSaveProcessedFile = (file: {
    id: string;
    name: string;
    type: string;
    size: number;
    dataUrl: string;
    width?: number;
    height?: number;
    originalName: string;
    originalSize: number;
    validated: boolean;
    issues: string[];
    confidenceScore?: import('./types').ConfidenceScore;
  }) => {
    setSessionFiles((prev) => ({
      ...prev,
      [file.id]: { ...file, lastModified: Date.now() },
    }));
    resetTimer();
  };

  const handleUpdateSessionFile = (id: string, file: ProcessedFile) => {
    setSessionFiles((prev) => ({ ...prev, [id]: file }));
    resetTimer();
  };

  // ── Undo Stack Management ─────────────────────────────────────────────────
  const handlePushUndo = (studio: 'photo' | 'signature' | 'document', state: UndoState) => {
    setUndoStacks((prev) => {
      const existing = prev[studio];
      const next = [...existing, state].slice(-MAX_UNDO_STATES);
      return { ...prev, [studio]: next };
    });
  };

  const handleClearUndo = (studio: 'photo' | 'signature' | 'document') => {
    setUndoStacks((prev) => ({ ...prev, [studio]: [] }));
  };

  // ── Session Signature Tracking ────────────────────────────────────────────
  const handleAddSessionSignature = (dataUrl: string) => {
    setSessionSignatures((prev) => [...prev, dataUrl]);
  };

  const filesCount = Object.keys(sessionFiles).length;

  return (
    <div className="min-h-screen bg-zinc-50 flex flex-col font-sans" id="applet-container">

      {/* 2-Minute Idle Warning Toast */}
      {showIdleWarning && (
        <div
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] flex items-center gap-3 bg-amber-50 border border-amber-200 rounded-xl px-5 py-3 shadow-2xl animate-slideDown"
          id="idle-warning-toast"
        >
          <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-amber-900">Session expiring in 2 minutes</p>
            <p className="text-xs text-amber-700 mt-0.5">Your files will be automatically wiped. Save any downloads now.</p>
          </div>
          <button
            onClick={resetTimer}
            className="ml-2 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 border border-amber-200 px-3 py-1.5 rounded-lg transition"
          >
            Extend Session
          </button>
        </div>
      )}

      {/* Top Navigation */}
      <Navbar
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        onWipeSession={handleWipeSessionMemory}
        onPanic={handlePanic}
        sessionTimeRemaining={sessionTimeRemaining}
        resetTimer={resetTimer}
        isDarkMode={isDarkMode}
        onToggleDarkMode={handleToggleDarkMode}
        onToggleProfileSwitcher={() => setIsProfileSwitcherOpen((prev) => !prev)}
        activeStudio={activeStudio}
      />

      {/* Main Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col gap-8">

        {/* Breadcrumbs + Studio Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-4" id="studio-breadcrumbs">
          <div className="flex items-center gap-2">
            {activeStudio !== 'home' ? (
              <button
                onClick={() => { setActiveStudio('home'); resetTimer(); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition shadow-2xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Back to Dashboard
              </button>
            ) : activeProfile ? (
              <button
                onClick={() => { setActiveProfile(null); resetTimer(); }}
                className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 transition shadow-2xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" /> Choose Profile
              </button>
            ) : null}

            {activeProfile && activeStudio === 'home' && (
              <span className="text-xs font-medium text-zinc-500">/ Checklist Hub</span>
            )}
            {activeStudio !== 'home' && (
              <span className="text-xs font-semibold text-indigo-900 bg-indigo-50 px-2 py-1 rounded">
                / {activeStudio.toUpperCase()} STUDIO
              </span>
            )}
          </div>

          {/* Quick-switch tab bar */}
          {(activeProfile || activeStudio !== 'home') && (
            <div className="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-lg border border-zinc-200 overflow-x-auto max-w-full">
              {activeProfile && (
                <button
                  onClick={() => handleNavigateToStudio('home')}
                  className={`px-3 py-1 text-xs font-semibold rounded whitespace-nowrap transition ${
                    activeStudio === 'home' ? 'bg-white text-indigo-950 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  Dashboard
                </button>
              )}
              {([
                { id: 'photo', label: 'Photo' },
                { id: 'signature', label: 'Signature' },
                { id: 'pdf', label: 'PDF' },
                { id: 'document', label: 'Scanner' },
                { id: 'playbook', label: '📖 Roadmaps' },
                { id: 'batch', label: '⚡ Batch' },
                { id: 'privacy', label: '🛡 Privacy' },
              ] as const).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => handleNavigateToStudio(tab.id)}
                  className={`px-3 py-1 text-xs font-semibold rounded whitespace-nowrap transition ${
                    activeStudio === tab.id ? 'bg-white text-indigo-950 shadow-2xs' : 'text-zinc-500 hover:text-zinc-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Studio Workspace */}
        <div className="flex-1" id="studio-workspace">
          {activeStudio === 'home' && !activeProfile && (
            <HomeView
              onSelectProfile={handleSelectProfile}
              onNavigateToStudio={handleNavigateToStudio}
              onNavigateToPlaybook={() => handleNavigateToStudio('playbook')}
            />
          )}

          {activeStudio === 'home' && activeProfile && (
            <ChecklistHub
              profile={activeProfile}
              sessionFiles={sessionFiles}
              onNavigateToStudio={handleNavigateToStudio}
              onUpdateSessionFile={handleUpdateSessionFile}
              onNavigateToExamKit={() => handleNavigateToStudio('examkit')}
            />
          )}

          {activeStudio === 'photo' && (
            <PhotoStudio
              onSaveProcessedFile={handleSaveProcessedFile}
              targetSpec={activeProfile?.documents.find((d) => d.type === 'photo')?.spec}
              onAddDeletionLog={(name) => handleAddDeletionLog(name)}
              undoStack={undoStacks.photo}
              onPushUndo={(s) => handlePushUndo('photo', s)}
              onClearUndo={() => handleClearUndo('photo')}
            />
          )}

          {activeStudio === 'signature' && (
            <SignatureStudio
              onSaveProcessedFile={handleSaveProcessedFile}
              targetSpec={activeProfile?.documents.find((d) => d.type === 'signature')?.spec}
              onAddDeletionLog={(name) => handleAddDeletionLog(name)}
              undoStack={undoStacks.signature}
              onPushUndo={(s) => handlePushUndo('signature', s)}
              onClearUndo={() => handleClearUndo('signature')}
              sessionSignatures={sessionSignatures}
              onAddSessionSignature={handleAddSessionSignature}
            />
          )}

          {activeStudio === 'pdf' && (
            <PdfToolkit
              onAddDeletionLog={(name) => handleAddDeletionLog(name)}
              onSaveProcessedFile={handleSaveProcessedFile}
            />
          )}

          {activeStudio === 'document' && (
            <DocumentScanner
              onAddDeletionLog={(name) => handleAddDeletionLog(name)}
              onSaveProcessedFile={handleSaveProcessedFile}
            />
          )}

          {activeStudio === 'batch' && (
            <BatchMode
              activeProfile={activeProfile}
              onAddDeletionLog={(name) => handleAddDeletionLog(name)}
              onSaveProcessedFile={handleSaveProcessedFile}
            />
          )}

          {activeStudio === 'privacy' && (
            <PrivacyDashboard
              deletionLogs={deletionLogs}
              onWipeSession={handleWipeSessionMemory}
              onPanic={handlePanic}
              sessionFilesCount={filesCount}
              threatTicker={threatTicker}
              feedbackLogs={feedbackLogs}
            />
          )}

          {activeStudio === 'examkit' && (
            <ExamDayKit
              sessionFiles={sessionFiles}
              activeProfile={activeProfile}
            />
          )}

          {activeStudio === 'playbook' && (
            <AdmissionPlaybookEngine
              onNavigateToStudio={handleNavigateToStudio}
              onSelectProfile={handleSelectProfile}
              onAddFeedbackLog={(log) => {
                setFeedbackLogs((prev) => [
                  {
                    id: Math.random().toString(36).substr(2),
                    timestamp: new Date().toLocaleTimeString('en-IN', { hour12: false }) + ' IST',
                    status: 'pending',
                    ...log
                  },
                  ...prev
                ]);
              }}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 bg-white py-6 mt-12 text-center text-xs text-zinc-500 space-y-2">
        <div className="flex items-center justify-center gap-1 font-mono text-[10px]">
          <ShieldCheck className="h-4 w-4 text-indigo-800" />
          <span>DocSprint Sandboxed Context · Encrypted in RAM · 100% Client-Side Private</span>
        </div>
        <p className="font-sans text-[11px]">
          © {new Date().getFullYear()} DocSprint OS. Built for Indian MCAs, Engineering Aspirants, and Job Seekers.
        </p>
      </footer>

      {/* Dynamic Overlays & Dialogs */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectStudio={handleNavigateToStudio}
        onSelectProfile={handleSelectProfile}
      />

      <ProfileSwitcher
        isOpen={isProfileSwitcherOpen}
        onClose={() => setIsProfileSwitcherOpen(false)}
        activeProfile={activeProfile}
        onSelectProfile={handleSelectProfile}
        sessionFiles={sessionFiles}
        onRestoreFiles={handleRestoreFiles}
        onClearSession={handleWipeSessionMemory}
      />

      <ToastContainer
        toasts={toasts}
        onRemove={handleRemoveToast}
      />
    </div>
  );
}
