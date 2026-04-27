import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, ShieldCheck, Users } from 'lucide-react';

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
      setError('Incorrect secure password');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center">
        <div className="bg-indigo-50 p-4 rounded-xl mb-4 text-indigo-600 border border-indigo-100">
          <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="mt-2 text-center text-3xl font-extrabold text-slate-900 tracking-tight uppercase">
          Akti
        </h2>
        <p className="mt-2 text-center text-sm text-slate-500 uppercase tracking-widest font-bold">
          Account Management DB
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-sm sm:rounded-xl sm:px-10 border border-slate-200">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="password" className="block text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                Secure Password
              </label>
              <div className="mt-1.5 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Lock className="h-4 w-4 text-slate-400" />
                </div>
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-10 px-3 py-2 border border-slate-200 rounded text-sm placeholder-slate-400 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-indigo-500 transition-colors"
                  placeholder="Enter master password"
                />
                <button 
                  type="button" 
                  onClick={() => setShowPassword(!showPassword)} 
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {error && <p className="mt-2 text-sm text-rose-500">{error}</p>}
            </div>

            <div className="flex flex-col space-y-3 pt-2">
              <button
                type="submit"
                className="w-full flex justify-center py-2.5 px-4 border border-transparent rounded shadow-sm text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors uppercase tracking-wide"
              >
                Access System
              </button>
              
              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-slate-200"></div>
                <span className="flex-shrink-0 mx-4 text-slate-400 text-[10px] uppercase font-bold tracking-widest">or</span>
                <div className="flex-grow border-t border-slate-200"></div>
              </div>
              
              <Link
                to="/workspace"
                className="w-full flex justify-center items-center py-2.5 px-4 border border-indigo-200 rounded shadow-sm text-sm font-bold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 transition-colors uppercase tracking-wide"
              >
                <Users className="w-4 h-4 mr-2" />
                Public Workspace
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
