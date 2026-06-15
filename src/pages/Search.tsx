import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Search as SearchIcon, Filter, Layers, Download, Eye, EyeOff, FileText, Image as ImageIcon, View, Trash2, Edit2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { toPng } from 'html-to-image';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AccountDetailsModal from '../components/AccountDetailsModal';
import EditRecordModal from '../components/EditRecordModal';

export default function Search() {
  const [activeTab, setActiveTab] = useState<'fb'|'gmail'|'special_fb'|'special_gmail'|'supabase'|'github'|'contact'>('fb');
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  
  // Basic filtering
  const [selectedCountry, setSelectedCountry] = useState('');
  const [selectedPurpose, setSelectedPurpose] = useState('');
  
  // Available filter options based on data
  const [countries, setCountries] = useState<string[]>([]);
  const [purposes, setPurposes] = useState<string[]>([]);
  
  // Modal state
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const handleExportCSV = () => {
    if (filteredData.length === 0) return;
    
    const keys = Object.keys(filteredData[0]).filter(key => key !== 'id');
    const csvRows = [
      keys.join(','), 
      ...filteredData.map(row => 
        keys.map(k => {
          let val = row[k] === null || row[k] === undefined ? '' : row[k];
          val = String(val).replace(/"/g, '""');
          return `"${val}"`;
        }).join(',')
      )
    ];
    
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `akti_export_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    if (filteredData.length === 0) return;
    const doc = new jsPDF('l', 'mm', 'a4');
    doc.text(`Akti DB - ${activeTab.toUpperCase()} Accounts`, 14, 15);
    
    const keys = Object.keys(filteredData[0]).filter(key => key !== 'id' && key !== 'password');
    const data = filteredData.map(row => keys.map(k => row[k] || '-'));
    
    autoTable(doc, {
      head: [keys.map(k => k.replace(/_/g, ' ').toUpperCase())],
      body: data,
      startY: 20,
      styles: { fontSize: 8, cellPadding: 2 },
      headStyles: { fillColor: [79, 70, 229] } // indigo-600
    });
    
    doc.save(`akti_export_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.pdf`);
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    let table = 'fb_accounts';
    if (activeTab === 'gmail') table = 'gmail_accounts';
    if (activeTab === 'supabase') table = 'supabase_accounts';
    if (activeTab === 'github') table = 'github_accounts';
    if (activeTab === 'special_fb') table = 'special_fb_accounts';
    if (activeTab === 'special_gmail') table = 'special_gmail_accounts';
    if (activeTab === 'contact') table = 'contact_numbers';
    
    const { data: records, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
    
    if (error) {
      console.error(error);
    } else if (records) {
      setData(records);
      
      // Extract unique countries and purposes for filter dropdowns
      const uCountries = Array.from(new Set(records.map(r => r.country || r.group_name).filter(Boolean)));
      const uPurposes = Array.from(new Set(records.map(r => r.purpose).filter(Boolean)));
      setCountries(uCountries as string[]);
      setPurposes(uPurposes as string[]);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this entry? This action cannot be undone.')) return;
    
    let table = 'fb_accounts';
    if (activeTab === 'gmail') table = 'gmail_accounts';
    if (activeTab === 'supabase') table = 'supabase_accounts';
    if (activeTab === 'github') table = 'github_accounts';
    if (activeTab === 'special_fb') table = 'special_fb_accounts';
    if (activeTab === 'special_gmail') table = 'special_gmail_accounts';
    if (activeTab === 'contact') table = 'contact_numbers';

    const { error } = await supabase.from(table).delete().eq('id', id);
    if (error) {
      alert('Error deleting entry: ' + error.message);
    } else {
      setData(data.filter(item => item.id !== id));
    }
  };

  const filteredData = data.filter(item => {
    const matchesSearch = 
      (item.name?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.email?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.organization?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
      (item.phone?.toLowerCase() || '').includes(searchTerm.toLowerCase());
      
    const itemCountry = item.country || item.group_name;
    const matchesCountry = selectedCountry ? itemCountry === selectedCountry : true;
    const matchesPurpose = selectedPurpose ? item.purpose === selectedPurpose : true;
    
    return matchesSearch && matchesCountry && matchesPurpose;
  });

  return (
    <div className="space-y-6 flex flex-col h-full font-sans text-slate-100">
      <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-4 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-4 shrink-0 relative">
        <div className="flex items-center space-x-2 text-indigo-400">
          <SearchIcon className="w-5 h-5 font-bold" />
          <h1 className="text-xs font-bold uppercase tracking-wider text-slate-100">Search Database</h1>
        </div>
        <div className="flex items-center space-x-2 absolute md:static right-4 top-3">
          <button 
            onClick={handleExportCSV}
            title="Export full table to CSV"
            className="flex items-center justify-center p-2 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded transition-colors"
          >
            <Download className="w-4 h-4" />
          </button>
          <button 
            onClick={handleExportPDF}
            title="Export full table to PDF"
            className="flex items-center justify-center p-2 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded transition-colors"
          >
            <FileText className="w-4 h-4" />
          </button>
          <button 
            onClick={async () => {
              const el = document.getElementById('search-table-container');
              if (!el) return;
              const url = await toPng(el, { pixelRatio: 2, backgroundColor: '#0f172a' }); // dark slate bg
              const link = document.createElement('a');
              link.download = `akti_export_${activeTab}_${format(new Date(), 'yyyy-MM-dd')}.png`;
              link.href = url;
              link.click();
            }}
            title="Export full table to Image"
            className="flex items-center justify-center p-2 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded transition-colors"
          >
            <ImageIcon className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap border-b border-slate-800 shrink-0">
        <button
          onClick={() => setActiveTab('fb')}
          className={cn(
            "py-3 px-4 text-xs font-bold border-b-2 transition-colors",
            activeTab === 'fb' 
              ? "border-indigo-500 text-indigo-400 bg-indigo-500/10" 
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          )}
        >
          Facebook Entry
        </button>
        <button
          onClick={() => setActiveTab('gmail')}
          className={cn(
            "py-3 px-4 text-xs font-bold border-b-2 transition-colors",
            activeTab === 'gmail' 
              ? "border-sky-500 text-sky-400 bg-sky-500/10" 
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          )}
        >
          Gmail Entry
        </button>
        <button
          onClick={() => setActiveTab('special_fb')}
          className={cn(
            "py-3 px-4 text-xs font-bold border-b-2 transition-colors",
            activeTab === 'special_fb' 
              ? "border-rose-500 text-rose-400 bg-rose-500/10" 
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          )}
        >
          Spc. FB
        </button>
        <button
          onClick={() => setActiveTab('special_gmail')}
          className={cn(
            "py-3 px-4 text-xs font-bold border-b-2 transition-colors",
            activeTab === 'special_gmail' 
              ? "border-rose-500 text-rose-400 bg-rose-500/10" 
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          )}
        >
          Spc. Gmail
        </button>
        <button
          onClick={() => setActiveTab('contact')}
          className={cn(
            "py-3 px-4 text-xs font-bold border-b-2 transition-colors",
            activeTab === 'contact' 
              ? "border-amber-500 text-amber-400 bg-amber-500/10" 
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          )}
        >
          Contacts
        </button>
        <button
          onClick={() => setActiveTab('supabase')}
          className={cn(
            "py-3 px-4 text-xs font-bold border-b-2 transition-colors",
            activeTab === 'supabase' 
              ? "border-emerald-500 text-emerald-400 bg-emerald-500/10" 
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          )}
        >
          Supabase Entry
        </button>
        <button
          onClick={() => setActiveTab('github')}
          className={cn(
            "py-3 px-4 text-xs font-bold border-b-2 transition-colors",
            activeTab === 'github' 
              ? "border-violet-500 text-violet-400 bg-violet-500/10" 
              : "border-transparent text-slate-400 hover:text-slate-200 hover:bg-slate-800/50"
          )}
        >
          Github Entry
        </button>
      </div>

      {/* Filters Toolbar */}
      <div className="flex flex-col sm:flex-row gap-4 shrink-0 mt-4">
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Search name, email, phone, organization..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-900 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 transition-all font-sans"
          />
          <div className="absolute left-3 top-2.5 text-slate-500">
             <SearchIcon className="w-4 h-4" />
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-500" />
            <select
              value={selectedCountry}
              onChange={(e) => setSelectedCountry(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg outline-none text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">{activeTab === 'contact' ? 'All Groups' : 'All Countries'}</option>
              {countries.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <Layers className="w-4 h-4 text-slate-500" />
            <select
              value={selectedPurpose}
              onChange={(e) => setSelectedPurpose(e.target.value)}
              className="px-3 py-2 bg-slate-900 border border-slate-800 rounded-lg outline-none text-sm text-slate-200 focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
            >
              <option value="">All Purposes</option>
              {purposes.map(p => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
        </div>
      </div>

      {/* Data Table */}
      <div id="search-table-container" className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm flex-1 flex flex-col min-h-[300px]">
        <div className="overflow-auto flex-1 scroll-hide">
          <table className="w-full text-sm text-left text-slate-300">
            <thead className="text-[10px] font-bold text-slate-500 uppercase tracking-widest bg-slate-800/50 border-b border-slate-800 sticky top-0 z-10">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                {activeTab === 'contact' ? (
                  <>
                    <th className="px-4 py-3">Phone</th>
                    <th className="px-4 py-3">Org/Company</th>
                    <th className="px-4 py-3">Purpose</th>
                  </>
                ) : (
                  <>
                    <th className="px-4 py-3">Password</th>
                    {activeTab === 'supabase' ? (
                      <>
                        <th className="px-4 py-3">Project URL</th>
                        <th className="px-4 py-3">Purpose</th>
                      </>
                    ) : activeTab === 'github' ? (
                      <>
                        <th className="px-4 py-3">Username</th>
                        <th className="px-4 py-3">Profile Link</th>
                        <th className="px-4 py-3">Purpose</th>
                      </>
                    ) : (
                      <>
                        <th className="px-4 py-3">Phone</th>
                        <th className="px-4 py-3">Country</th>
                        <th className="px-4 py-3">Purpose</th>
                      </>
                    )}
                  </>
                )}
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-xs uppercase tracking-widest font-bold">
                    Loading records...
                  </td>
                </tr>
              ) : filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-500 text-xs uppercase tracking-widest font-bold">
                    No records found matching your filters.
                  </td>
                </tr>
              ) : (
                filteredData.map((item) => (
                  <tr key={item.id} className="border-b border-slate-800 hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-100">{item.name || '-'}</td>
                    <td className="px-4 py-3 text-slate-400 text-xs">{item.email || '-'}</td>
                    {activeTab === 'contact' ? (
                      <>
                        <td className="px-4 py-3 text-slate-400 text-xs">{item.phone || '-'}</td>
                        <td className="px-4 py-3 text-slate-400 text-xs">{item.organization || '-'}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-500">
                            {item.purpose || item.group_name || '-'}
                          </span>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-3 font-mono text-slate-400 text-xs">
                          <div className="flex items-center space-x-2 min-w-[80px]">
                            <span className={cn("transition-all flex-1", !revealedPasswords[item.id] && "opacity-40 blur-[3px] select-none")}>
                              {revealedPasswords[item.id] ? (item.password || '-') : '••••••••'}
                            </span>
                            <button 
                              onClick={() => setRevealedPasswords(prev => ({...prev, [item.id]: !prev[item.id]}))}
                              className="text-slate-500 hover:text-indigo-400 transition-colors p-1 flex-shrink-0 cursor-pointer"
                              title={revealedPasswords[item.id] ? "Hide password" : "Show password"}
                            >
                              {revealedPasswords[item.id] ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </td>
                        {activeTab === 'supabase' ? (
                          <>
                            <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[150px]" title={item.url}>{item.url || '-'}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-500">
                                {item.purpose || '-'}
                              </span>
                            </td>
                          </>
                        ) : activeTab === 'github' ? (
                          <>
                            <td className="px-4 py-3 text-slate-400 text-xs">{item.username || '-'}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs truncate max-w-[150px]" title={item.profile_link}>{item.profile_link || '-'}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-violet-500/10 text-violet-400">
                                {item.purpose || '-'}
                              </span>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="px-4 py-3 text-slate-400 text-xs">{item.phone || '-'}</td>
                            <td className="px-4 py-3 text-slate-400 text-xs">{item.country || '-'}</td>
                            <td className="px-4 py-3">
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-500/10 text-indigo-400">
                                {item.purpose || '-'}
                              </span>
                            </td>
                          </>
                        )}
                      </>
                    )}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                           onClick={() => setSelectedAccount(item)}
                           className="inline-flex items-center justify-center p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/50 rounded border border-transparent hover:border-indigo-500/20 transition-all font-semibold"
                           title="View account details"
                        >
                           <View className="w-4 h-4" />
                           <span className="ml-1.5 text-xs">View</span>
                        </button>
                        <button 
                           onClick={() => setEditingAccount(item)}
                           className="inline-flex items-center justify-center p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-slate-800/50 rounded border border-transparent hover:border-emerald-500/20 transition-all font-semibold"
                           title="Edit record"
                        >
                           <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                           onClick={() => handleDelete(item.id)}
                           className="inline-flex items-center justify-center p-1.5 text-rose-500 hover:text-rose-400 hover:bg-slate-800/50 rounded border border-transparent hover:border-rose-500/20 transition-all font-semibold"
                           title="Delete record"
                        >
                           <Trash2 className="w-4 h-4" />
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

      {selectedAccount && (
        <AccountDetailsModal 
          account={selectedAccount} 
          type={activeTab} 
          onClose={() => setSelectedAccount(null)} 
        />
      )}

      {editingAccount && (
        <EditRecordModal 
          account={editingAccount} 
          type={activeTab} 
          onClose={() => setEditingAccount(null)} 
          onSave={(updatedData: any) => {
            // Update local state
            setData(data.map(item => item.id === editingAccount.id ? { ...item, ...updatedData } : item));
            setEditingAccount(null);
          }}
        />
      )}
    </div>
  );
}
