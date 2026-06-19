import { beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => {
  const callableRunner = vi.fn();
  return {
    callableRunner,
    createFirebaseCallable: vi.fn(() => callableRunner),
  };
});

vi.mock('@/firebase/functions/callable', () => ({
  createFirebaseCallable: mocks.createFirebaseCallable,
}));

import { fbAddBillToOpenCashCount } from './fbAddBillToOpenCashCount';

describe('fbAddBillToOpenCashCount', () => {
  beforeEach(() => {
    mocks.callableRunner.mockReset();

    mocks.callableRunner.mockResolvedValue({
      ok: true,
      businessId: 'business-1',
      cashCountId: 'cash-1',
      invoiceId: 'invoice-1',
    });
  });

  it('delegates the cash count sale link to the backend callable', async () => {
    await expect(
      fbAddBillToOpenCashCount(
        { uid: 'user-1', businessID: 'business-1' },
        {
          id: 'invoice-1',
          path: 'businesses/business-1/invoices/invoice-1',
        } as never,
      ),
    ).resolves.toBe('cash-1');

    expect(mocks.createFirebaseCallable).toHaveBeenCalledWith(
      'addInvoiceToOpenCashCount',
    );
    expect(mocks.callableRunner).toHaveBeenCalledWith({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
      invoicePath: 'businesses/business-1/invoices/invoice-1',
    });
  });

  it('does not call the backend when business or invoice identity is missing', async () => {
    await expect(
      fbAddBillToOpenCashCount(
        { uid: 'user-1' },
        {
          id: 'invoice-1',
          path: 'businesses/business-1/invoices/invoice-1',
        } as never,
      ),
    ).resolves.toBeUndefined();

    expect(mocks.callableRunner).not.toHaveBeenCalled();
  });
});
