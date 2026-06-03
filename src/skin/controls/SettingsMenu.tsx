import { Menu, useMediaRemote, useMediaState } from '@vidstack/react';
import type { Strings } from '../../i18n';
import { SettingsIcon } from './icons';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2];

/**
 * Settings popover: quality (AUTO + each rendition) and playback speed,
 * wired to Vidstack's quality list + playback rate. The button doubles as
 * the design's "AUTO / 480" quality label.
 */
export function SettingsMenu({ strings }: { strings: Strings }): JSX.Element {
  const remote = useMediaRemote();
  const qualities = useMediaState('qualities');
  const quality = useMediaState('quality');
  const autoQuality = useMediaState('autoQuality');
  const playbackRate = useMediaState('playbackRate');

  const list = Array.from(qualities ?? []);
  const selectedIndex = quality ? list.indexOf(quality) : -1;
  const qualityValue = autoQuality || selectedIndex < 0 ? 'auto' : String(selectedIndex);
  const label = autoQuality || !quality ? strings.qualityAuto : `${quality.height}p`;

  return (
    <Menu.Root className="lpx-menu-root">
      <Menu.Button className="lpx-btn lpx-quality-btn" aria-label={strings.settings}>
        <span className="lpx-quality-label">{label}</span>
        <SettingsIcon />
      </Menu.Button>
      <Menu.Content className="lpx-menu" placement="bottom end">
        {list.length > 0 && (
          <section className="lpx-menu-section">
            <div className="lpx-menu-title">{strings.quality}</div>
            <Menu.RadioGroup
              className="lpx-radio-group"
              value={qualityValue}
              onChange={(value) => {
                if (value === 'auto') remote.requestAutoQuality();
                else remote.changeQuality(Number(value));
              }}
            >
              <Menu.Radio className="lpx-radio" value="auto">
                {strings.qualityAuto}
              </Menu.Radio>
              {list.map((q, i) => (
                <Menu.Radio className="lpx-radio" value={String(i)} key={`${q.height}-${i}`}>
                  {q.height}p
                </Menu.Radio>
              ))}
            </Menu.RadioGroup>
          </section>
        )}

        <section className="lpx-menu-section">
          <div className="lpx-menu-title">{strings.speed}</div>
          <Menu.RadioGroup
            className="lpx-radio-group"
            value={String(playbackRate)}
            onChange={(value) => remote.changePlaybackRate(Number(value))}
          >
            {SPEEDS.map((s) => (
              <Menu.Radio className="lpx-radio" value={String(s)} key={s}>
                {s === 1 ? '1×' : `${s}×`}
              </Menu.Radio>
            ))}
          </Menu.RadioGroup>
        </section>
      </Menu.Content>
    </Menu.Root>
  );
}
