import { useEffect } from 'react';
import type { MediaPlayerInstance } from '@vidstack/react';

/** Viewer preferences persisted across sessions when `persistSettings` is on. */
export interface PlayerPrefs {
  volume?: number;
  muted?: boolean;
  rate?: number;
  brightness?: number;
}

const DEFAULT_KEY = 'logplex-player';

export function loadPrefs(key: string = DEFAULT_KEY): PlayerPrefs {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as PlayerPrefs) : {};
  } catch {
    return {};
  }
}

export function savePrefs(patch: PlayerPrefs, key: string = DEFAULT_KEY): void {
  try {
    localStorage.setItem(key, JSON.stringify({ ...loadPrefs(key), ...patch }));
  } catch {
    /* storage unavailable — ignore */
  }
}

/**
 * Restores and persists the media-owned settings (volume, muted, playback
 * rate) for a player instance. No-op unless `enabled`.
 */
export function usePersistentMediaSettings(
  player: MediaPlayerInstance | null,
  enabled: boolean,
  key: string = DEFAULT_KEY,
): void {
  useEffect(() => {
    if (!enabled || !player) return;

    const p = loadPrefs(key);
    if (typeof p.volume === 'number') player.volume = p.volume;
    if (typeof p.muted === 'boolean') player.muted = p.muted;
    if (typeof p.rate === 'number') player.playbackRate = p.rate;

    let last = { v: player.volume, m: player.muted, r: player.playbackRate };
    return player.subscribe(({ volume, muted, playbackRate }) => {
      if (volume !== last.v || muted !== last.m || playbackRate !== last.r) {
        last = { v: volume, m: muted, r: playbackRate };
        savePrefs({ volume, muted, rate: playbackRate }, key);
      }
    });
  }, [player, enabled, key]);
}
