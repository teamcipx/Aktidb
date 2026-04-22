import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Database, UserPlus, Users, Search as SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Overview() {
  const [fbCount, setFbCount] = useState<number | null>(null);
  const [gmailCount, setGmailCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      const { count: fb } = await supabase.from('fb_accounts').select('*', { count: 'exact', head: true });
      const { count: gmail } = await supabase.from('gmail_accounts').select('*', { count: 'exact', head: true });
      setFbCount(fb || 0);
      setGmailCount(gmail || 0);
      setLoading(false);
    }
    fetchStats();
  }, []);

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex justify-between items-center bg-white border-b border-slate-200 px-4 md:px-8 py-4 -mx-4 md:-mx-8 -mt-4 md:-mt-8 mb-4 shrink-0">
        <div className="flex items-center space-x-2 text-indigo-600">
          <Database className="w-5 h-5 font-bold" />
          <h1 className="text-xs font-bold uppercase tracking-wider">Account Overview</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 shrink-0">
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-center space-y-2">
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest text-center">Total Accounts</p>
          <p className="text-4xl font-bold text-slate-900 text-center">
            {loading ? '-' : (fbCount || 0) + (gmailCount || 0)}
          </p>
        </div>

        <div className="bg-indigo-50 rounded-xl border border-indigo-100 p-5 shadow-sm flex flex-col justify-center space-y-2">
          <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest text-center">Facebook</p>
          <p className="text-4xl font-bold text-slate-900 text-center">{loading ? '-' : fbCount}</p>
        </div>

        <div className="bg-sky-50 rounded-xl border border-sky-100 p-5 shadow-sm flex flex-col justify-center space-y-2">
          <p className="text-[10px] text-sky-600 font-bold uppercase tracking-widest text-center">Gmail</p>
          <p className="text-4xl font-bold text-slate-900 text-center">{loading ? '-' : gmailCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 border-t border-slate-200 shrink-0">
        <Link to="/add-fb" className="group flex items-center p-4 bg-white border border-slate-200 shadow-sm hover:border-indigo-300 rounded-xl transition-all">
          <div className="p-3 bg-indigo-50 text-indigo-600 rounded mr-4">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">Add FB Account</h3>
            <p className="text-xs text-slate-500 mt-0.5">Register new Facebook entry</p>
          </div>
        </Link>

        <Link to="/add-gmail" className="group flex items-center p-4 bg-white border border-slate-200 shadow-sm hover:border-indigo-300 rounded-xl transition-all">
          <div className="p-3 bg-sky-50 text-sky-600 rounded mr-4">
            <UserPlus className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">Add Gmail Account</h3>
            <p className="text-xs text-slate-500 mt-0.5">Register new Google entry</p>
          </div>
        </Link>
        
        <Link to="/search" className="group flex items-center p-4 bg-white border border-slate-200 shadow-sm hover:border-indigo-300 rounded-xl transition-all">
          <div className="p-3 bg-slate-50 text-slate-600 rounded mr-4">
            <SearchIcon className="w-5 h-5" />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-indigo-600">Search Database</h3>
            <p className="text-xs text-slate-500 mt-0.5">Advanced filtering & lookups</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
