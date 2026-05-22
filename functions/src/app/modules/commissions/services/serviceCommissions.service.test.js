import { describe, expect, it, vi } from 'vitest';

vi.mock('../../../core/config/firebase.js', () => ({
  FieldValue: {
    serverTimestamp: () => 'server-timestamp',
  },
  db: {
    doc: (path) => ({ path }),
  },
}));

import {
  buildServiceCommissionRecords,
  calculateServiceCommissionAmount,
  normalizeServiceCommissionSettings,
  resolveServiceCommissionBaseAmount,
  voidServiceCommissionsTx,
} from './serviceCommissions.service.js';

describe('serviceCommissions.service', () => {
  it('keeps service commissions disabled by default', () => {
    expect(normalizeServiceCommissionSettings({}).enabled).toBe(false);
  });

  it('calculates commission on net subtotal without tax', () => {
    const baseAmount = resolveServiceCommissionBaseAmount({
      itemType: 'service',
      pricing: { price: 100 },
      amountToBuy: 2,
      discount: { type: 'percentage', value: 10 },
    });

    expect(baseAmount).toBe(180);
    expect(
      calculateServiceCommissionAmount({
        baseAmount,
        rateValue: 15,
        type: 'percentage',
      }),
    ).toBe(27);
  });

  it('builds records only for service lines with collaborator snapshots', () => {
    const records = buildServiceCommissionRecords({
      businessId: 'business-1',
      invoiceId: 'invoice-1',
      invoice: {
        date: 1710000000000,
        numberID: 'F-001',
      },
      settings: {
        serviceCommissions: {
          enabled: true,
          defaultRate: 10,
          defaultType: 'percentage',
        },
      },
      products: [
        {
          id: 'service-1',
          cid: 'line-1',
          itemType: 'service',
          name: 'Consulta',
          pricing: { price: 500 },
          amountToBuy: 1,
          serviceCommission: {
            collaborator: {
              id: 'user-1',
              code: '12',
              name: 'Ana',
            },
            rateValue: 20,
            type: 'percentage',
          },
        },
        {
          id: 'product-1',
          itemType: 'product',
          name: 'Producto',
          pricing: { price: 100 },
          serviceCommission: {
            collaborator: { code: '13' },
            rateValue: 20,
          },
        },
      ],
      userId: 'cashier-1',
    });

    expect(records).toHaveLength(1);
    expect(records[0]).toMatchObject({
      id: 'invoice-1_line-1',
      invoiceId: 'invoice-1',
      invoiceNumber: 'F-001',
      serviceId: 'service-1',
      serviceName: 'Consulta',
      collaboratorCode: '12',
      collaboratorName: 'Ana',
      billedAmount: 500,
      amountFactured: 500,
      commissionAmount: 100,
      status: 'active',
    });
  });

  it('marks existing commission records voided in the invoice transaction', () => {
    const transaction = { set: vi.fn() };
    const commissionSnap = {
      docs: [
        { ref: { path: 'commissions/1' } },
        { ref: { path: 'commissions/2' } },
      ],
    };

    const count = voidServiceCommissionsTx(transaction, {
      authUid: 'user-1',
      commissionSnap,
      reasonLabel: 'Anulacion',
      voidedAt: 'now',
    });

    expect(count).toBe(2);
    expect(transaction.set).toHaveBeenCalledTimes(2);
    expect(transaction.set).toHaveBeenCalledWith(
      { path: 'commissions/1' },
      expect.objectContaining({
        status: 'voided',
        voidedBy: 'user-1',
        voidReason: 'Anulacion',
      }),
      { merge: true },
    );
  });
});
