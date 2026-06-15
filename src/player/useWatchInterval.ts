import { useEffect, useRef } from 'react';
import type { MediaPlayerInstance } from '@vidstack/react';
import type { WatchIntervalHandler } from '../types';

/**
 * Periodic "user watch" heartbeat for an external back-end (the pre-Logplex
 * tracker). Mirrors hamrah-player's `sendUserWatchIntervalHandler`:
 *
 * - accumulates real play time (incremented while playing, frozen while paused);
 * - every `intervalMs` reports { playDuration, position, quality, userWatchId };
 * - chains the returned id into the next call;
 * - fires a final report on page hide / unmount;
 * - skips ticks before the first second of playback.
 *
 * This is independent of the built-in Logplex analytics, so the host can keep
 * using its current tracker while Logplex is not yet launched.
 */
export function useWatchInterval(
  player: MediaPlayerInstance | null,
  handler: WatchIntervalHandler | undefined,
  intervalMs = 5000,
): void {
  // Keep the latest handler/interval in refs so the wiring effect stays stable.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const intervalRef = useRef(intervalMs);
  intervalRef.current = intervalMs;

  const hasHandler = !!handler;
  useEffect(() => {
    // Depend on player + presence (not handler identity) so an inline handler
    // changing each render doesn't tear down listeners or reset playDuration.
    if (!player || !hasHandler) return;

    let playDuration = 0;
    let watchId: string | undefined;
    let secondTimer: ReturnType<typeof setInterval> | null = null;
    let reportTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const startSecondTimer = () => {
      if (secondTimer) return;
      secondTimer = setInterval(() => {
        playDuration += 1;
      }, 1000);
    };
    const stopSecondTimer = () => {
      if (secondTimer) {
        clearInterval(secondTimer);
        secondTimer = null;
      }
    };

    // The host back-end derives traffic from the resolution string and only
    // accepts the exact form "WIDTH*HEIGHT" with a literal asterisk (regex
    // /^[0-9]+[*][0-9]+$/, then width*height = pixels, ×playDuration = bytes).
    // Any other shape (e.g. "1280x720") fails the regex → pixels 0 → traffic 0
    // while watch duration still climbs. So report "WIDTH*HEIGHT".
    const currentQuality = (): string => {
      const q = player.qualities?.selected;
      const w = q?.width || player.state?.mediaWidth;
      const h = q?.height || player.state?.mediaHeight;
      return w && h ? `${w}*${h}` : '';
    };

    const report = async () => {
      const fn = handlerRef.current;
      if (!fn) return;
      const position = player.currentTime || 0;
      if (position <= 1) return;
      try {
        const result = await fn({
          playDuration,
          duration: position,
          quality: currentQuality(),
          userWatchId: watchId,
        });
        if (typeof result === 'string') watchId = result;
      } catch (err) {
        console.error('Failed to send watch interval', err);
      }
    };

    const scheduleNext = () => {
      if (cancelled) return;
      reportTimer = setTimeout(async () => {
        await report();
        scheduleNext();
      }, intervalRef.current);
    };

    const onPlay = () => startSecondTimer();
    const onPause = () => stopSecondTimer();
    const onBeforeUnload = () => void report();

    player.addEventListener('play', onPlay);
    player.addEventListener('pause', onPause);
    player.addEventListener('ended', onPause);
    if (typeof window !== 'undefined') window.addEventListener('pagehide', onBeforeUnload);
    if (!player.paused) startSecondTimer();
    scheduleNext();

    return () => {
      cancelled = true;
      stopSecondTimer();
      if (reportTimer) clearTimeout(reportTimer);
      player.removeEventListener('play', onPlay);
      player.removeEventListener('pause', onPause);
      player.removeEventListener('ended', onPause);
      if (typeof window !== 'undefined') window.removeEventListener('pagehide', onBeforeUnload);
      void report();
    };
  }, [player, hasHandler]);
}
