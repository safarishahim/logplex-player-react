import { useEffect, useState } from 'react';

export interface BadgeOverlayProps {
  text: string;
  /** How long the badge holds before animating out (default 4000ms). */
  holdMs?: number;
}

/**
 * A content badge (e.g. "تمام‌بها" / premium) that animates in at the start,
 * holds for a few seconds, then animates out. Re-mount with a `key` to replay.
 */
export function BadgeOverlay({ text, holdMs = 4000 }: BadgeOverlayProps): JSX.Element | null {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in');

  useEffect(() => {
    const out = setTimeout(() => setPhase('out'), holdMs);
    const gone = setTimeout(() => setPhase('gone'), holdMs + 450);
    return () => {
      clearTimeout(out);
      clearTimeout(gone);
    };
  }, [holdMs]);

  if (phase === 'gone') return null;
  return (
    <div className={`lpx-badge lpx-badge--${phase}`} role="status">
      {text}
    </div>
  );
}
