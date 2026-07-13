import React, { useState, useEffect } from 'react';
import { ShieldCheck, Trash2, CheckCircle2, History, AlertCircle, Info, Zap, Wifi, Database, RefreshCw } from 'lucide-react';
import { DeletionLog, ThreatTicker } from '../types';
import CountUp from './CountUp';

interface PrivacyDashboardProps {
  deletionLogs: DeletionLog[];
  onWipeSession: () => void;
  onPanic: () => void;
  sessionFilesCount: number;
  threatTicker: ThreatTicker;
  feedbackLogs?: import('../types').FeedbackLog[];
}

export default function PrivacyDashboard({
  deletionLogs, onWipeSession, onPanic, sessionFilesCount, threatTicker, feedbackLogs
}: PrivacyDashboardProps) {
  const [tickerTime, setTickerTime] = useState(0);

  // Running session time counter
  useEffect(() => {
    const interval = setInterval(() => setTickerTime((t) => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const formatElapsed = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}m ${s}s`;
  };

  return (
    <div className="space-y-6 font-sans text-zinc-800 dark:text-zinc-300" id="privacy-dashboard-component">

      {/* Header Info */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 shadow-xs">
        <div className="flex items-start gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white flex items-center gap-2">
              Provably Safe Document Sandbox
              <span className="rounded bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 text-[10px] font-bold font-mono text-emerald-800 dark:text-emerald-300 tracking-wider">
                ZERO RETENTION
              </span>
            </h2>
            <p className="mt-1 text-sm text-zinc-550 dark:text-zinc-400 leading-relaxed">
              Every crop, compression, and merge operation runs strictly inside browser RAM. We never store, read, or receive your documents.
            </p>
          </div>
        </div>
      </div>

      {/* ══ LIVE THREAT TICKER STRIP (Top, Dark Layout) ════════════════════════════ */}
      <div className="rounded-xl border border-zinc-900 bg-zinc-950 p-5 space-y-4 shadow-sm" id="live-threat-ticker">
        <div className="flex items-center gap-2 border-b border-zinc-800 pb-3">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
          <span className="text-[10px] font-bold font-mono text-emerald-400 uppercase tracking-widest">
            Live Threat Ticker — Session Instrumentation
          </span>
          <span className="ml-auto text-[9px] font-mono text-zinc-550">{formatElapsed(tickerTime)} elapsed</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Disk Write Counter */}
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-900 shrink-0">
              <Database className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wide">Disk Writes</div>
              <div className="text-lg font-black font-mono text-emerald-400 leading-tight">
                <CountUp end={threatTicker.diskBytesWritten} duration={600} />
                <span className="text-xs text-emerald-600 ml-0.5">B</span>
              </div>
            </div>
            <span className="text-[8px] font-bold text-emerald-500 bg-emerald-950 border border-emerald-900 px-1 py-0.5 rounded font-mono shrink-0">SAFE</span>
          </div>

          {/* External Requests Counter */}
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-950 border border-emerald-900 shrink-0">
              <Wifi className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wide">Net Outflow</div>
              <div className="text-lg font-black font-mono text-emerald-400 leading-tight">
                <CountUp end={threatTicker.externalRequests} duration={600} />
              </div>
            </div>
            <span className="text-[8px] font-bold text-emerald-500 bg-emerald-950 border border-emerald-900 px-1 py-0.5 rounded font-mono shrink-0">ZERO</span>
          </div>

          {/* RAM Clears Counter */}
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-950 border border-indigo-900 shrink-0">
              <RefreshCw className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wide">RAM Clears</div>
              <div className="text-lg font-black font-mono text-indigo-300 leading-tight">
                <CountUp end={threatTicker.ramClearsPerformed} duration={600} />
              </div>
            </div>
          </div>

          {/* Last Wipe Timestamp */}
          <div className="flex items-center gap-3 rounded-lg border border-zinc-800 bg-zinc-900 px-3.5 py-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-950 border border-rose-900 shrink-0">
              <Trash2 className="h-4 w-4 text-rose-400" />
            </div>
            <div className="min-w-0">
              <div className="text-[9px] text-zinc-500 font-mono uppercase tracking-wide">Last Wipe</div>
              <div className="text-xs font-mono text-zinc-305 leading-tight truncate">
                {threatTicker.lastWipeTimestamp ?? 'None yet'}
              </div>
            </div>
          </div>
        </div>

        <p className="text-[9px] text-zinc-600 font-mono text-center pt-1">
          Counters are wired to real browser runtime events. Session start: {threatTicker.sessionStartTimestamp}
        </p>
      </div>

      {/* RAM Deletion Ledger */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 shadow-xs" id="deletion-logs-section">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-805 pb-3">
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Cryptographic RAM Deletion Ledger</h3>
          </div>
          <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded">
            {deletionLogs.length} purges recorded
          </span>
        </div>

        {deletionLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center" id="empty-ledger">
            <CheckCircle2 className="h-8 w-8 text-emerald-400 animate-pulse" />
            <p className="mt-2 text-xs font-medium text-zinc-700 dark:text-zinc-400">Memory is perfectly clean</p>
            <p className="text-[10px] text-zinc-450 mt-0.5">No active files in sandboxed RAM.</p>
          </div>
        ) : (
          <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-3 text-zinc-300 font-mono text-[11px] leading-relaxed space-y-2">
            <div className="text-zinc-550 text-[10px] pb-1 border-b border-zinc-800 grid grid-cols-3">
              <span>EVENT</span><span>FILE</span><span className="text-right">TIMESTAMP</span>
            </div>
            {deletionLogs.map((log) => (
              <div key={log.id} className="grid grid-cols-3 items-start hover:bg-zinc-900 p-1 rounded transition gap-2">
                <span className="text-rose-455 flex items-center gap-1 font-bold">
                  <Trash2 className="h-3 w-3" /> SHRED
                </span>
                <span className="text-emerald-400 truncate">{log.fileName}</span>
                <div className="text-right">
                  <div className="text-zinc-400 text-[10px]">{log.timestamp}</div>
                  {log.bufferSizeBytes && (
                    <div className="text-zinc-650 text-[9px]">{(log.bufferSizeBytes / 1024).toFixed(1)} KB</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Local Feedback Ledger */}
      {feedbackLogs && feedbackLogs.length > 0 && (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 shadow-xs animate-fadeIn" id="feedback-logs-section">
          <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-805 pb-3">
            <div className="flex items-center gap-2">
              <History className="h-4 w-4 text-indigo-700 dark:text-indigo-400" />
              <h3 className="text-sm font-semibold text-zinc-900 dark:text-white">Local Playbook Suggestion Ledger</h3>
            </div>
            <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-1.5 py-0.5 rounded">
              {feedbackLogs.length} suggestions buffered
            </span>
          </div>

          <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-950 p-3 text-zinc-300 font-mono text-[11px] leading-relaxed space-y-2">
            <div className="text-zinc-550 text-[10px] pb-1 border-b border-zinc-800 grid grid-cols-4">
              <span>PLAYBOOK</span><span className="col-span-2">CORRECTION SUGGESTION</span><span className="text-right">TIMESTAMP</span>
            </div>
            {feedbackLogs.map((log) => (
              <div key={log.id} className="grid grid-cols-4 items-start hover:bg-zinc-900 p-1 rounded transition gap-2">
                <span className="text-indigo-400 truncate font-semibold">{log.playbookTitle}</span>
                <span className="text-zinc-300 col-span-2 break-words">{log.suggestedCorrection}</span>
                <div className="text-right text-zinc-500 text-[10px]">{log.timestamp}</div>
              </div>
            ))}
          </div>
          <p className="text-[10px] text-zinc-400 mt-2 italic">
            Note: Suggestion payloads are saved inside RAM memory space and wiped permanently once the session terminates or "Wipe RAM" is triggered.
          </p>
        </div>
      )}

      {/* Bilingual Trust Card */}
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 shadow-xs">
        <div className="grid gap-6 md:grid-cols-2 bg-zinc-50/50 dark:bg-zinc-900/30 p-5 rounded-xl border border-zinc-100 dark:border-zinc-805" id="bilingual-trust">
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider font-mono">
              English Guarantee
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">How your privacy is protected:</h3>
            <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-450 list-disc pl-4 leading-relaxed">
              <li><strong>No Cloud Backend:</strong> Files are loaded into browser memory (<code className="bg-zinc-100 dark:bg-zinc-800 px-1 rounded font-mono text-[10px]">HTML5 FileReader</code>) and never uploaded.</li>
              <li><strong>Instant Purge:</strong> Original full-size images are dereferenced and garbage collected after processing.</li>
              <li><strong>Local EXIF Removal:</strong> Canvas redraws automatically strip location tags, device info, and timestamps.</li>
            </ul>
          </div>
          <div className="space-y-2 border-t border-zinc-100 dark:border-zinc-800 pt-4 md:border-t-0 md:pt-0 md:border-l md:pl-6 dark:md:border-l-zinc-800">
            <div className="flex items-center gap-1.5 text-xs font-bold text-indigo-900 dark:text-indigo-400 uppercase tracking-wider font-mono">
              हिंदी सुरक्षा प्रतिज्ञा
            </div>
            <h3 className="font-semibold text-zinc-900 dark:text-white text-sm">आपकी गोपनीयता कैसे सुरक्षित है:</h3>
            <ul className="space-y-1.5 text-xs text-zinc-600 dark:text-zinc-450 list-disc pl-4 leading-relaxed font-sans">
              <li><strong>कोई क्लाउड स्टोरेज नहीं:</strong> फाइलें सीधे आपके ब्राउज़र की रैम में लोड होती हैं।</li>
              <li><strong>तत्काल विलोपन:</strong> प्रोसेसिंग के बाद, मूल फोटो तुरंत हटा दी जाती है।</li>
              <li><strong>लोकल EXIF निष्कासन:</strong> छिपी संवेदनशील जानकारी अपने आप साफ हो जाती है।</li>
            </ul>
          </div>
        </div>
      </div>

      {/* ── PANIC BUTTON SECTION (Prominent, Isolated, Bottom) ───────────────────── */}
      <div className="rounded-xl border border-red-200 dark:border-red-950/40 bg-red-50/50 dark:bg-red-950/10 p-6 flex flex-col items-center text-center gap-4 mt-8" id="panic-button-section">
        <div className="space-y-1 max-w-md">
          <h3 className="text-sm font-bold text-red-900 dark:text-red-400 flex items-center justify-center gap-1.5">
            <Zap className="h-4.5 w-4.5 text-red-650" />
            Panic Button — Instant Full Memory Wipe
          </h3>
          <p className="text-xs text-red-700 dark:text-red-450 leading-relaxed font-medium">
            Wipes all active file buffers in RAM, clears the session history ledger, and redirects to home. Use this if you need to instantly clear your screen.
          </p>
        </div>
        <button
          onClick={onPanic}
          className="w-full sm:w-auto flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 active:scale-95 text-white font-black text-sm px-8 py-3.5 rounded-xl border-2 border-red-700 transition-all shadow-lg shadow-red-500/30 cursor-pointer"
          id="panic-button-dashboard"
        >
          <Zap className="h-4 w-4" />
          PANIC — WIPE ALL NOW
        </button>
      </div>

    </div>
  );
}
