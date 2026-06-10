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
      record.settlementKind === 'mixed' ||
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
    transferDirection:
      record.transferDirection === 'cash_to_bank' ||
      record.transferDirection === 'bank_to_cash' ||
      record.transferDirection === 'bank_to_bank' ||
      record.transferDirection === 'cash_to_cash'
        ? record.transferDirection
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

export const normalizeBankAccountRecord = (value) => {
  const record = asRecord(value);
  return {
    id: toCleanString(record.id),
    status: record.status === 'inactive' ? 'inactive' : 'active',
    chartOfAccountId: toCleanString(record.chartOfAccountId),
  };
};

export const normalizeCashAccountRecord = (value) => {
  const record = asRecord(value);
  return {
    id: toCleanString(record.id),
    status: record.status === 'inactive' ? 'inactive' : 'active',
    chartOfAccountId: toCleanString(record.chartOfAccountId),
  };
};

const normalizeTreasuryLedgerType = (value) =>
  value === 'cash' || value === 'bank' ? value : null;

const resolveTreasuryLedgerRecord = (event, role) => {
  const payload = asRecord(event?.payload);
  const ledgerRecord = asRecord(role === 'source' ? payload.from : payload.to);
  const type = normalizeTreasuryLedgerType(ledgerRecord.type);

  if (!type) {
    return null;
  }

  return {
    type,
    bankAccountId: toCleanString(ledgerRecord.bankAccountId),
    cashAccountId:
      toCleanString(ledgerRecord.cashAccountId) ||
      toCleanString(ledgerRecord.cashCountId),
  };
};

const resolveTransferDirectionFromLedgers = (fromLedger, toLedger) => {
  const fromType = normalizeTreasuryLedgerType(fromLedger?.type);
  const toType = normalizeTreasuryLedgerType(toLedger?.type);
  if (fromType === 'cash' && toType === 'bank') return 'cash_to_bank';
  if (fromType === 'bank' && toType === 'cash') return 'bank_to_cash';
  if (fromType === 'bank' && toType === 'bank') return 'bank_to_bank';
  if (fromType === 'cash' && toType === 'cash') return 'cash_to_cash';
  return 'any';
};

const resolveEventTransferDirection = (event) => {
  const eventRecord = asRecord(event);
  const payload = asRecord(eventRecord.payload);
  const explicitDirection = toCleanString(payload.transferDirection);
  if (
    explicitDirection === 'cash_to_bank' ||
    explicitDirection === 'bank_to_cash' ||
    explicitDirection === 'bank_to_bank' ||
    explicitDirection === 'cash_to_cash'
  ) {
    return explicitDirection;
  }

  return resolveTransferDirectionFromLedgers(
    asRecord(payload.from),
    asRecord(payload.to),
  );
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
      settlementKindCandidate === 'mixed' ||
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
    transferDirection: resolveEventTransferDirection(event),
  };
};

const resolveEventBankAccountId = (event) => {
  const eventRecord = asRecord(event);
  const treasury = asRecord(eventRecord.treasury);
  const payload = asRecord(eventRecord.payload);
  const treasuryBankAccountId = toCleanString(treasury.bankAccountId);
  if (treasuryBankAccountId) {
    return treasuryBankAccountId;
  }

  const paymentMethods = Array.isArray(payload.paymentMethods)
    ? payload.paymentMethods
    : [];
  const bankAccountIds = new Set(
    paymentMethods
      .filter((method) => {
        const methodCode = normalizePaymentMethodCode(
          method?.method ?? method?.code ?? method,
        );
        return BANK_PAYMENT_METHODS.has(methodCode);
      })
      .map((method) => toCleanString(method?.bankAccountId))
      .filter(Boolean),
  );

  return bankAccountIds.size === 1 ? Array.from(bankAccountIds)[0] : null;
};

const resolveSaleSettlementContext = (event) => {
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

  return {
    functionalRate,
    paymentMethods,
    payload,
    total,
  };
};

const resolvePaymentMethodFunctionalAmount = (method, functionalRate) => {
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
  return amount > 0 ? amount : 0;
};

const resolveSaleSettlementBreakdown = (event) => {
  const { functionalRate, paymentMethods, payload, total } =
    resolveSaleSettlementContext(event);
  const breakdown = paymentMethods.reduce(
    (accumulator, method) => {
      const amount = resolvePaymentMethodFunctionalAmount(
        method,
        functionalRate,
      );
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

const resolveSaleBankSettlementAllocations = (event) => {
  const { functionalRate, paymentMethods } =
    resolveSaleSettlementContext(event);
  const allocationsByBankAccountId = new Map();
  let unassignedAmount = 0;

  paymentMethods.forEach((method) => {
    const methodCode = normalizePaymentMethodCode(
      method?.method ?? method?.code ?? method,
    );
    if (!BANK_PAYMENT_METHODS.has(methodCode)) {
      return;
    }

    const amount = resolvePaymentMethodFunctionalAmount(method, functionalRate);
    if (amount <= 0) {
      return;
    }

    const bankAccountId = toCleanString(method?.bankAccountId);
    if (!bankAccountId) {
      unassignedAmount += amount;
      return;
    }

    allocationsByBankAccountId.set(
      bankAccountId,
      roundJournalAmount(
        (allocationsByBankAccountId.get(bankAccountId) ?? 0) + amount,
      ),
    );
  });

  return {
    allocations: Array.from(allocationsByBankAccountId.entries())
      .map(([bankAccountId, amount]) => ({
        bankAccountId,
        amount: roundJournalAmount(amount),
      }))
      .filter((allocation) => allocation.amount > 0),
    unassignedAmount: roundJournalAmount(unassignedAmount),
  };
};

const resolveReceivablePaymentAmounts = (event) => {
  const payload = asRecord(event?.payload);
  const monetary = asRecord(event?.monetary);
  const total =
    safeNumber(monetary.functionalAmount) || safeNumber(monetary.amount);
  const withholding = asRecord(payload.thirdPartyWithholding);
  const applied =
    safeNumber(payload.functionalAppliedAmount) ||
    safeNumber(payload.appliedFunctionalAmount) ||
    safeNumber(payload.appliedAmount) ||
    safeNumber(monetary.amount) ||
    total;
  const collected =
    safeNumber(payload.functionalCollectedAmount) ||
    safeNumber(payload.collectedFunctionalAmount) ||
    safeNumber(payload.collectedAmount) ||
    total;
  const withheld =
    safeNumber(payload.functionalWithholdingAmount) ||
    safeNumber(payload.withholdingFunctionalAmount) ||
    safeNumber(withholding.functionalTotalWithheld) ||
    safeNumber(withholding.functionalAmount) ||
    safeNumber(withholding.totalWithheld) ||
    Math.max(applied - collected, 0);

  return {
    applied: roundJournalAmount(Math.max(applied, 0)),
    collected: roundJournalAmount(Math.max(collected, 0)),
    withheld: roundJournalAmount(Math.max(withheld, 0)),
  };
};

const resolvePayablePaymentBreakdown = (event) => {
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
      const amount = resolvePaymentMethodFunctionalAmount(
        method,
        functionalRate,
      );
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
        accumulator.creditNote += amount;
        return accumulator;
      }

      accumulator.other += amount;
      return accumulator;
    },
    { cash: 0, bank: 0, creditNote: 0, other: 0 },
  );

  return {
    cash: roundJournalAmount(breakdown.cash),
    bank: roundJournalAmount(breakdown.bank),
    creditNote: roundJournalAmount(breakdown.creditNote),
    other: roundJournalAmount(breakdown.other),
    settledAmount: roundJournalAmount(total),
  };
};

const resolvePayrollDeductionAmounts = (event) => {
  const payload = asRecord(event?.payload);
  const summary = asRecord(payload.payrollDeductionSummary);
  const fromSummary = {
    tax: safeNumber(summary.taxAmount),
    other: safeNumber(summary.otherPayableAmount),
  };
  if (fromSummary.tax > 0 || fromSummary.other > 0) {
    return {
      tax: roundJournalAmount(fromSummary.tax),
      other: roundJournalAmount(fromSummary.other),
    };
  }

  const employeeLines = Array.isArray(payload.employeeLines)
    ? payload.employeeLines
    : [];

  const totals = employeeLines.reduce(
    (accumulator, line) => {
      const deductionLines = Array.isArray(line?.deductionLines)
        ? line.deductionLines
        : [];
      deductionLines.forEach((deductionLine) => {
        const deduction = asRecord(deductionLine);
        if (deduction.payableObligation === false) {
          return;
        }

        const amount = safeNumber(
          deduction.functionalAmount ??
            deduction.calculatedAmount ??
            deduction.amount,
        );
        if (amount <= 0) {
          return;
        }

        const accountSystemKey = toCleanString(deduction.accountSystemKey);
        const kind = toCleanString(deduction.kind);
        if (accountSystemKey === 'tax_payable' || kind === 'salary_itbis') {
          accumulator.tax += amount;
          return;
        }

        accumulator.other += amount;
      });

      return accumulator;
    },
    { tax: 0, other: 0 },
  );

  return {
    tax: roundJournalAmount(totals.tax),
    other: roundJournalAmount(totals.other),
  };
};

const resolvePayrollAccrualAmounts = (event) => {
  const monetary = asRecord(event?.monetary);
  const payload = asRecord(event?.payload);
  const total =
    safeNumber(monetary.functionalAmount) || safeNumber(monetary.amount);
  const deductions = resolvePayrollDeductionAmounts(event);
  const net =
    safeNumber(payload.functionalNetAmount) ||
    safeNumber(payload.netAmount) ||
    Math.max(total - deductions.tax - deductions.other, 0);

  return {
    accrual: roundJournalAmount(total),
    net: roundJournalAmount(Math.max(net, 0)),
    taxDeductions: deductions.tax,
    otherDeductions: deductions.other,
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

  if (
    conditions.transferDirection !== 'any' &&
    conditions.transferDirection !== eventContext.transferDirection
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
  const subtotal =
    safeNumber(monetary.functionalSubtotalAmount) ||
    safeNumber(monetary.subtotalAmount) ||
    Math.max(total - tax, 0);
  const withholdingITBIS =
    safeNumber(monetary.functionalWithholdingITBISAmount) ||
    safeNumber(monetary.withholdingITBISAmount);
  const withholdingISR =
    safeNumber(monetary.functionalWithholdingISRAmount) ||
    safeNumber(monetary.withholdingISRAmount);
  const netPayable =
    safeNumber(monetary.functionalNetPayableAmount) ||
    safeNumber(monetary.netPayableAmount) ||
    Math.max(total - withholdingITBIS - withholdingISR, 0);
  const netSales = Math.max(total - tax, 0);
  const saleSettlement = resolveSaleSettlementBreakdown(event);
  const receivablePayment = resolveReceivablePaymentAmounts(event);
  const payablePayment = resolvePayablePaymentBreakdown(event);
  const payrollAccrual = resolvePayrollAccrualAmounts(event);
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
    case 'credit_note_net_total':
      return roundJournalAmount(netSales);
    case 'purchase_subtotal':
    case 'expense_subtotal':
      return roundJournalAmount(subtotal);
    case 'purchase_tax':
    case 'expense_tax':
      return roundJournalAmount(tax);
    case 'purchase_net_payable':
    case 'expense_net_payable':
      return roundJournalAmount(netPayable);
    case 'purchase_withholding_itbis':
    case 'expense_withholding_itbis':
      return roundJournalAmount(withholdingITBIS);
    case 'purchase_withholding_isr':
    case 'expense_withholding_isr':
      return roundJournalAmount(withholdingISR);
    case 'accounts_receivable_applied_amount':
      return receivablePayment.applied;
    case 'accounts_receivable_collected_amount':
    case 'accounts_receivable_payment_amount':
      return receivablePayment.collected;
    case 'accounts_receivable_withholding_amount':
      return receivablePayment.withheld;
    case 'accounts_payable_cash_paid':
      return payablePayment.cash;
    case 'accounts_payable_bank_paid':
      return payablePayment.bank;
    case 'accounts_payable_credit_note_applied':
      return payablePayment.creditNote;
    case 'payroll_accrual_amount':
      return payrollAccrual.accrual;
    case 'payroll_net_payable_amount':
      return payrollAccrual.net;
    case 'payroll_tax_deductions_amount':
      return payrollAccrual.taxDeductions;
    case 'payroll_other_deductions_amount':
      return payrollAccrual.otherDeductions;
    case 'purchase_total':
    case 'expense_total':
    case 'document_total':
    case 'accounts_payable_payment_amount':
    case 'transfer_amount':
      return roundJournalAmount(total);
    case 'cash_over_short_gain':
      return roundJournalAmount(gain);
    case 'cash_over_short_loss':
      return roundJournalAmount(loss);
    case 'bank_statement_adjustment_gain':
      return roundJournalAmount(gain);
    case 'bank_statement_adjustment_loss':
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
  bankAccountsById,
  cashAccountsById,
  event,
  line,
  accountsById,
  accountsBySystemKey,
}) => {
  const byId = accountId ? (accountsById.get(accountId) ?? null) : null;
  const effectiveSystemKey = accountSystemKey || byId?.systemKey || null;
  const treasuryRole = toCleanString(asRecord(line?.metadata).treasuryRole);
  if (treasuryRole === 'source' || treasuryRole === 'destination') {
    const ledger = resolveTreasuryLedgerRecord(event, treasuryRole);
    if (!ledger) {
      return null;
    }

    if (ledger.type === 'bank') {
      return effectiveSystemKey === 'bank'
        ? resolveBankChartAccount({
            accountsById,
            bankAccountId: ledger.bankAccountId,
            bankAccountsById,
          })
        : null;
    }

    if (ledger.type === 'cash') {
      if (effectiveSystemKey !== 'cash') {
        return null;
      }

      const cashChartAccount = resolveCashChartAccount({
        accountsById,
        cashAccountId: ledger.cashAccountId,
        cashAccountsById,
      });
      if (cashChartAccount) {
        return cashChartAccount;
      }

      return null;
    }
  }

  if (effectiveSystemKey === 'bank') {
    const bankAccountId = resolveEventBankAccountId(event);
    const bankAccount = bankAccountId
      ? (bankAccountsById.get(bankAccountId) ?? null)
      : null;
    const bankChartAccountId = toCleanString(bankAccount?.chartOfAccountId);
    const bankChartAccount = bankChartAccountId
      ? (accountsById.get(bankChartAccountId) ?? null)
      : null;
    if (bankChartAccount && bankAccount?.status === 'active') {
      return bankChartAccount;
    }
  }

  if (byId) {
    return byId;
  }

  return accountSystemKey
    ? (accountsBySystemKey.get(accountSystemKey) ?? null)
    : null;
};

const resolveBankChartAccount = ({
  accountsById,
  bankAccountId,
  bankAccountsById,
}) => {
  const bankAccount = bankAccountId
    ? (bankAccountsById.get(bankAccountId) ?? null)
    : null;
  const bankChartAccountId = toCleanString(bankAccount?.chartOfAccountId);
  const bankChartAccount = bankChartAccountId
    ? (accountsById.get(bankChartAccountId) ?? null)
    : null;
  return bankChartAccount && bankAccount?.status === 'active'
    ? bankChartAccount
    : null;
};

const resolveCashChartAccount = ({
  accountsById,
  cashAccountId,
  cashAccountsById,
}) => {
  const cashAccount = cashAccountId
    ? (cashAccountsById.get(cashAccountId) ?? null)
    : null;
  const cashChartAccountId = toCleanString(cashAccount?.chartOfAccountId);
  const cashChartAccount = cashChartAccountId
    ? (accountsById.get(cashChartAccountId) ?? null)
    : null;

  return cashChartAccount && cashAccount?.status === 'active'
    ? cashChartAccount
    : null;
};

const buildProjectedLine = ({
  account,
  amount,
  event,
  line,
  lineNumber,
  metadata = {},
  profile,
}) => ({
  lineNumber,
  accountId: account.id,
  accountCode: account.code || line.accountCode || null,
  accountName: account.name || line.accountName || null,
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
    ...asRecord(line.metadata),
    projectedFromProfileId: profile.id,
    ...metadata,
  },
});

export const buildProjectedJournalLines = ({
  event,
  profile,
  bankAccounts,
  cashAccounts,
  chartOfAccounts,
}) => {
  const normalizedAccounts = (
    Array.isArray(chartOfAccounts) ? chartOfAccounts : []
  )
    .map(normalizeChartOfAccountRecord)
    .filter((account) => account.id);
  const normalizedBankAccounts = (
    Array.isArray(bankAccounts) ? bankAccounts : []
  )
    .map(normalizeBankAccountRecord)
    .filter((account) => account.id);
  const normalizedCashAccounts = (
    Array.isArray(cashAccounts) ? cashAccounts : []
  )
    .map(normalizeCashAccountRecord)
    .filter((account) => account.id);
  const accountsById = new Map(
    normalizedAccounts.map((account) => [account.id, account]),
  );
  const bankAccountsById = new Map(
    normalizedBankAccounts.map((account) => [account.id, account]),
  );
  const cashAccountsById = new Map(
    normalizedCashAccounts.map((account) => [account.id, account]),
  );
  const accountsBySystemKey = new Map(
    normalizedAccounts
      .filter((account) => account.systemKey)
      .map((account) => [account.systemKey, account]),
  );
  const unresolvedLines = [];

  const rawLines = profile.linesTemplate.flatMap((line, index) => {
    const amount = resolveEventAmountSource(event, line.amountSource);
    if (line.omitIfZero && amount === 0) {
      return [];
    }

    const templateAccount = line.accountId
      ? (accountsById.get(line.accountId) ?? null)
      : null;
    const effectiveSystemKey =
      line.accountSystemKey || templateAccount?.systemKey || null;
    if (
      effectiveSystemKey === 'bank' &&
      line.amountSource === 'sale_bank_received'
    ) {
      const bankSettlement = resolveSaleBankSettlementAllocations(event);
      if (bankSettlement.allocations.length) {
        const allocationLines = bankSettlement.allocations.flatMap(
          (allocation) => {
            const account = resolveBankChartAccount({
              accountsById,
              bankAccountId: allocation.bankAccountId,
              bankAccountsById,
            });
            if (
              !account ||
              account.status !== 'active' ||
              account.postingAllowed === false
            ) {
              unresolvedLines.push({
                lineId: `${line.id || `line-${index + 1}`}:${allocation.bankAccountId}`,
                accountId: account?.id ?? line.accountId ?? null,
                accountSystemKey: line.accountSystemKey ?? null,
                bankAccountId: allocation.bankAccountId,
                reason: !account
                  ? 'bank_chart_account_not_found'
                  : account.status !== 'active'
                    ? 'account_inactive'
                    : 'account_posting_disabled',
              });
              return [];
            }

            return [
              buildProjectedLine({
                account,
                amount: allocation.amount,
                event,
                line,
                lineNumber: index + 1,
                metadata: {
                  bankAccountId: allocation.bankAccountId,
                  splitFromAmountSource: line.amountSource,
                },
                profile,
              }),
            ];
          },
        );

        if (bankSettlement.unassignedAmount <= 0) {
          return allocationLines;
        }

        const fallbackAccount = resolveAccountForPostingLine({
          accountId: line.accountId,
          accountSystemKey: line.accountSystemKey,
          bankAccountsById,
          cashAccountsById,
          event,
          line,
          accountsById,
          accountsBySystemKey,
        });

        if (
          !fallbackAccount ||
          fallbackAccount.status !== 'active' ||
          fallbackAccount.postingAllowed === false
        ) {
          unresolvedLines.push({
            lineId: line.id || `line-${index + 1}`,
            accountId: line.accountId ?? null,
            accountSystemKey: line.accountSystemKey ?? null,
            reason: !fallbackAccount
              ? 'account_not_found'
              : fallbackAccount.status !== 'active'
                ? 'account_inactive'
                : 'account_posting_disabled',
          });
          return allocationLines;
        }

        return [
          ...allocationLines,
          buildProjectedLine({
            account: fallbackAccount,
            amount: bankSettlement.unassignedAmount,
            event,
            line,
            lineNumber: index + 1,
            metadata: {
              splitFromAmountSource: line.amountSource,
              splitUnassignedBankAmount: true,
            },
            profile,
          }),
        ];
      }
    }

    const account = resolveAccountForPostingLine({
      accountId: line.accountId,
      accountSystemKey: line.accountSystemKey,
      bankAccountsById,
      cashAccountsById,
      event,
      line,
      accountsById,
      accountsBySystemKey,
    });
    if (
      !account ||
      account.status !== 'active' ||
      account.postingAllowed === false
    ) {
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
      buildProjectedLine({
        account,
        amount,
        event,
        line,
        lineNumber: index + 1,
        profile,
      }),
    ];
  });

  const lines = rawLines.map((line, index) => ({
    ...line,
    lineNumber: index + 1,
  }));

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
