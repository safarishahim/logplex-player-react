import { describe, it, expect } from 'vitest';
import { getStrings, dirFor } from './index';

describe('i18n', () => {
  it('returns Persian strings for fa', () => {
    expect(getStrings('fa').play).toBe('پخش');
  });

  it('returns English strings for en', () => {
    expect(getStrings('en').play).toBe('Play');
  });

  it('falls back to English for an unknown locale', () => {
    // @ts-expect-error testing an invalid locale at runtime
    expect(getStrings('xx').play).toBe('Play');
  });

  it('maps fa → rtl and en → ltr', () => {
    expect(dirFor('fa')).toBe('rtl');
    expect(dirFor('en')).toBe('ltr');
  });

  it('honours an explicit direction override', () => {
    expect(dirFor('en', 'rtl')).toBe('rtl');
    expect(dirFor('fa', 'ltr')).toBe('ltr');
  });
});
