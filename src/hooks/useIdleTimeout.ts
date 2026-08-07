import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../lib/logger';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes warning before timeout
const STORAGE_KEY = 'zxhub_last_activity_time';

export function useIdleTimeout() {
  const navigate = useNavigate();
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800);
  const lastUpdateRef = useRef<number>(Date.now());

  const getStoredLastActivity = (): number => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const val = parseInt(stored, 10);
      if (!isNaN(val)) return val;
    }
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, now.toString());
    return now;
  };

  const resetTimer = useCallback(() => {
    const now = Date.now();
    localStorage.setItem(STORAGE_KEY, now.toString());
    lastUpdateRef.current = now;
    setShowWarning(false);
    setSecondsRemaining(Math.floor(IDLE_TIMEOUT_MS / 1000));
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('akti_auth');
    localStorage.removeItem(STORAGE_KEY);
    logActivity('LOGIN', 'SECURITY', 'Auto Logout (Idle Timeout)', 'Session ended automatically after 30 minutes of inactivity');
    navigate('/login', { state: { idleExpired: true }, replace: true });
  }, [navigate]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('akti_auth') === 'true';
    if (!isAuthenticated) return;

    // Ensure initial timestamp exists
    let lastActive = getStoredLastActivity();

    const checkTimeout = () => {
      const now = Date.now();
      const currentLastActive = getStoredLastActivity();
      const elapsed = now - currentLastActive;
      const remainingMs = IDLE_TIMEOUT_MS - elapsed;
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));

      setSecondsRemaining(remainingSec);

      if (remainingMs <= 0) {
        handleLogout();
        return;
      }

      if (remainingMs <= WARNING_THRESHOLD_MS) {
        setShowWarning(true);
      } else {
        setShowWarning(false);
      }
    };

    // User activity listener (debounced to once every 5 seconds)
    const handleUserActivity = () => {
      const now = Date.now();
      if (now - lastUpdateRef.current > 5000) {
        lastUpdateRef.current = now;
        localStorage.setItem(STORAGE_KEY, now.toString());
        setShowWarning(false);
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];
    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Check timeout every 1 second
    const timerInterval = setInterval(checkTimeout, 1000);

    // Also check immediately when page becomes visible or focused
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTimeout();
      }
    };

    window.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', checkTimeout);

    // Initial check on mount
    checkTimeout();

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      window.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', checkTimeout);
      clearInterval(timerInterval);
    };
  }, [handleLogout]);

  return {
    secondsRemaining,
    showWarning,
    resetTimer,
    idleTimeoutMinutes: 30
  };
}

