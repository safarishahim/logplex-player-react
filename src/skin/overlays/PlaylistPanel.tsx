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

/** Slide-in episode list with poster thumbnails; highlights the current item.
 * When episodes carry a `group` (e.g. a season title), they're rendered under
 * section headers in first-seen order. */
export function PlaylistPanel({ episodes, currentId, onSelect, onClose, strings }: PlaylistPanelProps): JSX.Element {
  const grouped = episodes.some((e) => e.group);

  // Preserve first-seen group order.
  const groups: { label: string | null; items: Episode[] }[] = [];
  if (grouped) {
    const index = new Map<string, number>();
    episodes.forEach((e) => {
      const key = e.group ?? '';
      if (!index.has(key)) {
        index.set(key, groups.length);
        groups.push({ label: e.group ?? null, items: [] });
      }
      groups[index.get(key)!].items.push(e);
    });
  } else {
    groups.push({ label: null, items: episodes });
  }

  const renderItem = (e: Episode): JSX.Element => (
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
  );

  return (
    <>
      <div className="lpx-panel-scrim" aria-hidden="true" onClick={onClose} />
      <div className="lpx-panel" role="dialog" aria-label={strings.playlist}>
        <div className="lpx-panel-head">
          <span>{strings.playlist}</span>
          <button className="lpx-btn" aria-label={strings.dismiss} onClick={onClose}>
            <CloseIcon />
          </button>
        </div>
        {grouped ? (
          <div className="lpx-panel-groups">
            {groups.map((g, i) => (
              <section className="lpx-panel-group" key={g.label ?? i}>
                {g.label && (
                  <h4 className="lpx-panel-group-title">
                    <span className="lpx-panel-group-label">{g.label}</span>
                    <span className="lpx-panel-group-count">{g.items.length}</span>
                  </h4>
                )}
                <ul className="lpx-panel-list">{g.items.map(renderItem)}</ul>
              </section>
            ))}
          </div>
        ) : (
          <ul className="lpx-panel-list">{episodes.map(renderItem)}</ul>
        )}
      </div>
    </>
  );
}
