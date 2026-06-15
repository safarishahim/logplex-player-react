# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.2.2] - 2026-06-15

### Changed

- Resume card auto-dismisses after 30s if no choice is made (playback keeps going from the start).

### Fixed

- Fullscreen rotation no longer double-rotates: native device rotation is used when it actually turns the viewport, otherwise a CSS 90° rotation is applied — including WebViews that accept `screen.orientation.lock()` but don't rotate.
- iOS Safari popover fullscreen: the rotated player no longer lands in the top-left corner (rotate rule now outranks the popover-open rule).
- Volume gesture now stays in sync with the mute button (swiping the volume up unmutes; to zero mutes).

## [0.2.1] - 2026-06-15

### Changed

- Resume ("continue watching") is now a centered card (title + message + a gold button showing the resume minute, e.g. "مشاهده از دقیقه ۳۲") instead of a bottom pill. Adds the `resumeMessage` string.

### Fixed

- Native fullscreen orientation lock is deferred to the next frame and guarded by the current fullscreen state, so it no longer races the browser and drops fullscreen on some Android builds.

## [0.2.0] - 2026-06-15

### Added

- VOD provider source resolution: `vodType` (`standard` | `abr_hamrahi` | `poyan`) + `vodCustomUrl` exchange an opaque play token for the real stream URL (and scrub-thumbnail VTTs) via the provider's API.
- `onWatchInterval` + `watchIntervalMs`: generic periodic "user watch" heartbeat for an external (non-Logplex) back-end, alongside or instead of the built-in analytics.
- `resolveResume`: feed the built-in resume banner from a host back-end (no Logplex analytics required).
- `qualityValidate`: hide auto (HLS) qualities whose height fails a predicate.
- `onPlayerReady`: exposes the underlying Vidstack `MediaPlayerInstance` for imperative host control.
- `loading`: force the loading overlay (also shown automatically while a provider source resolves).
- Controlled `liked` prop for the Like button.
- Season-grouped playlist via `Episode.group` (accent marker, per-season episode count, sticky headers).

### Fixed / Changed

- Native fullscreen on touch now locks screen orientation to the video's aspect (landscape/portrait); WebViews without a native Fullscreen API keep the CSS simulated rotation.
- Mobile: fixed controls flashing then hiding on tap (touch tap no longer pings on pointer-down); idle timeout 3s → 4s; fixed brightness/volume gesture indicator flicker.
- Hide the ±10s seek buttons on touch devices (the double-tap gesture covers them); speed button sits next to lock.
- Playlist closes on click outside (backdrop); badge sits below the top bar and wraps for longer text.
- Square outer player frame (inner panels/menus stay rounded).

## [0.1.1] - 2026-06-03

### Fixed / Changed

- Simulated fullscreen now promotes the player to the browser top layer (popover API) so no host CSS stacking context can cover it; max z-index remains the fallback.
- iOS: fullscreen uses dynamic viewport units (100dvh/dvw) so Safari's address bar doesn't clip it; disabled long-press callout / text selection on the player and added `touch-action: manipulation` on controls.
- Subtitle "Off" reliably clears the cue; subtitle cues are bottom-centered and lift above the control bar when controls are visible.
- Menu options (quality/speed/subtitle/audio) are reliably selectable (no re-render race), and the menus close on select.
- Episodes: switching while playing auto-plays the next one; auto-advance to the next episode on end; per-episode analytics via `Episode.contentId`.
- Ads: mid-roll and post-roll (`ads` prop) in addition to pre-roll; ad playback excluded from content analytics.
- Bigger center play/pause icon; lock button moved top-left.
- Docs neutralized to be product-agnostic; demo styles bundled correctly; Vazirmatn (OFL) font.

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
