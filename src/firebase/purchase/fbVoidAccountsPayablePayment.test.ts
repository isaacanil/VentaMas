import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const callableRunner = vi.fn();

  return {
    callableRunner,
    createFirebaseCallable: vi.fn(() => callableRunner),
    getStoredSession: vi.fn(),
  };
});

vi.mock('@/firebase/functions/callable', () => ({
  createFirebaseCallable: mocks.createFirebaseCallable,
}));

vi.mock('@/firebase/Auth/fbAuthV2/sessionClient', () => ({
  getStoredSession: mocks.getStoredSession,
}));

import { fbVoidAccountsPayablePayment } from './fbVoidAccountsPayablePayment';

describe('fbVoidAccountsPayablePayment', () => {
  beforeEach(() => {
    mocks.callableRunner.mockReset();
    mocks.createFirebaseCallable.mockClear();
    mocks.getStoredSession.mockReset();

    mocks.callableRunner.mockResolvedValue({
      ok: true,
      paymentId: 'payment-1',
      purchaseId: 'purchase-1',
      paymentState: null,
    });
    mocks.getStoredSession.mockReturnValue({ sessionToken: 'session-1' });
  });

  it('requires a void reason before calling the backend', async () => {
    await expect(
      fbVoidAccountsPayablePayment(
        {
          uid: 'user-1',
          businessID: 'business-1',
        },
        {
          paymentId: 'payment-1',
          reason: '  ',
        },
      ),
    ).rejects.toThrow(
      'Debe indicar un motivo de anulación con al menos 5 caracteres.',
    );

    expect(mocks.callableRunner).not.toHaveBeenCalled();
  });

  it('requires void evidence before calling the backend', async () => {
    await expect(
      fbVoidAccountsPayablePayment(
        {
          uid: 'user-1',
          businessID: 'business-1',
        },
        {
          paymentId: 'payment-1',
          reason: 'Pago duplicado',
          evidenceNote: '  ',
        },
      ),
    ).rejects.toThrow(
      'Debe indicar una evidencia o referencia para anular el pago al proveedor.',
    );

    expect(mocks.callableRunner).not.toHaveBeenCalled();
  });

  it('trims and forwards the reason and evidence with the active session token', async () => {
    await expect(
      fbVoidAccountsPayablePayment(
        {
          uid: 'user-1',
          businessID: 'business-1',
        },
        {
          paymentId: 'payment-1',
          evidenceNote: '  Ticket AP-104  ',
          evidenceUrls: [' https://files.example/ap-104.pdf ', '  '],
          reason: '  Pago duplicado  ',
        },
      ),
    ).resolves.toMatchObject({
      ok: true,
      paymentId: 'payment-1',
    });

    expect(mocks.callableRunner).toHaveBeenCalledWith({
      businessId: 'business-1',
      evidenceNote: 'Ticket AP-104',
      evidenceUrls: ['https://files.example/ap-104.pdf'],
      paymentId: 'payment-1',
      reason: 'Pago duplicado',
      sessionToken: 'session-1',
    });
  });
});
