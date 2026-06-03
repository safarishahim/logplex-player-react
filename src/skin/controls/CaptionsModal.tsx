import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import { CaptionsIcon, CloseIcon } from './icons';
import { RadioOption } from './RadioOption';

export interface CaptionsModalProps {
  strings: Strings;
  onClose: () => void;
}

/** Subtitle/caption picker. Switches tracks via the media remote, using each
 * track's index in the FULL text-track list (the index the remote expects). */
export function CaptionsModal({ strings, onClose }: CaptionsModalProps): JSX.Element {
  const remote = useMediaRemote();
  const textTracks = useMediaState('textTracks');
  const current = useMediaState('textTrack');
  // Keep original indices — changeTextTrackMode addresses the full list.
  const subs = (textTracks ?? [])
    .map((t, i) => ({ t, i }))
    .filter(({ t }) => t.kind === 'subtitles' || t.kind === 'captions');

  const turnOff = () => {
    remote.disableCaptions();
    onClose();
  };

  return (
    <div className="lpx-modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lpx-modal" role="dialog" aria-label={strings.captionsTitle}>
        <div className="lpx-modal-head">
          <span className="lpx-modal-icon">
            <CaptionsIcon />
          </span>
          <h3 className="lpx-modal-title">{strings.captionsTitle}</h3>
          <button className="lpx-modal-close" aria-label={strings.dismiss} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <ul className="lpx-radios">
          <RadioOption label={strings.off} on={!current} onSelect={turnOff} />
          {subs.map(({ t, i }) => (
            <RadioOption
              key={`${t.label}-${i}`}
              label={t.label || t.language || `${i + 1}`}
              on={current === t}
              onSelect={() => {
                remote.changeTextTrackMode(i, 'showing');
                onClose();
              }}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
