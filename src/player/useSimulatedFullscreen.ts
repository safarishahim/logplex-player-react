import { useCallback, useEffect, useState } from 'react';

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

    // Keep rotation in sync with the real viewport (native rotation clears CSS).
    const onResize = () => setRotate(portraitViewport());
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

  return { active: enabled && active, rotate, toggle, exit };
}
