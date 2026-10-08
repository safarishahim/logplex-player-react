import { describe, it, expect } from 'vitest';
import { addBytes, hostOf, mergeRanges, parseMasterPlaylist, rangesLength, variantFor } from './trafficMeter';

const master = `#EXTM3U
#EXT-X-STREAM-INF:BANDWIDTH=3000000,AVERAGE-BANDWIDTH=2400000,RESOLUTION=1280x720
720/index.m3u8?token=abc
#EXT-X-STREAM-INF:BANDWIDTH=6000000,RESOLUTION=1920x1080,CODECS="avc1.640028,mp4a.40.2"
https://edge.cdn.example/1080/index.m3u8
`;

describe('parseMasterPlaylist', () => {
  it('reads each variant, preferring the average bandwidth, with its host', () => {
    expect(parseMasterPlaylist(master, 'https://origin.example/v/master.m3u8')).toEqual([
      { height: 720, bytesPerSecond: 300000, host: 'origin.example' },
      { height: 1080, bytesPerSecond: 750000, host: 'edge.cdn.example' },
    ]);
  });

  it('finds nothing in a media playlist', () => {
    expect(parseMasterPlaylist('#EXTM3U\n#EXTINF:6,\nseg1.ts\n', 'https://a.example/x.m3u8')).toEqual([]);
  });
});

describe('variantFor', () => {
  const variants = parseMasterPlaylist(master, 'https://origin.example/v/master.m3u8');
  it('picks the variant nearest the decoded height', () => {
    expect(variantFor(variants, 700)?.height).toBe(720);
    expect(variantFor(variants, 1000)?.height).toBe(1080);
  });
  it('assumes the richest variant when the height is unknown', () => {
    expect(variantFor(variants, undefined)?.height).toBe(1080);
  });
});

describe('ranges', () => {
  it('merges overlapping and adjacent ranges', () => {
    expect(
      mergeRanges(
        [[0, 10]],
        [
          [5, 20],
          [30, 40],
        ],
      ),
    ).toEqual([
      [0, 20],
      [30, 40],
    ]);
    expect(rangesLength(mergeRanges([[0, 10]], [[10, 15]]))).toBe(15);
  });
});

describe('hosts', () => {
  it('keeps only the host, never the path or token', () => {
    expect(hostOf('https://cdn.example:8443/a/b.ts?token=secret')).toBe('cdn.example:8443');
    expect(hostOf('not a url')).toBe('other');
  });
  it('caps the number of hosts', () => {
    const into: Record<string, number> = {};
    for (let i = 0; i < 20; i += 1) addBytes(into, `h${i}.example`, 1);
    expect(Object.keys(into)).toHaveLength(13);
    expect(into.other).toBe(8);
    addBytes(into, 'h0.example', 0);
    expect(into['h0.example']).toBe(1);
  });
});
