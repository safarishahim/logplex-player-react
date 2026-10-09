import { useCallback, useRef } from 'react';
import type Hls from 'hls.js';
import type { QualityPolicy } from '../types';

/**
 * Display height per rendition (`"<width>x<height>"` → tier), for playlists that
 * name one. A master playlist can add `X-DISPLAY-HEIGHT=1080` to a variant so a
 * letterboxed 1920x800 reads as 1080p — RESOLUTION stays the real size. Playlists
 * without it are untouched: every label and the quality policy use the height.
 */
export type RenditionTiers = Record<string, number>;

const DISPLAY_HEIGHT_ATTR = 'X-DISPLAY-HEIGHT';
const tierKey = (width?: number, height?: number) => `${width}x${height}`;

/** The display height an HLS level's playlist entry asks for, if it names one. */
export function levelDisplayHeight(level: { attrs?: Record<string, string | undefined> }): number | undefined {
  const value = Number(level.attrs?.[DISPLAY_HEIGHT_ATTR]);
  return Number.isFinite(value) && value > 0 ? value : undefined;
}

/** Tiers for the levels that name one; undefined when none does. */
export function renditionTiers(
  levels: readonly { width?: number; height?: number; attrs?: Record<string, string | undefined> }[],
): RenditionTiers | undefined {
  const tiers: RenditionTiers = {};
  for (const level of levels) {
    const tier = levelDisplayHeight(level);
    if (tier && level.width && level.height) tiers[tierKey(level.width, level.height)] = tier;
  }
  return Object.keys(tiers).length ? tiers : undefined;
}

/** What to show for a quality: its tier when the playlist names one, else its height. */
export function displayHeight(
  quality: { width?: number; height?: number },
  tiers?: RenditionTiers,
): number | undefined {
  return tiers?.[tierKey(quality.width, quality.height)] ?? quality.height;
}

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
        data.levels.map((l) => levelDisplayHeight(l) ?? l.height),
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
