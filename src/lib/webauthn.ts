// WebAuthn / Biometric Authentication Helper Utility

export interface BiometricCredentialInfo {
  id: string;
  createdAt: string;
  deviceName: string;
  enabled: boolean;
}

export function isWebAuthnSupported(): boolean {
  return typeof window !== 'undefined' && !!window.PublicKeyCredential;
}

export async function isPlatformAuthenticatorAvailable(): Promise<boolean> {
  if (!isWebAuthnSupported()) return false;
  try {
    return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
  } catch (err) {
    console.error('Error checking platform authenticator:', err);
    return false;
  }
}

// Helper to convert ArrayBuffer <-> Base64
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
}

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

export function getStoredBiometricInfo(): BiometricCredentialInfo | null {
  const enabled = localStorage.getItem('zxhub_biometric_enabled') === 'true';
  const id = localStorage.getItem('zxhub_webauthn_credential_id');
  const createdAt = localStorage.getItem('zxhub_biometric_created_at');
  const deviceName = localStorage.getItem('zxhub_biometric_device_name') || 'Biometric Passkey';

  if (!id) return null;
  return {
    id,
    createdAt: createdAt || new Date().toISOString(),
    deviceName,
    enabled
  };
}

export function clearBiometricCredential(): void {
  localStorage.removeItem('zxhub_webauthn_credential_id');
  localStorage.removeItem('zxhub_biometric_enabled');
  localStorage.removeItem('zxhub_biometric_created_at');
  localStorage.removeItem('zxhub_biometric_device_name');
}

export function toggleBiometricEnabled(enable: boolean): void {
  localStorage.setItem('zxhub_biometric_enabled', enable ? 'true' : 'false');
}

export async function registerBiometricPasskey(customDeviceName?: string): Promise<BiometricCredentialInfo> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn / Biometrics is not supported in this browser.');
  }

  // 32-byte challenge
  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const userId = new TextEncoder().encode('zxhub_master_user_id');

  // Detect RP ID (hostname without port or protocol)
  const hostname = window.location.hostname || 'localhost';

  const publicKeyCredentialCreationOptions: PublicKeyCredentialCreationOptions = {
    challenge,
    rp: {
      name: 'ZX HUB Master Vault',
      id: hostname,
    },
    user: {
      id: userId,
      name: 'master_admin@zxhub.local',
      displayName: 'ZX HUB Master Admin',
    },
    pubKeyCredParams: [
      { alg: -7, type: 'public-key' },  // ES256
      { alg: -257, type: 'public-key' } // RS256
    ],
    authenticatorSelection: {
      authenticatorAttachment: 'platform',
      userVerification: 'preferred',
      requireResidentKey: false,
    },
    timeout: 60000,
    attestation: 'none',
  };

  try {
    const credential = (await navigator.credentials.create({
      publicKey: publicKeyCredentialCreationOptions,
    })) as PublicKeyCredential;

    if (!credential) {
      throw new Error('Biometric registration was cancelled or failed.');
    }

    const credentialIdBase64 = arrayBufferToBase64(credential.rawId);
    const now = new Date().toISOString();
    const finalDeviceName = customDeviceName || getDevicePlatformName();

    localStorage.setItem('zxhub_webauthn_credential_id', credentialIdBase64);
    localStorage.setItem('zxhub_biometric_enabled', 'true');
    localStorage.setItem('zxhub_biometric_created_at', now);
    localStorage.setItem('zxhub_biometric_device_name', finalDeviceName);

    return {
      id: credentialIdBase64,
      createdAt: now,
      deviceName: finalDeviceName,
      enabled: true,
    };
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric prompt was cancelled or timed out.');
    } else if (err.name === 'InvalidStateError') {
      throw new Error('This device biometric authenticator is already registered.');
    }
    throw new Error(err.message || 'Failed to register biometric passkey.');
  }
}

export async function authenticateWithBiometrics(): Promise<boolean> {
  if (!isWebAuthnSupported()) {
    throw new Error('WebAuthn / Biometrics is not supported in this browser.');
  }

  const storedInfo = getStoredBiometricInfo();
  if (!storedInfo || !storedInfo.id) {
    throw new Error('No biometric passkey registered. Please set up biometrics first.');
  }

  const challenge = window.crypto.getRandomValues(new Uint8Array(32));
  const credentialIdBuffer = base64ToArrayBuffer(storedInfo.id);
  const hostname = window.location.hostname || 'localhost';

  const publicKeyCredentialRequestOptions: PublicKeyCredentialRequestOptions = {
    challenge,
    rpId: hostname,
    allowCredentials: [
      {
        id: credentialIdBuffer,
        type: 'public-key',
        transports: ['internal', 'hybrid', 'usb', 'nfc', 'ble'],
      },
    ],
    userVerification: 'preferred',
    timeout: 60000,
  };

  try {
    const assertion = (await navigator.credentials.get({
      publicKey: publicKeyCredentialRequestOptions,
    })) as PublicKeyCredential;

    if (assertion) {
      return true;
    }
    return false;
  } catch (err: any) {
    if (err.name === 'NotAllowedError') {
      throw new Error('Biometric verification cancelled or failed.');
    }
    throw new Error(err.message || 'Biometric authentication failed.');
  }
}

export function getDevicePlatformName(): string {
  if (typeof navigator === 'undefined') return 'Device Biometric Authenticator';
  const ua = navigator.userAgent;
  if (/Macintosh|Mac OS X/.test(ua)) return 'Touch ID / Mac Passkey';
  if (/iPhone|iPad|iPod/.test(ua)) return 'Face ID / Touch ID (iOS)';
  if (/Android/.test(ua)) return 'Android Fingerprint / Face Unlock';
  if (/Windows/.test(ua)) return 'Windows Hello (Fingerprint/PIN/Face)';
  return 'Device Biometric Authenticator';
}
