import { useEffect } from 'react';
import type { MediaPlayerInstance } from '@vidstack/react';

/** How long playback may sit still, with data to play, before we step in. */
const STUCK_MS = 2500;
const CHECK_MS = 500;
/** Buffered media ahead of the playhead that should have kept it moving. */
const MIN_AHEAD_SEC = 1;

function bufferedAhead(video: HTMLVideoElement): number {
  const t = video.currentTime;
  for (let i = 0; i < video.buffered.length; i += 1) {
    if (video.buffered.start(i) <= t + 0.1 && video.buffered.end(i) > t) return video.buffered.end(i) - t;
  }
  return 0;
}

const decodedFrames = (video: HTMLVideoElement): number | null => {
  try {
    return video.getVideoPlaybackQuality?.().totalVideoFrames ?? null;
  } catch {
    return null;
  }
};

/**
 * Restarts playback that froze with nothing wrong reported. iOS Safari, after a
 * seek from the scrubber, can leave the video "playing" — not paused, not
 * waiting, the data for the new position already buffered — while neither the
 * time nor the picture moves; no spinner shows, and only a pause and play gets
 * it going again. When playback sits still like that for a few seconds, this
 * does that pause and play, then, if it is still stuck, nudges the position
 * forward a fraction of a second.
 *
 * Only steps in when the element says it's playing and has media ahead of the
 * playhead, so it never acts on a real rebuffer (hls.js's own stall handling
 * covers holes in the buffer) or on a pause.
 */
export function useStallRecovery(player: MediaPlayerInstance | null): void {
  useEffect(() => {
    if (!player || typeof window === 'undefined') return undefined;

    let lastTime = -1;
    let lastFrames: number | null = null;
    let stillSince = 0;
    let attempts = 0;

    const timer = window.setInterval(() => {
      const video = player.el?.querySelector('video');
      if (!video) return;
      const now = Date.now();
      // A hidden tab stops decoding frames while time runs on: judge by the
      // picture only while it's on screen.
      const frames = document.visibilityState === 'visible' ? decodedFrames(video) : null;
      const moving =
        video.currentTime !== lastTime && (frames === null || lastFrames === null || frames !== lastFrames);
      lastTime = video.currentTime;
      lastFrames = frames;

      const shouldPlay = !video.paused && !video.ended && !video.seeking && video.playbackRate > 0;
      if (moving || !shouldPlay || bufferedAhead(video) < MIN_AHEAD_SEC) {
        stillSince = 0;
        if (moving) attempts = 0;
        return;
      }
      if (!stillSince) stillSince = now;
      if (now - stillSince < STUCK_MS) return;

      stillSince = 0;
      attempts += 1;
      if (attempts === 1) {
        // What the viewer would do: pause and play again.
        video.pause();
        void video.play().catch(() => {});
      } else if (attempts === 2) {
        video.currentTime += 0.1;
      }
      // Two tries per freeze; it re-arms once playback moves again.
    }, CHECK_MS);

    return () => window.clearInterval(timer);
  }, [player]);
}
