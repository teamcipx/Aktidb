import { useEffect, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { logActivity } from '../lib/logger';

const IDLE_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes in milliseconds
const WARNING_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes warning before timeout

export function useIdleTimeout() {
  const navigate = useNavigate();
  const [lastActive, setLastActive] = useState<number>(Date.now());
  const [showWarning, setShowWarning] = useState<boolean>(false);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(1800);
  const intervalRef = useRef<any>(null);

  const resetTimer = useCallback(() => {
    setLastActive(Date.now());
    setShowWarning(false);
  }, []);

  const handleLogout = useCallback(() => {
    localStorage.removeItem('akti_auth');
    logActivity('LOGIN', 'SECURITY', 'Auto Logout (Idle Timeout)', 'Session ended automatically after 30 minutes of inactivity');
    navigate('/login', { state: { idleExpired: true }, replace: true });
  }, [navigate]);

  useEffect(() => {
    const isAuthenticated = localStorage.getItem('akti_auth') === 'true';
    if (!isAuthenticated) return;

    const activityEvents = ['mousemove', 'keydown', 'mousedown', 'touchstart', 'scroll'];

    const handleUserActivity = () => {
      // Only update if not currently showing warning or if activity was genuine
      const now = Date.now();
      setLastActive((prev) => {
        // Debounce state updates: update at most once every 3 seconds unless warning was active
        if (now - prev > 3000 || showWarning) {
          setShowWarning(false);
          return now;
        }
        return prev;
      });
    };

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - lastActive;
      const remainingMs = IDLE_TIMEOUT_MS - elapsed;
      const remainingSec = Math.max(0, Math.floor(remainingMs / 1000));
      setSecondsRemaining(remainingSec);

      if (remainingMs <= WARNING_THRESHOLD_MS && remainingMs > 0) {
        setShowWarning(true);
      } else if (remainingMs > WARNING_THRESHOLD_MS) {
        setShowWarning(false);
      }

      if (remainingMs <= 0) {
        clearInterval(intervalRef.current);
        handleLogout();
      }
    }, 1000);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [lastActive, showWarning, handleLogout]);

  return {
    secondsRemaining,
    showWarning,
    resetTimer,
    idleTimeoutMinutes: 30
  };
}
