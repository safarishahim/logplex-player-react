import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import { CloseIcon, SettingsIcon } from './icons';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

export interface SettingsModalProps {
  strings: Strings;
  onClose: () => void;
}

/**
 * Centered quality + speed settings modal (frosted panel, radio list with a
 * gold selection). Layout is physical — it does not flip with text direction;
 * only the labels right-align in RTL.
 */
export function SettingsModal({ strings, onClose }: SettingsModalProps): JSX.Element {
  const remote = useMediaRemote();
  const qualities = useMediaState('qualities');
  const quality = useMediaState('quality');
  const autoQuality = useMediaState('autoQuality');
  const playbackRate = useMediaState('playbackRate');
  const list = Array.from(qualities ?? []);

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
      <div
        className="lpx-modal"
        role="dialog"
        aria-label={strings.qualityTitle}
        onPointerDown={(e) => e.stopPropagation()}
      >
        <div className="lpx-modal-head">
          <span className="lpx-modal-icon">
            <SettingsIcon />
          </span>
          <h3 className="lpx-modal-title">{strings.qualityTitle}</h3>
          <button className="lpx-modal-close" aria-label={strings.dismiss} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        <ul className="lpx-radios">
          {list.map((q, i) => (
            <Radio
              key={`${q.height}-${i}`}
              label={`${q.height}`}
              on={!autoQuality && quality === q}
              onSelect={() => {
                remote.changeQuality(i);
                onClose();
              }}
            />
          ))}
          <Radio
            label={`${strings.qualityAuto} (AUTO)`}
            on={autoQuality}
            onSelect={() => {
              remote.requestAutoQuality();
              onClose();
            }}
          />
        </ul>

        <div className="lpx-modal-sep" />
        <div className="lpx-modal-subtitle">{strings.speed}</div>
        <ul className="lpx-radios">
          {SPEEDS.map((s) => (
            <Radio
              key={s}
              label={s === 1 ? '1×' : `${s}×`}
              on={playbackRate === s}
              onSelect={() => remote.changePlaybackRate(s)}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
