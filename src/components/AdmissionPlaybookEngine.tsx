import React, { useState } from 'react';
import { 
  BookOpen, Clock, AlertTriangle, ArrowRight, MapPin, AlertCircle, 
  Send, Sparkles, FileText, PenTool, Camera, CheckSquare, 
  Compass, Cpu, Workflow, FileSignature, Activity, BookmarkCheck, Inbox, ChevronDown, ChevronUp, Volume2, VolumeX
} from 'lucide-react';
import { AdmissionPlaybook, PlaybookStep, FeedbackLog, ApplicationProfile } from '../types';
import { ADMISSION_PLAYBOOKS } from '../playbooksData';
import { APPLICATION_PROFILES } from '../profilesData';
import { generatePlaybookICS, downloadICSFile } from '../utils/icsGenerator';
interface AdmissionPlaybookEngineProps {
  onNavigateToStudio: (studioId: 'photo' | 'signature' | 'pdf' | 'document') => void;
  onSelectProfile: (profile: ApplicationProfile | null) => void;
  onAddFeedbackLog: (log: Omit<FeedbackLog, 'id' | 'timestamp' | 'status'>) => void;
}

export default function AdmissionPlaybookEngine({
  onNavigateToStudio,
  onSelectProfile,
  onAddFeedbackLog
}: AdmissionPlaybookEngineProps) {
  // Navigation filters
  const [activeStageTab, setActiveStageTab] = useState<'all' | 'after-10th' | 'after-12th' | 'after-ug' | 'cross-cutting'>('all');
  const [selectedPlaybookId, setSelectedPlaybookId] = useState<string>('mh-fyjc-11th');
  const [selectedState, setSelectedState] = useState<string>('Maharashtra');
  const [explainToParents, setExplainToParents] = useState<boolean>(false);
  
  // Accordion Step expansion states (Step 1 expanded by default)
  const [expandedSteps, setExpandedSteps] = useState<Record<number, boolean>>({ 1: true });

  // Feedback modal
  const [showFeedbackModal, setShowFeedbackModal] = useState<boolean>(false);
  const [correctionText, setCorrectionText] = useState<string>('');

  const [referenceDate, setReferenceDate] = useState<string>(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [isPlayingVoice, setIsPlayingVoice] = useState<Record<number, boolean>>({});

  const handleSpeakStep = (stepOrder: number, textToSpeak: string) => {
    window.speechSynthesis.cancel();
    if (isPlayingVoice[stepOrder]) {
      setIsPlayingVoice({});
      return;
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    const voices = window.speechSynthesis.getVoices();
    // Prefer Indian English (en-IN), Hindi (hi-IN) or Marathi (mr-IN)
    const targetVoice = voices.find(v => v.lang.startsWith('hi') || v.lang.startsWith('mr') || v.lang.includes('IN')) || voices.find(v => v.lang.startsWith('en'));
    if (targetVoice) {
      utterance.voice = targetVoice;
    }
    
    utterance.onend = () => {
      setIsPlayingVoice({});
    };
    utterance.onerror = () => {
      setIsPlayingVoice({});
    };

    setIsPlayingVoice({ [stepOrder]: true });
    window.speechSynthesis.speak(utterance);
  };

  const handleExportCalendar = () => {
    const content = generatePlaybookICS(activePlaybook, referenceDate);
    downloadICSFile(`docsprint_admission_timeline_${activePlaybook.id}.ics`, content);
  };

  // Filter playbooks based on stage tab
  const filteredPlaybooksList = ADMISSION_PLAYBOOKS.filter(
    (p) => activeStageTab === 'all' || p.appliesTo.stage === activeStageTab
  );

  // Active playbook
  const activePlaybook = ADMISSION_PLAYBOOKS.find((p) => p.id === selectedPlaybookId) || ADMISSION_PLAYBOOKS.find((p) => p.id === 'generic-fallback') || ADMISSION_PLAYBOOKS[0];

  // Helper to test if last verified date is older than 60 days
  const isStale = (dateStr: string): boolean => {
    const verifiedDate = new Date(dateStr);
    const currentDate = new Date('2026-07-09'); // Local verified context year
    const diffTime = Math.abs(currentDate.getTime() - verifiedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 60;
  };

  const timelineContainerRef = React.useRef<HTMLDivElement | null>(null);
  const [scrollProgress, setScrollProgress] = useState(0);

  React.useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) {
      setScrollProgress(100);
      return;
    }

    const handleScroll = () => {
      const el = timelineContainerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const viewHeight = window.innerHeight;
      
      const startTrigger = viewHeight * 0.75;
      const totalHeight = rect.height;
      const currentScroll = startTrigger - rect.top;
      
      const pct = Math.min(Math.max((currentScroll / totalHeight) * 100, 0), 100);
      setScrollProgress(pct);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handlePlaybookSelect = (id: string) => {
    setSelectedPlaybookId(id);
    setExpandedSteps({ 1: true }); // reset expansions on profile swap
    const pb = ADMISSION_PLAYBOOKS.find((p) => p.id === id);
    if (pb && pb.appliesTo.state) {
      setSelectedState(pb.appliesTo.state);
    } else {
      setSelectedState('Other');
    }
  };

  const handleStateChange = (stateName: string) => {
    setSelectedState(stateName);
    if (stateName === 'Maharashtra') {
      const mhPlaybook = ADMISSION_PLAYBOOKS.find((p) => p.appliesTo.state === 'Maharashtra');
      if (mhPlaybook) setSelectedPlaybookId(mhPlaybook.id);
    } else {
      setSelectedPlaybookId('generic-fallback');
    }
    setExpandedSteps({ 1: true });
  };

  const toggleStep = (stepOrder: number) => {
    setExpandedSteps((prev) => ({
      ...prev,
      [stepOrder]: !prev[stepOrder],
    }));
  };

  const handleDeepLink = (doc: PlaybookStep['documentsNeeded'][0]) => {
    if (!doc.docSprintStudio) return;

    if (doc.docSprintProfileId) {
      const matchedProfile = APPLICATION_PROFILES.find((p) => p.id === doc.docSprintProfileId);
      if (matchedProfile) {
        onSelectProfile(matchedProfile);
      }
    }
    
    onNavigateToStudio(doc.docSprintStudio);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionText.trim()) return;

    onAddFeedbackLog({
      playbookId: activePlaybook.id,
      playbookTitle: activePlaybook.title,
      suggestedCorrection: correctionText
    });

    setCorrectionText('');
    setShowFeedbackModal(false);
    alert('Thank you! Your correction has been securely logged to the Local RAM Moderation Ledger.');
  };

  // Color theme generator based on step actionType
  const getStepTheme = (actionType: PlaybookStep['actionType']) => {
    switch (actionType) {
      case 'online-form':
        return {
          border: 'border-l-4 border-l-blue-600 border-zinc-200 hover:border-blue-600/70',
          badgeBg: 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900/60',
          dotBg: 'border-blue-600 bg-white dark:bg-zinc-900 text-blue-600 shadow-[0_0_12px_rgba(37,99,235,0.15)]',
          icon: <Compass className="h-4 w-4" />,
          cardGlow: 'hover:shadow-lg hover:shadow-blue-500/5'
        };
      case 'document-upload':
        return {
          border: 'border-l-4 border-l-emerald-600 border-zinc-200 hover:border-emerald-600/70',
          badgeBg: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/60',
          dotBg: 'border-emerald-600 bg-white dark:bg-zinc-900 text-emerald-600 shadow-[0_0_12px_rgba(5,150,105,0.15)]',
          icon: <FileSignature className="h-4 w-4" />,
          cardGlow: 'hover:shadow-lg hover:shadow-emerald-500/5'
        };
      case 'in-person-report':
        return {
          border: 'border-l-4 border-l-amber-600 border-zinc-200 hover:border-amber-600/70',
          badgeBg: 'bg-amber-50 dark:bg-amber-950/20 text-amber-700 dark:text-amber-300 border border-amber-200/60 dark:border-amber-900/60',
          dotBg: 'border-amber-600 bg-white dark:bg-zinc-900 text-amber-600 shadow-[0_0_12px_rgba(217,119,6,0.15)]',
          icon: <Workflow className="h-4 w-4" />,
          cardGlow: 'hover:shadow-lg hover:shadow-amber-500/5'
        };
      case 'payment':
        return {
          border: 'border-l-4 border-l-indigo-600 border-zinc-200 hover:border-indigo-600/70',
          badgeBg: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-900/60',
          dotBg: 'border-indigo-600 bg-white dark:bg-zinc-900 text-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.15)]',
          icon: <Cpu className="h-4 w-4" />,
          cardGlow: 'hover:shadow-lg hover:shadow-indigo-500/5'
        };
      case 'wait':
        return {
          border: 'border-l-4 border-l-zinc-400 border-zinc-200 hover:border-zinc-400',
          badgeBg: 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-zinc-200/80 dark:border-zinc-800',
          dotBg: 'border-zinc-400 bg-white dark:bg-zinc-900 text-zinc-500',
          icon: <Activity className="h-4 w-4" />,
          cardGlow: 'hover:shadow-md'
        };
      default:
        return {
          border: 'border-l-4 border-l-indigo-500 border-zinc-200 hover:border-indigo-500',
          badgeBg: 'bg-zinc-100 dark:bg-zinc-850 text-zinc-700 dark:text-zinc-300 border border-zinc-200',
          dotBg: 'border-indigo-500 bg-white dark:bg-zinc-900 text-indigo-600',
          icon: <BookOpen className="h-4 w-4" />,
          cardGlow: ''
        };
    }
  };

  const getStudioIcon = (studio?: string) => {
    switch (studio) {
      case 'photo': return <Camera className="h-4 w-4 text-indigo-550 dark:text-indigo-400" />;
      case 'signature': return <PenTool className="h-4 w-4 text-emerald-500 dark:text-emerald-400" />;
      case 'pdf': return <FileText className="h-4 w-4 text-amber-500 dark:text-amber-400" />;
      case 'document': return <Camera className="h-4 w-4 text-rose-500 dark:text-rose-400" />;
      default: return null;
    }
  };

  return (
    <div className="space-y-8 font-sans text-zinc-800 dark:text-zinc-300" id="playbook-engine-root">
      
      {/* ── STAGE TABS BAR ─────────────────────────────────────────────────── */}
      <div className="flex gap-2 overflow-x-auto pb-2 border-b border-zinc-200 dark:border-zinc-800">
        {[
          { id: 'all', label: 'All Roadmaps' },
          { id: 'after-10th', label: 'After 10th (SSC)' },
          { id: 'after-12th', label: 'After 12th (HSC)' },
          { id: 'after-ug', label: 'After Graduation' },
          { id: 'cross-cutting', label: 'Cross-Cutting' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveStageTab(tab.id as any);
              const playbooks = ADMISSION_PLAYBOOKS.filter(
                (p) => tab.id === 'all' || p.appliesTo.stage === tab.id
              );
              if (playbooks.length > 0) {
                handlePlaybookSelect(playbooks[0].id);
              }
            }}
            className={`rounded-xl px-5 py-2.5 text-sm font-bold tracking-wide whitespace-nowrap transition cursor-pointer border ${
              activeStageTab === tab.id
                ? 'bg-indigo-600 text-white border-indigo-700 shadow-md shadow-indigo-500/10'
                : 'text-zinc-500 dark:text-zinc-400 hover:bg-zinc-150 dark:hover:bg-zinc-800 border-transparent'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ── PLAYBOOK SELECTOR & STATE SELECTOR ROW ────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Playbook picker card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 space-y-4 shadow-xs">
          <label className="text-[11px] font-bold font-mono text-zinc-400 dark:text-zinc-650 uppercase tracking-widest block">
            Choose Admission Cycle
          </label>
          <div className="grid gap-3">
            {filteredPlaybooksList.map((pb) => (
              <button
                key={pb.id}
                onClick={() => handlePlaybookSelect(pb.id)}
                className={`w-full flex items-center justify-between rounded-xl border p-4 text-left transition cursor-pointer ${
                  selectedPlaybookId === pb.id
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/20 text-indigo-900 dark:text-indigo-200 shadow-xs'
                    : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 text-zinc-600 dark:text-zinc-400'
                }`}
              >
                <div>
                  <div className="text-base font-extrabold tracking-wide leading-snug">{pb.title}</div>
                  <div className="text-[10px] font-mono text-zinc-400 dark:text-zinc-600 mt-2 uppercase tracking-widest">
                    Portal: {pb.officialPortal.name}
                  </div>
                </div>
                <BookmarkCheck className={`h-5 w-5 shrink-0 transition-colors ${
                  selectedPlaybookId === pb.id ? 'text-indigo-600 dark:text-indigo-400' : 'text-zinc-400'
                }`} />
              </button>
            ))}
          </div>
        </div>

        {/* State/Territory picker card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 flex flex-col justify-between h-full shadow-xs">
          <div className="space-y-2.5">
            <label className="text-[11px] font-bold font-mono text-zinc-400 dark:text-zinc-650 uppercase tracking-widest block">
              Filter State Context
            </label>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              State-specific cycles loaded verified portals. Choosing other states activates the standard fallback.
            </p>
          </div>
          <select
            value={selectedState}
            onChange={(e) => handleStateChange(e.target.value)}
            className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 px-4 py-3 text-sm font-bold text-zinc-800 dark:text-zinc-300 focus:outline-none focus:border-indigo-500 w-full mt-5 cursor-pointer shadow-xs animate-none"
          >
            <option value="Maharashtra">Maharashtra (verified rules)</option>
            <option value="National">National (JoSAA/MBA/Government cycles)</option>
            <option value="Delhi">Delhi (Fallback)</option>
            <option value="Karnataka">Karnataka (Fallback)</option>
            <option value="Other">Other / Generic Lifecyle</option>
          </select>
        </div>
      </div>

      {/* ── WARNINGS & NOTICES ────────────────────────────────────────────── */}
      {selectedState !== 'Maharashtra' && selectedState !== 'National' && (
        <div className="rounded-2xl border border-amber-200 dark:border-amber-900 bg-amber-50 dark:bg-amber-950/20 p-5 flex items-start gap-4 animate-fadeIn">
          <AlertCircle className="h-6 w-6 text-amber-600 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-400 space-y-1">
            <span className="font-extrabold tracking-wide">Playbook Fallback Active</span>
            <p className="leading-relaxed text-xs">
              We are verifying rules for <strong>{selectedState}</strong>. 
              Showing general admission lifecycles in RAM. Verify exact schedules on your regional portals.
            </p>
          </div>
        </div>
      )}

      {isStale(activePlaybook.officialPortal.lastVerifiedDate) && (
        <div className="rounded-2xl border border-rose-200 dark:border-rose-900 bg-rose-50 dark:bg-rose-950/20 p-5 flex items-start gap-4 animate-pulse" id="stale-playbook-banner">
          <AlertTriangle className="h-6 w-6 text-rose-600 shrink-0 mt-0.5" />
          <div className="text-sm text-rose-800 dark:text-rose-400 space-y-1">
            <span className="font-extrabold tracking-wide">Outdated Date Advisory Notice</span>
            <p className="leading-relaxed text-xs">
              This Playbook was last verified on <strong className="font-mono text-rose-950 dark:text-rose-300">{activePlaybook.officialPortal.lastVerifiedDate}</strong> (older than 60 days). 
              Schedules change frequently across cycles. Please confirm on the official portal.
            </p>
          </div>
        </div>
      )}

      {/* ── INFO BLOCKS ROW ────────────────────────────────────────────────── */}
      <div className="grid gap-6 md:grid-cols-4">
        {/* Gateway Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 space-y-4 shadow-xs">
          <h4 className="text-[11px] font-bold font-mono text-zinc-400 dark:text-zinc-650 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-805 pb-2">
            Official Gateway
          </h4>
          <div className="space-y-2">
            <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-600 uppercase tracking-wider font-mono">Official Portal URL:</div>
            <a 
              href={activePlaybook.officialPortal.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-sm text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 font-mono underline block break-all font-bold"
            >
              {activePlaybook.officialPortal.name} ↗
            </a>
          </div>
          <div className="space-y-1 pt-1.5">
            <span className="text-[10px] text-zinc-400 dark:text-zinc-650 block">Verified source:</span>
            <a 
              href={activePlaybook.officialPortal.sourceUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-zinc-600 underline font-mono block truncate"
            >
              Official Spec Notification ↗
            </a>
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg px-3 py-2.5 flex justify-between items-center font-mono">
            <span>Last checked:</span>
            <span className="font-bold text-indigo-600 dark:text-indigo-400">{activePlaybook.officialPortal.lastVerifiedDate}</span>
          </div>
        </div>

        {/* Pre-Cognitive Deadline Radar Card */}
        <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 space-y-4 shadow-xs flex flex-col justify-between" id="deadline-radar-card">
          <div>
            <h4 className="text-[11px] font-bold font-mono text-zinc-400 dark:text-zinc-650 uppercase tracking-widest border-b border-zinc-100 dark:border-zinc-805 pb-2 flex items-center gap-1.5">
              <Clock className="h-4 w-4 text-indigo-550" />
              Deadline Radar
            </h4>
            <p className="text-[10px] text-zinc-500 dark:text-zinc-400 leading-relaxed mt-2">
              Generate calendar events for timeline steps. Set your expected results date:
            </p>
          </div>
          <div className="space-y-3">
            <div className="space-y-1">
              <label className="text-[9px] font-bold font-mono text-zinc-450 dark:text-zinc-500 uppercase tracking-wider block">
                Reference / Results Date
              </label>
              <input
                type="date"
                value={referenceDate}
                onChange={(e) => setReferenceDate(e.target.value)}
                className="w-full text-xs h-9 px-3 py-1 border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 rounded-lg text-zinc-800 dark:text-zinc-100 focus:outline-none"
              />
            </div>
            <button
              onClick={handleExportCalendar}
              className="w-full h-10 flex items-center justify-center gap-1.5 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs transition cursor-pointer"
            >
              <Clock className="h-3.5 w-3.5" />
              Export .ics File
            </button>
          </div>
        </div>

        {/* Explain to My Parents Panel */}
        <div className="md:col-span-2 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 space-y-4 flex flex-col justify-between shadow-xs" id="parents-summary-panel">
          <div>
            <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-805 pb-2">
              <h4 className="text-[11px] font-bold font-mono text-zinc-400 dark:text-zinc-650 uppercase tracking-widest flex items-center gap-1.5">
                <Sparkles className="h-4 w-4 text-indigo-500" />
                "Explain to My Parents" Summary
              </h4>
              <button 
                onClick={() => setExplainToParents(!explainToParents)}
                className={`text-[10px] font-bold font-mono px-3.5 py-1.5 rounded-lg transition cursor-pointer border ${
                  explainToParents ? 'bg-indigo-600 text-white border-indigo-700 shadow-sm' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-850 hover:bg-zinc-200 dark:hover:bg-zinc-700'
                }`}
              >
                {explainToParents ? 'SHOW JOURNEY' : 'SIMPLIFIED HINDI/ENGLISH'}
              </button>
            </div>
            <p className="text-base text-zinc-750 dark:text-zinc-350 leading-relaxed mt-4 font-semibold">
              {explainToParents 
                ? activePlaybook.parentSummary 
                : 'A parent-friendly breakdown is available. This simplified view extracts technical jargon and provides a direct overview in easy Hindi/English.'}
            </p>
          </div>
          {!explainToParents && (
            <button 
              onClick={() => setExplainToParents(true)}
              className="w-full text-center text-sm font-bold py-3 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl text-indigo-600 dark:text-indigo-400 border border-zinc-200 dark:border-zinc-805 transition mt-3 cursor-pointer"
            >
              Toggle Parents View
            </button>
          )}
        </div>
      </div>

      {/* ── STEPPER ROADMAP JOURNAL TIMELINE ───────────────────────────────── */}
      <div className="space-y-6" id="playbook-steps-timeline">
        <h3 className="text-xs font-bold text-zinc-400 dark:text-zinc-650 uppercase tracking-wider font-mono px-1">
          Journey Roadmap — Step-by-Step Sequence
        </h3>

        <div ref={timelineContainerRef} className="relative pl-8 ml-4 space-y-5">
          <div className="absolute left-0 top-3 bottom-3 w-0.5 bg-zinc-200 dark:bg-zinc-800" />
          <div 
            className="absolute left-0 top-3 w-0.5 bg-indigo-650 dark:bg-indigo-400 transition-all duration-100 ease-out" 
            style={{ height: `${scrollProgress}%` }}
          />
          {activePlaybook.steps.map((step) => {
            const theme = getStepTheme(step.actionType);
            const isExpanded = !!expandedSteps[step.order];

            return (
              <div key={step.order} className="relative animate-fadeIn" id={`step-order-${step.order}`}>
                {/* Stepper Dot */}
                <div className={`absolute -left-[49px] top-3 flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-bold font-mono shadow-xs transition-all ${theme.dotBg}`}>
                  {step.order}
                </div>

                {/* Step Card (Accordion Header on top) */}
                <div className={`rounded-2xl border transition-all duration-200 ${theme.border} bg-white dark:bg-zinc-100 shadow-xs flex flex-col`}>
                  {/* Clickable Header Row */}
                  <div
                    onClick={() => toggleStep(step.order)}
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer select-none"
                    role="button"
                    aria-expanded={isExpanded}
                  >
                    <div className="min-w-0 flex-1">
                      <h4 className="text-base sm:text-lg font-black tracking-tight text-zinc-900 dark:text-white truncate">
                        {step.title}
                      </h4>
                      <div className="flex flex-wrap items-center gap-2 mt-1.5">
                        <span className={`text-[9px] font-bold font-mono px-2 py-0.5 rounded flex items-center gap-1 uppercase ${theme.badgeBg}`}>
                          {theme.icon}
                          {step.actionType.replace('-', ' ')}
                        </span>
                        
                        {step.documentsNeeded.length > 0 && (
                          <span className="text-[9px] font-bold font-mono px-2 py-0.5 bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-300 rounded border border-indigo-100 dark:border-indigo-900/40">
                            {step.documentsNeeded.length} document{step.documentsNeeded.length !== 1 ? 's' : ''}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className="hidden sm:inline-flex rounded-full bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 px-3 py-1 text-[10px] font-bold font-mono text-zinc-500">
                        {step.timingWindow}
                      </span>
                      
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleSpeakStep(step.order, `${step.title}. ${step.description}`);
                        }}
                        className={`p-1.5 rounded-lg border transition cursor-pointer ${
                          isPlayingVoice[step.order]
                            ? 'bg-rose-50 border-rose-200 dark:bg-rose-950/20 dark:border-rose-900 text-rose-650'
                            : 'bg-zinc-50 border-zinc-200 hover:bg-zinc-105 dark:bg-zinc-900 dark:border-zinc-850 dark:hover:bg-zinc-800 text-zinc-500 hover:text-indigo-600'
                        }`}
                        title="Speak explanation aloud for parents (Hindi/Marathi/English)"
                      >
                        {isPlayingVoice[step.order] ? (
                          <VolumeX className="h-3.5 w-3.5 animate-pulse" />
                        ) : (
                          <Volume2 className="h-3.5 w-3.5" />
                        )}
                      </button>

                      {isExpanded ? (
                        <ChevronUp className="h-4.5 w-4.5 text-zinc-400" />
                      ) : (
                        <ChevronDown className="h-4.5 w-4.5 text-zinc-400" />
                      )}
                    </div>
                  </div>

                  {/* Expandable Body */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-zinc-100 dark:border-zinc-805 space-y-5 animate-slideDown">
                      {/* Mobile timing pill fallback */}
                      <div className="flex sm:hidden justify-between items-center bg-zinc-50 dark:bg-zinc-900 p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-800 font-mono text-[10px] font-bold">
                        <span className="text-zinc-400">Timing window:</span>
                        <span className="text-zinc-700 dark:text-zinc-350">{step.timingWindow}</span>
                      </div>

                      <p className="text-sm text-zinc-650 dark:text-zinc-350 leading-relaxed font-medium">
                        {step.description}
                      </p>

                      {/* 🧠 Preparation & Study Guide */}
                      {step.studyGuide && (
                        <div className="bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-3xs">
                          <span className="text-[10px] font-bold font-mono text-indigo-650 dark:text-indigo-400 uppercase tracking-widest block flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
                            Preparation & Study Guide (Syllabus & Free Resources)
                          </span>
                          
                          {step.studyGuide.syllabus && step.studyGuide.syllabus.length > 0 && (
                            <div className="space-y-1">
                              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase font-mono">Exam Syllabus & Pattern:</span>
                              <ul className="list-disc pl-5 text-xs text-zinc-650 dark:text-zinc-400 space-y-1 font-semibold">
                                {step.studyGuide.syllabus.map((syl, i) => (
                                  <li key={i} className="leading-relaxed">{syl}</li>
                                ))}
                              </ul>
                            </div>
                          )}

                          {step.studyGuide.resources && step.studyGuide.resources.length > 0 && (
                            <div className="space-y-1 pt-2 border-t border-zinc-200 dark:border-zinc-800">
                              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-600 uppercase font-mono">Recommended Material:</span>
                              <ul className="list-disc pl-5 text-xs text-zinc-650 dark:text-zinc-400 space-y-1 font-semibold">
                                {step.studyGuide.resources.map((res, i) => (
                                  <li key={i} className="leading-relaxed">{res}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Documents list */}
                      {step.documentsNeeded.length > 0 && (
                        <div className="bg-zinc-50/80 dark:bg-zinc-900/40 border border-zinc-200 dark:border-zinc-800 rounded-xl p-4 space-y-3 shadow-3xs">
                          <span className="text-[10px] font-bold font-mono text-zinc-400 dark:text-zinc-650 uppercase tracking-widest block flex items-center gap-1.5">
                            <Inbox className="h-3.5 w-3.5 text-zinc-400" />
                            Required Documents at this step
                          </span>
                          <div className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {step.documentsNeeded.map((doc, idx) => (
                              <div key={idx} className="flex items-center justify-between py-3 first:pt-0 last:pb-0 gap-4">
                                <div>
                                  <span className="text-sm text-zinc-800 dark:text-white font-extrabold">{doc.name}</span>
                                  <div className="flex items-center gap-1.5 mt-1">
                                    <span className="text-[10px] font-mono text-zinc-450 dark:text-zinc-500 uppercase font-bold">
                                      {doc.originalOrPhotocopy === 'both' ? 'Original & Photocopy' : doc.originalOrPhotocopy}
                                    </span>
                                    {doc.printCopies && (
                                      <span className="text-[10px] font-mono text-indigo-650 dark:text-indigo-400 font-extrabold">
                                        · {doc.printCopies} copy/copies
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {doc.docSprintStudio && (
                                  <button
                                    onClick={() => handleDeepLink(doc)}
                                    className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 flex items-center gap-1.5 shrink-0 cursor-pointer"
                                  >
                                    {getStudioIcon(doc.docSprintStudio)}
                                    Prepare Now <ArrowRight className="h-3.5 w-3.5 animate-pulse" />
                                  </button>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Tips */}
                      {step.tips.length > 0 && (
                        <div className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 space-y-1.5 bg-zinc-50/50 dark:bg-zinc-900/20 p-4 rounded-xl border border-zinc-200/80 dark:border-zinc-800">
                          <span className="font-extrabold text-zinc-400 dark:text-zinc-600 font-mono block">PRO TIPS:</span>
                          <ul className="list-disc pl-5 space-y-1">
                            {step.tips.map((t, i) => (
                              <li key={i} className="leading-relaxed">{t}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Persistent Trust Verification Footer */}
        <div className="border-t border-zinc-200 dark:border-zinc-800 pt-5 mt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-zinc-400 dark:text-zinc-500 font-mono">
          <span>Last verified: <strong className="text-zinc-600 dark:text-zinc-300">{activePlaybook.officialPortal.lastVerifiedDate}</strong></span>
          <span>Source: <a href={activePlaybook.officialPortal.sourceUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:underline">{activePlaybook.officialPortal.name}</a></span>
        </div>
      </div>

      {/* Common Mistakes Section */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 space-y-4 shadow-xs" id="common-mistakes-panel">
        <h4 className="text-xs font-bold text-zinc-400 dark:text-zinc-650 uppercase tracking-wider font-mono border-b border-zinc-100 dark:border-zinc-805 pb-2">
          Common Rejection Reasons & Pitfalls
        </h4>
        <ul className="space-y-3">
          {activePlaybook.commonMistakes.map((mistake, i) => (
            <li key={i} className="text-sm sm:text-base flex items-start gap-2.5 text-rose-600 dark:text-rose-400 font-bold leading-relaxed">
              <span className="text-rose-650 dark:text-rose-500 font-extrabold mt-0.5">⚠</span>
              <span>{mistake}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Suggest Correct / Report Outdated & Disclaimer */}
      <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-xs">
        <div className="text-left space-y-1">
          <span className="text-[10px] font-bold font-mono text-zinc-400 dark:text-zinc-650 block">Disclaimer</span>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-xl font-medium">
            {activePlaybook.disclaimer} Dates shift yearly — always confirm on the official portal before acting. 
            Help us maintain verification integrity by suggesting corrections.
          </p>
        </div>

        <button
          onClick={() => setShowFeedbackModal(true)}
          className="flex-shrink-0 text-xs font-bold px-5 py-2.5 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-800 rounded-xl transition cursor-pointer"
          id="report-outdated-playbook-btn"
        >
          Report Outdated Info
        </button>
      </div>

      {/* Report Outdated Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white dark:bg-zinc-100 border border-zinc-200 dark:border-zinc-850 rounded-2xl max-w-md w-full p-6 space-y-5 shadow-lg">
            <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-2">
              <h3 className="text-sm font-bold text-zinc-805 dark:text-white flex items-center gap-1.5">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                Report Outdated Info
              </h3>
              <button 
                onClick={() => setShowFeedbackModal(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 cursor-pointer"
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleSubmitFeedback} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-400">
                  Suggest corrections for {activePlaybook.title}:
                </label>
                <textarea
                  required
                  rows={4}
                  value={correctionText}
                  onChange={(e) => setCorrectionText(e.target.value)}
                  placeholder="Describe what changed..."
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs text-zinc-800 placeholder-zinc-400 focus:border-indigo-500 focus:outline-none"
                />
              </div>
              <p className="text-[10px] text-zinc-400 leading-relaxed font-mono">
                Note: Feedback is logged completely locally inside your client browser RAM session (visible under the Privacy Dashboard Feedback Ledger). Zero server database persistence.
              </p>
              <button
                type="submit"
                className="w-full flex h-10 items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition cursor-pointer"
              >
                Log Local Feedback Correction
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
