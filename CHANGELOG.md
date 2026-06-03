# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.1.0] - 2026-06-03

Initial public release.

### Added

- React video player on Vidstack + hls.js (HLS/MP4), ESM + CJS + types + `styles.css`.
- Custom skin: dark + light, RTL/Persian + LTR/English, responsive via container queries.
- Quality menu (HLS auto + manual MP4 renditions), separate speed menu.
- Subtitle (CC) menu and multi-language audio menu — HLS-embedded tracks auto-detected, plus external WebVTT subtitles.
- Ad breaks: pre-roll, mid-rolls (at content seconds) and post-roll; ads excluded from content analytics.
- Playlist with prev/next, auto-advance and auto-resume across episodes.
- Touch gestures (skip, 2× long-press, brightness/volume swipe) and YouTube-style desktop clicks.
- WebView-safe fullscreen (native or CSS-simulated).
- Like, transient badge, operator notice, and IP/network restriction overlays.
- Optional built-in analytics + resume; per-episode content ids.
- Opt-in persistence of volume / mute / speed / brightness.

[Unreleased]: https://github.com/safarishahim/logplex-player-react/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/safarishahim/logplex-player-react/releases/tag/v0.1.0
