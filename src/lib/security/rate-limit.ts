type Options = {
  limit: number;
  windowMs: number;
  maxKeys?: number;
  now?: () => number;
};

export type RateLimitResult = {
  allowed: boolean;
  retryAfterSeconds: number;
};

const DEFAULT_MAX_KEYS = 5000;
const MS_PER_SECOND = 1000;

export function createRateLimiter({
  limit,
  windowMs,
  maxKeys = DEFAULT_MAX_KEYS,
  now = Date.now,
}: Options) {
  const attempts = new Map<string, number[]>();

  function makeRoom(): void {
    while (attempts.size >= maxKeys) {
      const oldest = attempts.keys().next().value;
      if (oldest === undefined) return;
      attempts.delete(oldest);
    }
  }

  return {
    check(key: string): RateLimitResult {
      const current = now();
      const recent = (attempts.get(key) ?? []).filter(
        (time) => current - time < windowMs,
      );

      if (recent.length >= limit) {
        return {
          allowed: false,
          retryAfterSeconds: Math.ceil(
            (recent[0] + windowMs - current) / MS_PER_SECOND,
          ),
        };
      }

      attempts.delete(key);
      makeRoom();
      attempts.set(key, [...recent, current]);
      return { allowed: true, retryAfterSeconds: 0 };
    },
    size: () => attempts.size,
  };
}
