import { describe, expect, it } from 'vitest';

import {
  ACCOUNTING_EVENT_DEFINITIONS,
  getAccountingEventDefinition,
  normalizeAccountingEventRecord,
} from '@/utils/accounting/accountingEvents';

describe('accountingEvents', () => {
  it('expone el catalogo canonico de eventos contables', () => {
    expect(ACCOUNTING_EVENT_DEFINITIONS.some(
      (definition) => definition.eventType === 'invoice.committed',
    )).toBe(true);
    expect(ACCOUNTING_EVENT_DEFINITIONS.some(
      (definition) => definition.eventType === 'cash_over_short.recorded',
    )).toBe(true);
    expect(getAccountingEventDefinition('purchase.committed')).toMatchObject({
      moduleKey: 'purchases',
    });
  });

  it('normaliza eventos con defaults coherentes', () => {
    const result = normalizeAccountingEventRecord('evt-1', 'business-1', {
      eventType: 'manual.entry.recorded',
      status: 'projected',
      sourceType: 'manual_entry',
      sourceId: 'entry-1',
    });

    expect(result).toMatchObject({
      id: 'evt-1',
      businessId: 'business-1',
      eventType: 'manual.entry.recorded',
      status: 'projected',
      eventVersion: 1,
      sourceType: 'manual_entry',
      sourceId: 'entry-1',
      sourceDocumentType: 'manual_entry',
      sourceDocumentId: 'entry-1',
      dedupeKey: 'business-1:manual.entry.recorded:entry-1:1',
      idempotencyKey: 'business-1:manual.entry.recorded:entry-1:1',
      projection: {
        status: 'pending',
        projectorVersion: 1,
      },
    });
  });
});
