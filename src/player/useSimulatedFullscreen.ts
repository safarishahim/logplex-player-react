import { useCallback, useEffect, useState } from 'react';

/** Whether the real Fullscreen API is usable. Often false inside WebViews. */
export function nativeFullscreenSupported(): boolean {
  return typeof document !== 'undefined' && document.fullscreenEnabled === true;
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

  const toggle = useCallback(() => {
    setActive((a) => {
      const next = !a;
      if (next) {
        setRotate(portraitViewport());
        try {
          // Best-effort native rotate; if it succeeds the resize handler
          // clears `rotate` (viewport becomes landscape).
          (screen.orientation as unknown as { lock?: (o: string) => Promise<void> })?.lock?.('landscape')?.catch(
            () => undefined,
          );
        } catch {
          /* unsupported in WebView */
        }
      } else {
        try {
          screen.orientation?.unlock?.();
        } catch {
          /* */
        }
      }
      return next;
    });
  }, []);

  const exit = useCallback(() => setActive(false), []);

  useEffect(() => {
    if (!enabled || !active) return;
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
      window.removeEventListener('resize', onResize);
      window.removeEventListener('orientationchange', onResize);
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [enabled, active]);

  return { active: enabled && active, rotate, toggle, exit };
}
