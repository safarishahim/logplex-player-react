import { useEffect, useState } from 'react';
import type { MediaPlayerInstance } from '@vidstack/react';
import { LogplexAnalytics } from './client';
import type { LogplexAnalyticsConfig, Quality } from '../types';

/**
 * Creates a LogplexAnalytics instance for the given config and wires it to a
 * Vidstack player: media events become canonical Logplex events, heartbeats
 * run while playing, and an `exit` is emitted on unmount.
 */
export function useLogplexAnalytics(
  player: MediaPlayerInstance | null,
  config?: LogplexAnalyticsConfig,
): LogplexAnalytics | null {
  const [analytics, setAnalytics] = useState<LogplexAnalytics | null>(null);

  // Lifecycle: one instance per stable config identity.
  useEffect(() => {
    if (!config || config.disabled) {
      setAnalytics(null);
      return;
    }
    const a = new LogplexAnalytics(config);
    a.start();
    a.registerContent();
    setAnalytics(a);
    return () => {
      a.destroy();
      setAnalytics(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [config?.baseUrl, config?.apiKey, config?.contentId, config?.userId, config?.sessionId, config?.disabled]);

  // Wiring: attach to the player once both exist.
  useEffect(() => {
    if (!player || !analytics) return;

    const posMs = () => Math.round((player.currentTime || 0) * 1000);
    let started = false;
    let paused = true;
    let bufferStartedAt = 0;
    let lastTimeMs = 0;
    let seekFromMs = 0;

    const on = (type: string, h: (e: Event) => void): (() => void) => {
      player.addEventListener(type, h);
      return () => player.removeEventListener(type, h);
    };

    const currentQuality = (): Quality | undefined => {
      const h = player.qualities?.selected?.height;
      if (!h) return 'auto';
      if (h >= 2160) return '4k';
      if (h >= 1440) return '1440p';
      if (h >= 1080) return '1080p';
      if (h >= 720) return '720p';
      if (h >= 480) return '480p';
      return '360p';
    };

    const offs = [
      on('playing', () => {
        if (!started) {
          started = true;
          analytics.track('play', { playerTimeMs: posMs() });
          analytics.track('play_start_success', { playerTimeMs: posMs() });
        } else if (paused) {
          analytics.track('resume', { playerTimeMs: posMs() });
        }
        if (bufferStartedAt) {
          analytics.track('buffer_end', {
            playerTimeMs: posMs(),
            bufferDurationMs: Date.now() - bufferStartedAt,
          });
          bufferStartedAt = 0;
        }
        paused = false;
        analytics.startHeartbeat(posMs);
      }),
      on('pause', () => {
        if (paused) return;
        paused = true;
        analytics.stopHeartbeat();
        analytics.track('pause', { playerTimeMs: posMs() });
      }),
      on('waiting', () => {
        if (!bufferStartedAt) {
          bufferStartedAt = Date.now();
          analytics.track('buffer_start', { playerTimeMs: posMs() });
        }
      }),
      on('time-update', () => {
        lastTimeMs = posMs();
      }),
      on('seeking', () => {
        seekFromMs = lastTimeMs;
      }),
      on('seeked', () => {
        analytics.track('seek', { seekFromMs, seekToMs: posMs(), playerTimeMs: posMs() });
      }),
      on('quality-change', () => {
        analytics.track('quality_change', { quality: currentQuality(), playerTimeMs: posMs() });
      }),
      on('ended', () => {
        analytics.stopHeartbeat();
        analytics.track('complete', { playerTimeMs: posMs() });
      }),
      on('error', (e: Event) => {
        const detail = (e as CustomEvent).detail as { code?: number | string; message?: string } | undefined;
        analytics.track('error', {
          playerTimeMs: posMs(),
          error: { code: String(detail?.code ?? 'PLAYER_ERROR'), message: detail?.message },
        });
      }),
    ];

    return () => {
      analytics.stopHeartbeat();
      analytics.track('exit', { playerTimeMs: posMs() });
      offs.forEach((off) => off());
    };
  }, [player, analytics]);

  return analytics;
}
