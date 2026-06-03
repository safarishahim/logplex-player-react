import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import { Time, TimeSlider, VolumeSlider, useMediaRemote, useMediaState } from '@vidstack/react';
import type { Direction, Episode } from '../types';
import type { Strings } from '../i18n';
import type { ResumePoint } from '../analytics/client';
import { PlaylistPanel } from './overlays/PlaylistPanel';
import {
  BackIcon, CloseIcon, Forward10Icon, FullscreenExitIcon, FullscreenIcon, LikeIcon, LockIcon,
  NextIcon, PauseIcon, PlayIcon, PlaylistIcon, PrevIcon, Replay10Icon, VolumeHighIcon, VolumeMutedIcon,
} from './controls/icons';
import { SettingsModal } from './controls/SettingsModal';
import { SpeedModal } from './controls/SpeedModal';
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

  const [locked, setLocked] = useState(false);
  const [active, setActive] = useState(true);
  const [liked, setLiked] = useState(false);
  const [playlistOpen, setPlaylistOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [speedOpen, setSpeedOpen] = useState(false);
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hasPlaylist = (props.episodes?.length ?? 0) > 1;
  const visible = paused || active || !canPlay;
  const isMuted = muted || volume === 0;
  const qualityLabel = autoQuality || !quality ? 'AUTO' : `${quality.height}p`;
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

  return (
    <>
      <GestureLayer strings={props.strings} onTapToggle={toggleControls} onActivity={ping} />
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
          <div className="lpx-title">
            {props.title && <b>{props.title}</b>}
            {props.episodeLabel && <span>{props.episodeLabel}</span>}
          </div>
          <button
            className="lpx-btn lpx-quality-btn"
            aria-label={props.strings.quality}
            aria-expanded={settingsOpen}
            onClick={() => setSettingsOpen(true)}
          >
            <span className="lpx-quality-label">{qualityLabel}</span>
          </button>
          {props.onLike && (
            <button className="lpx-btn" aria-label="like" aria-pressed={liked} data-liked={liked || undefined} onClick={toggleLike}>
              <LikeIcon />
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

        {/* Buffering spinner */}
        {waiting && (
          <div className="lpx-spinner" aria-hidden="true">
            <span className="lpx-spinner-ring" />
          </div>
        )}

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
          <div className="lpx-meta">
            <span>
              <Time type="current" /> / <Time type="duration" />
            </span>
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
              {props.hasPrev && (
                <button className="lpx-btn" aria-label={props.strings.prevEpisode} onClick={props.onPrev}>
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
              {props.hasNext && (
                <button className="lpx-btn" aria-label={props.strings.nextEpisode} onClick={props.onNext}>
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

      {settingsOpen && <SettingsModal strings={props.strings} onClose={() => setSettingsOpen(false)} />}
      {speedOpen && <SpeedModal strings={props.strings} onClose={() => setSpeedOpen(false)} />}
    </>
  );
}
