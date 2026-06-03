import { useEffect, useState } from 'react';
import type { LogplexAnalytics, ResumePoint } from '../analytics/client';

/**
 * Fetches the saved resume point once analytics is ready. Surfaces it only
 * when it's worth offering (not completed, more than a few seconds in).
 */
export function useResume(
  analytics: LogplexAnalytics | null,
  enabled: boolean,
): { resume: ResumePoint | null; dismiss: () => void } {
  const [resume, setResume] = useState<ResumePoint | null>(null);

  useEffect(() => {
    if (!analytics || !enabled) {
      setResume(null);
      return;
    }
    let cancelled = false;
    void analytics.getResume().then((r) => {
      if (!cancelled && r && !r.completed && r.positionSeconds > 5) setResume(r);
    });
    return () => {
      cancelled = true;
    };
  }, [analytics, enabled]);

  return { resume, dismiss: () => setResume(null) };
}
