import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  callableRunner: vi.fn(),
  createFirebaseCallable: vi.fn(),
  getStoredSession: vi.fn(),
}));

vi.mock('@/firebase/functions/callable', () => ({
  createFirebaseCallable: mocks.createFirebaseCallable,
}));

vi.mock('@/firebase/Auth/fbAuthV2/sessionClient', () => ({
  getStoredSession: mocks.getStoredSession,
}));

import { createElectronicTaxReceiptCallable } from './callElectronicTaxReceipt';

describe('createElectronicTaxReceiptCallable', () => {
  beforeEach(() => {
    mocks.callableRunner.mockReset();
    mocks.createFirebaseCallable.mockReset();
    mocks.getStoredSession.mockReset();

    mocks.callableRunner.mockResolvedValue({ ok: true });
    mocks.createFirebaseCallable.mockReturnValue(mocks.callableRunner);
  });

  it('inyecta sessionToken cuando existe y preserva el payload original', async () => {
    mocks.getStoredSession.mockReturnValue({
      sessionToken: 'session-token-1',
      sessionExpiresAt: null,
      sessionId: null,
      deviceId: null,
    });

    const callable = createElectronicTaxReceiptCallable<
      {
        businessId: string;
        receiptId: string;
        metadata: { source: string; retry: boolean };
      },
      { ok: boolean }
    >('issueElectronicTaxReceipt');
    const payload = {
      businessId: 'business-1',
      receiptId: 'receipt-1',
      metadata: { source: 'invoice-panel', retry: false },
    };

    await expect(callable(payload)).resolves.toEqual({ ok: true });

    expect(mocks.createFirebaseCallable).toHaveBeenCalledWith(
      'issueElectronicTaxReceipt',
    );
    expect(mocks.callableRunner).toHaveBeenCalledWith({
      businessId: 'business-1',
      receiptId: 'receipt-1',
      metadata: { source: 'invoice-panel', retry: false },
      sessionToken: 'session-token-1',
    });
    expect(payload).toEqual({
      businessId: 'business-1',
      receiptId: 'receipt-1',
      metadata: { source: 'invoice-panel', retry: false },
    });
  });

  it('no envia sessionToken cuando falta y mantiene el payload', async () => {
    mocks.getStoredSession.mockReturnValue({
      sessionToken: null,
      sessionExpiresAt: null,
      sessionId: null,
      deviceId: null,
    });

    const callable = createElectronicTaxReceiptCallable<
      {
        businessId: string;
        receiptId: string;
        amount: number;
      },
      { ok: boolean }
    >('refreshElectronicTaxReceiptStatus');
    const payload = {
      businessId: 'business-1',
      receiptId: 'receipt-2',
      amount: 1250,
    };

    await callable(payload);

    const forwardedPayload = mocks.callableRunner.mock.calls[0]?.[0] as Record<
      string,
      unknown
    >;

    expect(forwardedPayload).toEqual(payload);
    expect(forwardedPayload).not.toHaveProperty('sessionToken');
  });
});
