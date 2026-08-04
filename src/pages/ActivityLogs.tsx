import React, { useState, useEffect } from 'react';
import { Terminal, Shield, RefreshCw, Trash2, Download, Search, Filter, Clock, Activity, CheckCircle2, AlertCircle, ArrowUpRight, Zap, Eye } from 'lucide-react';
import { getActivityLogs, clearActivityLogs, logActivity, ActivityLog } from '../lib/logger';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

export default function ActivityLogs() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const data = await getActivityLogs(200);
    setLogs(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
    
    // Auto refresh logs every 5 seconds if live mode is enabled
    const interval = setInterval(() => {
      if (autoRefresh) {
        getActivityLogs(200).then(data => setLogs(data));
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const handleClearLogs = async () => {
    if (window.confirm('Are you sure you want to clear all system terminal logs?')) {
      await clearActivityLogs();
      await logActivity('DELETE', 'SYSTEM', 'Audit Terminal Logs Cleared', 'User reset activity history');
      await fetchLogs();
    }
  };

  const handleExportTxt = () => {
    const txtContent = logs.map(l => 
      `[${format(new Date(l.created_at), 'yyyy-MM-dd HH:mm:ss')}] [${l.action_type}] [${l.category}] ${l.title} ${l.details ? `| Details: ${l.details}` : ''}`
    ).join('\n');

    const blob = new Blob([txtContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `zx_hub_terminal_logs_${format(new Date(), 'yyyyMMdd_HHmmss')}.log`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredLogs = logs.filter(log => {
    const matchesAction = filterAction === 'ALL' || log.action_type === filterAction;
    const matchesSearch = 
      log.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.details && log.details.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesAction && matchesSearch;
  });

  const getBadgeStyle = (action: ActivityLog['action_type']) => {
    switch (action) {
      case 'LOGIN':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40';
      case 'DASHBOARD':
        return 'bg-indigo-500/20 text-indigo-400 border-indigo-500/40';
      case 'CREATE':
        return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      case 'UPDATE':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'DELETE':
        return 'bg-rose-500/20 text-rose-400 border-rose-500/40';
      case 'STATUS_CHANGE':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/40';
      case 'EXPORT':
        return 'bg-teal-500/20 text-teal-300 border-teal-500/40';
      default:
        return 'bg-slate-700/40 text-slate-300 border-slate-600/40';
    }
  };

  const lastLogin = logs.find(l => l.action_type === 'LOGIN');
  const lastDashboard = logs.find(l => l.action_type === 'DASHBOARD');
  const totalCreates = logs.filter(l => l.action_type === 'CREATE').length;
  const totalUpdates = logs.filter(l => l.action_type === 'UPDATE').length;

  return (
    <div className="space-y-6 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-l from-emerald-500/10 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none"></div>

        <div className="flex items-center space-x-4 mb-4 md:mb-0 z-10">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-500 p-[2px] shadow-lg shadow-emerald-500/20">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
              <Terminal className="w-6 h-6 text-emerald-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl md:text-2xl font-extrabold text-white tracking-tight font-display">SYSTEM TERMINAL LOGS</h1>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase tracking-widest flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping inline-block"></span>
                Audit Mode
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">Real-time command stream tracking creations, updates, logins, and dashboard activity</p>
          </div>
        </div>

        {/* Toolbar buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto z-10 justify-end">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={cn(
              "flex items-center justify-center px-3.5 py-2 text-xs font-bold uppercase tracking-wider rounded-xl transition-all border shadow-sm",
              autoRefresh 
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                : "bg-slate-800 text-slate-400 border-slate-700"
            )}
          >
            <Activity className={cn("w-3.5 h-3.5 mr-1.5", autoRefresh && "animate-pulse")} />
            <span>{autoRefresh ? 'Live Stream ON' : 'Live Paused'}</span>
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center justify-center px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 rounded-xl transition-all shadow-sm"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 mr-1.5", loading && "animate-spin")} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleExportTxt}
            className="flex items-center justify-center px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-teal-300 bg-teal-500/10 hover:bg-teal-500/20 border border-teal-500/30 rounded-xl transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5 mr-1.5" />
            <span>Export .LOG</span>
          </button>

          <button
            onClick={handleClearLogs}
            className="flex items-center justify-center px-3.5 py-2 text-xs font-bold uppercase tracking-wider text-rose-300 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-xl transition-all shadow-sm"
          >
            <Trash2 className="w-3.5 h-3.5 mr-1.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Top Stat Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Last Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
            <Shield className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Last Login Event</p>
            <p className="text-xs font-bold text-slate-100 truncate mt-0.5">
              {lastLogin ? format(new Date(lastLogin.created_at), 'MMM dd, HH:mm:ss') : 'No login log'}
            </p>
            <p className="text-[10px] text-emerald-400 truncate mt-0.5 font-mono">
              {lastLogin ? lastLogin.title : 'Vault locked'}
            </p>
          </div>
        </div>

        {/* Last Dashboard Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 shrink-0">
            <Zap className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Last Dashboard Visit</p>
            <p className="text-xs font-bold text-slate-100 truncate mt-0.5">
              {lastDashboard ? format(new Date(lastDashboard.created_at), 'MMM dd, HH:mm:ss') : 'No record'}
            </p>
            <p className="text-[10px] text-indigo-400 truncate mt-0.5 font-mono">
              {lastDashboard ? 'Overview Command Center' : 'Idle'}
            </p>
          </div>
        </div>

        {/* Total Creates */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 shrink-0">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Created Records</p>
            <p className="text-lg font-extrabold text-white font-mono mt-0.5">{totalCreates}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Accounts, keys & projects</p>
          </div>
        </div>

        {/* Total Updates */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 shadow-lg flex items-center space-x-3">
          <div className="p-3 rounded-xl bg-amber-500/10 text-amber-300 border border-amber-500/20 shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Modified Records</p>
            <p className="text-lg font-extrabold text-white font-mono mt-0.5">{totalUpdates}</p>
            <p className="text-[10px] text-slate-400 mt-0.5">Updates & edits logged</p>
          </div>
        </div>
      </div>

      {/* Terminal Container */}
      <div className="bg-slate-950 border border-slate-800/90 rounded-2xl overflow-hidden shadow-2xl font-mono text-xs">
        {/* Terminal Header */}
        <div className="bg-slate-900/95 px-4 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-rose-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-amber-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-emerald-500/80"></div>
            <span className="text-[11px] font-bold text-slate-400 ml-2 tracking-widest uppercase flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-400" /> zx-hub@audit-terminal:~$ log-stream
            </span>
          </div>

          {/* Quick Filters */}
          <div className="flex items-center space-x-2 overflow-x-auto scroll-hide py-0.5">
            {['ALL', 'LOGIN', 'DASHBOARD', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE'].map((act) => (
              <button
                key={act}
                onClick={() => setFilterAction(act)}
                className={cn(
                  "px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider uppercase transition-all whitespace-nowrap border",
                  filterAction === act
                    ? "bg-emerald-500 text-slate-950 font-extrabold border-emerald-400 shadow-sm"
                    : "bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800"
                )}
              >
                {act}
              </button>
            ))}
          </div>
        </div>

        {/* Terminal Search Bar */}
        <div className="p-3 bg-slate-900/50 border-b border-slate-800/80 flex items-center space-x-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-emerald-400">
              <Search className="w-3.5 h-3.5" />
            </div>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search terminal logs by title, category, or detail text..."
              className="w-full pl-9 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-emerald-500/50 font-mono"
            />
          </div>
          <div className="text-[11px] text-slate-500 whitespace-nowrap">
            Showing <span className="text-emerald-400 font-bold">{filteredLogs.length}</span> of <span className="text-slate-300 font-bold">{logs.length}</span> logs
          </div>
        </div>

        {/* Terminal Stream Output */}
        <div className="p-4 space-y-2 max-h-[600px] overflow-y-auto scroll-hide bg-slate-950/95 font-mono">
          {loading && logs.length === 0 ? (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <RefreshCw className="w-6 h-6 animate-spin mx-auto text-emerald-400" />
              <p className="text-xs">Connecting to system audit stream...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-slate-600 space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-slate-700" />
              <p className="text-xs">No activity logs matching criteria.</p>
              <p className="text-[10px] text-slate-600">Actions like logging in, creating/editing accounts or visiting dashboard will automatically record here.</p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedId === log.id;
              const dateObj = new Date(log.created_at);
              const formattedDate = isNaN(dateObj.getTime()) ? log.created_at : format(dateObj, 'yyyy-MM-dd HH:mm:ss');

              return (
                <div
                  key={log.id}
                  onClick={() => setExpandedId(isExpanded ? null : log.id)}
                  className="group flex flex-col p-2.5 rounded-lg border border-slate-900 hover:border-slate-800 hover:bg-slate-900/60 transition-colors cursor-pointer"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-slate-500 font-bold text-[11px]">
                      [{formattedDate}]
                    </span>

                    <span className={cn("px-2 py-0.5 rounded border text-[10px] font-extrabold tracking-wider uppercase", getBadgeStyle(log.action_type))}>
                      {log.action_type}
                    </span>

                    <span className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[10px] uppercase font-bold">
                      {log.category}
                    </span>

                    <span className="text-slate-200 font-semibold text-xs flex-1 truncate">
                      {log.title}
                    </span>

                    {log.details && (
                      <span className="text-slate-500 text-[10px] group-hover:text-emerald-400 flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {isExpanded ? 'Hide' : 'Details'}
                      </span>
                    )}
                  </div>

                  {log.details && isExpanded && (
                    <div className="mt-2 p-2.5 rounded bg-slate-900/90 border border-slate-800/80 text-emerald-400 text-[11px] leading-relaxed whitespace-pre-wrap animate-fade-in font-mono">
                      <div className="text-slate-500 text-[10px] mb-1 font-bold uppercase tracking-wider">// Execution Context & Metadata</div>
                      {log.details}
                      <div className="text-slate-600 text-[10px] mt-1">User: {log.user_email || 'Administrator'} | ID: {log.id}</div>
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* Terminal Command Prompt cursor */}
          <div className="pt-2 flex items-center text-emerald-400 font-mono text-xs gap-2 border-t border-slate-900 mt-4">
            <span className="text-slate-600">&gt;</span>
            <span className="text-emerald-400 animate-pulse">_</span>
            <span className="text-[10px] text-slate-600">Awaiting system events...</span>
          </div>
        </div>
      </div>
    </div>
  );
}
