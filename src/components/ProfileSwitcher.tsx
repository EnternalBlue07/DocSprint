import React, { useEffect } from 'react';
import { X, Sparkles, BookOpen, Layers, CheckSquare } from 'lucide-react';
import { APPLICATION_PROFILES } from '../profilesData';
import { ApplicationProfile, ProcessedFile } from '../types';
import VaultManager from './VaultManager';

interface ProfileSwitcherProps {
  isOpen: boolean;
  onClose: () => void;
  activeProfile: ApplicationProfile | null;
  onSelectProfile: (profile: ApplicationProfile | null) => void;
  sessionFiles: Record<string, ProcessedFile>;
  onRestoreFiles: (files: Record<string, ProcessedFile>) => void;
  onClearSession: () => void;
}

export default function ProfileSwitcher({
  isOpen,
  onClose,
  activeProfile,
  onSelectProfile,
  sessionFiles,
  onRestoreFiles,
  onClearSession,
}: ProfileSwitcherProps) {
  // ESC key handler
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

  // Group profiles by category
  const categories = APPLICATION_PROFILES.reduce((acc, profile) => {
    const cat = profile.category || 'General';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(profile);
    return acc;
  }, {} as Record<string, ApplicationProfile[]>);

  return (
    <div className="fixed inset-0 z-50 flex justify-end" id="profile-switcher-sheet">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-zinc-950/60 backdrop-blur-xs transition-opacity animate-fadeIn"
        onClick={onClose}
      />

      {/* Drawer panel */}
      <div
        className="w-full sm:max-w-md bg-white dark:bg-zinc-900 h-full shadow-2xl border-l border-zinc-200 dark:border-zinc-800 flex flex-col transition-transform duration-300 ease-out transform translate-x-0 relative z-10"
        id="profile-switcher-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Spec Profile Switcher and Local Vault"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-950/20 shrink-0">
          <div>
            <h2 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5 font-mono">
              <Layers className="h-4 w-4 text-indigo-650" />
              Target Rules Profiles
            </h2>
            <p className="text-[10px] text-zinc-500 mt-0.5 font-sans">
              Choose admission guidelines to check files against
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-zinc-200 dark:hover:bg-zinc-800 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition cursor-pointer"
            aria-label="Close panel"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable list & Vault */}
        <div className="flex-1 overflow-y-auto divide-y divide-zinc-200 dark:divide-zinc-800">
          
          {/* Rules Profile Selector */}
          <div className="p-6 space-y-4">
            <h3 className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-widest">
              Available Admissions Schemes
            </h3>
            
            {/* Custom sandbox button */}
            <button
              onClick={() => {
                onSelectProfile(null);
                onClose();
              }}
              className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition cursor-pointer ${
                activeProfile === null
                  ? 'border-indigo-600 bg-indigo-50/50 text-indigo-905 dark:bg-indigo-950/20 dark:text-indigo-300'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/50 text-zinc-700 dark:text-zinc-300'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${activeProfile === null ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-xs font-bold">Custom Sandbox (No Profile)</h4>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Edit and compress without checking rules</p>
                </div>
              </div>
              {activeProfile === null && (
                <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400" />
              )}
            </button>

            {/* Grouped Profiles list */}
            {Object.entries(categories).map(([category, profiles]) => {
              return (
                <div key={category} className="space-y-2 pt-2">
                  <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider font-mono">
                    {category}
                  </span>
                  <div className="grid gap-2">
                    {profiles.map((p) => {
                      const isSelected = activeProfile?.id === p.id;
                      return (
                        <button
                          key={p.id}
                          onClick={() => {
                            onSelectProfile(p);
                            onClose();
                          }}
                          className={`w-full flex items-center justify-between rounded-xl border p-3.5 text-left transition cursor-pointer ${
                            isSelected
                              ? 'border-indigo-600 bg-indigo-50/50 text-indigo-905 dark:bg-indigo-950/20 dark:text-indigo-300'
                              : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-950/50 text-zinc-700 dark:text-zinc-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className={`p-2 rounded-lg shrink-0 ${isSelected ? 'bg-indigo-600 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                              <BookOpen className="h-4 w-4" />
                            </div>
                            <div className="min-w-0">
                              <h4 className="text-xs font-bold truncate text-zinc-800 dark:text-white">{p.name}</h4>
                              <p className="text-[10px] text-zinc-400 truncate mt-0.5">{p.documents.length} specifications active</p>
                            </div>
                          </div>
                          {isSelected && (
                            <span className="h-2 w-2 rounded-full bg-indigo-600 dark:bg-indigo-400 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Secure Local Vault Panel */}
          <div className="p-6">
            <VaultManager
              sessionFiles={sessionFiles}
              onRestoreFiles={onRestoreFiles}
              onClearSession={onClearSession}
            />
          </div>

        </div>
      </div>
    </div>
  );
}
