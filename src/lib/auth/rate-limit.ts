import "server-only";

/**
 * In-memory sliding-window rate limiter for the login route (brute-force
 * protection).
 *
 * LIMITATION — read before deploying multi-instance: this state lives in
 * the memory of a single Node process. It works correctly for a single dev
 * server or a single-instance deployment, but a horizontally-scaled
 * production deployment (multiple Node processes/containers behind a load
 * balancer) will have a separate, independent counter per instance — an
 * attacker distributed across instances (or just unlucky round-robin
 * routing) can exceed the intended global limit. Before scaling this app
 * past one instance, replace this module's Map with a shared store (Redis
 * `INCR` + `EXPIRE`, or an equivalent atomic counter) keyed the same way.
 * There is no Redis in this project yet, so this is the pragmatic interim
 * implementation, not the final one.
 */

interface Bucket {
  count: number;
  windowStart: number;
}

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

const buckets = new Map<string, Bucket>();

// Prevent unbounded memory growth from one-off/attacker keys: opportunistic
// sweep of expired buckets on a fraction of calls rather than a setInterval
// (keeps this module side-effect-free at import time, which matters for
// `next build`'s static analysis of route modules).
let callsSinceSweep = 0;
function maybeSweep() {
  callsSinceSweep += 1;
  if (callsSinceSweep < 500) return;
  callsSinceSweep = 0;
  const now = Date.now();
  for (const [key, bucket] of buckets) {
    if (now - bucket.windowStart > WINDOW_MS) buckets.delete(key);
  }
}

/**
 * Check + record an attempt for `key` (typically `${ip}:${email}` so a
 * single abusive IP can't lock out other users' accounts by hammering their
 * emails, and vice versa). Returns whether the attempt is allowed.
 */
export function checkRateLimit(key: string): {
  allowed: boolean;
  retryAfterMs: number;
} {
  maybeSweep();
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now - bucket.windowStart > WINDOW_MS) {
    buckets.set(key, { count: 1, windowStart: now });
    return { allowed: true, retryAfterMs: 0 };
  }

  if (bucket.count >= MAX_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterMs: WINDOW_MS - (now - bucket.windowStart),
    };
  }

  bucket.count += 1;
  return { allowed: true, retryAfterMs: 0 };
}

/** Build the rate-limit key for a login attempt. Exported so the login action stays readable. */
export function loginRateLimitKey(ip: string, email: string): string {
  return `login:${ip}:${email.trim().toLowerCase()}`;
}
