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
  qualityAuto: string;
  speed: string;
  lock: string;
  unlock: string;
  playlist: string;
  resumeTitle: string;
  resumeCta: string;
  dismiss: string;
  skipAd: string;
  adLabel: string;
  back: string;
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
  qualityAuto: 'خودکار',
  speed: 'سرعت',
  lock: 'قفل کنترل‌ها',
  unlock: 'باز کردن قفل',
  playlist: 'لیست پخش',
  resumeTitle: 'ادامه از جایی که متوقف شده بود',
  resumeCta: 'برو ادامه فیلم',
  dismiss: 'بستن',
  skipAd: 'رد کردن آگهی',
  adLabel: 'آگهی',
  back: 'بازگشت',
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
  qualityAuto: 'Auto',
  speed: 'Speed',
  lock: 'Lock controls',
  unlock: 'Unlock',
  playlist: 'Playlist',
  resumeTitle: 'Continue from where you left off',
  resumeCta: 'Resume',
  dismiss: 'Dismiss',
  skipAd: 'Skip ad',
  adLabel: 'Ad',
  back: 'Back',
};

const TABLE: Record<Locale, Strings> = { fa, en };

export function getStrings(locale: Locale): Strings {
  return TABLE[locale] ?? en;
}

export function dirFor(locale: Locale, override?: Direction): Direction {
  if (override) return override;
  return locale === 'fa' ? 'rtl' : 'ltr';
}
