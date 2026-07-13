import React, { useState, useEffect, useRef } from 'react';
import { Search, Sparkles, Camera, PenTool, FileText, Shield, Layers, BookOpen, Clock, Settings } from 'lucide-react';
import { APPLICATION_PROFILES } from '../profilesData';
import { ApplicationProfile } from '../types';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectStudio: (studio: 'home' | 'photo' | 'signature' | 'pdf' | 'document' | 'privacy' | 'batch' | 'examkit' | 'playbook') => void;
  onSelectProfile: (profile: ApplicationProfile) => void;
}

interface CommandItem {
  id: string;
  name: string;
  category: 'studios' | 'profiles' | 'actions';
  subtitle?: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

export default function CommandPalette({
  isOpen,
  onClose,
  onSelectStudio,
  onSelectProfile,
}: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const listRef = useRef<HTMLDivElement | null>(null);

  // Focus input when palette opens
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      // Brief timeout to ensure DOM is ready
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Global listener for Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Build command list
  const commands: CommandItem[] = [
    // Studios
    { id: 'photo', name: 'Photo Studio', category: 'studios', subtitle: 'Face crop, background segments, compress', icon: Camera, action: () => { onSelectStudio('photo'); onClose(); } },
    { id: 'signature', name: 'Signature Studio', category: 'studios', subtitle: 'Contrast, bleach white, transparency', icon: PenTool, action: () => { onSelectStudio('signature'); onClose(); } },
    { id: 'pdf', name: 'PDF Toolkit', category: 'studios', subtitle: 'Merge, split, rotate, convert to PDF', icon: FileText, action: () => { onSelectStudio('pdf'); onClose(); } },
    { id: 'document', name: 'Document Scanner', category: 'studios', subtitle: 'Perspective warping, edge detection', icon: Camera, action: () => { onSelectStudio('document'); onClose(); } },
    { id: 'playbook', name: 'Admission Roadmaps & Playbooks', category: 'studios', subtitle: 'Exams timeline, schedules, checklist', icon: BookOpen, action: () => { onSelectStudio('playbook'); onClose(); } },
    { id: 'batch', name: 'Batch Mode Optimizer', category: 'studios', subtitle: 'Process multiple files at once', icon: Layers, action: () => { onSelectStudio('batch'); onClose(); } },
    { id: 'examkit', name: 'Exam Day Kit', category: 'studios', subtitle: 'Print preview, checklist aggregator', icon: Sparkles, action: () => { onSelectStudio('examkit'); onClose(); } },
    // Actions
    { id: 'privacy', name: 'Privacy Dashboard', category: 'actions', subtitle: 'RAM Deletion logs, security parameters', icon: Shield, action: () => { onSelectStudio('privacy'); onClose(); } },
    { id: 'home', name: 'Go to Home / Dashboard', category: 'actions', subtitle: 'Reset workspace, select target', icon: Settings, action: () => { onSelectStudio('home'); onClose(); } },
    // Application Profiles
    ...APPLICATION_PROFILES.map((profile) => ({
      id: `profile-${profile.id}`,
      name: profile.name,
      category: 'profiles' as const,
      subtitle: `Syllabus checklist: ${profile.documents.length} rules loaded`,
      icon: Sparkles,
      action: () => {
        onSelectProfile(profile);
        onSelectStudio('home');
        onClose();
      },
    })),
  ];

  // Filter commands
  const filtered = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase()) ||
    cmd.subtitle?.toLowerCase().includes(query.toLowerCase()) ||
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % filtered.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filtered.length) % filtered.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
      }
    }
  };

  // Scroll selected item into view if needed
  const scrollItemIntoView = (index: number) => {
    const container = listRef.current;
    if (!container) return;
    const items = container.querySelectorAll('[role="option"]');
    const selected = items[index] as HTMLElement;
    if (!selected) return;

    const containerTop = container.scrollTop;
    const containerBottom = containerTop + container.clientHeight;
    const selectedTop = selected.offsetTop;
    const selectedBottom = selectedTop + selected.clientHeight;

    if (selectedTop < containerTop) {
      container.scrollTop = selectedTop;
    } else if (selectedBottom > containerBottom) {
      container.scrollTop = selectedBottom - container.clientHeight;
    }
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center p-4 sm:p-6 md:p-20 bg-zinc-950/70 backdrop-blur-xs animate-fadeIn"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl bg-white dark:bg-zinc-100 rounded-2xl shadow-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden flex flex-col max-h-[80vh] translate-y-10 transition-all duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
      >
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <Search className="h-5 w-5 text-zinc-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a command or target form name (e.g. Photo, JEE)..."
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            className="w-full text-sm outline-none border-none focus:ring-0 text-zinc-900 bg-transparent"
          />
          <kbd className="hidden sm:inline-flex items-center h-5 select-none gap-0.5 rounded border border-zinc-300 dark:border-zinc-700 bg-zinc-100 dark:bg-zinc-800 px-1.5 font-mono text-[10px] font-bold text-zinc-500">
            ESC
          </kbd>
        </div>

        {/* Command list */}
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto p-2 space-y-1.5"
          style={{ minHeight: 180 }}
          role="listbox"
        >
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-zinc-400">
              <Search className="h-8 w-8 text-zinc-300 mx-auto mb-2 animate-pulse" />
              <p className="text-xs font-semibold text-zinc-700 dark:text-zinc-500">No matches found</p>
              <p className="text-[10px] text-zinc-400 mt-0.5">Try searching for generic studios like "Photo" or "PDF"</p>
            </div>
          ) : (
            // Group by category
            (['studios', 'actions', 'profiles'] as const).map((cat) => {
              const items = filtered.filter((c) => c.category === cat);
              if (items.length === 0) return null;

              return (
                <div key={cat} className="space-y-1">
                  <div className="text-[9px] font-bold font-mono text-zinc-400 uppercase tracking-widest px-2.5 py-1">
                    {cat === 'studios' ? 'Studio Toolkits' : cat === 'actions' ? 'Sandboxed Operations' : 'Target Application Profiles'}
                  </div>
                  {items.map((cmd) => {
                    const globalIdx = filtered.indexOf(cmd);
                    const isSelected = globalIdx === selectedIndex;

                    if (isSelected) {
                      scrollItemIntoView(globalIdx);
                    }

                    return (
                      <div
                        key={cmd.id}
                        role="option"
                        aria-selected={isSelected}
                        onClick={cmd.action}
                        className={`flex items-center gap-3 rounded-xl px-3 py-2 cursor-pointer transition select-none ${
                          isSelected
                            ? 'bg-indigo-600 text-white shadow-sm'
                            : 'hover:bg-zinc-50 dark:hover:bg-zinc-800/40 text-zinc-800'
                        }`}
                      >
                        <div className={`p-2 rounded-lg ${isSelected ? 'bg-indigo-700 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400'}`}>
                          <cmd.icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className={`text-xs font-bold truncate ${isSelected ? 'text-white' : 'text-zinc-900'}`}>
                            {cmd.name}
                          </p>
                          {cmd.subtitle && (
                            <p className={`text-[10px] truncate ${isSelected ? 'text-indigo-200' : 'text-zinc-400 dark:text-zinc-500'}`}>
                              {cmd.subtitle}
                            </p>
                          )}
                        </div>
                        {isSelected && (
                          <span className="text-[10px] font-bold font-mono bg-indigo-700 text-indigo-100 px-1.5 py-0.5 rounded">
                            ENTER
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
