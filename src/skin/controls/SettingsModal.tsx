import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import { CloseIcon, SettingsIcon } from './icons';
import { RadioOption } from './RadioOption';

export interface SettingsModalProps {
  strings: Strings;
  onClose: () => void;
  /** Manual MP4 renditions; when set, replaces the auto (HLS) quality list. */
  manualQualities?: { label: string; index: number }[];
  currentQualityIndex?: number;
  onSelectQuality?: (index: number) => void;
}

/**
 * Centered quality settings modal (frosted panel, radio list with a gold
 * selection). Quality only — playback speed has its own menu. Layout is
 * physical; only the labels right-align in RTL.
 */
export function SettingsModal({
  strings,
  onClose,
  manualQualities,
  currentQualityIndex,
  onSelectQuality,
}: SettingsModalProps): JSX.Element {
  const remote = useMediaRemote();
  const qualities = useMediaState('qualities');
  const quality = useMediaState('quality');
  const autoQuality = useMediaState('autoQuality');
  const list = Array.from(qualities ?? []);
  const manual = manualQualities && manualQualities.length > 0;

  return (
    <div className="lpx-modal-scrim" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lpx-modal" role="dialog" aria-label={strings.qualityTitle}>
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
          {manual
            ? manualQualities!.map((q) => (
                <RadioOption
                  key={q.index}
                  label={q.label}
                  on={q.index === currentQualityIndex}
                  onSelect={() => {
                    onSelectQuality?.(q.index);
                    onClose();
                  }}
                />
              ))
            : list.map((q, i) => (
                <RadioOption
                  key={`${q.height}-${i}`}
                  label={`${q.height}p`}
                  on={!autoQuality && quality === q}
                  onSelect={() => {
                    remote.changeQuality(i);
                    onClose();
                  }}
                />
              ))}
          {/* Auto only applies to adaptive (HLS) sources. */}
          {!manual && (
            <RadioOption
              label={`${strings.qualityAuto} (AUTO)`}
              on={autoQuality}
              onSelect={() => {
                remote.requestAutoQuality();
                onClose();
              }}
            />
          )}
        </ul>
      </div>
    </div>
  );
}
