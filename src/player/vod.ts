import { useEffect, useMemo, useState } from 'react';
import type { VodCustomUrl, VodProvider } from '../types';

/**
 * VOD provider resolution. Some operators don't serve a playable HLS URL
 * directly — they hand out an opaque play token that must be exchanged, via the
 * provider's API, for the real stream URL (plus scrub-thumbnail VTTs). For
 * `standard` sources the `src` is already playable and passes through untouched.
 *
 * Mirrors the old hamrah-player provider flow so existing back-ends keep working
 * while Logplex is rolled out.
 */

interface PoyanThumbnail {
  url: string;
}

interface PoyanResponse {
  status: string;
  data: {
    play_data: {
      play_url: string;
      thumbnails?: PoyanThumbnail[];
    };
  };
}

interface HamrahiResponse {
  stream_link: string;
  vtt?: string;
  vtt_mobile?: string;
}

const POYAN_DEFAULT_URL = 'https://vodcore.iranlms.ir/client/';
const ABR_HAMRAHI_DEFAULT_URL = 'https://hamrahi.cloud/live/api/v1/live/details/vod/{token}';

async function getPoyanVideoInfo(
  token: string,
  serviceUrl: string | undefined,
  signal: AbortSignal,
): Promise<PoyanResponse> {
  const decoded = decodeURIComponent(token);
  if (!decoded) return Promise.reject(new Error('tokenIsEmpty'));
  const res = await fetch(serviceUrl || POYAN_DEFAULT_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      api_version: '1',
      method: 'getPlayContentInfo',
      data: { play_token: decoded },
    }),
    signal,
  });
  return res.json();
}

async function getAbrHamrahiVideoInfo(
  token: string,
  serviceUrl: string | undefined,
  signal: AbortSignal,
): Promise<HamrahiResponse> {
  if (!token) return Promise.reject(new Error('tokenIsEmpty'));
  const url = (serviceUrl || ABR_HAMRAHI_DEFAULT_URL).replace('{token}', token);
  const res = await fetch(url, { method: 'GET', signal });
  return res.json();
}

function isMobileViewport(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

export interface ResolvedVodSource {
  /** Resolved playable URL (null while loading / on error / before resolution). */
  src: string | null;
  /** Resolved scrub-thumbnail VTT, if the provider supplied one. */
  thumbnails?: string;
  isLoading: boolean;
  hasError: boolean;
}

/**
 * Resolves a provider `src` into a playable HLS URL (+ VTT thumbnails).
 * `standard` (or a non-string source) passes through synchronously; other
 * providers exchange the token via their API.
 */
export function useVodSource(
  rawSrc: string | undefined,
  provider: VodProvider,
  customUrl?: VodCustomUrl,
): ResolvedVodSource {
  const isStandard = provider === 'standard' || !rawSrc;
  // Depend on the specific endpoint string, not the (often inline) customUrl
  // object — so a new object identity per render doesn't re-trigger the fetch.
  const serviceUrl = customUrl?.[provider];
  const [providerSrc, setProviderSrc] = useState<string | null>(null);
  const [thumbnails, setThumbnails] = useState<string | undefined>(undefined);
  const [isLoading, setLoading] = useState(!isStandard);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    if (isStandard || !rawSrc) {
      setProviderSrc(null);
      setThumbnails(undefined);
      setLoading(false);
      setHasError(false);
      return;
    }

    const controller = new AbortController();
    setLoading(true);
    setHasError(false);
    setProviderSrc(null);
    setThumbnails(undefined);

    const onError = (e: unknown) => {
      if (e instanceof DOMException && e.name === 'AbortError') return;
      setHasError(true);
      setLoading(false);
      setProviderSrc(null);
    };

    const mobile = isMobileViewport();

    if (provider === 'poyan') {
      getPoyanVideoInfo(rawSrc, serviceUrl, controller.signal)
        .then((response) => {
          setProviderSrc(response.data.play_data.play_url);
          const thumb = response.data.play_data.thumbnails?.[0]?.url;
          if (thumb) setThumbnails(thumb);
          setLoading(false);
        })
        .catch(onError);
    } else if (provider === 'abr_hamrahi') {
      getAbrHamrahiVideoInfo(rawSrc, serviceUrl, controller.signal)
        .then((response) => {
          setProviderSrc(response.stream_link);
          const vtt = (mobile ? response.vtt_mobile : response.vtt) || response.vtt || response.vtt_mobile;
          if (vtt) setThumbnails(vtt);
          setLoading(false);
        })
        .catch(onError);
    } else {
      // Unknown provider — treat the src as already playable.
      setProviderSrc(rawSrc);
      setLoading(false);
    }

    return () => controller.abort();
  }, [rawSrc, provider, isStandard, serviceUrl]);

  return useMemo(
    () => ({
      src: isStandard ? rawSrc ?? null : providerSrc,
      thumbnails: isStandard ? undefined : thumbnails,
      isLoading: isStandard ? false : isLoading,
      hasError: isStandard ? false : hasError,
    }),
    [isStandard, rawSrc, providerSrc, thumbnails, isLoading, hasError],
  );
}
