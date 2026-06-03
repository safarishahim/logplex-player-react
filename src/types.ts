import type { ReactNode } from 'react';

/** UI language. Drives strings + text direction. */
export type Locale = 'fa' | 'en';
export type Direction = 'rtl' | 'ltr';

/** Canonical event_type strings accepted by the Logplex ingest API. */
export type LogplexEventType =
  | 'play'
  | 'pause'
  | 'resume'
  | 'seek'
  | 'buffer_start'
  | 'buffer_end'
  | 'quality_change'
  | 'heartbeat'
  | 'download_chunk'
  | 'complete'
  | 'exit'
  | 'error'
  | 'play_start_success'
  | 'progress_25'
  | 'progress_50'
  | 'progress_75'
  | 'progress_90'
  | 'like'
  | 'watchlist_add'
  | 'share'
  | 'autoplay_attempt'
  | 'autoplay_start'
  | 'search_query'
  | 'search_result_click'
  | 'ad_request'
  | 'ad_start'
  | 'ad_complete'
  | 'app_open';

export type Quality = 'auto' | '360p' | '480p' | '720p' | '1080p' | '1440p' | '4k';

/** One playable item in a playlist (series episode, related content). */
export interface Episode {
  id: string;
  /** HLS .m3u8 or progressive MP4. */
  src: string;
  type?: string;
  title?: string;
  /** e.g. "قسمت سوم". */
  subtitle?: string;
  poster?: string;
  /** WebVTT thumbnails track for scrub previews. */
  thumbnails?: string;
  durationMs?: number;
}

/** Configures the built-in Logplex analytics + resume integration. */
export interface LogplexAnalyticsConfig {
  /** Ingest API base URL, e.g. "https://ingest.example.com". */
  baseUrl: string;
  /** Merchant API key (mk_live_*). */
  apiKey: string;
  /** Opaque, stable per-viewer identity (the rollup's viewer_key). */
  userId: string;
  userType?: 'authenticated' | 'guest';
  /** Opaque content id this session plays. */
  contentId: string;
  contentType?: 'movie' | 'series' | 'live';
  contentDurationMs?: number;
  contentTitle?: string;
  contentThumbnailUrl?: string;
  /** Merchant's own user id (optional, for their reports). */
  merchantUserId?: string;
  /** Reused across reloads if you persist it; generated otherwise. */
  sessionId?: string;
  /** Heartbeat cadence while playing (default 10000ms). */
  heartbeatIntervalMs?: number;
  /** Max events buffered before a flush (default 20). */
  batchSize?: number;
  /** Max time events sit buffered before a flush (default 5000ms). */
  flushIntervalMs?: number;
  appVersion?: string;
  /** Turn the whole integration off (e.g. for previews). */
  disabled?: boolean;
}

/** A notice shown over the player — e.g. an operator/network message
 * ("playback is only free on operator X's network"). Host-controlled:
 * pass it to show, remove it (or let the user dismiss) to hide. */
export interface PlayerNotice {
  message: string;
  /** Optional call-to-action button label. */
  ctaLabel?: string;
  onCta?: () => void;
  /** Whether the user can dismiss it (default true). */
  dismissible?: boolean;
}

/** A pre-roll ad. The host resolves the creative (e.g. from VAST) and passes
 * its media URL; the player handles playback + the ad UI + analytics. */
export interface AdConfig {
  /** Ad creative source (HLS or MP4). */
  src: string;
  /** Seconds before the skip button activates (default 5; 0 = always skippable). */
  skipAfterSec?: number;
  /** Opened in a new tab when the ad surface is clicked. */
  clickThrough?: string;
}

/** A blocking restriction overlay — e.g. the viewer's IP/network isn't allowed
 * ("playback only works on operator X or Y's network"). Covers the whole player
 * and pauses playback. Host-controlled: pass it to block, remove it to resume. */
export interface PlayerRestriction {
  /** Heading, e.g. "شبکه نامعتبر" / "Network not allowed". */
  title: string;
  /** Explanatory message. */
  message: string;
  /** Retry/re-check handler. If omitted, the retry button is hidden. */
  onRetry?: () => void;
  /** Exit handler. If omitted, the exit button is hidden. */
  onExit?: () => void;
  /** Override the default retry button label. */
  retryLabel?: string;
  /** Override the default exit button label. */
  exitLabel?: string;
}

/** Theme overrides — each maps to a CSS custom property on the root. */
export interface ThemeOverrides {
  accent?: string;
  accentContrast?: string;
  surface?: string;
  text?: string;
  textMuted?: string;
  radius?: string;
}

export interface LogplexPlayerProps {
  /** Single source (ignored if `episodes`/`currentEpisodeId` resolve one). */
  src?: string;
  type?: string;
  title?: string;
  /** e.g. "قسمت سوم". */
  episodeLabel?: string;
  poster?: string;
  /** WebVTT thumbnails track URL for scrub previews. */
  thumbnails?: string;
  autoPlay?: boolean;
  muted?: boolean;

  locale?: Locale;
  /** Defaults from locale (fa → rtl, en → ltr). */
  dir?: Direction;
  /**
   * Fullscreen strategy. 'auto' uses the native Fullscreen API when available
   * and falls back to a CSS simulated fullscreen (for WebViews). 'simulated'
   * forces the CSS path; 'native' forces the API. Default 'auto'.
   */
  fullscreenMode?: 'auto' | 'native' | 'simulated';
  theme?: ThemeOverrides;
  className?: string;

  /** Playlist / episode navigation. */
  episodes?: Episode[];
  currentEpisodeId?: string;
  onEpisodeChange?: (episodeId: string) => void;

  /** Optional pre-roll ad played before the content. */
  ad?: AdConfig;

  /** Operator/network (or any) notice shown over the player. */
  notice?: PlayerNotice;

  /** Blocking restriction overlay (e.g. IP/network not allowed). Covers the
   * player and pauses playback while present. */
  restriction?: PlayerRestriction;

  /** Short badge (e.g. "تمام‌بها" / premium) that animates in at the start and
   * out after a few seconds. */
  badge?: string;

  /** Enter fullscreen (per `fullscreenMode`) when playback starts from the
   * cover. Default false. */
  fullscreenOnPlay?: boolean;

  /** Built-in Logplex analytics + resume. Omit to disable. */
  analytics?: LogplexAnalyticsConfig;
  /** Show the "continue watching" resume banner (needs analytics). Default true. */
  resume?: boolean;

  onBack?: () => void;

  /** Show a Like button. Called when toggled; emits a `like` event when liked. */
  onLike?: (liked: boolean) => void;

  /** Extra overlays rendered inside the player surface. */
  children?: ReactNode;
}
