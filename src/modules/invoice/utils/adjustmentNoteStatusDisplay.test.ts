import { describe, expect, it } from 'vitest';

import {
  resolveCreditNoteUsageStatusDisplay,
  resolveDebitNoteOperationalStatusDisplay,
} from './adjustmentNoteStatusDisplay';

describe('adjustment note status display helpers', () => {
  it('keeps credit note usage separate from fiscal pending statuses', () => {
    expect(
      resolveCreditNoteUsageStatusDisplay({
        status: 'electronic_pending',
        totalAmount: 100,
        availableAmount: 100,
      }),
    ).toEqual({ label: 'Sin Aplicar', color: 'default' });
  });

  it('detects partially used credit notes from the available amount', () => {
    expect(
      resolveCreditNoteUsageStatusDisplay({
        status: 'issued',
        totalAmount: 100,
        availableAmount: 25,
      }),
    ).toEqual({ label: 'Parcialmente Usada', color: 'green' });
  });

  it('maps fully used and cancelled credit notes from their explicit status', () => {
    expect(
      resolveCreditNoteUsageStatusDisplay({
        status: 'fully_used',
        totalAmount: 100,
        availableAmount: 0,
      }),
    ).toEqual({ label: 'Totalmente Usada', color: 'orange' });
    expect(
      resolveCreditNoteUsageStatusDisplay({
        status: 'cancelled',
        totalAmount: 100,
        availableAmount: 100,
      }),
    ).toEqual({ label: 'Anulada', color: 'red' });
  });

  it('keeps debit note fiscal processing statuses visible', () => {
    expect(
      resolveDebitNoteOperationalStatusDisplay({
        status: 'electronic_pending',
      }),
    ).toEqual({ label: 'Pendiente e-CF', color: 'gold' });
    expect(
      resolveDebitNoteOperationalStatusDisplay({
        status: 'electronic_failed',
      }),
    ).toEqual({ label: 'e-CF Fallido', color: 'red' });
  });

  it('maps debit note collection and cancellation statuses', () => {
    expect(
      resolveDebitNoteOperationalStatusDisplay({ status: 'paid' }),
    ).toEqual({
      label: 'Pagada',
      color: 'green',
    });
    expect(
      resolveDebitNoteOperationalStatusDisplay({ status: 'partially_paid' }),
    ).toEqual({ label: 'Pago Parcial', color: 'gold' });
    expect(
      resolveDebitNoteOperationalStatusDisplay({ status: 'cancelled' }),
    ).toEqual({ label: 'Anulada', color: 'red' });
  });
});
