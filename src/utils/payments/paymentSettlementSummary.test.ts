import { describe, expect, it } from 'vitest';

import { resolvePaymentSettlementSummary } from './paymentSettlementSummary';

describe('resolvePaymentSettlementSummary', () => {
  it('separates cash, fiscal withholdings and settlement amount', () => {
    expect(
      resolvePaymentSettlementSummary({
        settlementAmount: 1180,
        totalAmount: 1106,
        withholdingAmount: 74,
        withholdingApplications: [
          { amount: 54, type: 'itbis' },
          { amount: 20, type: 'isr' },
        ],
      }),
    ).toEqual({
      cashAmount: 1106,
      hasWithholdingSettlement: true,
      isSettlementDifferentFromCash: true,
      settlementAmount: 1180,
      withholdingAmount: 74,
      withholdingBreakdown: [
        { amount: 54, label: 'Retención ITBIS', type: 'itbis' },
        { amount: 20, label: 'Retención ISR', type: 'isr' },
      ],
    });
  });

  it('derives withholding and settlement from applications when totals are absent', () => {
    expect(
      resolvePaymentSettlementSummary({
        totalAmount: 1106,
        withholdingApplications: [
          { amount: 54.25, type: 'itbis' },
          { amount: 19.75, type: 'isr' },
        ],
      }),
    ).toMatchObject({
      cashAmount: 1106,
      settlementAmount: 1180,
      withholdingAmount: 74,
    });
  });

  it('shows an aggregate fiscal line when only withholdingAmount exists', () => {
    expect(
      resolvePaymentSettlementSummary({
        totalAmount: 1106,
        withholdingAmount: 74,
      }).withholdingBreakdown,
    ).toEqual([{ amount: 74, label: 'Retención fiscal', type: 'other' }]);
  });

  it('keeps legacy payments as cash-only settlements', () => {
    expect(
      resolvePaymentSettlementSummary({
        totalAmount: 500,
      }),
    ).toEqual({
      cashAmount: 500,
      hasWithholdingSettlement: false,
      isSettlementDifferentFromCash: false,
      settlementAmount: 500,
      withholdingAmount: 0,
      withholdingBreakdown: [],
    });
  });
});
