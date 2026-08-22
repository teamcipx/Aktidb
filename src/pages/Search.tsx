import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Search as SearchIcon, 
  Filter, 
  Layers, 
  Download, 
  Eye, 
  EyeOff, 
  FileText, 
  Image as ImageIcon, 
  Trash2, 
  Edit2, 
  Check, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  ExternalLink, 
  Copy, 
  Bookmark, 
  FolderKanban, 
  Database, 
  Github, 
  Facebook, 
  Mail, 
  ShieldAlert, 
  Phone, 
  Send, 
  Triangle, 
  Image, 
  RefreshCw, 
  Grid, 
  List, 
  Sparkles,
  Command
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import AccountDetailsModal from '../components/AccountDetailsModal';
import EditRecordModal from '../components/EditRecordModal';
import PdfExportModal from '../components/PdfExportModal';
import QRCodeModal from '../components/QRCodeModal';
import { logActivity } from '../lib/logger';

type VaultCategory = 
  | 'all' 
  | 'data_vault' 
  | 'projects' 
  | 'imgbb' 
  | 'freeimg' 
  | 'fb' 
  | 'gmail' 
  | 'special_fb' 
  | 'special_gmail' 
  | 'supabase' 
  | 'github' 
  | 'brevo' 
  | 'vercel' 
  | 'contact';

interface CategoryConfig {
  id: VaultCategory;
  label: string;
  table: string;
  icon: any;
  color: string;
  badgeColor: string;
}

const CATEGORIES: CategoryConfig[] = [
  { id: 'all', label: 'Universal (All Vaults)', table: '', icon: Sparkles, color: 'text-indigo-400', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
  { id: 'data_vault', label: 'Data Vault', table: 'data_vault', icon: Bookmark, color: 'text-cyan-400', badgeColor: 'bg-cyan-500/20 text-cyan-300' },
  { id: 'projects', label: 'Projects', table: 'projects', icon: FolderKanban, color: 'text-indigo-400', badgeColor: 'bg-indigo-500/20 text-indigo-300' },
  { id: 'imgbb', label: 'ImgBB API', table: 'imgbb_api_keys', icon: Image, color: 'text-teal-400', badgeColor: 'bg-teal-500/20 text-teal-300' },
  { id: 'freeimg', label: 'FreeImg Host', table: 'freeimg_api_keys', icon: Image, color: 'text-amber-400', badgeColor: 'bg-amber-500/20 text-amber-300' },
  { id: 'supabase', label: 'Supabase DB', table: 'supabase_accounts', icon: Database, color: 'text-emerald-400', badgeColor: 'bg-emerald-500/20 text-emerald-300' },
  { id: 'github', label: 'GitHub', table: 'github_accounts', icon: Github, color: 'text-slate-300', badgeColor: 'bg-slate-500/20 text-slate-300' },
  { id: 'vercel', label: 'Vercel', table: 'vercel_accounts', icon: Triangle, color: 'text-purple-400', badgeColor: 'bg-purple-500/20 text-purple-300' },
  { id: 'brevo', label: 'Brevo SMTP', table: 'brevo_accounts', icon: Send, color: 'text-teal-400', badgeColor: 'bg-teal-500/20 text-teal-300' },
  { id: 'fb', label: 'Facebook', table: 'fb_accounts', icon: Facebook, color: 'text-blue-400', badgeColor: 'bg-blue-500/20 text-blue-300' },
  { id: 'special_fb', label: 'Special FB', table: 'special_fb_accounts', icon: ShieldAlert, color: 'text-rose-400', badgeColor: 'bg-rose-500/20 text-rose-300' },
  { id: 'gmail', label: 'Gmail', table: 'gmail_accounts', icon: Mail, color: 'text-red-400', badgeColor: 'bg-red-500/20 text-red-300' },
  { id: 'special_gmail', label: 'Special Gmail', table: 'special_gmail_accounts', icon: ShieldAlert, color: 'text-rose-400', badgeColor: 'bg-rose-500/20 text-rose-300' },
  { id: 'contact', label: 'Contacts', table: 'contact_numbers', icon: Phone, color: 'text-amber-400', badgeColor: 'bg-amber-500/20 text-amber-300' },
];

export default function Search() {
  const [activeTab, setActiveTab] = useState<VaultCategory>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'ALL' | 'Complete' | 'Uncompleted'>('ALL');
  const [viewLayout, setViewLayout] = useState<'grid' | 'table'>('grid');
  
  // Data cache
  const [vaultData, setVaultData] = useState<Record<string, any[]>>({});
  const [loading, setLoading] = useState(true);
  const [revealedPasswords, setRevealedPasswords] = useState<Record<string, boolean>>({});
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Modals
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [qrModalItem, setQrModalItem] = useState<any | null>(null);
  const [selectedAccount, setSelectedAccount] = useState<any>(null);
  const [editingAccount, setEditingAccount] = useState<any>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcut Ctrl+K or '/'
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.key === '/' || ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k')) && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Fetch all data from Supabase / localStorage fallback
  const fetchAllVaults = async () => {
    setLoading(true);
    const tables = CATEGORIES.filter(c => c.id !== 'all').map(c => ({ id: c.id, table: c.table }));
    const result: Record<string, any[]> = {};

    await Promise.all(
      tables.map(async ({ id, table }) => {
        try {
          const { data, error } = await supabase.from(table).select('*').order('created_at', { ascending: false });
          if (!error && data) {
            result[id] = data;
            localStorage.setItem(`zxhub_cache_${id}`, JSON.stringify(data));
          } else {
            const cached = localStorage.getItem(`zxhub_cache_${id}`) || localStorage.getItem(`zxhub_${id}_cache`);
            result[id] = cached ? JSON.parse(cached) : [];
          }
        } catch (err) {
          const cached = localStorage.getItem(`zxhub_cache_${id}`) || localStorage.getItem(`zxhub_${id}_cache`);
          result[id] = cached ? JSON.parse(cached) : [];
        }
      })
    );

    setVaultData(result);
    setLoading(false);
  };

  useEffect(() => {
    fetchAllVaults();
  }, []);

  const handleToggleStatus = async (item: any, category: string) => {
    const newStatus = item.status === 'Complete' ? 'Uncompleted' : 'Complete';
    const config = CATEGORIES.find(c => c.id === category);
    if (!config || !config.table) return;

    try {
      if (item.id && !String(item.id).startsWith('local-')) {
        await supabase.from(config.table).update({ status: newStatus }).eq('id', item.id);
      }
      
      const currentList = vaultData[category] || [];
      const updatedList = currentList.map(d => d.id === item.id ? { ...d, status: newStatus } : d);
      
      setVaultData(prev => ({ ...prev, [category]: updatedList }));
      localStorage.setItem(`zxhub_cache_${category}`, JSON.stringify(updatedList));
      
      logActivity(
        'STATUS_CHANGE', 
        category.toUpperCase(), 
        `Changed status to "${newStatus}" for ${item.name || item.email || item.title || item.id}`, 
        `Table: ${config.table}`
      );
    } catch (err: any) {
      console.warn('Status toggle error:', err);
    }
  };

  const handleDeleteItem = async (item: any, category: string) => {
    const name = item.name || item.email || item.title || item.api_key || item.id;
    if (!confirm(`Are you sure you want to delete "${name}" from ${category}?`)) return;

    const config = CATEGORIES.find(c => c.id === category);
    if (!config || !config.table) return;

    try {
      if (item.id && !String(item.id).startsWith('local-')) {
        await supabase.from(config.table).delete().eq('id', item.id);
      }

      const currentList = vaultData[category] || [];
      const updatedList = currentList.filter(d => d.id !== item.id);
      
      setVaultData(prev => ({ ...prev, [category]: updatedList }));
      localStorage.setItem(`zxhub_cache_${category}`, JSON.stringify(updatedList));

      logActivity('DELETE', category.toUpperCase(), `Deleted record "${name}"`, `Table: ${config.table}`);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const togglePassword = (id: string) => {
    setRevealedPasswords(prev => ({ ...prev, [id]: !prev[id] }));
  };

  // Search filtering logic
  const searchLower = searchTerm.toLowerCase().trim();

  const filterItem = (item: any) => {
    if (selectedStatus !== 'ALL') {
      if (selectedStatus === 'Complete' && item.status !== 'Complete') return false;
      if (selectedStatus === 'Uncompleted' && item.status === 'Complete') return false;
    }

    if (!searchLower) return true;

    // Search across all string attributes
    return Object.values(item).some(val => {
      if (val === null || val === undefined) return false;
      if (typeof val === 'string' || typeof val === 'number') {
        return String(val).toLowerCase().includes(searchLower);
      }
      return false;
    });
  };

  // Compile list based on active tab
  let visibleItems: { item: any; category: VaultCategory }[] = [];

  if (activeTab === 'all') {
    Object.entries(vaultData).forEach(([cat, list]: [string, any[]]) => {
      if (Array.isArray(list)) {
        list.forEach(item => {
          if (filterItem(item)) {
            visibleItems.push({ item, category: cat as VaultCategory });
          }
        });
      }
    });
  } else {
    const list = vaultData[activeTab] || [];
    if (Array.isArray(list)) {
      list.forEach(item => {
        if (filterItem(item)) {
          visibleItems.push({ item, category: activeTab });
        }
      });
    }
  }

  // Highlight matching text helper
  const highlightMatch = (text: string | undefined | null) => {
    if (!text) return '';
    if (!searchLower) return text;
    const str = String(text);
    const index = str.toLowerCase().indexOf(searchLower);
    if (index === -1) return str;

    return (
      <>
        {str.substring(0, index)}
        <mark className="bg-amber-400/30 text-amber-200 px-0.5 rounded font-bold">
          {str.substring(index, index + searchLower.length)}
        </mark>
        {str.substring(index + searchLower.length)}
      </>
    );
  };

  // Export filtered items to CSV
  const handleExportCSV = () => {
    if (visibleItems.length === 0) return;
    
    const rows = visibleItems.map(({ item, category }) => {
      const copy = { ...item, _vault_category: category };
      delete copy.id;
      return copy;
    });

    const headers = Object.keys(rows[0] || {});
    const csvContent = [
      headers.join(','),
      ...rows.map(r => headers.map(h => `"${String(r[h] || '').replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `zxhub_${activeTab}_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const performExportPDF = (includePassword: boolean) => {
    if (visibleItems.length === 0) return;
    const doc = new jsPDF('l', 'mm', 'a4');
    
    // Header Banner
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(0, 0, 297, 38, 'F');

    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('ZX HUB — GLOBAL AUDIT VAULT EXPORT', 14, 18);

    doc.setFontSize(10);
    doc.setTextColor(148, 163, 184);
    doc.text(`Category: ${activeTab.toUpperCase()} | Generated: ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')} | Total Records: ${visibleItems.length}`, 14, 28);

    const headers = ['Category', 'Name / Identifier', 'Email / Username', 'Secret / Key', 'Link / URL', 'Status'];
    const rows = visibleItems.map(({ item, category }) => [
      category.toUpperCase(),
      item.name || item.title || item.first_channel_name || 'N/A',
      item.email || item.username || item.phone || item.admin_email || 'N/A',
      includePassword ? (item.password || item.admin_password || item.api_key || item.token || 'N/A') : '••••••••',
      item.link || item.url || item.profile_link || 'N/A',
      item.status || 'Uncompleted'
    ]);

    autoTable(doc, {
      head: [headers],
      body: rows,
      startY: 44,
      styles: { fontSize: 8, cellPadding: 3, textColor: [30, 41, 59] },
      headStyles: { fillColor: [79, 70, 229], textColor: [255, 255, 255], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`zxhub_vault_${activeTab}_${format(new Date(), 'yyyyMMdd_HHmm')}.pdf`);
    setIsPdfModalOpen(false);
  };

  // Compute counts for tabs
  const getCategoryCount = (catId: VaultCategory) => {
    if (catId === 'all') {
      return (Object.values(vaultData) as any[][]).reduce((acc: number, curr: any[]) => acc + (Array.isArray(curr) ? curr.length : 0), 0);
    }
    return vaultData[catId]?.length || 0;
  };

  return (
    <div className="space-y-5 font-sans">
      
      {/* Top Search & Filter Bar */}
      <div className="bg-slate-900/90 border border-slate-800/90 p-4 sm:p-5 rounded-2xl backdrop-blur-xl shadow-xl space-y-4">
        
        {/* Search Input Row with Stats and Actions */}
        <div className="flex flex-col md:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <SearchIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Universal Search across all credentials, URLs, APIs, emails, notes... (Press '/' or Ctrl+K)"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-20 py-2.5 text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors shadow-inner"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center space-x-1">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="p-1 text-slate-500 hover:text-slate-300 text-xs font-bold"
                >
                  Clear
                </button>
              )}
              <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 rounded">
                <Command className="w-2.5 h-2.5" /> K
              </kbd>
            </div>
          </div>

          {/* Status Filter & View Mode Toggles */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2">
            
            {/* Status Pills */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              {(['ALL', 'Uncompleted', 'Complete'] as const).map(st => (
                <button
                  key={st}
                  onClick={() => setSelectedStatus(st)}
                  className={cn(
                    "px-2.5 py-1 text-[11px] font-bold rounded-lg transition-all",
                    selectedStatus === st
                      ? (st === 'Complete' ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30" : (st === 'Uncompleted' ? "bg-amber-500/20 text-amber-300 border border-amber-500/30" : "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30"))
                      : "text-slate-400 hover:text-slate-200"
                  )}
                >
                  {st === 'ALL' ? 'All Status' : st}
                </button>
              ))}
            </div>

            {/* Layout Toggle (Grid / Table) */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
              <button
                onClick={() => setViewLayout('grid')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewLayout === 'grid' ? "bg-cyan-600/30 text-cyan-300" : "text-slate-400 hover:text-slate-200"
                )}
                title="Grid Card View"
              >
                <Grid className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewLayout('table')}
                className={cn(
                  "p-1.5 rounded-lg transition-all",
                  viewLayout === 'table' ? "bg-cyan-600/30 text-cyan-300" : "text-slate-400 hover:text-slate-200"
                )}
                title="Dense Table View"
              >
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Export & Refresh */}
            <div className="flex items-center space-x-1 shrink-0">
              <button
                onClick={handleExportCSV}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-all text-xs font-bold"
                title="Export Filtered Results to CSV"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
              </button>
              <button
                onClick={() => setIsPdfModalOpen(true)}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-all text-xs font-bold"
                title="Export Filtered Results to PDF"
              >
                <FileText className="w-3.5 h-3.5 text-rose-400" />
              </button>
              <button
                onClick={fetchAllVaults}
                className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 transition-all text-xs font-bold"
                title="Refresh All Vaults"
              >
                <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin text-cyan-400")} />
              </button>
            </div>

          </div>
        </div>

        {/* Category Tab Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-xs border-t border-slate-800/80 pt-3">
          {CATEGORIES.map(cat => {
            const count = getCategoryCount(cat.id);
            const Icon = cat.icon;
            const isActive = activeTab === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveTab(cat.id)}
                className={cn(
                  "px-3 py-1.5 rounded-xl font-bold flex items-center gap-2 shrink-0 transition-all duration-150 border",
                  isActive
                    ? "bg-gradient-to-r from-cyan-600/30 to-indigo-600/30 border-cyan-500/50 text-white shadow-md"
                    : "bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700"
                )}
              >
                <Icon className={cn("w-3.5 h-3.5", cat.color)} />
                <span>{cat.label}</span>
                <span className={cn(
                  "px-1.5 py-0.2 rounded-md text-[10px] font-mono font-bold",
                  isActive ? "bg-cyan-500 text-slate-950" : "bg-slate-800 text-slate-400"
                )}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

      </div>

      {/* Results Header Info */}
      <div className="flex items-center justify-between text-xs text-slate-400 px-1">
        <span className="flex items-center gap-1.5 font-bold">
          <Layers className="w-4 h-4 text-cyan-400" />
          Showing <span className="text-white font-mono">{visibleItems.length}</span> matching records
          {searchTerm && <span>for "<span className="text-cyan-300">{searchTerm}</span>"</span>}
        </span>
        {activeTab !== 'all' && (
          <button
            onClick={() => setActiveTab('all')}
            className="text-cyan-400 hover:underline text-[11px] font-bold"
          >
            Switch to Universal (All Vaults)
          </button>
        )}
      </div>

      {/* Main Results Display */}
      {loading ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-16 text-center text-slate-500 text-xs font-mono animate-pulse">
          Querying all cloud databases & local caches...
        </div>
      ) : visibleItems.length === 0 ? (
        <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-16 text-center text-slate-400 space-y-3">
          <div className="p-3.5 bg-slate-800/60 rounded-2xl w-fit mx-auto text-slate-500">
            <SearchIcon className="w-8 h-8" />
          </div>
          <p className="font-extrabold text-base text-white">No Matching Vault Entries</p>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            No entries found matching your search term and active category filters.
          </p>
        </div>
      ) : viewLayout === 'grid' ? (
        /* Grid Layout */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {visibleItems.map(({ item, category }) => {
            const isComplete = item.status === 'Complete';
            const catConfig = CATEGORIES.find(c => c.id === category) || CATEGORIES[1];
            const Icon = catConfig.icon;
            const idKey = `${category}-${item.id}`;

            const name = item.name || item.title || item.first_channel_name || 'Unnamed Resource';
            const email = item.email || item.username || item.phone || item.admin_email || '';
            const password = item.password || item.admin_password || item.api_key || item.token || item.anon_key || '';
            const link = item.link || item.url || item.profile_link || '';
            const desc = item.description || item.note || item.purpose || '';

            return (
              <div
                key={idKey}
                className={cn(
                  "bg-slate-900/90 border rounded-2xl p-4.5 transition-all duration-200 shadow-lg hover:border-slate-700 flex flex-col justify-between space-y-3 relative group",
                  isComplete 
                    ? "border-emerald-500/30 bg-gradient-to-br from-emerald-950/10 via-slate-900/90 to-slate-900/90" 
                    : "border-slate-800/90 hover:shadow-cyan-950/20"
                )}
              >
                {/* Card Top: Category Badge, Name, Status Toggle & Top Actions */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1", catConfig.badgeColor)}>
                      <Icon className="w-3 h-3" />
                      <span>{catConfig.label}</span>
                    </span>

                    <button
                      onClick={() => handleToggleStatus(item, category)}
                      className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all",
                        isComplete
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                          : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                      )}
                    >
                      {isComplete ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          <span>Complete</span>
                        </>
                      ) : (
                        <>
                          <Clock className="w-3 h-3 text-amber-400" />
                          <span>Uncompleted</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title / Name */}
                  <h3 className="font-extrabold text-sm text-white truncate tracking-tight">
                    {highlightMatch(name)}
                  </h3>
                </div>

                {/* Card Middle: Fields (Email / Password / Link / Description) */}
                <div className="space-y-2 text-xs">
                  {/* Email / Username / Phone */}
                  {email && (
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">User/Email</span>
                      <div className="flex items-center space-x-1 min-w-0 pr-1">
                        <span className="text-slate-200 font-mono text-[11px] truncate max-w-[170px]">
                          {highlightMatch(email)}
                        </span>
                        <button
                          onClick={() => handleCopy(email, `email-${idKey}`)}
                          className="p-1 text-slate-500 hover:text-cyan-400"
                          title="Copy Email"
                        >
                          {copiedKey === `email-${idKey}` ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Password / API Key Secret */}
                  {password && (
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800/80">
                      <span className="text-[10px] font-bold uppercase text-slate-500 tracking-wider">Secret / Key</span>
                      <div className="flex items-center space-x-1.5">
                        <span className="font-mono text-[11px] text-emerald-400 max-w-[150px] truncate">
                          {revealedPasswords[idKey] ? highlightMatch(password) : '••••••••••••'}
                        </span>
                        <button
                          onClick={() => togglePassword(idKey)}
                          className="p-1 text-slate-500 hover:text-slate-300"
                          title={revealedPasswords[idKey] ? "Hide Password" : "Show Password"}
                        >
                          {revealedPasswords[idKey] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                        </button>
                        <button
                          onClick={() => handleCopy(password, `pass-${idKey}`)}
                          className="p-1 text-slate-500 hover:text-cyan-400"
                          title="Copy Secret / Password"
                        >
                          {copiedKey === `pass-${idKey}` ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Live Link */}
                  {link && (
                    <div className="flex items-center justify-between bg-slate-950 p-2 rounded-xl border border-slate-800/80 text-[11px] font-mono">
                      <span className="text-cyan-300 truncate max-w-[200px]">
                        {highlightMatch(link)}
                      </span>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleCopy(link, `link-${idKey}`)}
                          className="p-1 text-slate-500 hover:text-cyan-400"
                          title="Copy Link"
                        >
                          {copiedKey === `link-${idKey}` ? <Check className="w-3 h-3 text-teal-400" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <a
                          href={link.startsWith('http') ? link : `https://${link}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 text-cyan-400 hover:text-cyan-200"
                          title="Open Link in New Tab"
                        >
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      </div>
                    </div>
                  )}

                  {/* Description / Notes */}
                  {desc && (
                    <p className="text-[11px] text-slate-400 line-clamp-2 italic bg-slate-950/40 p-2 rounded-lg border border-slate-800/50">
                      {highlightMatch(desc)}
                    </p>
                  )}
                </div>

                {/* Card Bottom: Action Toolbar */}
                <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {item.created_at ? format(new Date(item.created_at), 'yyyy-MM-dd') : 'Vault Entry'}
                  </span>

                  <div className="flex items-center space-x-1">
                    {/* View Details */}
                    <button
                      onClick={() => setSelectedAccount({ ...item, _type: category })}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
                      title="View Full Details"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </button>

                    {/* QR Code */}
                    <button
                      onClick={() => setQrModalItem({
                        title: `QR Code: ${name}`,
                        subtitle: `${catConfig.label} Credential & Link`,
                        data: item,
                        value: link || email || password || name
                      })}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 transition-colors"
                      title="Generate Advanced QR Code"
                    >
                      <QrCode className="w-3.5 h-3.5" />
                    </button>

                    {/* Edit */}
                    <button
                      onClick={() => setEditingAccount({ account: item, type: category })}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 transition-colors"
                      title="Edit Record"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteItem(item, category)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400 transition-colors"
                      title="Delete Record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* Dense Table Layout */
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950 text-[10px] font-black uppercase tracking-wider text-slate-400 border-b border-slate-800">
                <tr>
                  <th className="p-3.5 pl-4">Category</th>
                  <th className="p-3.5">Name / Title</th>
                  <th className="p-3.5">User / Email / Phone</th>
                  <th className="p-3.5">Secret / Key</th>
                  <th className="p-3.5">Link</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {visibleItems.map(({ item, category }) => {
                  const isComplete = item.status === 'Complete';
                  const catConfig = CATEGORIES.find(c => c.id === category) || CATEGORIES[1];
                  const Icon = catConfig.icon;
                  const idKey = `${category}-${item.id}`;

                  const name = item.name || item.title || item.first_channel_name || 'Unnamed';
                  const email = item.email || item.username || item.phone || item.admin_email || '—';
                  const password = item.password || item.admin_password || item.api_key || item.token || '';
                  const link = item.link || item.url || item.profile_link || '';

                  return (
                    <tr key={idKey} className="hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 pl-4">
                        <span className={cn("px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 w-fit", catConfig.badgeColor)}>
                          <Icon className="w-3 h-3" />
                          <span>{catConfig.label}</span>
                        </span>
                      </td>
                      <td className="p-3.5 font-bold text-white max-w-[180px] truncate">
                        {highlightMatch(name)}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] max-w-[160px] truncate">
                        {highlightMatch(email)}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-emerald-400">
                        {password ? (
                          <div className="flex items-center space-x-1">
                            <span>{revealedPasswords[idKey] ? highlightMatch(password) : '••••••••'}</span>
                            <button onClick={() => togglePassword(idKey)} className="p-0.5 text-slate-500 hover:text-white">
                              {revealedPasswords[idKey] ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                          </div>
                        ) : '—'}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-cyan-400 max-w-[180px] truncate">
                        {link ? (
                          <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer" className="hover:underline flex items-center gap-1">
                            <span className="truncate">{link}</span>
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        ) : '—'}
                      </td>
                      <td className="p-3.5">
                        <button
                          onClick={() => handleToggleStatus(item, category)}
                          className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-bold flex items-center gap-1 transition-all",
                            isComplete
                              ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          )}
                        >
                          {isComplete ? 'Complete' : 'Uncompleted'}
                        </button>
                      </td>
                      <td className="p-3.5 pr-4 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => setSelectedAccount({ ...item, _type: category })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300"
                            title="View Details"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setQrModalItem({
                              title: `QR Code: ${name}`,
                              subtitle: `${catConfig.label}`,
                              data: item,
                              value: link || email || password || name
                            })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400"
                            title="QR Code"
                          >
                            <QrCode className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingAccount({ account: item, type: category })}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteItem(item, category)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/60 text-rose-400"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Account Details Modal */}
      {selectedAccount && (
        <AccountDetailsModal
          account={selectedAccount}
          type={selectedAccount._type || activeTab}
          onClose={() => setSelectedAccount(null)}
        />
      )}

      {/* Edit Record Modal */}
      {editingAccount && (
        <EditRecordModal
          account={editingAccount.account}
          type={editingAccount.type}
          onClose={() => setEditingAccount(null)}
          onSave={(updatedData: any) => {
            const cat = editingAccount.type;
            const currentList = vaultData[cat] || [];
            const updated = currentList.map(d => d.id === editingAccount.account.id ? { ...d, ...updatedData } : d);
            setVaultData(prev => ({ ...prev, [cat]: updated }));
            localStorage.setItem(`zxhub_cache_${cat}`, JSON.stringify(updated));
            setEditingAccount(null);
          }}
        />
      )}

      {/* PDF Export Modal */}
      <PdfExportModal
        isOpen={isPdfModalOpen}
        onClose={() => setIsPdfModalOpen(false)}
        onExport={performExportPDF}
      />

      {/* Advanced QR Code Modal */}
      {qrModalItem && (
        <QRCodeModal
          title={qrModalItem.title}
          subtitle={qrModalItem.subtitle}
          data={qrModalItem.data}
          value={qrModalItem.value}
          onClose={() => setQrModalItem(null)}
        />
      )}

    </div>
  );
}
