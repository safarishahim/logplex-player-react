import { useCallback, useEffect, useState } from 'react';
import type { CSSProperties } from 'react';

/**
 * Whether a real (OS) fullscreen is usable. True when the element Fullscreen API
 * is available, OR — on iOS, where it isn't — when the <video> element supports
 * its own native fullscreen (`webkitEnterFullscreen`). Vidstack uses the video
 * element on iOS, which rotates correctly and (unlike a CSS-simulated rotation)
 * doesn't render black. Typically false in WebViews without either.
 */
export function nativeFullscreenSupported(): boolean {
  if (typeof document === 'undefined') return false;
  if (document.fullscreenEnabled) return true;
  try {
    const v = document.createElement('video') as HTMLVideoElement & { webkitEnterFullscreen?: () => void };
    return typeof v.webkitEnterFullscreen === 'function';
  } catch {
    return false;
  }
}

interface SimFullscreen {
  active: boolean;
  /** Rotate 90° to simulate landscape inside a portrait viewport. */
  rotate: boolean;
  /**
   * Inline style for the rotated box, with explicit pixel dimensions taken from
   * the live viewport. Some Android WebViews resolve `100dvh`/`100dvw` (and even
   * `vh`/`vw`) incorrectly, leaving the rotated player covering only part of the
   * screen — pixels from `window.inner*` are exact there. Undefined unless
   * rotating.
   */
  rotateStyle?: CSSProperties;
  toggle: () => void;
  exit: () => void;
}

/**
 * CSS-based fullscreen for environments where the native Fullscreen API and
 * screen-orientation lock don't work (WebViews). Fills the viewport; in a
 * portrait viewport it rotates 90° to present landscape content full-bleed.
 * Attempts a native orientation lock first (harmless if it throws).
 */
export function useSimulatedFullscreen(enabled: boolean): SimFullscreen {
  const [active, setActive] = useState(false);
  const [rotate, setRotate] = useState(false);
  // Live viewport size in CSS px — the rotated box is sized from these instead
  // of viewport units (which some WebViews resolve wrong).
  const [vp, setVp] = useState<{ w: number; h: number }>({ w: 0, h: 0 });

  const portraitViewport = () =>
    typeof window !== 'undefined' && window.innerHeight > window.innerWidth;

  const toggle = useCallback(() => setActive((a) => !a), []);
  const exit = useCallback(() => setActive(false), []);

  useEffect(() => {
    if (!enabled || !active) return;

    let cancelled = false;
    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;

    // Try a real device rotation first. If the environment can't rotate — the
    // lock API is missing, it rejects, or (some WebViews) it "succeeds" but the
    // viewport never turns — fall back to a CSS 90° rotation. We start with CSS
    // off so a successful native rotation doesn't briefly double-rotate.
    let lock: Promise<void> | undefined;
    try {
      lock = (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.('landscape');
    } catch {
      lock = undefined;
    }
    if (lock && typeof lock.then === 'function') {
      setRotate(false);
      lock
        .then(() => {
          fallbackTimer = setTimeout(() => {
            if (!cancelled && portraitViewport()) setRotate(true); // lock didn't actually rotate
          }, 350);
        })
        .catch(() => {
          if (!cancelled) setRotate(portraitViewport());
        });
    } else {
      setRotate(portraitViewport());
    }

    // Keep rotation + measured size in sync with the real viewport (native
    // rotation clears CSS; a resize changes the px the rotated box needs).
    const syncVp = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    syncVp();
    const onResize = () => {
      setRotate(portraitViewport());
      syncVp();
    };
    window.addEventListener('resize', onResize);
    window.addEventListener('orientationchange', onResize);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActive(false);
    };
    window.addEventListener('keydown', onKey);

    return () => {
      cancelled = true;
      if (fallbackTimer) clearTimeout(fallbackTimer);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
      setRotate(false);
      try {
        screen.orientation?.unlock?.();
      } catch {
        /* */
      }
    };
  }, [enabled, active]);

  // Landscape box inside a portrait viewport: width = viewport height, height =
  // viewport width (swapped), centered, then rotated 90°. Exact pixels dodge the
  // WebView viewport-unit bugs. Inline style overrides the CSS class.
  const rotateStyle: CSSProperties | undefined =
    enabled && active && rotate && vp.w > 0
      ? {
          position: 'fixed',
          top: '50%',
          left: '50%',
          right: 'auto',
          bottom: 'auto',
          width: `${vp.h}px`,
          height: `${vp.w}px`,
          transform: 'translate(-50%, -50%) rotate(90deg)',
        }
      : undefined;

  return { active: enabled && active, rotate, rotateStyle, toggle, exit };
}
