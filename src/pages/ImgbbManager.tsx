import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Image, Key, Copy, Trash2, Plus, Zap, CheckCircle2, AlertCircle, RefreshCw, Sparkles, Layers, ShieldCheck, FileText, Check } from 'lucide-react';

interface ImgbbKey {
  id: string;
  api_key: string;
  note?: string;
  created_at: string;
}

const LOCAL_STORAGE_KEY = 'zxhub_imgbb_api_keys_backup';

export default function ImgbbManager() {
  const [keys, setKeys] = useState<ImgbbKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [dispenseLoading, setDispenseLoading] = useState(false);
  
  // Storage input state
  const [rawInput, setRawInput] = useState('');
  const [noteInput, setNoteInput] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Dispenser state
  const [amount, setAmount] = useState<number | string>(1);
  const [dispenseSuccessModal, setDispenseSuccessModal] = useState<{
    copiedKeys: string[];
    count: number;
  } | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedKeyId, setCopiedKeyId] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const getLocalKeys = (): ImgbbKey[] => {
    try {
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  };

  const saveLocalKeys = (list: ImgbbKey[]) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(list));
    } catch (e) {
      console.error('Failed to save local keys', e);
    }
  };

  const fetchKeys = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const { data, error } = await supabase
        .from('imgbb_api_keys')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, using local storage fallback:', error.message);
        const local = getLocalKeys();
        setKeys(local);
      } else {
        setKeys(data || []);
        saveLocalKeys(data || []);
      }
    } catch (err: any) {
      console.warn('Network error, loading local backup keys');
      setKeys(getLocalKeys());
    } finally {
      setLoading(false);
    }
  };

  // Submit keys to store
  const handleSubmitKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!rawInput.trim()) {
      setErrorMsg('Please enter at least one ImgBB API key.');
      return;
    }

    // Split input by newlines, commas, or spaces
    const lines = rawInput
      .split(/[\n,\s]+/)
      .map(k => k.trim())
      .filter(k => k.length > 5); // Basic validation

    if (lines.length === 0) {
      setErrorMsg('No valid API keys found in input.');
      return;
    }

    setSubmitLoading(true);

    const newRecords = lines.map(keyStr => ({
      api_key: keyStr,
      note: noteInput.trim() || 'ImgBB API Key',
      created_at: new Date().toISOString()
    }));

    try {
      const { data, error } = await supabase
        .from('imgbb_api_keys')
        .insert(newRecords)
        .select();

      if (error) {
        console.warn('Supabase insert warning, saving locally:', error.message);
        // Fallback local save with pseudo IDs
        const localCurrent = getLocalKeys();
        const fallbackItems: ImgbbKey[] = newRecords.map((r, idx) => ({
          id: `local-${Date.now()}-${idx}`,
          api_key: r.api_key,
          note: r.note,
          created_at: r.created_at
        }));
        const updated = [...fallbackItems, ...localCurrent];
        setKeys(updated);
        saveLocalKeys(updated);
        setSuccessMsg(`Successfully stored ${fallbackItems.length} ImgBB API key(s) locally!`);
      } else {
        const added = data || [];
        setSuccessMsg(`Successfully stored ${added.length} ImgBB API key(s) in Vault!`);
        await fetchKeys();
      }

      setRawInput('');
      setNoteInput('');
    } catch (err: any) {
      setErrorMsg('Error storing keys: ' + (err.message || 'Unknown error'));
    } finally {
      setSubmitLoading(false);
    }
  };

  // DISPENSE FUNCTION: Get exact amount, copy to clipboard, and delete from DB!
  const handleDispense = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setErrorMsg('');
    
    const qty = parseInt(String(amount), 10);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg('Please enter a valid amount greater than 0.');
      return;
    }

    if (keys.length === 0) {
      setErrorMsg('No ImgBB API keys available in storage! Please submit new keys first.');
      return;
    }

    const availableCount = keys.length;
    const actualQty = Math.min(qty, availableCount);
    
    setDispenseLoading(true);

    // Pick top `actualQty` keys
    const targetKeys = keys.slice(0, actualQty);
    const targetIds = targetKeys.map(k => k.id);
    const keyStrings = targetKeys.map(k => k.api_key);

    try {
      // Copy keys to clipboard
      const textToCopy = keyStrings.join('\n');
      await navigator.clipboard.writeText(textToCopy);

      // Delete consumed keys from Supabase
      const { error } = await supabase
        .from('imgbb_api_keys')
        .delete()
        .in('id', targetIds);

      if (error) {
        console.warn('Supabase delete error, updating local storage:', error.message);
      }

      // Update state & local storage
      const remainingKeys = keys.filter(k => !targetIds.includes(k.id));
      setKeys(remainingKeys);
      saveLocalKeys(remainingKeys);

      // Open Success modal/card
      setDispenseSuccessModal({
        copiedKeys: keyStrings,
        count: keyStrings.length
      });

      setSuccessMsg(`Dispensed & Copied ${keyStrings.length} key(s)! Keys deleted from vault.`);
    } catch (err: any) {
      setErrorMsg('Failed to copy to clipboard or delete keys: ' + err.message);
    } finally {
      setDispenseLoading(false);
    }
  };

  const handleCopySingleKey = async (keyItem: ImgbbKey) => {
    try {
      await navigator.clipboard.writeText(keyItem.api_key);
      setCopiedKeyId(keyItem.id);
      setTimeout(() => setCopiedKeyId(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteSingleKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this key?')) return;
    try {
      await supabase.from('imgbb_api_keys').delete().eq('id', id);
      const updated = keys.filter(k => k.id !== id);
      setKeys(updated);
      saveLocalKeys(updated);
    } catch (e) {
      console.error(e);
    }
  };

  const handleClearAll = async () => {
    if (!confirm(`Are you sure you want to delete ALL ${keys.length} ImgBB API keys? This cannot be undone.`)) return;
    try {
      const ids = keys.map(k => k.id);
      await supabase.from('imgbb_api_keys').delete().in('id', ids);
      setKeys([]);
      saveLocalKeys([]);
      setSuccessMsg('All keys cleared from vault.');
    } catch (e) {
      console.error(e);
    }
  };

  const filteredKeys = keys.filter(k => 
    k.api_key.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (k.note && k.note.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-6 flex flex-col h-full font-sans text-slate-100 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl backdrop-blur-xl shadow-lg">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-gradient-to-tr from-teal-500 to-indigo-600 rounded-xl shadow-md shadow-teal-500/20 text-white">
            <Image className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-extrabold text-white uppercase tracking-wider font-display">
                ImgBB API Storage & Dispenser
              </h1>
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[10px] font-bold uppercase tracking-widest">
                Auto-Consume
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Submit ImgBB API keys in bulk. Enter an amount to automatically copy keys to clipboard and delete them from vault.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl">
            <Key className="w-4 h-4 text-teal-400" />
            <div className="flex flex-col">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">Available Keys</span>
              <span className="text-base font-extrabold text-teal-300 leading-none">{keys.length}</span>
            </div>
          </div>
          <button
            onClick={fetchKeys}
            disabled={loading}
            className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all active:scale-95"
            title="Refresh Vault"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-teal-400' : ''}`} />
          </button>
        </div>
      </div>

      {/* Alert Banners */}
      {successMsg && (
        <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-300 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{successMsg}</span>
          </div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-400 hover:text-emerald-200">×</button>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 bg-rose-500/10 border border-rose-500/30 rounded-xl text-rose-300 text-xs font-semibold flex items-center justify-between animate-fade-in">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
          <button onClick={() => setErrorMsg('')} className="text-rose-400 hover:text-rose-200">×</button>
        </div>
      )}

      {/* Grid Layout: Dispenser & Bulk Storage Submit */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* DISPENSER CARD (Amount -> Copy & Delete) */}
        <div className="lg:col-span-5 bg-gradient-to-b from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-500/30 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none text-indigo-400">
            <Zap className="w-32 h-32" />
          </div>

          <div>
            <div className="flex items-center gap-2 mb-3">
              <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                <Zap className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">Instant Key Dispenser</h2>
                <span className="text-[11px] font-semibold text-indigo-300">Amount enter = Auto Copy & Delete</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 mb-5 leading-relaxed bg-slate-950/50 p-3.5 rounded-xl border border-slate-800/80">
              Enter required amount of keys. Pressing <kbd className="px-1.5 py-0.5 bg-slate-800 text-indigo-300 rounded text-[10px] font-mono border border-slate-700">Enter</kbd> or clicking dispense will copy those keys to your clipboard and immediately consume (delete) them from vault.
            </p>

            <form onSubmit={handleDispense} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                  <span>Enter Amount / Quantity</span>
                  <span className="text-[10px] text-teal-400 font-normal">Stock: {keys.length} keys</span>
                </label>
                <div className="relative flex items-center">
                  <input
                    type="number"
                    min="1"
                    max={keys.length || 1}
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleDispense();
                      }
                    }}
                    placeholder="Enter amount e.g. 1, 5, 10"
                    className="w-full px-4 py-3 bg-slate-950 border border-indigo-500/40 rounded-xl text-lg font-bold text-white focus:ring-2 focus:ring-indigo-500 outline-none font-mono tracking-wider shadow-inner"
                  />
                  <div className="absolute right-2 flex items-center gap-1">
                    {[1, 3, 5, 10].map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setAmount(preset)}
                        className={`px-2 py-1 text-[10px] font-bold rounded-lg border transition-all ${
                          Number(amount) === preset
                            ? 'bg-indigo-600 text-white border-indigo-500'
                            : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={dispenseLoading || keys.length === 0}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-teal-500 via-indigo-600 to-purple-600 hover:from-teal-400 hover:via-indigo-500 hover:to-purple-500 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl shadow-lg shadow-indigo-600/30 flex items-center justify-center space-x-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none"
              >
                {dispenseLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Dispensing & Copying...</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Dispense & Copy {amount || 1} Key(s)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <span className="flex items-center gap-1.5 text-emerald-400">
              <ShieldCheck className="w-3.5 h-3.5" /> Direct Clipboard Access
            </span>
            <span className="text-slate-500">Auto-Purge Active</span>
          </div>
        </div>

        {/* BULK STORAGE SUBMIT CARD */}
        <div className="lg:col-span-7 bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-teal-500/20 text-teal-400 border border-teal-500/30">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-extrabold uppercase tracking-wider text-white">Store ImgBB API Keys</h2>
                  <span className="text-[11px] font-semibold text-teal-300">Submit single or multi-line bulk keys</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmitKeys} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  ImgBB API Key(s) <span className="text-rose-400">*</span>
                </label>
                <textarea
                  rows={4}
                  value={rawInput}
                  onChange={(e) => setRawInput(e.target.value)}
                  placeholder="Paste ImgBB API key(s) here. Multiple keys can be separated by newlines, commas or spaces e.g.
3b84f29a01...
9e01d3a772...
a82f102c91..."
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-100 focus:ring-1 focus:ring-teal-500 outline-none resize-none leading-relaxed"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-300">
                  Tag / Label / Note <span className="text-slate-500 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  value={noteInput}
                  onChange={(e) => setNoteInput(e.target.value)}
                  placeholder="e.g. Batch 2026, Free tier accounts, Production app"
                  className="w-full px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-100 focus:ring-1 focus:ring-teal-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end pt-2">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="px-6 py-2.5 bg-teal-600 hover:bg-teal-500 text-white text-xs font-extrabold uppercase tracking-widest rounded-xl shadow-md flex items-center space-x-2 transition-all hover:scale-[1.01] active:scale-[0.98] disabled:opacity-50"
                >
                  {submitLoading ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving to Storage...</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-4 h-4" />
                      <span>Submit Keys to Storage</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

      </div>

      {/* DISPENSED RESULT MODAL */}
      {dispenseSuccessModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-slate-900 border border-teal-500/40 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-teal-400 border-b border-slate-800 pb-3">
              <CheckCircle2 className="w-6 h-6 shrink-0" />
              <div>
                <h3 className="text-base font-extrabold uppercase tracking-wider text-white">
                  {dispenseSuccessModal.count} Key(s) Copied & Deleted!
                </h3>
                <p className="text-xs text-teal-300">Keys are already copied to your clipboard and consumed from vault.</p>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Copied Keys Preview:</label>
              <pre className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-teal-300 max-h-48 overflow-y-auto whitespace-pre-wrap break-all">
                {dispenseSuccessModal.copiedKeys.join('\n')}
              </pre>
            </div>

            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-slate-400">Remaining Keys in Vault: <strong className="text-white">{keys.length}</strong></span>
              <button
                onClick={() => setDispenseSuccessModal(null)}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all"
              >
                Close & Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* VAULT STORED KEYS TABLE */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-lg flex-1 flex flex-col">
        {/* Table Header Controls */}
        <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950/40">
          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <Key className="w-4 h-4 text-teal-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-200">
              Stored ImgBB API Vault ({filteredKeys.length})
            </h3>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter keys or note..."
              className="px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 focus:ring-1 focus:ring-teal-500 outline-none w-full sm:w-48"
            />

            {keys.length > 0 && (
              <button
                onClick={handleClearAll}
                className="px-3 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center space-x-1.5 transition-all shrink-0"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Vault</span>
              </button>
            )}
          </div>
        </div>

        {/* Table Content */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 border-b border-slate-800 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">ImgBB API Key</th>
                <th className="py-3 px-4">Label / Note</th>
                <th className="py-3 px-4">Added Date</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-teal-400" />
                    <span>Loading ImgBB Vault...</span>
                  </td>
                </tr>
              ) : filteredKeys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Image className="w-8 h-8 mx-auto mb-2 text-slate-600 opacity-60" />
                    <p className="font-semibold text-slate-300">No ImgBB API Keys Stored</p>
                    <p className="text-[11px] text-slate-500 mt-1">Submit new keys above to populate the vault.</p>
                  </td>
                </tr>
              ) : (
                filteredKeys.map((item, idx) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition-colors group">
                    <td className="py-3 px-4 font-mono text-slate-500 text-center font-bold">
                      {idx + 1}
                    </td>
                    <td className="py-3 px-4 font-mono font-semibold text-teal-300 select-all">
                      {item.api_key}
                    </td>
                    <td className="py-3 px-4 text-slate-300">
                      {item.note || <span className="text-slate-600 italic">No note</span>}
                    </td>
                    <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '-'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => handleCopySingleKey(item)}
                          className="p-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all"
                          title="Copy Key"
                        >
                          {copiedKeyId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteSingleKey(item.id)}
                          className="p-1.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 transition-all"
                          title="Delete Key"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
