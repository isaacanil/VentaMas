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

import { fbAddAccountsPayablePayment } from './fbAddAccountsPayablePayment';

describe('fbAddAccountsPayablePayment', () => {
  beforeEach(() => {
    mocks.callableRunner.mockReset();
    mocks.createFirebaseCallable.mockClear();
    mocks.getStoredSession.mockReset();

    mocks.callableRunner.mockResolvedValue({
      ok: true,
      paymentId: 'payment-1',
      purchaseId: 'purchase-1',
      vendorBillId: 'purchase:purchase-1',
      paymentState: null,
      receiptNumber: null,
    });
    mocks.getStoredSession.mockReturnValue({ sessionToken: 'session-1' });
  });

  it('requires payment evidence before calling the backend', async () => {
    await expect(
      fbAddAccountsPayablePayment(
        {
          uid: 'user-1',
          businessID: 'business-1',
        },
        {
          purchase: {
            id: 'purchase-1',
          } as never,
          occurredAt: 1_782_777_600_000,
          idempotencyKey: 'idempotency-1',
          evidenceNote: '  ',
          paymentMethods: [
            {
              method: 'cash',
              value: 100,
              status: true,
              cashCountId: 'cash-count-1',
            },
          ],
        },
      ),
    ).rejects.toThrow(
      'Debe indicar una evidencia o referencia para registrar el pago al proveedor.',
    );

    expect(mocks.callableRunner).not.toHaveBeenCalled();
  });

  it('forwards vendor bill and payment run context to the backend', async () => {
    await expect(
      fbAddAccountsPayablePayment(
        {
          uid: 'user-1',
          businessID: 'business-1',
        },
        {
          purchase: {
            id: ' purchase-1 ',
          } as never,
          vendorBillId: ' purchase:purchase-1 ',
          paymentRunId: ' payment-run-1 ',
          occurredAt: 1_782_777_600_000,
          nextPaymentAt: null,
          idempotencyKey: ' idempotency-1 ',
          note: 'Pago de corrida aprobada',
          evidenceNote: '  Ticket AP-108  ',
          evidenceUrls: [' https://files.example/ap-108.pdf ', '  '],
          paymentMethods: [
            {
              method: 'cash',
              value: 100,
              status: true,
              cashCountId: 'cash-count-1',
            },
          ],
          withholdingApplications: [],
        },
      ),
    ).resolves.toMatchObject({
      ok: true,
      paymentId: 'payment-1',
    });

    expect(mocks.callableRunner).toHaveBeenCalledWith({
      businessId: 'business-1',
      purchaseId: 'purchase-1',
      vendorBillId: 'purchase:purchase-1',
      paymentRunId: 'payment-run-1',
      occurredAt: 1_782_777_600_000,
      nextPaymentAt: null,
      idempotencyKey: ' idempotency-1 ',
      note: 'Pago de corrida aprobada',
      evidenceNote: 'Ticket AP-108',
      evidenceUrls: ['https://files.example/ap-108.pdf'],
      paymentMethods: [
        {
          method: 'cash',
          value: 100,
          status: true,
          cashCountId: 'cash-count-1',
        },
      ],
      withholdingApplications: [],
      sessionToken: 'session-1',
    });
  });
});
