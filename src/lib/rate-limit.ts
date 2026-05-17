/**
 * Simple in-memory sliding-window rate limiter for Vercel serverless.
 *
 * ⚠️  For a single-instance dev server or low-traffic apps this works well.
 * At higher scale (multiple Vercel regions / functions) consider replacing
 * with Upstash Redis rate limiting (@upstash/ratelimit).
 *
 * Each key (e.g. "redeem:userId") is tracked independently.
 */

type RateLimitEntry = {
  timestamps: number[];
};

const store = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 60 seconds to prevent memory leak
const CLEANUP_INTERVAL_MS = 60_000;

let lastCleanup = Date.now();

function cleanupStale(windowMs: number) {
  const now = Date.now();

  if (now - lastCleanup < CLEANUP_INTERVAL_MS) {
    return;
  }

  lastCleanup = now;
  const cutoff = now - windowMs * 2;

  for (const [key, entry] of store) {
    if (entry.timestamps.length === 0 || entry.timestamps[entry.timestamps.length - 1] < cutoff) {
      store.delete(key);
    }
  }
}

type RateLimitOptions = {
  /** A unique prefix for this rate limiter, e.g. "login", "redeem". */
  prefix: string;
  /** Maximum number of requests allowed within the window. */
  maxRequests: number;
  /** Time window in milliseconds. */
  windowMs: number;
};

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
};

export function checkRateLimit(
  key: string,
  options: RateLimitOptions,
): RateLimitResult {
  const { prefix, maxRequests, windowMs } = options;
  const fullKey = `${prefix}:${key}`;
  const now = Date.now();

  cleanupStale(windowMs);

  let entry = store.get(fullKey);

  if (!entry) {
    entry = { timestamps: [] };
    store.set(fullKey, entry);
  }

  // Remove timestamps outside the current window
  const windowStart = now - windowMs;
  entry.timestamps = entry.timestamps.filter(
    (timestamp) => timestamp > windowStart,
  );

  if (entry.timestamps.length >= maxRequests) {
    const oldestInWindow = entry.timestamps[0];
    const retryAfterMs = oldestInWindow + windowMs - now;

    return {
      allowed: false,
      remaining: 0,
      retryAfterMs: Math.max(retryAfterMs, 0),
    };
  }

  entry.timestamps.push(now);

  return {
    allowed: true,
    remaining: maxRequests - entry.timestamps.length,
    retryAfterMs: 0,
  };
}

// Predefined rate limit configurations for different actions
export const RATE_LIMITS = {
  login: {
    prefix: "login",
    maxRequests: 5,
    windowMs: 60_000, // 5 attempts per minute
  },
  redeemInvitation: {
    prefix: "redeem",
    maxRequests: 5,
    windowMs: 60_000, // 5 attempts per minute
  },
  qrScan: {
    prefix: "qr-scan",
    maxRequests: 10,
    windowMs: 60_000, // 10 scans per minute
  },
  csvExport: {
    prefix: "csv-export",
    maxRequests: 3,
    windowMs: 60_000, // 3 exports per minute
  },
} as const;
