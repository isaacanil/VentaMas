import { describe, expect, it } from 'vitest';

import {
  allocateFunctionalAmountsByDocument,
  applyReceivableMonetarySettlement,
  buildReceivableFxSettlementRecord,
  buildReceivableMonetarySnapshotFromSource,
  resolvePaymentAppliedDocumentAmount,
  resolvePaymentCollectedFunctionalAmount,
  reverseReceivableMonetarySettlement,
  shouldTrackFxSettlement,
} from './receivableMonetary.util.js';

describe('receivableMonetary.util', () => {
  const sourceMonetary = {
    schemaVersion: 1,
    documentCurrency: { code: 'USD' },
    functionalCurrency: { code: 'DOP' },
    exchangeRateSnapshot: {
      rate: 58,
      quoteCurrency: 'USD',
      baseCurrency: 'DOP',
    },
    documentTotals: {
      total: 100,
      paid: 0,
      balance: 100,
    },
    functionalTotals: {
      total: 5800,
      paid: 0,
      balance: 5800,
    },
  };

  it('builds an A/R monetary snapshot from the invoice snapshot', () => {
    expect(
      buildReceivableMonetarySnapshotFromSource({
        sourceMonetary,
        documentTotal: 100,
      }),
    ).toEqual(
      expect.objectContaining({
        documentTotals: expect.objectContaining({
          total: 100,
          paid: 0,
          balance: 100,
        }),
        functionalTotals: expect.objectContaining({
          total: 5800,
          paid: 0,
          balance: 5800,
        }),
      }),
    );
  });

  it('applies and reverses the historical functional carrying amount proportionally', () => {
    const applied = applyReceivableMonetarySettlement({
      accountMonetary: sourceMonetary,
      appliedDocumentAmount: 40,
    });

    expect(applied.historicalFunctionalAmount).toBe(2320);
    expect(applied.nextMonetary).toEqual(
      expect.objectContaining({
        documentTotals: expect.objectContaining({
          total: 100,
          paid: 40,
          balance: 60,
        }),
        functionalTotals: expect.objectContaining({
          total: 5800,
          paid: 2320,
          balance: 3480,
        }),
      }),
    );

    const reversed = reverseReceivableMonetarySettlement({
      accountMonetary: applied.nextMonetary,
      restoredDocumentAmount: 40,
      restoredHistoricalFunctionalAmount: 2320,
    });

    expect(reversed.nextMonetary).toEqual(
      expect.objectContaining({
        documentTotals: expect.objectContaining({
          total: 100,
          paid: 0,
          balance: 100,
        }),
        functionalTotals: expect.objectContaining({
          total: 5800,
          paid: 0,
          balance: 5800,
        }),
      }),
    );
  });

  it('separates applied document amount from collected functional amount', () => {
    const paymentMonetary = {
      documentCurrency: { code: 'USD' },
      functionalCurrency: { code: 'DOP' },
      documentTotals: { total: 100 },
      functionalTotals: { total: 5900 },
    };

    expect(
      resolvePaymentAppliedDocumentAmount({
        pilotMonetarySnapshot: paymentMonetary,
        fallbackAmount: 5900,
      }),
    ).toBe(100);
    expect(
      resolvePaymentCollectedFunctionalAmount({
        pilotMonetarySnapshot: paymentMonetary,
        fallbackAmount: 5900,
      }),
    ).toBe(5900);
    expect(
      allocateFunctionalAmountsByDocument({
        entries: [{ totalPaid: 100 }],
        totalFunctionalAmount: 5900,
      }),
    ).toEqual([5900]);
    expect(
      shouldTrackFxSettlement({
        accountMonetary: sourceMonetary,
        paymentMonetary,
      }),
    ).toBe(true);
  });

  it('builds the FX settlement event with gain or loss amount', () => {
    expect(
      buildReceivableFxSettlementRecord({
        businessId: 'biz_1',
        paymentId: 'pay_1',
        arId: 'ar_1',
        invoiceId: 'inv_1',
        clientId: 'client_1',
        accountMonetaryBefore: sourceMonetary,
        accountMonetaryAfter: {
          ...sourceMonetary,
          documentTotals: { total: 100, paid: 100, balance: 0 },
          functionalTotals: { total: 5800, paid: 5800, balance: 0 },
        },
        paymentMonetary: {
          documentCurrency: { code: 'USD' },
          functionalCurrency: { code: 'DOP' },
          documentTotals: { total: 100 },
          functionalTotals: { total: 5900 },
        },
        appliedDocumentAmount: 100,
        historicalFunctionalAmount: 5800,
        settlementFunctionalAmount: 5900,
        occurredAt: 1_800_000_000_000,
        createdAt: 1_800_000_000_000,
        createdBy: 'user_1',
      }),
    ).toEqual(
      expect.objectContaining({
        id: 'pay_1_ar_1',
        fxGainLossAmount: 100,
        fxDirection: 'gain',
      }),
    );
  });
});
