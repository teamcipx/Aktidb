import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Sparkles, Users, Shield, ArrowRight, Fingerprint, ShieldCheck, RefreshCw, Settings, KeyRound, Clock } from 'lucide-react';
import { logActivity } from '../lib/logger';
import { 
  authenticateWithBiometrics, 
  getStoredBiometricInfo, 
  isWebAuthnSupported,
  BiometricCredentialInfo 
} from '../lib/webauthn';
import BiometricSettingsModal from '../components/BiometricSettingsModal';

export default function Login() {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [idleNotice, setIdleNotice] = useState(false);
  const [bioLoading, setBioLoading] = useState(false);
  const [biometricInfo, setBiometricInfo] = useState<BiometricCredentialInfo | null>(null);
  const [showBioModal, setShowBioModal] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const webAuthnAvailable = isWebAuthnSupported();

  useEffect(() => {
    refreshBiometricState();
    if (location.state?.idleExpired) {
      setIdleNotice(true);
    }
  }, [location.state]);

  const refreshBiometricState = () => {
    const info = getStoredBiometricInfo();
    setBiometricInfo(info);
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default master password is 'aktiadmin' or configured via env
    const masterPassword = import.meta.env.VITE_MASTER_PASSWORD || 'aktiadmin';
    
    if (password === masterPassword) {
      localStorage.setItem('akti_auth', 'true');
      logActivity('LOGIN', 'AUTH', 'Master Vault Unlocked', 'User authenticated with master password');
      navigate('/');
    } else {
      setError('Incorrect secure vault password');
    }
  };

  const handleBiometricUnlock = async () => {
    setBioLoading(true);
    setError('');

    try {
      const authenticated = await authenticateWithBiometrics();
      if (authenticated) {
        localStorage.setItem('akti_auth', 'true');
        logActivity('LOGIN', 'WEBAUTHN', 'Biometric Master Vault Unlocked', `User authenticated via ${biometricInfo?.deviceName || 'Passkey'}`);
        navigate('/');
      } else {
        setError('Biometric verification returned false.');
      }
    } catch (err: any) {
      console.error('Biometric authentication error:', err);
      setError(err.message || 'Biometric authentication failed or cancelled.');
    } finally {
      setBioLoading(false);
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

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0 space-y-4">
        
        {/* Idle Timeout Warning Notice */}
        {idleNotice && (
          <div className="bg-amber-950/40 border border-amber-500/40 p-4 rounded-2xl text-amber-300 text-xs flex items-start gap-3 backdrop-blur-md shadow-lg animate-fade-in">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
              <Clock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="font-extrabold text-sm text-amber-200">Session Expired (30m Inactivity)</p>
              <p className="mt-0.5 opacity-90 leading-relaxed text-[11px]">
                You were automatically signed out for security after 30 minutes of idle inactivity. Please unlock your vault again to resume.
              </p>
            </div>
          </div>
        )}

        {/* Biometric Quick Unlock Card (If registered & enabled) */}
        {biometricInfo && biometricInfo.enabled && (
          <div className="bg-gradient-to-br from-teal-950/40 via-slate-900/90 to-indigo-950/40 backdrop-blur-xl p-5 shadow-2xl rounded-2xl border border-teal-500/30 flex flex-col items-center text-center space-y-3 relative overflow-hidden group">
            <div className="absolute top-3 right-3">
              <span className="px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30 text-[9px] font-bold uppercase tracking-wider">
                Passkey Ready
              </span>
            </div>

            <div className="p-3.5 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-inner group-hover:scale-110 transition-transform">
              <Fingerprint className="w-8 h-8 animate-pulse" />
            </div>

            <div>
              <h3 className="text-sm font-extrabold text-white">Biometric Quick Unlock</h3>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Scan {biometricInfo.deviceName} to unlock master vault instantly
              </p>
            </div>

            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={bioLoading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
            >
              {bioLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Fingerprint className="w-4 h-4" />
              )}
              <span>{bioLoading ? 'Verifying Biometrics...' : 'Unlock with Fingerprint / Face ID'}</span>
            </button>
          </div>
        )}

        <div className="bg-slate-900/80 backdrop-blur-xl py-8 px-6 shadow-2xl rounded-2xl sm:px-10 border border-slate-800/80 glow-indigo">
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <div className="flex items-center justify-between mb-2">
                <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Master Vault Password
                </label>
                {webAuthnAvailable && (
                  <button
                    type="button"
                    onClick={() => setShowBioModal(true)}
                    className="text-[11px] font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>{biometricInfo ? 'Biometric Settings' : 'Setup Passkey'}</span>
                  </button>
                )}
              </div>
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

          {/* Biometric Security Footer Badge */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-teal-400">
              <ShieldCheck className="w-4 h-4" />
              <span className="font-semibold">WebAuthn Biometric Security</span>
            </div>
            <button
              onClick={() => setShowBioModal(true)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800"
              title="Biometric & Passkey Configuration"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {showBioModal && (
        <BiometricSettingsModal
          onClose={() => {
            setShowBioModal(false);
            refreshBiometricState();
          }}
          onStatusChange={refreshBiometricState}
        />
      )}
    </div>
  );
}
