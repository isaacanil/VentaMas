import { describe, expect, it, vi, afterEach } from 'vitest';

import {
  applyHttpCors,
  handleHttpCorsPreflightAndMethod,
  isAllowedHttpOrigin,
} from './httpCors.util.js';

const createResponse = () => {
  const headers = new Map();
  const res = {
    headers,
    set: vi.fn((key, value) => {
      headers.set(key, value);
    }),
    status: vi.fn((statusCode) => {
      res.statusCode = statusCode;
      return res;
    }),
    json: vi.fn((body) => {
      res.body = body;
      return res;
    }),
    send: vi.fn((body) => {
      res.body = body;
      return res;
    }),
  };
  return res;
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

  it('handles allowed preflight with the existing empty body', () => {
    const res = createResponse();
    const handled = handleHttpCorsPreflightAndMethod(
      {
        method: 'OPTIONS',
        headers: { origin: 'https://ventamax.web.app' },
      },
      res,
      {
        allowedMethod: 'POST',
        methods: 'POST, OPTIONS',
        headers: 'Content-Type, Authorization, X-Session-Token',
      },
    );

    expect(handled).toBe(true);
    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.send).toHaveBeenCalledWith('');
    expect(res.json).not.toHaveBeenCalled();
    expect(res.headers.get('Access-Control-Allow-Origin')).toBe(
      'https://ventamax.web.app',
    );
  });

  it('handles blocked preflight with the existing empty body', () => {
    const res = createResponse();
    const handled = handleHttpCorsPreflightAndMethod(
      {
        method: 'OPTIONS',
        headers: { origin: 'https://evil.example' },
      },
      res,
    );

    expect(handled).toBe(true);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.send).toHaveBeenCalledWith('');
    expect(res.json).not.toHaveBeenCalled();
    expect(res.headers.get('Access-Control-Allow-Origin')).toBeUndefined();
  });

  it('handles blocked origins with the existing JSON body', () => {
    const res = createResponse();
    const handled = handleHttpCorsPreflightAndMethod(
      {
        method: 'POST',
        headers: { origin: 'https://evil.example' },
      },
      res,
    );

    expect(handled).toBe(true);
    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({ error: 'Origin not allowed' });
    expect(res.send).not.toHaveBeenCalled();
  });

  it('handles unsupported methods with the existing JSON body', () => {
    const res = createResponse();
    const handled = handleHttpCorsPreflightAndMethod(
      {
        method: 'GET',
        headers: { origin: 'https://ventamax.web.app' },
      },
      res,
      { allowedMethod: 'POST' },
    );

    expect(handled).toBe(true);
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.json).toHaveBeenCalledWith({ error: 'Method Not Allowed' });
    expect(res.send).not.toHaveBeenCalled();
  });

  it('leaves allowed requests for the controller body', () => {
    const res = createResponse();
    const handled = handleHttpCorsPreflightAndMethod(
      {
        method: 'POST',
        headers: { origin: 'https://ventamax.web.app' },
      },
      res,
      {
        allowedMethod: 'POST',
        methods: 'POST, OPTIONS',
        headers: 'Content-Type, Authorization, X-Session-Token',
      },
    );

    expect(handled).toBe(false);
    expect(res.status).not.toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
    expect(res.send).not.toHaveBeenCalled();
    expect(res.headers.get('Access-Control-Allow-Methods')).toBe(
      'POST, OPTIONS',
    );
    expect(res.headers.get('Access-Control-Allow-Headers')).toBe(
      'Content-Type, Authorization, X-Session-Token',
    );
  });
});
