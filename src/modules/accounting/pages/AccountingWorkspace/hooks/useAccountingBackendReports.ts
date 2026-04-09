import { useEffect, useState } from 'react';

import {
  fbGetAccountingReports,
  type GetAccountingReportsResult,
} from '@/firebase/accounting/fbGetAccountingReports';
import type {
  AccountingEvent,
  JournalEntry,
} from '@/types/accounting';
import { normalizeAccountingEventRecord } from '@/utils/accounting/accountingEvents';
import { toDateOrNull } from '@/utils/accounting/journalEntries';

import type {
  AccountingLedgerRecord,
  FinancialReportsSnapshot,
  GeneralLedgerAccountOption,
  GeneralLedgerMovement,
  GeneralLedgerSnapshot,
  TrialBalanceRow,
} from '../utils/accountingWorkspace';

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value: unknown): number => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const normalizeEmbeddedAccountingEvent = (value: unknown): AccountingEvent | null => {
  const record = asRecord(value);
  if (!Object.keys(record).length) return null;

  return normalizeAccountingEventRecord(
    toCleanString(record.id) ?? '',
    toCleanString(record.businessId) ?? '',
    {
      ...record,
      occurredAt: toDateOrNull(record.occurredAt),
      recordedAt: toDateOrNull(record.recordedAt),
      createdAt: toDateOrNull(record.createdAt),
    },
  );
};

const normalizeJournalEntry = (value: unknown): JournalEntry | null => {
  const record = asRecord(value);
  if (!Object.keys(record).length) return null;

  return {
    id: toCleanString(record.id) ?? '',
    businessId: toCleanString(record.businessId) ?? '',
    eventId: toCleanString(record.eventId) ?? '',
    eventType: (toCleanString(record.eventType) ??
      'manual.entry.recorded') as JournalEntry['eventType'],
    eventVersion: Number(record.eventVersion) || 1,
    status: (toCleanString(record.status) ?? 'posted') as JournalEntry['status'],
    entryDate: toDateOrNull(record.entryDate),
    periodKey: toCleanString(record.periodKey),
    description: toCleanString(record.description),
    currency: (toCleanString(record.currency) ??
      null) as JournalEntry['currency'],
    functionalCurrency: (toCleanString(record.functionalCurrency) ??
      null) as JournalEntry['functionalCurrency'],
    sourceType: toCleanString(record.sourceType),
    sourceId: toCleanString(record.sourceId),
    reversalOfEntryId: toCleanString(record.reversalOfEntryId),
    reversalOfEventId: toCleanString(record.reversalOfEventId),
    totals: {
      debit: toFiniteNumber(asRecord(record.totals).debit),
      credit: toFiniteNumber(asRecord(record.totals).credit),
    },
    lines: Array.isArray(record.lines)
      ? (record.lines as JournalEntry['lines'])
      : [],
    projectorVersion: Number(record.projectorVersion) || null,
    createdAt: toDateOrNull(record.createdAt),
    createdBy: toCleanString(record.createdBy),
    metadata: asRecord(record.metadata),
  };
};

const normalizeLedgerRecord = (value: unknown): AccountingLedgerRecord => {
  const record = asRecord(value);

  return {
    id: toCleanString(record.id) ?? '',
    entryDate: toDateOrNull(record.entryDate),
    periodKey: toCleanString(record.periodKey),
    sourceKind: (toCleanString(record.sourceKind) ??
      'automatic') as AccountingLedgerRecord['sourceKind'],
    sourceLabel: toCleanString(record.sourceLabel) ?? 'Automatizado',
    detailMode: (toCleanString(record.detailMode) ??
      'posted') as AccountingLedgerRecord['detailMode'],
    eventType: (toCleanString(record.eventType) ??
      'manual.entry.recorded') as AccountingLedgerRecord['eventType'],
    moduleKey: (toCleanString(record.moduleKey) ??
      'general_ledger') as AccountingLedgerRecord['moduleKey'],
    moduleLabel: toCleanString(record.moduleLabel) ?? 'Libro diario',
    title: toCleanString(record.title) ?? 'Asiento',
    description: toCleanString(record.description) ?? '',
    reference: toCleanString(record.reference) ?? '',
    internalReference: toCleanString(record.internalReference),
    amount: toFiniteNumber(record.amount),
    statusLabel: toCleanString(record.statusLabel) ?? 'Posteado',
    statusTone: (toCleanString(record.statusTone) ??
      'success') as AccountingLedgerRecord['statusTone'],
    lines: Array.isArray(record.lines)
      ? (record.lines as AccountingLedgerRecord['lines'])
      : [],
    journalEntry: normalizeJournalEntry(record.journalEntry),
    event: normalizeEmbeddedAccountingEvent(record.event),
    profile: null,
    searchIndex: toCleanString(record.searchIndex) ?? '',
  };
};

export const normalizeGeneralLedgerSnapshot = (
  value: unknown,
): GeneralLedgerSnapshot | null => {
  const record = asRecord(value);
  if (!Object.keys(record).length) return null;

  const account = asRecord(record.account);
  const entries = Array.isArray(record.entries)
    ? record.entries.map((entry): GeneralLedgerMovement => {
        const entryRecord = asRecord(entry);
        return {
          id: toCleanString(entryRecord.id) ?? '',
          entryDate: toDateOrNull(entryRecord.entryDate),
          periodKey: toCleanString(entryRecord.periodKey),
          moduleLabel: toCleanString(entryRecord.moduleLabel) ?? '',
          sourceLabel: toCleanString(entryRecord.sourceLabel) ?? '',
          reference: toCleanString(entryRecord.reference) ?? '',
          internalReference: toCleanString(entryRecord.internalReference),
          title: toCleanString(entryRecord.title) ?? '',
          description: toCleanString(entryRecord.description) ?? '',
          lineDescription: toCleanString(entryRecord.lineDescription),
          debit: toFiniteNumber(entryRecord.debit),
          credit: toFiniteNumber(entryRecord.credit),
          runningBalance: toFiniteNumber(entryRecord.runningBalance),
          sourceRecord: normalizeLedgerRecord(entryRecord.sourceRecord),
        };
      })
    : [];
  const pagination = asRecord(record.pagination);

  return {
    account: account as GeneralLedgerSnapshot['account'],
    openingBalance: toFiniteNumber(record.openingBalance),
    periodDebit: toFiniteNumber(record.periodDebit),
    periodCredit: toFiniteNumber(record.periodCredit),
    closingBalance: toFiniteNumber(record.closingBalance),
    entries,
    pagination: {
      page: Math.max(1, Number(pagination.page) || 1),
      pageSize: Math.max(1, Number(pagination.pageSize) || 50),
      totalEntries: Math.max(0, Number(pagination.totalEntries) || 0),
      totalPages: Math.max(1, Number(pagination.totalPages) || 1),
      hasPreviousPage: pagination.hasPreviousPage === true,
      hasNextPage: pagination.hasNextPage === true,
      searchQuery: toCleanString(pagination.searchQuery),
    },
  };
};

const normalizeTrialBalanceRow = (value: unknown): TrialBalanceRow => {
  const record = asRecord(value);
  return {
    accountId: toCleanString(record.accountId) ?? '',
    code: toCleanString(record.code) ?? '',
    name: toCleanString(record.name) ?? '',
    type: (toCleanString(record.type) ?? 'asset') as TrialBalanceRow['type'],
    debit: toFiniteNumber(record.debit),
    credit: toFiniteNumber(record.credit),
    balance: toFiniteNumber(record.balance),
  };
};

const normalizeFinancialReportsSnapshot = (
  value: unknown,
): FinancialReportsSnapshot | null => {
  const record = asRecord(value);
  if (!Object.keys(record).length) return null;
  const balanceSheet = asRecord(record.balanceSheet);

  return {
    trialBalance: Array.isArray(record.trialBalance)
      ? record.trialBalance.map(normalizeTrialBalanceRow)
      : [],
    trialBalanceTotals: {
      debit: toFiniteNumber(asRecord(record.trialBalanceTotals).debit),
      credit: toFiniteNumber(asRecord(record.trialBalanceTotals).credit),
    },
    incomeRows: Array.isArray(record.incomeRows)
      ? (record.incomeRows as FinancialReportsSnapshot['incomeRows'])
      : [],
    incomeTotals: {
      income: toFiniteNumber(asRecord(record.incomeTotals).income),
      expense: toFiniteNumber(asRecord(record.incomeTotals).expense),
      netIncome: toFiniteNumber(asRecord(record.incomeTotals).netIncome),
    },
    balanceSheet: {
      assets: Array.isArray(balanceSheet.assets)
        ? balanceSheet.assets.map(normalizeTrialBalanceRow)
        : [],
      liabilities: Array.isArray(balanceSheet.liabilities)
        ? balanceSheet.liabilities.map(normalizeTrialBalanceRow)
        : [],
      equity: Array.isArray(balanceSheet.equity)
        ? balanceSheet.equity.map(normalizeTrialBalanceRow)
        : [],
      currentEarnings: toFiniteNumber(balanceSheet.currentEarnings),
    },
  };
};

interface UseAccountingBackendReportsArgs {
  businessId: string | null;
  enabled: boolean;
  includeFinancialReports?: boolean;
  includeGeneralLedger?: boolean;
  ledgerAccountId?: string | null;
  ledgerPage?: number;
  ledgerPageSize?: number;
  ledgerPeriodKey?: string | null;
  ledgerQuery?: string | null;
  reportPeriodKey?: string | null;
}

interface AccountingBackendReportsState {
  error: string | null;
  financialReports: FinancialReportsSnapshot | null;
  generalLedgerAccountOptions: GeneralLedgerAccountOption[];
  generalLedgerSnapshot: GeneralLedgerSnapshot | null;
  loading: boolean;
  periods: string[];
  selectedLedgerAccountId: string | null;
  selectedLedgerPeriodKey: string | null;
  selectedReportPeriodKey: string | null;
}

interface AccountingBackendReportsStoreState
  extends AccountingBackendReportsState {
  requestKey: string | null;
}

const initialState: AccountingBackendReportsStoreState = {
  error: null,
  financialReports: null,
  generalLedgerAccountOptions: [],
  generalLedgerSnapshot: null,
  loading: false,
  periods: [],
  requestKey: null,
  selectedLedgerAccountId: null,
  selectedLedgerPeriodKey: null,
  selectedReportPeriodKey: null,
};

const normalizeReportsState = (
  result: GetAccountingReportsResult,
  requestKey: string,
): AccountingBackendReportsStoreState => ({
  error: null,
  financialReports: normalizeFinancialReportsSnapshot(
    result.financialReports?.snapshot,
  ),
  generalLedgerAccountOptions: Array.isArray(result.generalLedger?.accountOptions)
    ? (result.generalLedger.accountOptions as GeneralLedgerAccountOption[])
    : [],
  generalLedgerSnapshot: normalizeGeneralLedgerSnapshot(
    result.generalLedger?.snapshot,
  ),
  loading: false,
  periods: Array.isArray(result.periods) ? result.periods : [],
  requestKey,
  selectedLedgerAccountId: result.generalLedger?.selectedAccountId ?? null,
  selectedLedgerPeriodKey: result.generalLedger?.selectedPeriodKey ?? null,
  selectedReportPeriodKey: result.financialReports?.selectedPeriodKey ?? null,
});

export const useAccountingBackendReports = ({
  businessId,
  enabled,
  includeFinancialReports = true,
  includeGeneralLedger = true,
  ledgerAccountId,
  ledgerPage,
  ledgerPageSize,
  ledgerPeriodKey,
  ledgerQuery,
  reportPeriodKey,
}: UseAccountingBackendReportsArgs): AccountingBackendReportsState => {
  const [state, setState] = useState<AccountingBackendReportsStoreState>(
    initialState,
  );
  const requestKey = JSON.stringify({
    businessId,
    includeFinancialReports,
    includeGeneralLedger,
    ledgerAccountId: ledgerAccountId ?? null,
    ledgerPage: ledgerPage ?? null,
    ledgerPageSize: ledgerPageSize ?? null,
    ledgerPeriodKey: ledgerPeriodKey ?? null,
    ledgerQuery: ledgerQuery ?? null,
    reportPeriodKey: reportPeriodKey ?? null,
  });

  useEffect(() => {
    if (!enabled || !businessId) {
      return;
    }

    let cancelled = false;

    void fbGetAccountingReports({
      businessId,
      includeFinancialReports,
      includeGeneralLedger,
      ledgerAccountId,
      ledgerPage,
      ledgerPageSize,
      ledgerPeriodKey,
      ledgerQuery,
      reportPeriodKey,
    })
      .then((result) => {
        if (cancelled) return;
        setState(normalizeReportsState(result, requestKey));
      })
      .catch((error) => {
        if (cancelled) return;
        console.error('Error cargando reportes contables backend:', error);
        setState((current) => ({
          ...initialState,
          requestKey,
          error: 'No se pudieron cargar los reportes contables.',
        }));
      });

    return () => {
      cancelled = true;
    };
  }, [
    businessId,
    enabled,
    includeFinancialReports,
    includeGeneralLedger,
    ledgerAccountId,
    ledgerPage,
    ledgerPageSize,
    ledgerPeriodKey,
    ledgerQuery,
    reportPeriodKey,
    requestKey,
  ]);

  if (!enabled || !businessId) {
    return initialState;
  }

  if (state.requestKey !== requestKey) {
    return {
      ...state,
      error: null,
      loading: true,
    };
  }

  return state;
};
