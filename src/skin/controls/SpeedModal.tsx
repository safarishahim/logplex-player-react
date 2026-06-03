import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import { CloseIcon, SpeedIcon } from './icons';
import { RadioOption } from './RadioOption';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export interface SpeedModalProps {
  strings: Strings;
  onClose: () => void;
}

/** Centered playback-speed modal — separate from the quality menu. */
export function SpeedModal({ strings, onClose }: SpeedModalProps): JSX.Element {
  const remote = useMediaRemote();
  const playbackRate = useMediaState('playbackRate');

  return (
    <div className="lpx-modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lpx-modal" role="dialog" aria-label={strings.speed}>
        <div className="lpx-modal-head">
          <span className="lpx-modal-icon">
            <SpeedIcon />
          </span>
          <h3 className="lpx-modal-title">{strings.speed}</h3>
          <button className="lpx-modal-close" aria-label={strings.dismiss} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <ul className="lpx-radios">
          {SPEEDS.map((s) => (
            <RadioOption
              key={s}
              label={s === 1 ? `${strings.speedNormal} (1×)` : `${s}×`}
              on={(playbackRate || 1) === s}
              onSelect={() => {
                remote.changePlaybackRate(s);
                onClose();
              }}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
