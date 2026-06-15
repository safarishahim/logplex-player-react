import { useEffect, useState } from 'react';
import type { LogplexAnalytics, ResumePoint } from '../analytics/client';

/** Supplies a saved resume point from a host back-end (used instead of the
 * built-in Logplex analytics, e.g. while Logplex is not yet launched). */
export type ResumeResolver = () => Promise<ResumePoint | null>;

/**
 * Surfaces a saved resume point once it's available — from a host-provided
 * `resolver` if given, otherwise from the built-in analytics. Only offers it
 * when it's worth showing (not completed, more than a few seconds in).
 */
export function useResume(
  analytics: LogplexAnalytics | null,
  enabled: boolean,
  resolver?: ResumeResolver,
): { resume: ResumePoint | null; dismiss: () => void } {
  const [resume, setResume] = useState<ResumePoint | null>(null);

  useEffect(() => {
    const source = resolver ?? (analytics ? () => analytics.getResume() : null);
    if (!source || !enabled) {
      setResume(null);
      return;
    }
    let cancelled = false;
    void source().then((r) => {
      if (!cancelled && r && !r.completed && r.positionSeconds > 5) setResume(r);
    });
    return () => {
      cancelled = true;
    };
  }, [analytics, enabled, resolver]);

  return { resume, dismiss: () => setResume(null) };
}
