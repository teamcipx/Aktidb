import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Sparkles, Users, Shield, ArrowRight } from 'lucide-react';

export default function Login() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default master password is 'aktiadmin' or configured via env
    const masterPassword = import.meta.env.VITE_MASTER_PASSWORD || 'aktiadmin';
    
    if (password === masterPassword) {
      localStorage.setItem('akti_auth', 'true');
      navigate('/');
    } else {
      setError('Incorrect secure vault password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans relative overflow-hidden">
      {/* Background Glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-gradient-to-tr from-indigo-600/20 via-purple-600/10 to-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-teal-400 p-[2px] shadow-2xl shadow-indigo-500/25 mb-5">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-2 text-center text-4xl font-extrabold text-white tracking-tight font-display flex items-center gap-2">
          ZX HUB
        </h2>
        <p className="mt-2 text-center text-xs text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-teal-400" /> Secure Cloud Asset Vault
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800/80 glow-indigo">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                Master Vault Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-indigo-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 px-4 py-3 border border-slate-700/80 rounded-xl text-sm placeholder-slate-500 bg-slate-950/80 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner font-mono"
                  placeholder="Enter master password..."
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-200 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && (
                <div className="mt-2 p-2.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-medium">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span> {error}
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-4 pt-1">
              <button
                type="submit"
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/30 text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-indigo-500 transition-all uppercase tracking-wider group"
              >
                <span>Unlock ZX Hub</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] uppercase font-bold tracking-widest">or access</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>
              
              <Link
                to="/workspace"
                className="w-full flex justify-center items-center py-3 px-4 border border-slate-800 hover:border-slate-700 rounded-xl shadow-sm text-sm font-bold text-slate-300 bg-slate-950/50 hover:bg-slate-800/50 transition-all uppercase tracking-wider group"
              >
                <Users className="w-4 h-4 mr-2 text-teal-400 group-hover:scale-110 transition-transform" />
                Public Workspace Locker
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
