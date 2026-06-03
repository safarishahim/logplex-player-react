import type { PlayerRestriction } from '../../types';
import type { Strings } from '../../i18n';
import { BroadcastIcon, RetryIcon } from '../controls/icons';

export interface RestrictionOverlayProps {
  restriction: PlayerRestriction;
  strings: Strings;
}

/**
 * Full-cover blocking overlay — e.g. the viewer's IP/network isn't allowed.
 * Sits above the skin, blocks interaction, and offers retry / exit actions.
 */
export function RestrictionOverlay({ restriction, strings }: RestrictionOverlayProps): JSX.Element {
  return (
    <div className="lpx-restrict" role="alertdialog" aria-modal="true" aria-label={restriction.title}>
      <div className="lpx-restrict-card">
        <span className="lpx-restrict-icon">
          <BroadcastIcon />
        </span>
        <h3 className="lpx-restrict-title">{restriction.title}</h3>
        <p className="lpx-restrict-msg">{restriction.message}</p>
        <div className="lpx-restrict-actions">
          {restriction.onRetry && (
            <button className="lpx-restrict-retry" type="button" onClick={restriction.onRetry}>
              <RetryIcon />
              <span>{restriction.retryLabel ?? strings.retry}</span>
            </button>
          )}
          {restriction.onExit && (
            <button className="lpx-restrict-exit" type="button" onClick={restriction.onExit}>
              {restriction.exitLabel ?? strings.exit}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
