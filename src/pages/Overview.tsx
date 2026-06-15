import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database, UserPlus, Users, Search as SearchIcon, Phone, Download, FileJson } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';

export default function Overview() {
  const [fbCount, setFbCount] = useState<number | null>(null);
  const [gmailCount, setGmailCount] = useState<number | null>(null);
  const [supabaseCount, setSupabaseCount] = useState<number | null>(null);
  const [githubCount, setGithubCount] = useState<number | null>(null);
  const [specialFbCount, setSpecialFbCount] = useState<number | null>(null);
  const [specialGmailCount, setSpecialGmailCount] = useState<number | null>(null);
  const [contactCount, setContactCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { count: fb } = await supabase.from('fb_accounts').select('*', { count: 'exact', head: true });
      const { count: gmail } = await supabase.from('gmail_accounts').select('*', { count: 'exact', head: true });
      const { count: sup } = await supabase.from('supabase_accounts').select('*', { count: 'exact', head: true });
      const { count: git } = await supabase.from('github_accounts').select('*', { count: 'exact', head: true });
      const { count: specFb } = await supabase.from('special_fb_accounts').select('*', { count: 'exact', head: true });
      const { count: specGm } = await supabase.from('special_gmail_accounts').select('*', { count: 'exact', head: true });
      const { count: contact } = await supabase.from('contact_numbers').select('*', { count: 'exact', head: true });
      
      setFbCount(fb || 0);
      setGmailCount(gmail || 0);
      setSupabaseCount(sup || 0);
      setGithubCount(git || 0);
      setSpecialFbCount(specFb || 0);
      setSpecialGmailCount(specGm || 0);
      setContactCount(contact || 0);
      setLoading(false);
    }
    fetchStats();
  }, []);

  const exportData = async (formatType: 'json' | 'csv') => {
    setLoading(true);
    try {
      const tables = [
        'fb_accounts', 'gmail_accounts', 'supabase_accounts', 
        'github_accounts', 'special_fb_accounts', 'special_gmail_accounts', 
        'contact_numbers'
      ];
      
      const responses = await Promise.all(
        tables.map(table => supabase.from(table).select('*').order('created_at', { ascending: false }))
      );
      
      const allData: Record<string, any[]> = {};
      tables.forEach((table, index) => {
        allData[table] = responses[index].data || [];
      });

      const dateStr = format(new Date(), 'yyyy-MM-dd');
      
      if (formatType === 'json') {
        const blob = new Blob([JSON.stringify(allData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `akti_full_backup_${dateStr}.json`;
        link.click();
      } else if (formatType === 'csv') {
        // Find all possible headers
        const allKeys = new Set<string>();
        tables.forEach(table => {
          allData[table].forEach(row => {
            Object.keys(row).forEach(k => allKeys.add(k));
          });
        });
        const headers = ['table_source', ...Array.from(allKeys)];
        
        let csvContent = headers.join(',') + '\n';
        tables.forEach(table => {
          allData[table].forEach(row => {
            const rowValues = headers.map(header => {
              if (header === 'table_source') return `"${table}"`;
              let val = row[header];
              if (val === null || val === undefined) return '';
              return `"${String(val).replace(/"/g, '""')}"`;
            });
            csvContent += rowValues.join(',') + '\n';
          });
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `akti_full_backup_${dateStr}.csv`;
        link.click();
      }
    } catch (err) {
      console.error(err);
      alert('Error exporting data.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 flex flex-col h-full">
        <div className="flex justify-between items-center bg-slate-900 border-b border-slate-800 px-4 md:px-8 py-4 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-4 shrink-0 relative">
        <div className="flex items-center space-x-2 text-indigo-400">
          <Database className="w-5 h-5 font-bold" />
          <h1 className="text-xs font-bold uppercase tracking-wider text-slate-100">Account Overview</h1>
        </div>
        <div className="flex items-center space-x-2 absolute md:static right-4 top-3">
          <button 
            onClick={() => exportData('csv')}
            title="Export Backup (CSV)"
            className="flex items-center justify-center p-2 text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded transition-colors"
          >
            <Download className="w-4 h-4 mr-1.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block pt-0.5">CSV Backup</span>
          </button>
          <button 
            onClick={() => exportData('json')}
            title="Export Backup (JSON)"
            className="flex items-center justify-center p-2 text-sky-400 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/20 rounded transition-colors"
          >
            <FileJson className="w-4 h-4 mr-1.5" />
            <span className="text-[10px] font-bold uppercase tracking-widest hidden sm:block pt-0.5">JSON Backup</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8 shrink-0">
        <div className="bg-slate-900 rounded-xl border border-slate-800 p-5 shadow-sm flex flex-col justify-center space-y-2 lg:col-span-1">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Total Entries</p>
          <p className="text-4xl font-bold text-slate-100 text-center">
            {loading ? '-' : (fbCount || 0) + (gmailCount || 0) + (supabaseCount || 0) + (githubCount || 0) + (specialFbCount || 0) + (specialGmailCount || 0) + (contactCount || 0)}
          </p>
        </div>

        <div className="bg-indigo-950/30 rounded-xl border border-indigo-900/50 p-5 shadow-sm flex flex-col justify-center space-y-2">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest text-center">Facebook</p>
          <p className="text-4xl font-bold text-slate-100 text-center">{loading ? '-' : fbCount}</p>
        </div>

        <div className="bg-sky-950/30 rounded-xl border border-sky-900/50 p-5 shadow-sm flex flex-col justify-center space-y-2">
          <p className="text-[10px] text-sky-400 font-bold uppercase tracking-widest text-center">Gmail</p>
          <p className="text-4xl font-bold text-slate-100 text-center">{loading ? '-' : gmailCount}</p>
        </div>

        <div className="bg-emerald-950/30 rounded-xl border border-emerald-900/50 p-5 shadow-sm flex flex-col justify-center space-y-2">
          <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest text-center">Supabase</p>
          <p className="text-4xl font-bold text-slate-100 text-center">{loading ? '-' : supabaseCount}</p>
        </div>

        <div className="bg-slate-800/50 rounded-xl border border-slate-700/50 p-5 shadow-sm flex flex-col justify-center space-y-2">
          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest text-center">Github</p>
          <p className="text-4xl font-bold text-slate-100 text-center">{loading ? '-' : githubCount}</p>
        </div>
        
        <div className="bg-amber-950/30 rounded-xl border border-amber-900/50 p-5 shadow-sm flex flex-col justify-center space-y-2">
          <p className="text-[10px] text-amber-400 font-bold uppercase tracking-widest text-center">Contact</p>
          <p className="text-4xl font-bold text-slate-100 text-center">{loading ? '-' : contactCount}</p>
        </div>

        <div className="bg-rose-950/30 rounded-xl border border-rose-900/50 p-5 shadow-sm flex flex-col justify-center space-y-2">
          <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest text-center">Special FB</p>
          <p className="text-4xl font-bold text-slate-100 text-center">{loading ? '-' : specialFbCount}</p>
        </div>

        <div className="bg-rose-950/30 rounded-xl border border-rose-900/50 p-5 shadow-sm flex flex-col justify-center space-y-2">
          <p className="text-[10px] text-rose-400 font-bold uppercase tracking-widest text-center">Special Gmail</p>
          <p className="text-4xl font-bold text-slate-100 text-center">{loading ? '-' : specialGmailCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-6 border-t border-slate-800 shrink-0">
        <Link to="/add-fb" className="group flex items-center p-4 bg-slate-900 border border-slate-800 shadow-sm hover:border-indigo-500/50 hover:bg-slate-800/50 rounded-xl transition-all">
          <div className="p-3 bg-indigo-900/40 text-indigo-400 rounded mr-4">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400">Add FB Account</h3>
            <p className="text-xs text-slate-500 mt-0.5">Register new Facebook entry</p>
          </div>
        </Link>
        <Link to="/add-special-fb" className="group flex items-center p-4 bg-slate-900 border border-rose-900/50 shadow-sm hover:border-rose-500/50 hover:bg-rose-950/20 rounded-xl transition-all">
          <div className="p-3 bg-rose-900/40 text-rose-400 rounded mr-4">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-rose-400">Special FB</h3>
            <p className="text-xs text-slate-500 mt-0.5">High security FB record</p>
          </div>
        </Link>

        <Link to="/add-gmail" className="group flex items-center p-4 bg-slate-900 border border-slate-800 shadow-sm hover:border-sky-500/50 hover:bg-slate-800/50 rounded-xl transition-all">
          <div className="p-3 bg-sky-900/40 text-sky-400 rounded mr-4">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-sky-400">Add Gmail Account</h3>
            <p className="text-xs text-slate-500 mt-0.5">Register new Google entry</p>
          </div>
        </Link>
        <Link to="/add-special-gmail" className="group flex items-center p-4 bg-slate-900 border border-rose-900/50 shadow-sm hover:border-rose-500/50 hover:bg-rose-950/20 rounded-xl transition-all">
          <div className="p-3 bg-rose-900/40 text-rose-400 rounded mr-4">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-rose-400">Special Gmail</h3>
            <p className="text-xs text-slate-500 mt-0.5">High security Google record</p>
          </div>
        </Link>
        
        <Link to="/add-contact" className="group flex items-center p-4 bg-slate-900 border border-slate-800 shadow-sm hover:border-amber-500/50 hover:bg-slate-800/50 rounded-xl transition-all">
          <div className="p-3 bg-amber-900/40 text-amber-400 rounded mr-4">
            <Phone className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-amber-400">Add Contact</h3>
            <p className="text-xs text-slate-500 mt-0.5">Phone number & address</p>
          </div>
        </Link>
        
        <Link to="/add-supabase" className="group flex items-center p-4 bg-slate-900 border border-slate-800 shadow-sm hover:border-emerald-500/50 hover:bg-slate-800/50 rounded-xl transition-all">
          <div className="p-3 bg-emerald-900/40 text-emerald-400 rounded mr-4">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-emerald-400">Add Supabase</h3>
            <p className="text-xs text-slate-500 mt-0.5">Register new DB Project</p>
          </div>
        </Link>
        
        <Link to="/add-github" className="group flex items-center p-4 bg-slate-900 border border-slate-800 shadow-sm hover:border-violet-500/50 hover:bg-slate-800/50 rounded-xl transition-all">
          <div className="p-3 bg-violet-900/40 text-violet-400 rounded mr-4">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-violet-400">Add Github</h3>
            <p className="text-xs text-slate-500 mt-0.5">Register new Repo Account</p>
          </div>
        </Link>
        
        <Link to="/search" className="group flex items-center p-4 bg-slate-900 border border-slate-800 shadow-sm hover:border-indigo-500/50 hover:bg-slate-800/50 rounded-xl transition-all">
          <div className="p-3 bg-slate-800 text-slate-400 rounded mr-4">
            <SearchIcon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-200 group-hover:text-indigo-400">Search Database</h3>
            <p className="text-xs text-slate-500 mt-0.5">Advanced filtering & lookups</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
