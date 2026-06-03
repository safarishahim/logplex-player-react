import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  type MediaPlayerInstance,
} from '@vidstack/react';
import type { LogplexAnalyticsConfig, LogplexPlayerProps } from '../types';
import { dirFor, getStrings } from '../i18n';
import { useLogplexAnalytics } from '../analytics/useLogplexAnalytics';
import { useResume } from './useResume';
import { nativeFullscreenSupported, useSimulatedFullscreen } from './useSimulatedFullscreen';
import { Skin } from '../skin/Skin';
import { AdOverlay } from '../skin/overlays/AdOverlay';
import { NoticeBanner } from '../skin/overlays/NoticeBanner';

function themeStyle(theme: LogplexPlayerProps['theme']): CSSProperties {
  if (!theme) return {};
  const v: Record<string, string> = {};
  if (theme.accent) v['--lpx-accent'] = theme.accent;
  if (theme.accentContrast) v['--lpx-accent-contrast'] = theme.accentContrast;
  if (theme.surface) v['--lpx-surface'] = theme.surface;
  if (theme.text) v['--lpx-text'] = theme.text;
  if (theme.textMuted) v['--lpx-text-muted'] = theme.textMuted;
  if (theme.radius) v['--lpx-radius'] = theme.radius;
  return v as CSSProperties;
}

/**
 * Logplex video player. Wraps Vidstack with a custom RTL-aware skin, built-in
 * Logplex analytics, and a resume ("continue watching") banner. Accepts an
 * external HLS (.m3u8) or MP4 `src`, or a playlist of `episodes`.
 */
export function LogplexPlayer(props: LogplexPlayerProps): JSX.Element {
  const {
    episodes,
    currentEpisodeId,
    onEpisodeChange,
    locale = 'fa',
    dir,
    analytics,
    resume = true,
    onBack,
    className,
    theme,
    ad,
    notice,
    badge,
    fullscreenMode = 'auto',
    children,
  } = props;

  // Native fullscreen when available; CSS simulated otherwise (WebViews).
  const simulated =
    fullscreenMode === 'simulated' || (fullscreenMode !== 'native' && !nativeFullscreenSupported());
  const fs = useSimulatedFullscreen(simulated);

  const [player, setPlayer] = useState<MediaPlayerInstance | null>(null);
  const [adDone, setAdDone] = useState(false);

  // Resolve the active source (episode wins over the flat `src`).
  const episode = useMemo(() => {
    if (!episodes?.length) return undefined;
    return episodes.find((e) => e.id === currentEpisodeId) ?? episodes[0];
  }, [episodes, currentEpisodeId]);

  const src = episode?.src ?? props.src;
  const poster = episode?.poster ?? props.poster;
  const thumbnails = episode?.thumbnails ?? props.thumbnails;
  const title = props.title ?? episode?.title;
  const episodeLabel = props.episodeLabel ?? episode?.subtitle;

  // Episode navigation.
  const idx = episodes && episode ? episodes.indexOf(episode) : -1;
  const hasPrev = idx > 0;
  const hasNext = episodes != null && idx >= 0 && idx < episodes.length - 1;
  const goPrev = () => hasPrev && onEpisodeChange?.(episodes![idx - 1].id);
  const goNext = () => hasNext && onEpisodeChange?.(episodes![idx + 1].id);

  // Analytics config — default content duration from the episode.
  const analyticsCfg: LogplexAnalyticsConfig | undefined = useMemo(() => {
    if (!analytics) return undefined;
    return {
      ...analytics,
      contentDurationMs: analytics.contentDurationMs ?? episode?.durationMs,
      contentTitle: analytics.contentTitle ?? title,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analytics, episode?.durationMs, title]);

  // Pre-roll ad: play the ad source first, then switch to content.
  const showingAd = !!ad && !adDone;
  const adStarted = useRef(false);

  // Content analytics is suspended while the ad plays (player passed as null),
  // so ad playback doesn't register as content play/heartbeat.
  const tracker = useLogplexAnalytics(showingAd ? null : player, analyticsCfg);
  const { resume: resumePoint, dismiss } = useResume(tracker, resume && !!analyticsCfg && !ad);

  useEffect(() => {
    if (showingAd && tracker && !adStarted.current) {
      adStarted.current = true;
      tracker.track('ad_request');
      tracker.track('ad_start');
    }
  }, [showingAd, tracker]);

  const onAdEnd = useCallback(() => {
    tracker?.track('ad_complete');
    setAdDone(true);
  }, [tracker]);

  const onLike = useCallback(
    (liked: boolean) => {
      if (liked) tracker?.track('like');
      props.onLike?.(liked);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tracker, props.onLike],
  );

  const resolvedDir = dirFor(locale, dir);
  const strings = getStrings(locale);

  const containerClass = [
    'lpx-container',
    // RTL only right-aligns text; layout/operations stay physical (LTR).
    resolvedDir === 'rtl' ? 'lpx-rtl' : '',
    fs.active && !fs.rotate ? 'lpx-fs-sim' : '',
    fs.active && fs.rotate ? 'lpx-fs-sim lpx-fs-rotate' : '',
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={containerClass} style={themeStyle(theme)}>
      <MediaPlayer
        ref={setPlayer}
        className={`lpx-player${className ? ` ${className}` : ''}`}
        src={showingAd ? ad!.src : src ?? ''}
        title={title}
        playsInline
        crossOrigin
        muted={props.muted}
        autoPlay={props.autoPlay || !!ad}
        dir="ltr"
        viewType="video"
      >
        <MediaProvider>
          {poster && !showingAd && <Poster className="lpx-poster" src={poster} alt={title ?? ''} />}
        </MediaProvider>

        {showingAd ? (
          <AdOverlay
            strings={strings}
            skipAfterSec={ad!.skipAfterSec ?? 5}
            clickThrough={ad!.clickThrough}
            onEnd={onAdEnd}
          />
        ) : (
        <Skin
          strings={strings}
          dir={resolvedDir}
          title={title}
          episodeLabel={episodeLabel}
          thumbnails={thumbnails}
          hasPrev={hasPrev}
          hasNext={hasNext}
          onPrev={goPrev}
          onNext={goNext}
          onBack={onBack}
          episodes={episodes}
          currentEpisodeId={episode?.id}
          onSelectEpisode={onEpisodeChange}
          badge={badge}
          onLike={onLike}
          simulatedFullscreen={simulated}
          simIsFullscreen={fs.active}
          onToggleSimFullscreen={fs.toggle}
          resume={resumePoint}
          onDismissResume={dismiss}
        >
          {children}
        </Skin>
        )}

        {notice && !showingAd && <NoticeBanner notice={notice} strings={strings} />}
      </MediaPlayer>
    </div>
  );
}
