export class RateLimitError extends Error {
  status = 429 as const;
  retryAfterSeconds: number;
  constructor(message = "Too many requests", retryAfterSeconds = 30) {
    super(message);
    this.name = "RateLimitError";
    this.retryAfterSeconds = retryAfterSeconds;
  }
}

type RateLimitOptions = {
  /**
   * Unique name per endpoint (e.g. "client-preview", "r2-presign").
   */
  name: string;
  /**
   * Max requests per window per key.
   */
  limit: number;
  /**
   * Window size in milliseconds.
   */
  windowMs: number;
};

type Counter = { count: number; resetAt: number };

const getStore = (): Map<string, Counter> => {
  const g = globalThis as any;
  if (!g.__TH_RATE_LIMIT_STORE) g.__TH_RATE_LIMIT_STORE = new Map<string, Counter>();
  return g.__TH_RATE_LIMIT_STORE as Map<string, Counter>;
};

const getClientIp = (req: Request): string => {
  const cf = (req.headers.get("cf-connecting-ip") || "").trim();
  if (cf) return cf;
  const real = (req.headers.get("x-real-ip") || "").trim();
  if (real) return real;
  const fwd = (req.headers.get("x-forwarded-for") || "").split(",")[0]?.trim();
  if (fwd) return fwd;
  return "unknown";
};

/**
 * In-memory rate limiting (best-effort).
 * Note: Supabase Edge Functions may run across multiple isolates; this is not a strong global guarantee.
 * For production-grade guarantees, back this with a shared store (Redis/KV).
 */
export const enforceRateLimit = (req: Request, opts: RateLimitOptions) => {
  const ip = getClientIp(req);
  const key = `${opts.name}:${ip}`;
  const now = Date.now();
  const store = getStore();

  const existing = store.get(key);
  if (!existing || existing.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + opts.windowMs });
    return;
  }

  existing.count += 1;
  store.set(key, existing);

  if (existing.count > opts.limit) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    throw new RateLimitError("Rate limit exceeded.", retryAfterSeconds);
  }
};

