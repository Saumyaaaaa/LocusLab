// Resilient timestamp-based countdown timer hook resistant to background tab throttling and tracking tab visibility.
import { useState, useEffect, useRef } from 'react';

interface UseTimestampTimerProps {
  durationSeconds: number;
  isActive?: boolean;
  onExpire?: () => void;
}

interface UseTimestampTimerResult {
  remainingSeconds: number;
  formattedTime: string;
  tabHidden: boolean;
}

export function useTimestampTimer({
  durationSeconds,
  isActive = true,
  onExpire,
}: UseTimestampTimerProps): UseTimestampTimerResult {
  const [remainingSeconds, setRemainingSeconds] = useState(durationSeconds);
  const [tabHidden, setTabHidden] = useState(false);

  const targetTimeRef = useRef<number | null>(null);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;
  const expiredRef = useRef(false);

  // Initialize or reset target timestamp
  useEffect(() => {
    if (!isActive) return;
    targetTimeRef.current = Date.now() + durationSeconds * 1000;
    expiredRef.current = false;
    setRemainingSeconds(durationSeconds);

    // Track if tab loses visibility during this timer period
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        setTabHidden(true);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    const intervalId = window.setInterval(() => {
      if (!targetTimeRef.current || expiredRef.current) return;

      const now = Date.now();
      const diffMs = targetTimeRef.current - now;
      const leftSec = Math.max(0, Math.ceil(diffMs / 1000));

      setRemainingSeconds(leftSec);

      if (diffMs <= 0 && !expiredRef.current) {
        expiredRef.current = true;
        clearInterval(intervalId);
        if (onExpireRef.current) {
          onExpireRef.current();
        }
      }
    }, 250); // High frequency check eliminates drift

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [durationSeconds, isActive]);

  const minutes = Math.floor(remainingSeconds / 60);
  const seconds = remainingSeconds % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return {
    remainingSeconds,
    formattedTime,
    tabHidden,
  };
}
