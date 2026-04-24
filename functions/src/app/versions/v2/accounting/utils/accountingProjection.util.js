import {
  buildJournalEntry,
  isJournalEntryBalanced,
  roundJournalAmount,
} from './journalEntry.util.js';
import { normalizePaymentMethodCode } from './accountingContract.util.js';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const CASH_PAYMENT_METHODS = new Set(['cash']);
const BANK_PAYMENT_METHODS = new Set(['card', 'transfer']);
const OTHER_PAYMENT_METHODS = new Set(['creditNote']);

const normalizePostingCondition = (value) => {
  const record = asRecord(value);
  return {
    paymentTerm:
      record.paymentTerm === 'cash' || record.paymentTerm === 'credit'
        ? record.paymentTerm
        : 'any',
    settlementKind:
      record.settlementKind === 'cash' ||
      record.settlementKind === 'bank' ||
      record.settlementKind === 'other'
        ? record.settlementKind
        : 'any',
    taxTreatment:
      record.taxTreatment === 'taxed' || record.taxTreatment === 'untaxed'
        ? record.taxTreatment
        : 'any',
    documentNature:
      record.documentNature === 'inventory' ||
      record.documentNature === 'expense' ||
      record.documentNature === 'asset' ||
      record.documentNature === 'service'
        ? record.documentNature
        : 'any',
    settlementTiming:
      record.settlementTiming === 'immediate' ||
      record.settlementTiming === 'deferred'
        ? record.settlementTiming
        : 'any',
  };
};

const normalizePostingLine = (value) => {
  const record = asRecord(value);
  return {
    id: toCleanString(record.id),
    side: record.side === 'credit' ? 'credit' : 'debit',
    accountId: toCleanString(record.accountId),
    accountCode: toCleanString(record.accountCode),
    accountName: toCleanString(record.accountName),
    accountSystemKey: toCleanString(record.accountSystemKey),
    amountSource: toCleanString(record.amountSource) || 'document_total',
    description: toCleanString(record.description),
    omitIfZero: record.omitIfZero !== false,
    metadata: asRecord(record.metadata),
  };
};

export const normalizePostingProfileRecord = (value) => {
  const record = asRecord(value);
  return {
    id: toCleanString(record.id),
    name: toCleanString(record.name) || 'Perfil contable',
    description: toCleanString(record.description),
    eventType: toCleanString(record.eventType),
    moduleKey: toCleanString(record.moduleKey),
    status: record.status === 'inactive' ? 'inactive' : 'active',
    priority: Number.isFinite(Number(record.priority))
      ? Number(record.priority)
      : 100,
    conditions: normalizePostingCondition(record.conditions),
    linesTemplate: Array.isArray(record.linesTemplate)
      ? record.linesTemplate.map(normalizePostingLine)
      : [],
    metadata: asRecord(record.metadata),
  };
};

export const normalizeChartOfAccountRecord = (value) => {
  const record = asRecord(value);
  return {
    id: toCleanString(record.id),
    code: toCleanString(record.code),
    name: toCleanString(record.name),
    status: record.status === 'inactive' ? 'inactive' : 'active',
    postingAllowed: record.postingAllowed !== false,
    systemKey: toCleanString(record.systemKey),
  };
};

const resolveEventContext = (event) => {
  const eventRecord = asRecord(event);
  const payload = asRecord(eventRecord.payload);
  const treasury = asRecord(eventRecord.treasury);
  const monetary = asRecord(eventRecord.monetary);
  const taxAmount =
    safeNumber(monetary.functionalTaxAmount) || safeNumber(monetary.taxAmount);
  const paymentTermCandidate =
    toCleanString(payload.paymentTerm) ||
    toCleanString(payload.paymentCondition) ||
    toCleanString(payload.saleCondition) ||
    toCleanString(payload.terms);
  const settlementKindCandidate =
    toCleanString(treasury.paymentChannel) ||
    toCleanString(payload.settlementKind) ||
    toCleanString(payload.paymentChannel);
  const documentNatureCandidate =
    toCleanString(payload.documentNature) ||
    toCleanString(payload.financialType) ||
    toCleanString(payload.purchaseNature);
  const settlementTimingCandidate =
    toCleanString(payload.settlementTiming) ||
    toCleanString(payload.settlementMode);

  return {
    paymentTerm:
      paymentTermCandidate === 'cash' || paymentTermCandidate === 'credit'
        ? paymentTermCandidate
        : 'any',
    settlementKind:
      settlementKindCandidate === 'cash' ||
      settlementKindCandidate === 'bank' ||
      settlementKindCandidate === 'other'
        ? settlementKindCandidate
        : 'any',
    taxTreatment: taxAmount > 0 ? 'taxed' : 'untaxed',
    documentNature:
      documentNatureCandidate === 'inventory' ||
      documentNatureCandidate === 'expense' ||
      documentNatureCandidate === 'asset' ||
      documentNatureCandidate === 'service'
        ? documentNatureCandidate
        : 'any',
    settlementTiming:
      settlementTimingCandidate === 'immediate' ||
      settlementTimingCandidate === 'deferred'
        ? settlementTimingCandidate
        : 'any',
  };
};

const resolveSaleSettlementBreakdown = (event) => {
  const eventRecord = asRecord(event);
  const payload = asRecord(eventRecord.payload);
  const monetary = asRecord(eventRecord.monetary);
  const documentTotal = safeNumber(monetary.amount);
  const total =
    safeNumber(monetary.functionalAmount) || safeNumber(monetary.amount);
  const functionalRate =
    documentTotal > 0 && total > 0 ? total / documentTotal : 1;
  const paymentMethods = Array.isArray(payload.paymentMethods)
    ? payload.paymentMethods
    : [];

  const breakdown = paymentMethods.reduce(
    (accumulator, method) => {
      const explicitFunctionalAmount = safeNumber(
        method?.functionalValue ??
          method?.functionalAmount ??
          method?.functionalTotal,
      );
      const documentAmount = safeNumber(method?.value ?? method?.amount);
      const amount =
        explicitFunctionalAmount > 0
          ? explicitFunctionalAmount
          : documentAmount * functionalRate;
      if (amount <= 0) {
        return accumulator;
      }

      const methodCode = normalizePaymentMethodCode(
        method?.method ?? method?.code ?? method,
      );

      if (CASH_PAYMENT_METHODS.has(methodCode)) {
        accumulator.cash += amount;
        return accumulator;
      }

      if (BANK_PAYMENT_METHODS.has(methodCode)) {
        accumulator.bank += amount;
        return accumulator;
      }

      if (OTHER_PAYMENT_METHODS.has(methodCode)) {
        accumulator.other += amount;
        return accumulator;
      }

      accumulator.other += amount;
      return accumulator;
    },
    { cash: 0, bank: 0, other: 0 },
  );

  const explicitSettled =
    safeNumber(payload.functionalSettledAmount) ||
    safeNumber(payload.functionalPaidAmount) ||
    (safeNumber(payload.settledAmount) || safeNumber(payload.paidAmount)) *
      functionalRate;
  const settledAmount = Math.max(
    explicitSettled || breakdown.cash + breakdown.bank + breakdown.other,
    0,
  );
  const explicitReceivableBalance =
    safeNumber(payload.functionalReceivableBalance) ||
    safeNumber(payload.receivableFunctionalBalance) ||
    safeNumber(payload.receivableBalance) * functionalRate;
  const receivableBalance = Math.max(
    explicitReceivableBalance || total - settledAmount,
    0,
  );

  return {
    cash: roundJournalAmount(breakdown.cash),
    bank: roundJournalAmount(breakdown.bank),
    other: roundJournalAmount(breakdown.other),
    settledAmount: roundJournalAmount(settledAmount),
    receivableBalance: roundJournalAmount(receivableBalance),
  };
};

export const matchesPostingProfileConditions = (profile, event) => {
  const conditions = normalizePostingCondition(profile?.conditions);
  const eventContext = resolveEventContext(event);

  if (
    conditions.paymentTerm !== 'any' &&
    conditions.paymentTerm !== eventContext.paymentTerm
  ) {
    return false;
  }

  if (
    conditions.settlementKind !== 'any' &&
    conditions.settlementKind !== eventContext.settlementKind
  ) {
    return false;
  }

  if (
    conditions.taxTreatment !== 'any' &&
    conditions.taxTreatment !== eventContext.taxTreatment
  ) {
    return false;
  }

  if (
    conditions.documentNature !== 'any' &&
    conditions.documentNature !== eventContext.documentNature
  ) {
    return false;
  }

  if (
    conditions.settlementTiming !== 'any' &&
    conditions.settlementTiming !== eventContext.settlementTiming
  ) {
    return false;
  }

  return true;
};

export const resolvePostingProfileForEvent = (event, postingProfiles = []) =>
  (Array.isArray(postingProfiles) ? postingProfiles : [])
    .map(normalizePostingProfileRecord)
    .filter(
      (profile) =>
        profile.status === 'active' &&
        profile.eventType === toCleanString(event?.eventType) &&
        matchesPostingProfileConditions(profile, event),
    )
    .sort((left, right) => left.priority - right.priority)[0] ?? null;

export const resolveEventAmountSource = (event, amountSource) => {
  const monetary = asRecord(event?.monetary);
  const total =
    safeNumber(monetary.functionalAmount) || safeNumber(monetary.amount);
  const tax =
    safeNumber(monetary.functionalTaxAmount) || safeNumber(monetary.taxAmount);
  const netSales = Math.max(total - tax, 0);
  const saleSettlement = resolveSaleSettlementBreakdown(event);
  const gain = Math.max(total, 0);
  const loss = Math.abs(Math.min(total, 0));

  switch (amountSource) {
    case 'tax_total':
      return roundJournalAmount(tax);
    case 'net_sales':
      return roundJournalAmount(netSales);
    case 'sale_settled_amount':
      return saleSettlement.settledAmount;
    case 'sale_receivable_balance':
      return saleSettlement.receivableBalance;
    case 'sale_cash_received':
      return saleSettlement.cash;
    case 'sale_bank_received':
      return saleSettlement.bank;
    case 'sale_other_received':
      return saleSettlement.other;
    case 'purchase_total':
    case 'expense_total':
    case 'document_total':
    case 'accounts_receivable_payment_amount':
    case 'accounts_payable_payment_amount':
    case 'transfer_amount':
      return roundJournalAmount(total);
    case 'cash_over_short_gain':
      return roundJournalAmount(gain);
    case 'cash_over_short_loss':
      return roundJournalAmount(loss);
    case 'fx_gain':
      return roundJournalAmount(Math.max(total, 0));
    case 'fx_loss':
      return roundJournalAmount(Math.abs(Math.min(total, 0)));
    default:
      return roundJournalAmount(total);
  }
};

const resolveAccountForPostingLine = ({
  accountId,
  accountSystemKey,
  accountsById,
  accountsBySystemKey,
}) => {
  const byId = accountId ? accountsById.get(accountId) ?? null : null;
  if (byId) {
    return byId;
  }

  return accountSystemKey ? accountsBySystemKey.get(accountSystemKey) ?? null : null;
};

export const buildProjectedJournalLines = ({
  event,
  profile,
  chartOfAccounts,
}) => {
  const normalizedAccounts = (Array.isArray(chartOfAccounts) ? chartOfAccounts : [])
    .map(normalizeChartOfAccountRecord)
    .filter((account) => account.id);
  const accountsById = new Map(
    normalizedAccounts.map((account) => [account.id, account]),
  );
  const accountsBySystemKey = new Map(
    normalizedAccounts
      .filter((account) => account.systemKey)
      .map((account) => [account.systemKey, account]),
  );
  const unresolvedLines = [];

  const lines = profile.linesTemplate.flatMap((line, index) => {
    const amount = resolveEventAmountSource(event, line.amountSource);
    if (line.omitIfZero && amount === 0) {
      return [];
    }

    const account = resolveAccountForPostingLine({
      accountId: line.accountId,
      accountSystemKey: line.accountSystemKey,
      accountsById,
      accountsBySystemKey,
    });
    if (!account || account.status !== 'active' || account.postingAllowed === false) {
      unresolvedLines.push({
        lineId: line.id || `line-${index + 1}`,
        accountId: line.accountId ?? null,
        accountSystemKey: line.accountSystemKey ?? null,
        reason: !account
          ? 'account_not_found'
          : account.status !== 'active'
            ? 'account_inactive'
            : 'account_posting_disabled',
      });
      return [];
    }

    return [
      {
        lineNumber: index + 1,
        accountId: account.id,
        accountCode: line.accountCode || account.code || null,
        accountName: line.accountName || account.name || null,
        accountSystemKey: line.accountSystemKey || account.systemKey || null,
        description: line.description || profile.name,
        debit: line.side === 'debit' ? amount : 0,
        credit: line.side === 'credit' ? amount : 0,
        amountSource: line.amountSource,
        reference:
          toCleanString(event?.sourceDocumentId) ||
          toCleanString(event?.sourceId) ||
          toCleanString(event?.id),
        metadata: {
          projectedFromProfileId: profile.id,
        },
      },
    ];
  });

  return {
    lines,
    unresolvedLines,
  };
};

export const buildProjectionPatch = ({
  status,
  now,
  projectorVersion,
  journalEntryId = null,
  lastError = null,
}) => ({
  projection: {
    status,
    projectorVersion,
    journalEntryId,
    lastAttemptAt: now,
    projectedAt: status === 'projected' ? now : null,
    lastError,
  },
});

export const buildProjectionError = ({
  code,
  message,
  now,
  details = null,
}) => ({
  code,
  message,
  at: now,
  details: details && typeof details === 'object' ? details : {},
});

export const buildProjectedJournalEntry = ({
  businessId,
  event,
  entryId,
  profile,
  lines,
  projectorVersion,
  now,
}) =>
  buildJournalEntry({
    businessId,
    event,
    entryId,
    description:
      profile.description ||
      profile.name ||
      toCleanString(event?.sourceDocumentType) ||
      toCleanString(event?.eventType),
    sourceType: toCleanString(event?.sourceType),
    sourceId: toCleanString(event?.sourceId),
    lines,
    projectorVersion,
    createdAt: now,
    createdBy: 'system:accounting-projector',
    metadata: {
      projectedFromProfileId: profile.id,
      projectedFromProfilePriority: profile.priority,
      projectionSource: 'accountingEvents',
    },
  });

export const validateProjectedLines = (lines = []) => {
  if (!Array.isArray(lines) || lines.length < 2) {
    return {
      ok: false,
      code: 'invalid_projection_lines',
      message:
        'El perfil contable no produjo suficientes lineas para un asiento valido.',
    };
  }

  if (!isJournalEntryBalanced(lines)) {
    return {
      ok: false,
      code: 'unbalanced_projection',
      message:
        'Las lineas proyectadas no cuadran y no pueden persistirse en el libro diario.',
    };
  }

  return { ok: true };
};
