import { describe, expect, it } from 'vitest';

import {
  buildAccountingEvent,
  buildAccountingEventId,
  resolveAccountingPaymentChannel,
  resolvePrimaryBankAccountId,
} from './accountingEvent.util.js';

describe('accountingEvent.util', () => {
  it('construye ids deterministas para el evento', () => {
    expect(
      buildAccountingEventId({
        eventType: 'accounts_receivable.payment.recorded',
        sourceId: 'pay/001',
      }),
    ).toBe('accounts_receivable.payment.recorded__pay_001');
  });

  it('resuelve el canal de tesoreria segun metodos de pago', () => {
    expect(resolveAccountingPaymentChannel([{ method: 'cash', value: 100 }])).toBe(
      'cash',
    );
    expect(
      resolveAccountingPaymentChannel([{ method: 'credit_card', value: 100 }]),
    ).toBe('bank');
    expect(
      resolveAccountingPaymentChannel([
        { method: 'cash', value: 60 },
        { method: 'transfer', value: 40 },
      ]),
    ).toBe('mixed');
    expect(
      resolveAccountingPaymentChannel([
        { method: 'transfer', value: 60 },
        { method: 'supplierCreditNote', value: 40 },
      ]),
    ).toBe('mixed');
    expect(
      resolveAccountingPaymentChannel([{ method: 'credit_note', value: 25 }]),
    ).toBe('other');
  });

  it('solo expone bankAccountId cuando hay una unica cuenta bancaria', () => {
    expect(
      resolvePrimaryBankAccountId([
        { method: 'transfer', bankAccountId: 'bank-1' },
        { method: 'card', bankAccountId: 'bank-1' },
      ]),
    ).toBe('bank-1');

    expect(
      resolvePrimaryBankAccountId([
        { method: 'transfer', bankAccountId: 'bank-1' },
        { method: 'card', bankAccountId: 'bank-2' },
      ]),
    ).toBeNull();
  });

  it('crea eventos con proyeccion pendiente por defecto', () => {
    const now = new Date('2026-03-24T12:00:00.000Z');
    const event = buildAccountingEvent({
      businessId: 'business-1',
      eventType: 'internal_transfer.posted',
      sourceType: 'internalTransfer',
      sourceId: 'trf-1',
      occurredAt: now,
      createdAt: now,
      createdBy: 'user-1',
      monetary: {
        amount: 1250,
        functionalAmount: 1250,
      },
    });

    expect(event).toMatchObject({
      id: 'internal_transfer.posted__trf-1',
      businessId: 'business-1',
      eventType: 'internal_transfer.posted',
      eventVersion: 1,
      status: 'recorded',
      sourceDocumentType: 'internalTransfer',
      sourceDocumentId: 'trf-1',
      dedupeKey: 'business-1:internal_transfer.posted:trf-1:1',
      idempotencyKey: 'business-1:internal_transfer.posted:trf-1:1',
      projection: {
        status: 'pending',
        projectorVersion: 1,
      },
      monetary: {
        amount: 1250,
        functionalAmount: 1250,
      },
    });
  });

  it('acepta manual.entry.recorded y permite proyeccion explicita', () => {
    const now = new Date('2026-04-05T10:00:00.000Z');
    const event = buildAccountingEvent({
      businessId: 'business-1',
      eventType: 'manual.entry.recorded',
      status: 'projected',
      sourceType: 'manual_entry',
      sourceId: 'entry-1',
      projection: {
        status: 'projected',
        journalEntryId: 'entry-1',
        projectedAt: now,
      },
      occurredAt: now,
      createdAt: now,
      createdBy: 'user-1',
    });

    expect(event).toMatchObject({
      id: 'manual.entry.recorded__entry-1',
      eventType: 'manual.entry.recorded',
      status: 'projected',
      sourceDocumentType: 'manual_entry',
      sourceDocumentId: 'entry-1',
      dedupeKey: 'business-1:manual.entry.recorded:entry-1:1',
      idempotencyKey: 'business-1:manual.entry.recorded:entry-1:1',
      projection: {
        status: 'projected',
        journalEntryId: 'entry-1',
        projectorVersion: 1,
      },
    });
  });

  it('preserva tipos ya declarados fuera del flujo base', () => {
    const now = new Date('2026-04-05T10:00:00.000Z');
    const cashOverShortEvent = buildAccountingEvent({
      businessId: 'business-1',
      eventType: 'cash_over_short.recorded',
      sourceType: 'cashCount',
      sourceId: 'cash-1',
      occurredAt: now,
      createdAt: now,
      createdBy: 'user-1',
    });
    const customerCreditNoteEvent = buildAccountingEvent({
      businessId: 'business-1',
      eventType: 'customer_credit_note.applied',
      sourceType: 'creditNoteApplication',
      sourceId: 'cn-app-1',
      occurredAt: now,
      createdAt: now,
      createdBy: 'user-1',
    });

    expect(cashOverShortEvent).toMatchObject({
      id: 'cash_over_short.recorded__cash-1',
      eventType: 'cash_over_short.recorded',
      dedupeKey: 'business-1:cash_over_short.recorded:cash-1:1',
    });
    expect(customerCreditNoteEvent).toMatchObject({
      id: 'customer_credit_note.applied__cn-app-1',
      eventType: 'customer_credit_note.applied',
      dedupeKey: 'business-1:customer_credit_note.applied:cn-app-1:1',
    });
  });

  it('mantiene sourceDocumentId tecnico aunque el payload tenga referencia negocio', () => {
    const now = new Date('2026-04-18T10:00:00.000Z');
    const event = buildAccountingEvent({
      businessId: 'business-1',
      eventType: 'invoice.committed',
      sourceType: 'invoice',
      sourceId: 'invoice-1',
      sourceDocumentId: 'invoice-1',
      occurredAt: now,
      createdAt: now,
      createdBy: 'user-1',
      payload: {
        ncfCode: 'B0100000339',
        invoiceNumber: '339',
      },
    });

    expect(event).toMatchObject({
      sourceDocumentId: 'invoice-1',
      payload: expect.objectContaining({
        ncfCode: 'B0100000339',
      }),
    });
  });
});
