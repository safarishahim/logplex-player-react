import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import { CaptionsIcon, CloseIcon } from './icons';

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
    (textTracks ?? []).forEach((t, i) => {
      if (t.mode === 'showing') remote.changeTextTrackMode(i, 'disabled');
    });
    onClose();
  };

  const Radio = ({ label, on, onSelect }: { label: string; on: boolean; onSelect: () => void }) => (
    <li>
      <button className="lpx-radio-opt" role="radio" aria-checked={on} onClick={onSelect}>
        <span className="lpx-radio-label">{label}</span>
        <span className="lpx-radio-dot" data-on={on || undefined} />
      </button>
    </li>
  );

  return (
    <div className="lpx-modal-scrim" onPointerDown={onClose}>
      <div className="lpx-modal" role="dialog" aria-label={strings.captionsTitle} onPointerDown={(e) => e.stopPropagation()}>
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
          <Radio label={strings.off} on={!current} onSelect={turnOff} />
          {subs.map(({ t, i }) => (
            <Radio
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
