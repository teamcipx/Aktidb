import React, { useState } from 'react';
import { X, FileText, Key, Eye, EyeOff, ShieldCheck, ShieldAlert, ArrowRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface PdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (includePassword: boolean) => void;
  title?: string;
  subtitle?: string;
  recordCount?: number;
}

export default function PdfExportModal({
  isOpen,
  onClose,
  onExport,
  title = "Export Vault PDF Report",
  subtitle = "Choose how passwords should be handled in the exported PDF document.",
  recordCount
}: PdfExportModalProps) {
  const [includePassword, setIncludePassword] = useState<boolean>(true);

  if (!isOpen) return null;

  const handleConfirm = () => {
    onExport(includePassword);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden font-sans border-t-2 border-t-indigo-500">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center p-5 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shrink-0">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100">{title}</h3>
              <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 space-y-4">
          
          {recordCount !== undefined && (
            <div className="px-3 py-2 bg-indigo-950/30 border border-indigo-800/40 rounded-lg text-xs font-semibold text-indigo-300 flex items-center justify-between">
              <span>Target Records to Export:</span>
              <span className="px-2 py-0.5 rounded bg-indigo-500/20 font-bold font-mono text-indigo-200">{recordCount} Entries</span>
            </div>
          )}

          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 pl-1">
            Select PDF Privacy Option
          </div>

          <div className="grid grid-cols-1 gap-3">
            
            {/* Option 1: With Passwords (Pass Soho) */}
            <button
              type="button"
              onClick={() => setIncludePassword(true)}
              className={cn(
                "flex items-start p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer relative overflow-hidden group",
                includePassword
                  ? "bg-indigo-950/40 border-indigo-500/80 shadow-md ring-1 ring-indigo-500/50"
                  : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-3.5 transition-colors",
                includePassword ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
              )}>
                <Eye className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    With Passwords <span className="text-xs font-medium text-indigo-400">(Pass Soho)</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                    Email + Pass
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Includes both <strong className="text-slate-200">Email/Username</strong> and <strong className="text-indigo-300">Passwords</strong> in the generated PDF tables. Best for full credential backups.
                </p>
              </div>
            </button>

            {/* Option 2: Without Passwords (Pass Sara) */}
            <button
              type="button"
              onClick={() => setIncludePassword(false)}
              className={cn(
                "flex items-start p-4 rounded-xl border text-left transition-all duration-150 cursor-pointer relative overflow-hidden group",
                !includePassword
                  ? "bg-amber-950/40 border-amber-500/80 shadow-md ring-1 ring-amber-500/50"
                  : "bg-slate-950/50 border-slate-800 hover:border-slate-700 hover:bg-slate-950"
              )}
            >
              <div className={cn(
                "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 mr-3.5 transition-colors",
                !includePassword ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400 group-hover:text-slate-200"
              )}>
                <EyeOff className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-bold text-sm text-slate-100 flex items-center gap-2">
                    Without Passwords <span className="text-xs font-medium text-amber-400">(Pass Sara)</span>
                  </span>
                  <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Email Only
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Includes <strong className="text-slate-200">Email/Username</strong> and details, but <strong className="text-amber-300">excludes all passwords</strong>. Safe for sharing or printing.
                </p>
              </div>
            </button>

          </div>

        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end gap-3 p-4 bg-slate-950/80 border-t border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-indigo-600/30 hover:scale-105 active:scale-95"
          >
            <span>Download PDF</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

      </div>
    </div>
  );
}
