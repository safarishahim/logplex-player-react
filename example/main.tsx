import { StrictMode, useMemo, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { LogplexPlayer, type Episode, type LogplexPlayerProps } from '../src';
import './docs.css';

const STREAM = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const POSTER = 'https://picsum.photos/seed/logplex-hero/1280/720';

const EPISODES: Episode[] = [
  { id: 'e1', src: STREAM, poster: 'https://picsum.photos/seed/lp1/1280/720', title: 'سریال نمونه', subtitle: 'قسمت اول' },
  { id: 'e2', src: STREAM, poster: 'https://picsum.photos/seed/lp2/1280/720', title: 'سریال نمونه', subtitle: 'قسمت دوم' },
  { id: 'e3', src: STREAM, poster: 'https://picsum.photos/seed/lp3/1280/720', title: 'سریال نمونه', subtitle: 'قسمت سوم' },
];

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="dx-code">
      <pre>{children.trim()}</pre>
    </div>
  );
}

function Section({ id, title, children }: { id: string; title: string; children: ReactNode }) {
  return (
    <section className="dx-section" id={id}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}

// ── Interactive playground ───────────────────────────────────────────────
function Playground() {
  const [locale, setLocale] = useState<'fa' | 'en'>('fa');
  const [accent, setAccent] = useState('#e8b84b');
  const [badge, setBadge] = useState(true);
  const [notice, setNotice] = useState(true);
  const [ad, setAd] = useState(false);
  const [episodes, setEpisodes] = useState(true);
  const [current, setCurrent] = useState('e1');

  const props: LogplexPlayerProps = {
    src: STREAM,
    poster: POSTER,
    title: locale === 'fa' ? 'عنوان فیلم' : 'Sample Movie',
    episodeLabel: locale === 'fa' ? 'قسمت سوم' : 'Episode 3',
    locale,
    theme: { accent },
    onLike: () => undefined,
    ...(episodes ? { episodes: EPISODES, currentEpisodeId: current, onEpisodeChange: setCurrent } : {}),
    ...(badge
      ? { badge: locale === 'fa' ? 'ترافیک شما به صورت تمام‌بها حساب می‌شود.' : 'Your traffic is billed at premium rate.' }
      : {}),
    ...(notice
      ? {
          notice: {
            message:
              locale === 'fa'
                ? 'این فیلم فقط با اینترنت اپراتور همراه اول رایگان است.'
                : 'Free only on the sponsor network.',
            ctaLabel: locale === 'fa' ? 'فعال‌سازی' : 'Activate',
          },
        }
      : {}),
    ...(ad ? { ad: { src: STREAM, skipAfterSec: 5 } } : {}),
  };

  const code = useMemo(() => {
    const lines = [
      `<LogplexPlayer`,
      `  src="${STREAM}"`,
      `  poster="${POSTER}"`,
      `  locale="${locale}"`,
      `  theme={{ accent: '${accent}' }}`,
      episodes ? `  episodes={episodes}\n  currentEpisodeId={current}\n  onEpisodeChange={setCurrent}` : '',
      badge ? `  badge="${props.badge}"` : '',
      notice ? `  notice={{ message: '…', ctaLabel: '…' }}` : '',
      ad ? `  ad={{ src: adUrl, skipAfterSec: 5 }}` : '',
      `  onLike={(liked) => track(liked)}`,
      `  analytics={{ baseUrl, apiKey, userId, contentId }}`,
      `/>`,
    ];
    return lines.filter(Boolean).join('\n');
  }, [locale, accent, episodes, badge, notice, ad, props.badge]);

  return (
    <>
      <div className="dx-controls">
        <label>
          Locale
          <select value={locale} onChange={(e) => setLocale(e.target.value as 'fa' | 'en')}>
            <option value="fa">fa (RTL)</option>
            <option value="en">en (LTR)</option>
          </select>
        </label>
        <label>
          Accent
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={episodes} onChange={(e) => setEpisodes(e.target.checked)} /> Playlist
        </label>
        <label>
          <input type="checkbox" checked={badge} onChange={(e) => setBadge(e.target.checked)} /> Badge
        </label>
        <label>
          <input type="checkbox" checked={notice} onChange={(e) => setNotice(e.target.checked)} /> Notice
        </label>
        <label>
          <input type="checkbox" checked={ad} onChange={(e) => setAd(e.target.checked)} /> Pre-roll ad
        </label>
      </div>
      <div className="dx-grid" style={{ marginTop: 16 }}>
        <div className="dx-player">
          {/* key forces a clean remount when the ad toggles. */}
          <LogplexPlayer key={`${ad}`} {...props} />
        </div>
        <CodeBlock>{code}</CodeBlock>
      </div>
    </>
  );
}

const FEATURES = [
  ['HLS + MP4', 'Adaptive HLS via hls.js (auto quality from the manifest) or progressive MP4.'],
  ['Custom skin', 'Dark, gold-accented, RTL/LTR, fully responsive via container queries.'],
  ['Built-in analytics', 'Emits play/pause/seek/buffer/heartbeat/complete to the Logplex ingest API.'],
  ['Resume', '“Continue watching” banner from the saved position.'],
  ['Quality & speed', 'Quality menu from the real HLS renditions; separate speed menu.'],
  ['Playlist', 'Episode list panel + prev/next, disabled at the ends.'],
  ['Pre-roll ads', 'Ad playback with a skip-after countdown and click-through.'],
  ['Gestures', 'Mobile: double-tap ±10s, long-press 2×, brightness/volume swipe.'],
  ['WebView fullscreen', 'Native when available, else a CSS simulated fullscreen.'],
  ['Like + badge + notice', 'Like button, premium info badge, operator notice banner.'],
];

function Docs() {
  return (
    <>
      <header className="dx-header">
        <span className="dx-logo">
          <b>@logplex</b>/player-react
        </span>
        <nav>
          <a href="#start">Quick start</a>
          <a href="#playground">Playground</a>
          <a href="#features">Features</a>
          <a href="#props">Props</a>
          <a href="#events">Events</a>
        </nav>
      </header>

      <main className="dx-main">
        <div className="dx-hero">
          <h1>Logplex Player</h1>
          <p>
            A production React video player — HLS/MP4, a fully custom RTL/LTR skin, and built-in
            Logplex analytics + resume. External links in; analytics out.
          </p>
          <div className="dx-badges">
            <span className="dx-pill">React 18+</span>
            <span className="dx-pill">Vidstack + hls.js</span>
            <span className="dx-pill">TypeScript</span>
            <span className="dx-pill">RTL / LTR</span>
          </div>
          <div className="dx-install">npm i @logplex/player-react</div>
          <div className="dx-player" style={{ maxWidth: 860, margin: '32px auto 0' }}>
            <LogplexPlayer
              episodes={EPISODES}
              currentEpisodeId="e1"
              onEpisodeChange={() => undefined}
              locale="fa"
              poster={POSTER}
              badge="ترافیک شما به صورت تمام‌بها حساب می‌شود."
              onLike={() => undefined}
            />
          </div>
        </div>

        <Section id="start" title="Quick start">
          <p>Import the component and its stylesheet, then point it at an HLS or MP4 source.</p>
          <CodeBlock>{`
import { LogplexPlayer } from '@logplex/player-react';
import '@logplex/player-react/styles.css';

export default function Watch() {
  return (
    <LogplexPlayer
      src="https://cdn.example.com/movie/master.m3u8"
      title="عنوان فیلم"
      episodeLabel="قسمت سوم"
      poster="https://cdn.example.com/poster.jpg"
      locale="fa"
      analytics={{
        baseUrl: 'https://ingest.your-logplex.com',
        apiKey: 'mk_live_xxx',
        userId: 'viewer-42',
        contentId: 'movie-123',
        contentType: 'movie',
      }}
    />
  );
}`}</CodeBlock>
        </Section>

        <Section id="playground" title="Playground">
          <p>Toggle features live and watch the props update. The player on the left is real.</p>
          <Playground />
        </Section>

        <Section id="features" title="Features">
          <div className="dx-features">
            {FEATURES.map(([t, d]) => (
              <div className="dx-feature" key={t}>
                <h3>{t}</h3>
                <p>{d}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="analytics" title="Analytics & resume">
          <p>
            Pass an <code>analytics</code> config and the player emits the canonical Logplex events
            (batched, retried, flushed on page-hide) and offers a resume banner from the saved
            position. No extra wiring.
          </p>
          <CodeBlock>{`
<LogplexPlayer
  src={src}
  analytics={{
    baseUrl: 'https://ingest.your-logplex.com',
    apiKey: 'mk_live_xxx',     // your merchant key
    userId: 'viewer-42',       // stable per-viewer id
    contentId: 'movie-123',
    contentType: 'movie',
    contentDurationMs: 6_752_000,
    userType: 'authenticated',
  }}
  resume                       // show the "continue watching" banner (default on)
/>`}</CodeBlock>
        </Section>

        <Section id="playlist" title="Episodes / playlist">
          <p>Provide a list of episodes; the playlist panel and prev/next nav appear automatically.</p>
          <CodeBlock>{`
const episodes = [
  { id: 'e1', src: '.../e1.m3u8', title: 'سریال', subtitle: 'قسمت اول' },
  { id: 'e2', src: '.../e2.m3u8', title: 'سریال', subtitle: 'قسمت دوم' },
];

<LogplexPlayer
  episodes={episodes}
  currentEpisodeId={current}
  onEpisodeChange={setCurrent}
/>`}</CodeBlock>
        </Section>

        <Section id="ads" title="Pre-roll ads">
          <p>Resolve the creative yourself (e.g. from VAST) and pass its URL; the player handles ad playback, the skip-after countdown, click-through, and ad analytics, then plays the content.</p>
          <CodeBlock>{`
<LogplexPlayer
  src={contentUrl}
  ad={{ src: adUrl, skipAfterSec: 5, clickThrough: 'https://advertiser.example' }}
/>`}</CodeBlock>
        </Section>

        <Section id="theming" title="Theming & localization">
          <p>
            Theme via the <code>theme</code> prop (CSS custom properties) and switch language with{' '}
            <code>locale</code>. RTL only right-aligns text — controls, seek direction and gestures
            stay physical.
          </p>
          <CodeBlock>{`
<LogplexPlayer
  theme={{ accent: '#e8b84b', surface: '#1c1c1e', radius: '14px' }}
  locale="fa"   // 'fa' (rtl) | 'en' (ltr)
/>`}</CodeBlock>
        </Section>

        <Section id="props" title="Props">
          <table className="dx-table">
            <thead>
              <tr>
                <th>Prop</th>
                <th>Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ['src', 'string', 'HLS (.m3u8) or MP4 source. Ignored if episodes resolve one.'],
                  ['poster', 'string', 'Poster image shown on the cover (before play).'],
                  ['title / episodeLabel', 'string', 'Shown above the scrubber, right-aligned.'],
                  ['thumbnails', 'string', 'WebVTT thumbnails track for scrub previews.'],
                  ['locale', "'fa' | 'en'", 'UI language (fa → RTL). Default fa.'],
                  ['theme', 'ThemeOverrides', 'accent / surface / text / radius … CSS variables.'],
                  ['episodes', 'Episode[]', 'Playlist; enables the panel + prev/next.'],
                  ['currentEpisodeId / onEpisodeChange', 'string / fn', 'Controlled episode selection.'],
                  ['analytics', 'LogplexAnalyticsConfig', 'Enables built-in analytics + resume.'],
                  ['resume', 'boolean', 'Show the continue-watching banner. Default true.'],
                  ['ad', 'AdConfig', 'Optional pre-roll ad ({ src, skipAfterSec, clickThrough }).'],
                  ['notice', 'PlayerNotice', 'Operator/network notice ({ message, ctaLabel, onCta }).'],
                  ['badge', 'string', 'Transient info pill shown at the start.'],
                  ['onLike', '(liked) => void', 'Show a Like button; emits a like event.'],
                  ['fullscreenMode', "'auto'|'native'|'simulated'", 'Fullscreen strategy (WebView-safe).'],
                  ['fullscreenOnPlay', 'boolean', 'Enter fullscreen when playback starts from the cover.'],
                  ['onBack', '() => void', 'Show a back button in the top bar.'],
                ] as const
              ).map(([p, t, d]) => (
                <tr key={p}>
                  <td>
                    <code>{p}</code>
                  </td>
                  <td>
                    <code>{t}</code>
                  </td>
                  <td>{d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section id="events" title="Analytics events">
          <p>
            With <code>analytics</code> set, the player emits these <code>event_type</code> values to{' '}
            <code>/v1/ingest/*</code> (mirroring the Logplex SDK contract):
          </p>
          <div className="dx-features">
            {[
              'play',
              'pause',
              'resume',
              'seek',
              'buffer_start',
              'buffer_end',
              'quality_change',
              'heartbeat',
              'complete',
              'exit',
              'error',
              'play_start_success',
              'ad_request',
              'ad_start',
              'ad_complete',
              'like',
            ].map((e) => (
              <span className="dx-pill" key={e} style={{ fontFamily: 'monospace' }}>
                {e}
              </span>
            ))}
          </div>
        </Section>

        <footer className="dx-footer">
          @logplex/player-react · built on Vidstack + hls.js · run <code>npm run dev</code> for this page
        </footer>
      </main>
    </>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Docs />
  </StrictMode>,
);
