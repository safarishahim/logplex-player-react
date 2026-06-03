// Player-grade icons from Vidstack's media-icons set, re-exported under the
// names the skin uses. Single source of truth so swapping an icon is one line.
import type { SVGProps } from 'react';

export {
  PlayIcon,
  PauseIcon,
  NextIcon,
  PreviousIcon as PrevIcon,
  ArrowLeftIcon as BackIcon,
  SeekBackward10Icon as Replay10Icon,
  SeekForward10Icon as Forward10Icon,
  VolumeHighIcon,
  MuteIcon as VolumeMutedIcon,
  LockClosedIcon as LockIcon,
  LockOpenIcon as UnlockIcon,
  FullscreenIcon,
  FullscreenExitIcon,
  SettingsIcon,
  PlaylistIcon,
  XMarkIcon as CloseIcon,
  HeartIcon as LikeIcon,
  SunIcon as BrightnessIcon,
  OdometerIcon as SpeedIcon,
  InfoIcon,
} from '@vidstack/react/icons';

/** Solid heart — shown when the Like button is active (Vidstack ships only the outline). */
export function LikeFilledIcon(props: SVGProps<SVGSVGElement>): JSX.Element {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" {...props}>
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  );
}
