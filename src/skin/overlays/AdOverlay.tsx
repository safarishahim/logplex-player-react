import { useEffect } from 'react';
import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import { VolumeHighIcon, VolumeMutedIcon } from '../controls/icons';

export interface AdOverlayProps {
  strings: Strings;
  skipAfterSec: number;
  clickThrough?: string;
  /** Fired on skip or natural ad end. */
  onEnd: () => void;
}

/** Pre-roll ad UI: ADS label, mute, skip-after-countdown, progress, click-through. */
export function AdOverlay({ strings, skipAfterSec, clickThrough, onEnd }: AdOverlayProps): JSX.Element {
  const remote = useMediaRemote();
  const currentTime = useMediaState('currentTime');
  const duration = useMediaState('duration');
  const ended = useMediaState('ended');
  const muted = useMediaState('muted');
  const volume = useMediaState('volume');

  useEffect(() => {
    if (ended) onEnd();
  }, [ended, onEnd]);

  const remaining = Math.max(0, Math.ceil(skipAfterSec - (currentTime || 0)));
  const canSkip = remaining <= 0;
  const pct = duration > 0 ? Math.min(100, ((currentTime || 0) / duration) * 100) : 0;
  const isMuted = muted || volume === 0;

  return (
    <div className="lpx-ad">
      {clickThrough && (
        <a
          className="lpx-ad-click"
          href={clickThrough}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={strings.adLabel}
        />
      )}
      <div className="lpx-ad-top">
        <span className="lpx-ad-label">{strings.adLabel}</span>
        <button
          className="lpx-btn"
          aria-label={isMuted ? strings.unmute : strings.mute}
          onClick={() => remote.toggleMuted()}
        >
          {isMuted ? <VolumeMutedIcon /> : <VolumeHighIcon />}
        </button>
      </div>
      <div className="lpx-ad-bottom">
        <button className="lpx-ad-skip" disabled={!canSkip} onClick={() => onEnd()}>
          {canSkip ? strings.skipAd : `${strings.skipAd} · ${remaining}`}
        </button>
        <div className="lpx-ad-progress">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
