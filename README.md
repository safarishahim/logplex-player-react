# logplex-player-react

[![npm](https://img.shields.io/npm/v/logplex-player-react.svg)](https://www.npmjs.com/package/logplex-player-react)
[![CI](https://github.com/safarishahim/logplex-player-react/actions/workflows/ci.yml/badge.svg)](https://github.com/safarishahim/logplex-player-react/actions/workflows/ci.yml)
[![license](https://img.shields.io/npm/l/logplex-player-react.svg)](./LICENSE)

A production-ready **React video player** built on [Vidstack](https://vidstack.io) + [hls.js](https://github.com/video-dev/hls.js). HLS/MP4, a fully custom skin (dark, gold accent, **RTL/Persian + LTR/English**), responsive via container queries, with quality / audio / subtitle menus, pre/mid/post-roll ads, touch gestures, WebView-safe fullscreen, and **optional** built-in analytics + resume.

**🎬 [Live demo & docs](https://safarishahim.github.io/logplex-player-react/)**

> Analytics is completely optional — omit the `analytics` prop and it's a self-contained player with zero network calls.

## Install

```bash
npm i logplex-player-react
```

Peer dependencies: `react` and `react-dom` (>= 18).

## Quick start

```tsx
import { LogplexPlayer } from 'logplex-player-react';
import 'logplex-player-react/styles.css';

export default function Watch() {
  return (
    <LogplexPlayer
      src="https://cdn.example.com/movie/master.m3u8"
      poster="https://cdn.example.com/poster.jpg"
      title="Sample Movie"
      locale="en" // 'fa' (RTL) | 'en' (LTR)
    />
  );
}
```

## Features

- **HLS + MP4** — adaptive HLS via hls.js (auto quality from the manifest) or progressive MP4. Pass an array of MP4 renditions for a manual quality menu.
- **Custom skin** — dark, gold-accented, light mode, RTL/LTR, fully responsive (container queries).
- **VOD providers** — `vodType` exchanges an opaque play token for the real stream URL via a provider API (ABR Hamrahi, Poyan), so existing back-ends keep working.
- **Quality / speed / subtitles / audio** menus — HLS-embedded subtitle and multi-language audio tracks are detected automatically; add external WebVTT subtitles too. `qualityValidate` filters out unwanted renditions.
- **Ads** — pre-roll, mid-rolls (at content seconds) and post-roll, with skip countdown and click-through. Ad playback is never counted in content analytics.
- **Playlist & seasons** — episode list + prev/next, auto-advance, season headers (`Episode.group`), and an **up-next card** near the end of an episode.
- **Gestures** — mobile double-tap ±10s, long-press 2×, brightness/volume swipe (correctly remapped in simulated-rotation fullscreen); YouTube-style on desktop.
- **WebView-safe fullscreen** — native when available, CSS-simulated rotation fallback (keeps the skin) for locked WebViews.
- **Like / badge / operator notice / IP-restriction** overlays (Like can be controlled).
- **Optional analytics + resume** — emits canonical events to your ingest endpoint and offers a "continue watching" banner. Or drive resume from your own back-end with `resolveResume`, and report a watch heartbeat to a non-Logplex tracker with `onWatchInterval`.
- **TypeScript**, tree-shakeable ESM + CJS, a single `styles.css`.

## Theming & i18n

```tsx
<LogplexPlayer
  appearance="dark"             // 'dark' | 'light'
  theme={{ accent: '#e8b84b' }} // CSS custom properties
  locale="fa"                   // RTL right-aligns text; layout stays physical
/>
```

The player inherits the host font, so Persian/Arabic UIs pick up your own font automatically.

## Optional analytics

```tsx
<LogplexPlayer
  src={src}
  analytics={{ baseUrl, apiKey, userId, contentId, contentType: 'movie' }}
  resume // continue-watching banner
/>
```

Omit `analytics` entirely to run the player standalone — no requests, nothing backend-specific.

## VOD providers & your own back-end

You don't need the Logplex analytics integration to keep an existing back-end working. Resolve token-based sources, report a watch heartbeat, and feed the resume banner from your own API:

```tsx
<LogplexPlayer
  src={playToken}                    // opaque token for the provider
  vodType="abr_hamrahi"              // 'standard' | 'abr_hamrahi' | 'poyan'
  vodCustomUrl={{ abr_hamrahi: '/vod/abrehamrahi/{token}' }}
  qualityValidate={h => h > 400}     // hide tiny renditions from the Auto menu

  // periodic "user watch" report to your current (non-Logplex) tracker
  onWatchInterval={async ({ playDuration, duration, quality, userWatchId }) =>
    reportWatch({ playDuration, duration, quality, userWatchId }) // return an id to chain
  }
  watchIntervalMs={5000}

  // "continue watching" banner sourced from your back-end (memoize it)
  resolveResume={async () => {
    const w = await getWatch(contentId);
    return w ? { positionSeconds: w.duration } : null;
  }}
/>
```

`onWatchInterval` reports the quality as `"W*H"` (e.g. `"1920*1080"`), the accumulated `playDuration`, the current `duration` (position), and chains the returned watch id into the next call.

## Playlist, seasons & up-next

```tsx
const episodes = [
  { id: 'e1', src: '.../e1.m3u8', title: 'سریال', subtitle: 'قسمت اول', group: 'فصل اول', poster: '...' },
  { id: 'e2', src: '.../e2.m3u8', title: 'سریال', subtitle: 'قسمت دوم', group: 'فصل اول', poster: '...' },
];

<LogplexPlayer episodes={episodes} currentEpisodeId={current} onEpisodeChange={setCurrent} />
```

`Episode.group` renders sticky season headers in the playlist panel. Near the end of an episode that has a next one, an **up-next card** (cover + filling progress bar) appears; ignoring it auto-advances on end, clicking it jumps straight to the next episode.

## Props reference

| Prop | Type | Description |
| --- | --- | --- |
| `src` | `string \| VideoSource[]` | HLS/MP4 URL, or MP4 renditions for a manual quality menu. For a non-standard `vodType`, an opaque play token. |
| `vodType` | `'standard' \| 'abr_hamrahi' \| 'poyan'` | VOD provider. Non-standard exchanges `src` (a token) for the real stream via the provider API. Default `standard`. |
| `vodCustomUrl` | `Partial<Record<VodProvider, string>>` | Override the provider API endpoint(s); `{token}` is substituted. |
| `qualityValidate` | `(height: number) => boolean` | Hide auto (HLS) renditions whose height fails the predicate. Auto stays available. |
| `poster` | `string` | Cover image (before play). |
| `title` / `episodeLabel` | `string` | Shown above the scrubber. |
| `thumbnails` | `string` | WebVTT thumbnails track for scrub previews. |
| `subtitles` | `SubtitleTrack[]` | External subtitle files (HLS subtitles + audio tracks are auto-detected). |
| `locale` / `dir` | `'fa' \| 'en'` / `'rtl' \| 'ltr'` | UI language and direction. `fa` → RTL. |
| `theme` / `appearance` | `ThemeOverrides` / `'dark' \| 'light'` | CSS-variable overrides and color scheme. |
| `episodes` | `Episode[]` | Playlist; enables the panel + prev/next. `Episode.group` adds season headers; an up-next card appears near the end. |
| `currentEpisodeId` / `onEpisodeChange` | `string` / `(id) => void` | Controlled episode selection. |
| `analytics` | `LogplexAnalyticsConfig` | Enables built-in Logplex analytics + resume. |
| `resume` | `boolean` | Show the continue-watching banner. Default `true`. |
| `resolveResume` | `() => Promise<ResumePoint \| null>` | Feed the resume banner from your own back-end (no analytics needed). Memoize it. |
| `onWatchInterval` | `(info) => Promise<string \| void>` | Periodic watch heartbeat to a non-Logplex tracker; return an id to chain. |
| `watchIntervalMs` | `number` | Watch-interval cadence in ms. Default `5000`. |
| `onPlayerReady` | `(player \| null) => void` | Exposes the underlying Vidstack instance for imperative control. |
| `loading` | `boolean` | Force the loading overlay (also shown while a provider source resolves). |
| `ad` / `ads` | `AdConfig` / `AdBreak[]` | Pre-roll shorthand, or breaks at `'pre' \| 'post' \| seconds`. |
| `notice` / `restriction` / `badge` | `PlayerNotice` / `PlayerRestriction` / `string` | Operator notice, blocking network overlay, transient info pill. |
| `onLike` / `liked` | `(liked) => void` / `boolean` | Like button; `liked` makes it controlled. |
| `fullscreenMode` | `'auto' \| 'native' \| 'simulated'` | Fullscreen strategy. `simulated` forces a CSS rotation for locked WebViews. |
| `fullscreenOnPlay` | `boolean` | Enter fullscreen when playback starts from the cover. |
| `persistSettings` / `settingsKey` | `boolean` / `string` | Remember volume/mute/speed/brightness in `localStorage`. |
| `onBack` | `() => void` | Show a back button in the top bar. |

See the **[documentation site](https://safarishahim.github.io/logplex-player-react/)** for the live playground and the full events reference.

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari) and WebViews. HLS plays via hls.js where MSE is available, and via native HLS on Safari/iOS.

## Mobile & iOS notes

The player is built mobile-first (inline playback, touch gestures, responsive skin):

- **Inline playback** — `playsInline` is set, so video plays in place on iPhone instead of being forced into the system player.
- **HLS everywhere** — Android Chrome/WebView uses **hls.js** (MSE); iOS Safari/WKWebView has no MSE, so it falls back to **native HLS** automatically. MP4 works on both.
- **Fullscreen** — `fullscreenMode="auto"` (default) uses native OS fullscreen when available (including iOS's native `<video>` fullscreen, which rotates correctly), and on Android forces landscape for a landscape video when the device hasn't auto-rotated. Where no native fullscreen exists — typically a **locked Android WebView** — it falls back to a **CSS simulated rotation** that keeps the custom skin and promotes to the browser **top layer**; its size is taken from `window.inner*` in pixels (more reliable than viewport units in some WebViews), and touch gestures are remapped into the rotated frame. Force the path with `fullscreenMode="simulated"` or `"native"`.
- **Quality menu** — fully controllable where hls.js runs (Android/desktop). On iOS **native HLS**, bitrate is auto-selected by the OS; for guaranteed manual quality on iOS, pass an array of MP4 renditions to `src`. Embedded audio/subtitle tracks are exposed via the native track API.
- **Autoplay** — like all browsers, mobile requires `muted` or a user gesture; the tap-to-play cover handles this.
- **Touch hardening** — long-press callout / text selection / double-tap zoom are disabled on the player surface so gestures don't conflict; the simulated-fullscreen overlay is sized in pixels from the live viewport so it fills the screen edge-to-edge even where dynamic viewport units misbehave.

## Development

```bash
npm install
npm run dev          # docs/demo site with HMR
npm test             # unit tests (vitest)
npm run lint         # eslint
npm run build        # build the library to dist/
npm run docs:build   # build the docs site to site/
```

See [CONTRIBUTING.md](./CONTRIBUTING.md).

## License

[MIT](./LICENSE) © Morteza Safarishahi

Built on [Vidstack](https://vidstack.io) and [hls.js](https://github.com/video-dev/hls.js). The demo uses the [Sprite Fight](https://vidstack.io) sample and the [Vazirmatn](https://github.com/rastikerdar/vazirmatn) font (SIL OFL).
