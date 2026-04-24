import {
  buildAccountingEventId,
  buildAccountingEventProjection,
  normalizeAccountingEventStatus,
  normalizeAccountingEventType,
  normalizeAccountingEventVersion,
  resolveAccountingEventDedupeKey,
  resolveAccountingEventIdempotencyKey,
  resolveAccountingSourceDocumentId,
  resolveAccountingSourceDocumentType,
} from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import {
  computeJournalEntryTotals,
  normalizeJournalEntryLine,
  normalizeJournalEntryStatus,
  resolveJournalPeriodKey,
} from '../../../versions/v2/accounting/utils/journalEntry.util.js';

const ACCOUNTING_EVENT_TYPE_LABELS = {
  'invoice.committed': 'Factura confirmada',
  'accounts_receivable.payment.recorded': 'Cobro registrado',
  'accounts_receivable.payment.voided': 'Cobro anulado',
  'customer_credit_note.issued': 'Nota de crédito de cliente emitida',
  'customer_credit_note.applied': 'Nota de crédito de cliente aplicada',
  'purchase.committed': 'Compra confirmada',
  'accounts_payable.payment.recorded': 'Pago a suplidor registrado',
  'accounts_payable.payment.voided': 'Pago a suplidor anulado',
  'supplier_credit_note.issued': 'Saldo a favor de suplidor emitido',
  'supplier_credit_note.applied': 'Saldo a favor de suplidor aplicado',
  'expense.recorded': 'Gasto registrado',
  'cash_over_short.recorded': 'Diferencia de cuadre registrada',
  'internal_transfer.posted': 'Transferencia interna posteada',
  'manual.entry.recorded': 'Asiento manual registrado',
  'fx_settlement.recorded': 'Settlement FX registrado',
};

const ACCOUNTING_MODULE_LABELS = {
  sales: 'Ventas',
  accounts_receivable: 'Cuentas por cobrar',
  purchases: 'Compras',
  accounts_payable: 'Cuentas por pagar',
  expenses: 'Gastos',
  cash: 'Caja',
  banking: 'Bancos y transferencias',
  fx: 'Tasa de cambio',
  general_ledger: 'Libro diario',
  tax: 'Impuestos',
};

const ACCOUNTING_EVENT_MODULES = {
  'invoice.committed': 'sales',
  'accounts_receivable.payment.recorded': 'accounts_receivable',
  'accounts_receivable.payment.voided': 'accounts_receivable',
  'customer_credit_note.issued': 'accounts_receivable',
  'customer_credit_note.applied': 'accounts_receivable',
  'purchase.committed': 'purchases',
  'accounts_payable.payment.recorded': 'accounts_payable',
  'accounts_payable.payment.voided': 'accounts_payable',
  'supplier_credit_note.issued': 'accounts_payable',
  'supplier_credit_note.applied': 'accounts_payable',
  'expense.recorded': 'expenses',
  'cash_over_short.recorded': 'cash',
  'internal_transfer.posted': 'banking',
  'manual.entry.recorded': 'general_ledger',
  'fx_settlement.recorded': 'fx',
};

const monthFormatter = new Intl.DateTimeFormat('es-DO', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
});

const SYSTEM_GENERATED_REFERENCE_PATTERN =
  /^[a-z][a-z0-9_]*(?:\.[a-z0-9_]+)+__[\w-]+$/i;

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toFiniteNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const pad2 = (value) => String(value).padStart(2, '0');

const resolvePreferredAccountingDocumentReference = ({
  eventType = null,
  payload = null,
}) => {
  const snapshot = asRecord(payload);

  switch (normalizeAccountingEventType(eventType, 'invoice.committed')) {
    case 'invoice.committed':
      return (
        toCleanString(snapshot.ncfCode) ||
        toCleanString(snapshot.invoiceNumber) ||
        null
      );
    case 'accounts_receivable.payment.recorded':
    case 'accounts_receivable.payment.voided':
      return (
        toCleanString(snapshot.receiptNumber) ||
        toCleanString(snapshot.reference) ||
        null
      );
    case 'purchase.committed':
      return (
        toCleanString(snapshot.vendorReference) ||
        toCleanString(snapshot.invoiceNumber) ||
        toCleanString(snapshot.purchaseNumber) ||
        null
      );
    case 'accounts_payable.payment.recorded':
    case 'accounts_payable.payment.voided':
      return (
        toCleanString(snapshot.receiptNumber) ||
        toCleanString(snapshot.reference) ||
        toCleanString(snapshot.purchaseNumber) ||
        null
      );
    case 'expense.recorded':
      return (
        toCleanString(snapshot.invoiceNcf) ||
        toCleanString(snapshot.reference) ||
        toCleanString(snapshot.numberId) ||
        null
      );
    case 'internal_transfer.posted':
      return (
        toCleanString(snapshot.reference) ||
        toCleanString(snapshot.note) ||
        null
      );
    default:
      return null;
  }
};

const sanitizeEntryAliasPart = (value) => {
  const cleaned = toCleanString(value);
  if (!cleaned) return 'ENTRY';

  const normalized = cleaned
    .replace(/[^A-Za-z0-9]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .toUpperCase();

  return normalized || 'ENTRY';
};

const buildEntryAlias = (entryDate, entryId) => {
  const year = entryDate?.getUTCFullYear?.() ?? entryDate?.getFullYear?.() ?? 0;
  const month = pad2(
    (entryDate?.getUTCMonth?.() ?? entryDate?.getMonth?.() ?? 0) + 1,
  );
  return `AST-${String(year).padStart(4, '0')}-${month}-${sanitizeEntryAliasPart(entryId)}`;
};

const assignStableEntryReferences = (records) =>
  [...records].map((record) => {
    const entryReference = buildEntryAlias(record.entryDate, record.journalEntry?.id);
    return {
      ...record,
      entryReference,
      searchIndex: `${record.searchIndex} ${entryReference}`.toLowerCase(),
    };
  });

const shouldCompactVisibleReference = (value) =>
  Boolean(value && SYSTEM_GENERATED_REFERENCE_PATTERN.test(value));

const toBoolean = (value, fallback = false) =>
  typeof value === 'boolean' ? value : fallback;

const toDateOrNull = (value) => {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value?.toDate === 'function') {
    const converted = value.toDate();
    return converted instanceof Date && !Number.isNaN(converted.getTime())
      ? converted
      : null;
  }

  if (typeof value?.seconds === 'number') {
    const converted = new Date(value.seconds * 1000);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }

  if (typeof value === 'number' || typeof value === 'string') {
    const converted = new Date(value);
    return Number.isNaN(converted.getTime()) ? null : converted;
  }

  return null;
};

const toSerializableDate = (value) => {
  const date = toDateOrNull(value);
  return date ? date.toISOString() : null;
};

const normalizeAccountingModuleKey = (value, fallback = 'sales') =>
  ACCOUNTING_MODULE_LABELS[value] ? value : fallback;

const resolveAccountingModuleKey = (eventType) =>
  ACCOUNTING_EVENT_MODULES[eventType] || 'general_ledger';

export const normalizeChartOfAccountRecord = (id, businessId, value) => {
  const record = asRecord(value);

  return {
    id,
    businessId,
    code: toCleanString(record.code) || id,
    name: toCleanString(record.name) || 'Cuenta contable',
    type: toCleanString(record.type) || 'asset',
    subtype: toCleanString(record.subtype),
    parentId: toCleanString(record.parentId),
    postingAllowed: toBoolean(record.postingAllowed, false),
    status: toCleanString(record.status) || 'active',
    normalSide: toCleanString(record.normalSide) || 'debit',
    currencyMode: toCleanString(record.currencyMode) || 'functional_only',
    systemKey: toCleanString(record.systemKey),
    createdAt: record.createdAt ?? null,
    updatedAt: record.updatedAt ?? null,
    createdBy: toCleanString(record.createdBy),
    updatedBy: toCleanString(record.updatedBy),
    metadata: asRecord(record.metadata),
  };
};

export const normalizeAccountingEventRecord = (id, businessId, value) => {
  const record = asRecord(value);
  const eventType = normalizeAccountingEventType(record.eventType);
  const eventVersion = normalizeAccountingEventVersion(record.eventVersion);
  const sourceType = toCleanString(record.sourceType);
  const sourceId = toCleanString(record.sourceId);
  const dedupeKey = resolveAccountingEventDedupeKey({
    businessId,
    eventType,
    sourceId,
    eventVersion,
    dedupeKey: record.dedupeKey,
  });

  return {
    id,
    businessId,
    eventType,
    eventVersion,
    status: normalizeAccountingEventStatus(record.status),
    occurredAt: record.occurredAt ?? null,
    recordedAt: record.recordedAt ?? null,
    sourceType,
    sourceId,
    sourceDocumentType: resolveAccountingSourceDocumentType({
      sourceDocumentType: record.sourceDocumentType,
      sourceType,
    }),
    sourceDocumentId: resolveAccountingSourceDocumentId({
      sourceDocumentId: record.sourceDocumentId,
      sourceId,
    }),
    counterpartyType: toCleanString(record.counterpartyType),
    counterpartyId: toCleanString(record.counterpartyId),
    currency: toCleanString(record.currency),
    functionalCurrency: toCleanString(record.functionalCurrency),
    monetary: asRecord(record.monetary),
    treasury: asRecord(record.treasury),
    payload: asRecord(record.payload),
    dedupeKey,
    idempotencyKey: resolveAccountingEventIdempotencyKey({
      idempotencyKey: record.idempotencyKey,
      dedupeKey,
    }),
    projection: buildAccountingEventProjection(asRecord(record.projection)),
    reversalOfEventId: toCleanString(record.reversalOfEventId),
    createdAt: record.createdAt ?? null,
    createdBy: toCleanString(record.createdBy),
    metadata: asRecord(record.metadata),
  };
};

export const normalizeJournalEntryRecord = (id, businessId, value) => {
  const record = asRecord(value);
  const lines = Array.isArray(record.lines)
    ? record.lines.map((line, index) => normalizeJournalEntryLine(line, index))
    : [];
  const totals = computeJournalEntryTotals(lines);
  const eventType =
    normalizeAccountingEventType(record.eventType, 'manual.entry.recorded');
  const entryDate = record.entryDate ?? null;

  return {
    id,
    businessId,
    eventId:
      toCleanString(record.eventId) ||
      (eventType === 'manual.entry.recorded'
        ? `manual:${id}`
        : buildAccountingEventId({
            eventType,
            sourceId: toCleanString(record.sourceId) || id,
          })),
    eventType,
    eventVersion: Number(record.eventVersion) || 1,
    status: normalizeJournalEntryStatus(record.status),
    entryDate,
    periodKey: toCleanString(record.periodKey) || resolveJournalPeriodKey(entryDate),
    description: toCleanString(record.description),
    currency: toCleanString(record.currency),
    functionalCurrency: toCleanString(record.functionalCurrency),
    sourceType: toCleanString(record.sourceType),
    sourceId: toCleanString(record.sourceId),
    reversalOfEntryId: toCleanString(record.reversalOfEntryId),
    reversalOfEventId: toCleanString(record.reversalOfEventId),
    totals: {
      debit: toFiniteNumber(asRecord(record.totals).debit) || totals.debit,
      credit: toFiniteNumber(asRecord(record.totals).credit) || totals.credit,
    },
    lines,
    projectorVersion: Number(record.projectorVersion) || null,
    createdAt: record.createdAt ?? null,
    createdBy: toCleanString(record.createdBy),
    metadata: asRecord(record.metadata),
  };
};

const findFirstLineReference = (lines) =>
  (Array.isArray(lines) ? lines : []).reduce(
    (currentValue, line) => currentValue || toCleanString(line?.reference),
    null,
  );

const buildLedgerMovementSearchIndex = (entry) =>
  [
    entry.reference,
    entry.internalReference,
    entry.entryReference,
    entry.title,
    entry.description,
    entry.lineDescription,
    entry.moduleLabel,
    entry.sourceLabel,
    entry.sourceRecord?.searchIndex,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

const resolveManualEntryReference = (entry) => {
  const userReference =
    toCleanString(asRecord(entry.metadata).note) || findFirstLineReference(entry.lines);
  const internalReference = toCleanString(entry.sourceId) || entry.id;

  return {
    reference: userReference || 'Sin referencia',
    internalReference:
      internalReference && internalReference !== userReference
        ? internalReference
        : null,
  };
};

const resolveLineBalanceDelta = (account, line) =>
  account.normalSide === 'debit'
    ? toFiniteNumber(line.debit) - toFiniteNumber(line.credit)
    : toFiniteNumber(line.credit) - toFiniteNumber(line.debit);

export const buildPostedLedgerRecords = ({
  journalEntries,
  eventsById = new Map(),
} = {}) =>
  assignStableEntryReferences(
    (Array.isArray(journalEntries) ? journalEntries : []).map((entry) => {
      const effectiveDate = toDateOrNull(entry.entryDate) || toDateOrNull(entry.createdAt);
      const periodKey =
        toCleanString(entry.periodKey) ||
        (effectiveDate ? resolveJournalPeriodKey(effectiveDate) : null);
      const event = entry.eventId ? eventsById.get(entry.eventId) || null : null;
      const title =
        entry.eventType === 'manual.entry.recorded'
          ? 'Asiento manual'
          : ACCOUNTING_EVENT_TYPE_LABELS[entry.eventType] || entry.eventType;
      const moduleKey =
        entry.eventType === 'manual.entry.recorded'
          ? 'general_ledger'
          : resolveAccountingModuleKey(entry.eventType);
      const manualReference =
        entry.eventType === 'manual.entry.recorded'
          ? resolveManualEntryReference(entry)
          : null;
      const rawEntryReference = entry.id;
      const eventReference =
        resolvePreferredAccountingDocumentReference({
          eventType: entry.eventType,
          payload: event?.payload,
        }) ||
        toCleanString(event?.sourceDocumentId) ||
        toCleanString(event?.sourceId) ||
        null;
      const internalReference = manualReference?.internalReference || rawEntryReference;

      return {
        id: `entry:${entry.id}`,
        entryDate: effectiveDate,
        periodKey,
        sourceKind:
          entry.eventType === 'manual.entry.recorded' ? 'manual' : 'automatic',
        sourceLabel:
          entry.eventType === 'manual.entry.recorded' ? 'Manual' : 'Automatizado',
        detailMode: 'posted',
        eventType: entry.eventType,
        moduleKey,
        moduleLabel:
          ACCOUNTING_MODULE_LABELS[
            normalizeAccountingModuleKey(moduleKey, 'general_ledger')
          ],
        title,
        description:
          entry.description || 'Asiento posteado directamente en el libro diario.',
        reference:
          manualReference?.reference ||
          eventReference ||
          toCleanString(entry.sourceId) ||
          entry.id,
        internalReference,
        entryReference: rawEntryReference,
        documentReference: manualReference?.reference || eventReference,
        amount: toFiniteNumber(entry.totals?.debit),
        statusLabel: entry.status === 'reversed' ? 'Revertido' : 'Posteado',
        statusTone: entry.status === 'reversed' ? 'neutral' : 'success',
        lines: entry.lines,
        journalEntry: entry,
        event,
        profile: null,
        searchIndex: [
          title,
          rawEntryReference,
          rawEntryReference,
          manualReference?.reference,
          manualReference?.internalReference,
          event?.sourceDocumentType,
          event?.sourceDocumentId,
          event?.sourceId,
          entry.sourceId,
          entry.description,
          (entry.lines || []).map((line) => line.accountName).join(' '),
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase(),
      };
    }),
  );

const buildAccountBalances = ({
  accounts,
  periodKey,
  records,
  mode,
}) => {
  const balances = new Map();

  accounts.forEach((account) => {
    balances.set(account.id, {
      account,
      debit: 0,
      credit: 0,
    });
  });

  records.forEach((record) => {
    if (!record.periodKey) {
      return;
    }

    const affectsPeriod =
      mode === 'period'
        ? record.periodKey === periodKey
        : record.periodKey <= periodKey;

    if (!affectsPeriod) {
      return;
    }

    record.lines.forEach((line) => {
      const balance = balances.get(line.accountId);
      if (!balance) return;
      balance.debit += toFiniteNumber(line.debit);
      balance.credit += toFiniteNumber(line.credit);
    });
  });

  return Array.from(balances.values());
};

export const buildGeneralLedgerAccountOptions = ({
  accounts,
  records,
}) => {
  const movementCounts = new Map();

  records.forEach((record) => {
    record.lines.forEach((line) => {
      movementCounts.set(
        line.accountId,
        (movementCounts.get(line.accountId) || 0) + 1,
      );
    });
  });

  return (Array.isArray(accounts) ? accounts : [])
    .filter((account) => account.status === 'active' && account.postingAllowed)
    .map((account) => ({
      id: account.id,
      code: account.code,
      name: account.name,
      normalSide: account.normalSide,
      type: account.type,
      movementCount: movementCounts.get(account.id) || 0,
    }))
    .sort((left, right) => left.code.localeCompare(right.code));
};

export const buildGeneralLedgerSnapshot = ({
  account,
  periodKey = null,
  records,
  page = 1,
  pageSize = 50,
  searchQuery = null,
}) => {
  const accountLines = (Array.isArray(records) ? records : []).flatMap((record) =>
    (Array.isArray(record.lines) ? record.lines : [])
      .filter((line) => line.accountId === account.id)
      .map((line) => ({
        line,
        record,
      })),
  );

  const openingBalance = periodKey
    ? accountLines
        .filter(
          ({ record }) => record.periodKey !== null && record.periodKey < periodKey,
        )
        .reduce(
          (total, { line }) => total + resolveLineBalanceDelta(account, line),
          0,
        )
    : 0;

  const scopedLines = accountLines
    .filter(({ record }) => (periodKey ? record.periodKey === periodKey : true))
    .sort((left, right) => {
      const leftTime = left.record.entryDate?.getTime() || 0;
      const rightTime = right.record.entryDate?.getTime() || 0;
      if (leftTime !== rightTime) {
        return leftTime - rightTime;
      }

      const periodCompare = (left.record.periodKey || '').localeCompare(
        right.record.periodKey || '',
      );
      if (periodCompare !== 0) {
        return periodCompare;
      }

      const recordCompare = left.record.id.localeCompare(right.record.id);
      if (recordCompare !== 0) {
        return recordCompare;
      }

      return toFiniteNumber(left.line.lineNumber) - toFiniteNumber(right.line.lineNumber);
    });

  let runningBalance = openingBalance;
  const entries = scopedLines.map(({ line, record }) => {
    runningBalance += resolveLineBalanceDelta(account, line);
    const visibleReference = shouldCompactVisibleReference(record.reference)
      ? record.documentReference || record.entryReference
      : record.documentReference || record.reference;
    const internalReference =
      visibleReference !== record.reference
        ? record.reference
        : record.internalReference;

    const movement = {
      id: `${record.id}:${line.lineNumber}`,
      entryDate: record.entryDate,
      periodKey: record.periodKey,
      moduleLabel: record.moduleLabel,
      sourceLabel: record.sourceLabel,
      reference: visibleReference,
      internalReference,
      entryReference: record.entryReference,
      title: record.title,
      description: record.description,
      lineDescription: toCleanString(line.description),
      debit: toFiniteNumber(line.debit),
      credit: toFiniteNumber(line.credit),
      runningBalance,
      sourceRecord: record,
    };

    return {
      ...movement,
      searchIndex: buildLedgerMovementSearchIndex(movement),
    };
  });

  const normalizedQuery = toCleanString(searchQuery)?.toLowerCase() || null;
  const filteredEntries = normalizedQuery
    ? entries.filter((entry) => entry.searchIndex.includes(normalizedQuery))
    : entries;
  const safePageSize = Math.max(1, Math.min(Number(pageSize) || 50, 100));
  const totalEntries = filteredEntries.length;
  const totalPages = totalEntries ? Math.ceil(totalEntries / safePageSize) : 1;
  const currentPage = Math.max(1, Math.min(Number(page) || 1, totalPages));
  const pageStart = (currentPage - 1) * safePageSize;
  const pagedEntries = filteredEntries
    .slice(pageStart, pageStart + safePageSize)
    .map((entry) => ({
      id: entry.id,
      entryDate: entry.entryDate,
      periodKey: entry.periodKey,
      moduleLabel: entry.moduleLabel,
      sourceLabel: entry.sourceLabel,
      reference: entry.reference,
      internalReference: entry.internalReference,
      title: entry.title,
      description: entry.description,
      lineDescription: entry.lineDescription,
      debit: entry.debit,
      credit: entry.credit,
      runningBalance: entry.runningBalance,
      sourceRecord: entry.sourceRecord,
    }));

  return {
    account,
    openingBalance,
    periodDebit: entries.reduce((total, entry) => total + entry.debit, 0),
    periodCredit: entries.reduce((total, entry) => total + entry.credit, 0),
    closingBalance: runningBalance,
    entries: pagedEntries,
    pagination: {
      page: currentPage,
      pageSize: safePageSize,
      totalEntries,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      searchQuery: normalizedQuery,
    },
  };
};

export const buildFinancialReports = ({
  accounts,
  periodKey,
  records,
}) => {
  const cumulativeBalances = buildAccountBalances({
    accounts,
    periodKey,
    records,
    mode: 'cumulative',
  });
  const periodBalances = buildAccountBalances({
    accounts,
    periodKey,
    records,
    mode: 'period',
  });

  const toTrialBalanceRow = ({ account, debit, credit }) => ({
    accountId: account.id,
    code: account.code,
    name: account.name,
    type: account.type,
    debit,
    credit,
    balance:
      account.normalSide === 'debit'
        ? toFiniteNumber(debit) - toFiniteNumber(credit)
        : toFiniteNumber(credit) - toFiniteNumber(debit),
  });

  const trialBalance = cumulativeBalances
    .filter(({ debit, credit }) => debit !== 0 || credit !== 0)
    .map(toTrialBalanceRow)
    .sort((left, right) => left.code.localeCompare(right.code));

  const trialBalanceTotals = trialBalance.reduce(
    (totals, row) => ({
      debit: totals.debit + row.debit,
      credit: totals.credit + row.credit,
    }),
    { debit: 0, credit: 0 },
  );

  const incomeRows = periodBalances
    .filter(
      ({ account, credit, debit }) =>
        (account.type === 'income' || account.type === 'expense') &&
        (debit !== 0 || credit !== 0),
    )
    .map(({ account, credit, debit }) => ({
      accountId: account.id,
      code: account.code,
      name: account.name,
      kind: account.type,
      amount:
        account.type === 'income'
          ? toFiniteNumber(credit) - toFiniteNumber(debit)
          : toFiniteNumber(debit) - toFiniteNumber(credit),
    }))
    .sort((left, right) => left.code.localeCompare(right.code));

  const incomeTotals = incomeRows.reduce(
    (totals, row) => ({
      income:
        totals.income + (row.kind === 'income' ? Math.max(row.amount, 0) : 0),
      expense:
        totals.expense +
        (row.kind === 'expense' ? Math.max(row.amount, 0) : 0),
      netIncome: 0,
    }),
    { income: 0, expense: 0, netIncome: 0 },
  );
  incomeTotals.netIncome = incomeTotals.income - incomeTotals.expense;

  const classifyBalanceSheetRow = (row) => {
    switch (row.type) {
      case 'asset':
        return 'assets';
      case 'liability':
        return 'liabilities';
      case 'equity':
        return 'equity';
      default:
        return null;
    }
  };

  const balanceSheet = {
    assets: [],
    liabilities: [],
    equity: [],
    currentEarnings: incomeTotals.netIncome,
  };

  trialBalance.forEach((row) => {
    const bucket = classifyBalanceSheetRow(row);
    if (bucket) {
      balanceSheet[bucket].push(row);
    }
  });

  return {
    trialBalance,
    trialBalanceTotals,
    incomeRows,
    incomeTotals,
    balanceSheet,
  };
};

export const buildAvailablePeriods = (records) => {
  const periodKeys = new Set();

  (Array.isArray(records) ? records : []).forEach((record) => {
    if (record.periodKey) {
      periodKeys.add(record.periodKey);
    }
  });

  periodKeys.add(resolveJournalPeriodKey(new Date()));

  return Array.from(periodKeys).sort((left, right) => right.localeCompare(left));
};

export const buildPeriodOptions = (periods, records) =>
  (Array.isArray(periods) ? periods : []).map((periodKey) => ({
    periodKey,
    label: monthFormatter.format(new Date(`${periodKey}-01T00:00:00.000Z`)),
    entries: (Array.isArray(records) ? records : []).filter(
      (record) => record.periodKey === periodKey,
    ).length,
  }));

export const serializeAccountingEvent = (event) =>
  event
    ? {
        ...event,
        occurredAt: toSerializableDate(event.occurredAt),
        recordedAt: toSerializableDate(event.recordedAt),
        createdAt: toSerializableDate(event.createdAt),
      }
    : null;

export const serializeJournalEntry = (entry) =>
  entry
    ? {
        ...entry,
        entryDate: toSerializableDate(entry.entryDate),
        createdAt: toSerializableDate(entry.createdAt),
      }
    : null;

export const serializeAccountingLedgerRecord = (record) => ({
  ...record,
  entryDate: toSerializableDate(record.entryDate),
  journalEntry: serializeJournalEntry(record.journalEntry),
  event: serializeAccountingEvent(record.event),
});

export const serializeGeneralLedgerSnapshot = (snapshot) =>
  snapshot
    ? {
        ...snapshot,
        entries: snapshot.entries.map((entry) => ({
          ...entry,
          entryDate: toSerializableDate(entry.entryDate),
          sourceRecord: serializeAccountingLedgerRecord(entry.sourceRecord),
        })),
      }
    : null;
