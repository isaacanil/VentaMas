import ROUTES_NAME from '@/router/routes/routesName';
import type { AccountingEventType } from '@/types/accounting';
import {
  ACCOUNTING_EVENT_DEFINITIONS,
  resolveAccountingSourceDocumentId,
  resolveAccountingSourceDocumentType,
} from '@/utils/accounting/accountingEvents';

import type { AccountingLedgerRecord } from '@/modules/accounting/pages/AccountingWorkspace/utils/accountingWorkspace';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export const normalizeAccountingNavigationDocumentType = (
  value: unknown,
): string | null => {
  const nextValue = toCleanString(value);
  return nextValue ? nextValue.replace(/[^a-z0-9]/gi, '').toLowerCase() : null;
};

const isAccountingEventType = (value: unknown): value is AccountingEventType =>
  ACCOUNTING_EVENT_DEFINITIONS.some(
    (definition) => definition.eventType === value,
  );

const asAccountingEventType = (value: unknown): AccountingEventType | null =>
  isAccountingEventType(value) ? value : null;

export interface AccountingEntryLocator {
  journalEntryId: string | null;
  sourceDocumentType: string | null;
  sourceDocumentId: string | null;
  eventType: AccountingEventType | null;
}

export interface AccountingEntryRouteTarget {
  kind: 'route';
  label: string;
  locator: AccountingEntryLocator;
  route: string;
}

export interface AccountingEntryTargetSource {
  eventType?: unknown;
  journalEntryId?: unknown;
  sourceDocumentId?: unknown;
  sourceDocumentType?: unknown;
  sourceId?: unknown;
  sourceType?: unknown;
}

export const ACCOUNTING_ENTRY_QUERY_PARAMS = {
  eventType: 'accountingEventType',
  journalEntryId: 'accountingJournalEntryId',
  sourceDocumentId: 'accountingSourceDocumentId',
  sourceDocumentType: 'accountingSourceDocumentType',
} as const;

export const resolveAccountingEntryLocator = (
  source: AccountingEntryTargetSource | null | undefined,
): AccountingEntryLocator => ({
  journalEntryId: toCleanString(source?.journalEntryId),
  sourceDocumentType: normalizeAccountingNavigationDocumentType(
    resolveAccountingSourceDocumentType({
      sourceDocumentType: source?.sourceDocumentType,
      sourceType: source?.sourceType,
    }),
  ),
  sourceDocumentId: resolveAccountingSourceDocumentId({
    sourceDocumentId: source?.sourceDocumentId,
    sourceId: source?.sourceId,
  }),
  eventType: asAccountingEventType(source?.eventType),
});

export const hasAccountingEntryLocator = (
  locator: AccountingEntryLocator | null | undefined,
): boolean =>
  Boolean(
    locator?.journalEntryId ||
      (locator?.sourceDocumentType && locator?.sourceDocumentId),
  );

export const getAccountingEntryLocatorKey = (
  locator: AccountingEntryLocator | null | undefined,
): string | null => {
  if (!locator) return null;

  if (locator.journalEntryId) {
    return `journal:${locator.journalEntryId}`;
  }

  if (!locator.sourceDocumentType || !locator.sourceDocumentId) {
    return null;
  }

  return [
    'source',
    locator.sourceDocumentType,
    locator.sourceDocumentId,
    locator.eventType ?? 'any',
  ].join(':');
};

export const buildAccountingEntryRoute = (
  source: AccountingEntryTargetSource | AccountingEntryLocator,
): string => {
  const locator = resolveAccountingEntryLocator(source);
  const searchParams = new URLSearchParams();

  if (locator.journalEntryId) {
    searchParams.set(
      ACCOUNTING_ENTRY_QUERY_PARAMS.journalEntryId,
      locator.journalEntryId,
    );
  }

  if (locator.sourceDocumentType) {
    searchParams.set(
      ACCOUNTING_ENTRY_QUERY_PARAMS.sourceDocumentType,
      locator.sourceDocumentType,
    );
  }

  if (locator.sourceDocumentId) {
    searchParams.set(
      ACCOUNTING_ENTRY_QUERY_PARAMS.sourceDocumentId,
      locator.sourceDocumentId,
    );
  }

  if (locator.eventType) {
    searchParams.set(ACCOUNTING_ENTRY_QUERY_PARAMS.eventType, locator.eventType);
  }

  const query = searchParams.toString();
  return query
    ? `${ROUTES_NAME.ACCOUNTING_TERM.ACCOUNTING_JOURNAL_BOOK}?${query}`
    : ROUTES_NAME.ACCOUNTING_TERM.ACCOUNTING_JOURNAL_BOOK;
};

export const resolveAccountingEntryTarget = (
  source: AccountingEntryTargetSource | null | undefined,
  label = 'Ver asiento contable',
): AccountingEntryRouteTarget | null => {
  const locator = resolveAccountingEntryLocator(source);
  if (!hasAccountingEntryLocator(locator)) {
    return null;
  }

  return {
    kind: 'route',
    label,
    locator,
    route: buildAccountingEntryRoute(locator),
  };
};

export const getAccountingEntryLocatorFromSearch = (
  search: string | URLSearchParams,
): AccountingEntryLocator => {
  const searchParams =
    typeof search === 'string' ? new URLSearchParams(search) : search;

  return resolveAccountingEntryLocator({
    eventType: searchParams.get(ACCOUNTING_ENTRY_QUERY_PARAMS.eventType),
    journalEntryId: searchParams.get(
      ACCOUNTING_ENTRY_QUERY_PARAMS.journalEntryId,
    ),
    sourceDocumentId: searchParams.get(
      ACCOUNTING_ENTRY_QUERY_PARAMS.sourceDocumentId,
    ),
    sourceDocumentType: searchParams.get(
      ACCOUNTING_ENTRY_QUERY_PARAMS.sourceDocumentType,
    ),
  });
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
        (record) => resolveRecordJournalEntryId(record) === locator.journalEntryId,
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
