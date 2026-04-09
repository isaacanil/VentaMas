import { describe, expect, it } from 'vitest';

import {
  buildJournalEntry,
  computeJournalEntryTotals,
  isJournalEntryBalanced,
  resolveJournalPeriodKey,
} from './journalEntry.util.js';

describe('journalEntry.util', () => {
  it('resuelve el periodo contable desde una fecha', () => {
    expect(resolveJournalPeriodKey(new Date('2026-03-24T12:00:00.000Z'))).toBe(
      '2026-03',
    );
  });

  it('calcula totales debit y credit', () => {
    expect(
      computeJournalEntryTotals([
        { debit: 150.255, credit: 0 },
        { debit: 0, credit: 150.255 },
      ]),
    ).toEqual({
      debit: 150.26,
      credit: 150.26,
    });
  });

  it('detecta cuando el asiento esta balanceado', () => {
    expect(
      isJournalEntryBalanced([
        { debit: 250, credit: 0 },
        { debit: 0, credit: 250 },
      ]),
    ).toBe(true);

    expect(
      isJournalEntryBalanced([
        { debit: 250, credit: 0 },
        { debit: 0, credit: 249.5 },
      ]),
    ).toBe(false);
  });

  it('construye journal entries canonicos desde el evento', () => {
    const entry = buildJournalEntry({
      businessId: 'business-1',
      event: {
        id: 'accounts_receivable.payment.recorded__pay-1',
        businessId: 'business-1',
        eventType: 'accounts_receivable.payment.recorded',
        eventVersion: 1,
        occurredAt: new Date('2026-03-24T12:00:00.000Z'),
        currency: 'USD',
        functionalCurrency: 'DOP',
        sourceType: 'accountsReceivablePayment',
        sourceId: 'pay-1',
      },
      description: 'Cobro aplicado',
      lines: [
        {
          accountId: 'cash',
          debit: 100,
          credit: 0,
        },
        {
          accountId: 'accounts-receivable',
          debit: 0,
          credit: 100,
        },
      ],
    });

    expect(entry).toMatchObject({
      id: 'accounts_receivable.payment.recorded__pay-1',
      businessId: 'business-1',
      eventId: 'accounts_receivable.payment.recorded__pay-1',
      eventType: 'accounts_receivable.payment.recorded',
      periodKey: '2026-03',
      currency: 'USD',
      functionalCurrency: 'DOP',
      totals: {
        debit: 100,
        credit: 100,
      },
    });
    expect(entry.lines).toHaveLength(2);
  });
});
