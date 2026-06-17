import type {
  AccountingEvent,
  AccountingEventType,
  AccountingModuleKey,
  AccountingPostingProfile,
  JournalEntry,
  JournalEntryLine,
} from '@/types/accounting';
import {
  resolveAccountingSourceDocumentId,
  resolveAccountingSourceDocumentType,
} from '@/utils/accounting/accountingEvents';

import {
  normalizeAccountingNavigationDocumentType,
  resolveAccountingEntryLocator,
  type AccountingEntryLocator,
  type AccountingEntryTargetSource,
} from './accountingNavigation';

export interface AccountingLedgerRecord {
  id: string;
  entryDate: Date | null;
  periodKey: string | null;
  sourceKind: 'automatic' | 'manual';
  sourceLabel: string;
  detailMode: 'posted' | 'projected';
  eventType: AccountingEventType;
  moduleKey: AccountingModuleKey;
  moduleLabel: string;
  title: string;
  description: string;
  reference: string;
  internalReference: string | null;
  entryReference: string;
  documentReference: string | null;
  journalTypeKey:
    | 'sale'
    | 'purchase'
    | 'payment'
    | 'collection'
    | 'expense'
    | 'payroll'
    | 'adjustment';
  journalTypeLabel: string;
  userLabel: string | null;
  amount: number;
  statusLabel: string;
  statusTone: 'success' | 'warning' | 'neutral';
  lines: JournalEntryLine[];
  journalEntry: JournalEntry | null;
  event: AccountingEvent | null;
  profile: AccountingPostingProfile | null;
  searchIndex: string;
}

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const resolveRecordJournalEntryId = (
  record: AccountingLedgerRecord,
): string | null =>
  toCleanString(record.journalEntry?.id) ??
  toCleanString(record.event?.projection?.journalEntryId) ??
  toCleanString(record.event?.metadata?.journalEntryId);

const resolveRecordSourceDocumentType = (
  record: AccountingLedgerRecord,
): string | null =>
  normalizeAccountingNavigationDocumentType(
    resolveAccountingSourceDocumentType({
      sourceDocumentType:
        record.event?.sourceDocumentType ?? record.journalEntry?.sourceType,
      sourceType: record.event?.sourceType,
    }),
  );

const resolveRecordSourceDocumentId = (
  record: AccountingLedgerRecord,
): string | null =>
  resolveAccountingSourceDocumentId({
    sourceDocumentId:
      record.event?.sourceDocumentId ?? record.journalEntry?.sourceId,
    sourceId: record.event?.sourceId,
  });

export const findAccountingLedgerRecord = (
  records: AccountingLedgerRecord[],
  source: AccountingEntryTargetSource | AccountingEntryLocator | null | undefined,
): AccountingLedgerRecord | null => {
  const locator = resolveAccountingEntryLocator(source);

  if (locator.journalEntryId) {
    return (
      records.find(
        (record) =>
          resolveRecordJournalEntryId(record) === locator.journalEntryId,
      ) ?? null
    );
  }

  if (!locator.sourceDocumentType || !locator.sourceDocumentId) {
    return null;
  }

  const matches = records.filter((record) => {
    if (
      resolveRecordSourceDocumentType(record) !== locator.sourceDocumentType ||
      resolveRecordSourceDocumentId(record) !== locator.sourceDocumentId
    ) {
      return false;
    }

    if (locator.eventType && record.eventType !== locator.eventType) {
      return false;
    }

    return true;
  });

  return matches.length === 1 ? matches[0] : null;
};
