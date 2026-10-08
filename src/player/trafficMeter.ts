import Hls from 'hls.js';

/** Bytes per serving host (`URL.host`, never the path or query — those carry tokens). */
export type BytesByHost = Record<string, number>;

/** Bytes worked out for playback the meter can't observe directly. */
export interface EstimatedBytes {
  host: string;
  bytes: number;
}

/** Buffered time ranges, in seconds. */
export type Ranges = Array<[number, number]>;

/**
 * Counts the bytes the viewer's browser downloads for the content, per host.
 *
 * - hls.js playback is measured: every loaded fragment (media, audio and init
 *   segments) adds its received byte count under the host it came from.
 * - Playback hls.js doesn't drive (plain MP4, native HLS on older iOS): the
 *   browser fetches it itself and doesn't expose the byte count to the page.
 *   What it does expose is which parts of the timeline it has downloaded
 *   (`buffered`), so bytes are derived from that: newly downloaded seconds ×
 *   the file's bytes per second (an MP4's Content-Length over its duration,
 *   or the playing variant's bandwidth from the HLS master playlist). Buffer
 *   fetched ahead of the playhead counts, like it does for hls.js.
 *
 * Bytes are collected while `enabled` (off during ads) and handed out by
 * `drain()`, so whoever reports owns them once taken.
 */
export interface TrafficMeter {
  attachHls(hls: Hls): void;
  setEnabled(enabled: boolean): void;
  /** The content URL now playing (resolved, not a provider token). */
  setSource(url: string | undefined): void;
  /** True while hls.js is driving playback, so bytes are measured. */
  measuring(): boolean;
  /** Bytes collected since the last drain. */
  drain(): BytesByHost;
  /** Bytes for timeline newly downloaded by non-hls.js playback since the last call. */
  estimate(buffered: Ranges, height: number | undefined, duration: number | undefined): EstimatedBytes | null;
}

/** Keeps a session's map small even if a CDN rotates through many edge hosts. */
const MAX_HOSTS = 12;
const OTHER_HOST = 'other';

export const hostOf = (url: string | undefined, base?: string): string => {
  try {
    return new URL(url ?? '', base).host || OTHER_HOST;
  } catch {
    return OTHER_HOST;
  }
};

export const addBytes = (into: BytesByHost, host: string, bytes: number): void => {
  if (!(bytes > 0)) return;
  const key = host in into || Object.keys(into).length < MAX_HOSTS ? host : OTHER_HOST;
  into[key] = (into[key] ?? 0) + bytes;
};

export interface PlaylistVariant {
  height: number;
  /** Bytes per second. */
  bytesPerSecond: number;
  host: string;
}

/**
 * Variants of an HLS master playlist. AVERAGE-BANDWIDTH is preferred: BANDWIDTH
 * is the peak, which would overstate a typical second.
 */
export function parseMasterPlaylist(text: string, baseUrl: string): PlaylistVariant[] {
  const lines = text.split(/\r?\n/);
  const variants: PlaylistVariant[] = [];
  lines.forEach((line, i) => {
    if (!line.startsWith('#EXT-X-STREAM-INF:')) return;
    const attr = (name: string) => line.match(new RegExp(`[:,]${name}=([^,]+)`))?.[1];
    const bits = Number(attr('AVERAGE-BANDWIDTH') ?? attr('BANDWIDTH'));
    const height = Number(attr('RESOLUTION')?.split('x')[1] ?? 0);
    const uri = lines.slice(i + 1).find((l) => l.trim() && !l.startsWith('#'));
    if (!(bits > 0) || !uri) return;
    variants.push({ height, bytesPerSecond: bits / 8, host: hostOf(uri.trim(), baseUrl) });
  });
  return variants;
}

/** The variant closest to the decoded height (native players pick their own). */
export function variantFor(variants: PlaylistVariant[], height: number | undefined): PlaylistVariant | undefined {
  if (!variants.length) return undefined;
  if (!height) return variants.reduce((a, b) => (b.bytesPerSecond > a.bytesPerSecond ? b : a));
  return variants.reduce((a, b) => (Math.abs(b.height - height) < Math.abs(a.height - height) ? b : a));
}

const isHlsUrl = (url: string) => /\.m3u8(\?|#|$)/i.test(url);

/** Union of two sets of ranges, sorted and merged. */
export function mergeRanges(a: Ranges, b: Ranges): Ranges {
  const all = [...a, ...b].filter(([s, e]) => e > s).sort((x, y) => x[0] - y[0]);
  const out: Ranges = [];
  all.forEach(([s, e]) => {
    const last = out[out.length - 1];
    if (last && s <= last[1]) last[1] = Math.max(last[1], e);
    else out.push([s, e]);
  });
  return out;
}

export const rangesLength = (ranges: Ranges): number => ranges.reduce((sum, [s, e]) => sum + (e - s), 0);

export function createTrafficMeter(): TrafficMeter {
  let enabled = true;
  let pending: BytesByHost = {};
  let hls: Hls | null = null;
  let source: string | undefined;
  // What we know of the current source for estimating, filled in lazily.
  let variants: PlaylistVariant[] = [];
  let mp4Size = 0;
  let probed: string | undefined;
  // Timeline of the current source already counted as downloaded.
  let covered: Ranges = [];

  const probe = (url: string) => {
    if (probed === url) return;
    probed = url;
    variants = [];
    mp4Size = 0;
    if (typeof fetch === 'undefined') return;
    if (isHlsUrl(url)) {
      fetch(url)
        .then((res) => (res.ok ? res.text() : ''))
        .then((text) => {
          if (probed === url) variants = parseMasterPlaylist(text, url);
        })
        .catch(() => {});
    } else {
      fetch(url, { method: 'HEAD' })
        .then((res) => {
          if (probed === url) mp4Size = Number(res.headers.get('content-length')) || 0;
        })
        .catch(() => {});
    }
  };

  return {
    attachHls(instance) {
      hls = instance;
      instance.on(Hls.Events.FRAG_LOADED, (_event, { frag, part }) => {
        if (!enabled || hls !== instance) return;
        const stats = part?.stats ?? frag.stats;
        addBytes(pending, hostOf(part?.url ?? frag.url), stats.loaded);
      });
      instance.on(Hls.Events.DESTROYING, () => {
        if (hls === instance) hls = null;
      });
    },
    setEnabled(value) {
      enabled = value;
    },
    setSource(url) {
      const next = url || undefined;
      if (next !== source) covered = [];
      source = next;
    },
    measuring: () => !!hls,
    drain() {
      const taken = pending;
      pending = {};
      return taken;
    },
    estimate(buffered, height, duration) {
      if (!enabled || hls || !source) return null;
      probe(source);
      let rate: EstimatedBytes | null = null;
      if (variants.length) {
        const variant = variantFor(variants, height);
        if (variant) rate = { host: variant.host, bytes: variant.bytesPerSecond };
      } else if (mp4Size && duration && duration > 0) {
        rate = { host: hostOf(source), bytes: mp4Size / duration };
      }
      // Until the rate is known, leave the timeline uncounted so it's picked
      // up once the size / playlist arrives.
      if (!rate) return null;
      const next = mergeRanges(covered, buffered);
      const seconds = rangesLength(next) - rangesLength(covered);
      covered = next;
      return seconds > 0 ? { host: rate.host, bytes: seconds * rate.bytes } : null;
    },
  };
}
