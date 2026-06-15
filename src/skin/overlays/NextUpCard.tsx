import { useState } from 'react';
import { useMediaState } from '@vidstack/react';
import type { Episode } from '../../types';
import type { Strings } from '../../i18n';
import { CloseIcon, PlayIcon } from '../controls/icons';

const NEXT_UP_SECONDS = 30;

export interface NextUpCardProps {
  episode: Episode;
  strings: Strings;
  onNext?: () => void;
}

/**
 * "Up next" card shown in the last {@link NEXT_UP_SECONDS} of an episode that
 * has a next one: the next episode's cover + a bar that fills toward the end.
 * Ignoring it lets the player auto-advance on `ended`; clicking jumps now.
 *
 * Self-contained so the high-frequency `currentTime` subscription lives here —
 * only this small card re-renders each tick, not the whole skin. Mount it with
 * `key={episodeId}` so the dismissed state resets when the episode changes.
 */
export function NextUpCard({ episode, strings, onNext }: NextUpCardProps): JSX.Element | null {
  const currentTime = useMediaState('currentTime');
  const duration = useMediaState('duration');
  const started = useMediaState('started');
  const [dismissed, setDismissed] = useState(false);

  const remaining = duration > 0 ? duration - currentTime : Infinity;
  if (dismissed || !started || duration <= 0 || remaining > NEXT_UP_SECONDS || remaining <= 0.3) {
    return null;
  }
  const progress = Math.min(1, Math.max(0, (NEXT_UP_SECONDS - remaining) / NEXT_UP_SECONDS));

  return (
    <div className="lpx-nextup">
      <button
        type="button"
        className="lpx-nextup-card"
        onClick={() => onNext?.()}
        aria-label={`${strings.nextUpTitle}: ${episode.title ?? ''}`}
      >
        <span
          className="lpx-nextup-cover"
          style={episode.poster ? { backgroundImage: `url("${episode.poster}")` } : undefined}
        >
          <span className="lpx-nextup-play">
            <PlayIcon />
          </span>
        </span>
        <span className="lpx-nextup-body">
          <span className="lpx-nextup-label">{strings.nextUpTitle}</span>
          {(episode.title || episode.subtitle) && (
            <span className="lpx-nextup-name">{episode.title ?? episode.subtitle}</span>
          )}
          <span className="lpx-nextup-bar" aria-hidden="true">
            <span className="lpx-nextup-fill" style={{ width: `${progress * 100}%` }} />
          </span>
        </span>
      </button>
      <button
        type="button"
        className="lpx-nextup-close"
        aria-label={strings.dismiss}
        onClick={() => setDismissed(true)}
      >
        <CloseIcon />
      </button>
    </div>
  );
}
