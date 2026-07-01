import { describe, expect, it } from 'vitest';

import * as FrontendAccountingSchemas from '../../../src/shared/accountingSchemas.js';
import {
  AccountingEventSchema as FrontendAccountingEventSchema,
  CreateManualJournalEntryInputSchema as FrontendCreateManualJournalEntryInputSchema,
  GetAccountingReportsInputSchema as FrontendGetAccountingReportsInputSchema,
} from '../../../src/shared/accountingSchemas.js';
import * as FunctionsAccountingSchemas from './accountingSchemas.js';
import {
  AccountingEventSchema as FunctionsAccountingEventSchema,
  CreateManualJournalEntryInputSchema as FunctionsCreateManualJournalEntryInputSchema,
  GetAccountingReportsInputSchema as FunctionsGetAccountingReportsInputSchema,
} from './accountingSchemas.js';

const clone = (value) => structuredClone(value);

const getExportedEnumConstantEntries = (schemaModule) =>
  Object.entries(schemaModule)
    .filter(([name, value]) => name.endsWith('_VALUES') && Array.isArray(value))
    .sort(([leftName], [rightName]) => leftName.localeCompare(rightName));

describe('accountingSchemas parity', () => {
  it('keeps exported enum constants aligned', () => {
    const frontendConstantEntries = getExportedEnumConstantEntries(
      FrontendAccountingSchemas,
    );
    const functionsConstantEntries = getExportedEnumConstantEntries(
      FunctionsAccountingSchemas,
    );

    expect(functionsConstantEntries).toEqual(frontendConstantEntries);
  });

  it('keeps frontend and Functions AccountingEvent parsing aligned', () => {
    const now = new Date('2026-04-05T12:00:00.000Z');
    const input = {
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
      payload: {
        nested: {
          value: true,
        },
      },
      metadata: {
        source: 'parity-test',
      },
      projection: {
        status: 'projected',
        projectorVersion: 1,
        journalEntryId: 'entry-1',
        projectedAt: now,
      },
    };

    const frontendEvent = FrontendAccountingEventSchema.parse(clone(input));
    const functionsEvent = FunctionsAccountingEventSchema.parse(clone(input));

    expect(functionsEvent).toEqual(frontendEvent);
  });

  it('keeps manual journal entry validation aligned', () => {
    const invalidInput = {
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
    };

    expect(
      FunctionsCreateManualJournalEntryInputSchema.safeParse(
        clone(invalidInput),
      ).success,
    ).toBe(
      FrontendCreateManualJournalEntryInputSchema.safeParse(
        clone(invalidInput),
      ).success,
    );
  });

  it('keeps report input defaults aligned', () => {
    const input = {
      businessId: 'business-1',
      ledgerPageSize: 500,
    };

    const frontendResult = FrontendGetAccountingReportsInputSchema.parse(
      clone(input),
    );
    const functionsResult = FunctionsGetAccountingReportsInputSchema.parse(
      clone(input),
    );

    expect(functionsResult).toEqual(frontendResult);
  });
});
