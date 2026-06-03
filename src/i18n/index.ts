import type { Direction, Locale } from '../types';

export interface Strings {
  play: string;
  pause: string;
  rewind10: string;
  forward10: string;
  prevEpisode: string;
  nextEpisode: string;
  mute: string;
  unmute: string;
  fullscreenEnter: string;
  fullscreenExit: string;
  settings: string;
  quality: string;
  qualityTitle: string;
  qualityAuto: string;
  speed: string;
  speedNormal: string;
  lock: string;
  unlock: string;
  playlist: string;
  resumeTitle: string;
  resumeCta: string;
  dismiss: string;
  skipAd: string;
  adLabel: string;
  back: string;
  loading: string;
}

const fa: Strings = {
  play: 'پخش',
  pause: 'توقف',
  rewind10: '۱۰ ثانیه عقب',
  forward10: '۱۰ ثانیه جلو',
  prevEpisode: 'قسمت قبل',
  nextEpisode: 'قسمت بعد',
  mute: 'بی‌صدا',
  unmute: 'صدا',
  fullscreenEnter: 'تمام‌صفحه',
  fullscreenExit: 'خروج از تمام‌صفحه',
  settings: 'تنظیمات',
  quality: 'کیفیت پخش',
  qualityTitle: 'تنظیمات کیفیت پخش',
  qualityAuto: 'اتوماتیک',
  speed: 'سرعت پخش',
  speedNormal: 'عادی',
  lock: 'قفل کنترل‌ها',
  unlock: 'باز کردن قفل',
  playlist: 'لیست پخش',
  resumeTitle: 'ادامه از جایی که متوقف شده بود',
  resumeCta: 'برو ادامه فیلم',
  dismiss: 'بستن',
  skipAd: 'رد کردن آگهی',
  adLabel: 'آگهی',
  back: 'بازگشت',
  loading: 'لطفاً صبر کنید …',
};

const en: Strings = {
  play: 'Play',
  pause: 'Pause',
  rewind10: 'Rewind 10s',
  forward10: 'Forward 10s',
  prevEpisode: 'Previous episode',
  nextEpisode: 'Next episode',
  mute: 'Mute',
  unmute: 'Unmute',
  fullscreenEnter: 'Fullscreen',
  fullscreenExit: 'Exit fullscreen',
  settings: 'Settings',
  quality: 'Quality',
  qualityTitle: 'Playback quality',
  qualityAuto: 'Auto',
  speed: 'Speed',
  speedNormal: 'Normal',
  lock: 'Lock controls',
  unlock: 'Unlock',
  playlist: 'Playlist',
  resumeTitle: 'Continue from where you left off',
  resumeCta: 'Resume',
  dismiss: 'Dismiss',
  skipAd: 'Skip ad',
  adLabel: 'Ad',
  back: 'Back',
  loading: 'Please wait …',
};

const TABLE: Record<Locale, Strings> = { fa, en };

export function getStrings(locale: Locale): Strings {
  return TABLE[locale] ?? en;
}

export function dirFor(locale: Locale, override?: Direction): Direction {
  if (override) return override;
  return locale === 'fa' ? 'rtl' : 'ltr';
}
