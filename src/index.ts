// Vidstack functional base styles (sliders, spinner, gestures) + our skin.
import '@vidstack/react/player/styles/base.css';
import './styles/player.css';

export { LogplexPlayer } from './player/LogplexPlayer';
export { LogplexAnalytics } from './analytics/client';
export type { ResumePoint, TrackFields } from './analytics/client';
export { useLogplexAnalytics } from './analytics/useLogplexAnalytics';
export { useResume } from './player/useResume';
export { useWatchInterval } from './player/useWatchInterval';
export { useVodSource } from './player/vod';
export type { ResolvedVodSource } from './player/vod';
export { getStrings, dirFor } from './i18n';
export type { Strings } from './i18n';
export type { MediaPlayerInstance } from '@vidstack/react';
export type {
  LogplexPlayerProps,
  LogplexAnalyticsConfig,
  LogplexEventType,
  AdConfig,
  AdBreak,
  SubtitleTrack,
  PlayerNotice,
  PlayerRestriction,
  Episode,
  VideoSource,
  Quality,
  ThemeOverrides,
  Locale,
  Direction,
  VodProvider,
  VodCustomUrl,
  WatchIntervalInfo,
  WatchIntervalHandler,
} from './types';
