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
    <div className="min-h-screen bg-slate-50 font-sans p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-6 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-3 text-indigo-600 mb-4 md:mb-0">
            <Lock className="w-6 h-6" />
            <div>
              <h1 className="text-xl font-bold uppercase tracking-wider text-slate-900">Workspace Locker</h1>
              <p className="text-[11px] font-bold uppercase tracking-widest text-slate-400">Public Access (No Master Password)</p>
            </div>
          </div>
          
          <div className="flex space-x-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
            <button
              onClick={() => setActiveTab('create')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-colors uppercase tracking-widest ${activeTab === 'create' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Add New
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-4 py-2 text-xs font-bold rounded-md transition-colors uppercase tracking-widest ${activeTab === 'search' ? 'bg-white shadow-sm text-indigo-600 border border-slate-200/50' : 'text-slate-500 hover:text-slate-700'}`}
            >
              Search
            </button>
          </div>
        </div>

        {activeTab === 'create' && (
          <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-4">Master Gmail Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block mb-1.5">Gmail Address</label>
                  <input required value={gmail} onChange={e => setGmail(e.target.value)} type="email" placeholder="example@gmail.com" className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block mb-1.5">Password</label>
                  <input required value={password} onChange={e => setPassword(e.target.value)} type="text" placeholder="••••••••" className="w-full px-3 py-2 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-indigo-500 outline-none" />
                </div>
              </div>
            </div>

            <div className="p-6 md:p-8">
              <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 mb-6">Social Assets (4 Slots)</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {slots.map((slot, index) => (
                  <div key={index} className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm flex flex-col">
                    <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex justify-between items-center shrink-0">
                      <span className="text-[11px] font-bold uppercase tracking-widest text-slate-600">Slot {index + 1}</span>
                      <div className="flex space-x-1 p-0.5 bg-slate-200/60 rounded">
                        <button type="button" onClick={() => handleSlotTypeChange(index, 'NONE')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors ${slot.type === 'NONE' ? 'bg-white shadow-sm text-slate-700' : 'text-slate-500 hover:bg-slate-200/50'}`}>None</button>
                        <button type="button" onClick={() => handleSlotTypeChange(index, 'FB')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors ${slot.type === 'FB' ? 'bg-blue-500 shadow-sm text-white' : 'text-slate-500 hover:bg-slate-200/50'}`}>FB</button>
                        <button type="button" onClick={() => handleSlotTypeChange(index, 'IG')} className={`px-2 py-1 text-[10px] font-bold uppercase rounded transition-colors ${slot.type === 'IG' ? 'bg-pink-500 shadow-sm text-white' : 'text-slate-500 hover:bg-slate-200/50'}`}>IG</button>
                      </div>
                    </div>
                    
                    <div className="p-4 flex-1">
                      {slot.type === 'NONE' && (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs font-bold uppercase tracking-widest min-h-[120px]">
                          Empty Slot
                        </div>
                      )}

                      {slot.type === 'FB' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block mb-1">FB Username</label>
                            <input value={slot.username || ''} onChange={e => handleSlotFieldChange(index, 'username', e.target.value)} type="text" className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block mb-1">Password</label>
                            <input value={slot.password || ''} onChange={e => handleSlotFieldChange(index, 'password', e.target.value)} type="text" className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block mb-1">2FA</label>
                            <input value={slot.two_fa || ''} onChange={e => handleSlotFieldChange(index, 'two_fa', e.target.value)} type="text" className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block mb-1">Hotmail</label>
                            <input value={slot.hotmail || ''} onChange={e => handleSlotFieldChange(index, 'hotmail', e.target.value)} type="text" className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none" />
                          </div>
                          <div className="col-span-full">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block mb-1">Cookies</label>
                            <textarea value={slot.cookies || ''} onChange={e => handleSlotFieldChange(index, 'cookies', e.target.value)} rows={2} className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-blue-500 outline-none resize-none"></textarea>
                          </div>
                        </div>
                      )}

                      {slot.type === 'IG' && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block mb-1">IG Username</label>
                            <input value={slot.username || ''} onChange={e => handleSlotFieldChange(index, 'username', e.target.value)} type="text" className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-pink-500 outline-none" />
                          </div>
                          <div>
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block mb-1">Password</label>
                            <input value={slot.password || ''} onChange={e => handleSlotFieldChange(index, 'password', e.target.value)} type="text" className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-pink-500 outline-none" />
                          </div>
                          <div className="col-span-full">
                            <label className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter block mb-1">Cookies</label>
                            <textarea value={slot.cookies || ''} onChange={e => handleSlotFieldChange(index, 'cookies', e.target.value)} rows={2} className="w-full px-2.5 py-1.5 border border-slate-200 rounded text-sm focus:ring-1 focus:ring-pink-500 outline-none resize-none"></textarea>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <div>
                {successMsg && <span className="text-emerald-500 text-sm font-bold flex items-center"><CheckCircle2 className="w-4 h-4 mr-2" />{successMsg}</span>}
              </div>
              <button
                type="submit"
                disabled={loading}
                className="px-8 py-3 bg-indigo-600 text-white font-bold uppercase tracking-widest text-xs rounded-lg shadow hover:bg-indigo-700 transition-colors disabled:opacity-50 flex items-center"
              >
                {loading ? 'Saving...' : <><Save className="w-4 h-4 mr-2" /> Save Workspace</>}
              </button>
            </div>
          </form>
        )}

        {activeTab === 'search' && (
          <div className="bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col min-h-[600px]">
            <div className="p-6 border-b border-slate-100">
              <div className="relative max-w-md">
                <input
                  type="text"
                  placeholder="Search by Gmail..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-lg text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <SearchIcon className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              </div>
            </div>
            
            <div className="flex-1 p-6 bg-slate-50/50 overflow-y-auto">
              {searchLoading ? (
                <div className="text-center text-slate-400 font-bold uppercase text-xs py-12">Loading workspace...</div>
              ) : filteredRecords.length === 0 ? (
                <div className="text-center text-slate-400 font-bold uppercase text-xs py-12">No records found.</div>
              ) : (
                <div className="space-y-6">
                  {filteredRecords.map(record => (
                    <div key={record.id} className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                      <div className="bg-slate-50 p-4 border-b border-slate-200 flex flex-wrap gap-4 justify-between items-center">
                         <div>
                           <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Master Gmail</div>
                           <div className="font-semibold text-slate-900 font-mono text-sm">{record.gmail}</div>
                         </div>
                         <div>
                           <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Password</div>
                           <div className="font-semibold text-slate-900 font-mono text-sm flex items-center gap-2">
                             {record.password}
                             <button onClick={() => copyToClipboard(record.password, record.id!)} className="text-slate-400 hover:text-indigo-600 transition-colors">
                               {copyFeedback === record.id ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
                             </button>
                           </div>
                         </div>
                         <div className="text-right">
                           <div className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-0.5">Created</div>
                           <div className="text-xs text-slate-600 font-medium">
                             {record.created_at ? format(new Date(record.created_at), 'PPP') : '-'}
                           </div>
                         </div>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-slate-100">
                        {record.slots && record.slots.map((slot, i) => (
                          <div key={i} className="p-4">
                            <div className="flex justify-between items-center mb-3">
                              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Slot {i + 1}</span>
                              {slot.type === 'FB' && <span className="text-[9px] px-1.5 py-0.5 bg-blue-100 text-blue-700 font-bold rounded">FB</span>}
                              {slot.type === 'IG' && <span className="text-[9px] px-1.5 py-0.5 bg-pink-100 text-pink-700 font-bold rounded">IG</span>}
                              {slot.type === 'NONE' && <span className="text-[9px] px-1.5 py-0.5 bg-slate-100 text-slate-500 font-bold rounded">EMPTY</span>}
                            </div>
                            
                            {slot.type !== 'NONE' && (
                              <div className="space-y-2 text-xs">
                                <div><span className="font-bold text-slate-500">User:</span> <span className="font-mono text-slate-900">{slot.username || '-'}</span></div>
                                <div><span className="font-bold text-slate-500">Pass:</span> <span className="font-mono text-slate-900">{slot.password || '-'}</span></div>
                                {slot.type === 'FB' && (
                                  <>
                                    <div><span className="font-bold text-slate-500">2FA:</span> <span className="font-mono text-slate-900">{slot.two_fa || '-'}</span></div>
                                    <div><span className="font-bold text-slate-500">Hotmail:</span> <span className="font-mono text-slate-900">{slot.hotmail || '-'}</span></div>
                                  </>
                                )}
                                {slot.cookies && (
                                  <div>
                                    <span className="font-bold text-slate-500 block mb-1">Cookies:</span> 
                                    <div className="bg-slate-50 p-2 rounded border border-slate-100 font-mono text-[10px] text-slate-600 line-clamp-3 break-all overflow-hidden" title={slot.cookies}>{slot.cookies}</div>
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
