// Vidstack functional base styles (sliders, spinner, gestures) + our skin.
import '@vidstack/react/player/styles/base.css';
import './styles/player.css';

export { LogplexPlayer } from './player/LogplexPlayer';
export { LogplexAnalytics } from './analytics/client';
export type { ResumePoint, TrackFields } from './analytics/client';
export { useLogplexAnalytics } from './analytics/useLogplexAnalytics';
export { useResume } from './player/useResume';
export { getStrings, dirFor } from './i18n';
export type { Strings } from './i18n';
export type {
  LogplexPlayerProps,
  LogplexAnalyticsConfig,
  LogplexEventType,
  AdConfig,
  PlayerNotice,
  Episode,
  Quality,
  ThemeOverrides,
  Locale,
  Direction,
} from './types';
