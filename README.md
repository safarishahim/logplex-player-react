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
- **Quality / speed / subtitles / audio** menus — HLS-embedded subtitle and multi-language audio tracks are detected automatically; add external WebVTT subtitles too.
- **Ads** — pre-roll, mid-rolls (at content seconds) and post-roll, with skip countdown and click-through. Ad playback is never counted in content analytics.
- **Playlist** — episode list + prev/next, auto-advance and auto-resume across episodes.
- **Gestures** — mobile double-tap ±10s, long-press 2×, brightness/volume swipe; YouTube-style on desktop.
- **WebView-safe fullscreen** — native when available, CSS-simulated fallback.
- **Like / badge / operator notice / IP-restriction** overlays.
- **Optional analytics + resume** — emits canonical events to your ingest endpoint and offers a "continue watching" banner.
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

See the **[documentation site](https://safarishahim.github.io/logplex-player-react/)** for the full props/events reference and a live playground.

## Browser support

Modern evergreen browsers (Chrome, Edge, Firefox, Safari) and WebViews. HLS plays via hls.js where MSE is available, and via native HLS on Safari/iOS.

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
