import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Database, Search, LogOut, ShieldCheck, Mail, Facebook, Menu, X, Github, ShieldAlert, Phone, CheckSquare, Send, Triangle, Layers, Sparkles, Download, Smartphone, Image, FolderKanban, Terminal, Fingerprint, Clock, Shield, Bookmark } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';
import BiometricSettingsModal from './BiometricSettingsModal';
import { useIdleTimeout } from '../hooks/useIdleTimeout';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);

  const { secondsRemaining, showWarning, resetTimer } = useIdleTimeout();

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const checkStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(checkStandalone);

    const handleBeforeInstallPrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('akti_auth');
    localStorage.removeItem('zxhub_last_activity_time');
    navigate('/login');
  };

  const navGroups = [
    {
      title: 'Dashboard & Core',
      items: [
        { name: 'Overview', href: '/', icon: Layers, badge: 'Hub' },
        { name: 'Terminal Logs', href: '/logs', icon: Terminal, color: 'text-emerald-400', badge: 'Audit' },
        { name: 'Task Manager', href: '/tasks', icon: CheckSquare },
        { name: 'Data Vault', href: '/data-vault', icon: Bookmark, color: 'text-cyan-400', badge: 'Vault' },
        { name: 'Universal Search', href: '/search', icon: Search, badge: 'All' },
      ]
    },
    {
      title: 'Cloud & DevOps',
      items: [
        { name: 'Add Project', href: '/add-project', icon: FolderKanban, color: 'text-indigo-400', badge: 'New' },
        { name: 'ImgBB API Vault', href: '/imgbb', icon: Image, color: 'text-teal-400', badge: 'Teal' },
        { name: 'FreeImg Host Vault', href: '/freeimg', icon: Image, color: 'text-amber-400', badge: 'Flame' },
        { name: 'Add Vercel', href: '/add-vercel', icon: Triangle, color: 'text-purple-400' },
        { name: 'Add Supabase', href: '/add-supabase', icon: Database, color: 'text-emerald-400' },
        { name: 'Add Github', href: '/add-github', icon: Github, color: 'text-slate-300' },
        { name: 'Add Brevo', href: '/add-brevo', icon: Send, color: 'text-teal-400' },
      ]
    },
    {
      title: 'Socials & Comms',
      items: [
        { name: 'Add Facebook', href: '/add-fb', icon: Facebook, color: 'text-blue-400' },
        { name: 'Add Special FB', href: '/add-special-fb', icon: ShieldAlert, color: 'text-rose-400' },
        { name: 'Add Gmail', href: '/add-gmail', icon: Mail, color: 'text-red-400' },
        { name: 'Add Special Gmail', href: '/add-special-gmail', icon: ShieldAlert, color: 'text-rose-400' },
        { name: 'Add Contact', href: '/add-contact', icon: Phone, color: 'text-amber-400' },
      ]
    }
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-40 md:hidden animate-fade-in" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[270px] flex-shrink-0 bg-slate-900/95 md:bg-slate-900/80 backdrop-blur-xl border-r border-slate-800/80 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0 shadow-2xl md:shadow-none",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        {/* Brand Header */}
        <div className="p-5 border-b border-slate-800/80 flex flex-col items-start bg-gradient-to-b from-indigo-950/20 to-transparent">
          <div className="flex items-center w-full justify-between">
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-teal-400 flex items-center justify-center shadow-lg shadow-indigo-500/25 group-hover:scale-105 transition-transform duration-200">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-extrabold tracking-tight text-white font-display flex items-center gap-1.5">
                  ZX HUB <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 uppercase tracking-widest">PRO</span>
                </span>
                <span className="text-[11px] font-semibold text-slate-400 tracking-wide">Asset & Cloud Manager</span>
              </div>
            </Link>
            <button className="md:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        
        {/* Nav List */}
        <nav className="flex-1 px-3 py-4 space-y-6 overflow-y-auto scroll-hide">
          {navGroups.map((group) => (
            <div key={group.title} className="space-y-1">
              <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-3 mb-2 flex items-center justify-between">
                <span>{group.title}</span>
              </div>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "group flex items-center justify-between px-3 py-2.5 text-xs sm:text-sm font-semibold rounded-xl transition-all duration-150",
                        isActive
                          ? "bg-gradient-to-r from-indigo-600/20 to-purple-600/10 text-indigo-300 border border-indigo-500/30 shadow-sm"
                          : "text-slate-400 hover:bg-slate-800/60 hover:text-slate-200 border border-transparent"
                      )}
                    >
                      <div className="flex items-center min-w-0">
                        <item.icon
                          className={cn(
                            "mr-3 flex-shrink-0 h-4 w-4 transition-colors",
                            isActive ? "text-indigo-400" : (item.color || "text-slate-500 group-hover:text-slate-300")
                          )}
                        />
                        <span className="truncate">{item.name}</span>
                      </div>
                      {item.badge && (
                        <span className={cn(
                          "ml-2 px-1.5 py-0.5 text-[10px] font-bold uppercase rounded-md",
                          isActive ? "bg-indigo-500/30 text-indigo-200" : "bg-slate-800 text-slate-400 group-hover:bg-slate-700"
                        )}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* PWA App Install & Status Card */}
          <div className="px-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-slate-900/80 border border-indigo-500/30 shadow-lg relative overflow-hidden group">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-extrabold text-white block">ZX HUB PWA</span>
                    <span className="text-[10px] font-semibold text-indigo-300 block">Offline Capable</span>
                  </div>
                </div>
                {isStandalone ? (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 uppercase">Active</span>
                ) : (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 uppercase">Ready</span>
                )}
              </div>
              
              {deferredPrompt ? (
                <button
                  onClick={handleInstallClick}
                  className="w-full mt-2 py-2 px-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install Native App</span>
                </button>
              ) : isStandalone ? (
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Running as native standalone PWA on your device.</p>
              ) : (
                <p className="text-[10px] text-slate-400 mt-1 leading-relaxed">Install via browser menu (Add to Home Screen) for instant offline vault access.</p>
              )}
            </div>
          </div>
        </nav>

        {/* Footer Profile & Logout */}
        <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 space-y-3">
          <div className="flex items-center px-2 py-1.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white shadow">
              ZX
            </div>
            <div className="ml-3 min-w-0 flex-1">
              <p className="text-xs font-bold text-slate-200 truncate">ZX Administrator</p>
              <div className="flex items-center justify-between mt-0.5">
                <p className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span> Vault Unlocked
                </p>
                <span className="text-[9px] text-amber-400 font-mono bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20" title="30 Minute Idle Timeout Active">
                  30m Auto Lock
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => setShowBioModal(true)}
              className="group flex items-center justify-center px-2 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-teal-500/10 text-teal-300 hover:bg-teal-500/20 border border-teal-500/30 transition-all"
              title="Configure Fingerprint / Face ID Passkeys"
            >
              <Fingerprint className="mr-1.5 h-3.5 w-3.5 text-teal-400 group-hover:scale-110 transition-transform" />
              <span>Passkeys</span>
            </button>
            <button
              onClick={handleLogout}
              className="group flex items-center justify-center px-2 py-2 text-[11px] font-bold uppercase tracking-wider rounded-lg bg-slate-800/80 text-slate-300 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/30 border border-slate-700/60 transition-all"
            >
              <LogOut className="mr-1.5 h-3.5 w-3.5 text-slate-400 group-hover:text-rose-400 transition-colors" />
              <span>Lock</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto w-full bg-slate-950/90 relative">
        {/* Floating Idle Timeout Warning Banner */}
        {showWarning && (
          <div className="bg-gradient-to-r from-amber-600 via-amber-500 to-orange-600 text-slate-950 font-sans p-3 px-4 shadow-2xl flex items-center justify-between sticky top-0 z-50 border-b border-amber-400 animate-fade-in shrink-0">
            <div className="flex items-center space-x-3">
              <div className="p-1.5 rounded-lg bg-slate-950/20 text-slate-950">
                <Clock className="w-5 h-5 animate-spin" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-wider">
                  Session Timeout Warning
                </p>
                <p className="text-[11px] font-bold opacity-90">
                  Logged out due to 30m inactivity in{' '}
                  <span className="font-mono underline font-extrabold text-sm">
                    {Math.floor(secondsRemaining / 60).toString().padStart(2, '0')}:
                    {(secondsRemaining % 60).toString().padStart(2, '0')}
                  </span>
                </p>
              </div>
            </div>
            <button
              onClick={resetTimer}
              className="px-3.5 py-1.5 bg-slate-950 hover:bg-slate-900 text-amber-300 rounded-xl text-xs font-extrabold uppercase tracking-wider shadow-md transition-all hover:scale-105 active:scale-95"
            >
              Extend Session
            </button>
          </div>
        )}

        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between bg-slate-900/90 backdrop-blur-md border-b border-slate-800/80 p-4 shrink-0 sticky top-0 z-30">
          <Link to="/" className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-600 to-teal-400 flex items-center justify-center shadow">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-extrabold tracking-tight text-white font-display">ZX HUB</span>
          </Link>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowBioModal(true)}
              className="text-teal-400 hover:bg-slate-800 p-2 rounded-lg border border-slate-800"
              title="Biometrics"
            >
              <Fingerprint className="w-5 h-5" />
            </button>
            <button onClick={() => setIsSidebarOpen(true)} className="text-slate-300 hover:bg-slate-800 p-2 rounded-lg border border-slate-800">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 p-4 md:p-8">
          <Outlet />
        </div>
      </main>

      {showBioModal && (
        <BiometricSettingsModal onClose={() => setShowBioModal(false)} />
      )}
    </div>
  );
}
