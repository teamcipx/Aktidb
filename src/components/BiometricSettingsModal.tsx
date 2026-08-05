import React, { useState, useEffect } from 'react';
import { X, Fingerprint, ShieldCheck, Smartphone, Check, AlertTriangle, Trash2, RefreshCw, KeyRound, Sparkles, Lock, ShieldAlert } from 'lucide-react';
import { 
  isWebAuthnSupported, 
  isPlatformAuthenticatorAvailable, 
  getStoredBiometricInfo, 
  registerBiometricPasskey, 
  authenticateWithBiometrics, 
  clearBiometricCredential, 
  toggleBiometricEnabled,
  getDevicePlatformName,
  BiometricCredentialInfo
} from '../lib/webauthn';
import { logActivity } from '../lib/logger';
import { cn } from '../lib/utils';

interface BiometricSettingsModalProps {
  onClose: () => void;
  onStatusChange?: () => void;
}

export default function BiometricSettingsModal({ onClose, onStatusChange }: BiometricSettingsModalProps) {
  const [supported, setSupported] = useState<boolean>(false);
  const [hasPlatformAuth, setHasPlatformAuth] = useState<boolean>(false);
  const [biometricInfo, setBiometricInfo] = useState<BiometricCredentialInfo | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [testSuccess, setTestSuccess] = useState<boolean>(false);

  const defaultDeviceLabel = getDevicePlatformName();
  const [customDeviceName, setCustomDeviceName] = useState<string>(defaultDeviceLabel);

  useEffect(() => {
    checkSupportAndInfo();
  }, []);

  const checkSupportAndInfo = async () => {
    const isSupp = isWebAuthnSupported();
    setSupported(isSupp);
    if (isSupp) {
      const avail = await isPlatformAuthenticatorAvailable();
      setHasPlatformAuth(avail);
    }
    const info = getStoredBiometricInfo();
    setBiometricInfo(info);
  };

  const handleRegister = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setTestSuccess(false);

    try {
      const info = await registerBiometricPasskey(customDeviceName);
      setBiometricInfo(info);
      setSuccessMsg(`Passkey registered successfully for ${info.deviceName}! You can now use fingerprint/Face ID to unlock ZX HUB.`);
      logActivity('UPDATE', 'WEBAUTHN', 'Registered Biometric Passkey', `Device: ${info.deviceName}`);
      if (onStatusChange) onStatusChange();
    } catch (err: any) {
      setError(err.message || 'Failed to register biometric passkey');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAuthentication = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');
    setTestSuccess(false);

    try {
      const success = await authenticateWithBiometrics();
      if (success) {
        setTestSuccess(true);
        setSuccessMsg('Biometric verification test passed! Fingerprint / Face ID is active and functional.');
        logActivity('STATUS_CHANGE', 'WEBAUTHN', 'Biometric Test Passed', 'Tested biometric authenticator successfully');
      }
    } catch (err: any) {
      setError(err.message || 'Biometric test verification failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnable = (enable: boolean) => {
    toggleBiometricEnabled(enable);
    setBiometricInfo(prev => prev ? { ...prev, enabled: enable } : null);
    setSuccessMsg(enable ? 'Biometric unlock enabled for login screen.' : 'Biometric unlock temporarily disabled.');
    logActivity('UPDATE', 'WEBAUTHN', enable ? 'Enabled Biometrics' : 'Disabled Biometrics', 'Toggled biometric authentication state');
    if (onStatusChange) onStatusChange();
  };

  const handleRemovePasskey = () => {
    if (window.confirm('Are you sure you want to remove the registered biometric passkey? You will need master password to log in until re-registered.')) {
      clearBiometricCredential();
      setBiometricInfo(null);
      setSuccessMsg('Biometric passkey removed.');
      logActivity('DELETE', 'WEBAUTHN', 'Removed Biometric Passkey', 'Cleared stored WebAuthn credential');
      if (onStatusChange) onStatusChange();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto animate-fade-in font-sans">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col text-slate-100">
        
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30">
              <Fingerprint className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-white tracking-wide flex items-center gap-2">
                Biometric Passkey Security
                <span className="px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 text-[10px] font-bold uppercase tracking-widest">
                  WebAuthn Standard
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Touch ID, Face ID, Fingerprint & Windows Hello Authentication
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">

          {/* Device Compatibility Status Banner */}
          <div className={cn(
            "p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed",
            supported && hasPlatformAuth
              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
              : supported
              ? "bg-amber-950/30 border-amber-500/30 text-amber-300"
              : "bg-rose-950/30 border-rose-500/30 text-rose-300"
          )}>
            <div className="p-1.5 rounded-lg shrink-0 mt-0.5 bg-slate-950/40">
              {supported && hasPlatformAuth ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : supported ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div>
              <p className="font-bold text-sm">
                {supported && hasPlatformAuth
                  ? "Biometric Hardware Available"
                  : supported
                  ? "WebAuthn Supported (External Key or PIN)"
                  : "Biometrics Unsupported"}
              </p>
              <p className="mt-0.5 text-[11px] opacity-90">
                {supported && hasPlatformAuth
                  ? `Your device hardware (${defaultDeviceLabel}) supports native biometric passkeys.`
                  : supported
                  ? "WebAuthn API is supported in your browser, but no native platform authenticator was detected."
                  : "Your browser or context does not support WebAuthn biometric credentials."}
              </p>
            </div>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0"></span>
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Active Passkey Card */}
          {biometricInfo ? (
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-500/20 to-indigo-500/20 border border-teal-500/30 flex items-center justify-center text-teal-400">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                      {biometricInfo.deviceName}
                      <span className={cn(
                        "px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase",
                        biometricInfo.enabled
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                          : "bg-slate-800 text-slate-400 border border-slate-700"
                      )}>
                        {biometricInfo.enabled ? 'Enabled' : 'Paused'}
                      </span>
                    </h4>
                    <p className="text-[11px] text-slate-400">
                      Enrolled on {new Date(biometricInfo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Controls */}
              <div className="pt-2 border-t border-slate-900 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleTestAuthentication}
                  disabled={loading}
                  className="px-3.5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Fingerprint className="w-4 h-4 text-teal-400" />
                  <span>Test Passkey Scan</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleEnable(!biometricInfo.enabled)}
                  className={cn(
                    "px-3.5 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all",
                    biometricInfo.enabled
                      ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                  )}
                >
                  <KeyRound className="w-4 h-4" />
                  <span>{biometricInfo.enabled ? 'Disable Biometric Login' : 'Enable Biometric Login'}</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={handleRemovePasskey}
                  className="text-xs text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1.5 font-semibold"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Remove Registered Passkey</span>
                </button>
              </div>
            </div>
          ) : (
            /* Register New Passkey Card */
            <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-300 uppercase tracking-wider block">
                  Authenticator Label
                </label>
                <input
                  type="text"
                  value={customDeviceName}
                  onChange={(e) => setCustomDeviceName(e.target.value)}
                  placeholder="e.g. MacBook Touch ID, iPhone Face ID"
                  className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-100 outline-none focus:ring-1 focus:ring-teal-500"
                />
              </div>

              <button
                type="button"
                onClick={handleRegister}
                disabled={loading || !supported}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Fingerprint className="w-4 h-4" />
                )}
                <span>{loading ? 'Scanning Biometrics...' : 'Register Fingerprint / Passkey'}</span>
              </button>
            </div>
          )}

          {/* Information Notice */}
          <div className="p-4 bg-slate-950/40 rounded-xl border border-slate-800/60 text-[11px] text-slate-400 leading-relaxed space-y-1.5">
            <div className="font-bold text-slate-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
              <span>How WebAuthn Biometric Security Works</span>
            </div>
            <p>
              Your biometric data (fingerprint, face scan, or hardware PIN) never leaves your device. WebAuthn creates a cryptographic keypair verified locally by your operating system authenticator (Touch ID, Face ID, Windows Hello, Android Biometrics).
            </p>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl transition-all"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
}
