import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import { CloseIcon, SpeedIcon } from './icons';

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
    <div className="lpx-modal-scrim" onPointerDown={onClose}>
      <div className="lpx-modal" role="dialog" aria-label={strings.speed} onPointerDown={(e) => e.stopPropagation()}>
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
            <li key={s}>
              <button
                className="lpx-radio-opt"
                role="radio"
                aria-checked={(playbackRate || 1) === s}
                onClick={() => {
                  remote.changePlaybackRate(s);
                  onClose();
                }}
              >
                <span className="lpx-radio-label">{s === 1 ? `${strings.speedNormal} (1×)` : `${s}×`}</span>
                <span className="lpx-radio-dot" data-on={(playbackRate || 1) === s || undefined} />
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
