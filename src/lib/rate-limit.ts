import { getRedisConnection } from "@/lib/queue";

type RateLimitResult = {
  allowed: boolean;
  remaining: number;
  resetIn: number; // seconds until window resets
};

/**
 * Sliding window rate limiter using Redis.
 * Limits requests per key (usually API key hash) within a time window.
 */
export async function rateLimit(
  key: string,
  opts: {
    maxRequests: number; // max requests per window
    windowSec: number;   // window duration in seconds
  }
): Promise<RateLimitResult> {
  const redisKey = `rl:${key}`;
  const now = Date.now();
  const windowMs = opts.windowSec * 1000;
  const clearBefore = now - windowMs;

  // Use a sorted set: member = timestamp, score = timestamp
  // Pipeline for atomicity
  const pipeline = getRedisConnection().pipeline();
  pipeline.zremrangebyscore(redisKey, "-inf", clearBefore);       // remove old entries
  pipeline.zadd(redisKey, now, `${now}-${Math.random()}`);        // add current request
  pipeline.zcard(redisKey);                                        // count in window
  pipeline.expire(redisKey, opts.windowSec + 1);                  // auto-cleanup

  const results = await pipeline.exec();
  const count = (results?.[2]?.[1] as number) ?? 0;

  return {
    allowed: count <= opts.maxRequests,
    remaining: Math.max(0, opts.maxRequests - count),
    resetIn: opts.windowSec,
  };
}

// ── Per-plan limits ───────────────────────────────────────────────────────────

const PLAN_LIMITS: Record<string, { maxRequests: number; windowSec: number }> = {
  FREE: { maxRequests: 100, windowSec: 60 },  // 100 req/min
  TEAM: { maxRequests: 1000, windowSec: 60 },  // 1000 req/min
  SCALE: { maxRequests: 5000, windowSec: 60 },  // 5000 req/min
};

export function getPlanLimits(plan: string) {
  return PLAN_LIMITS[plan] ?? PLAN_LIMITS.FREE;
}
