import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Sparkles, Users, Shield, ArrowRight, Fingerprint, ShieldCheck, RefreshCw, Settings, Clock, CheckCircle2 } from 'lucide-react';
import { logActivity } from '../lib/logger';
import { 
  authenticateWithBiometrics, 
  getStoredBiometricInfo, 
  isWebAuthnSupported,
  isPlatformAuthenticatorAvailable,
  getDevicePlatformName,
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
  const [hasPlatformHardware, setHasPlatformHardware] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const autoPromptRef = useRef(false);
  const navigate = useNavigate();
  const location = useLocation();

  const webAuthnAvailable = isWebAuthnSupported();
  const deviceName = getDevicePlatformName();

  useEffect(() => {
    refreshBiometricState();
    if (location.state?.idleExpired) {
      setIdleNotice(true);
    }
  }, [location.state]);

  const refreshBiometricState = async () => {
    const info = getStoredBiometricInfo();
    setBiometricInfo(info);

    if (webAuthnAvailable) {
      const avail = await isPlatformAuthenticatorAvailable();
      setHasPlatformHardware(avail);
    }
  };

  useEffect(() => {
    // Auto-prompt passkey scan if enabled on this device and not already triggered
    if (biometricInfo && biometricInfo.enabled && !autoPromptRef.current) {
      autoPromptRef.current = true;
      const timer = setTimeout(() => {
        handleBiometricUnlock();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [biometricInfo]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const masterPassword = import.meta.env.VITE_MASTER_PASSWORD || 'aktiadmin';
    
    if (password.trim() === masterPassword.trim()) {
      localStorage.setItem('akti_auth', 'true');
      localStorage.setItem('zxhub_last_activity_time', Date.now().toString());
      logActivity('LOGIN', 'AUTH', 'Master Vault Unlocked', 'User authenticated with master password');
      navigate('/');
    } else {
      setError('Incorrect Master Vault Password. Please check and try again.');
    }
  };

  const handleBiometricUnlock = async () => {
    setBioLoading(true);
    setError('');

    try {
      const authenticated = await authenticateWithBiometrics();
      if (authenticated) {
        localStorage.setItem('akti_auth', 'true');
        localStorage.setItem('zxhub_last_activity_time', Date.now().toString());
        logActivity('LOGIN', 'WEBAUTHN', 'Biometric Master Vault Unlocked', `User authenticated via ${biometricInfo?.deviceName || 'Passkey'}`);
        navigate('/');
      } else {
        setError('Biometric verification failed.');
      }
    } catch (err: any) {
      console.error('Biometric authentication error:', err);
      // Suppress quiet user cancel, but report genuine hardware error
      if (err.name !== 'NotAllowedError' && !err.message?.includes('cancelled')) {
        setError(err.message || 'Biometric authentication failed or timed out.');
      }
    } finally {
      setBioLoading(false);
    }
  };

  const handleBiometricEnrolledSuccess = () => {
    setShowBioModal(false);
    refreshBiometricState();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 font-sans relative overflow-x-hidden">
      {/* Background Ambience */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 sm:w-[500px] h-80 sm:h-[500px] bg-gradient-to-tr from-indigo-600/20 via-teal-600/15 to-purple-600/10 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header / Brand */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md flex flex-col items-center relative z-10">
        <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-teal-400 p-[2px] shadow-2xl shadow-indigo-500/20 mb-3 sm:mb-4">
          <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center">
            <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-indigo-400 animate-pulse" />
          </div>
        </div>
        <h1 className="text-center text-3xl sm:text-4xl font-black text-white tracking-tight font-display">
          ZX HUB
        </h1>
        <p className="mt-1 text-center text-xs text-slate-400 uppercase tracking-widest font-semibold flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-teal-400" /> Secure Asset Cloud Vault
        </p>
      </div>

      <div className="mt-6 sm:mt-8 sm:mx-auto sm:w-full sm:max-w-md relative z-10 space-y-3 sm:space-y-4">
        
        {/* Idle Timeout Notice */}
        {idleNotice && (
          <div className="bg-amber-950/40 border border-amber-500/40 p-3.5 rounded-2xl text-amber-300 text-xs flex items-start gap-3 backdrop-blur-md shadow-lg animate-fade-in">
            <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400 shrink-0">
              <Clock className="w-4 h-4" />
            </div>
            <div>
              <p className="font-bold text-amber-200">Session Locked (Inactivity)</p>
              <p className="mt-0.5 text-[11px] opacity-90">
                Auto-locked for protection after 30 minutes of inactivity. Unlock to continue.
              </p>
            </div>
          </div>
        )}

        {/* Biometric Quick Unlock Card (When Passkey is Active) */}
        {biometricInfo && biometricInfo.enabled ? (
          <div className="bg-gradient-to-br from-teal-950/40 via-slate-900/90 to-indigo-950/40 backdrop-blur-xl p-4 sm:p-5 shadow-2xl rounded-2xl border border-teal-500/30 flex flex-col items-center text-center space-y-3 relative overflow-hidden group">
            <div className="flex items-center justify-between w-full">
              <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-300 border border-teal-500/20 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-teal-400" />
                Passkey Enrolled
              </span>
              <button
                type="button"
                onClick={() => setShowBioModal(true)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800/80 transition-colors"
                title="Passkey Settings"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 rounded-2xl bg-teal-500/10 text-teal-400 border border-teal-500/30 shadow-inner group-hover:scale-105 transition-transform">
              <Fingerprint className="w-8 h-8 sm:w-10 sm:h-10 animate-pulse" />
            </div>

            <div>
              <h2 className="text-sm sm:text-base font-bold text-white">
                Biometric 1-Tap Unlock
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Scan {biometricInfo.deviceName} to unlock vault instantly
              </p>
            </div>

            <button
              type="button"
              onClick={handleBiometricUnlock}
              disabled={bioLoading}
              className="w-full min-h-[44px] py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50"
            >
              {bioLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <Fingerprint className="w-4 h-4" />
              )}
              <span>{bioLoading ? 'Scanning Sensor...' : 'Scan Fingerprint / Face ID'}</span>
            </button>
          </div>
        ) : webAuthnAvailable ? (
          /* Biometric Setup Callout (When Passkey is NOT yet enrolled) */
          <div className="bg-slate-900/60 backdrop-blur-md p-3.5 sm:p-4 rounded-2xl border border-teal-500/25 flex items-center justify-between gap-3 shadow-lg">
            <div className="flex items-center space-x-3 min-w-0">
              <div className="p-2 rounded-xl bg-teal-500/10 text-teal-400 border border-teal-500/20 shrink-0">
                <Fingerprint className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-200 truncate">
                  Setup Biometrics without Logging In
                </p>
                <p className="text-[11px] text-slate-400 truncate">
                  Enable Touch ID, Face ID or Fingerprint
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowBioModal(true)}
              className="shrink-0 px-3 py-1.5 rounded-xl bg-teal-500/20 hover:bg-teal-500/30 text-teal-300 border border-teal-500/30 text-xs font-bold transition-all"
            >
              Setup
            </button>
          </div>
        ) : null}

        {/* Master Password Login Box */}
        <div className="bg-slate-900/80 backdrop-blur-xl py-6 sm:py-8 px-5 sm:px-8 shadow-2xl rounded-2xl border border-slate-800/80">
          <form className="space-y-5" onSubmit={handleLogin}>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="password" className="block text-xs font-bold text-slate-300 uppercase tracking-wider">
                  Master Password
                </label>
                {webAuthnAvailable && (
                  <button
                    type="button"
                    onClick={() => setShowBioModal(true)}
                    className="text-[11px] font-bold text-teal-400 hover:text-teal-300 hover:underline flex items-center gap-1"
                  >
                    <Fingerprint className="w-3.5 h-3.5" />
                    <span>{biometricInfo ? 'Biometric Settings' : 'Add Passkey'}</span>
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
                  className="appearance-none block w-full pl-10 pr-10 py-3 border border-slate-700/80 rounded-xl text-sm placeholder-slate-500 bg-slate-950/80 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner font-mono min-h-[44px]"
                  placeholder="Enter vault password..."
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
                <div className="mt-2 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2 font-medium animate-fade-in">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0"></span> 
                  <span className="leading-snug">{error}</span>
                </div>
              )}
            </div>

            <div className="flex flex-col space-y-3 pt-1">
              <button
                type="submit"
                className="w-full min-h-[44px] flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg shadow-indigo-600/25 text-xs sm:text-sm font-bold text-white bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 hover:from-indigo-500 hover:to-purple-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-950 focus:ring-indigo-500 transition-all uppercase tracking-wider group active:scale-[0.98]"
              >
                <span>Unlock ZX Hub</span>
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </button>
              
              <div className="relative flex items-center py-1">
                <div className="flex-grow border-t border-slate-800"></div>
                <span className="flex-shrink-0 mx-3 text-slate-500 text-[10px] uppercase font-bold tracking-widest">or access</span>
                <div className="flex-grow border-t border-slate-800"></div>
              </div>
              
              <Link
                to="/workspace"
                className="w-full min-h-[44px] flex justify-center items-center py-2.5 px-4 border border-slate-800 hover:border-slate-700 rounded-xl text-xs sm:text-sm font-bold text-slate-300 bg-slate-950/50 hover:bg-slate-800/50 transition-all uppercase tracking-wider group"
              >
                <Users className="w-4 h-4 mr-2 text-teal-400 group-hover:scale-110 transition-transform" />
                Public Workspace Locker
              </Link>
            </div>
          </form>

          {/* Security Status Bar */}
          <div className="mt-5 pt-3.5 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-1.5 text-teal-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span className="font-semibold text-[10px] sm:text-[11px]">WebAuthn Biometric Guard</span>
            </div>
            <button
              onClick={() => setShowBioModal(true)}
              className="text-slate-400 hover:text-white transition-colors p-1 rounded hover:bg-slate-800 flex items-center gap-1 text-[10px] font-medium"
            >
              <Settings className="w-3 h-3" />
              <span>Passkey Settings</span>
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
          onLoginSuccess={handleBiometricEnrolledSuccess}
        />
      )}
    </div>
  );
}
