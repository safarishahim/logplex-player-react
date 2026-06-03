import { useRef, useState } from 'react';
import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../i18n';
import { BrightnessIcon, Forward10Icon, Replay10Icon, VolumeHighIcon } from './controls/icons';

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
}

/**
 * Touch-first gesture surface beneath the controls: double-tap edges to skip
 * ±10s, long-press for 2× speed, vertical swipe for brightness (left half) and
 * volume (right half). Desktop single-click toggles play. Brightness is a dim
 * overlay (the web can't touch real screen brightness).
 */
export function GestureLayer({ strings, onTapToggle, onActivity }: GestureLayerProps): JSX.Element {
  const remote = useMediaRemote();
  const currentTime = useMediaState('currentTime');
  const duration = useMediaState('duration');
  const volume = useMediaState('volume');
  const playbackRate = useMediaState('playbackRate');

  const [brightness, setBrightness] = useState(1);
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
    longPress: null as ReturnType<typeof setTimeout> | null,
    singleTap: null as ReturnType<typeof setTimeout> | null,
    prevRate: 1,
    lastTapAt: 0,
    lastTapSide: 'c' as Side,
  });

  const clearTimers = () => {
    if (g.current.longPress) clearTimeout(g.current.longPress);
    if (g.current.singleTap) clearTimeout(g.current.singleTap);
    g.current.longPress = null;
  };

  const showSkip = (side: 'l' | 'r', n: number) => {
    setSkip({ side, n });
    setTimeout(() => setSkip(null), 500);
  };

  const flashIndicator = (ind: Indicator) => {
    setIndicator(ind);
    setTimeout(() => setIndicator(null), 700);
  };

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    onActivity?.();
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const s = g.current;
    s.active = true;
    s.touch = e.pointerType === 'touch';
    s.x0 = x;
    s.y0 = e.clientY - rect.top;
    s.side = x < rect.width / 3 ? 'l' : x > (rect.width * 2) / 3 ? 'r' : 'c';
    s.leftHalf = x < rect.width / 2;
    s.moved = false;
    s.axis = 'none';
    s.startVolume = volume ?? 1;
    s.startBrightness = brightness;
    if (s.singleTap) clearTimeout(s.singleTap);
    if (s.touch) {
      s.longPress = setTimeout(() => {
        if (!s.moved) {
          s.prevRate = playbackRate || 1;
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
    const rect = e.currentTarget.getBoundingClientRect();
    const dx = e.clientX - rect.left - s.x0;
    const dy = e.clientY - rect.top - s.y0;
    if (!s.moved && Math.hypot(dx, dy) > MOVE_THRESHOLD) {
      s.moved = true;
      s.axis = Math.abs(dy) > Math.abs(dx) ? 'v' : 'h';
      if (s.longPress) clearTimeout(s.longPress);
    }
    if (s.touch && s.axis === 'v' && !rate2x) {
      const frac = -dy / rect.height; // up increases
      if (s.leftHalf) {
        const b = clamp(s.startBrightness + frac, 0.2, 1);
        setBrightness(b);
        flashIndicator({ kind: 'brightness', value: b });
      } else {
        const v = clamp(s.startVolume + frac, 0, 1);
        remote.changeVolume(v);
        flashIndicator({ kind: 'volume', value: v });
      }
    }
  };

  const onPointerUp = () => {
    const s = g.current;
    if (!s.active) return;
    s.active = false;
    if (s.longPress) clearTimeout(s.longPress);

    if (rate2x) {
      remote.changePlaybackRate(s.prevRate);
      setRate2x(false);
      return;
    }
    if (s.moved) return; // swipe handled live

    const now = Date.now();
    if (s.touch) {
      // Mobile: double-tap edges seek ±10s; single tap toggles controls.
      const dbl = now - s.lastTapAt < DOUBLE_TAP_MS && s.lastTapSide === s.side;
      if (dbl && s.side !== 'c') {
        if (s.singleTap) clearTimeout(s.singleTap);
        const amount = s.side === 'l' ? -10 : 10;
        remote.seek(clamp((currentTime || 0) + amount, 0, duration || Infinity));
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

      {rate2x && <div className="lpx-rate-badge" aria-hidden="true">2×&nbsp;»</div>}

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
