import { StrictMode, useEffect, useMemo, useState, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { LogplexPlayer, type Episode, type LogplexPlayerProps } from '../src';
import './docs.css';

// "Sprite Fight" — a free animated short. All assets (HLS, poster, thumbnails,
// subtitles) come from one CDN and match the video, so quality, scrub previews
// and subtitles all work. The HLS exposes 5 renditions (240p–1080p).
const STREAM = 'https://files.vidstack.io/sprite-fight/hls/stream.m3u8';
const POSTER = 'https://files.vidstack.io/sprite-fight/poster.webp';
const THUMBNAILS = 'https://files.vidstack.io/sprite-fight/thumbnails.vtt';

// Ad creative (a different stream so the ad is visibly distinct from the content).
const AD_SRC = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';

// Real subtitle tracks that match the video (first cue at ~0:17 when dialogue starts).
const SUBTITLES = [
  { src: 'https://files.vidstack.io/sprite-fight/subs/english.vtt', label: 'English', language: 'en' },
  { src: 'https://files.vidstack.io/sprite-fight/subs/spanish.vtt', label: 'Español', language: 'es' },
];

type Lang = 'en' | 'fa';

const EPISODES: Episode[] = [
  // Different streams per episode so switching is actually visible in the demo.
  { id: 'e1', src: STREAM, poster: 'https://picsum.photos/seed/lp1/1280/720', title: 'Sample Series', subtitle: 'Episode 1' },
  { id: 'e2', src: 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8', poster: 'https://picsum.photos/seed/lp2/1280/720', title: 'Sample Series', subtitle: 'Episode 2' },
  { id: 'e3', src: 'https://demo.unified-streaming.com/k8s/features/stable/video/tears-of-steel/tears-of-steel.ism/.m3u8', poster: 'https://picsum.photos/seed/lp3/1280/720', title: 'Sample Series', subtitle: 'Episode 3' },
];

const FA_SUBTITLES = ['قسمت اول', 'قسمت دوم', 'قسمت سوم'];

/** Localized copy of the demo episodes so the playlist matches the chosen language. */
function episodesFor(lang: Lang): Episode[] {
  if (lang === 'en') return EPISODES;
  return EPISODES.map((e, i) => ({ ...e, title: 'سریال نمونه', subtitle: FA_SUBTITLES[i] }));
}

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
      standalone: {
        title: 'Use without Logplex',
        intro:
          'Analytics is optional. Omit the analytics prop and the player is a self-contained video player — full skin, quality, speed, playlist, ads, gestures and fullscreen — with no network calls and nothing Logplex-specific.',
      },
      playground: { title: 'Playground', intro: 'Toggle features live and watch the props update. The player on the left is real.' },
      features: { title: 'Features' },
      analytics: {
        title: 'Analytics & resume',
        intro:
          'Analytics is entirely optional — the player works fully without it. When you do pass an analytics config, it emits the canonical Logplex events (batched, retried, flushed on page-hide) and offers a resume banner from the saved position. No extra wiring.',
      },
      playlist: {
        title: 'Episodes / playlist',
        intro: 'Provide a list of episodes; the playlist panel and prev/next nav appear automatically.',
      },
      subtitles: {
        title: 'Subtitles & audio tracks',
        intro:
          'HLS-embedded subtitle and multi-language audio tracks are detected automatically and exposed as a CC menu and an audio-language menu. You can also add your own external subtitle files via the subtitles prop.',
      },
      ads: {
        title: 'Pre-roll ads',
        intro:
          'Resolve the creatives yourself (e.g. from VAST) and pass URLs as pre-roll, mid-rolls (at content seconds) and post-roll. The player handles playback, the skip countdown, click-through and ad analytics, and resumes the content afterwards. Ad playback is never counted in the content analytics.',
      },
      restriction: {
        title: 'IP / network restriction',
        intro:
          "Block playback when the viewer's IP/network isn't allowed. The overlay covers the player, pauses it, and offers retry / exit. Detect the condition yourself and pass — or clear — the prop.",
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
    pg: { language: 'Language', appearance: 'Theme', dark: 'Dark', light: 'Light', accent: 'Accent', playlist: 'Playlist', badge: 'Badge', notice: 'Notice', ad: 'Ads (pre/mid/post)', back: 'Back button', restrict: 'Restriction', persist: 'Remember settings' },
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
      ['IP restriction', 'Block playback on a disallowed network; retry / exit actions.'],
      ['Subtitles & audio', 'Auto CC + multi-language audio menus from HLS; add external subtitle files too.'],
      ['No-Logplex mode', 'Analytics is optional — works as a standalone player with zero backend.'],
    ],
    propsHead: { prop: 'Prop', type: 'Type', desc: 'Description' },
    propsRows: [
      ['src', 'string | VideoSource[]', 'HLS/MP4 URL — or an array of MP4 renditions ({src,height}) for a manual quality menu.'],
      ['poster', 'string', 'Poster image shown on the cover (before play).'],
      ['title / episodeLabel', 'string', 'Shown above the scrubber, right-aligned.'],
      ['thumbnails', 'string', 'WebVTT thumbnails track for scrub previews.'],
      ['subtitles', 'SubtitleTrack[]', 'External subtitle files (HLS subtitles + audio tracks auto-detected).'],
      ['locale', "'fa' | 'en'", 'UI language (fa → RTL). Default fa.'],
      ['theme', 'ThemeOverrides', 'accent / surface / text / radius … CSS variables.'],
      ['appearance', "'dark' | 'light'", 'Color scheme (video stays black). Default dark.'],
      ['episodes', 'Episode[]', 'Playlist; enables the panel + prev/next.'],
      ['currentEpisodeId / onEpisodeChange', 'string / fn', 'Controlled episode selection.'],
      ['analytics', 'LogplexAnalyticsConfig', 'Enables built-in analytics + resume.'],
      ['resume', 'boolean', 'Show the continue-watching banner. Default true.'],
      ['persistSettings', 'boolean', 'Remember volume/mute/speed/brightness in localStorage. Default false.'],
      ['settingsKey', 'string', "localStorage key for persisted settings. Default 'logplex-player'."],
      ['ad', 'AdConfig', 'Pre-roll ad shorthand ({ src, skipAfterSec, clickThrough }).'],
      ['ads', 'AdBreak[]', "Ad breaks: offset 'pre' | 'post' | seconds (mid-roll). Ads aren't counted in content analytics."],
      ['notice', 'PlayerNotice', 'Operator/network notice ({ message, ctaLabel, onCta }).'],
      ['restriction', 'PlayerRestriction', 'Blocking overlay when the network/IP is not allowed.'],
      ['badge', 'string', 'Transient info pill shown at the start.'],
      ['onLike', '(liked) => void', 'Show a Like button; emits a like event.'],
      ['fullscreenMode', "'auto'|'native'|'simulated'", 'Fullscreen strategy (WebView-safe).'],
      ['fullscreenOnPlay', 'boolean', 'Enter fullscreen when playback starts from the cover.'],
      ['onBack', '() => void', 'Show a back button in the top bar.'],
    ],
    eventsIntro: 'With analytics set, the player emits these event_type values to /v1/ingest/* (mirroring the Logplex SDK contract):',
    footer: 'logplex-player-react · built on Vidstack + hls.js · Developed by Morteza Safarishahi',
  },
  fa: {
    nav: { start: 'شروع سریع', playground: 'محیط آزمایش', features: 'امکانات', props: 'پراپ‌ها', events: 'رویدادها' },
    heroTagline:
      'یک پخش‌کنندهٔ ویدئوی React آمادهٔ تولید — HLS/MP4، پوستهٔ کاملاً اختصاصی راست‌به‌چپ/چپ‌به‌راست و آنالیتیکس و ادامهٔ تماشای داخلی Logplex. لینک‌ها به داخل، آنالیتیکس به بیرون.',
    pills: ['React ۱۸+', 'Vidstack + hls.js', 'TypeScript', 'RTL / LTR'],
    s: {
      start: { title: 'شروع سریع', intro: 'کامپوننت و فایل استایل آن را وارد کنید، سپس آن را به یک منبع HLS یا MP4 وصل کنید.' },
      standalone: {
        title: 'استفاده بدون Logplex',
        intro:
          'آنالیتیکس اختیاری است. اگر پراپ analytics را ندهید، پخش‌کننده یک پلیر ویدئوی مستقل است — با تمام پوسته، کیفیت، سرعت، لیست پخش، تبلیغ، حرکات لمسی و تمام‌صفحه — بدون هیچ درخواست شبکه‌ای و بدون وابستگی به Logplex.',
      },
      playground: { title: 'محیط آزمایش', intro: 'امکانات را به‌صورت زنده تغییر دهید و به‌روزرسانی props را ببینید. پخش‌کنندهٔ کنار، واقعی است.' },
      features: { title: 'امکانات' },
      analytics: {
        title: 'آنالیتیکس و ادامهٔ تماشا',
        intro:
          'آنالیتیکس کاملاً اختیاری است — پخش‌کننده بدون آن هم کامل کار می‌کند. اگر تنظیمات analytics را بدهید، رویدادهای استاندارد Logplex را ارسال می‌کند (دسته‌ای، با تلاش مجدد و تخلیه هنگام پنهان‌شدن صفحه) و بنر ادامهٔ تماشا را نشان می‌دهد. بدون سیم‌کشی اضافه.',
      },
      playlist: {
        title: 'قسمت‌ها / لیست پخش',
        intro: 'یک لیست از قسمت‌ها بدهید؛ پنل لیست پخش و دکمه‌های قبلی/بعدی به‌طور خودکار ظاهر می‌شوند.',
      },
      subtitles: {
        title: 'زیرنویس و صداهای چندزبانه',
        intro:
          'زیرنویس‌ها و صداهای چندزبانهٔ داخل HLS به‌طور خودکار شناسایی و در منوی زیرنویس و منوی زبان صدا نمایش داده می‌شوند. فایل‌های زیرنویس خودتان را هم می‌توانید با پراپ subtitles اضافه کنید.',
      },
      ads: {
        title: 'تبلیغ پیش از پخش',
        intro:
          'تبلیغ‌ها را خودتان تعیین کنید (مثلاً از VAST) و به‌صورت پیش از پخش، میان‌برنامه‌ای (در ثانیه‌های محتوا) و پس از پخش بدهید. پخش‌کننده پخش، شمارش معکوس رد شدن، کلیک به مقصد و آنالیتیکس تبلیغ را مدیریت می‌کند و سپس محتوا را ادامه می‌دهد. تبلیغ‌ها هرگز در آمار محتوا شمرده نمی‌شوند.',
      },
      restriction: {
        title: 'محدودیت شبکه / آی‌پی',
        intro:
          'وقتی شبکه/آی‌پی کاربر مجاز نیست، پخش را مسدود کنید. این پوشش روی پخش‌کننده می‌نشیند، آن را متوقف می‌کند و دکمه‌های تلاش مجدد/خروج را نشان می‌دهد. شرط را خودتان تشخیص دهید و پراپ را بدهید یا حذف کنید.',
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
    pg: { language: 'زبان', appearance: 'حالت رنگ', dark: 'تیره', light: 'روشن', accent: 'رنگ تأکید', playlist: 'لیست پخش', badge: 'نشان', notice: 'اعلان', ad: 'تبلیغات (ابتدا/میان/پایان)', back: 'دکمهٔ بازگشت', restrict: 'محدودیت شبکه' },
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
      ['محدودیت آی‌پی', 'مسدودسازی پخش روی شبکهٔ غیرمجاز؛ دکمه‌های تلاش مجدد/خروج.'],
      ['زیرنویس و صدا', 'منوی زیرنویس و صدای چندزبانه از HLS؛ افزودن فایل زیرنویس خارجی هم ممکن است.'],
      ['بدون Logplex', 'آنالیتیکس اختیاری است — به‌صورت پلیر مستقل و بدون هیچ بک‌اندی کار می‌کند.'],
    ],
    propsHead: { prop: 'پراپ', type: 'نوع', desc: 'توضیح' },
    propsRows: [
      ['src', 'string | VideoSource[]', 'نشانی HLS/MP4 — یا آرایه‌ای از کیفیت‌های MP4 ({src,height}) برای منوی انتخاب کیفیت دستی.'],
      ['poster', 'string', 'تصویر پوستر که روی کاور (پیش از پخش) نمایش داده می‌شود.'],
      ['title / episodeLabel', 'string', 'بالای نوار پیشروی و راست‌چین نمایش داده می‌شود.'],
      ['thumbnails', 'string', 'ترک تصاویر بندانگشتی WebVTT برای پیش‌نمایش هنگام جابه‌جایی.'],
      ['subtitles', 'SubtitleTrack[]', 'فایل‌های زیرنویس خارجی (زیرنویس و صدای HLS خودکار شناسایی می‌شوند).'],
      ['locale', "'fa' | 'en'", 'زبان رابط کاربری (fa ← راست‌به‌چپ). پیش‌فرض fa.'],
      ['theme', 'ThemeOverrides', 'متغیرهای CSS مانند accent / surface / text / radius.'],
      ['appearance', "'dark' | 'light'", 'حالت رنگ (ویدئو مشکی می‌ماند). پیش‌فرض dark.'],
      ['episodes', 'Episode[]', 'لیست پخش؛ پنل و دکمه‌های قبلی/بعدی را فعال می‌کند.'],
      ['currentEpisodeId / onEpisodeChange', 'string / fn', 'انتخاب کنترل‌شدهٔ قسمت.'],
      ['analytics', 'LogplexAnalyticsConfig', 'آنالیتیکس داخلی و ادامهٔ تماشا را فعال می‌کند.'],
      ['resume', 'boolean', 'نمایش بنر ادامهٔ تماشا. پیش‌فرض true.'],
      ['persistSettings', 'boolean', 'به‌خاطرسپاری صدا/بی‌صدا/سرعت/روشنایی در localStorage. پیش‌فرض false.'],
      ['settingsKey', 'string', "کلید localStorage برای تنظیمات ذخیره‌شده. پیش‌فرض 'logplex-player'."],
      ['ad', 'AdConfig', 'میان‌بُر تبلیغ پیش از پخش: { src, skipAfterSec, clickThrough }.'],
      ['ads', 'AdBreak[]', "بریک‌های تبلیغ: offset برابر 'pre' | 'post' | ثانیه (میان‌برنامه‌ای). تبلیغ‌ها در آمار محتوا شمرده نمی‌شوند."],
      ['notice', 'PlayerNotice', 'اعلان اپراتور/شبکه: { message, ctaLabel, onCta }.'],
      ['badge', 'string', 'نشان اطلاع‌رسانی گذرا که در ابتدا نمایش داده می‌شود.'],
      ['onLike', '(liked) => void', 'نمایش دکمهٔ لایک؛ رویداد like ارسال می‌کند.'],
      ['fullscreenMode', "'auto'|'native'|'simulated'", 'راهبرد تمام‌صفحه (سازگار با WebView).'],
      ['fullscreenOnPlay', 'boolean', 'ورود به تمام‌صفحه هنگام شروع پخش از کاور.'],
      ['onBack', '() => void', 'نمایش دکمهٔ بازگشت در نوار بالا.'],
    ],
    eventsIntro: 'با تنظیم analytics، پخش‌کننده این مقادیر event_type را به /v1/ingest/* ارسال می‌کند (مطابق قرارداد SDK لاگ‌پلکس):',
    footer: 'logplex-player-react · ساخته‌شده با Vidstack و hls.js · توسعه‌یافته توسط مرتضی صفری شاهی',
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
  const [appear, setAppear] = useState<'dark' | 'light'>('dark');
  const [accent, setAccent] = useState('#e8b84b');
  const [badge, setBadge] = useState(true);
  const [notice, setNotice] = useState(true);
  const [ad, setAd] = useState(false);
  const [episodes, setEpisodes] = useState(true);
  const [back, setBack] = useState(false);
  const [restrict, setRestrict] = useState(false);
  const [persist, setPersist] = useState(false);
  const [current, setCurrent] = useState('e1');
  const pg = T[lang].pg;
  const fa = locale === 'fa';

  const props: LogplexPlayerProps = {
    src: STREAM,
    poster: POSTER,
    title: fa ? 'عنوان فیلم' : 'Sample Movie',
    episodeLabel: fa ? 'قسمت اول' : 'Episode 1',
    locale,
    appearance: appear,
    theme: { accent },
    thumbnails: THUMBNAILS,
    subtitles: SUBTITLES,
    persistSettings: persist,
    onLike: () => undefined,
    ...(episodes ? { episodes: episodesFor(locale), currentEpisodeId: current, onEpisodeChange: setCurrent } : {}),
    ...(back ? { onBack: () => undefined } : {}),
    ...(badge
      ? { badge: fa ? 'ترافیک شما به صورت تمام‌بها حساب می‌شود.' : 'Your traffic is billed at premium rate.' }
      : {}),
    ...(notice
      ? {
          notice: {
            message: fa ? 'این فیلم فقط با اینترنت اپراتور همراه اول رایگان است.' : 'Free only on the sponsor network.',
            ctaLabel: fa ? 'فعال‌سازی' : 'Activate',
          },
        }
      : {}),
    ...(restrict
      ? {
          restriction: {
            title: fa ? 'شبکه نامعتبر' : 'Network not allowed',
            message: fa
              ? 'برای پخش فیلم فقط از اینترنت همراه اول یا ایرانسل می‌توانید استفاده کنید.'
              : 'Playback is only available on the sponsor mobile network.',
            onRetry: () => setRestrict(false),
            onExit: () => setRestrict(false),
          },
        }
      : {}),
    ...(ad
      ? {
          ads: [
            { src: AD_SRC, offset: 'pre' as const, skipAfterSec: 3 },
            { src: AD_SRC, offset: 8, skipAfterSec: 3 },
            { src: AD_SRC, offset: 'post' as const, skipAfterSec: 3 },
          ],
        }
      : {}),
  };

  const code = useMemo(() => {
    return [
      `<LogplexPlayer`,
      `  src="${STREAM}"`,
      `  poster="${POSTER}"`,
      `  locale="${locale}"`,
      `  appearance="${appear}"`,
      `  theme={{ accent: '${accent}' }}`,
      episodes ? `  episodes={episodes}\n  currentEpisodeId={current}\n  onEpisodeChange={setCurrent}` : '',
      back ? `  onBack={() => history.back()}` : '',
      badge ? `  badge="${props.badge}"` : '',
      notice ? `  notice={{ message: '…', ctaLabel: '…' }}` : '',
      restrict ? `  restriction={{ title: '…', message: '…', onRetry, onExit }}` : '',
      ad ? `  ads={[{ src, offset: 'pre' }, { src, offset: 8 }, { src, offset: 'post' }]}` : '',
      `  thumbnails="thumbnails.vtt"`,
      persist ? `  persistSettings` : '',
      `  onLike={(liked) => track(liked)}`,
      `  analytics={{ baseUrl, apiKey, userId, contentId }}`,
      `/>`,
    ]
      .filter(Boolean)
      .join('\n');
  }, [locale, appear, accent, episodes, back, badge, notice, restrict, ad, persist, props.badge]);

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
          {pg.appearance}
          <select value={appear} onChange={(e) => setAppear(e.target.value as 'dark' | 'light')}>
            <option value="dark">{pg.dark}</option>
            <option value="light">{pg.light}</option>
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
        <label>
          <input type="checkbox" checked={back} onChange={(e) => setBack(e.target.checked)} /> {pg.back}
        </label>
        <label>
          <input type="checkbox" checked={restrict} onChange={(e) => setRestrict(e.target.checked)} /> {pg.restrict}
        </label>
        <label>
          <input type="checkbox" checked={persist} onChange={(e) => setPersist(e.target.checked)} /> {pg.persist}
        </label>
      </div>
      <div className="dx-playground">
        <div className="dx-player dx-player--lg">
          {/* key forces a clean remount when the ad toggles. */}
          <LogplexPlayer key={`${ad}`} {...props} />
        </div>
        <CodeBlock>{code}</CodeBlock>
      </div>
    </>
  );
}

// Hero demo — episode-stateful so prev/next actually navigate.
function HeroPlayer({ lang }: { lang: Lang }) {
  const fa = lang === 'fa';
  const [current, setCurrent] = useState('e1');
  const idx = Math.max(0, EPISODES.findIndex((e) => e.id === current));
  return (
    <div className="dx-player" style={{ maxWidth: 860, margin: '32px auto 0' }}>
      <LogplexPlayer
        episodes={episodesFor(lang)}
        currentEpisodeId={current}
        onEpisodeChange={setCurrent}
        locale={lang}
        title={fa ? 'فیلم نمونه' : 'Sample Movie'}
        episodeLabel={fa ? FA_SUBTITLES[idx] : `Episode ${idx + 1}`}
        poster={POSTER}
        thumbnails={THUMBNAILS}
        subtitles={SUBTITLES}
        badge={fa ? 'ترافیک شما به صورت تمام‌بها حساب می‌شود.' : 'Your traffic is billed at premium rate.'}
        onBack={() => undefined}
        onLike={() => undefined}
      />
    </div>
  );
}

const EVENT_TYPES = [
  'play', 'pause', 'resume', 'seek', 'buffer_start', 'buffer_end', 'quality_change',
  'heartbeat', 'complete', 'exit', 'error', 'play_start_success', 'ad_request', 'ad_start', 'ad_complete', 'like',
];

const LANG_KEY = 'lpx-docs-lang';

function readLang(): Lang {
  try {
    const saved = localStorage.getItem(LANG_KEY);
    if (saved === 'fa' || saved === 'en') return saved;
  } catch {
    /* localStorage unavailable (private mode / SSR) — fall back to default */
  }
  return 'en';
}

function Docs() {
  const [lang, setLang] = useState<Lang>(readLang);
  const t = T[lang];
  const dir = lang === 'fa' ? 'rtl' : 'ltr';

  const chooseLang = (next: Lang) => {
    setLang(next);
    try {
      localStorage.setItem(LANG_KEY, next);
    } catch {
      /* ignore persistence failures */
    }
  };

  // Scroll-reveal sections + a shadow on the header once scrolled.
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && e.target.classList.add('dx-in')),
      { rootMargin: '0px 0px -10% 0px', threshold: 0.08 },
    );
    document.querySelectorAll('.dx-section').forEach((el) => io.observe(el));
    const header = document.querySelector('.dx-header');
    const onScroll = () => header?.classList.toggle('dx-stuck', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      io.disconnect();
      window.removeEventListener('scroll', onScroll);
    };
  }, []);

  return (
    <div className="dx-app" dir={dir} lang={lang}>
      <header className="dx-header">
        <span className="dx-logo">
          <b>logplex</b>-player-react
        </span>
        <nav>
          <a href="#start">{t.nav.start}</a>
          <a href="#playground">{t.nav.playground}</a>
          <a href="#features">{t.nav.features}</a>
          <a href="#props">{t.nav.props}</a>
          <a href="#events">{t.nav.events}</a>
        </nav>
        <div className="dx-langtoggle" role="group" aria-label="Docs language">
          <button aria-pressed={lang === 'en'} onClick={() => chooseLang('en')}>
            EN
          </button>
          <button aria-pressed={lang === 'fa'} onClick={() => chooseLang('fa')}>
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
          <div className="dx-install">npm i logplex-player-react</div>
          {/* key={lang} remounts so the locale switch + badge animation apply cleanly. */}
          <HeroPlayer key={lang} lang={lang} />
        </div>

        <Section id="start" title={t.s.start.title} intro={t.s.start.intro}>
          <CodeBlock>{`
import { LogplexPlayer } from 'logplex-player-react';
import 'logplex-player-react/styles.css';

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

        <Section id="standalone" title={t.s.standalone.title} intro={t.s.standalone.intro}>
          <CodeBlock>{`
import { LogplexPlayer } from 'logplex-player-react';
import 'logplex-player-react/styles.css';

// No analytics, no Logplex account — just a player.
<LogplexPlayer
  src="https://cdn.example.com/movie/master.m3u8"
  poster="poster.jpg"
  locale="en"
  persistSettings   // optional: remember volume / speed / brightness locally
/>`}</CodeBlock>
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

        <Section id="subtitles" title={t.s.subtitles.title} intro={t.s.subtitles.intro}>
          <CodeBlock>{`
<LogplexPlayer
  src={hlsWithAudioAndSubs}   // embedded audio/subtitle tracks → auto CC + audio menus
  subtitles={[
    { src: 'subs/fa.vtt', label: 'فارسی', language: 'fa' },
    { src: 'subs/en.vtt', label: 'English', language: 'en' },
  ]}
/>`}</CodeBlock>
        </Section>

        <Section id="ads" title={t.s.ads.title} intro={t.s.ads.intro}>
          <CodeBlock>{`
<LogplexPlayer
  src={contentUrl}
  ads={[
    { src: adUrl, offset: 'pre', skipAfterSec: 5 },   // pre-roll
    { src: adUrl, offset: 600 },                       // mid-roll at 10:00
    { src: adUrl, offset: 'post' },                    // post-roll
  ]}
/>
// Ad playback is never counted in the content's analytics.`}</CodeBlock>
        </Section>

        <Section id="restriction" title={t.s.restriction.title} intro={t.s.restriction.intro}>
          <CodeBlock>{`
<LogplexPlayer
  src={src}
  restriction={blocked ? {
    title: 'شبکه نامعتبر',
    message: 'برای پخش فقط از اینترنت همراه اول یا ایرانسل استفاده کنید.',
    onRetry: recheckAccess,   // re-check the IP/network, then clear on success
    onExit: () => router.back(),
  } : undefined}
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
