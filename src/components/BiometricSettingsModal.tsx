import React, { useState, useEffect } from 'react';
import { X, Fingerprint, ShieldCheck, Check, AlertTriangle, Trash2, RefreshCw, KeyRound, Sparkles, Lock, ShieldAlert, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { 
  isWebAuthnSupported, 
  isPlatformAuthenticatorAvailable, 
  getStoredBiometricInfo, 
  registerBiometricPasskey, 
  authenticateWithBiometrics, 
  clearBiometricCredential, 
  toggleBiometricEnabled,
  getDevicePlatformName,
  validateMasterPassword,
  isMasterAuthenticated,
  BiometricCredentialInfo
} from '../lib/webauthn';
import { logActivity } from '../lib/logger';
import { cn } from '../lib/utils';

interface BiometricSettingsModalProps {
  onClose: () => void;
  onStatusChange?: () => void;
  onLoginSuccess?: () => void;
}

export default function BiometricSettingsModal({ onClose, onStatusChange, onLoginSuccess }: BiometricSettingsModalProps) {
  const [supported, setSupported] = useState<boolean>(false);
  const [hasPlatformAuth, setHasPlatformAuth] = useState<boolean>(false);
  const [biometricInfo, setBiometricInfo] = useState<BiometricCredentialInfo | null>(null);
  
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');

  const defaultDeviceLabel = getDevicePlatformName();
  const [customDeviceName, setCustomDeviceName] = useState<string>(defaultDeviceLabel);
  
  // Security: If not logged in, require Master Password to register biometric
  const isAuthenticated = isMasterAuthenticated();
  const [masterPassword, setMasterPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [autoUnlockAfterRegister, setAutoUnlockAfterRegister] = useState<boolean>(true);

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

  const handleRegister = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    setSuccessMsg('');

    // If registering without existing active session, verify master password
    if (!isAuthenticated) {
      if (!masterPassword) {
        setError('Please enter your Master Vault Password to authorize enrolling this device.');
        return;
      }
      if (!validateMasterPassword(masterPassword)) {
        setError('Incorrect Master Password. Authorization failed.');
        return;
      }
    }

    setLoading(true);

    try {
      const info = await registerBiometricPasskey(customDeviceName.trim() || defaultDeviceLabel);
      setBiometricInfo(info);
      setSuccessMsg(`Passkey registered successfully for ${info.deviceName}!`);
      logActivity('UPDATE', 'WEBAUTHN', 'Registered Biometric Passkey', `Device: ${info.deviceName}`);
      
      if (onStatusChange) onStatusChange();

      // If user is enrolling from login screen and wants to auto-unlock:
      if (!isAuthenticated && autoUnlockAfterRegister) {
        localStorage.setItem('akti_auth', 'true');
        localStorage.setItem('zxhub_last_activity_time', Date.now().toString());
        logActivity('LOGIN', 'WEBAUTHN', 'Master Vault Unlocked', 'Authenticated immediately after biometric registration');
        
        setTimeout(() => {
          if (onLoginSuccess) {
            onLoginSuccess();
          } else {
            onClose();
          }
        }, 600);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to register biometric passkey. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleTestAuthentication = async () => {
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const success = await authenticateWithBiometrics();
      if (success) {
        setSuccessMsg('Biometric verification test passed! Your sensor is working perfectly.');
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
    setSuccessMsg(enable ? 'Biometric 1-tap unlock enabled.' : 'Biometric unlock paused.');
    logActivity('UPDATE', 'WEBAUTHN', enable ? 'Enabled Biometrics' : 'Disabled Biometrics', 'Toggled biometric state');
    if (onStatusChange) onStatusChange();
  };

  const handleRemovePasskey = () => {
    if (window.confirm('Are you sure you want to remove the registered biometric passkey from this device?')) {
      clearBiometricCredential();
      setBiometricInfo(null);
      setMasterPassword('');
      setSuccessMsg('Biometric passkey removed.');
      logActivity('DELETE', 'WEBAUTHN', 'Removed Biometric Passkey', 'Cleared stored WebAuthn credential');
      if (onStatusChange) onStatusChange();
    }
  };

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto font-sans animate-fade-in">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col text-slate-100 my-auto">
        
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-800 bg-slate-950/70 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/30 shrink-0">
              <Fingerprint className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-white tracking-tight flex items-center gap-1.5">
                Biometric Passkey Security
              </h3>
              <p className="text-[11px] text-slate-400">
                Touch ID, Face ID, Fingerprint & Windows Hello
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-all"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 space-y-4 max-h-[80vh] overflow-y-auto">

          {/* Compatibility Status Pill */}
          <div className={cn(
            "p-3 sm:p-3.5 rounded-xl border flex items-center gap-2.5 text-xs",
            supported && hasPlatformAuth
              ? "bg-emerald-950/30 border-emerald-500/30 text-emerald-300"
              : supported
              ? "bg-amber-950/30 border-amber-500/30 text-amber-300"
              : "bg-rose-950/30 border-rose-500/30 text-rose-300"
          )}>
            <div className="shrink-0">
              {supported && hasPlatformAuth ? (
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              ) : supported ? (
                <AlertTriangle className="w-4 h-4 text-amber-400" />
              ) : (
                <ShieldAlert className="w-4 h-4 text-rose-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-bold text-xs truncate">
                {supported && hasPlatformAuth
                  ? "Biometric Sensor Detected"
                  : supported
                  ? "WebAuthn Supported (PIN or Key)"
                  : "Biometrics Unsupported"}
              </p>
              <p className="text-[10px] opacity-80 truncate">
                {defaultDeviceLabel}
              </p>
            </div>
          </div>

          {/* Messages */}
          {error && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1 shrink-0"></span>
              <span className="leading-relaxed">{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-400 shrink-0" />
              <span className="leading-relaxed">{successMsg}</span>
            </div>
          )}

          {/* Already Enrolled State */}
          {biometricInfo ? (
            <div className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-teal-500/10 border border-teal-500/30 flex items-center justify-center text-teal-400 shrink-0">
                    <Fingerprint className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-white flex items-center gap-2">
                      {biometricInfo.deviceName}
                    </h4>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Enrolled: {new Date(biometricInfo.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                <span className={cn(
                  "px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider",
                  biometricInfo.enabled
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-400 border border-slate-700"
                )}>
                  {biometricInfo.enabled ? 'Active' : 'Paused'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleTestAuthentication}
                  disabled={loading}
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <Fingerprint className="w-3.5 h-3.5 text-teal-400" />
                  <span>Test Biometrics</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleToggleEnable(!biometricInfo.enabled)}
                  className={cn(
                    "w-full py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all",
                    biometricInfo.enabled
                      ? "bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/30 text-amber-300"
                      : "bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                  )}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>{biometricInfo.enabled ? 'Pause Biometric' : 'Enable Biometric'}</span>
                </button>
              </div>

              <div className="pt-2 border-t border-slate-900 flex justify-between items-center text-xs">
                <button
                  type="button"
                  onClick={handleRemovePasskey}
                  className="text-rose-400 hover:text-rose-300 hover:underline flex items-center gap-1.5 text-[11px] font-semibold"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Delete Passkey</span>
                </button>

                {!isAuthenticated && (
                  <button
                    type="button"
                    onClick={onLoginSuccess}
                    className="text-teal-400 hover:text-teal-300 font-bold flex items-center gap-1 text-[11px]"
                  >
                    <span>Unlock Vault Now</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* Register New Passkey Flow */
            <form onSubmit={handleRegister} className="p-4 sm:p-5 rounded-2xl bg-slate-950 border border-slate-800 space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider block">
                  Device Authenticator Label
                </label>
                <input
                  type="text"
                  value={customDeviceName}
                  onChange={(e) => setCustomDeviceName(e.target.value)}
                  placeholder="e.g. iPhone Face ID, Laptop Fingerprint"
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-slate-100 outline-none focus:ring-1 focus:ring-teal-500 transition-all"
                />
              </div>

              {/* Master Password Authorization (Only required if not already logged in) */}
              {!isAuthenticated && (
                <div className="space-y-2 pt-1 border-t border-slate-800/80">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1">
                      <Lock className="w-3 h-3 text-indigo-400" />
                      <span>Verify Master Password</span>
                    </label>
                    <span className="text-[10px] text-amber-400 font-medium">Security Check</span>
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={masterPassword}
                      onChange={(e) => setMasterPassword(e.target.value)}
                      placeholder="Enter master password to authorize..."
                      required
                      className="w-full pl-3 pr-9 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-white outline-none focus:ring-1 focus:ring-indigo-500 transition-all placeholder:text-slate-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-200"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    Authorizes this device sensor to unlock your ZX HUB vault without typing the password in the future.
                  </p>

                  <label className="flex items-center gap-2 pt-1 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={autoUnlockAfterRegister}
                      onChange={(e) => setAutoUnlockAfterRegister(e.target.checked)}
                      className="rounded border-slate-700 bg-slate-900 text-teal-500 focus:ring-teal-500 w-3.5 h-3.5"
                    />
                    <span className="text-[11px] text-slate-300 font-medium">
                      Unlock vault immediately after enrollment
                    </span>
                  </label>
                </div>
              )}

              <button
                type="submit"
                disabled={loading || !supported}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-teal-600 via-emerald-600 to-indigo-600 hover:from-teal-500 hover:to-indigo-500 text-white font-extrabold text-xs uppercase tracking-wider shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
              >
                {loading ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <Fingerprint className="w-4 h-4" />
                )}
                <span>{loading ? 'Scanning Sensor...' : 'Enroll Biometrics Now'}</span>
              </button>
            </form>
          )}

          {/* Privacy & Hardware Security Note */}
          <div className="p-3 bg-slate-950/50 rounded-xl border border-slate-800/80 text-[10px] text-slate-400 leading-relaxed flex items-start gap-2">
            <Sparkles className="w-3.5 h-3.5 text-teal-400 shrink-0 mt-0.5" />
            <p>
              Your biometric data stays completely private inside your device's Secure Enclave / TPM chip. Only cryptographic public keys are exchanged.
            </p>
          </div>

        </div>

        {/* Footer */}
        <div className="p-3 sm:p-4 border-t border-slate-800 bg-slate-950/70 flex items-center justify-end">
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
