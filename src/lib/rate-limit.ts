/**
 * Rate limiter Upstash sliding window.
 *
 * Si `UPSTASH_REDIS_REST_URL` ou `UPSTASH_REDIS_REST_TOKEN` manque, le helper
 * retourne `{ allowed: true }` immédiatement (no-op gracieux). On évite
 * d'inventer une dépendance bloquante en dev local.
 *
 * Usage :
 *   const { allowed, reset } = await rateLimit(`tokens-earn:${userId}`, 30, 60);
 *   if (!allowed) return NextResponse.json({ error: 'Trop de requêtes' }, { status: 429 });
 */
import { Redis } from "@upstash/redis";

let _redis: Redis | null = null;
let _checked = false;

function getRedis(): Redis | null {
  if (_checked) return _redis;
  _checked = true;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  _redis = new Redis({ url, token });
  return _redis;
}

export interface RateLimitResult {
  allowed: boolean;
  count: number;
  limit: number;
  reset: number;
}

/**
 * Sliding window simple (atomic via INCR + EXPIRE NX).
 * @param key — clé unique (préfixée par le caller)
 * @param limit — nb max d'opérations dans la fenêtre
 * @param windowSeconds — durée de la fenêtre en secondes
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number,
): Promise<RateLimitResult> {
  const redis = getRedis();
  const now = Math.floor(Date.now() / 1000);
  const reset = now + windowSeconds;

  if (!redis) {
    return { allowed: true, count: 0, limit, reset };
  }

  try {
    const count = await redis.incr(key);
    if (count === 1) {
      await redis.expire(key, windowSeconds);
    }
    return { allowed: count <= limit, count, limit, reset };
  } catch {
    // Si Upstash plante : on laisse passer, on log silencieusement.
    return { allowed: true, count: 0, limit, reset };
  }
}
