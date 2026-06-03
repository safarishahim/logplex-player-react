import type { SVGProps } from 'react';

const Svg = (props: SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" aria-hidden="true" {...props} />
);

export const PlayIcon = () => (
  <Svg><path d="M8 5v14l11-7z" /></Svg>
);
export const PauseIcon = () => (
  <Svg><path d="M6 5h4v14H6zM14 5h4v14h-4z" /></Svg>
);
export const BackIcon = () => (
  <Svg><path d="M15.4 7.4 14 6l-6 6 6 6 1.4-1.4L10.8 12z" /></Svg>
);
export const Replay10Icon = () => (
  <Svg>
    <path d="M12 5V1L7 6l5 5V7a5 5 0 1 1-5 5H5a7 7 0 1 0 7-7z" />
    <text x="12" y="15.5" textAnchor="middle" fontSize="7" fill="currentColor">10</text>
  </Svg>
);
export const Forward10Icon = () => (
  <Svg>
    <path d="M12 5V1l5 5-5 5V7a5 5 0 1 0 5 5h2a7 7 0 1 1-7-7z" />
    <text x="12" y="15.5" textAnchor="middle" fontSize="7" fill="currentColor">10</text>
  </Svg>
);
export const PrevIcon = () => (
  <Svg><path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" /></Svg>
);
export const NextIcon = () => (
  <Svg><path d="M16 6h2v12h-2zM6 18l8.5-6L6 6z" /></Svg>
);
export const VolumeHighIcon = () => (
  <Svg><path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3a4.5 4.5 0 0 0-2.5-4v8a4.5 4.5 0 0 0 2.5-4zM14 3.2v2.1a7 7 0 0 1 0 13.4v2.1a9 9 0 0 0 0-17.6z" /></Svg>
);
export const VolumeMutedIcon = () => (
  <Svg><path d="M3 9v6h4l5 5V4L7 9H3zm18.3-.7L19.9 7l-2.4 2.4L15.1 7l-1.4 1.4 2.4 2.4-2.4 2.4 1.4 1.4 2.4-2.4 2.4 2.4 1.4-1.4-2.4-2.4z" /></Svg>
);
export const LockIcon = () => (
  <Svg><path d="M12 2a4 4 0 0 0-4 4v3H6v11h12V9h-2V6a4 4 0 0 0-4-4zm2 7h-4V6a2 2 0 1 1 4 0z" /></Svg>
);
export const UnlockIcon = () => (
  <Svg><path d="M12 2a4 4 0 0 0-4 4h2a2 2 0 1 1 4 0v3H6v11h12V9h-4V6a4 4 0 0 0-4-4z" opacity=".9" /></Svg>
);
export const FullscreenIcon = () => (
  <Svg><path d="M4 4h6v2H6v4H4zm10 0h6v6h-2V6h-4zM4 14h2v4h4v2H4zm14 0h2v6h-6v-2h4z" /></Svg>
);
export const FullscreenExitIcon = () => (
  <Svg><path d="M8 4H6v2H4v2h4zm12 2h-2V4h-2v4h4zM4 16h4v4h2v-6H4zm12 4h2v-2h2v-2h-4z" /></Svg>
);
export const SettingsIcon = () => (
  <Svg><path d="M19.4 13a7.8 7.8 0 0 0 0-2l2-1.6-2-3.4-2.4 1a7.6 7.6 0 0 0-1.7-1l-.4-2.6H10l-.4 2.6a7.6 7.6 0 0 0-1.7 1l-2.4-1-2 3.4L3.6 11a7.8 7.8 0 0 0 0 2l-2 1.6 2 3.4 2.4-1a7.6 7.6 0 0 0 1.7 1l.4 2.6h4l.4-2.6a7.6 7.6 0 0 0 1.7-1l2.4 1 2-3.4zM12 15a3 3 0 1 1 0-6 3 3 0 0 1 0 6z" /></Svg>
);
export const PlaylistIcon = () => (
  <Svg><path d="M3 6h12v2H3zm0 4h12v2H3zm0 4h8v2H3zm14-3 5 3-5 3z" /></Svg>
);
export const ReactionIcon = () => (
  <Svg><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16zM8.5 9a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 17.5c-2.3 0-4.3-1.4-5-3.5h10c-.7 2.1-2.7 3.5-5 3.5z" /></Svg>
);
export const CloseIcon = () => (
  <Svg><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" /></Svg>
);
