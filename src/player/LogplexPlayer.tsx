import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import {
  MediaPlayer,
  MediaProvider,
  Poster,
  Track,
  type MediaPlayerInstance,
} from '@vidstack/react';
import type { LogplexAnalyticsConfig, LogplexPlayerProps } from '../types';
import { dirFor, getStrings } from '../i18n';
import { useLogplexAnalytics } from '../analytics/useLogplexAnalytics';
import { useResume } from './useResume';
import { useVodSource } from './vod';
import { useWatchInterval } from './useWatchInterval';
import { usePersistentMediaSettings } from './prefs';
import { nativeFullscreenSupported, useSimulatedFullscreen } from './useSimulatedFullscreen';
import { Skin } from '../skin/Skin';
import { AdOverlay } from '../skin/overlays/AdOverlay';
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
    resolveResume,
    loading,
    persistSettings = false,
    settingsKey,
    onBack,
    className,
    theme,
    appearance,
    ad,
    ads,
    notice,
    restriction,
    badge,
    fullscreenOnPlay,
    fullscreenMode = 'auto',
    vodType = 'standard',
    vodCustomUrl,
    qualityValidate,
    onWatchInterval,
    watchIntervalMs,
    onPlayerReady,
    children,
  } = props;

  // Native fullscreen when available; CSS simulated otherwise (WebViews).
  const simulated =
    fullscreenMode === 'simulated' || (fullscreenMode !== 'native' && !nativeFullscreenSupported());
  const fs = useSimulatedFullscreen(simulated);

  const [player, setPlayer] = useState<MediaPlayerInstance | null>(null);

  // Ad breaks — normalize `ad` (legacy pre-roll) + `ads` into a positioned list.
  const adBreaks = useMemo(() => {
    const list: { id: string; offset: 'pre' | 'post' | number; src: string; skipAfterSec?: number; clickThrough?: string }[] = [];
    if (ad) list.push({ id: 'pre', offset: 'pre', src: ad.src, skipAfterSec: ad.skipAfterSec, clickThrough: ad.clickThrough });
    (ads ?? []).forEach((b, i) =>
      list.push({ id: `ads-${i}`, offset: b.offset ?? 'pre', src: b.src, skipAfterSec: b.skipAfterSec, clickThrough: b.clickThrough }),
    );
    return list;
  }, [ad, ads]);
  const hasPreRoll = adBreaks.some((b) => b.offset === 'pre');

  const [playedAds, setPlayedAds] = useState<Set<string>>(() => new Set());
  const [activeAdId, setActiveAdId] = useState<string | null>(null);
  const activeAd = adBreaks.find((b) => b.id === activeAdId) ?? null;
  const showingAd = !!activeAd;
  const pendingAdPlay = useRef(false);
  const resumeAfterAd = useRef<number | null>(null);
  const wasPlaying = useRef(false);
  const prevEpisodeId = useRef<string | undefined>(undefined);
  const forcePlayNext = useRef(false);
  const episodeNav = useRef<{ hasNext: boolean; goNext: () => void }>({ hasNext: false, goNext: () => {} });
  // Snapshot for the player subscription (avoids stale closures).
  const adState = useRef({ adBreaks, playedAds, activeAdId });
  adState.current = { adBreaks, playedAds, activeAdId };

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
    if (!player) return;
    // An ad just loaded → start it.
    if (pendingAdPlay.current) {
      pendingAdPlay.current = false;
      player.play();
      return;
    }
    // Content (re)loaded after a quality switch or an ad → restore position.
    if (restore.current) {
      player.currentTime = restore.current.time;
      if (restore.current.play) player.play();
      restore.current = null;
    }
  }, [player]);

  // Pass the URL string (Vidstack infers the MIME type from the extension);
  // an explicit `type` on the source is advisory metadata.
  const activeSource = sourceList ? sourceList[Math.min(qualityIdx, sourceList.length - 1)] : null;
  const src = activeSource ? activeSource.src : (rawSrc as string | undefined);

  // Provider resolution: non-`standard` sources exchange the play token for the
  // real URL (+ scrub thumbnails). `standard` and manual MP4 lists pass through.
  const vod = useVodSource(sourceList ? undefined : src, vodType, vodCustomUrl);
  const resolvedSrc = vodType !== 'standard' && !sourceList ? vod.src ?? '' : src;
  const resolvedThumbnails = (vodType !== 'standard' ? vod.thumbnails : undefined) ?? thumbnails;

  // Episode navigation.
  const idx = episodes && episode ? episodes.indexOf(episode) : -1;
  const hasPrev = idx > 0;
  const hasNext = episodes != null && idx >= 0 && idx < episodes.length - 1;
  const goPrev = () => hasPrev && onEpisodeChange?.(episodes![idx - 1].id);
  const goNext = () => hasNext && onEpisodeChange?.(episodes![idx + 1].id);
  episodeNav.current = { hasNext, goNext };

  // Switching episodes: resume playback automatically if it was already playing
  // (so the new episode plays without a separate tap, and the poster hides).
  // Auto-advance (episode ended → next) forces play.
  useEffect(() => {
    const epId = episode?.id;
    if (prevEpisodeId.current === undefined) {
      prevEpisodeId.current = epId;
      return; // initial mount — leave the cover/poster behaviour to the skin
    }
    if (epId !== prevEpisodeId.current) {
      prevEpisodeId.current = epId;
      restore.current = { time: 0, play: wasPlaying.current || forcePlayNext.current };
      forcePlayNext.current = false;
    }
  }, [episode?.id]);

  // Analytics config — default content duration from the episode.
  const analyticsCfg: LogplexAnalyticsConfig | undefined = useMemo(() => {
    if (!analytics) return undefined;
    return {
      ...analytics,
      // Per-episode content id so reports change when the episode changes.
      contentId: episode?.contentId ?? analytics.contentId,
      contentDurationMs: analytics.contentDurationMs ?? episode?.durationMs,
      contentTitle: analytics.contentTitle ?? title,
    };
  }, [analytics, episode?.contentId, episode?.durationMs, title]);

  // Content analytics is suspended while an ad plays (player passed as null),
  // so ad playback doesn't register as content play/heartbeat.
  const tracker = useLogplexAnalytics(showingAd ? null : player, analyticsCfg);
  const { resume: resumePoint, dismiss } = useResume(
    tracker,
    resume && !hasPreRoll && (!!resolveResume || !!analyticsCfg),
    resolveResume,
  );

  // Opt-in: remember volume / mute / playback rate across sessions.
  usePersistentMediaSettings(showingAd ? null : player, persistSettings, settingsKey);

  // External (pre-Logplex) watch heartbeat — suspended during ads, like analytics.
  useWatchInterval(showingAd ? null : player, onWatchInterval, watchIntervalMs);

  // Expose the underlying Vidstack instance for imperative host control.
  useEffect(() => {
    if (!onPlayerReady) return;
    onPlayerReady(player);
    return () => onPlayerReady(null);
  }, [player, onPlayerReady]);

  // Native fullscreen on touch devices: lock the screen to the video's
  // orientation (landscape for landscape videos). WebViews without a native
  // Fullscreen API use the CSS simulated-rotation path instead (see above).
  useEffect(() => {
    if (!player || simulated) return;
    const coarse = typeof window !== 'undefined' && !!window.matchMedia?.('(pointer: coarse)')?.matches;
    const orientation =
      typeof screen !== 'undefined'
        ? (screen.orientation as (ScreenOrientation & { lock?: (o: string) => Promise<void> }) | undefined)
        : undefined;
    if (!coarse || !orientation?.lock) return;

    const onFsChange = (e: Event) => {
      const isFs = (e as CustomEvent<boolean>).detail;
      if (!isFs) {
        orientation.unlock?.();
        return;
      }
      const { mediaWidth: w, mediaHeight: h } = player.state;
      const portraitVideo = !!w && !!h && h > w;
      orientation.lock?.(portraitVideo ? 'portrait' : 'landscape').catch(() => undefined);
    };

    player.addEventListener('fullscreen-change', onFsChange);
    return () => {
      player.removeEventListener('fullscreen-change', onFsChange);
      orientation.unlock?.();
    };
  }, [player, simulated]);

  // Pre-roll: start the first unplayed 'pre' break once a player exists.
  useEffect(() => {
    if (!player || adState.current.activeAdId) return;
    const pre = adBreaks.find((b) => b.offset === 'pre' && !adState.current.playedAds.has(b.id));
    if (pre) {
      resumeAfterAd.current = 0;
      pendingAdPlay.current = true;
      setActiveAdId(pre.id);
    }
  }, [player, adBreaks]);

  // Mid-roll (content second reached) + post-roll (content ended) scheduling.
  useEffect(() => {
    if (!player) return;
    return player.subscribe(({ currentTime, ended, paused }) => {
      const { adBreaks: list, playedAds: played, activeAdId: active } = adState.current;
      if (active) return; // an ad is already playing
      wasPlaying.current = !paused; // remember content play state for episode switches
      const mid = list.find((b) => typeof b.offset === 'number' && !played.has(b.id) && currentTime >= (b.offset as number));
      if (mid) {
        resumeAfterAd.current = currentTime;
        pendingAdPlay.current = true;
        player.pause();
        setActiveAdId(mid.id);
        return;
      }
      if (ended) {
        const post = list.find((b) => b.offset === 'post' && !played.has(b.id));
        if (post) {
          resumeAfterAd.current = null; // content stays ended after a post-roll
          pendingAdPlay.current = true;
          setActiveAdId(post.id);
          return;
        }
        // No (remaining) post-roll → auto-advance to the next episode and play it.
        if (episodeNav.current.hasNext) {
          forcePlayNext.current = true;
          episodeNav.current.goNext();
        }
      }
    });
  }, [player]);

  // Fire ad analytics when a break becomes active.
  useEffect(() => {
    if (activeAdId && tracker) {
      tracker.track('ad_request');
      tracker.track('ad_start');
    }
  }, [activeAdId, tracker]);

  const onAdEnd = useCallback(() => {
    tracker?.track('ad_complete');
    // Arm the content resume (seek + play on the next canplay) before switching
    // the source back; post-rolls leave it null so the content stays ended.
    if (resumeAfterAd.current != null) restore.current = { time: resumeAfterAd.current, play: true };
    resumeAfterAd.current = null;
    setActiveAdId((cur) => {
      if (cur) setPlayedAds((prev) => new Set(prev).add(cur));
      return null;
    });
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

  // Simulated fullscreen: promote the container to the browser top layer so no
  // host stacking context can paint over it. Progressive enhancement — falls
  // back to the max z-index on browsers without the popover API.
  const containerRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = containerRef.current as (HTMLDivElement & { showPopover?: () => void; hidePopover?: () => void }) | null;
    if (!el || !simulated || typeof el.showPopover !== 'function') return;
    if (fs.active) {
      try {
        if (!el.hasAttribute('popover')) el.setAttribute('popover', 'manual');
        el.showPopover();
      } catch {
        /* unsupported state — z-index fallback still applies */
      }
    } else if (el.hasAttribute('popover')) {
      try {
        el.hidePopover();
      } catch {
        /* ignore */
      }
      el.removeAttribute('popover');
    }
  }, [simulated, fs.active]);

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
    <div ref={containerRef} className={containerClass} style={themeStyle(theme)}>
      <MediaPlayer
        ref={setPlayer}
        className={`lpx-player${className ? ` ${className}` : ''}`}
        src={showingAd ? activeAd!.src : resolvedSrc ?? ''}
        title={title}
        playsInline
        crossOrigin
        muted={props.muted}
        autoPlay={props.autoPlay || hasPreRoll}
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

        {showingAd ? (
          <AdOverlay
            key={activeAd!.id}
            strings={strings}
            skipAfterSec={activeAd!.skipAfterSec ?? 5}
            clickThrough={activeAd!.clickThrough}
            onEnd={onAdEnd}
          />
        ) : (
        <Skin
          strings={strings}
          dir={resolvedDir}
          title={title}
          episodeLabel={episodeLabel}
          thumbnails={resolvedThumbnails}
          qualityValidate={qualityValidate}
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
          liked={props.liked}
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
          notice={restriction ? undefined : notice}
          badge={restriction ? undefined : badge}
        >
          {children}
        </Skin>
        )}

        {restriction && <RestrictionOverlay restriction={restriction} strings={strings} />}

        {/* Host- or provider-driven loading (resolving the source, fetching ads,
            etc.) — sits above the cover/skin so it's visible before playback. */}
        {(loading || vod.isLoading) && !showingAd && (
          <div className="lpx-spinner lpx-spinner--overlay" role="status" aria-live="polite">
            <span className="lpx-spinner-ring" />
            <span className="lpx-spinner-text">{strings.loading}</span>
          </div>
        )}
      </MediaPlayer>
    </div>
  );
}
