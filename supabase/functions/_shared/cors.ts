export type CorsOptions = {
  allowedOriginsEnv?: string;
  /**
   * If true, require `ALLOWED_ORIGINS` to be set (recommended for production).
   * When false, functions will fall back to reflecting Origin (or `*`) when unset.
   */
  requireAllowedOriginsEnv?: boolean;
};

const normalizeOrigin = (value: string) => value.trim().replace(/\/$/, '');

const getAllowedOrigins = (envVar?: string): string[] => {
  const raw = (envVar || '').trim();
  if (!raw) return [];
  return raw
    .split(',')
    .map((origin) => normalizeOrigin(origin))
    .filter(Boolean);
};

export const buildCorsHeaders = (req: Request, opts?: CorsOptions) => {
  const origin = normalizeOrigin(req.headers.get('Origin') || '');
  const allowed = getAllowedOrigins(Deno.env.get(opts?.allowedOriginsEnv || 'ALLOWED_ORIGINS'));

  // For local dev, if ALLOWED_ORIGINS is unset, fall back to reflecting Origin (or *).
  // For production, set ALLOWED_ORIGINS explicitly.
  const allowOrigin =
    allowed.length === 0
      ? origin || '*'
      : allowed.includes(origin)
        ? origin
        : 'null';

  return {
    'Access-Control-Allow-Origin': allowOrigin,
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST,GET,OPTIONS',
    'Vary': 'Origin',
  };
};

export const handleCorsPreflight = (req: Request, headers: Record<string, string>) => {
  if (req.method !== 'OPTIONS') return null;
  return new Response('ok', { headers });
};

export class CorsError extends Error {
  status = 403 as const;
  constructor(message = 'CORS forbidden') {
    super(message);
    this.name = 'CorsError';
  }
}

/**
 * Best-effort CORS enforcement.
 * - If `Origin` header is absent, this is likely a non-browser call and is allowed.
 * - If `ALLOWED_ORIGINS` is set, only those origins are allowed.
 * - If `requireAllowedOriginsEnv` is true, missing `ALLOWED_ORIGINS` is an error.
 */
export const assertCorsAllowed = (req: Request, opts?: CorsOptions) => {
  const origin = normalizeOrigin(req.headers.get('Origin') || '');
  if (!origin) return;

  const allowed = getAllowedOrigins(Deno.env.get(opts?.allowedOriginsEnv || 'ALLOWED_ORIGINS'));
  if (allowed.length === 0) {
    const appBaseUrl = (Deno.env.get('APP_BASE_URL') || '').trim();
    const shouldRequire = Boolean(opts?.requireAllowedOriginsEnv) || Boolean(appBaseUrl);
    if (shouldRequire) {
      throw new CorsError('ALLOWED_ORIGINS must be set in production.');
    }
    return;
  }

  if (!allowed.includes(origin)) {
    throw new CorsError('Origin not allowed.');
  }
};
