import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Captions, Time, TimeSlider, VolumeSlider, useMediaRemote, useMediaState } from '@vidstack/react';
import type { Direction, Episode } from '../types';
import type { Strings } from '../i18n';
import type { ResumePoint } from '../analytics/client';
import { PlaylistPanel } from './overlays/PlaylistPanel';
import {
  AudioIcon, BackIcon, CaptionsIcon, CaptionsOnIcon, CloseIcon, Forward10Icon, FullscreenExitIcon, FullscreenIcon,
  LikeFilledIcon, LikeIcon, LockIcon, NextIcon, PauseIcon, PlayIcon, PlaylistIcon, PrevIcon, Replay10Icon,
  VolumeHighIcon, VolumeMutedIcon,
} from './controls/icons';
import { SettingsModal } from './controls/SettingsModal';
import { SpeedModal } from './controls/SpeedModal';
import { CaptionsModal } from './controls/CaptionsModal';
import { AudioModal } from './controls/AudioModal';
import { GestureLayer } from './GestureLayer';

export interface SkinProps {
  strings: Strings;
  dir: Direction;
  title?: string;
  episodeLabel?: string;
  thumbnails?: string;
  hasPrev?: boolean;
  hasNext?: boolean;
  onPrev?: () => void;
  onNext?: () => void;
  onBack?: () => void;
  fullscreenOnPlay?: boolean;
  episodes?: Episode[];
  currentEpisodeId?: string;
  onSelectEpisode?: (id: string) => void;
  onLike?: (liked: boolean) => void;
  /** When true, the fullscreen button uses the simulated (CSS) path. */
  simulatedFullscreen?: boolean;
  simIsFullscreen?: boolean;
  onToggleSimFullscreen?: () => void;
  resume?: ResumePoint | null;
  onDismissResume?: () => void;
  /** Persist brightness (and other settings) across sessions. */
  persistSettings?: boolean;
  settingsKey?: string;
  /** Manual quality options (MP4 renditions). When set, the quality menu uses
   * these instead of the source's auto-detected (HLS) qualities. */
  manualQualities?: { label: string; index: number }[];
  currentQualityIndex?: number;
  onSelectQuality?: (index: number) => void;
  children?: ReactNode;
}

const IDLE_MS = 3000;

export function Skin(props: SkinProps): JSX.Element {
  const remote = useMediaRemote();
  const paused = useMediaState('paused');
  const muted = useMediaState('muted');
  const volume = useMediaState('volume');
  const fullscreen = useMediaState('fullscreen');
  const waiting = useMediaState('waiting');
  const canPlay = useMediaState('canPlay');
  const currentTime = useMediaState('currentTime');
  const quality = useMediaState('quality');
  const autoQuality = useMediaState('autoQuality');
  const playbackRate = useMediaState('playbackRate');
  const started = useMediaState('started');
  const textTracks = useMediaState('textTracks');
  const textTrack = useMediaState('textTrack');
  const audioTracks = useMediaState('audioTracks');

  const [locked, setLocked] = useState(false);
  const [active, setActive] = useState(true);
  const [liked, setLiked] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const [captionsOpen, setCaptionsOpen] = useState(false);
  const [audioOpen, setAudioOpen] = useState(false);
  const [playRequested, setPlayRequested] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasPlaylist = (props.episodes?.length ?? 0) > 1;
  const subtitleTracks = (textTracks ?? []).filter((t) => t.kind === 'subtitles' || t.kind === 'captions');
  const hasCaptions = subtitleTracks.length > 0;
  const hasAudioTracks = (audioTracks?.length ?? 0) > 1;
  const visible = paused || active || !canPlay;
  const isMuted = muted || volume === 0;
  const manualQuality = props.manualQualities?.find((q) => q.index === props.currentQualityIndex);
  const qualityLabel = manualQuality
    ? manualQuality.label
    : autoQuality || !quality
      ? 'AUTO'
      : `${quality.height}p`;
  const rateLabel = `${playbackRate || 1}X`;

  const ping = useCallback(() => {
    setActive(true);
    if (idleTimer.current) clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => setActive(false), IDLE_MS);
  }, []);

  useEffect(() => {
    ping();
    return () => {
      if (idleTimer.current) clearTimeout(idleTimer.current);
    };
  }, [ping]);

  const toggleControls = useCallback(() => setActive((a) => !a), []);

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    props.onLike?.(next);
  };

  const fsActive = props.simulatedFullscreen ? !!props.simIsFullscreen : fullscreen;
  const toggleFullscreen = () =>
    props.simulatedFullscreen ? props.onToggleSimFullscreen?.() : remote.toggleFullscreen();

  // Locked overlay: a single button to unlock; controls hidden.
  if (locked) {
    return (
      <div className="lpx-controls lpx-controls--locked" data-visible="true">
        <button className="lpx-btn lpx-lock-toggle" aria-label={props.strings.unlock} onClick={() => setLocked(false)}>
          <LockIcon />
        </button>
        {props.children}
      </div>
    );
  }

  // Cover (pre-play): just the poster + a single play button. Tapping play
  // starts playback and enters fullscreen. We dismiss the cover on tap rather
  // than waiting for the media 'started' event, so it can't get stuck if the
  // source stalls or the event lags.
  if (!started && !playRequested) {
    return (
      <button
        className="lpx-cover"
        aria-label={props.strings.play}
        onClick={() => {
          setPlayRequested(true);
          remote.play();
          if (props.fullscreenOnPlay && !fsActive) toggleFullscreen();
        }}
      >
        <span className="lpx-cover-play">
          <PlayIcon />
        </span>
      </button>
    );
  }

  return (
    <>
      <GestureLayer
        strings={props.strings}
        onTapToggle={toggleControls}
        onActivity={ping}
        persist={props.persistSettings}
        storageKey={props.settingsKey}
      />

      {/* Subtitle cues — lifted above the control bar while it's visible. */}
      <Captions className={`lpx-captions${visible ? ' lpx-captions--lifted' : ''}`} />

      {/* Buffering / loading — outside the fading controls so it always shows. */}
      {(waiting || !canPlay) && (
        <div className="lpx-spinner" role="status" aria-live="polite">
          <span className="lpx-spinner-ring" />
          <span className="lpx-spinner-text">{props.strings.loading}</span>
        </div>
      )}

      {/* Persistent mute badge while controls are hidden. */}
      {!visible && isMuted && (
        <div className="lpx-mute-badge" aria-hidden="true">
          <VolumeMutedIcon />
        </div>
      )}

      <div
        className="lpx-controls"
        data-visible={visible ? 'true' : 'false'}
        onPointerMove={ping}
        onPointerDown={ping}
      >
        {/* Top bar */}
        <div className="lpx-topbar">
          {props.onBack && (
            <button className="lpx-btn" aria-label={props.strings.back} onClick={props.onBack}>
              <BackIcon />
            </button>
          )}
          <span className="lpx-grow" />
          {hasAudioTracks && (
            <button
              className="lpx-btn"
              aria-label={props.strings.audioTrack}
              aria-expanded={audioOpen}
              onClick={() => setAudioOpen(true)}
            >
              <AudioIcon />
            </button>
          )}
          {hasCaptions && (
            <button
              className="lpx-btn"
              aria-label={props.strings.captions}
              aria-pressed={!!textTrack}
              data-on={!!textTrack || undefined}
              aria-expanded={captionsOpen}
              onClick={() => setCaptionsOpen(true)}
            >
              {textTrack ? <CaptionsOnIcon /> : <CaptionsIcon />}
            </button>
          )}
          <button
            className="lpx-btn lpx-quality-btn"
            aria-label={props.strings.quality}
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen(true)}
          >
            <span className="lpx-quality-label">{qualityLabel}</span>
          </button>
          {props.onLike && (
            <button className="lpx-btn lpx-like" aria-label="like" aria-pressed={liked} data-liked={liked || undefined} onClick={toggleLike}>
              {liked ? <LikeFilledIcon /> : <LikeIcon />}
              {liked && (
                <span className="lpx-like-burst" aria-hidden="true">
                  <span className="lpx-like-ring" />
                  {[0, 60, 120, 180, 240, 300].map((a) => (
                    <i key={a} style={{ ['--a' as string]: `${a}deg` }} />
                  ))}
                </span>
              )}
            </button>
          )}
          {hasPlaylist && (
            <button
              className="lpx-btn"
              aria-label={props.strings.playlist}
              aria-expanded={playlistOpen}
              onClick={() => setPlaylistOpen((o) => !o)}
            >
              <PlaylistIcon />
            </button>
          )}
        </div>

        {/* Resume banner */}
        {props.resume && (
          <div className="lpx-resume">
            <div className="lpx-resume-card">
              <span className="lpx-resume-text">{props.strings.resumeTitle}</span>
              <button
                className="lpx-resume-go"
                onClick={() => {
                  remote.seek(props.resume!.positionSeconds);
                  remote.play();
                  props.onDismissResume?.();
                }}
              >
                {props.strings.resumeCta}
              </button>
              <button className="lpx-btn" aria-label={props.strings.dismiss} onClick={() => props.onDismissResume?.()}>
                <CloseIcon />
              </button>
            </div>
          </div>
        )}

        {/* Bottom bar */}
        <div className="lpx-bottom">
          {/* Above the scrubber: time (left) + title/episode (right). */}
          <div className="lpx-aboverow">
            <span className="lpx-time">
              <Time type="current" /> / <Time type="duration" />
            </span>
            {(props.title || props.episodeLabel) && (
              <div className="lpx-title">
                {props.title && <b>{props.title}</b>}
                {props.episodeLabel && <span>{props.episodeLabel}</span>}
              </div>
            )}
          </div>

          <TimeSlider.Root className="lpx-slider">
            <TimeSlider.Track className="lpx-track">
              <TimeSlider.Progress className="lpx-track-progress" />
              <TimeSlider.TrackFill className="lpx-track-fill" />
            </TimeSlider.Track>
            <TimeSlider.Thumb className="lpx-thumb" />
            <TimeSlider.Preview className="lpx-preview">
              {props.thumbnails && (
                <TimeSlider.Thumbnail.Root className="lpx-thumbnail" src={props.thumbnails}>
                  <TimeSlider.Thumbnail.Img />
                </TimeSlider.Thumbnail.Root>
              )}
              <TimeSlider.Value className="lpx-preview-time" />
            </TimeSlider.Preview>
          </TimeSlider.Root>

          <div className="lpx-buttons">
            {/* Left: lock + speed */}
            <div className="lpx-group">
              <button className="lpx-btn" aria-label={props.strings.lock} onClick={() => setLocked(true)}>
                <LockIcon />
              </button>
              <button
                className="lpx-btn lpx-speed-btn"
                aria-label={props.strings.speed}
                aria-expanded={speedOpen}
                onClick={() => setSpeedOpen(true)}
              >
                <span className="lpx-speed-label">{rateLabel}</span>
              </button>
            </div>

            {/* Center: transport */}
            <div className="lpx-group lpx-group--center">
              {hasPlaylist && (
                <button
                  className="lpx-btn"
                  aria-label={props.strings.prevEpisode}
                  disabled={!props.hasPrev}
                  onClick={props.onPrev}
                >
                  <PrevIcon />
                </button>
              )}
              <button
                className="lpx-btn"
                aria-label={props.strings.rewind10}
                onClick={() => remote.seek(Math.max(0, currentTime - 10))}
              >
                <Replay10Icon />
              </button>
              <button
                className="lpx-btn lpx-bigplay"
                aria-label={paused ? props.strings.play : props.strings.pause}
                onClick={() => remote.togglePaused()}
              >
                {paused ? <PlayIcon /> : <PauseIcon />}
              </button>
              <button
                className="lpx-btn"
                aria-label={props.strings.forward10}
                onClick={() => remote.seek(currentTime + 10)}
              >
                <Forward10Icon />
              </button>
              {hasPlaylist && (
                <button
                  className="lpx-btn"
                  aria-label={props.strings.nextEpisode}
                  disabled={!props.hasNext}
                  onClick={props.onNext}
                >
                  <NextIcon />
                </button>
              )}
            </div>

            {/* Right: fullscreen + volume */}
            <div className="lpx-group">
              <button
                className="lpx-btn"
                aria-label={fsActive ? props.strings.fullscreenExit : props.strings.fullscreenEnter}
                onClick={toggleFullscreen}
              >
                {fsActive ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </button>
              <div className="lpx-volume">
                <button
                  className="lpx-btn"
                  aria-label={isMuted ? props.strings.unmute : props.strings.mute}
                  onClick={() => remote.toggleMuted()}
                >
                  {isMuted ? <VolumeMutedIcon /> : <VolumeHighIcon />}
                </button>
                {/* Desktop: hover-expand volume slider. Mobile uses swipe. */}
                <VolumeSlider.Root className="lpx-vol-slider" aria-label={props.strings.mute}>
                  <VolumeSlider.Track className="lpx-vol-track">
                    <VolumeSlider.TrackFill className="lpx-vol-fill" />
                  </VolumeSlider.Track>
                  <VolumeSlider.Thumb className="lpx-vol-thumb" />
                </VolumeSlider.Root>
              </div>
            </div>
          </div>
        </div>

        {playlistOpen && props.episodes && (
          <PlaylistPanel
            episodes={props.episodes}
            currentId={props.currentEpisodeId}
            onSelect={(id) => props.onSelectEpisode?.(id)}
            onClose={() => setPlaylistOpen(false)}
            strings={props.strings}
          />
        )}

        {props.children}
      </div>

      {settingsOpen && (
        <SettingsModal
          strings={props.strings}
          onClose={() => setSettingsOpen(false)}
          manualQualities={props.manualQualities}
          currentQualityIndex={props.currentQualityIndex}
          onSelectQuality={props.onSelectQuality}
        />
      )}
      {speedOpen && <SpeedModal strings={props.strings} onClose={() => setSpeedOpen(false)} />}
      {captionsOpen && <CaptionsModal strings={props.strings} onClose={() => setCaptionsOpen(false)} />}
      {audioOpen && <AudioModal strings={props.strings} onClose={() => setAudioOpen(false)} />}
    </>
  );
}
