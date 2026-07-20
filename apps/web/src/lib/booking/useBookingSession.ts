'use client';

import { useState, useCallback, useEffect } from 'react';

/**
 * useBookingSession — generates/persists a sessionId per solution attempt.
 * Stored in localStorage keyed by `lead-session-{slug}`.
 * Survives page refreshes. Call `resetSession()` to start a new session
 * (e.g. after successful payment).
 */
export function useBookingSession(solutionSlug: string) {
  const storageKey = `lead-session-${solutionSlug}`;

  const [sessionId, setSessionId] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    const stored = localStorage.getItem(storageKey);
    if (stored) return stored;
    const newId = `ls_${solutionSlug}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(storageKey, newId);
    return newId;
  });

  // Ensure sessionId is set after hydration
  useEffect(() => {
    if (!sessionId && typeof window !== 'undefined') {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setSessionId(stored);
      } else {
        const newId = `ls_${solutionSlug}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
        localStorage.setItem(storageKey, newId);
        setSessionId(newId);
      }
    }
  }, [sessionId, storageKey, solutionSlug]);

  const resetSession = useCallback(() => {
    const newId = `ls_${solutionSlug}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
    localStorage.setItem(storageKey, newId);
    setSessionId(newId);
    return newId;
  }, [storageKey, solutionSlug]);

  return { sessionId, resetSession };
}
