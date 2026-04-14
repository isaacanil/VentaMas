import { normalizePaymentMethodCode } from './accountingContract.util.js';

const THRESHOLD = 0.01;

const CASH_METHODS = new Set(['cash']);
const BANK_METHODS = new Set(['card', 'transfer']);
const SUPPORTED_MOVEMENT_METHODS = new Set([...CASH_METHODS, ...BANK_METHODS]);

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value);
  }
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const roundToTwoDecimals = (value) => Math.round(safeNumber(value) * 100) / 100;

const normalizeMethodCode = (value) => {
  const normalized = toCleanString(value);
  return normalized ? normalized.toLowerCase() : null;
};

const impactsCashDrawerForMethod = (methodCode) => CASH_METHODS.has(methodCode);
const impactsBankLedgerForMethod = (methodCode) => BANK_METHODS.has(methodCode);

const resolveCounterpartyType = (accountEntries) =>
  Array.isArray(accountEntries) &&
  accountEntries.some((entry) => normalizeMethodCode(entry?.accountType) === 'insurance')
    ? 'insurance'
    : 'client';

const uniqueStrings = (values) =>
  Array.from(
    new Set(
      (Array.isArray(values) ? values : [])
        .map((value) => toCleanString(value))
        .filter(Boolean),
    ),
  );

export const buildReceivablePaymentCashMovementId = (
  paymentId,
  method,
  index,
) => {
  const normalizedPaymentId = toCleanString(paymentId) || 'unknown-payment';
  const normalizedMethod = normalizePaymentMethodCode(method) || 'unknown-method';
  return `arp_${normalizedPaymentId}_${normalizedMethod}_${index + 1}`;
};

export const buildInvoicePosCashMovementId = (invoiceId, method, index) => {
  const normalizedInvoiceId = toCleanString(invoiceId) || 'unknown-invoice';
  const normalizedMethod = normalizePaymentMethodCode(method) || 'unknown-method';
  return `inv_${normalizedInvoiceId}_${normalizedMethod}_${index + 1}`;
};

export const buildExpenseCashMovementId = (expenseId) => {
  const normalizedExpenseId = toCleanString(expenseId) || 'unknown-expense';
  return `exp_${normalizedExpenseId}`;
};

export const buildReceivablePaymentVoidCashMovementId = (
  paymentId,
  method,
  index,
) => {
  const normalizedPaymentId = toCleanString(paymentId) || 'unknown-payment';
  const normalizedMethod = normalizePaymentMethodCode(method) || 'unknown-method';
  return `arpv_${normalizedPaymentId}_${normalizedMethod}_${index + 1}`;
};

export const buildAccountsPayablePaymentCashMovementId = (
  paymentId,
  method,
  index,
) => {
  const normalizedPaymentId = toCleanString(paymentId) || 'unknown-payment';
  const normalizedMethod = normalizePaymentMethodCode(method) || 'unknown-method';
  return `app_${normalizedPaymentId}_${normalizedMethod}_${index + 1}`;
};

export const buildInternalTransferCashMovementId = (transferId, side) => {
  const normalizedTransferId = toCleanString(transferId) || 'unknown-transfer';
  const normalizedSide = toCleanString(side) || 'unknown-side';
  return `itf_${normalizedTransferId}_${normalizedSide}`;
};

const toValueNumber = (value) => {
  if (typeof value === 'number' || typeof value === 'string') {
    return safeNumber(value);
  }
  const record = asRecord(value);
  return safeNumber(record.value ?? record.amount);
};

const createMovement = ({
  id,
  businessId,
  direction,
  sourceType,
  sourceId,
  sourceDocumentId = null,
  sourceDocumentType = null,
  currency = null,
  cashAccountId = null,
  cashCountId = null,
  bankAccountId = null,
  method,
  amount,
  counterpartyType = null,
  counterpartyId = null,
  reference = null,
  occurredAt,
  createdAt,
  createdBy = null,
  status = 'posted',
  metadata = {},
}) => {
  const methodCode = normalizePaymentMethodCode(method);
  if (
    !methodCode ||
    !SUPPORTED_MOVEMENT_METHODS.has(methodCode) ||
    roundToTwoDecimals(amount) <= THRESHOLD
  ) {
    return null;
  }

  return {
    id,
    businessId,
    direction,
    sourceType,
    sourceId,
    sourceDocumentId,
    sourceDocumentType,
    currency: toCleanString(currency),
    cashAccountId: toCleanString(cashAccountId),
    cashCountId: toCleanString(cashCountId),
    ...(toCleanString(bankAccountId)
      ? { bankAccountId: toCleanString(bankAccountId) }
      : {}),
    method: methodCode,
    amount: roundToTwoDecimals(amount),
    counterpartyType,
    counterpartyId: toCleanString(counterpartyId),
    reference: toCleanString(reference),
    occurredAt,
    createdAt,
    createdBy: toCleanString(createdBy),
    impactsCashDrawer: impactsCashDrawerForMethod(methodCode),
    impactsBankLedger: impactsBankLedgerForMethod(methodCode),
    status,
    metadata,
  };
};

const normalizeSupportedPaymentMethods = (paymentMethods) =>
  (Array.isArray(paymentMethods) ? paymentMethods : [])
    .map((entry) => {
      const method = asRecord(entry);
      const methodCode = normalizePaymentMethodCode(method.method);
      const amount = roundToTwoDecimals(method.value ?? method.amount);
      if (!methodCode || !SUPPORTED_MOVEMENT_METHODS.has(methodCode)) {
        return null;
      }
      if (amount <= THRESHOLD) {
        return null;
      }
      if (method.status === false) {
        return null;
      }
      return {
        method: methodCode,
        amount,
        reference: toCleanString(method.reference ?? method.ref),
        bankAccountId: toCleanString(method.bankAccountId),
        cashAccountId: toCleanString(method.cashAccountId),
        cashCountId: toCleanString(method.cashCountId),
      };
    })
    .filter(Boolean);

const allocateCashChangeAcrossMethods = (entries, changeAmount) => {
  let remainingChange = roundToTwoDecimals(Math.max(safeNumber(changeAmount), 0));

  return {
    entries: entries
      .map((entry) => {
        const applicableChange = impactsCashDrawerForMethod(entry.method)
          ? Math.min(remainingChange, entry.amount)
          : 0;
        remainingChange = roundToTwoDecimals(remainingChange - applicableChange);
        return {
          ...entry,
          changeApplied: applicableChange,
          netAmount: roundToTwoDecimals(entry.amount - applicableChange),
        };
      })
      .filter((entry) => entry.netAmount > THRESHOLD),
    unappliedChange: remainingChange,
  };
};

const resolveInvoicePaymentMethods = (invoiceRecord) => {
  const payment = asRecord(invoiceRecord.payment);
  const snapshot = asRecord(invoiceRecord.snapshot);
  const snapshotCart = asRecord(snapshot.cart);

  const candidateArrays = [
    invoiceRecord.paymentMethod,
    payment.paymentMethod,
    snapshot.initialPaymentMethods,
    snapshotCart.paymentMethod,
  ];

  for (const candidate of candidateArrays) {
    const normalized = normalizeSupportedPaymentMethods(candidate);
    if (normalized.length > 0) {
      return {
        methods: normalized,
        fallbackFromSnapshot: false,
      };
    }
  }

  const paymentSnapshotGross = roundToTwoDecimals(
    Math.max(
      toValueNumber(payment) ??
        toValueNumber(snapshot.initialTotalPaid) ??
        toValueNumber(snapshotCart.payment) ??
        0,
      0,
    ),
  );

  if (paymentSnapshotGross <= THRESHOLD) {
    return {
      methods: [],
      fallbackFromSnapshot: false,
    };
  }

  return {
    methods: [
      {
        method: 'cash',
        amount: paymentSnapshotGross,
        reference: null,
      },
    ],
    fallbackFromSnapshot: true,
  };
};

const resolveInvoiceChange = (invoiceRecord) => {
  const snapshot = asRecord(invoiceRecord.snapshot);
  const snapshotCart = asRecord(snapshot.cart);
  return roundToTwoDecimals(
    Math.max(
      toValueNumber(invoiceRecord.change) ?? toValueNumber(snapshotCart.change) ?? 0,
      0,
    ),
  );
};

const resolveInvoiceCounterpartyId = (invoiceRecord) => {
  const client = asRecord(invoiceRecord.client);
  return toCleanString(client.id ?? client.clientId);
};

const resolvePostedStatus = (statusValue) => {
  const normalized = normalizeMethodCode(statusValue);
  return normalized === 'deleted' || normalized === 'cancelled' || normalized === 'canceled'
    ? 'void'
    : 'posted';
};

const resolveExpenseTreasuryMode = (expenseRecord) => {
  const payment = asRecord(expenseRecord.payment);
  const settlementMode = normalizeMethodCode(
    payment.settlementMode ??
      payment.mode ??
      expenseRecord.settlementMode ??
      expenseRecord.paymentMode,
  );

  if (settlementMode === 'payable' || settlementMode === 'deferred') {
    return 'payable';
  }
  if (
    payment.deferToAccountsPayable === true ||
    payment.accountsPayableId ||
    expenseRecord.accountsPayableId
  ) {
    return 'payable';
  }

  const paymentStatus = normalizeMethodCode(
    payment.status ?? expenseRecord.paymentStatus,
  );
  if (
    paymentStatus &&
    !['paid', 'posted', 'completed'].includes(paymentStatus)
  ) {
    return 'pending';
  }

  return 'treasury';
};

export const buildReceivablePaymentCashMovements = ({
  businessId,
  payment,
  paymentMethods,
  cashCountId = null,
  clientId = null,
  accountEntries = [],
  createdAt,
  createdBy = null,
}) => {
  const paymentRecord = asRecord(payment);
  const paymentId = toCleanString(paymentRecord.id);
  const normalizedBusinessId = toCleanString(businessId);
  if (!paymentId || !normalizedBusinessId) {
    return [];
  }

  const normalizedAccountEntries = Array.isArray(accountEntries)
    ? accountEntries.map((entry) => asRecord(entry))
    : [];
  const accountIds = uniqueStrings(
    normalizedAccountEntries.map((entry) => entry.arId ?? entry.accountId),
  );
  const invoiceIds = uniqueStrings(
    normalizedAccountEntries.map((entry) => entry.invoiceId),
  );
  const sourceDocumentId = invoiceIds.length === 1 ? invoiceIds[0] : null;
  const counterpartyType = resolveCounterpartyType(normalizedAccountEntries);
  const occurredAt = paymentRecord.date ?? createdAt;

  return (Array.isArray(paymentMethods) ? paymentMethods : [])
    .map((methodEntry, index) => {
      const method = asRecord(methodEntry);
      const methodCode = normalizePaymentMethodCode(method.method);
      const amount = roundToTwoDecimals(method.value ?? method.amount);
      if (!methodCode || amount <= THRESHOLD) {
        return null;
      }

      const impactsCashDrawer = impactsCashDrawerForMethod(methodCode);
      const impactsBankLedger = impactsBankLedgerForMethod(methodCode);
      if (!impactsCashDrawer && !impactsBankLedger) {
        return null;
      }

      return createMovement({
        id: buildReceivablePaymentCashMovementId(paymentId, methodCode, index),
        businessId: normalizedBusinessId,
        direction: 'in',
        sourceType: 'receivable_payment',
        sourceId: paymentId,
        sourceDocumentId,
        sourceDocumentType: sourceDocumentId ? 'invoice' : null,
        cashCountId,
        bankAccountId: method.bankAccountId,
        method: methodCode,
        amount,
        counterpartyType,
        counterpartyId: clientId,
        reference: method.reference ?? method.ref,
        occurredAt,
        createdAt,
        createdBy,
        status: 'posted',
        metadata: {
          arId: toCleanString(paymentRecord.arId),
          originType: toCleanString(paymentRecord.originType),
          originId: toCleanString(paymentRecord.originId),
          paymentScope: toCleanString(paymentRecord.paymentScope),
          paymentOption: toCleanString(paymentRecord.paymentOption),
          accountIds,
          invoiceIds,
          paymentMethodIndex: index,
          paymentMethodCount: Array.isArray(paymentMethods)
            ? paymentMethods.length
            : 0,
        },
      });
    })
    .filter(Boolean);
};

export const buildReceivablePaymentVoidCashMovements = ({
  businessId,
  payment,
  paymentMethods,
  cashCountId = null,
  clientId = null,
  accountEntries = [],
  createdAt,
  createdBy = null,
  voidReason = null,
}) => {
  const paymentRecord = asRecord(payment);
  const paymentId = toCleanString(paymentRecord.id);
  const normalizedBusinessId = toCleanString(businessId);
  if (!paymentId || !normalizedBusinessId) {
    return [];
  }

  const normalizedAccountEntries = Array.isArray(accountEntries)
    ? accountEntries.map((entry) => asRecord(entry))
    : [];
  const accountIds = uniqueStrings(
    normalizedAccountEntries.map((entry) => entry.arId ?? entry.accountId),
  );
  const invoiceIds = uniqueStrings(
    normalizedAccountEntries.map((entry) => entry.invoiceId),
  );
  const sourceDocumentId = invoiceIds.length === 1 ? invoiceIds[0] : null;
  const counterpartyType = resolveCounterpartyType(normalizedAccountEntries);
  const occurredAt =
    paymentRecord.voidedAt ??
    paymentRecord.updatedAt ??
    paymentRecord.date ??
    createdAt;

  return (Array.isArray(paymentMethods) ? paymentMethods : [])
    .map((methodEntry, index) => {
      const method = asRecord(methodEntry);
      const methodCode = normalizePaymentMethodCode(method.method);
      const amount = roundToTwoDecimals(method.value ?? method.amount);
      if (!methodCode || amount <= THRESHOLD) {
        return null;
      }

      return createMovement({
        id: buildReceivablePaymentVoidCashMovementId(paymentId, methodCode, index),
        businessId: normalizedBusinessId,
        direction: 'out',
        sourceType: 'receivable_payment_void',
        sourceId: paymentId,
        sourceDocumentId,
        sourceDocumentType: sourceDocumentId ? 'invoice' : null,
        cashCountId: impactsCashDrawerForMethod(methodCode) ? cashCountId : null,
        bankAccountId: method.bankAccountId,
        method: methodCode,
        amount,
        counterpartyType,
        counterpartyId: clientId,
        reference: method.reference ?? method.ref,
        occurredAt,
        createdAt,
        createdBy,
        status: 'posted',
        metadata: {
          arId: toCleanString(paymentRecord.arId),
          paymentScope: toCleanString(paymentRecord.paymentScope),
          paymentOption: toCleanString(paymentRecord.paymentOption),
          accountIds,
          invoiceIds,
          reversalOfSourceType: 'receivable_payment',
          reversalOfPaymentId: paymentId,
          originalCashCountId: toCleanString(paymentRecord.cashCountId),
          voidReason: toCleanString(voidReason),
          paymentMethodIndex: index,
          paymentMethodCount: Array.isArray(paymentMethods)
            ? paymentMethods.length
            : 0,
        },
      });
    })
    .filter(Boolean);
};

const resolveInternalTransferLedger = (value) => {
  const record = asRecord(value);
  const ledgerType = normalizeMethodCode(record.type);
  if (!ledgerType || !['cash', 'bank'].includes(ledgerType)) {
    return null;
  }

  return {
    type: ledgerType,
    cashAccountId: toCleanString(record.cashAccountId),
    cashCountId: toCleanString(record.cashCountId),
    bankAccountId: toCleanString(record.bankAccountId),
  };
};

const resolveInternalTransferMethod = (ledger) =>
  ledger?.type === 'cash' ? 'cash' : ledger?.type === 'bank' ? 'transfer' : null;

export const buildInternalTransferCashMovements = ({
  businessId,
  transfer,
  createdAt,
  createdBy = null,
}) => {
  const transferRecord = asRecord(transfer);
  const transferId = toCleanString(transferRecord.id);
  const normalizedBusinessId = toCleanString(businessId);
  const amount = roundToTwoDecimals(
    transferRecord.amount ?? transferRecord.totalAmount,
  );
  if (!transferId || !normalizedBusinessId || amount <= THRESHOLD) {
    return [];
  }

  const fromLedger = resolveInternalTransferLedger(
    transferRecord.from ?? transferRecord.source,
  );
  const toLedger = resolveInternalTransferLedger(
    transferRecord.to ?? transferRecord.destination,
  );
  if (!fromLedger || !toLedger) {
    return [];
  }

  const occurredAt =
    transferRecord.occurredAt ?? transferRecord.createdAt ?? createdAt;
  const reference = toCleanString(
    transferRecord.reference ?? transferRecord.receiptNumber,
  );
  const note = toCleanString(transferRecord.note);

  const metadata = {
    transferType: `${fromLedger.type}_to_${toLedger.type}`,
    note,
  };

  return [
    createMovement({
      id: buildInternalTransferCashMovementId(transferId, 'out'),
      businessId: normalizedBusinessId,
      direction: 'out',
      sourceType: 'internal_transfer',
      sourceId: transferId,
      sourceDocumentId: transferId,
      sourceDocumentType: 'internal_transfer',
      currency: toCleanString(transferRecord.currency),
      cashAccountId: fromLedger.cashAccountId,
      cashCountId: fromLedger.cashCountId,
      bankAccountId: fromLedger.bankAccountId,
      method: resolveInternalTransferMethod(fromLedger),
      amount,
      reference,
      occurredAt,
      createdAt: transferRecord.createdAt ?? createdAt,
      createdBy: createdBy ?? transferRecord.createdBy,
      status: 'posted',
      metadata: {
        ...metadata,
        transferSide: 'from',
        fromLedgerType: fromLedger.type,
        toLedgerType: toLedger.type,
      },
    }),
    createMovement({
      id: buildInternalTransferCashMovementId(transferId, 'in'),
      businessId: normalizedBusinessId,
      direction: 'in',
      sourceType: 'internal_transfer',
      sourceId: transferId,
      sourceDocumentId: transferId,
      sourceDocumentType: 'internal_transfer',
      currency: toCleanString(transferRecord.currency),
      cashAccountId: toLedger.cashAccountId,
      cashCountId: toLedger.cashCountId,
      bankAccountId: toLedger.bankAccountId,
      method: resolveInternalTransferMethod(toLedger),
      amount,
      reference,
      occurredAt,
      createdAt: transferRecord.createdAt ?? createdAt,
      createdBy: createdBy ?? transferRecord.createdBy,
      status: 'posted',
      metadata: {
        ...metadata,
        transferSide: 'to',
        fromLedgerType: fromLedger.type,
        toLedgerType: toLedger.type,
      },
    }),
  ].filter(Boolean);
};

export const buildInvoicePosCashMovements = ({
  businessId,
  invoice,
  invoiceId,
  cashCountId = null,
  createdAt,
  createdBy = null,
}) => {
  const invoiceRecord = asRecord(invoice);
  const normalizedBusinessId = toCleanString(businessId);
  const normalizedInvoiceId =
    toCleanString(invoiceId) ?? toCleanString(invoiceRecord.id);

  if (!normalizedBusinessId || !normalizedInvoiceId) {
    return [];
  }

  const { methods, fallbackFromSnapshot } = resolveInvoicePaymentMethods(invoiceRecord);
  if (!methods.length) {
    return [];
  }

  const { entries, unappliedChange } = allocateCashChangeAcrossMethods(
    methods,
    resolveInvoiceChange(invoiceRecord),
  );
  const occurredAt = invoiceRecord.date ?? invoiceRecord.createdAt ?? createdAt;
  const counterpartyId = resolveInvoiceCounterpartyId(invoiceRecord);

  return entries
    .map((method, index) =>
      createMovement({
        id: buildInvoicePosCashMovementId(normalizedInvoiceId, method.method, index),
        businessId: normalizedBusinessId,
        direction: 'in',
        sourceType: 'invoice_pos',
        sourceId: normalizedInvoiceId,
        sourceDocumentId: normalizedInvoiceId,
        sourceDocumentType: 'invoice',
        cashCountId,
        bankAccountId: method.bankAccountId,
        method: method.method,
        amount: method.netAmount,
        counterpartyType: 'client',
        counterpartyId,
        reference: method.reference,
        occurredAt,
        createdAt,
        createdBy: createdBy ?? invoiceRecord.userID,
        status: 'posted',
        metadata: {
          invoiceNumber:
            toCleanString(invoiceRecord.numberID) ??
            toCleanString(invoiceRecord.number),
          ncf: toCleanString(invoiceRecord.NCF),
          paymentMethodIndex: index,
          paymentMethodCount: methods.length,
          fallbackPaymentSnapshotUsed: fallbackFromSnapshot,
          initialAmount: method.amount,
          changeApplied: method.changeApplied,
          unappliedChange,
        },
      }),
    )
    .filter(Boolean);
};

export const buildExpenseCashMovement = ({
  businessId,
  expense,
  expenseId,
  createdAt,
  createdBy = null,
}) => {
  const expenseRecord = asRecord(expense);
  const normalizedBusinessId = toCleanString(businessId);
  const normalizedExpenseId =
    toCleanString(expenseId) ??
    toCleanString(expenseRecord.id) ??
    toCleanString(expenseRecord.expenseId) ??
    toCleanString(expenseRecord._id);

  if (!normalizedBusinessId || !normalizedExpenseId) {
    return null;
  }

  const amount = roundToTwoDecimals(expenseRecord.amount);
  if (amount <= THRESHOLD) {
    return null;
  }

  if (resolveExpenseTreasuryMode(expenseRecord) !== 'treasury') {
    return null;
  }

  const payment = asRecord(expenseRecord.payment);
  const methodCode = normalizePaymentMethodCode(payment.method);
  if (!methodCode || !SUPPORTED_MOVEMENT_METHODS.has(methodCode)) {
    return null;
  }

  const dates = asRecord(expenseRecord.dates);
  const occurredAt = dates.expenseDate ?? expenseRecord.expenseDate ?? createdAt;
  const effectiveCreatedAt = dates.createdAt ?? expenseRecord.createdAt ?? createdAt;
  const invoice = asRecord(expenseRecord.invoice);

  return createMovement({
    id: buildExpenseCashMovementId(normalizedExpenseId),
    businessId: normalizedBusinessId,
    direction: 'out',
    sourceType: 'expense',
    sourceId: normalizedExpenseId,
    sourceDocumentId: normalizedExpenseId,
    sourceDocumentType: 'expense',
    cashAccountId: payment.cashAccountId,
    cashCountId: payment.cashRegister,
    bankAccountId: payment.bankAccountId,
    method: methodCode,
    amount,
    counterpartyType: null,
    counterpartyId: null,
    reference: payment.reference ?? payment.bank ?? invoice.ncf,
    occurredAt,
    createdAt: effectiveCreatedAt,
    createdBy: createdBy ?? expenseRecord.createdBy,
    status: resolvePostedStatus(expenseRecord.status),
    metadata: {
      categoryId: toCleanString(expenseRecord.categoryId),
      category: toCleanString(expenseRecord.category),
      description: toCleanString(expenseRecord.description),
      paymentComment: toCleanString(payment.comment),
      bank: toCleanString(payment.bank),
      attachmentCount: Array.isArray(expenseRecord.attachments)
        ? expenseRecord.attachments.length
        : 0,
    },
  });
};

export const buildAccountsPayablePaymentCashMovements = ({
  businessId,
  payment,
  createdAt,
}) => {
  const paymentRecord = asRecord(payment);
  const paymentId = toCleanString(paymentRecord.id);
  const normalizedBusinessId = toCleanString(businessId);

  if (!paymentId || !normalizedBusinessId) {
    return [];
  }

  const normalizedStatus = normalizeMethodCode(paymentRecord.status);
  if (normalizedStatus === 'void' || normalizedStatus === 'draft') {
    return [];
  }

  const paymentMethods = normalizeSupportedPaymentMethods(
    paymentRecord.paymentMethods,
  );

  if (!paymentMethods.length) {
    return [];
  }

  const occurredAt =
    paymentRecord.occurredAt ?? paymentRecord.date ?? paymentRecord.createdAt ?? createdAt;
  const vendorBillId = toCleanString(paymentRecord.vendorBillId);
  const purchaseId = toCleanString(
    paymentRecord.purchaseId,
  );
  const supplierId = toCleanString(
    paymentRecord.supplierId ?? paymentRecord.counterpartyId,
  );

  return paymentMethods
    .map((methodEntry, index) =>
      createMovement({
        id: buildAccountsPayablePaymentCashMovementId(
          paymentId,
          methodEntry.method,
          index,
        ),
        businessId: normalizedBusinessId,
        direction: 'out',
        sourceType: 'supplier_payment',
        sourceId: paymentId,
        sourceDocumentId: vendorBillId ?? purchaseId,
        sourceDocumentType: vendorBillId ? 'vendorBill' : purchaseId ? 'purchase' : null,
        cashAccountId:
          methodEntry.cashAccountId ?? paymentRecord.cashAccountId ?? null,
        cashCountId:
          methodEntry.cashCountId ?? paymentRecord.cashCountId ?? null,
        bankAccountId:
          methodEntry.bankAccountId ?? paymentRecord.bankAccountId ?? null,
        method: methodEntry.method,
        amount: methodEntry.amount,
        counterpartyType: 'supplier',
        counterpartyId: supplierId,
        reference:
          methodEntry.reference ??
          paymentRecord.reference ??
          paymentRecord.receiptNumber,
        occurredAt,
        createdAt: paymentRecord.createdAt ?? createdAt,
        createdBy: paymentRecord.createdBy ?? null,
        status: 'posted',
        metadata: {
          vendorBillId,
          purchaseId,
          supplierId,
          receiptNumber: toCleanString(paymentRecord.receiptNumber),
          nextPaymentAt: paymentRecord.nextPaymentAt ?? null,
          paymentMethodIndex: index,
          paymentMethodCount: paymentMethods.length,
        },
      }),
    )
    .filter(Boolean);
};
