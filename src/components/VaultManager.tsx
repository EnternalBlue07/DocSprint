import React, { useState, useEffect } from 'react';
import { Lock, Unlock, Database, Key, Trash2, Download, Upload, ShieldCheck, Sparkles, FolderOpen, RefreshCw } from 'lucide-react';
import { encryptData, decryptData } from '../utils/vaultCrypto';
import { ProcessedFile } from '../types';

interface VaultManagerProps {
  sessionFiles: Record<string, ProcessedFile>;
  onRestoreFiles: (files: Record<string, ProcessedFile>) => void;
  onClearSession: () => void;
}

interface VaultData {
  files: Record<string, ProcessedFile>;
  profileDetails: {
    fullName?: string;
    dob?: string;
    category?: string;
    rollNumber?: string;
    board?: string;
  };
}

export default function VaultManager({
  sessionFiles,
  onRestoreFiles,
  onClearSession,
}: VaultManagerProps) {
  const [hasVault, setHasVault] = useState(false);
  const [isLocked, setIsLocked] = useState(true);
  const [passphrase, setPassphrase] = useState('');
  const [error, setError] = useState('');
  const [vaultContent, setVaultContent] = useState<VaultData | null>(null);
  const [details, setDetails] = useState<VaultData['profileDetails']>({});
  const [successMsg, setSuccessMsg] = useState('');

  // Check if encrypted vault exists on mount
  useEffect(() => {
    const raw = localStorage.getItem('docsprint_vault');
    setHasVault(!!raw);
  }, []);

  const handleCreateOrUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    if (!passphrase.trim()) {
      setError('Please enter a valid passphrase');
      return;
    }

    const raw = localStorage.getItem('docsprint_vault');
    if (!raw) {
      // Create a brand new empty vault
      try {
        const emptyData: VaultData = { files: {}, profileDetails: {} };
        const encrypted = await encryptData(JSON.stringify(emptyData), passphrase);
        localStorage.setItem('docsprint_vault', encrypted);
        setHasVault(true);
        setIsLocked(false);
        setVaultContent(emptyData);
        setDetails({});
        setSuccessMsg('New Local Vault successfully created and encrypted!');
      } catch (err) {
        setError('Encryption error occurred.');
      }
    } else {
      // Decrypt existing vault
      try {
        const decrypted = await decryptData(raw, passphrase);
        const parsed = JSON.parse(decrypted) as VaultData;
        setVaultContent(parsed);
        setDetails(parsed.profileDetails || {});
        setIsLocked(false);
        setSuccessMsg('Vault decrypted and unlocked successfully.');
      } catch (err) {
        setError('Incorrect passphrase. Decryption failed.');
      }
    }
  };

  const handleSaveToVault = async () => {
    if (isLocked || !vaultContent) return;
    setError('');
    setSuccessMsg('');

    try {
      const updatedData: VaultData = {
        files: {
          ...vaultContent.files,
          ...sessionFiles,
        },
        profileDetails: details,
      };

      const encrypted = await encryptData(JSON.stringify(updatedData), passphrase);
      localStorage.setItem('docsprint_vault', encrypted);
      setVaultContent(updatedData);
      setSuccessMsg('All session documents and fields successfully encrypted to Vault!');
    } catch (err) {
      setError('Error encrypting and saving to vault.');
    }
  };

  const handleRestoreFromVault = () => {
    if (!vaultContent) return;
    const filesCount = Object.keys(vaultContent.files).length;
    if (filesCount === 0) {
      alert('Vault is currently empty. Save some files first!');
      return;
    }
    onRestoreFiles(vaultContent.files);
    setSuccessMsg(`Successfully restored ${filesCount} file(s) into current workspace!`);
  };

  const handleWipeVault = () => {
    if (!window.confirm('WARNING: This will permanently delete your encrypted vault from this browser. Are you sure?')) {
      return;
    }
    localStorage.removeItem('docsprint_vault');
    setHasVault(false);
    setIsLocked(true);
    setVaultContent(null);
    setDetails({});
    setPassphrase('');
    setError('');
    setSuccessMsg('Vault successfully wiped from disk.');
  };

  const handleExportVault = () => {
    const raw = localStorage.getItem('docsprint_vault');
    if (!raw) return;
    const blob = new Blob([raw], { type: 'application/octet-stream' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `docsprint_encrypted_vault_${Date.now()}.bin`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportVault = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      if (content) {
        localStorage.setItem('docsprint_vault', content.trim());
        setHasVault(true);
        setIsLocked(true);
        setVaultContent(null);
        setPassphrase('');
        setSuccessMsg('Encrypted vault file successfully imported. Enter passphrase to unlock.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-100 p-6 space-y-5 shadow-xs" id="vault-manager">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-805 pb-3">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-indigo-700 dark:text-indigo-400" />
          <h3 className="text-sm font-bold text-zinc-900 dark:text-white flex items-center gap-1.5">
            Zero-Knowledge Local Vault
            <span className="rounded bg-indigo-50 dark:bg-indigo-950/40 px-2 py-0.5 text-[9px] font-bold font-mono text-indigo-850 dark:text-indigo-300 tracking-wider">
              AES-256 GCM
            </span>
          </h3>
        </div>
        <span className="text-[10px] font-mono text-zinc-400 dark:text-zinc-650">
          {isLocked ? '🔒 LOCKED' : '🔓 UNLOCKED'}
        </span>
      </div>

      {isLocked ? (
        // LOCKED STATE
        <form onSubmit={handleCreateOrUnlock} className="space-y-4">
          <p className="text-xs text-zinc-550 dark:text-zinc-400 leading-relaxed">
            {hasVault
              ? 'Enter your passphrase to decrypt and load your encrypted workspace documents. No server holds this key.'
              : 'Setup a secure password to encrypt documents directly inside your browser storage (IndexedDB/localStorage).'}
          </p>

          <div className="space-y-2">
            <label className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-widest block">
              Vault Passphrase
            </label>
            <div className="flex gap-2">
              <input
                type="password"
                required
                value={passphrase}
                onChange={(e) => setPassphrase(e.target.value)}
                placeholder={hasVault ? 'Enter passphrase to decrypt...' : 'Choose a strong passphrase...'}
                className="flex-1 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white px-3 py-2 text-xs focus:outline-none"
              />
              <button
                type="submit"
                className="h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                {hasVault ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                {hasVault ? 'Unlock' : 'Create Vault'}
              </button>
            </div>
          </div>

          {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
          {successMsg && <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{successMsg}</p>}

          {hasVault && (
            <div className="pt-3 border-t border-zinc-100 dark:border-zinc-800 flex justify-between items-center text-[10px] font-mono text-zinc-400">
              <label className="hover:text-zinc-650 cursor-pointer flex items-center gap-1">
                <Upload className="h-3 w-3" />
                Import Vault File
                <input
                  type="file"
                  onChange={handleImportVault}
                  accept=".bin,.json"
                  className="hidden"
                />
              </label>
              <button
                type="button"
                onClick={handleWipeVault}
                className="text-rose-650 hover:underline flex items-center gap-1"
              >
                <Trash2 className="h-3 w-3" /> Wipe Password
              </button>
            </div>
          )}
        </form>
      ) : (
        // UNLOCKED STATE
        <div className="space-y-5">
          <p className="text-xs text-zinc-550 dark:text-zinc-400">
            Vault Decrypted. You can now prefill fields and restore saved documents back into the active workspace.
          </p>

          {/* Form details autofill input */}
          <div className="grid gap-3 sm:grid-cols-2 bg-zinc-50/50 dark:bg-zinc-900/30 p-4 rounded-xl border border-zinc-100 dark:border-zinc-805">
            <h4 className="sm:col-span-2 text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-widest">
              Profile Autofill Information
            </h4>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-mono">Full Name</span>
              <input
                type="text"
                value={details.fullName || ''}
                onChange={(e) => setDetails({ ...details, fullName: e.target.value })}
                placeholder="Applicant name"
                className="w-full text-xs h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-mono">DOB</span>
              <input
                type="date"
                value={details.dob || ''}
                onChange={(e) => setDetails({ ...details, dob: e.target.value })}
                className="w-full text-xs h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-mono">Category</span>
              <input
                type="text"
                value={details.category || ''}
                onChange={(e) => setDetails({ ...details, category: e.target.value })}
                placeholder="General, OBC, SC/ST, EWS..."
                className="w-full text-xs h-9 rounded-lg"
              />
            </div>
            <div className="space-y-1">
              <span className="text-[10px] text-zinc-450 dark:text-zinc-500 font-mono">Roll Number / Marksheet No</span>
              <input
                type="text"
                value={details.rollNumber || ''}
                onChange={(e) => setDetails({ ...details, rollNumber: e.target.value })}
                placeholder="Roll No"
                className="w-full text-xs h-9 rounded-lg"
              />
            </div>
          </div>

          {/* Saved Files Inventory */}
          <div className="space-y-2">
            <h4 className="text-[10px] font-bold font-mono text-zinc-400 uppercase tracking-widest">
              Encrypted Document Inventory ({(vaultContent?.files ? Object.keys(vaultContent.files).length : 0)} files)
            </h4>
            {vaultContent?.files && Object.keys(vaultContent.files).length > 0 ? (
              <div className="max-h-28 overflow-y-auto border border-zinc-200 dark:border-zinc-800 rounded-lg p-2 divide-y divide-zinc-100 dark:divide-zinc-805 text-xs">
                {Object.values(vaultContent.files).map((f) => (
                  <div key={f.id} className="py-1.5 flex justify-between items-center">
                    <span className="font-semibold text-zinc-700 dark:text-zinc-300 truncate max-w-[200px]">{f.name}</span>
                    <span className="text-[10px] text-zinc-450 font-mono">{(f.size / 1024).toFixed(0)} KB</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-zinc-450 italic">No files currently saved in the vault.</p>
            )}
          </div>

          {error && <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">{error}</p>}
          {successMsg && <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">{successMsg}</p>}

          {/* Action Row */}
          <div className="flex flex-wrap gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800 justify-between">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSaveToVault}
                className="h-9 px-4 rounded-lg bg-indigo-650 hover:bg-indigo-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <FolderOpen className="h-3.5 w-3.5" />
                Encrypt Current Session Files
              </button>
              {vaultContent?.files && Object.keys(vaultContent.files).length > 0 && (
                <button
                  type="button"
                  onClick={handleRestoreFromVault}
                  className="h-9 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="h-3.5 w-3.5" />
                  Restore Files to Workspace
                </button>
              )}
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleExportVault}
                title="Download backup file (.bin)"
                className="h-9 w-9 flex items-center justify-center rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 text-zinc-650 transition cursor-pointer"
              >
                <Download className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsLocked(true);
                  setPassphrase('');
                  setVaultContent(null);
                }}
                className="h-9 px-4 rounded-lg border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-100 text-zinc-650 text-xs font-bold transition cursor-pointer"
              >
                Lock Vault
              </button>
              <button
                type="button"
                onClick={handleWipeVault}
                className="h-9 px-4 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-bold transition cursor-pointer"
              >
                Wipe Vault
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
