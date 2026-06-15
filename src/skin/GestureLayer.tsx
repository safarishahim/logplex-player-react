import { useRef, useState } from 'react';
import { useMediaPlayer, useMediaRemote } from '@vidstack/react';
import type { Strings } from '../i18n';
import { loadPrefs, savePrefs } from '../player/prefs';
import { BrightnessIcon, FastForwardIcon, Forward10Icon, Replay10Icon, VolumeHighIcon } from './controls/icons';

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
const MOVE_THRESHOLD = 8;
const LONG_PRESS_MS = 450;
const DOUBLE_TAP_MS = 300;

type Side = 'l' | 'c' | 'r';
type Indicator = { kind: 'brightness' | 'volume'; value: number } | null;

export interface GestureLayerProps {
  strings: Strings;
  /** Toggle controls visibility (single tap on touch). */
  onTapToggle: () => void;
  /** Pointer activity — reveals controls + resets the idle timer. */
  onActivity?: () => void;
  /** Persist brightness across sessions. */
  persist?: boolean;
  storageKey?: string;
  /** Simulated fullscreen rotated the player 90° (CSS). Pointer coords are in
   * screen space but the user perceives the rotated frame, so we remap them. */
  rotated?: boolean;
}

/** A pointer position + the surface size, in the frame the *user* perceives. In
 * normal mode that's the element box as-is; when the player is CSS-rotated 90°
 * clockwise we map screen coords into the upright (landscape) local frame. */
interface LocalPoint {
  x: number;
  y: number;
  w: number;
  h: number;
}

/**
 * Touch-first gesture surface beneath the controls: double-tap edges to skip
 * ±10s, long-press for 2× speed, vertical swipe for brightness (left half) and
 * volume (right half). Desktop single-click toggles play. Brightness is a dim
 * overlay (the web can't touch real screen brightness).
 */
export function GestureLayer({
  strings,
  onTapToggle,
  onActivity,
  persist,
  storageKey,
  rotated,
}: GestureLayerProps): JSX.Element {
  const remote = useMediaRemote();
  // Read time/volume/rate from the player at gesture time instead of subscribing
  // — gestures don't need to re-render the surface on every time tick.
  const player = useMediaPlayer();

  const [brightness, setBrightness] = useState(() => (persist ? loadPrefs(storageKey).brightness ?? 1 : 1));
  const [rate2x, setRate2x] = useState(false);
  const [skip, setSkip] = useState<{ side: 'l' | 'r'; n: number } | null>(null);
  const [indicator, setIndicator] = useState<Indicator>(null);

  const g = useRef({
    active: false,
    touch: false,
    x0: 0,
    y0: 0,
    side: 'c' as Side,
    leftHalf: false,
    moved: false,
    axis: 'none' as 'none' | 'v' | 'h',
    startVolume: 1,
    startBrightness: 1,
    curBright: 1,
    brightTouched: false,
    longPress: null as ReturnType<typeof setTimeout> | null,
    singleTap: null as ReturnType<typeof setTimeout> | null,
    prevRate: 1,
    lastTapAt: 0,
    lastTapSide: 'c' as Side,
    indicatorTimer: null as ReturnType<typeof setTimeout> | null,
  });

  // Map a pointer event into the frame the user perceives. Normal: offset within
  // the element. Rotated (90° cw, centered): a screen point maps to local
  // (lx, ly) = (screenY - cy + h/2, -(screenX - cx) + w/2), with the local box
  // dimensions swapped (local width = rect.height, local height = rect.width).
  const toLocal = (e: React.PointerEvent<HTMLDivElement>): LocalPoint => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (!rotated) {
      return { x: e.clientX - rect.left, y: e.clientY - rect.top, w: rect.width, h: rect.height };
    }
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    return {
      x: e.clientY - cy + rect.height / 2,
      y: -(e.clientX - cx) + rect.width / 2,
      w: rect.height,
      h: rect.width,
    };
  };

  const clearTimers = () => {
    if (g.current.longPress) clearTimeout(g.current.longPress);
    if (g.current.singleTap) clearTimeout(g.current.singleTap);
    g.current.longPress = null;
  };

  const showSkip = (side: 'l' | 'r', n: number) => {
    setSkip({ side, n });
    setTimeout(() => setSkip(null), 500);
  };

  // Hide the brightness/volume indicator shortly after a swipe ends. Kept as a
  // single (cleared) timer so overlapping per-move timeouts can't flicker it.
  const hideIndicatorSoon = () => {
    if (g.current.indicatorTimer) clearTimeout(g.current.indicatorTimer);
    g.current.indicatorTimer = setTimeout(() => setIndicator(null), 500);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // On touch, a tap is a toggle (handled on pointer-up) — don't reveal here or
    // it fights the toggle and the controls flash then hide. Mouse/pen reveal.
    if (e.pointerType !== 'touch') onActivity?.();
    const p = toLocal(e);
    const s = g.current;
    if (s.indicatorTimer) clearTimeout(s.indicatorTimer); // keep indicator up if re-grabbed
    s.active = true;
    s.touch = e.pointerType === 'touch';
    s.x0 = p.x;
    s.y0 = p.y;
    s.side = p.x < p.w / 3 ? 'l' : p.x > (p.w * 2) / 3 ? 'r' : 'c';
    s.leftHalf = p.x < p.w / 2;
    s.moved = false;
    s.axis = 'none';
    s.startVolume = player?.volume ?? 1;
    s.startBrightness = brightness;
    if (s.singleTap) clearTimeout(s.singleTap);
    if (s.touch) {
      s.longPress = setTimeout(() => {
        if (!s.moved) {
          s.prevRate = player?.playbackRate || 1;
          remote.changePlaybackRate(2);
          setRate2x(true);
        }
      }, LONG_PRESS_MS);
    }
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const s = g.current;
    if (!s.active) {
      if (e.pointerType !== 'touch') onActivity?.(); // hover reveals controls
      return;
    }
    const p = toLocal(e);
    const dx = p.x - s.x0;
    const dy = p.y - s.y0;
    if (!s.moved && Math.hypot(dx, dy) > MOVE_THRESHOLD) {
      s.moved = true;
      s.axis = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h';
      if (s.longPress) clearTimeout(s.longPress);
    }
    if (s.touch && s.axis === 'v' && !rate2x) {
      const frac = -dy / p.h; // up increases
      if (s.leftHalf) {
        const b = clamp(s.startBrightness + frac, 0.2, 1);
        setBrightness(b);
        s.curBright = b;
        s.brightTouched = true;
        setIndicator({ kind: 'brightness', value: b });
      } else {
        const v = clamp(s.startVolume + frac, 0, 1);
        remote.changeVolume(v);
        // Keep mute in sync with the gesture so the mute button reflects it.
        if (v > 0) remote.unmute();
        else remote.mute();
        setIndicator({ kind: 'volume', value: v });
      }
    }
  };

  const onPointerUp = () => {
    const s = g.current;
    if (!s.active) return;
    s.active = false;
    if (s.longPress) clearTimeout(s.longPress);

    if (persist && s.brightTouched) {
      savePrefs({ brightness: s.curBright }, storageKey);
      s.brightTouched = false;
    }

    if (rate2x) {
      remote.changePlaybackRate(s.prevRate);
      setRate2x(false);
      return;
    }
    if (s.moved) {
      if (s.axis === 'v') hideIndicatorSoon(); // fade brightness/volume indicator once
      return;
    }

    const now = Date.now();
    if (s.touch) {
      // Mobile: double-tap edges seek ±10s; single tap toggles controls.
      const dbl = now - s.lastTapAt < DOUBLE_TAP_MS && s.lastTapSide === s.side;
      if (dbl && s.side !== 'c') {
        if (s.singleTap) clearTimeout(s.singleTap);
        const amount = s.side === 'l' ? -10 : 10;
        remote.seek(clamp((player?.currentTime || 0) + amount, 0, player?.duration || Infinity));
        showSkip(s.side, 10);
        s.lastTapAt = 0;
        return;
      }
      s.lastTapAt = now;
      s.lastTapSide = s.side;
      s.singleTap = setTimeout(() => onTapToggle(), DOUBLE_TAP_MS);
    } else {
      // Desktop, YouTube-style: click = play/pause, double-click = fullscreen.
      const dbl = now - s.lastTapAt < DOUBLE_TAP_MS;
      if (dbl) {
        if (s.singleTap) clearTimeout(s.singleTap);
        remote.toggleFullscreen();
        s.lastTapAt = 0;
        return;
      }
      s.lastTapAt = now;
      s.singleTap = setTimeout(() => remote.togglePaused(), DOUBLE_TAP_MS);
    }
  };

  return (
    <div
      className="lpx-gestures"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={() => {
        clearTimers();
        g.current.active = false;
      }}
    >
      {brightness < 1 && <div className="lpx-dim" style={{ opacity: 1 - brightness }} aria-hidden="true" />}

      {skip && (
        <div className={`lpx-skip lpx-skip--${skip.side}`} aria-hidden="true">
          {skip.side === 'l' ? <Replay10Icon /> : <Forward10Icon />}
          <span>{skip.n}s</span>
        </div>
      )}

      {rate2x && (
        <div className="lpx-rate-badge" aria-hidden="true">
          <FastForwardIcon className="lpx-rate-ff" />
          <span className="lpx-rate-text">2×</span>
        </div>
      )}

      {indicator && (
        <div
          className={`lpx-vslider lpx-vslider--${indicator.kind === 'brightness' ? 'left' : 'right'}`}
          role="status"
          aria-label={indicator.kind === 'volume' ? strings.mute : 'brightness'}
        >
          <div className="lpx-vslider-track">
            <span className="lpx-vslider-fill" style={{ height: `${Math.round(indicator.value * 100)}%` }} />
          </div>
          <span className="lpx-vslider-icon">
            {indicator.kind === 'brightness' ? <BrightnessIcon /> : <VolumeHighIcon />}
          </span>
        </div>
      )}
    </div>
  );
}
