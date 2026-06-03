import { useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import { CaptionsIcon, CloseIcon } from './icons';

export interface CaptionsModalProps {
  strings: Strings;
  onClose: () => void;
}

/** Subtitle/caption picker — lists subtitle & caption text tracks plus an Off
 * option. Selecting a track sets its mode to 'showing' and disables the rest. */
export function CaptionsModal({ strings, onClose }: CaptionsModalProps): JSX.Element {
  const textTracks = useMediaState('textTracks');
  const current = useMediaState('textTrack');
  const list = (textTracks ?? []).filter((t) => t.kind === 'subtitles' || t.kind === 'captions');

  const select = (track: (typeof list)[number] | null) => {
    list.forEach((t) => {
      t.mode = t === track ? 'showing' : 'disabled';
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
          <Radio label={strings.off} on={!current} onSelect={() => select(null)} />
          {list.map((t, i) => (
            <Radio
              key={`${t.label}-${i}`}
              label={t.label || t.language || `${i + 1}`}
              on={current === t}
              onSelect={() => select(t)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
