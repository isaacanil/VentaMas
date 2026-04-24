import { describe, expect, it } from 'vitest';

import { suggestBankStatementLineMatch } from './bankStatementMatching';

describe('suggestBankStatementLineMatch', () => {
  it('suggests a single exact movement when amount and reference align', () => {
    const suggestion = suggestBankStatementLineMatch({
      entries: [
        {
          accountId: 'bank-1',
          accountType: 'bank',
          amount: 100,
          businessId: 'business-1',
          createdAt: '2026-04-10T00:00:00.000Z',
          currency: 'DOP',
          direction: 'in',
          id: 'mov-1',
          occurredAt: '2026-04-10T00:00:00.000Z',
          reconciliationStatus: 'unreconciled',
          reference: 'DEP-001',
          sourceType: 'receivable_payment',
          status: 'posted',
        },
      ],
      line: {
        amount: 100,
        bankAccountId: 'bank-1',
        businessId: 'business-1',
        direction: 'in',
        id: 'line-1',
        lineType: 'transaction',
        reference: 'DEP-001',
        statementDate: '2026-04-11T00:00:00.000Z',
        status: 'pending',
      },
    });

    expect(suggestion).toEqual(
      expect.objectContaining({
        confidence: 'high',
        movementIds: ['mov-1'],
        movementTotal: 100,
      }),
    );
  });

  it('suggests an exact two-movement combination when no single match exists', () => {
    const suggestion = suggestBankStatementLineMatch({
      entries: [
        {
          accountId: 'bank-1',
          accountType: 'bank',
          amount: 60,
          businessId: 'business-1',
          createdAt: '2026-04-10T00:00:00.000Z',
          currency: 'DOP',
          direction: 'in',
          id: 'mov-1',
          occurredAt: '2026-04-10T00:00:00.000Z',
          reconciliationStatus: 'unreconciled',
          reference: 'PAGO A',
          sourceType: 'receivable_payment',
          status: 'posted',
        },
        {
          accountId: 'bank-1',
          accountType: 'bank',
          amount: 40,
          businessId: 'business-1',
          createdAt: '2026-04-10T00:00:00.000Z',
          currency: 'DOP',
          direction: 'in',
          id: 'mov-2',
          occurredAt: '2026-04-10T00:00:00.000Z',
          reconciliationStatus: 'unreconciled',
          reference: 'PAGO B',
          sourceType: 'receivable_payment',
          status: 'posted',
        },
      ],
      line: {
        amount: 100,
        bankAccountId: 'bank-1',
        businessId: 'business-1',
        direction: 'in',
        id: 'line-1',
        lineType: 'transaction',
        reference: 'DEPOSITO LOTE',
        statementDate: '2026-04-11T00:00:00.000Z',
        status: 'pending',
      },
    });

    expect(suggestion).toEqual(
      expect.objectContaining({
        movementIds: ['mov-1', 'mov-2'],
        movementTotal: 100,
      }),
    );
  });
});
