import type { LogplexAnalyticsConfig, LogplexEventType, Quality } from '../types';

/** Per-event fields layered on top of the session-constant fields. */
export interface TrackFields {
  playerTimeMs?: number;
  seekFromMs?: number;
  seekToMs?: number;
  bufferDurationMs?: number;
  bytesChunk?: number;
  bitrateKbps?: number;
  quality?: Quality;
  episodeId?: string;
  seriesId?: string;
  error?: { code: string; message?: string; httpStatus?: number; url?: string };
  /** Override the event timestamp (unix ms); defaults to now. */
  timestamp?: number;
}

/** Wire shape for /v1/ingest/event and /events/batch (snake_case). */
interface WireEvent {
  event_type: LogplexEventType;
  session_id: string;
  timestamp: number;
  user_id: string;
  user_type?: string;
  content_id: string;
  content_type?: string;
  content_duration_ms?: number;
  episode_id?: string;
  series_id?: string;
  player_time_ms?: number;
  seek_from_ms?: number;
  seek_to_ms?: number;
  buffer_duration_ms?: number;
  bytes_chunk?: number;
  bitrate_kbps?: number;
  quality?: string;
  device_type?: string;
  device_os?: string;
  app_version?: string;
  error?: { code: string; message?: string; http_status?: number; url?: string };
}

/** Resume point returned by GET /v1/ingest/playback/{contentId}/progress. */
export interface ResumePoint {
  positionSeconds: number;
  durationSeconds: number;
  percentWatched: number;
  completed: boolean;
}

const DEFAULTS = { heartbeatIntervalMs: 10_000, batchSize: 20, flushIntervalMs: 5_000 };

function detectOS(): string | undefined {
  if (typeof navigator === 'undefined') return undefined;
  const ua = navigator.userAgent;
  if (/android/i.test(ua)) return 'android';
  if (/iphone|ipad|ipod/i.test(ua)) return 'ios';
  if (/windows/i.test(ua)) return 'windows';
  if (/mac os/i.test(ua)) return 'macos';
  if (/linux/i.test(ua)) return 'linux';
  return undefined;
}

function newSessionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  // Fallback: RFC-4122-ish v4 from Math.random (non-crypto, only when unavailable).
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * LogplexAnalytics emits player events to the Logplex ingest API. It batches
 * (size + time), retries transient failures, heartbeats while playing, and
 * flushes via sendBeacon on page hide so the final position isn't lost.
 *
 * Mirrors the Go player SDK contract: X-API-Key auth, snake_case payloads,
 * /v1/ingest/event · /events/batch · /heartbeat.
 */
export class LogplexAnalytics {
  readonly sessionId: string;
  private readonly cfg: Required<Pick<LogplexAnalyticsConfig,
    'baseUrl' | 'apiKey' | 'userId' | 'contentId' | 'heartbeatIntervalMs' | 'batchSize' | 'flushIntervalMs'>> &
    LogplexAnalyticsConfig;
  private readonly deviceOS = detectOS();
  private queue: WireEvent[] = [];
  private flushTimer: ReturnType<typeof setInterval> | null = null;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private destroyed = false;

  constructor(config: LogplexAnalyticsConfig) {
    this.cfg = {
      ...config,
      heartbeatIntervalMs: config.heartbeatIntervalMs ?? DEFAULTS.heartbeatIntervalMs,
      batchSize: config.batchSize ?? DEFAULTS.batchSize,
      flushIntervalMs: config.flushIntervalMs ?? DEFAULTS.flushIntervalMs,
    };
    this.sessionId = config.sessionId ?? newSessionId();
  }

  /** Start the flush timer + page-hide flush. Idempotent. */
  start(): void {
    if (this.cfg.disabled || this.flushTimer) return;
    this.flushTimer = setInterval(() => void this.flush(), this.cfg.flushIntervalMs);
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', this.onVisibility);
      window.addEventListener('pagehide', this.onPageHide);
    }
  }

  /** Record an event. player time is remembered for heartbeats. */
  track(type: LogplexEventType, fields: TrackFields = {}): void {
    if (this.cfg.disabled || this.destroyed) return;
    this.queue.push(this.build(type, fields));
    if (this.queue.length >= this.cfg.batchSize) void this.flush();
  }

  /** Begin periodic heartbeats (call when playback starts). */
  startHeartbeat(getPositionMs: () => number): void {
    if (this.cfg.disabled || this.heartbeatTimer) return;
    this.heartbeatTimer = setInterval(() => {
      const ms = Math.round(getPositionMs());
      void this.post('/v1/ingest/heartbeat', {
        session_id: this.sessionId,
        timestamp: Date.now(),
        player_time_ms: ms,
      });
    }, this.cfg.heartbeatIntervalMs);
  }

  stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /** Fetch the saved resume point for this (viewer, content). null = none. */
  async getResume(): Promise<ResumePoint | null> {
    if (this.cfg.disabled) return null;
    const url =
      `${this.cfg.baseUrl}/v1/ingest/playback/${encodeURIComponent(this.cfg.contentId)}/progress` +
      `?user_id=${encodeURIComponent(this.cfg.userId)}`;
    try {
      const res = await fetch(url, { headers: { 'X-API-Key': this.cfg.apiKey } });
      if (!res.ok) return null;
      const body = (await res.json()) as { data?: Record<string, unknown> | null };
      const d = body?.data;
      if (!d || typeof d.position_seconds !== 'number') return null;
      return {
        positionSeconds: d.position_seconds as number,
        durationSeconds: (d.duration_seconds as number) ?? 0,
        percentWatched: (d.percent_watched as number) ?? 0,
        completed: Boolean(d.completed),
      };
    } catch {
      return null;
    }
  }

  /** Register content metadata once (title/thumbnail/type) for reports. */
  registerContent(): void {
    if (this.cfg.disabled) return;
    void this.post(`/v1/ingest/playback/${encodeURIComponent(this.cfg.contentId)}/progress`, {
      session_id: this.sessionId,
      user_id: this.cfg.userId,
      merchant_user_id: this.cfg.merchantUserId,
      content_type: this.cfg.contentType,
      content_title: this.cfg.contentTitle,
      content_thumbnail_url: this.cfg.contentThumbnailUrl,
    }, 'PUT');
  }

  /** Flush buffered events. */
  async flush(): Promise<void> {
    if (this.queue.length === 0) return;
    const batch = this.queue;
    this.queue = [];
    await this.post('/v1/ingest/events/batch', { events: batch });
  }

  /** Stop timers + flush. Call on unmount. */
  destroy(): void {
    this.destroyed = true;
    this.stopHeartbeat();
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = null;
    }
    if (typeof document !== 'undefined') {
      document.removeEventListener('visibilitychange', this.onVisibility);
      window.removeEventListener('pagehide', this.onPageHide);
    }
    this.beaconFlush();
  }

  private build(type: LogplexEventType, f: TrackFields): WireEvent {
    return {
      event_type: type,
      session_id: this.sessionId,
      timestamp: f.timestamp ?? Date.now(),
      user_id: this.cfg.userId,
      user_type: this.cfg.userType,
      content_id: this.cfg.contentId,
      content_type: this.cfg.contentType,
      content_duration_ms: this.cfg.contentDurationMs,
      episode_id: f.episodeId,
      series_id: f.seriesId,
      player_time_ms: f.playerTimeMs,
      seek_from_ms: f.seekFromMs,
      seek_to_ms: f.seekToMs,
      buffer_duration_ms: f.bufferDurationMs,
      bytes_chunk: f.bytesChunk,
      bitrate_kbps: f.bitrateKbps,
      quality: f.quality,
      device_type: 'web',
      device_os: this.deviceOS,
      app_version: this.cfg.appVersion,
      error: f.error
        ? { code: f.error.code, message: f.error.message, http_status: f.error.httpStatus, url: f.error.url }
        : undefined,
    };
  }

  private onVisibility = (): void => {
    if (document.visibilityState === 'hidden') this.beaconFlush();
  };

  private onPageHide = (): void => this.beaconFlush();

  /** Best-effort flush that survives page unload. */
  private beaconFlush(): void {
    if (this.queue.length === 0) return;
    const batch = this.queue;
    this.queue = [];
    const url = `${this.cfg.baseUrl}/v1/ingest/events/batch`;
    const payload = JSON.stringify({ events: batch });
    // sendBeacon can't set X-API-Key; fall back to keepalive fetch which can.
    try {
      void fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-API-Key': this.cfg.apiKey },
        body: payload,
        keepalive: true,
      });
    } catch {
      /* unload best-effort */
    }
  }

  private async post(path: string, body: unknown, method: 'POST' | 'PUT' = 'POST'): Promise<void> {
    const url = `${this.cfg.baseUrl}${path}`;
    const data = JSON.stringify(body);
    for (let attempt = 0; attempt <= 2; attempt++) {
      if (attempt > 0) await delay(attempt * 500);
      try {
        const res = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json', 'X-API-Key': this.cfg.apiKey },
          body: data,
        });
        if (res.ok) return;
        if (res.status < 500) return; // 4xx won't succeed on retry
      } catch {
        /* network error → retry */
      }
    }
  }
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
