import { describe, it, expect, beforeEach } from 'vitest';
import { loadPrefs, savePrefs } from './prefs';

const KEY = 'test-prefs';

describe('player prefs', () => {
  beforeEach(() => localStorage.clear());

  it('returns an empty object when nothing is stored', () => {
    expect(loadPrefs(KEY)).toEqual({});
  });

  it('persists and merges successive patches', () => {
    savePrefs({ volume: 0.5 }, KEY);
    savePrefs({ rate: 1.5 }, KEY);
    savePrefs({ volume: 0.8 }, KEY);
    expect(loadPrefs(KEY)).toEqual({ volume: 0.8, rate: 1.5 });
  });

  it('survives malformed storage without throwing', () => {
    localStorage.setItem(KEY, 'not json');
    expect(loadPrefs(KEY)).toEqual({});
  });

  it('scopes preferences by key', () => {
    savePrefs({ muted: true }, 'a');
    savePrefs({ muted: false }, 'b');
    expect(loadPrefs('a')).toEqual({ muted: true });
    expect(loadPrefs('b')).toEqual({ muted: false });
  });
});
