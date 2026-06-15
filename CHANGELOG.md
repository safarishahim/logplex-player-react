# Changelog

All notable changes to this project are documented here. This project adheres to
[Semantic Versioning](https://semver.org/).

## [Unreleased]

### Docs

- Brought the README and the docs/landing site up to date with the 0.2.x features: VOD providers (`vodType`/`vodCustomUrl`), external tracker (`onWatchInterval`/`watchIntervalMs`), `resolveResume`, `qualityValidate`, `loading`, controlled `liked`, `onPlayerReady`, season-grouped playlist + up-next card, and the pixel-based simulated-rotation fullscreen with remapped gestures. Added a full props table and a "VOD providers & your own back-end" section; corrected the `WatchIntervalInfo.quality` doc to `"W*H"`.

## [0.2.8] - 2026-06-15

### Performance

- The skin and the gesture surface no longer subscribe to the high-frequency `currentTime` state, so they stop re-rendering ~4×/sec during playback. The ±10s buttons and double-tap-seek now read the time from the player only at click/tap; the "up next" card was extracted into its own small component (`NextUpCard`) that owns the time subscription, so only it re-renders each tick. The gesture surface also reads volume/playback-rate from the player at gesture start instead of subscribing.

## [0.2.7] - 2026-06-15

### Added

- "Up next" card near the end of an episode that has a next one: shows the next episode's cover and a bar that fills over the last 30s. Ignoring it lets the player auto-advance on end; clicking it (or its play button) jumps straight to the next episode. Dismissible, and reset per episode. Adds the `nextUpTitle` string.
- Quality menu now shows the resolution ABR is currently playing next to "Auto" (small muted suffix) while on auto quality.

### Fixed / Changed

- Controls (and the playlist, which lives in the controls layer) no longer auto-hide while any menu/panel is open — the idle timer is paused until everything is closed.
- Gestures now work in simulated (CSS-rotated) fullscreen: pointer coordinates are remapped into the rotated frame, so brightness/volume halves, swipe axis, and double-tap-seek edges match what the user sees.
- 2× long-press indicator is now a polished pill with an animated fast-forward icon (from the media-icons set) instead of plain "2× »" text.
- Season-grouped playlist: sticky season headers have balanced padding and a small gap above the first episode.
- The player root ([data-media-player]) is now `display: flex`, so the provider/video fills more reliably (especially in fullscreen).

## [0.2.6] - 2026-06-15

### Fixed

- Simulated (CSS) fullscreen rotation now sizes the rotated box from the live viewport in pixels (`window.innerWidth/innerHeight`) instead of `dvh`/`dvw`. Some Android WebViews resolve dynamic (and even static) viewport units incorrectly, leaving the rotated player covering only part of the screen with the rest black; exact pixels fill it edge-to-edge.

## [0.2.5] - 2026-06-15

### Fixed

- `onWatchInterval` now reports the quality as `"WIDTH*HEIGHT"` (literal asterisk, e.g. `"1280*720"`) instead of `"WIDTHxHEIGHT"`. Hosts that derive traffic/bandwidth from this string (matching `^[0-9]+[*][0-9]+$`, then `width*height*playDuration`) were getting zero traffic from the `x`-separated form while watch duration still accumulated correctly.

## [0.2.4] - 2026-06-15

### Added

- Native fullscreen now forces landscape for a landscape video when the OS didn't already rotate (i.e. device auto-rotate is off). It waits briefly after entering fullscreen and only locks if the viewport is still portrait, so it doesn't fight the OS auto-rotation (no double-spin). iOS keeps its own native video-fullscreen rotation.

### Fixed

- Simulated (CSS) fullscreen rotation is now centered with a physical `left` instead of `inset-inline-start`, so the rotated player is positioned correctly in RTL documents (e.g. a Persian Android WebView).

## [0.2.3] - 2026-06-15

### Changed

- Removed the custom screen-orientation lock (it caused a visible double-rotation on Android). Fullscreen rotation is now handled by the OS in native mode, or by the CSS-simulated path otherwise.
- `nativeFullscreenSupported()` now also detects iOS `<video>` fullscreen, so `auto` uses the native iOS video fullscreen (rotates correctly, no black screen) instead of the CSS-simulated path. Use `fullscreenMode="simulated"` to force CSS rotation (e.g. an Android WebView with locked rotation).

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
