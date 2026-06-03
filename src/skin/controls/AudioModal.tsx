import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import { AudioIcon, CloseIcon } from './icons';

export interface AudioModalProps {
  strings: Strings;
  onClose: () => void;
}

/** Audio-language picker — lists the audio tracks exposed by the source
 * (e.g. HLS alternate-audio renditions) and switches via the media remote. */
export function AudioModal({ strings, onClose }: AudioModalProps): JSX.Element {
  const remote = useMediaRemote();
  const audioTracks = useMediaState('audioTracks');
  const current = useMediaState('audioTrack');
  const list = audioTracks ?? [];

  const Radio = ({ label, on, onSelect }: { label: string; on: boolean; onSelect: () => void }) => (
    <li>
      <button className="lpx-radio-opt" role="radio" aria-checked={on} onClick={onSelect}>
        <span className="lpx-radio-label">{label}</span>
        <span className="lpx-radio-dot" data-on={on || undefined} />
      </button>
    </li>
  );

  return (
    <div className="lpx-modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lpx-modal" role="dialog" aria-label={strings.audioTitle}>
        <div className="lpx-modal-head">
          <span className="lpx-modal-icon">
            <AudioIcon />
          </span>
          <h3 className="lpx-modal-title">{strings.audioTitle}</h3>
          <button className="lpx-modal-close" aria-label={strings.dismiss} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <ul className="lpx-radios">
          {list.map((t, i) => (
            <Radio
              key={`${t.label}-${i}`}
              label={t.label || t.language || `${i + 1}`}
              on={current === t}
              onSelect={() => {
                remote.changeAudioTrack(i);
                onClose();
              }}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
