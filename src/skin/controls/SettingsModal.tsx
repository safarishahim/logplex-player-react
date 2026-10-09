import { useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import type { QualityPolicy } from '../../types';
import { applyQualityPolicy, displayHeight, type RenditionTiers } from '../../player/qualityPolicy';
import { CloseIcon, SettingsIcon } from './icons';
import { RadioOption } from './RadioOption';

export interface SettingsModalProps {
  strings: Strings;
  onClose: () => void;
  /** Manual MP4 renditions; when set, replaces the auto (HLS) quality list. */
  manualQualities?: { label: string; index: number }[];
  currentQualityIndex?: number;
  onSelectQuality?: (index: number) => void;
  /** Hide auto (HLS) qualities whose height fails this predicate. */
  qualityValidate?: (height: number) => boolean;
  /** Hide auto (HLS) qualities the policy rules out. */
  qualityPolicy?: QualityPolicy;
  /** Display heights the playlist names for its renditions. */
  renditionTiers?: RenditionTiers;
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
  qualityValidate,
  qualityPolicy,
  renditionTiers,
}: SettingsModalProps): JSX.Element {
  const remote = useMediaRemote();
  const qualities = useMediaState('qualities');
  const quality = useMediaState('quality');
  const autoQuality = useMediaState('autoQuality');
  // Keep each quality's real list index for changeQuality() while filtering.
  const all = Array.from(qualities ?? []);
  const { allowed } = applyQualityPolicy(
    all.map((q) => displayHeight(q, renditionTiers)),
    qualityPolicy,
  );
  const list = all
    .map((q, i) => ({ q, i }))
    .filter(({ i }) => allowed[i])
    .filter(({ q }) => {
      const height = displayHeight(q, renditionTiers);
      return !qualityValidate || typeof height !== 'number' || qualityValidate(height);
    });
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
            : list.map(({ q, i }) => (
                <RadioOption
                  key={`${q.height}-${i}`}
                  label={`${displayHeight(q, renditionTiers)}p`}
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
              // While on Auto, show the resolution ABR is currently playing.
              hint={autoQuality && quality?.height ? `${displayHeight(quality, renditionTiers)}p` : undefined}
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
