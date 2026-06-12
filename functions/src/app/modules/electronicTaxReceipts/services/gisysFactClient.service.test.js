import { afterEach, describe, expect, it, vi } from 'vitest';
import { HttpsError } from 'firebase-functions/v2/https';

import { issueGisysFactDocument } from './gisysFactClient.service.js';

describe('gisysFactClient.service', () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it('summarizes failed GISYS responses without exposing the raw body', async () => {
    vi.stubEnv('GISYS_FACT_CLIENT_TOKEN', 'secret-token');
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: false,
        status: 400,
        text: async () =>
          JSON.stringify({
            message: 'RNC 001-1234567-8 rejected for john@example.com',
            rawXml: '<secret>payload</secret>',
          }),
      })),
    );

    const promise = issueGisysFactDocument({
      config: {
        baseUrl: 'https://gisys.example',
        timeoutMs: 1000,
        tokenEnvName: 'GISYS_FACT_CLIENT_TOKEN',
      },
      payload: { invoiceId: 'invoice-1' },
      idempotencyKey: 'idem-1',
    });

    await expect(promise).rejects.toMatchObject({
      code: 'failed-precondition',
      message: 'GISYS FACT issue failed (400)',
      details: {
        reason: 'gisys-issue-failed',
        status: 400,
        responseSummary: {
          hasMessage: true,
          keys: ['message', 'rawXml'],
          message: 'RNC [id] rejected for [email]',
        },
      },
    });

    await promise.catch((error) => {
      expect(error).toBeInstanceOf(HttpsError);
      expect(JSON.stringify(error)).not.toContain('john@example.com');
      expect(JSON.stringify(error)).not.toContain('<secret>payload</secret>');
    });
  });
});
