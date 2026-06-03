import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
  Captions,
  type MediaPlayerInstance,
} from '@vidstack/react';
import type { LogplexAnalyticsConfig, LogplexPlayerProps } from '../types';
import { dirFor, getStrings } from '../i18n';
import { useLogplexAnalytics } from '../analytics/useLogplexAnalytics';
import { useResume } from './useResume';
import { usePersistentMediaSettings } from './prefs';
import { nativeFullscreenSupported, useSimulatedFullscreen } from './useSimulatedFullscreen';
import { Skin } from '../skin/Skin';
import { AdOverlay } from '../skin/overlays/AdOverlay';
import { NoticeBanner } from '../skin/overlays/NoticeBanner';
import { BadgeOverlay } from '../skin/overlays/BadgeOverlay';
import { RestrictionOverlay } from '../skin/overlays/RestrictionOverlay';

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
    persistSettings = false,
    settingsKey,
    onBack,
    className,
    theme,
    appearance,
    ad,
    notice,
    restriction,
    badge,
    fullscreenOnPlay,
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

  const rawSrc = episode?.src ?? props.src;
  const poster = episode?.poster ?? props.poster;
  const thumbnails = episode?.thumbnails ?? props.thumbnails;
  const title = props.title ?? episode?.title;
  const episodeLabel = props.episodeLabel ?? episode?.subtitle;

  // Manual quality: when `src` is a list of MP4 renditions, the quality menu
  // switches the file (HLS exposes its own renditions automatically).
  const sourceList = Array.isArray(rawSrc) ? rawSrc : null;
  const defaultQualityIdx = useMemo(() => {
    if (!sourceList) return 0;
    return sourceList.reduce((best, s, i) => ((s.height ?? 0) > (sourceList[best].height ?? 0) ? i : best), 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sourceList]);
  const [qualityIdx, setQualityIdx] = useState(defaultQualityIdx);
  useEffect(() => setQualityIdx(defaultQualityIdx), [defaultQualityIdx]);

  const manualQualities = sourceList
    ? sourceList.map((s, i) => ({ label: s.label ?? (s.height ? `${s.height}p` : `${i + 1}`), index: i }))
    : undefined;

  // Switch source but keep position + play state.
  const restore = useRef<{ time: number; play: boolean } | null>(null);
  const selectQuality = useCallback(
    (i: number) => {
      if (player) restore.current = { time: player.currentTime, play: !player.paused };
      setQualityIdx(i);
    },
    [player],
  );
  const handleCanPlay = useCallback(() => {
    if (restore.current && player) {
      player.currentTime = restore.current.time;
      if (restore.current.play) player.play();
      restore.current = null;
    }
  }, [player]);

  // Pass the URL string (Vidstack infers the MIME type from the extension);
  // an explicit `type` on the source is advisory metadata.
  const activeSource = sourceList ? sourceList[Math.min(qualityIdx, sourceList.length - 1)] : null;
  const src = activeSource ? activeSource.src : (rawSrc as string | undefined);

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

  // Opt-in: remember volume / mute / playback rate across sessions.
  usePersistentMediaSettings(showingAd ? null : player, persistSettings, settingsKey);

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

  // A restriction blocks playback — pause immediately and keep it paused
  // (guards against autoplay/keyboard) until the restriction is cleared.
  useEffect(() => {
    if (!restriction || !player) return;
    player.pause();
    return player.subscribe(({ paused }) => {
      if (!paused) player.pause();
    });
  }, [restriction, player]);

  const resolvedDir = dirFor(locale, dir);
  const strings = getStrings(locale);

  const containerClass = [
    'lpx-container',
    // RTL only right-aligns text; layout/operations stay physical (LTR).
    resolvedDir === 'rtl' ? 'lpx-rtl' : '',
    appearance === 'light' ? 'lpx-light' : '',
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
        onCanPlay={handleCanPlay}
      >
        <MediaProvider>
          {poster && !showingAd && <Poster className="lpx-poster" src={poster} alt={title ?? ''} />}
          {!showingAd &&
            props.subtitles?.map((s) => (
              <Track
                key={s.src}
                src={s.src}
                kind={s.kind ?? 'subtitles'}
                label={s.label}
                lang={s.language}
                default={s.default}
              />
            ))}
        </MediaProvider>

        {/* Renders the active subtitle/caption cues above the video. */}
        {!showingAd && <Captions className="lpx-captions" />}

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
          fullscreenOnPlay={fullscreenOnPlay}
          onLike={onLike}
          simulatedFullscreen={simulated}
          simIsFullscreen={fs.active}
          onToggleSimFullscreen={fs.toggle}
          resume={resumePoint}
          onDismissResume={dismiss}
          persistSettings={persistSettings}
          settingsKey={settingsKey}
          manualQualities={manualQualities}
          currentQualityIndex={qualityIdx}
          onSelectQuality={selectQuality}
        >
          {children}
        </Skin>
        )}

        {notice && !showingAd && !restriction && <NoticeBanner notice={notice} strings={strings} />}
        {badge && !showingAd && !restriction && <BadgeOverlay key={badge} text={badge} />}
        {restriction && <RestrictionOverlay restriction={restriction} strings={strings} />}
      </MediaPlayer>
    </div>
  );
}
