import { useCallback, useRef } from 'react';
import type Hls from 'hls.js';
import type { QualityPolicy } from '../types';

export interface PolicyResult {
  /** Per rendition: whether ABR may play it and the quality menu may offer it. */
  allowed: boolean[];
  /** Rendition to start on, or -1 to leave it to the bandwidth estimate. */
  start: number;
}

/**
 * Apply a quality policy to a list of rendition heights (in source order).
 * Renditions with an unknown height are never filtered out and never picked.
 */
export function applyQualityPolicy(
  heights: readonly (number | undefined)[],
  policy?: QualityPolicy,
): PolicyResult {
  const known = heights
    .map((h, i) => ({ h, i }))
    .filter((x): x is { h: number; i: number } => typeof x.h === 'number' && x.h > 0);
  const tallest = known.reduce((m, x) => Math.max(m, x.h), 0);

  const minHeight = policy?.minHeight;
  // Nothing reaches the floor → the tallest renditions are the floor.
  const floor = minHeight && known.some((x) => x.h >= minHeight) ? minHeight : minHeight ? tallest : 0;
  const allowed = heights.map((h) => typeof h !== 'number' || h <= 0 || h >= floor);

  let start = -1;
  const startHeight = policy?.startHeight;
  if (startHeight) {
    const candidates = known.filter((x) => allowed[x.i]);
    const atOrBelow = candidates.filter((x) => x.h <= startHeight);
    // Tallest at or below the preference; otherwise the shortest above it.
    // Ties go to the later entry (a higher bitrate in an hls.js level list).
    const pick = atOrBelow.length
      ? atOrBelow.reduce((b, x) => (x.h >= b.h ? x : b))
      : candidates.reduce<{ h: number; i: number } | null>((b, x) => (!b || x.h < b.h ? x : b), null);
    if (pick) start = pick.i;
  }
  return { allowed, start };
}

/**
 * Enforce a quality policy on each hls.js instance Vidstack creates: hold
 * automatic selection at or above `minHeight` and start on `startHeight`.
 * Returns the handler for `<MediaPlayer onHlsInstance>`.
 */
export function useHlsQualityPolicy(policy?: QualityPolicy): (hls: Hls) => void {
  const ref = useRef(policy);
  ref.current = policy;
  return useCallback((hls: Hls) => {
    const Events = (hls.constructor as typeof Hls).Events;
    hls.on(Events.MANIFEST_PARSED, (_e, data) => {
      const policy = ref.current;
      if (!policy?.minHeight && !policy?.startHeight) return;
      const { allowed, start } = applyQualityPolicy(
        data.levels.map((l) => l.height),
        policy,
      );
      // hls.js levels are sorted ascending, and ABR never goes below the first
      // level whose bitrate reaches minAutoBitrate — so the first allowed
      // level's bitrate is the floor.
      const lowest = allowed.indexOf(true);
      if (policy.minHeight && lowest > 0) hls.config.minAutoBitrate = data.levels[lowest].maxBitrate;
      if (start >= 0) hls.startLevel = start;
    });
  }, []);
}
