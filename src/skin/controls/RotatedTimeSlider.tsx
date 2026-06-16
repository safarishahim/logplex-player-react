import { useRef, useState } from 'react';
import { useMediaRemote, useMediaState } from '@vidstack/react';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Scrubber for simulated (CSS-rotated 90° cw) fullscreen. Vidstack's own
 * TimeSlider derives the seek position from `(clientX - rect.left) / rect.width`,
 * but once the player is rotated the slider's bounding box width collapses to the
 * track's thickness, so every drag jumps. This reimplements the slider with the
 * same screen→local remap the gesture surface uses, so dragging tracks the finger
 * along the length the user actually sees. Mounted only while rotated; falls back
 * to the real TimeSlider otherwise (which keeps thumbnails/preview).
 */
export function RotatedTimeSlider(): JSX.Element {
  const remote = useMediaRemote();
  const currentTime = useMediaState('currentTime');
  const duration = useMediaState('duration');
  const [drag, setDrag] = useState<number | null>(null);
  const dragging = useRef(false);

  const playFrac = duration > 0 ? clamp(currentTime / duration, 0, 1) : 0;
  const frac = drag ?? playFrac;

  // Screen point → fraction along the slider, remapped for the 90° cw rotation
  // (local x runs along the slider's visible length = the element's box height).
  const fracFromEvent = (e: React.PointerEvent<HTMLDivElement>): number => {
    const rect = e.currentTarget.getBoundingClientRect();
    const cy = rect.top + rect.height / 2;
    const localX = e.clientY - cy + rect.height / 2;
    return clamp(localX / rect.height, 0, 1);
  };

  const onDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    dragging.current = true;
    setDrag(fracFromEvent(e));
  };

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    setDrag(fracFromEvent(e));
  };

  const onUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current) return;
    dragging.current = false;
    const f = fracFromEvent(e);
    if (duration > 0) remote.seek(f * duration);
    setDrag(null);
  };

  return (
    <div
      className="lpx-slider lpx-slider--rotated"
      role="slider"
      aria-label="seek"
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(frac * duration)}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={() => {
        dragging.current = false;
        setDrag(null);
      }}
    >
      <div className="lpx-track">
        <div className="lpx-track-fill" style={{ width: `${frac * 100}%` }} />
      </div>
      <div className="lpx-thumb" style={{ left: `${frac * 100}%` }} />
    </div>
  );
}
