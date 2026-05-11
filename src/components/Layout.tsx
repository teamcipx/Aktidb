import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { Database, Search, UserPlus, LogOut, ShieldCheck, Mail, Facebook, Menu, X, Github, ShieldAlert, Phone } from 'lucide-react';
import { cn } from '../lib/utils';
import { useState, useEffect } from 'react';

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    setIsSidebarOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    localStorage.removeItem('akti_auth');
    navigate('/login');
  };

  const navigation = [
    { name: 'Overview', href: '/', icon: Database },
    { name: 'Search', href: '/search', icon: Search },
    { name: 'Add Facebook', href: '/add-fb', icon: Facebook },
    { name: 'Add Special FB', href: '/add-special-fb', icon: ShieldAlert },
    { name: 'Add Gmail', href: '/add-gmail', icon: Mail },
    { name: 'Add Special Gmail', href: '/add-special-gmail', icon: ShieldAlert },
    { name: 'Add Supabase', href: '/add-supabase', icon: Database },
    { name: 'Add Github', href: '/add-github', icon: Github },
    { name: 'Add Contact', href: '/add-contact', icon: Phone },
  ];

  return (
    <div className="flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900">
      {/* Mobile Sidebar Backdrop */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/50 z-40 md:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-[260px] flex-shrink-0 bg-white border-r border-slate-200 flex flex-col transform transition-transform duration-300 md:relative md:translate-x-0",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-slate-100 flex flex-col items-start">
          <div className="flex items-center text-indigo-600 w-full justify-between">
            <div className="flex items-center">
              <ShieldCheck className="w-6 h-6 mr-2" />
              <span className="text-2xl font-bold tracking-tight uppercase">Akti</span>
            </div>
            <button className="md:hidden text-slate-400 hover:text-slate-600" onClick={() => setIsSidebarOpen(false)}>
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">Account Management DB</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 px-2 mt-2">Main Menu</div>
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  isActive
                    ? 'bg-indigo-50 text-indigo-700'
                    : 'text-slate-600 hover:bg-slate-50',
                  'group flex items-center px-3 py-2.5 text-sm font-medium rounded-lg transition-colors'
                )}
              >
                <item.icon
                  className={cn(
                    isActive ? 'text-indigo-600' : 'text-slate-400 group-hover:text-slate-600',
                    'mr-3 flex-shrink-0 h-5 w-5 transition-colors'
                  )}
                />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button
            onClick={handleLogout}
            className="group flex w-full items-center px-3 py-2.5 text-sm font-medium rounded-lg text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <LogOut className="mr-3 flex-shrink-0 h-5 w-5 text-slate-400 group-hover:text-slate-600 transition-colors" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0 flex flex-col overflow-y-auto w-full">
        <div className="md:hidden flex items-center justify-between bg-white border-b border-slate-200 p-4 shrink-0">
          <div className="flex items-center text-indigo-600">
            <ShieldCheck className="w-6 h-6 mr-2" />
            <span className="text-xl font-bold tracking-tight uppercase">Akti</span>
          </div>
          <button onClick={() => setIsSidebarOpen(true)} className="text-slate-600 hover:bg-slate-50 p-1 rounded">
            <Menu className="w-6 h-6" />
          </button>
        </div>
        <div className="flex-1 p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
