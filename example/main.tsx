import { StrictMode, useMemo, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { LogplexPlayer, type Episode, type LogplexPlayerProps } from '../src';
import './docs.css';

const STREAM = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
const POSTER = 'https://picsum.photos/seed/logplex-hero/1280/720';

type Lang = 'en' | 'fa';

const EPISODES: Episode[] = [
  { id: 'e1', src: STREAM, poster: 'https://picsum.photos/seed/lp1/1280/720', title: 'Sample Series', subtitle: 'Episode 1' },
  { id: 'e2', src: STREAM, poster: 'https://picsum.photos/seed/lp2/1280/720', title: 'Sample Series', subtitle: 'Episode 2' },
  { id: 'e3', src: STREAM, poster: 'https://picsum.photos/seed/lp3/1280/720', title: 'Sample Series', subtitle: 'Episode 3' },
];

// ── Translations ──────────────────────────────────────────────────────────
const T: Record<Lang, {
  nav: { start: string; playground: string; features: string; props: string; events: string };
  heroTagline: string;
  pills: string[];
  s: Record<string, { title: string; intro?: string }>;
  pg: Record<string, string>;
  features: [string, string][];
  propsHead: { prop: string; type: string; desc: string };
  propsRows: [string, string, string][];
  eventsIntro: string;
  footer: string;
}> = {
  en: {
    nav: { start: 'Quick start', playground: 'Playground', features: 'Features', props: 'Props', events: 'Events' },
    heroTagline:
      'A production React video player — HLS/MP4, a fully custom RTL/LTR skin, and built-in Logplex analytics + resume. External links in; analytics out.',
    pills: ['React 18+', 'Vidstack + hls.js', 'TypeScript', 'RTL / LTR'],
    s: {
      start: { title: 'Quick start', intro: 'Import the component and its stylesheet, then point it at an HLS or MP4 source.' },
      playground: { title: 'Playground', intro: 'Toggle features live and watch the props update. The player on the left is real.' },
      features: { title: 'Features' },
      analytics: {
        title: 'Analytics & resume',
        intro:
          'Pass an analytics config and the player emits the canonical Logplex events (batched, retried, flushed on page-hide) and offers a resume banner from the saved position. No extra wiring.',
      },
      playlist: {
        title: 'Episodes / playlist',
        intro: 'Provide a list of episodes; the playlist panel and prev/next nav appear automatically.',
      },
      ads: {
        title: 'Pre-roll ads',
        intro:
          'Resolve the creative yourself (e.g. from VAST) and pass its URL; the player handles ad playback, the skip-after countdown, click-through and ad analytics, then plays the content.',
      },
      theming: {
        title: 'Theming & localization',
        intro:
          'Theme via the theme prop (CSS custom properties) and switch language with locale. RTL only right-aligns text — controls, seek direction and gestures stay physical.',
      },
      props: { title: 'Props' },
      events: {
        title: 'Analytics events',
        intro: 'With analytics set, the player emits these event_type values to /v1/ingest/* (mirroring the Logplex SDK contract):',
      },
    },
    pg: { language: 'Language', accent: 'Accent', playlist: 'Playlist', badge: 'Badge', notice: 'Notice', ad: 'Pre-roll ad' },
    features: [
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
    ],
    propsHead: { prop: 'Prop', type: 'Type', desc: 'Description' },
    propsRows: [
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
    ],
    eventsIntro: 'With analytics set, the player emits these event_type values to /v1/ingest/* (mirroring the Logplex SDK contract):',
    footer: '@logplex/player-react · built on Vidstack + hls.js · run npm run dev for this page',
  },
  fa: {
    nav: { start: 'شروع سریع', playground: 'محیط آزمایش', features: 'امکانات', props: 'پراپ‌ها', events: 'رویدادها' },
    heroTagline:
      'یک پخش‌کنندهٔ ویدئوی React آمادهٔ تولید — HLS/MP4، پوستهٔ کاملاً اختصاصی راست‌به‌چپ/چپ‌به‌راست و آنالیتیکس و ادامهٔ تماشای داخلی Logplex. لینک‌ها به داخل، آنالیتیکس به بیرون.',
    pills: ['React ۱۸+', 'Vidstack + hls.js', 'TypeScript', 'RTL / LTR'],
    s: {
      start: { title: 'شروع سریع', intro: 'کامپوننت و فایل استایل آن را وارد کنید، سپس آن را به یک منبع HLS یا MP4 وصل کنید.' },
      playground: { title: 'محیط آزمایش', intro: 'امکانات را به‌صورت زنده تغییر دهید و به‌روزرسانی props را ببینید. پخش‌کنندهٔ کنار، واقعی است.' },
      features: { title: 'امکانات' },
      analytics: {
        title: 'آنالیتیکس و ادامهٔ تماشا',
        intro:
          'یک تنظیمات analytics بدهید تا پخش‌کننده رویدادهای استاندارد Logplex را ارسال کند (دسته‌ای، با تلاش مجدد و تخلیه هنگام پنهان‌شدن صفحه) و بنر ادامهٔ تماشا از موقعیت ذخیره‌شده را نشان دهد. بدون سیم‌کشی اضافه.',
      },
      playlist: {
        title: 'قسمت‌ها / لیست پخش',
        intro: 'یک لیست از قسمت‌ها بدهید؛ پنل لیست پخش و دکمه‌های قبلی/بعدی به‌طور خودکار ظاهر می‌شوند.',
      },
      ads: {
        title: 'تبلیغ پیش از پخش',
        intro:
          'خودتان تبلیغ را تعیین کنید (مثلاً از VAST) و نشانی آن را بدهید؛ پخش‌کننده پخش تبلیغ، شمارش معکوس رد شدن، کلیک به مقصد و آنالیتیکس تبلیغ را مدیریت می‌کند و سپس محتوا را پخش می‌کند.',
      },
      theming: {
        title: 'ظاهر و بومی‌سازی',
        intro:
          'با پراپ theme (متغیرهای CSS) ظاهر را تنظیم کنید و با locale زبان را عوض کنید. حالت RTL فقط متن را راست‌چین می‌کند — کنترل‌ها، جهت جابه‌جایی و حرکات لمسی فیزیکی می‌مانند.',
      },
      props: { title: 'پراپ‌ها' },
      events: {
        title: 'رویدادهای آنالیتیکس',
        intro: 'با تنظیم analytics، پخش‌کننده این مقادیر event_type را به /v1/ingest/* ارسال می‌کند (مطابق قرارداد SDK لاگ‌پلکس):',
      },
    },
    pg: { language: 'زبان', accent: 'رنگ تأکید', playlist: 'لیست پخش', badge: 'نشان', notice: 'اعلان', ad: 'تبلیغ پیش از پخش' },
    features: [
      ['HLS + MP4', 'پخش تطبیقی HLS با hls.js (کیفیت خودکار از منیفست) یا MP4 تدریجی.'],
      ['پوستهٔ اختصاصی', 'تیره، با تأکید طلایی، RTL/LTR و کاملاً واکنش‌گرا با container query.'],
      ['آنالیتیکس داخلی', 'ارسال رویدادهای play/pause/seek/buffer/heartbeat/complete به API ورودی Logplex.'],
      ['ادامهٔ تماشا', 'بنر «ادامهٔ تماشا» از موقعیت ذخیره‌شده.'],
      ['کیفیت و سرعت', 'منوی کیفیت از رندیشن‌های واقعی HLS؛ منوی سرعت جداگانه.'],
      ['لیست پخش', 'پنل لیست قسمت‌ها به‌همراه قبلی/بعدی که در ابتدا و انتها غیرفعال می‌شوند.'],
      ['تبلیغ پیش از پخش', 'پخش تبلیغ با شمارش معکوس رد شدن و کلیک به مقصد.'],
      ['حرکات لمسی', 'موبایل: دوبار-ضربه ±۱۰ ثانیه، فشار طولانی ۲×، کشیدن برای روشنایی/صدا.'],
      ['تمام‌صفحهٔ WebView', 'بومی در صورت پشتیبانی، در غیر این صورت تمام‌صفحهٔ شبیه‌سازی‌شده با CSS.'],
      ['لایک + نشان + اعلان', 'دکمهٔ لایک، نشان اطلاعات ویژه و بنر اعلان اپراتور.'],
    ],
    propsHead: { prop: 'پراپ', type: 'نوع', desc: 'توضیح' },
    propsRows: [
      ['src', 'string', 'منبع HLS (‎.m3u8‎) یا MP4. اگر لیست پخش منبعی تعیین کند، نادیده گرفته می‌شود.'],
      ['poster', 'string', 'تصویر پوستر که روی کاور (پیش از پخش) نمایش داده می‌شود.'],
      ['title / episodeLabel', 'string', 'بالای نوار پیشروی و راست‌چین نمایش داده می‌شود.'],
      ['thumbnails', 'string', 'ترک تصاویر بندانگشتی WebVTT برای پیش‌نمایش هنگام جابه‌جایی.'],
      ['locale', "'fa' | 'en'", 'زبان رابط کاربری (fa ← راست‌به‌چپ). پیش‌فرض fa.'],
      ['theme', 'ThemeOverrides', 'متغیرهای CSS مانند accent / surface / text / radius.'],
      ['episodes', 'Episode[]', 'لیست پخش؛ پنل و دکمه‌های قبلی/بعدی را فعال می‌کند.'],
      ['currentEpisodeId / onEpisodeChange', 'string / fn', 'انتخاب کنترل‌شدهٔ قسمت.'],
      ['analytics', 'LogplexAnalyticsConfig', 'آنالیتیکس داخلی و ادامهٔ تماشا را فعال می‌کند.'],
      ['resume', 'boolean', 'نمایش بنر ادامهٔ تماشا. پیش‌فرض true.'],
      ['ad', 'AdConfig', 'تبلیغ پیش از پخش (اختیاری): { src, skipAfterSec, clickThrough }.'],
      ['notice', 'PlayerNotice', 'اعلان اپراتور/شبکه: { message, ctaLabel, onCta }.'],
      ['badge', 'string', 'نشان اطلاع‌رسانی گذرا که در ابتدا نمایش داده می‌شود.'],
      ['onLike', '(liked) => void', 'نمایش دکمهٔ لایک؛ رویداد like ارسال می‌کند.'],
      ['fullscreenMode', "'auto'|'native'|'simulated'", 'راهبرد تمام‌صفحه (سازگار با WebView).'],
      ['fullscreenOnPlay', 'boolean', 'ورود به تمام‌صفحه هنگام شروع پخش از کاور.'],
      ['onBack', '() => void', 'نمایش دکمهٔ بازگشت در نوار بالا.'],
    ],
    eventsIntro: 'با تنظیم analytics، پخش‌کننده این مقادیر event_type را به /v1/ingest/* ارسال می‌کند (مطابق قرارداد SDK لاگ‌پلکس):',
    footer: '@logplex/player-react · ساخته‌شده با Vidstack و hls.js · برای این صفحه npm run dev را اجرا کنید',
  },
};

function CodeBlock({ children }: { children: string }) {
  return (
    <div className="dx-code">
      <pre>{children.trim()}</pre>
    </div>
  );
}

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: ReactNode }) {
  return (
    <section className="dx-section" id={id}>
      <h2>{title}</h2>
      {intro ? <p>{intro}</p> : null}
      {children}
    </section>
  );
}

// ── Interactive playground ───────────────────────────────────────────────
function Playground({ lang }: { lang: Lang }) {
  const [locale, setLocale] = useState<Lang>('en');
  const [accent, setAccent] = useState('#e8b84b');
  const [badge, setBadge] = useState(true);
  const [notice, setNotice] = useState(true);
  const [ad, setAd] = useState(false);
  const [episodes, setEpisodes] = useState(true);
  const [current, setCurrent] = useState('e1');
  const pg = T[lang].pg;

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
            message: locale === 'fa' ? 'این فیلم فقط با اینترنت اپراتور همراه اول رایگان است.' : 'Free only on the sponsor network.',
            ctaLabel: locale === 'fa' ? 'فعال‌سازی' : 'Activate',
          },
        }
      : {}),
    ...(ad ? { ad: { src: STREAM, skipAfterSec: 5 } } : {}),
  };

  const code = useMemo(() => {
    return [
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
    ]
      .filter(Boolean)
      .join('\n');
  }, [locale, accent, episodes, badge, notice, ad, props.badge]);

  return (
    <>
      <div className="dx-controls">
        <label>
          {pg.language}
          <select value={locale} onChange={(e) => setLocale(e.target.value as Lang)}>
            <option value="en">English (LTR)</option>
            <option value="fa">فارسی (RTL)</option>
          </select>
        </label>
        <label>
          {pg.accent}
          <input type="color" value={accent} onChange={(e) => setAccent(e.target.value)} />
        </label>
        <label>
          <input type="checkbox" checked={episodes} onChange={(e) => setEpisodes(e.target.checked)} /> {pg.playlist}
        </label>
        <label>
          <input type="checkbox" checked={badge} onChange={(e) => setBadge(e.target.checked)} /> {pg.badge}
        </label>
        <label>
          <input type="checkbox" checked={notice} onChange={(e) => setNotice(e.target.checked)} /> {pg.notice}
        </label>
        <label>
          <input type="checkbox" checked={ad} onChange={(e) => setAd(e.target.checked)} /> {pg.ad}
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

const EVENT_TYPES = [
  'play', 'pause', 'resume', 'seek', 'buffer_start', 'buffer_end', 'quality_change',
  'heartbeat', 'complete', 'exit', 'error', 'play_start_success', 'ad_request', 'ad_start', 'ad_complete', 'like',
];

function Docs() {
  const [lang, setLang] = useState<Lang>('en');
  const t = T[lang];
  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  return (
    <div className="dx-app" dir={dir} lang={lang}>
      <header className="dx-header">
        <span className="dx-logo">
          <b>@logplex</b>/player-react
        </span>
        <nav>
          <a href="#start">{t.nav.start}</a>
          <a href="#playground">{t.nav.playground}</a>
          <a href="#features">{t.nav.features}</a>
          <a href="#props">{t.nav.props}</a>
          <a href="#events">{t.nav.events}</a>
        </nav>
        <div className="dx-langtoggle" role="group" aria-label="Docs language">
          <button aria-pressed={lang === 'en'} onClick={() => setLang('en')}>
            EN
          </button>
          <button aria-pressed={lang === 'fa'} onClick={() => setLang('fa')}>
            فا
          </button>
        </div>
      </header>

      <main className="dx-main">
        <div className="dx-hero">
          <h1>Logplex Player</h1>
          <p>{t.heroTagline}</p>
          <div className="dx-badges">
            {t.pills.map((p) => (
              <span className="dx-pill" key={p}>
                {p}
              </span>
            ))}
          </div>
          <div className="dx-install">npm i @logplex/player-react</div>
          <div className="dx-player" style={{ maxWidth: 860, margin: '32px auto 0' }}>
            <LogplexPlayer
              episodes={EPISODES}
              currentEpisodeId="e1"
              onEpisodeChange={() => undefined}
              locale="en"
              title="Sample Movie"
              episodeLabel="Episode 1"
              poster={POSTER}
              badge="Your traffic is billed at premium rate."
              onLike={() => undefined}
            />
          </div>
        </div>

        <Section id="start" title={t.s.start.title} intro={t.s.start.intro}>
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

        <Section id="playground" title={t.s.playground.title} intro={t.s.playground.intro}>
          <Playground lang={lang} />
        </Section>

        <Section id="features" title={t.s.features.title}>
          <div className="dx-features">
            {t.features.map(([title, desc]) => (
              <div className="dx-feature" key={title}>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </Section>

        <Section id="analytics" title={t.s.analytics.title} intro={t.s.analytics.intro}>
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

        <Section id="playlist" title={t.s.playlist.title} intro={t.s.playlist.intro}>
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

        <Section id="ads" title={t.s.ads.title} intro={t.s.ads.intro}>
          <CodeBlock>{`
<LogplexPlayer
  src={contentUrl}
  ad={{ src: adUrl, skipAfterSec: 5, clickThrough: 'https://advertiser.example' }}
/>`}</CodeBlock>
        </Section>

        <Section id="theming" title={t.s.theming.title} intro={t.s.theming.intro}>
          <CodeBlock>{`
<LogplexPlayer
  theme={{ accent: '#e8b84b', surface: '#1c1c1e', radius: '14px' }}
  locale="fa"   // 'fa' (rtl) | 'en' (ltr)
/>`}</CodeBlock>
        </Section>

        <Section id="props" title={t.s.props.title}>
          <table className="dx-table">
            <thead>
              <tr>
                <th>{t.propsHead.prop}</th>
                <th>{t.propsHead.type}</th>
                <th>{t.propsHead.desc}</th>
              </tr>
            </thead>
            <tbody>
              {t.propsRows.map(([p, type, desc]) => (
                <tr key={p}>
                  <td>
                    <code>{p}</code>
                  </td>
                  <td>
                    <code>{type}</code>
                  </td>
                  <td>{desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Section>

        <Section id="events" title={t.s.events.title} intro={t.eventsIntro}>
          <div className="dx-features">
            {EVENT_TYPES.map((e) => (
              <span className="dx-pill" key={e} style={{ fontFamily: 'monospace' }}>
                {e}
              </span>
            ))}
          </div>
        </Section>

        <footer className="dx-footer">{t.footer}</footer>
      </main>
    </div>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Docs />
  </StrictMode>,
);
