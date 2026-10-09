import { describe, it, expect } from 'vitest';
import { applyQualityPolicy, displayHeight, levelDisplayHeight, renditionTiers } from './qualityPolicy';

const ladder = [240, 360, 480, 720, 1080, 2160];

describe('applyQualityPolicy', () => {
  it('allows everything and leaves the start to ABR without a policy', () => {
    expect(applyQualityPolicy(ladder)).toEqual({ allowed: ladder.map(() => true), start: -1 });
  });

  it('drops renditions below the floor and starts on the preferred height', () => {
    const { allowed, start } = applyQualityPolicy(ladder, { minHeight: 720, startHeight: 1080 });
    expect(allowed).toEqual([false, false, false, true, true, true]);
    expect(start).toBe(4);
  });

  it('starts on the tallest rendition under the preference when it is missing', () => {
    expect(applyQualityPolicy([360, 720, 900], { minHeight: 720, startHeight: 1080 }).start).toBe(2);
  });

  it('starts on the shortest rendition above the preference when nothing is under it', () => {
    expect(applyQualityPolicy([1440, 2160], { minHeight: 720, startHeight: 1080 }).start).toBe(0);
  });

  it('keeps only the tallest renditions when nothing reaches the floor', () => {
    const { allowed, start } = applyQualityPolicy([240, 360, 480, 480], { minHeight: 720, startHeight: 1080 });
    expect(allowed).toEqual([false, false, true, true]);
    expect(start).toBe(3);
  });

  it('never filters or picks renditions of unknown height', () => {
    const { allowed, start } = applyQualityPolicy([undefined, 360, 1080], { minHeight: 720, startHeight: 1080 });
    expect(allowed).toEqual([true, false, true]);
    expect(start).toBe(2);
  });
});

// A letterboxed 2.4:1 film: real 1920x800, but the playlist names it 1080p.
const scope = [
  { width: 640, height: 266, attrs: { 'X-DISPLAY-HEIGHT': '360' } },
  { width: 1280, height: 534, attrs: { 'X-DISPLAY-HEIGHT': '720' } },
  { width: 1920, height: 800, attrs: { 'X-DISPLAY-HEIGHT': '1080' } },
];

describe('display heights named by the playlist', () => {
  it('reads X-DISPLAY-HEIGHT and ignores a missing or invalid one', () => {
    expect(levelDisplayHeight(scope[2])).toBe(1080);
    expect(levelDisplayHeight({ attrs: {} })).toBeUndefined();
    expect(levelDisplayHeight({ attrs: { 'X-DISPLAY-HEIGHT': 'abc' } })).toBeUndefined();
    expect(levelDisplayHeight({})).toBeUndefined();
  });

  it('shows the tier for a named rendition and the real height otherwise', () => {
    const tiers = renditionTiers(scope);
    expect(displayHeight({ width: 1920, height: 800 }, tiers)).toBe(1080);
    expect(displayHeight({ width: 1920, height: 1080 }, tiers)).toBe(1080);
    expect(displayHeight({ width: 1920, height: 800 })).toBe(800);
  });

  it('has no tiers for a playlist that names none, so nothing changes for it', () => {
    expect(renditionTiers([{ width: 1280, height: 720, attrs: {} }])).toBeUndefined();
  });

  it('lets the floor keep both 1080p and 720p of a widescreen film', () => {
    const heights = scope.map((l) => levelDisplayHeight(l) ?? l.height);
    expect(applyQualityPolicy(heights, { minHeight: 720, startHeight: 1080 })).toEqual({
      allowed: [false, true, true],
      start: 2,
    });
    // Without the tiers the same film offered only its 800p rendition.
    expect(applyQualityPolicy(scope.map((l) => l.height), { minHeight: 720 }).allowed).toEqual([false, false, true]);
  });
});
