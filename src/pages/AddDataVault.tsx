import React, { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { 
  Bookmark, 
  Globe, 
  ExternalLink, 
  Copy, 
  Check, 
  QrCode, 
  Plus, 
  Trash2, 
  Edit2, 
  Search as SearchIcon, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Sparkles, 
  Layers, 
  RefreshCw, 
  Share2, 
  Filter, 
  Download, 
  Upload,
  Link2,
  FolderPlus
} from 'lucide-react';
import { cn } from '../lib/utils';
import { format } from 'date-fns';
import { logActivity } from '../lib/logger';
import QRCodeModal from '../components/QRCodeModal';
import EditRecordModal from '../components/EditRecordModal';

export interface DataVaultItem {
  id?: string;
  name: string;
  description: string;
  link: string;
  category?: string;
  status?: string;
  note?: string;
  created_at?: string;
}

const DEFAULT_CATEGORIES = [
  'General',
  'Tools & AI',
  'Documentation',
  'Dev & Repos',
  'APIs & Endpoints',
  'Social & Media',
  'Cloud Portals',
  'Finance & Billing',
  'Private Vault'
];

export default function AddDataVault() {
  const [items, setItems] = useState<DataVaultItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedStatus, setSelectedStatus] = useState('ALL');
  const [qrModalItem, setQrModalItem] = useState<{ title?: string; subtitle?: string; data?: any; value?: string } | null>(null);
  const [editingItem, setEditingItem] = useState<DataVaultItem | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [bulkText, setBulkText] = useState('');

  // Form State
  const [formData, setFormData] = useState<DataVaultItem>({
    name: '',
    description: '',
    link: '',
    category: 'General',
    status: 'Uncompleted',
    note: ''
  });

  const fetchItems = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('data_vault')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.warn('Supabase data_vault fetch fallback to local:', error.message);
        const local = localStorage.getItem('zxhub_data_vault_cache');
        if (local) {
          setItems(JSON.parse(local));
        }
      } else if (data) {
        setItems(data);
        localStorage.setItem('zxhub_data_vault_cache', JSON.stringify(data));
      }
    } catch (err) {
      console.error('Error fetching data vault items:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);

    let cleanLink = formData.link.trim();
    if (cleanLink && !cleanLink.startsWith('http://') && !cleanLink.startsWith('https://')) {
      cleanLink = `https://${cleanLink}`;
    }

    const payload = {
      ...formData,
      link: cleanLink,
      created_at: new Date().toISOString()
    };

    try {
      const { data, error } = await supabase.from('data_vault').insert([payload]).select();

      if (error) {
        // Fallback local storage
        console.warn('Saving locally due to DB error:', error.message);
        const localItem: DataVaultItem = {
          ...payload,
          id: `local-${Date.now()}`
        };
        const updated = [localItem, ...items];
        setItems(updated);
        localStorage.setItem('zxhub_data_vault_cache', JSON.stringify(updated));
      } else if (data && data[0]) {
        const updated = [data[0], ...items];
        setItems(updated);
        localStorage.setItem('zxhub_data_vault_cache', JSON.stringify(updated));
      }

      logActivity('CREATE', 'DATA_VAULT', `Added Data Vault "${formData.name}"`, `Link: ${cleanLink || 'N/A'}`);

      // Reset form
      setFormData({
        name: '',
        description: '',
        link: '',
        category: formData.category || 'General',
        status: 'Uncompleted',
        note: ''
      });
    } catch (err: any) {
      console.error('Submit error:', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Are you sure you want to delete "${name}" from Data Vault?`)) return;

    try {
      await supabase.from('data_vault').delete().eq('id', id);
      const updated = items.filter(i => i.id !== id);
      setItems(updated);
      localStorage.setItem('zxhub_data_vault_cache', JSON.stringify(updated));
      logActivity('DELETE', 'DATA_VAULT', `Deleted Data Vault Item "${name}"`, `ID: ${id}`);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleToggleStatus = async (item: DataVaultItem) => {
    const newStatus = item.status === 'Complete' ? 'Uncompleted' : 'Complete';
    try {
      if (item.id && !item.id.startsWith('local-')) {
        await supabase.from('data_vault').update({ status: newStatus }).eq('id', item.id);
      }
      const updated = items.map(i => i.id === item.id ? { ...i, status: newStatus } : i);
      setItems(updated);
      localStorage.setItem('zxhub_data_vault_cache', JSON.stringify(updated));
      logActivity('STATUS_CHANGE', 'DATA_VAULT', `Changed status to "${newStatus}" for ${item.name}`, `Status updated`);
    } catch (err) {
      console.error('Status change error:', err);
    }
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleBulkImport = async () => {
    if (!bulkText.trim()) return;

    const lines = bulkText.split('\n').filter(l => l.trim().length > 0);
    const newEntries: DataVaultItem[] = [];

    lines.forEach(line => {
      // Formats supported:
      // Name | Description | Link | Category
      // Name, Description, Link
      // Name - Link
      let name = '';
      let desc = '';
      let link = '';
      let cat = 'General';

      if (line.includes('|')) {
        const parts = line.split('|').map(p => p.trim());
        name = parts[0] || 'Untitled Resource';
        desc = parts[1] || '';
        link = parts[2] || '';
        cat = parts[3] || 'General';
      } else if (line.includes(' - http')) {
        const parts = line.split(' - ');
        name = parts[0].trim();
        link = parts.slice(1).join(' - ').trim();
      } else {
        const parts = line.split(',');
        name = parts[0]?.trim() || 'Untitled Resource';
        desc = parts[1]?.trim() || '';
        link = parts[2]?.trim() || '';
      }

      if (link && !link.startsWith('http://') && !link.startsWith('https://')) {
        link = `https://${link}`;
      }

      if (name) {
        newEntries.push({
          name,
          description: desc,
          link,
          category: cat,
          status: 'Uncompleted',
          created_at: new Date().toISOString()
        });
      }
    });

    if (newEntries.length > 0) {
      setLoading(true);
      try {
        const { data, error } = await supabase.from('data_vault').insert(newEntries).select();
        if (error) {
          const withIds = newEntries.map((e, idx) => ({ ...e, id: `local-bulk-${Date.now()}-${idx}` }));
          const updated = [...withIds, ...items];
          setItems(updated);
          localStorage.setItem('zxhub_data_vault_cache', JSON.stringify(updated));
        } else if (data) {
          const updated = [...data, ...items];
          setItems(updated);
          localStorage.setItem('zxhub_data_vault_cache', JSON.stringify(updated));
        }
        logActivity('CREATE', 'DATA_VAULT', `Bulk imported ${newEntries.length} items to Data Vault`, `Total lines parsed: ${lines.length}`);
        setBulkText('');
        setShowBulkModal(false);
      } catch (err) {
        console.error('Bulk insert error:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  // Filtered Items
  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.link.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.category && item.category.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (item.note && item.note.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesCategory = selectedCategory === 'ALL' || item.category === selectedCategory;
    const matchesStatus = selectedStatus === 'ALL' || (selectedStatus === 'Complete' ? item.status === 'Complete' : item.status !== 'Complete');

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categoriesInUse = Array.from(new Set(items.map(i => i.category || 'General')));

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/90 border border-slate-800/90 p-5 rounded-2xl backdrop-blur-xl shadow-xl">
        <div className="flex items-center space-x-3.5">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-indigo-500/20 to-teal-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
            <Bookmark className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg font-black text-white tracking-wide flex items-center gap-2">
              Data Vault & Resource Hub
              <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold uppercase tracking-wider">
                Universal Links
              </span>
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Securely store, organize, share, and QR-scan web links, descriptions, and data resources.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2 shrink-0">
          <button
            onClick={() => setShowBulkModal(true)}
            className="flex items-center space-x-1.5 px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700 transition-all hover:scale-105 active:scale-95"
          >
            <Upload className="w-4 h-4 text-teal-400" />
            <span>Bulk Import</span>
          </button>
          <button
            onClick={fetchItems}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-slate-700 transition-all"
            title="Refresh list"
          >
            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin text-cyan-400")} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Add Entry Form (5 Cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-slate-900/90 border border-slate-800/90 rounded-2xl p-5 shadow-xl backdrop-blur-xl space-y-4 sticky top-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-400 flex items-center gap-2">
                <Plus className="w-4 h-4" /> New Data Vault Entry
              </span>
              <span className="text-[10px] text-slate-500 font-mono">
                Name • Description • Link
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              {/* Name */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-tight block">
                  Resource Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="e.g. Stripe Developer Portal or Figma UI Kit"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Link / URL */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-tight block flex items-center justify-between">
                  <span>Resource Link / URL</span>
                  {formData.link && (
                    <a 
                      href={formData.link.startsWith('http') ? formData.link : `https://${formData.link}`} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-cyan-400 hover:underline flex items-center gap-1 normal-case text-[10px]"
                    >
                      <ExternalLink className="w-3 h-3" /> Test Link
                    </a>
                  )}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <Globe className="w-4 h-4 text-cyan-400/80" />
                  </div>
                  <input
                    type="text"
                    name="link"
                    value={formData.link}
                    onChange={handleChange}
                    placeholder="https://dashboard.stripe.com/apikeys"
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors font-mono text-[11px]"
                  />
                </div>
              </div>

              {/* Category & Status */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-tight block">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors text-xs"
                  >
                    {DEFAULT_CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-bold text-slate-300 uppercase tracking-tight block">
                    Status
                  </label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleChange}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 transition-colors text-xs"
                  >
                    <option value="Uncompleted">Uncompleted</option>
                    <option value="Complete">Complete</option>
                  </select>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-tight block">
                  Description / Details
                </label>
                <textarea
                  name="description"
                  rows={3}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Primary dashboard for managing test credit cards, webhooks, and sandbox API secrets..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors"
                />
              </div>

              {/* Extra Notes */}
              <div className="space-y-1.5">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-tight block">
                  Security Note / Tags (Optional)
                </label>
                <input
                  type="text"
                  name="note"
                  value={formData.note}
                  onChange={handleChange}
                  placeholder="e.g. 2FA enabled on admin@mail.com, renewal due next month"
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-slate-100 placeholder-slate-600 focus:outline-none focus:border-cyan-500 transition-colors text-[11px]"
                />
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3 px-4 bg-gradient-to-r from-cyan-600 via-indigo-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white font-extrabold uppercase tracking-wider rounded-xl shadow-lg transition-all duration-200 flex items-center justify-center space-x-2 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving to Vault...</span>
                  </>
                ) : (
                  <>
                    <FolderPlus className="w-4 h-4" />
                    <span>Save to Data Vault</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Right Column: List & Filters (7 Cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Search & Filter Controls */}
          <div className="bg-slate-900/90 border border-slate-800/90 p-4 rounded-2xl backdrop-blur-xl shadow-lg space-y-3">
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1">
                <SearchIcon className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, description, URL, or notes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors"
                />
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm('')} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>

              {/* Status filter toggle */}
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
                    {st === 'ALL' ? 'All' : st}
                  </button>
                ))}
              </div>
            </div>

            {/* Category Badges */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none text-[11px]">
              <button
                onClick={() => setSelectedCategory('ALL')}
                className={cn(
                  "px-3 py-1 rounded-lg font-bold shrink-0 transition-all",
                  selectedCategory === 'ALL'
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                )}
              >
                All Categories ({items.length})
              </button>
              {categoriesInUse.map(cat => {
                const count = items.filter(i => i.category === cat).length;
                return (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={cn(
                      "px-3 py-1 rounded-lg font-bold shrink-0 transition-all flex items-center gap-1",
                      selectedCategory === cat
                        ? "bg-cyan-600 text-white shadow-sm"
                        : "bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800"
                    )}
                  >
                    <span>{cat}</span>
                    <span className="text-[9px] opacity-70 font-mono">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Records List */}
          {loading ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-500 text-xs font-mono animate-pulse">
              Loading Data Vault records...
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-12 text-center text-slate-400 space-y-3">
              <div className="p-3 bg-slate-800/50 rounded-2xl w-fit mx-auto text-slate-500">
                <Bookmark className="w-8 h-8" />
              </div>
              <p className="font-bold text-sm text-slate-300">No Data Vault Entries Found</p>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {searchTerm || selectedCategory !== 'ALL' || selectedStatus !== 'ALL'
                  ? "No records match your active search filters. Try clearing filters."
                  : "Start by creating your first entry on the left or use Bulk Import."}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredItems.map(item => {
                const isComplete = item.status === 'Complete';
                return (
                  <div
                    key={item.id}
                    className={cn(
                      "bg-slate-900/90 border rounded-2xl p-4.5 transition-all shadow-md hover:border-slate-700 relative overflow-hidden group space-y-3",
                      isComplete ? "border-emerald-500/30 bg-gradient-to-r from-emerald-950/10 via-slate-900/90 to-slate-900/90" : "border-slate-800/90"
                    )}
                  >
                    {/* Top Row: Name, Category, Status & Quick Action Buttons */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-extrabold text-sm text-white truncate tracking-tight">
                            {item.name}
                          </h3>
                          {item.category && (
                            <span className="px-2 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 text-[10px] font-bold">
                              {item.category}
                            </span>
                          )}
                          <button
                            onClick={() => handleToggleStatus(item)}
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
                      </div>

                      {/* Top Action Icons */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {/* QR Code trigger */}
                        <button
                          onClick={() => setQrModalItem({
                            title: `QR Code: ${item.name}`,
                            subtitle: item.category || 'Data Vault Resource',
                            data: item,
                            value: item.link || item.description || item.name
                          })}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 transition-colors"
                          title="Generate Advanced QR Code"
                        >
                          <QrCode className="w-4 h-4" />
                        </button>

                        {/* Edit Record */}
                        <button
                          onClick={() => setEditingItem(item)}
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-300 transition-colors"
                          title="Edit Resource"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete Record */}
                        {item.id && (
                          <button
                            onClick={() => handleDelete(item.id!, item.name)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-950/50 text-rose-400 transition-colors"
                            title="Delete Resource"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-slate-300 leading-relaxed font-sans bg-slate-950/40 p-2.5 rounded-xl border border-slate-800/60">
                        {item.description}
                      </p>
                    )}

                    {/* Link Bar & Copy */}
                    {item.link ? (
                      <div className="flex items-center justify-between bg-slate-950 p-2 px-3 rounded-xl border border-slate-800 text-xs font-mono">
                        <div className="flex items-center space-x-2 min-w-0 flex-1 pr-2">
                          <Link2 className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                          <span className="text-cyan-300 truncate text-[11px]">
                            {item.link}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5 shrink-0">
                          <button
                            onClick={() => handleCopy(item.link, `link-${item.id}`)}
                            className="p-1 px-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-[10px] font-bold flex items-center gap-1 transition-colors border border-slate-800"
                          >
                            {copiedId === `link-${item.id}` ? (
                              <>
                                <Check className="w-3 h-3 text-teal-400" />
                                <span className="text-teal-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                          <a
                            href={item.link.startsWith('http') ? item.link : `https://${item.link}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 px-2.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 hover:text-cyan-200 text-[10px] font-bold flex items-center gap-1 transition-colors border border-cyan-500/30"
                          >
                            <ExternalLink className="w-3 h-3" />
                            <span>Open</span>
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div className="text-[11px] text-slate-500 italic">
                        No link specified
                      </div>
                    )}

                    {/* Footer: Notes & Date */}
                    {(item.note || item.created_at) && (
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                        <span className="truncate max-w-[70%]">
                          {item.note && <span className="text-slate-400 font-sans">💡 {item.note}</span>}
                        </span>
                        {item.created_at && (
                          <span className="font-mono text-slate-600">
                            {format(new Date(item.created_at), 'yyyy-MM-dd')}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Bulk Import Modal */}
      {showBulkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-black text-sm text-white uppercase tracking-wider flex items-center gap-2">
                <Upload className="w-4 h-4 text-teal-400" />
                Bulk Import to Data Vault
              </h3>
              <button 
                onClick={() => setShowBulkModal(false)}
                className="text-slate-400 hover:text-white text-lg font-bold"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Paste multiple entries (one per line). Supported format: <br/>
              <code className="text-cyan-300 font-mono text-[11px]">Name | Description | Link | Category</code> or <br/>
              <code className="text-cyan-300 font-mono text-[11px]">Name, Description, https://link.com</code>
            </p>

            <textarea
              rows={8}
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder={`Supabase Studio | Cloud PostgreSQL & Auth Portal | https://app.supabase.com | Dev & Repos\nFigma Designs | Mobile App UI Wireframes | https://figma.com/file/123 | Tools & AI`}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-200 placeholder-slate-600 font-mono focus:outline-none focus:border-cyan-500"
            />

            <div className="flex items-center justify-end space-x-2 pt-2">
              <button
                onClick={() => setShowBulkModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-bold"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkImport}
                disabled={!bulkText.trim()}
                className="px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-lg disabled:opacity-50"
              >
                Import Entries
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Record Modal */}
      {editingItem && (
        <EditRecordModal
          account={editingItem}
          type="data_vault"
          onClose={() => setEditingItem(null)}
          onSave={(updatedData: any) => {
            const updated = items.map(i => i.id === editingItem.id ? { ...i, ...updatedData } : i);
            setItems(updated);
            localStorage.setItem('zxhub_data_vault_cache', JSON.stringify(updated));
            setEditingItem(null);
          }}
        />
      )}

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
