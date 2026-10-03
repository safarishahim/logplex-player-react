import { useEffect, useState } from 'react';
import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import { PlayIcon, VolumeHighIcon, VolumeMutedIcon } from '../controls/icons';

export interface AdOverlayProps {
  strings: Strings;
  skipAfterSec: number;
  /** When false the ad can't be skipped and no skip button is shown. */
  skippable?: boolean;
  clickThrough?: string;
  /** Fired on skip or natural ad end. */
  onEnd: () => void;
}

/** Ad UI: ADS label, mute, skip-after-countdown, progress, click-through. */
export function AdOverlay({ strings, skipAfterSec, skippable = true, clickThrough, onEnd }: AdOverlayProps): JSX.Element {
  const remote = useMediaRemote();
  const currentTime = useMediaState('currentTime');
  const duration = useMediaState('duration');
  const ended = useMediaState('ended');
  const muted = useMediaState('muted');
  const volume = useMediaState('volume');
  const paused = useMediaState('paused');
  const canPlay = useMediaState('canPlay');

  useEffect(() => {
    if (ended) onEnd();
  }, [ended, onEnd]);

  // The browser can refuse to start the ad without a tap (autoplay policy —
  // Safari especially, since an ad break swaps in a fresh <video>). The ad has
  // no other play control and its skip countdown runs on ad time, so without
  // this the viewer would be stuck. A short delay keeps it from flashing
  // between "can play" and the player's own play() call.
  const stalled = paused && canPlay && !ended;
  const [showPlay, setShowPlay] = useState(false);
  useEffect(() => {
    if (!stalled) {
      setShowPlay(false);
      return undefined;
    }
    const t = setTimeout(() => setShowPlay(true), 400);
    return () => clearTimeout(t);
  }, [stalled]);

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
      {showPlay && (
        <button className="lpx-cover lpx-ad-play" aria-label={strings.play} onClick={() => remote.play()}>
          <span className="lpx-cover-play">
            <PlayIcon />
          </span>
        </button>
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
        {skippable && (
          <button className="lpx-ad-skip" disabled={!canSkip} onClick={() => onEnd()}>
            {canSkip ? strings.skipAd : `${strings.skipAd} · ${remaining}`}
          </button>
        )}
        <div className="lpx-ad-progress">
          <span style={{ width: `${pct}%` }} />
        </div>
      </div>
    </div>
  );
}
