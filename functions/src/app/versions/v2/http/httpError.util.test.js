import { describe, expect, it } from 'vitest';

import {
  ACCOUNTS_RECEIVABLE_AUDIT_HTTPS_ERROR_HTTP_STATUS,
  mapHttpsErrorToHttpStatus,
} from './httpError.util.js';

describe('httpError.util', () => {
  it('maps the shared HTTP HttpsError statuses', () => {
    expect(mapHttpsErrorToHttpStatus('cancelled')).toBe(499);
    expect(mapHttpsErrorToHttpStatus('unknown')).toBe(500);
    expect(mapHttpsErrorToHttpStatus('permission-denied')).toBe(403);
    expect(mapHttpsErrorToHttpStatus('unauthenticated')).toBe(401);
    expect(mapHttpsErrorToHttpStatus('not-found')).toBe(404);
    expect(mapHttpsErrorToHttpStatus('failed-precondition')).toBe(412);
    expect(mapHttpsErrorToHttpStatus('resource-exhausted')).toBe(429);
    expect(mapHttpsErrorToHttpStatus('already-exists')).toBe(409);
    expect(mapHttpsErrorToHttpStatus('invalid-argument')).toBe(400);
    expect(mapHttpsErrorToHttpStatus('deadline-exceeded')).toBe(504);
    expect(mapHttpsErrorToHttpStatus('unavailable')).toBe(503);
    expect(mapHttpsErrorToHttpStatus('internal')).toBe(500);
    expect(mapHttpsErrorToHttpStatus('data-loss')).toBe(500);
  });

  it('falls back to 400 for unmapped codes', () => {
    expect(mapHttpsErrorToHttpStatus('unknown-code')).toBe(400);
  });

  it('keeps auditAccountsReceivableHttp status overrides', () => {
    expect(
      mapHttpsErrorToHttpStatus(
        'already-exists',
        ACCOUNTS_RECEIVABLE_AUDIT_HTTPS_ERROR_HTTP_STATUS,
      ),
    ).toBe(400);
    expect(
      mapHttpsErrorToHttpStatus(
        'aborted',
        ACCOUNTS_RECEIVABLE_AUDIT_HTTPS_ERROR_HTTP_STATUS,
      ),
    ).toBe(400);
    expect(
      mapHttpsErrorToHttpStatus(
        'deadline-exceeded',
        ACCOUNTS_RECEIVABLE_AUDIT_HTTPS_ERROR_HTTP_STATUS,
      ),
    ).toBe(504);
    expect(
      mapHttpsErrorToHttpStatus(
        'unavailable',
        ACCOUNTS_RECEIVABLE_AUDIT_HTTPS_ERROR_HTTP_STATUS,
      ),
    ).toBe(503);
    expect(
      mapHttpsErrorToHttpStatus(
        'unknown-code',
        ACCOUNTS_RECEIVABLE_AUDIT_HTTPS_ERROR_HTTP_STATUS,
      ),
    ).toBe(400);
  });
});
