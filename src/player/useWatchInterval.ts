import { useEffect, useRef } from 'react';
import type { MediaPlayerInstance } from '@vidstack/react';
import type { WatchIntervalHandler } from '../types';

/** Width × height of the rendition currently being downloaded, when known. */
export type RenditionProbe = () => { width: number; height: number } | null;

/**
 * Periodic "user watch" heartbeat for an external back-end (the pre-Logplex
 * tracker). Mirrors hamrah-player's `sendUserWatchIntervalHandler`:
 *
 * - accumulates real play time — only seconds in which frames were actually
 *   playing, so start-up, rebuffering and seeking aren't counted as watching;
 * - every `intervalMs` reports { playDuration, position, quality, userWatchId };
 * - chains the returned id into the next call;
 * - fires a final report on page hide / unmount;
 * - skips ticks before the first second of playback;
 * - starts a fresh session (a new record) when `sessionKey` changes — the
 *   host switching to another video in the same player.
 *
 * The host back-end derives traffic as playDuration × width × height, so
 * `quality` is the time-weighted average resolution of the session (see
 * below), not just whatever was playing first.
 *
 * This is independent of the built-in Logplex analytics, so the host can keep
 * using its current tracker while Logplex is not yet launched.
 */
export function useWatchInterval(
  player: MediaPlayerInstance | null,
  handler: WatchIntervalHandler | undefined,
  intervalMs = 5000,
  sessionKey?: string,
  probeRendition?: RenditionProbe,
): void {
  // Keep the latest handler/interval/probe in refs so the wiring effect stays stable.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const intervalRef = useRef(intervalMs);
  intervalRef.current = intervalMs;
  const probeRef = useRef(probeRendition);
  probeRef.current = probeRendition;

  const hasHandler = !!handler;
  useEffect(() => {
    // Depend on player + presence + session (not handler identity) so an
    // inline handler changing each render doesn't tear down listeners or
    // reset playDuration.
    if (!player || !hasHandler) return;

    let playDuration = 0;
    // Σ (pixels × seconds) and the last aspect ratio seen, for the average.
    let pixelSeconds = 0;
    let aspect = 16 / 9;
    // Last position seen while this session's video played: the final report
    // must not send a position that already belongs to the next video.
    let lastPosition = 0;
    let watchId: string | undefined;
    // A report in flight; the first one creates the record, so concurrent
    // reports must wait for its id instead of creating a second record.
    let inFlight: Promise<void> | null = null;
    let reportTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    // What is being watched: the rendition hls.js is downloading (that's the
    // traffic), else the selected quality, else the decoded frame size.
    const rendition = (): { width: number; height: number } | null => {
      const probed = probeRef.current?.();
      if (probed?.width && probed.height) return probed;
      const q = player.qualities?.selected;
      const width = q?.width || player.state?.mediaWidth;
      const height = q?.height || player.state?.mediaHeight;
      return width && height ? { width, height } : null;
    };

    // Count a second only while frames are really playing.
    const secondTimer = setInterval(() => {
      const { playing, waiting, seeking, currentTime } = player.state;
      if (!playing || waiting || seeking) return;
      playDuration += 1;
      lastPosition = currentTime || lastPosition;
      const r = rendition();
      if (r) {
        pixelSeconds += r.width * r.height;
        aspect = r.width / r.height;
      }
    }, 1000);

    // The back-end only accepts "WIDTH*HEIGHT" with a literal asterisk (regex
    // /^[0-9]+[*][0-9]+$/, then width × height × playDuration = traffic); any
    // other shape counts as zero traffic. Report the session's time-weighted
    // average resolution at the current aspect ratio, so a session that
    // dropped from 1080p to 720p isn't billed as 1080p throughout.
    const averageQuality = (): string => {
      if (!playDuration || !pixelSeconds) {
        const r = rendition();
        return r ? `${r.width}*${r.height}` : '';
      }
      const pixels = pixelSeconds / playDuration;
      const height = Math.max(1, Math.round(Math.sqrt(pixels / aspect)));
      const width = Math.max(1, Math.round(pixels / height));
      return `${width}*${height}`;
    };

    const send = async () => {
      const fn = handlerRef.current;
      if (!fn) return;
      if (lastPosition <= 1 || playDuration <= 0) return;
      try {
        const result = await fn({
          playDuration,
          duration: lastPosition,
          quality: averageQuality(),
          userWatchId: watchId,
        });
        if (typeof result === 'string') watchId = result;
      } catch (err) {
        console.error('Failed to send watch interval', err);
      }
    };

    const report = (): Promise<void> => {
      // Chain behind any report in flight so the record id is known first.
      const next = (inFlight ?? Promise.resolve()).then(send);
      inFlight = next.finally(() => {
        if (inFlight === next) inFlight = null;
      });
      return next;
    };

    const scheduleNext = () => {
      if (cancelled) return;
      reportTimer = setTimeout(async () => {
        await report();
        scheduleNext();
      }, intervalRef.current);
    };

    const onPageHide = () => void report();

    if (typeof window !== 'undefined') window.addEventListener('pagehide', onPageHide);
    scheduleNext();

    return () => {
      cancelled = true;
      clearInterval(secondTimer);
      if (reportTimer) clearTimeout(reportTimer);
      if (typeof window !== 'undefined') window.removeEventListener('pagehide', onPageHide);
      void report();
    };
  }, [player, hasHandler, sessionKey]);
}
