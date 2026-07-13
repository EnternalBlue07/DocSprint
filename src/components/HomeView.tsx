import React, { useState, useEffect, useRef } from 'react';
import { Search, Eye, Sparkles, FileText, Camera, ShieldCheck, CheckSquare, Zap, ChevronRight, Image as ImageIcon, PenTool, ArrowRight, BookOpen } from 'lucide-react';
import { ApplicationProfile } from '../types';
import { APPLICATION_PROFILES } from '../profilesData';

interface HomeViewProps {
  onSelectProfile: (profile: ApplicationProfile) => void;
  onNavigateToStudio: (studioId: 'photo' | 'signature' | 'pdf' | 'document' | 'playbook') => void;
  onNavigateToPlaybook: () => void;
}

export default function HomeView({
  onSelectProfile,
  onNavigateToStudio,
  onNavigateToPlaybook
}: HomeViewProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'all' | 'exams' | 'government' | 'travel' | 'admissions' | 'custom'>('all');

  // Motion States
  const [scrollY, setScrollY] = useState(0);
  const [magneticOffset, setMagneticOffset] = useState({ x: 0, y: 0 });
  const [hoveredProfileId, setHoveredProfileId] = useState<string | null>(null);

  // Track window scroll for parallax and SVG path draw
  useEffect(() => {
    const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReduced) return;

    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleMagneticMove = (e: React.MouseEvent<HTMLButtonElement>) => {
    // Only run on fine-pointer devices (mouse)
    if (window.matchMedia('(pointer: coarse)').matches) return;

    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    
    // Target max 6px shift
    const strength = 0.22;
    const dx = Math.max(-6, Math.min(6, x * strength));
    const dy = Math.max(-6, Math.min(6, y * strength));
    
    setMagneticOffset({ x: dx, y: dy });
  };

  const handleMagneticLeave = () => {
    setMagneticOffset({ x: 0, y: 0 });
  };

  // Filter profiles based on search query and category tab selection
  const filteredProfiles = APPLICATION_PROFILES.filter((profile) => {
    const matchesSearch = profile.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          profile.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeTab === 'all' || profile.category === activeTab;
    return matchesSearch && matchesCategory;
  });

  const hoveredIndex = filteredProfiles.findIndex((p) => p.id === hoveredProfileId);

  return (
    <div className="space-y-12 font-sans animate-title" id="home-view-component">
      {/* Calm Urgency Hero Section */}
      <section className="text-center max-w-3xl mx-auto space-y-6 pt-8 relative overflow-hidden" id="hero-section">
        {/* Parallax background bubble decorations */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-20 dark:opacity-10"
          style={{ transform: `translateY(${Math.min(scrollY * 0.08, 15)}px)` }}
        >
          <div className="absolute top-0 left-1/4 w-32 h-32 rounded-full bg-indigo-500/10 blur-2xl animate-float" />
          <div className="absolute bottom-4 right-1/4 w-40 h-40 rounded-full bg-purple-500/10 blur-2xl animate-float" style={{ animationDelay: '1.5s' }} />
        </div>

        <div className="space-y-4 relative z-10" style={{ transform: `translateY(${Math.min(scrollY * 0.03, 6)}px)` }}>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50/80 px-3.5 py-1 text-xs font-semibold text-indigo-850 border border-indigo-100 dark:bg-indigo-950/20 dark:text-indigo-300 dark:border-indigo-900/40 animate-pulse">
            <Sparkles className="h-3.5 w-3.5 text-indigo-700 dark:text-indigo-400" />
            The Student Document OS
          </span>
          
          <h1 className="text-4xl sm:text-5xl font-black tracking-tight text-zinc-950 dark:text-white font-heading leading-tight md:leading-none">
            Prepare, Validate, and Submit <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-500 dark:from-indigo-400 dark:via-violet-400 dark:to-fuchsia-400">
              Your Exam Documents Securely
            </span>
          </h1>

          {/* Animated Hero SVG Illustration */}
          <div className="py-4 relative max-w-xs mx-auto">
            <svg className="w-20 h-20 mx-auto text-zinc-300 dark:text-zinc-700 drop-shadow-md" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="25" y="15" width="50" height="70" rx="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" className="dark:text-zinc-800 text-zinc-200" />
              <path d="M35 30 H65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="dark:text-zinc-700 text-zinc-300" />
              <path d="M35 45 H65" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="dark:text-zinc-700 text-zinc-300" />
              <path d="M35 60 H50" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" className="dark:text-zinc-700 text-zinc-300" />
              <path 
                d="M40 55 L48 63 L65 42" 
                stroke="var(--color-success)" 
                strokeWidth="3.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
                strokeDasharray="40"
                strokeDashoffset={Math.max(40 * (1 - scrollY / 150), 0)}
                style={{ transition: 'stroke-dashoffset 150ms ease-out' }}
              />
            </svg>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-0.5 bg-gradient-to-r from-transparent via-indigo-500 to-transparent blur-xs opacity-75 animate-pulse" />
          </div>

          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 max-w-2xl mx-auto leading-relaxed">
            The only platform with a built-in <strong className="font-semibold text-zinc-805 dark:text-zinc-200">Live Rules Engine</strong> that auto-checks exact dimension and size requirements for MAH-CET, JEE, NEET, and 12+ other forms. 
            Processed entirely in RAM — nothing is saved.
          </p>

          {/* Magnetic CTA Button */}
          <div className="pt-2">
            <button
              onClick={() => {
                const el = document.getElementById('profile-selection-panel');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
              onMouseMove={handleMagneticMove}
              onMouseLeave={handleMagneticLeave}
              className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-650 hover:from-indigo-500 hover:to-violet-550 text-white px-7 py-3.5 text-sm font-bold shadow-md shadow-indigo-500/10 hover:shadow-lg hover:shadow-indigo-500/25 active:scale-98 transition-all duration-300 cursor-pointer"
              id="primary-hero-cta"
              style={{ transform: `translate(${magneticOffset.x}px, ${magneticOffset.y}px)` }}
            >
              Choose what you're applying for
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          
          {/* Quick Value Trust Badges */}
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-zinc-555 dark:text-zinc-400 pt-1">
            <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-450" /> No Account Required</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-450" /> Provable Memory Purge</span>
            <span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4 text-emerald-600 dark:text-emerald-450" /> 100% Free Forever</span>
          </div>
        </div>
      </section>

      {/* Direct-access Quick Toolkits Launcher */}
      <section className="space-y-4 reveal-on-scroll" id="generic-toolkits">
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-805 pb-2">
          <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
            Direct Studio Toolkits (DIY)
          </h3>
          <span className="text-[10px] text-zinc-450">Jump straight into processing files without a profile</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
          {[
            { id: 'photo', label: 'Photo Studio', desc: 'Face crop, background segments, and compress', icon: ImageIcon, color: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-850 dark:text-indigo-300 border border-indigo-100/30' },
            { id: 'signature', label: 'Signature Studio', desc: 'Clean contrast, bleed white, transparent signature', icon: PenTool, color: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-850 dark:text-emerald-300 border border-emerald-100/30' },
            { id: 'pdf', label: 'PDF Toolkit', desc: 'Merge, split ranges, rotate sheets, images-to-PDF', icon: FileText, color: 'bg-amber-50 dark:bg-amber-950/20 text-amber-850 dark:text-amber-300 border border-amber-100/30' },
            { id: 'document', label: 'Document Scanner', desc: 'Camera perspective warping, flat scans', icon: Camera, color: 'bg-rose-50 dark:bg-rose-950/20 text-rose-850 dark:text-rose-300 border border-rose-100/30' },
            { id: 'playbook', label: 'Admission Roadmaps', desc: 'Sequential timeline, verification specs & timing maps', icon: BookOpen, color: 'bg-violet-50 dark:bg-violet-950/20 text-violet-850 dark:text-violet-300 border border-violet-100/30' }
          ].map((tool) => (
            <div
              key={tool.id}
              onClick={() => {
                if (tool.id === 'playbook') {
                  onNavigateToPlaybook();
                } else {
                  onNavigateToStudio(tool.id as any);
                }
              }}
              className="premium-card p-5 cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/5 hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between h-40"
            >
              <div className="flex items-center justify-between">
                <div className={`p-2.5 rounded-xl ${tool.color} shadow-3xs`}>
                  <tool.icon className="h-5 w-5" />
                </div>
                <ChevronRight className="h-4 w-4 text-zinc-300 group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition transform group-hover:translate-x-1" />
              </div>
              <div>
                <h4 className="text-xs font-extrabold text-zinc-900 dark:text-white group-hover:text-indigo-650 dark:group-hover:text-indigo-400 transition font-heading">{tool.label}</h4>
                <p className="text-[10px] text-zinc-505 dark:text-zinc-400 leading-snug mt-1.5">{tool.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Profile Finder and Chooser Grid */}
      <section className="space-y-5 reveal-on-scroll" id="profile-selection-panel">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-805 pb-4">
          <div>
            <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-wider font-mono">
              Live Rules Engine Profile Matcher
            </h3>
            <p className="text-xs text-zinc-450 mt-0.5">Select your specific exam target to load the active requirements checklist.</p>
          </div>

          {/* Search bar */}
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search e.g. JEE, MAH-CET..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 dark:border-zinc-800 pl-9 pr-4 py-1.5 text-xs focus:border-indigo-500 focus:outline-none placeholder-zinc-400 text-zinc-800 dark:text-zinc-100 bg-white dark:bg-zinc-900"
            />
          </div>
        </div>        {/* Categories navigation filter tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 border-b border-zinc-100 dark:border-zinc-805">
          {[
            { id: 'all', label: 'All Profiles' },
            { id: 'exams', label: 'Indian Exams' },
            { id: 'government', label: 'Govt Services' },
            { id: 'travel', label: 'Visa & Passport' },
            { id: 'admissions', label: 'University Forms' },
            { id: 'custom', label: 'DIY Sandbox' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`rounded-lg px-3.5 py-2 text-xs font-semibold whitespace-nowrap transition-all duration-300 cursor-pointer ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-indigo-700 to-violet-650 text-white shadow-md shadow-indigo-500/20'
                  : 'text-zinc-555 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/40 hover:text-zinc-850 dark:hover:text-zinc-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profiles Grid with Bento-grid hover choreography */}
        {filteredProfiles.length === 0 ? (
          <div className="text-center py-12 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl bg-zinc-50 dark:bg-zinc-900/10 text-zinc-400" id="no-profiles-found">
            <Search className="h-8 w-8 text-zinc-300 mx-auto mb-2 animate-bounce" />
            <p className="text-xs font-medium text-zinc-650">No matching profiles located</p>
            <p className="text-[10px] text-zinc-450 mt-0.5">Try searching another query or select "DIY Sandbox" to create a custom template.</p>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3" id="profiles-selector-grid">
            {filteredProfiles.map((profile, idx) => {
              const isHovered = hoveredProfileId === profile.id;
              const isPrevNeighbor = hoveredIndex !== -1 && idx === hoveredIndex - 1;
              const isNextNeighbor = hoveredIndex !== -1 && idx === hoveredIndex + 1;

              // Apply translation rules for neighbor-response choreography
              let transformStyle = 'translate(0, 0)';
              if (!window.matchMedia('(pointer: coarse)').matches) {
                if (isHovered) {
                  transformStyle = 'translateY(-4px)';
                } else if (isPrevNeighbor) {
                  transformStyle = 'translateX(-2px)';
                } else if (isNextNeighbor) {
                  transformStyle = 'translateX(2px)';
                }
              }

              return (
                <div
                  key={profile.id}
                  onClick={() => onSelectProfile(profile)}
                  onMouseEnter={() => setHoveredProfileId(profile.id)}
                  onMouseLeave={() => setHoveredProfileId(null)}
                  className={`premium-card p-5 cursor-pointer hover:border-indigo-500 hover:shadow-lg hover:shadow-indigo-500/5 flex flex-col justify-between min-h-[200px] border-b-2 hover:border-b-indigo-650 dark:hover:border-b-indigo-500 transition-all duration-300`}
                  style={{ transform: transformStyle }}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-extrabold text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition font-heading">{profile.name}</h4>
                      <span className="rounded bg-indigo-50 dark:bg-indigo-950/20 border border-indigo-100/30 px-2 py-0.5 text-[9px] font-bold font-mono text-indigo-700 dark:text-indigo-300 uppercase tracking-wider">
                        {profile.category}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-505 dark:text-zinc-400 leading-relaxed line-clamp-3">
                      {profile.description}
                    </p>
                  </div>

                  <div className="space-y-2 mt-3 pt-3 border-t border-zinc-200/50 dark:border-zinc-800/40">
                    <div className="flex items-center justify-between">
                      <span className="text-[9px] font-extrabold font-mono text-indigo-700 dark:text-indigo-400 uppercase tracking-wider group-hover:underline flex items-center gap-1 transition-all">
                        Load live specs <ArrowRight className="h-3 w-3" />
                      </span>
                      <span className="text-[10px] text-zinc-450 font-mono">
                        {profile.documents.length} requirements
                      </span>
                    </div>

                    {(profile.category === 'admissions' || profile.id === 'mah-cet' || profile.id === 'jee-main' || profile.id === 'neet') && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onNavigateToPlaybook();
                        }}
                        className="w-full text-center text-[10px] font-extrabold py-2 bg-indigo-50 dark:bg-indigo-950/20 hover:bg-indigo-100 dark:hover:bg-indigo-900/60 border border-indigo-100/30 rounded-lg text-indigo-700 dark:text-indigo-300 transition cursor-pointer"
                      >
                        View Admission Roadmap →
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* V2/V3 Backlog scope boundaries */}
      <section className="premium-card p-6 mt-10 space-y-4 shadow-3xs" id="v2-backlog-disclaimer">
        <h4 className="text-xs font-black text-zinc-500 uppercase tracking-wider font-mono">
          V2 / V3 Development Backlog
        </h4>
        <div className="grid gap-4 sm:grid-cols-3 text-xs leading-relaxed text-zinc-400">
          <div className="space-y-1.5 bg-white/40 dark:bg-zinc-100/20 p-4.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 backdrop-blur-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
            <span className="font-extrabold text-zinc-700 dark:text-zinc-300 block font-heading">AI Chat Assistant</span>
            <span className="text-[11px] text-zinc-505 dark:text-zinc-400">Chatbot to explain specifications and give feedback on document uploads. (Postponed for V2)</span>
          </div>
          <div className="space-y-1.5 bg-white/40 dark:bg-zinc-100/20 p-4.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 backdrop-blur-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
            <span className="font-extrabold text-zinc-700 dark:text-zinc-300 block font-heading">OCR Auto-Rename</span>
            <span className="text-[11px] text-zinc-505 dark:text-zinc-400">Automatically scans certificates for candidate credentials and renames PDF files. (Postponed for V2)</span>
          </div>
          <div className="space-y-1.5 bg-white/40 dark:bg-zinc-100/20 p-4.5 rounded-xl border border-zinc-200/50 dark:border-zinc-800/40 backdrop-blur-xs hover:border-zinc-300 dark:hover:border-zinc-700 transition-all duration-300">
            <span className="font-extrabold text-zinc-700 dark:text-zinc-300 block font-heading">B2B API & White-Label</span>
            <span className="text-[11px] text-zinc-505 dark:text-zinc-400">Embedded validator toolkits for college and university admission portals. (Postponed for V3)</span>
          </div>
        </div>
      </section>
    </div>
  );
}
