import { useEffect, useState } from 'react';
import type { PlayerNotice } from '../../types';
import type { Strings } from '../../i18n';
import { CloseIcon } from '../controls/icons';

export interface NoticeBannerProps {
  notice: PlayerNotice;
  strings: Strings;
}

/**
 * Top notice banner (operator/network message). Host-controlled and shown
 * above the player chrome, independent of controls auto-hide. Re-appears if a
 * new (different) message is supplied after being dismissed.
 */
export function NoticeBanner({ notice, strings }: NoticeBannerProps): JSX.Element | null {
  const [dismissed, setDismissed] = useState(false);

  // Reset visibility when the message changes.
  useEffect(() => setDismissed(false), [notice.message]);

  if (dismissed) return null;
  const dismissible = notice.dismissible ?? true;

  return (
    <div className="lpx-notice" role="status">
      <div className="lpx-notice-card">
        <span className="lpx-notice-text">{notice.message}</span>
        {notice.ctaLabel && (
          <button className="lpx-notice-cta" type="button" onClick={() => notice.onCta?.()}>
            {notice.ctaLabel}
          </button>
        )}
        {dismissible && (
          <button
            className="lpx-btn lpx-notice-close"
            aria-label={strings.dismiss}
            onClick={() => setDismissed(true)}
          >
            <CloseIcon />
          </button>
        )}
      </div>
    </div>
  );
}
