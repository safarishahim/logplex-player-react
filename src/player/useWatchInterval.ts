import { useEffect, useRef } from 'react';
import { isHLSProvider, isVideoProvider, type MediaPlayerInstance } from '@vidstack/react';
import type { WatchIntervalHandler } from '../types';
import { addBytes, type BytesByHost, type TrafficMeter } from './trafficMeter';

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
 * below), not just whatever was playing first. With a `meter`, each report
 * also carries the bytes actually downloaded for the session, per host — a
 * traffic figure that doesn't depend on that formula at all.
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
  meter?: TrafficMeter,
): void {
  // Keep the latest handler/interval/probe in refs so the wiring effect stays stable.
  const handlerRef = useRef(handler);
  handlerRef.current = handler;
  const intervalRef = useRef(intervalMs);
  intervalRef.current = intervalMs;
  const probeRef = useRef(probeRendition);
  probeRef.current = probeRendition;
  const meterRef = useRef(meter);
  meterRef.current = meter;

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
    // Bytes downloaded for this session, per host, and how much of that is an
    // estimate (playback the meter can't observe). Cumulative, like
    // playDuration, so a lost or repeated report can't skew the total.
    const bytesByHost: BytesByHost = {};
    let estimatedBytes = 0;
    // Bytes that arrived before this session belong to whatever played then
    // (its own session took them in its final report), or to nothing.
    meterRef.current?.drain();
    // Once this session ends, whatever the meter collects is the next one's.
    let closed = false;
    const collect = () => {
      if (closed) return;
      const taken = meterRef.current?.drain();
      if (taken) Object.entries(taken).forEach(([host, bytes]) => addBytes(bytesByHost, host, bytes));
    };
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
      // Downloads count whether or not frames are playing (buffering ahead
      // while paused is traffic too).
      collect();
      const { playing, waiting, seeking, currentTime, duration, mediaHeight, buffered } = player.state;
      // Only the browser's own player (plain <video>: MP4, native HLS) needs
      // estimating; hls.js playback is measured by the meter directly.
      const native = isVideoProvider(player.provider) && !isHLSProvider(player.provider);
      const ranges: Array<[number, number]> = [];
      for (let i = 0; native && i < (buffered?.length ?? 0); i += 1) ranges.push([buffered.start(i), buffered.end(i)]);
      const estimate = native ? meterRef.current?.estimate(ranges, rendition()?.height || mediaHeight, duration) : null;
      if (estimate) {
        addBytes(bytesByHost, estimate.host, estimate.bytes);
        estimatedBytes += estimate.bytes;
      }
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
      collect();
      if (lastPosition <= 1 || playDuration <= 0) return;
      const hosts = Object.fromEntries(Object.entries(bytesByHost).map(([host, bytes]) => [host, Math.round(bytes)]));
      const downloadedBytes = Object.values(hosts).reduce((sum, bytes) => sum + bytes, 0);
      try {
        const result = await fn({
          playDuration,
          duration: lastPosition,
          quality: averageQuality(),
          userWatchId: watchId,
          ...(meterRef.current && {
            downloadedBytes,
            bytesByHost: hosts,
            estimatedBytes: Math.min(downloadedBytes, Math.round(estimatedBytes)),
          }),
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
      // Take this session's last bytes now: the final report may run after the
      // next session has started on the same meter.
      collect();
      closed = true;
      void report();
    };
  }, [player, hasHandler, sessionKey]);
}
