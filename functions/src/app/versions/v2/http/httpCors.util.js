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

export const handleHttpCorsPreflightAndMethod = (
  req,
  res,
  {
    allowedMethod = 'POST',
    methods = `${allowedMethod}, OPTIONS`,
    headers = 'Content-Type, Authorization',
  } = {},
) => {
  const corsAllowed = applyHttpCors(req, res, { methods, headers });

  if (req.method === 'OPTIONS') {
    if (!corsAllowed) {
      res.status(403).send('');
      return true;
    }
    res.status(204).send('');
    return true;
  }

  if (!corsAllowed) {
    res.status(403).json({ error: 'Origin not allowed' });
    return true;
  }

  if (req.method !== allowedMethod) {
    res.status(405).json({ error: 'Method Not Allowed' });
    return true;
  }

  return false;
};
