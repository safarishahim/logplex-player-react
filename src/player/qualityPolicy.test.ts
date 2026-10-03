import { describe, it, expect } from 'vitest';
import { applyQualityPolicy } from './qualityPolicy';

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
