# @logplex/player-react

A React video player for Logplex customers. Vidstack-based, HLS/MP4, fully
custom-skinned (dark, gold accent, **RTL/Persian + LTR/English**), responsive
(desktop + mobile via container queries), with **built-in Logplex analytics**
and a **resume ("continue watching") banner** — wired to the Logplex ingest
pipeline out of the box.

External playback links in, analytics + resume to your Logplex backend out.

## Install

```bash
npm i @logplex/player-react
# peers:
npm i react react-dom
```

## Quick start

```tsx
import { LogplexPlayer } from '@logplex/player-react';
import '@logplex/player-react/styles.css';

export default function Watch() {
  return (
    <LogplexPlayer
      src="https://cdn.example.com/movie/master.m3u8"   // HLS or MP4
      title="عنوان فیلم"
      episodeLabel="قسمت سوم"
      poster="https://cdn.example.com/movie/poster.jpg"
      locale="fa"                                        // 'fa' (rtl) | 'en' (ltr)
      analytics={{
        baseUrl: 'https://ingest.your-logplex.com',
        apiKey: 'mk_live_xxx',                           // your merchant key
        userId: 'viewer-42',                             // stable per-viewer id
        contentId: 'movie-123',
        contentType: 'movie',
        contentDurationMs: 6_752_000,
        userType: 'authenticated',
      }}
    />
  );
}
```

That's it — the player emits `play / pause / resume / seek / buffer_start /
buffer_end / quality_change / heartbeat / complete / exit / error /
play_start_success` to `/v1/ingest/*` (batched, retried, flushed on page hide),
and on load it fetches the saved resume point and offers the banner.

## Playlist / episodes

```tsx
<LogplexPlayer
  episodes={[
    { id: 'e1', src: '.../e1.m3u8', title: 'سریال', subtitle: 'قسمت اول', durationMs: 2_700_000 },
    { id: 'e2', src: '.../e2.m3u8', title: 'سریال', subtitle: 'قسمت دوم' },
  ]}
  currentEpisodeId="e1"
  onEpisodeChange={(id) => setCurrent(id)}
  analytics={{ /* ... contentId per episode ... */ }}
/>
```

## Theming

Pass `theme` (maps to CSS custom properties), or override the `--lpx-*`
variables in your own CSS.

```tsx
<LogplexPlayer theme={{ accent: '#e8b84b', surface: '#1c1c1e', radius: '14px' }} … />
```

## Analytics API (advanced)

`useLogplexAnalytics(player, config)` and the `LogplexAnalytics` class are
exported if you want to drive events yourself (e.g. `like`, `share`,
`watchlist_add`, ad events). The client mirrors the Logplex Go SDK contract.

## Status

Built and shipping:
- Vidstack core (HLS via hls.js + MP4), custom RTL skin, responsive desktop/mobile
- Top bar, center play + ±10s, bottom transport, gold scrubber + time, volume,
  lock-controls, episode prev/next
- **Scrub thumbnail previews** (WebVTT via `thumbnails` → `TimeSlider.Thumbnail`)
- **Settings menu**: quality (AUTO + renditions) + playback speed
- **Playlist** panel with episode thumbnails
- **Emoji reactions** bar (floating animation; emits `like` + `onReaction`)
- **Pre-roll ads**: ADS label, mute, skip-after countdown, progress, click-through
  → `ad_request/ad_start/ad_complete`; content analytics suspended during the ad
- **Mobile gestures**: double-tap ±10s, long-press 2×, brightness/volume swipe;
  **desktop** is YouTube-style (click = play/pause, double-click = fullscreen)
- **WebView-safe fullscreen**: native when available, else CSS simulated —
  fills the viewport, rotates 90° to present landscape in a portrait WebView
  (`fullscreenMode: 'auto' | 'native' | 'simulated'`)
- **Operator/network notice banner** (host-controlled, dismissible, gold CTA)
- Logplex analytics (full event set, heartbeats, batch + retry + beacon flush)
- Resume / continue-watching banner

On the roadmap (beyond the original design):
- Mid-roll / multiple ads (VAST), DRM (Widevine/FairPlay), DASH
```

---

Developed by **Morteza Safarishahi** · توسعه‌یافته توسط **مرتضی صفری شاهی**
