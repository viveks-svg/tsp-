'use client';

import { useState, useCallback } from 'react';

/**
 * useBookingSession — generates/persists a sessionId per solution attempt.
 * Stored in localStorage keyed by `lead-session-{slug}`.
 * Survives page refreshes. Call `resetSession()` to start a new session
 * (e.g. after successful payment).
 *
 * The session follows the slug: when the slug changes (e.g. the client picks a
 * different service) the hook switches to that service's session. An empty
 * slug means "no service yet" and yields an empty sessionId.
 */

function newSessionId(slug: string) {
  return `ls_${slug}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readOrCreate(storageKey: string, slug: string): string {
  try {
    const stored = localStorage.getItem(storageKey);
    if (stored) return stored;
    const id = newSessionId(slug);
    localStorage.setItem(storageKey, id);
    return id;
  } catch {
    // Storage unavailable (private mode etc.) — still give this visit a session.
    return newSessionId(slug);
  }
}

export function useBookingSession(solutionSlug: string) {
  const storageKey = solutionSlug ? `lead-session-${solutionSlug}` : '';

  // Remember which key the id belongs to, so a slug change never leaks the
  // previous service's session.
  const [session, setSession] = useState<{ key: string; id: string }>(() =>
    typeof window !== 'undefined' && storageKey
      ? { key: storageKey, id: readOrCreate(storageKey, solutionSlug) }
      : { key: '', id: '' },
  );

  // Slug changed (e.g. a different service was picked): switch to that
  // service's session. Adjusting state during render avoids a stale render.
  if (session.key !== storageKey && typeof window !== 'undefined') {
    setSession({ key: storageKey, id: storageKey ? readOrCreate(storageKey, solutionSlug) : '' });
  }

  const sessionId = session.key === storageKey ? session.id : '';

  const resetSession = useCallback(() => {
    if (!storageKey) return '';
    const newId = newSessionId(solutionSlug);
    try {
      localStorage.setItem(storageKey, newId);
    } catch {
      /* ignore */
    }
    setSession({ key: storageKey, id: newId });
    return newId;
  }, [storageKey, solutionSlug]);

  return { sessionId, resetSession };
}
