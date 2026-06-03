import type { Episode } from '../../types';
import type { Strings } from '../../i18n';
import { CloseIcon } from '../controls/icons';

export interface PlaylistPanelProps {
  episodes: Episode[];
  currentId?: string;
  onSelect: (id: string) => void;
  onClose: () => void;
  strings: Strings;
}

/** Slide-in episode list with poster thumbnails; highlights the current item. */
export function PlaylistPanel({ episodes, currentId, onSelect, onClose, strings }: PlaylistPanelProps): JSX.Element {
  return (
    <div className="lpx-panel" role="dialog" aria-label={strings.playlist}>
      <div className="lpx-panel-head">
        <span>{strings.playlist}</span>
        <button className="lpx-btn" aria-label={strings.dismiss} onClick={onClose}>
          <CloseIcon />
        </button>
      </div>
      <ul className="lpx-panel-list">
        {episodes.map((e) => (
          <li key={e.id}>
            <button
              className="lpx-ep"
              data-active={e.id === currentId ? 'true' : 'false'}
              onClick={() => {
                onSelect(e.id);
                onClose();
              }}
            >
              {e.poster && <img className="lpx-ep-thumb" src={e.poster} alt="" loading="lazy" />}
              <span className="lpx-ep-meta">
                <b>{e.subtitle ?? e.title ?? e.id}</b>
                {e.subtitle && e.title && <i>{e.title}</i>}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
