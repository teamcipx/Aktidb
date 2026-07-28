import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Lock, Search as SearchIcon, Save, Plus, ChevronDown, CheckCircle2, Copy } from 'lucide-react';
import { format } from 'date-fns';

type SlotType = 'NONE' | 'FB' | 'IG';

interface SlotData {
  type: SlotType;
  username?: string;
  password?: string;
  two_fa?: string;
  hotmail?: string;
  cookies?: string;
}

interface LockedAccount {
  id?: string;
  gmail: string;
  password: string;
  slots: SlotData[];
  created_at?: string;
}

const DEFAULT_SLOTS: SlotData[] = [
  { type: 'NONE' }, { type: 'NONE' }, { type: 'NONE' }, { type: 'NONE' }
];

export default function PublicWorkspace() {
  const [activeTab, setActiveTab] = useState<'create' | 'search'>('create');
  
  // Form State
  const [gmail, setGmail] = useState('');
  const [password, setPassword] = useState('');
  const [slots, setSlots] = useState<SlotData[]>([...DEFAULT_SLOTS]);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Search State
  const [records, setRecords] = useState<LockedAccount[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (activeTab === 'search') {
      fetchRecords();
    }
  }, [activeTab]);

  const fetchRecords = async () => {
    setSearchLoading(true);
    const { data, error } = await supabase
      .from('locked_accounts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setRecords(data as LockedAccount[]);
    }
    setSearchLoading(false);
  };

  const handleSlotTypeChange = (index: number, type: SlotType) => {
    const newSlots = [...slots];
    newSlots[index] = { type };
    setSlots(newSlots);
  };

  const handleSlotFieldChange = (index: number, field: keyof SlotData, value: string) => {
    const newSlots = [...slots];
    newSlots[index] = { ...newSlots[index], [field]: value };
    setSlots(newSlots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setLoading(true);
    const payload: LockedAccount = {
      gmail,
      password,
      slots
    };

    const { error } = await supabase.from('locked_accounts').insert([payload]);

    setLoading(false);
    if (error) {
      alert('Error saving record. Did you create the locked_accounts table? Error: ' + error.message);
    } else {
      setSuccessMsg('Workspace record saved successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        setGmail('');
        setPassword('');
        setSlots([...DEFAULT_SLOTS]);
      }, 2000);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopyFeedback(id);
    setTimeout(() => setCopyFeedback(null), 1500);
  };

  const filteredRecords = records.filter(r => 
    (r.gmail?.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 relative overflow-x-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="max-w-6xl mx-auto space-y-8 relative z-10">
        
        {/* Header */}
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800/80 p-6 flex flex-col md:flex-row items-center justify-between glow-indigo">
          <div className="flex items-center space-x-4 mb-4 md:mb-0">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-teal-400 p-[2px] shadow-lg">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Lock className="w-6 h-6 text-indigo-400 animate-pulse" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold uppercase tracking-tight text-white font-display">ZX HUB PUBLIC LOCKER</h1>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-teal-500/20 text-teal-400 border border-teal-500/30 uppercase tracking-widest">Open Access</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Public team workspace (No master vault key required)</p>
            </div>
          </div>
          
          <div className="flex space-x-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${activeTab === 'create' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}
            >
              Add New Record
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-5 py-2.5 text-xs font-bold rounded-lg transition-all uppercase tracking-wider ${activeTab === 'search' ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'}`}
            >
              Search Locker
            </button>
          </div>
        </div>

        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-slate-800/80 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-800 bg-slate-950/40">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-4 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block"></span> Master Gmail Information
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Gmail Address</label>
                  <input required value={gmail} onChange={e => setGmail(e.target.value)} type="email" placeholder="example@gmail.com" className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block mb-2">Password</label>
                  <input required value={password} onChange={e => setPassword(e.target.value)} type="text" placeholder="••••••••" className="w-full px-4 py-3 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none font-mono" />
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-400 mb-6 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-teal-500 inline-block"></span> Social Assets (4 Slots)
              </h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {slots.map((slot, index) => (
                  <div key={index} className="border border-slate-800/80 rounded-2xl overflow-hidden bg-slate-950/60 shadow-lg flex flex-col hover:border-slate-700 transition-colors">
                    <div className="bg-slate-900/90 px-4 py-3 border-b border-slate-800 flex justify-between items-center shrink-0">
                      <span className="text-xs font-bold uppercase tracking-wider text-slate-300">Slot {index + 1}</span>
                      <div className="flex space-x-1 p-1 bg-slate-950 rounded-lg border border-slate-800">
                        <button type="button" onClick={() => handleSlotTypeChange(index, 'NONE')} className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${slot.type === 'NONE' ? 'bg-slate-800 text-slate-200' : 'text-slate-500 hover:text-slate-300'}`}>None</button>
                        <button type="button" onClick={() => handleSlotTypeChange(index, 'FB')} className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${slot.type === 'FB' ? 'bg-blue-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>FB</button>
                        <button type="button" onClick={() => handleSlotTypeChange(index, 'IG')} className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${slot.type === 'IG' ? 'bg-gradient-to-r from-pink-600 to-purple-600 text-white shadow' : 'text-slate-500 hover:text-slate-300'}`}>IG</button>
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1">
                      {slot.type === 'NONE' && (
                        <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs font-bold uppercase tracking-widest min-h-[140px] border border-dashed border-slate-800/80 rounded-xl">
                          <span>Empty Asset Slot</span>
                        </div>
                      )}

                      {slot.type === 'FB' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">FB Username</label>
                            <input value={slot.username || ''} onChange={e => handleSlotFieldChange(index, 'username', e.target.value)} type="text" className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
                            <input value={slot.password || ''} onChange={e => handleSlotFieldChange(index, 'password', e.target.value)} type="text" className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">2FA</label>
                            <input value={slot.two_fa || ''} onChange={e => handleSlotFieldChange(index, 'two_fa', e.target.value)} type="text" className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Hotmail</label>
                            <input value={slot.hotmail || ''} onChange={e => handleSlotFieldChange(index, 'hotmail', e.target.value)} type="text" className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none font-mono" />
                          </div>
                          <div className="col-span-full">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cookies</label>
                            <textarea value={slot.cookies || ''} onChange={e => handleSlotFieldChange(index, 'cookies', e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:ring-1 focus:ring-blue-500 outline-none resize-none font-mono"></textarea>
                          </div>
                        </div>
                      )}

                      {slot.type === 'IG' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">IG Username</label>
                            <input value={slot.username || ''} onChange={e => handleSlotFieldChange(index, 'username', e.target.value)} type="text" className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:ring-1 focus:ring-pink-500 outline-none font-mono" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Password</label>
                            <input value={slot.password || ''} onChange={e => handleSlotFieldChange(index, 'password', e.target.value)} type="text" className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:ring-1 focus:ring-pink-500 outline-none font-mono" />
                          </div>
                          <div className="col-span-full">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Cookies</label>
                            <textarea value={slot.cookies || ''} onChange={e => handleSlotFieldChange(index, 'cookies', e.target.value)} rows={2} className="w-full px-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-white focus:ring-1 focus:ring-pink-500 outline-none resize-none font-mono"></textarea>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
              <div>
                {successMsg && <span className="text-emerald-400 text-sm font-bold flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" />{successMsg}</span>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3.5 bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 text-white font-bold uppercase tracking-widest text-xs rounded-xl shadow-lg shadow-indigo-500/25 hover:from-indigo-500 hover:to-purple-500 transition-all disabled:opacity-50 flex items-center"
              >
                {loading ? 'Saving to Vault...' : <><Save className="w-4 h-4 mr-2" /> Save to Locker</>}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'search' && (
          <div className="bg-slate-900/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-slate-800/80 flex flex-col min-h-[600px]">
            <div className="p-6 border-b border-slate-800/80 bg-slate-950/40 flex items-center justify-between">
              <div className="relative max-w-md w-full">
                <input
                  type="text"
                  placeholder="Search public locker by Gmail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-950/80 border border-slate-700/80 rounded-xl text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 font-mono"
                />
                <SearchIcon className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              </div>
              <div className="text-xs font-bold text-slate-400">
                Found: <span className="text-white font-mono">{filteredRecords.length}</span>
              </div>
            </div>
            
            <div className="flex-1 p-6 bg-slate-950/30 overflow-y-auto">
              {searchLoading ? (
                <div className="text-center text-slate-400 font-bold uppercase text-xs py-16 animate-pulse">Scanning public locker...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center text-slate-500 font-bold uppercase text-xs py-16 border border-dashed border-slate-800 rounded-2xl">No locker records found matching query.</div>
              ) : (
                <div className="space-y-6">
                  {filteredRecords.map(record => (
                    <div key={record.id} className="bg-slate-900 border border-slate-800/80 rounded-2xl overflow-hidden shadow-lg hover:border-slate-700 transition-colors">
                      <div className="bg-slate-950/80 p-4 border-b border-slate-800/80 flex flex-wrap gap-4 justify-between items-center">
                         <div>
                           <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Master Gmail</div>
                           <div className="font-semibold text-white font-mono text-sm">{record.gmail}</div>
                         </div>
                         <div>
                           <div className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-0.5">Password</div>
                           <div className="font-semibold text-white font-mono text-sm flex items-center gap-2.5">
                             {record.password}
                             <button onClick={() => copyToClipboard(record.password, record.id!)} className="text-slate-400 hover:text-indigo-400 transition-colors p-1 rounded hover:bg-slate-800">
                               {copyFeedback === record.id ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                             </button>
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Created</div>
                           <div className="text-xs text-slate-400 font-medium font-mono">
                             {record.created_at ? format(new Date(record.created_at), 'PPP') : '-'}
                           </div>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-800/80">
                        {record.slots && record.slots.map((slot, i) => (
                          <div key={i} className="p-4 bg-slate-900/50">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Slot {i + 1}</span>
                              {slot.type === 'FB' && <span className="text-[9px] px-2 py-0.5 bg-blue-500/20 text-blue-400 font-bold rounded uppercase tracking-wider border border-blue-500/30">FB</span>}
                              {slot.type === 'IG' && <span className="text-[9px] px-2 py-0.5 bg-pink-500/20 text-pink-400 font-bold rounded uppercase tracking-wider border border-pink-500/30">IG</span>}
                              {slot.type === 'NONE' && <span className="text-[9px] px-2 py-0.5 bg-slate-800 text-slate-500 font-bold rounded uppercase tracking-wider">EMPTY</span>}
                            </div>
                            
                            {slot.type !== 'NONE' && (
                              <div className="space-y-2 text-xs">
                                <div><span className="font-bold text-slate-400">User:</span> <span className="font-mono text-slate-200">{slot.username || '-'}</span></div>
                                <div><span className="font-bold text-slate-400">Pass:</span> <span className="font-mono text-slate-200">{slot.password || '-'}</span></div>
                                {slot.type === 'FB' && (
                                  <>
                                    <div><span className="font-bold text-slate-400">2FA:</span> <span className="font-mono text-slate-200">{slot.two_fa || '-'}</span></div>
                                    <div><span className="font-bold text-slate-400">Hotmail:</span> <span className="font-mono text-slate-200">{slot.hotmail || '-'}</span></div>
                                  </>
                                )}
                                {slot.cookies && (
                                  <div>
                                    <span className="font-bold text-slate-400 block mb-1">Cookies:</span> 
                                    <div className="bg-slate-950 p-2 rounded-lg border border-slate-800 font-mono text-[10px] text-slate-400 line-clamp-3 break-all overflow-hidden" title={slot.cookies}>{slot.cookies}</div>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
      </div>
    </div>
  );
}
