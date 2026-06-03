import { describe, expect, it, vi, afterEach } from 'vitest';

import { applyHttpCors, isAllowedHttpOrigin } from './httpCors.util.js';

const createResponse = () => {
  const headers = new Map();
  return {
    headers,
    set: vi.fn((key, value) => {
      headers.set(key, value);
    }),
  };
};

describe('httpCors.util', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
  });

  it('allows known app and local origins', () => {
    expect(isAllowedHttpOrigin('https://ventamax.web.app')).toBe(true);
    expect(isAllowedHttpOrigin('https://ventamax-staging.web.app')).toBe(true);
    expect(isAllowedHttpOrigin('http://localhost:3000')).toBe(true);
    expect(isAllowedHttpOrigin('http://127.0.0.1:5173')).toBe(true);
  });

  it('allows explicitly configured extra origins', () => {
    vi.stubEnv(
      'VENTAMAX_HTTP_CORS_ORIGINS',
      'https://preview.example.com, https://qa.example.com',
    );

    expect(isAllowedHttpOrigin('https://preview.example.com')).toBe(true);
    expect(isAllowedHttpOrigin('https://qa.example.com')).toBe(true);
  });

  it('does not reflect unknown origins', () => {
    const res = createResponse();
    const allowed = applyHttpCors(
      { headers: { origin: 'https://evil.example' } },
      res,
    );

    expect(allowed).toBe(false);
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeUndefined();
    expect(res.headers.get('Vary')).toBe('Origin');
  });
});
