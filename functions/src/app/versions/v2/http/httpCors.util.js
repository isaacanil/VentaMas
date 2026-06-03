const DEFAULT_HTTP_CORS_ORIGINS = new Set([
  'http://localhost:5173',
  'http://localhost:4173',
  'http://127.0.0.1:5173',
  'http://127.0.0.1:4173',
  'https://ventamax-staging.web.app',
  'https://ventamax-staging.firebaseapp.com',
  'https://ventamaxpos-staging.web.app',
  'https://ventamaxpos-staging.firebaseapp.com',
  'https://ventamaxpos.web.app',
  'https://ventamaxpos.firebaseapp.com',
  'https://ventamax.web.app',
  'https://ventamax.firebaseapp.com',
  'https://ventamax.vercel.app',
]);

const LOCAL_ORIGIN_PATTERN =
  /^https?:\/\/(?:localhost|127\.0\.0\.1|\[::1\])(?::\d+)?$/;

const getConfiguredOrigins = () =>
  String(process.env.VENTAMAX_HTTP_CORS_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

export const isAllowedHttpOrigin = (origin) => {
  if (!origin) return true;
  if (DEFAULT_HTTP_CORS_ORIGINS.has(origin)) return true;
  if (LOCAL_ORIGIN_PATTERN.test(origin)) return true;
  return getConfiguredOrigins().includes(origin);
};

export const applyHttpCors = (
  req,
  res,
  { methods = 'POST, OPTIONS', headers = 'Content-Type, Authorization' } = {},
) => {
  const origin =
    typeof req.headers?.origin === 'string' ? req.headers.origin : '';

  res.set('Vary', 'Origin');
  res.set('Access-Control-Allow-Methods', methods);
  res.set('Access-Control-Allow-Headers', headers);
  res.set('Cache-Control', 'no-store');
  res.set('X-Content-Type-Options', 'nosniff');

  if (!origin) return true;
  if (!isAllowedHttpOrigin(origin)) return false;

  res.set('Access-Control-Allow-Origin', origin);
  return true;
};
