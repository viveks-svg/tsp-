"use client";

import { useEffect, useRef, useCallback } from "react";
import { useCallStore } from "../store/call.store";

/**
 * Hook that manages the call timer — counts up from 0 during an active call,
 * and auto-ends the call when maxDurationSeconds is reached (wallet depleted).
 */
export function useCallTimer(onTimeExpired: () => void) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const status = useCallStore((s) => s.status);
  const durationSeconds = useCallStore((s) => s.durationSeconds);
  const maxDurationSeconds = useCallStore((s) => s.maxDurationSeconds);
  const incrementDuration = useCallStore((s) => s.incrementDuration);

  useEffect(() => {
    if (status !== "active") {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      return;
    }

    timerRef.current = setInterval(() => {
      const store = useCallStore.getState();
      const next = store.durationSeconds + 1;

      if (store.maxDurationSeconds > 0 && next >= store.maxDurationSeconds) {
        clearInterval(timerRef.current!);
        timerRef.current = null;
        onTimeExpired();
        return;
      }

      store.incrementDuration();
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [status, onTimeExpired]);

  /**
   * Format seconds into MM:SS display.
   */
  const formatTime = useCallback((secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainingSecs = secs % 60;
    return `${mins}:${remainingSecs < 10 ? "0" : ""}${remainingSecs}`;
  }, []);

  const remainingSeconds = maxDurationSeconds > 0
    ? Math.max(0, maxDurationSeconds - durationSeconds)
    : 0;

  return {
    durationSeconds,
    maxDurationSeconds,
    remainingSeconds,
    formattedDuration: formatTime(durationSeconds),
    formattedRemaining: formatTime(remainingSeconds),
    isLowTime: remainingSeconds > 0 && remainingSeconds < 60,
  };
}
