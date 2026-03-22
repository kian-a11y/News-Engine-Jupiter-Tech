/**
 * Lightweight in-memory rate limiter using sliding window.
 * Works for single-instance deployments (Vercel serverless functions share
 * memory within a single warm instance). For multi-instance, use Upstash/Redis.
 *
 * Usage:
 *   const limiter = createRateLimiter({ windowMs: 60_000, max: 10 });
 *   const { allowed, remaining } = limiter.check(identifier);
 */

interface RateLimitEntry {
  timestamps: number[];
}

interface RateLimiterOptions {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests per window */
  max: number;
}

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterMs: number;
}

const stores = new Map<string, Map<string, RateLimitEntry>>();

export function createRateLimiter(options: RateLimiterOptions) {
  const storeKey = `${options.windowMs}_${options.max}`;
  if (!stores.has(storeKey)) {
    stores.set(storeKey, new Map());
  }
  const store = stores.get(storeKey)!;

  // Periodic cleanup of expired entries (every 60s)
  let lastCleanup = Date.now();

  function cleanup() {
    const now = Date.now();
    if (now - lastCleanup < 60_000) return;
    lastCleanup = now;
    const cutoff = now - options.windowMs;
    store.forEach((entry, key) => {
      entry.timestamps = entry.timestamps.filter((t: number) => t > cutoff);
      if (entry.timestamps.length === 0) store.delete(key);
    });
  }

  return {
    check(identifier: string): RateLimitResult {
      cleanup();
      const now = Date.now();
      const cutoff = now - options.windowMs;

      let entry = store.get(identifier);
      if (!entry) {
        entry = { timestamps: [] };
        store.set(identifier, entry);
      }

      // Remove expired timestamps
      entry.timestamps = entry.timestamps.filter((t) => t > cutoff);

      if (entry.timestamps.length >= options.max) {
        const oldestInWindow = entry.timestamps[0];
        return {
          allowed: false,
          remaining: 0,
          retryAfterMs: oldestInWindow + options.windowMs - now,
        };
      }

      entry.timestamps.push(now);
      return {
        allowed: true,
        remaining: options.max - entry.timestamps.length,
        retryAfterMs: 0,
      };
    },
  };
}

// Pre-configured limiters for the app
// Chat: 20 requests per minute per user
export const chatLimiter = createRateLimiter({ windowMs: 60_000, max: 20 });

// Invite: 3 requests per hour per user (sending emails is expensive)
export const inviteLimiter = createRateLimiter({ windowMs: 3_600_000, max: 3 });

// Scrape: 2 requests per 5 minutes (cron protection)
export const scrapeLimiter = createRateLimiter({ windowMs: 300_000, max: 2 });
