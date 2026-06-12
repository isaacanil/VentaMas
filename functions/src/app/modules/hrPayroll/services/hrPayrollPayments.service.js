import { FieldValue } from '../../../core/config/firebase.js';
import { buildAccountingEvent } from '../../../versions/v2/accounting/utils/accountingEvent.util.js';
import { normalizePaymentMethodCode } from '../../../versions/v2/accounting/utils/accountingContract.util.js';
import { normalizeHrDepositAccount } from './hrDepositAccounts.service.js';

const THRESHOLD = 0.01;
const LINE_PAYABLE_STATUSES = new Set(['approved']);
const BANK_METHODS = new Set(['card', 'transfer']);
const CASH_METHODS = new Set(['cash']);
const SUPPORTED_MOVEMENT_METHODS = new Set([...CASH_METHODS, ...BANK_METHODS]);
const SUPPORTED_PAYMENT_METHOD_MESSAGE =
  'Selecciona caja, transferencia o cheque para registrar un pago de nomina con soporte contable.';

const asRecord = (value) =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {};

const toCleanString = (value) => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const safeNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const roundMoney = (value) => Math.round(safeNumber(value) * 100) / 100;

const sanitizeDocId = (value) =>
  toCleanString(value)?.replace(/[^a-zA-Z0-9_-]/g, '_') || null;

const withoutUndefined = (value) =>
  Object.fromEntries(
    Object.entries(value).filter(([, entryValue]) => entryValue !== undefined),
  );

export const normalizeHrPayrollPaymentMethodCode = (value) => {
  const cleaned = toCleanString(value);
  if (!cleaned) return 'transfer';
  if (cleaned.toLowerCase() === 'other') return 'other';
  return normalizePaymentMethodCode(cleaned) || 'transfer';
};

export const resolveHrPayrollPaymentChannel = (methodCode) => {
  const normalized = normalizeHrPayrollPaymentMethodCode(methodCode);
  if (CASH_METHODS.has(normalized)) return 'cash';
  if (BANK_METHODS.has(normalized)) return 'bank';
  return 'other';
};

export const buildHrPayrollPaymentId = ({ lineId, paymentId = null } = {}) =>
  sanitizeDocId(paymentId) || sanitizeDocId(`hrpay_${lineId}`);

export const assertHrPayrollLinePayable = (lineLike) => {
  const line = asRecord(lineLike);
  const lineId = toCleanString(line.id);
  const status = toCleanString(line.status)?.toLowerCase() || 'draft';
  const netAmount = roundMoney(line.netAmount);

  if (!lineId) {
    return { ok: false, error: 'La linea de nomina es requerida.' };
  }
  if (!LINE_PAYABLE_STATUSES.has(status)) {
    return {
      ok: false,
      error: 'La linea debe estar aprobada y pendiente de pago.',
    };
  }
  if (netAmount <= THRESHOLD) {
    return {
      ok: false,
      error: 'La linea no tiene un neto valido para pagar.',
    };
  }

  return { ok: true };
};

const normalizePaymentAmount = ({ line, payload }) => {
  const lineAmount = roundMoney(line.netAmount ?? line.commissionAmount);
  const requestedAmount = roundMoney(
    payload.amount ?? payload.value ?? payload.totalAmount ?? lineAmount,
  );
  if (Math.abs(requestedAmount - lineAmount) > THRESHOLD) {
    return {
      ok: false,
      error:
        'Por ahora el MVP solo permite pagar el neto completo de la linea.',
    };
  }
  return { ok: true, amount: lineAmount };
};

const buildPaymentMethods = ({
  amount,
  bankAccountId,
  cashAccountId,
  cashCountId,
  method,
  reference,
}) => [
  withoutUndefined({
    method,
    amount,
    value: amount,
    bankAccountId,
    cashAccountId,
    cashCountId,
    reference,
    status: true,
  }),
];

export const buildHrPayrollPaymentCashMovementId = (
  paymentId,
  method,
  index,
) => {
  const normalizedPaymentId = sanitizeDocId(paymentId) || 'unknown_payment';
  const normalizedMethod =
    sanitizeDocId(normalizeHrPayrollPaymentMethodCode(method)) ||
    'unknown_method';
  return `hrp_${normalizedPaymentId}_${normalizedMethod}_${index + 1}`;
};

export const buildHrPayrollPaymentCashMovements = ({
  businessId,
  payment,
  createdAt,
} = {}) => {
  const paymentRecord = asRecord(payment);
  const paymentId = toCleanString(paymentRecord.id);
  const normalizedBusinessId = toCleanString(businessId);
  if (!paymentId || !normalizedBusinessId) return [];

  const paymentMethods = Array.isArray(paymentRecord.paymentMethods)
    ? paymentRecord.paymentMethods
    : [];

  return paymentMethods
    .map((entry, index) => {
      const method = asRecord(entry);
      const methodCode = normalizeHrPayrollPaymentMethodCode(method.method);
      const amount = roundMoney(method.amount ?? method.value);
      if (!SUPPORTED_MOVEMENT_METHODS.has(methodCode) || amount <= THRESHOLD) {
        return null;
      }

      return withoutUndefined({
        id: buildHrPayrollPaymentCashMovementId(paymentId, methodCode, index),
        businessId: normalizedBusinessId,
        direction: 'out',
        sourceType: 'hr_payroll_payment',
        sourceId: paymentId,
        sourceDocumentId: paymentRecord.payrollLineId,
        sourceDocumentType: 'hrPayrollEmployeeLine',
        currency: toCleanString(paymentRecord.currency),
        cashAccountId:
          toCleanString(method.cashAccountId) ||
          toCleanString(paymentRecord.cashAccountId),
        cashCountId:
          toCleanString(method.cashCountId) ||
          toCleanString(paymentRecord.cashCountId),
        bankAccountId:
          toCleanString(method.bankAccountId) ||
          toCleanString(paymentRecord.bankAccountId),
        method: methodCode,
        amount,
        counterpartyType: 'employee',
        counterpartyId: toCleanString(paymentRecord.employeeId),
        reference:
          toCleanString(method.reference) ||
          toCleanString(paymentRecord.reference),
        occurredAt:
          paymentRecord.paymentDate ??
          paymentRecord.occurredAt ??
          paymentRecord.createdAt ??
          createdAt,
        createdAt: paymentRecord.createdAt ?? createdAt,
        createdBy: toCleanString(paymentRecord.createdBy),
        impactsCashDrawer: CASH_METHODS.has(methodCode),
        impactsBankLedger: BANK_METHODS.has(methodCode),
        status: 'posted',
        metadata: {
          periodId: toCleanString(paymentRecord.periodId),
          payrollRunId: toCleanString(paymentRecord.payrollRunId),
          payrollLineId: toCleanString(paymentRecord.payrollLineId),
          employeeCode: toCleanString(paymentRecord.employeeCode),
          employeeNameSnapshot: toCleanString(
            paymentRecord.employeeNameSnapshot,
          ),
          paymentMethodIndex: index,
          paymentMethodCount: paymentMethods.length,
        },
      });
    })
    .filter(Boolean);
};

export const buildHrPayrollPaymentAccountingEvent = ({
  businessId,
  payment,
  timestamp = FieldValue.serverTimestamp(),
  userId = null,
} = {}) => {
  const paymentRecord = asRecord(payment);
  const paymentId = toCleanString(paymentRecord.id);
  const amount = roundMoney(paymentRecord.amount);
  if (!businessId || !paymentId || amount <= THRESHOLD) return null;

  const paymentChannel =
    toCleanString(paymentRecord.paymentChannel) ||
    resolveHrPayrollPaymentChannel(paymentRecord.paymentMethod);

  return buildAccountingEvent({
    businessId,
    eventType: 'hr_payroll.payment.recorded',
    eventVersion: 1,
    status: 'recorded',
    occurredAt: paymentRecord.paymentDate ?? timestamp,
    recordedAt: timestamp,
    sourceType: 'hrEmployeePayment',
    sourceId: paymentId,
    sourceDocumentType: 'hrEmployeePayment',
    sourceDocumentId: paymentId,
    counterpartyType: 'employee',
    counterpartyId: toCleanString(paymentRecord.employeeId),
    currency: toCleanString(paymentRecord.currency) || 'DOP',
    functionalCurrency: toCleanString(paymentRecord.currency) || 'DOP',
    monetary: {
      amount,
      functionalAmount: amount,
      taxAmount: 0,
      functionalTaxAmount: 0,
    },
    treasury: {
      cashAccountId: toCleanString(paymentRecord.cashAccountId),
      cashCountId: toCleanString(paymentRecord.cashCountId),
      bankAccountId: toCleanString(paymentRecord.bankAccountId),
      paymentChannel,
    },
    payload: {
      documentNature: 'expense',
      settlementTiming: 'immediate',
      settlementKind: paymentChannel,
      paymentChannel,
      paymentMethod: toCleanString(paymentRecord.paymentMethod),
      paymentMethods: Array.isArray(paymentRecord.paymentMethods)
        ? paymentRecord.paymentMethods
        : [],
      reference: toCleanString(paymentRecord.reference),
      periodId: toCleanString(paymentRecord.periodId),
      payrollRunId: toCleanString(paymentRecord.payrollRunId),
      payrollLineId: toCleanString(paymentRecord.payrollLineId),
      employeeId: toCleanString(paymentRecord.employeeId),
      employeeCode: toCleanString(paymentRecord.employeeCode),
      employeeNameSnapshot: toCleanString(paymentRecord.employeeNameSnapshot),
      baseSalaryAmount: roundMoney(paymentRecord.baseSalaryAmount),
      commissionAmount: roundMoney(paymentRecord.commissionAmount),
      grossAmount: roundMoney(paymentRecord.grossAmount),
      deductionsAmount: roundMoney(paymentRecord.deductionsAmount),
      deductionLines: Array.isArray(paymentRecord.deductionLines)
        ? paymentRecord.deductionLines
        : [],
    },
    dedupeKey: `${businessId}:hr_payroll.payment.recorded:${paymentId}:1`,
    projectionStatus: 'pending',
    createdAt: timestamp,
    createdBy: userId,
    metadata: {
      moduleKey: 'payroll',
      generatedBy: 'hrPayroll.manageHrPayrollPayment',
    },
  });
};

export const buildHrPayrollPaymentDocuments = ({
  businessId,
  line,
  payload = {},
  paymentDate,
  timestamp = FieldValue.serverTimestamp(),
  userId = null,
} = {}) => {
  const lineRecord = asRecord(line);
  const paymentPayload = asRecord(payload);
  const payable = assertHrPayrollLinePayable(lineRecord);
  if (!payable.ok) return payable;

  const amountResult = normalizePaymentAmount({
    line: lineRecord,
    payload: paymentPayload,
  });
  if (!amountResult.ok) return amountResult;

  const paymentId = buildHrPayrollPaymentId({
    lineId: lineRecord.id,
    paymentId: paymentPayload.paymentId,
  });
  if (!businessId || !paymentId) {
    return {
      ok: false,
      error: 'No se pudo generar el pago de nomina.',
    };
  }

  const paymentMethod = normalizeHrPayrollPaymentMethodCode(
    paymentPayload.paymentMethod ?? lineRecord.paymentMethod,
  );
  const paymentChannel = resolveHrPayrollPaymentChannel(paymentMethod);
  const bankAccountId = toCleanString(paymentPayload.bankAccountId);
  const cashAccountId = toCleanString(paymentPayload.cashAccountId);
  const cashCountId = toCleanString(paymentPayload.cashCountId);
  if (!SUPPORTED_MOVEMENT_METHODS.has(paymentMethod)) {
    return {
      ok: false,
      error: SUPPORTED_PAYMENT_METHOD_MESSAGE,
    };
  }
  if (CASH_METHODS.has(paymentMethod) && (!cashAccountId || !cashCountId)) {
    return {
      ok: false,
      error:
        'Indica la caja y el cuadre operativo para registrar este pago en efectivo.',
    };
  }
  if (BANK_METHODS.has(paymentMethod) && !bankAccountId) {
    return {
      ok: false,
      error: 'Indica la cuenta bancaria operativa antes de confirmar el pago.',
    };
  }
  const reference =
    toCleanString(paymentPayload.reference) ||
    toCleanString(paymentPayload.transferReference) ||
    toCleanString(paymentPayload.checkNumber);
  const paymentMethods = buildPaymentMethods({
    amount: amountResult.amount,
    bankAccountId,
    cashAccountId,
    cashCountId,
    method: paymentMethod,
    reference,
  });

  const payment = withoutUndefined({
    id: paymentId,
    businessId,
    periodId: toCleanString(lineRecord.periodId),
    payrollRunId: toCleanString(lineRecord.payrollRunId),
    payrollLineId: toCleanString(lineRecord.id),
    employeeId: toCleanString(lineRecord.employeeId),
    employeeCode: toCleanString(lineRecord.employeeCode),
    employeeNameSnapshot: toCleanString(lineRecord.employeeNameSnapshot),
    partyId: toCleanString(lineRecord.partyId),
    paymentDestination: toCleanString(lineRecord.paymentDestination),
    depositAccount: normalizeHrDepositAccount(lineRecord.depositAccount),
    baseSalaryAmount: roundMoney(lineRecord.baseSalaryAmount),
    commissionAmount: roundMoney(lineRecord.commissionAmount),
    grossAmount: roundMoney(lineRecord.grossAmount),
    deductionsAmount: roundMoney(lineRecord.deductionsAmount),
    deductionLines: Array.isArray(lineRecord.deductionLines)
      ? lineRecord.deductionLines
      : [],
    amount: amountResult.amount,
    currency: toCleanString(lineRecord.currency)?.toUpperCase() || 'DOP',
    status: 'confirmed',
    paymentMethod,
    paymentChannel,
    paymentMethods,
    paymentDate: paymentDate ?? timestamp,
    reference,
    transferReference: toCleanString(paymentPayload.transferReference),
    checkNumber: toCleanString(paymentPayload.checkNumber),
    bankAccountId,
    cashAccountId,
    cashCountId,
    createdAt: timestamp,
    createdBy: userId,
    confirmedAt: timestamp,
    confirmedBy: userId,
    metadata: asRecord(paymentPayload.metadata),
  });

  const accountingEvent = buildHrPayrollPaymentAccountingEvent({
    businessId,
    payment,
    timestamp,
    userId,
  });
  if (!accountingEvent) {
    return {
      ok: false,
      error: 'No se pudo generar el evento contable del pago.',
    };
  }

  const cashMovements = buildHrPayrollPaymentCashMovements({
    businessId,
    payment,
    createdAt: timestamp,
  });
  const cashMovementIds = cashMovements.map((movement) => movement.id);
  const paymentWithLinks = {
    ...payment,
    accountingEventId: accountingEvent.id,
    cashMovementIds,
  };
  const linePatch = {
    status: 'paid',
    employeePaymentId: paymentId,
    paymentMethod,
    paymentAccountingEventId: accountingEvent.id,
    cashMovementIds,
    paidAt: timestamp,
    paidBy: userId,
    updatedAt: timestamp,
    updatedBy: userId,
  };
  const entryPatch = {
    status: 'paid',
    employeePaymentId: paymentId,
    paymentAccountingEventId: accountingEvent.id,
    updatedAt: timestamp,
    updatedBy: userId,
  };

  return {
    ok: true,
    payment: paymentWithLinks,
    accountingEvent,
    cashMovements,
    linePatch,
    entryPatch,
  };
};

export const buildHrPayrollPaymentAggregateStatusPatch = ({
  currentLineId,
  employeeLines = [],
  paymentId = null,
  timestamp = FieldValue.serverTimestamp(),
  userId = null,
} = {}) => {
  const normalizedCurrentLineId = toCleanString(currentLineId);
  const lines = (Array.isArray(employeeLines) ? employeeLines : []).map(
    (line) => asRecord(line),
  );
  const effectiveLines = lines.map((line) => ({
    ...line,
    status:
      toCleanString(line.id) === normalizedCurrentLineId
        ? 'paid'
        : toCleanString(line.status)?.toLowerCase() || 'draft',
  }));
  const paidLines = effectiveLines.filter((line) => line.status === 'paid');
  const status =
    effectiveLines.length > 0 && paidLines.length === effectiveLines.length
      ? 'paid'
      : 'partially_paid';
  const paidAmount = roundMoney(
    paidLines.reduce((sum, line) => sum + roundMoney(line.netAmount), 0),
  );

  return withoutUndefined({
    status,
    paidAmount,
    paidLinesCount: paidLines.length,
    lastPaymentId: toCleanString(paymentId),
    lastPaymentAt: timestamp,
    lastPaymentBy: userId,
    ...(status === 'paid'
      ? { paidAt: timestamp, paidBy: userId }
      : { partiallyPaidAt: timestamp, partiallyPaidBy: userId }),
    updatedAt: timestamp,
    updatedBy: userId,
  });
};
