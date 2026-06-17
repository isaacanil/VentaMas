import { beforeEach, describe, expect, it, vi } from 'vitest';

const {
  buildFunctionsAuthHeaders,
  getFunctionsBaseUrl,
  parseFunctionsResponse,
} = vi.hoisted(() => ({
  buildFunctionsAuthHeaders: vi.fn(),
  getFunctionsBaseUrl: vi.fn(),
  parseFunctionsResponse: vi.fn(),
}));

vi.mock('@/services/functionsApiClient', () => ({
  buildFunctionsAuthHeaders,
  getFunctionsBaseUrl,
  parseFunctionsResponse,
}));

import { fetchAccountReceivableAudit } from './accountReceivableAuditHttp';

describe('accountReceivableAuditHttp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    buildFunctionsAuthHeaders.mockResolvedValue({
      Authorization: 'Bearer token-1',
      'X-Session-Token': 'session-1',
    });
    getFunctionsBaseUrl.mockReturnValue('https://functions.test');
    parseFunctionsResponse.mockResolvedValue({
      businessId: 'business-1',
      generatedAt: '2026-06-17T00:00:00.000Z',
      indicators: {},
    });
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => new Response(JSON.stringify({ ok: true }))),
    );
  });

  it('posts to the account receivable audit endpoint with auth headers', async () => {
    await fetchAccountReceivableAudit({
      businessId: 'business-1',
      sampleLimit: 15,
    });

    expect(fetch).toHaveBeenCalledWith(
      'https://functions.test/auditAccountsReceivableHttp',
      {
        method: 'POST',
        headers: {
          Authorization: 'Bearer token-1',
          'X-Session-Token': 'session-1',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          businessId: 'business-1',
          sampleLimit: 15,
          sessionToken: 'session-1',
        }),
      },
    );
    expect(parseFunctionsResponse).toHaveBeenCalledOnce();
  });

  it('requires a business id before calling functions', async () => {
    await expect(
      fetchAccountReceivableAudit({ businessId: '' }),
    ).rejects.toThrow('Debes indicar businessId.');

    expect(buildFunctionsAuthHeaders).not.toHaveBeenCalled();
    expect(fetch).not.toHaveBeenCalled();
  });
});
