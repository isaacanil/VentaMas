import { buildAccountReceivableListUrl } from '@/modules/accountsReceivable/utils/accountReceivableNavigation';
import { normalizeAccountingNavigationDocumentType } from '@/modules/accounting/utils/accountingNavigation';
import ROUTES_NAME from '@/router/routes/routesName';
import { replacePathParams } from '@/router/routes/replacePathParams';

import type { AccountingLedgerRecord } from './accountingWorkspace';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const buildRoute = (path: string, id: string) => replacePathParams(path, id);

export type AccountingOriginTarget =
  | {
      kind: 'invoice-preview';
      documentId: string;
      label: string;
    }
  | {
      kind: 'route';
      documentId: string;
      label: string;
      route: string;
    };

const resolveAccountsReceivableId = (
  record: AccountingLedgerRecord,
): string | null => {
  const payload = asRecord(record.event?.payload);

  return (
    toCleanString(payload.arId) ??
    toCleanString(payload.accountId) ??
    toCleanString(payload.accountsReceivableId) ??
    null
  );
};

export const resolveAccountingOriginTarget = (
  record: AccountingLedgerRecord | null,
): AccountingOriginTarget | null => {
  if (!record) return null;

  const event = record.event;
  const journalEntry = record.journalEntry;
  const sourceDocumentType =
    normalizeAccountingNavigationDocumentType(event?.sourceDocumentType) ??
    normalizeAccountingNavigationDocumentType(journalEntry?.sourceType) ??
    normalizeAccountingNavigationDocumentType(event?.sourceType);
  const sourceDocumentId =
    toCleanString(event?.sourceDocumentId) ??
    toCleanString(journalEntry?.sourceId) ??
    toCleanString(event?.sourceId);

  if (!sourceDocumentType) {
    return null;
  }

  switch (sourceDocumentType) {
    case 'invoice':
    case 'invoicepos':
      return sourceDocumentId
        ? {
            kind: 'invoice-preview',
            documentId: sourceDocumentId,
            label: 'Ver origen',
          }
        : null;
    case 'purchase':
      return sourceDocumentId
        ? {
            kind: 'route',
            documentId: sourceDocumentId,
            label: 'Ver origen',
            route: buildRoute(
              ROUTES_NAME.PURCHASE_TERM.PURCHASES_COMPLETE,
              sourceDocumentId,
            ),
          }
        : null;
    case 'expense':
      return sourceDocumentId
        ? {
            kind: 'route',
            documentId: sourceDocumentId,
            label: 'Ver origen',
            route: buildRoute(
              ROUTES_NAME.EXPENSES_TERM.EXPENSES_UPDATE,
              sourceDocumentId,
            ),
          }
        : null;
    case 'accountsreceivable':
      return sourceDocumentId
        ? {
            kind: 'route',
            documentId: sourceDocumentId,
            label: 'Ver origen',
            route: buildAccountReceivableListUrl(sourceDocumentId),
          }
        : null;
    case 'accountsreceivablepayment':
    case 'receivablepayment': {
      const accountReceivableId = resolveAccountsReceivableId(record);
      return accountReceivableId
        ? {
            kind: 'route',
            documentId: accountReceivableId,
            label: 'Ver origen',
            route: buildAccountReceivableListUrl(accountReceivableId),
          }
        : null;
    }
    case 'accountspayablepayment': {
      const payload = asRecord(record.event?.payload);
      const purchaseId = toCleanString(payload.purchaseId);
      return purchaseId
        ? {
            kind: 'route',
            documentId: purchaseId,
            label: 'Ver origen',
            route: buildRoute(
              ROUTES_NAME.PURCHASE_TERM.PURCHASES_COMPLETE,
              purchaseId,
            ),
          }
        : null;
    }
    default:
      return null;
  }
};
