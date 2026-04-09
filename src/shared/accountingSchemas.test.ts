import { describe, expect, it } from 'vitest';

import {
  AccountingEventSchema,
  CreateManualJournalEntryInputSchema,
  GetAccountingReportsInputSchema,
} from '@/shared/accountingSchemas.js';

describe('accountingSchemas', () => {
  it('acepta un AccountingEvent canonico', () => {
    const now = new Date('2026-04-05T12:00:00.000Z');
    const event = AccountingEventSchema.parse({
      id: 'manual.entry.recorded__entry-1',
      businessId: 'business-1',
      eventType: 'manual.entry.recorded',
      eventVersion: 1,
      status: 'projected',
      occurredAt: now,
      recordedAt: now,
      sourceType: 'manual_entry',
      sourceId: 'entry-1',
      sourceDocumentType: 'journalEntry',
      sourceDocumentId: 'entry-1',
      dedupeKey: 'business-1:manual.entry.recorded:entry-1:1',
      idempotencyKey: 'business-1:manual.entry.recorded:entry-1:1',
      projection: {
        status: 'projected',
        projectorVersion: 1,
        journalEntryId: 'entry-1',
        projectedAt: now,
      },
    });

    expect(event.eventType).toBe('manual.entry.recorded');
    expect(event.projection.status).toBe('projected');
  });

  it('rechaza lineas manuales con debito y credito a la vez', () => {
    const result = CreateManualJournalEntryInputSchema.safeParse({
      businessId: 'business-1',
      description: 'Asiento',
      entryDate: '2026-04-05',
      lines: [
        {
          accountId: 'cash',
          debit: 100,
          credit: 50,
        },
        {
          accountId: 'sales',
          debit: 0,
          credit: 50,
        },
      ],
    });

    expect(result.success).toBe(false);
  });

  it('normaliza defaults y limita pageSize en reportes', () => {
    const result = GetAccountingReportsInputSchema.parse({
      businessId: 'business-1',
      ledgerPageSize: 500,
    });

    expect(result.includeFinancialReports).toBe(true);
    expect(result.includeGeneralLedger).toBe(true);
    expect(result.ledgerPage).toBe(1);
    expect(result.ledgerPageSize).toBe(100);
  });
});
