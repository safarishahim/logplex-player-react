import { useEffect, useState } from 'react';
import { InfoIcon } from '../controls/icons';

export interface BadgeOverlayProps {
  text: string;
  /** How long the badge holds before animating out (default 4000ms). */
  holdMs?: number;
  /** Called once the badge has finished animating out. */
  onDone?: () => void;
}

/**
 * A transient info pill (top-right) — e.g. "ترافیک شما به صورت تمام‌بها حساب
 * می‌شود". Animates in at the start, holds a few seconds, then animates out.
 * Re-mount with a `key` to replay.
 */
export function BadgeOverlay({ text, holdMs = 4000, onDone }: BadgeOverlayProps): JSX.Element | null {
  const [phase, setPhase] = useState<'in' | 'out' | 'gone'>('in');

  useEffect(() => {
    const out = setTimeout(() => setPhase('out'), holdMs);
    const gone = setTimeout(() => {
      setPhase('gone');
      onDone?.();
    }, holdMs + 450);
    return () => {
      clearTimeout(out);
      clearTimeout(gone);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [holdMs]);

  if (phase === 'gone') return null;
  return (
    <div className={`lpx-badge lpx-badge--${phase}`} role="status">
      <span className="lpx-badge-icon">
        <InfoIcon />
      </span>
      <span className="lpx-badge-text">{text}</span>
    </div>
  );
}
