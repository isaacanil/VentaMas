import type {
  CanonicalPaymentMethodCode,
  PaymentMethodEntry,
  PaymentWithholdingApplication,
  SupplierCreditNote,
} from '@/types/payments';
import { toMillis } from '@/utils/date/toMillis';
import {
  paymentMethodRequiresBankAccount,
  paymentMethodRequiresCashCount,
} from '@/utils/payments/methods';
import type { Purchase } from '@/utils/purchase/types';

export type SupplierPaymentMethodCode = Extract<
  CanonicalPaymentMethodCode,
  'cash' | 'card' | 'transfer' | 'supplierCreditNote'
>;

export interface SupplierPaymentMethodDraft extends PaymentMethodEntry {
  method: SupplierPaymentMethodCode;
  status: boolean;
  value: number;
  reference: string;
  bankAccountId: string | null;
  cashCountId: string | null;
}

export interface SupplierCreditNoteAllocation {
  id: string;
  amount: number;
}

export type SupplierPaymentWithholdingApplication =
  PaymentWithholdingApplication;

export interface SupplierPaymentFiscalSettlement {
  cashRequirementAmount: number;
  netPayableAmount: number | null;
  settlementAmount: number;
  withholdingAmount: number;
  withholdingApplications: SupplierPaymentWithholdingApplication[];
  withholdingITBISAmount: number;
  withholdingISRAmount: number;
}

export const SUPPLIER_PAYMENT_METHODS: Array<{
  method: SupplierPaymentMethodCode;
  label: string;
}> = [
  { method: 'cash', label: 'Efectivo' },
  { method: 'card', label: 'Tarjeta' },
  { method: 'transfer', label: 'Transferencia' },
  { method: 'supplierCreditNote', label: 'Saldo a favor' },
];

const THRESHOLD = 0.01;
const APPLICABLE_SUPPLIER_CREDIT_NOTE_STATUSES = new Set(['open']);

export const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

export const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

const toCleanDisplayString = (value: unknown): string | null => {
  if (typeof value === 'number' && Number.isFinite(value)) return String(value);
  return toCleanString(value);
};

const asRecord = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};

const pickFiscalNumber = (
  purchase: Purchase | null | undefined,
  keys: string[],
): number | null => {
  if (!purchase) return null;

  const purchaseRecord = asRecord(purchase);
  const monetary = asRecord(purchase.monetary);
  const records = [
    asRecord(monetary.fiscalTotals),
    asRecord(monetary.documentTotals),
    monetary,
    asRecord(monetary.functionalTotals),
    asRecord(monetary.legacyTotals),
    asRecord(purchaseRecord.fiscalTotals),
    purchaseRecord,
  ];

  for (const record of records) {
    for (const key of keys) {
      const amount = toFiniteNumber(record[key]);
      if (amount != null) return roundToTwoDecimals(amount);
    }
  }

  return null;
};

const resolvePurchaseFiscalReference = (
  purchase: Purchase | null | undefined,
): string | null => {
  if (!purchase) return null;
  const purchaseRecord = asRecord(purchase);
  const taxReceipt = asRecord(purchase.taxReceipt);

  return (
    toCleanDisplayString(purchaseRecord.vendorReference) ??
    toCleanDisplayString(purchase.invoiceNumber) ??
    toCleanDisplayString(purchaseRecord.reference) ??
    toCleanDisplayString(taxReceipt.ncf) ??
    toCleanDisplayString(purchase.proofOfPurchase)
  );
};

const resolvePurchaseTaxPeriod = (
  purchase: Purchase | null | undefined,
): string | null => {
  const millis = toMillis(
    purchase?.completedAt ??
      purchase?.deliveryAt ??
      purchase?.dates?.deliveryDate ??
      null,
  );
  if (millis == null) return null;

  const date = new Date(millis);
  const year = date.getFullYear();
  const month = `${date.getMonth() + 1}`.padStart(2, '0');
  return `${year}-${month}`;
};

export const resolveSupplierPaymentFiscalSettlement = ({
  balance,
  purchase,
}: {
  balance: number;
  purchase: Purchase | null | undefined;
}): SupplierPaymentFiscalSettlement => {
  const normalizedBalance = roundToTwoDecimals(
    Math.max(toFiniteNumber(balance) ?? 0, 0),
  );
  const withholdingITBISAmount = roundToTwoDecimals(
    Math.max(
      pickFiscalNumber(purchase, ['withholdingITBISAmount', 'itbisWithheld']) ??
        0,
      0,
    ),
  );
  const withholdingISRAmount = roundToTwoDecimals(
    Math.max(
      pickFiscalNumber(purchase, ['withholdingISRAmount', 'isrWithheld']) ?? 0,
      0,
    ),
  );
  const rawWithholdingAmount = roundToTwoDecimals(
    withholdingITBISAmount + withholdingISRAmount,
  );
  const paidAmount = roundToTwoDecimals(
    Math.max(toFiniteNumber(purchase?.paymentState?.paid) ?? 0, 0),
  );
  const paymentCount = Math.max(
    Math.trunc(toFiniteNumber(purchase?.paymentState?.paymentCount) ?? 0),
    0,
  );
  const shouldApplyWithholding =
    rawWithholdingAmount > THRESHOLD &&
    normalizedBalance > THRESHOLD &&
    paidAmount <= THRESHOLD &&
    paymentCount === 0;
  const withholdingAmount = shouldApplyWithholding
    ? roundToTwoDecimals(Math.min(rawWithholdingAmount, normalizedBalance))
    : 0;
  const withholdingScale =
    rawWithholdingAmount > THRESHOLD
      ? withholdingAmount / rawWithholdingAmount
      : 0;
  const appliedITBISAmount = roundToTwoDecimals(
    Math.min(withholdingITBISAmount * withholdingScale, withholdingAmount),
  );
  const appliedISRAmount = roundToTwoDecimals(
    Math.max(withholdingAmount - appliedITBISAmount, 0),
  );
  const reference = resolvePurchaseFiscalReference(purchase);
  const taxPeriod = resolvePurchaseTaxPeriod(purchase);
  const sourceDocumentId = toCleanString(purchase?.id);
  const withholdingApplications: SupplierPaymentWithholdingApplication[] = [
    {
      type: 'itbis',
      amount: appliedITBISAmount,
      reference,
      taxPeriod,
      sourceDocumentId,
    },
    {
      type: 'isr',
      amount: appliedISRAmount,
      reference,
      taxPeriod,
      sourceDocumentId,
    },
  ].filter((application) => application.amount > THRESHOLD);
  const totalAmount =
    pickFiscalNumber(purchase, ['total', 'amount', 'totalPurchase', 'gross']) ??
    toFiniteNumber(purchase?.paymentState?.total);
  const netPayableAmount =
    pickFiscalNumber(purchase, ['netPayableAmount', 'net']) ??
    (totalAmount != null
      ? roundToTwoDecimals(Math.max(totalAmount - rawWithholdingAmount, 0))
      : null);
  const cashRequirementAmount = roundToTwoDecimals(
    Math.max(normalizedBalance - withholdingAmount, 0),
  );

  return {
    cashRequirementAmount,
    netPayableAmount,
    settlementAmount: roundToTwoDecimals(
      cashRequirementAmount + withholdingAmount,
    ),
    withholdingAmount,
    withholdingApplications,
    withholdingITBISAmount: appliedITBISAmount,
    withholdingISRAmount: appliedISRAmount,
  };
};

const resolveSupplierCreditNoteRemainingAmount = (
  creditNote: SupplierCreditNote,
): number => {
  const totalAmount = roundToTwoDecimals(
    toFiniteNumber(creditNote.totalAmount) ?? 0,
  );
  const appliedAmount = roundToTwoDecimals(
    toFiniteNumber(creditNote.appliedAmount) ?? 0,
  );
  const explicitRemainingAmount = toFiniteNumber(creditNote.remainingAmount);

  return roundToTwoDecimals(
    Math.max(
      explicitRemainingAmount ?? Math.max(totalAmount - appliedAmount, 0),
      0,
    ),
  );
};

const isSupplierCreditNoteApplicable = (
  creditNote: SupplierCreditNote,
): boolean => {
  const status = toCleanString(creditNote.status)?.toLowerCase();
  return Boolean(
    status &&
      APPLICABLE_SUPPLIER_CREDIT_NOTE_STATUSES.has(status) &&
      (creditNote.remainingAmount ?? 0) > THRESHOLD,
  );
};

export const normalizeSupplierCreditNotes = (
  creditNotes: SupplierCreditNote[] | null | undefined,
): SupplierCreditNote[] =>
  (Array.isArray(creditNotes) ? creditNotes : [])
    .map((creditNote) => ({
      ...creditNote,
      remainingAmount: resolveSupplierCreditNoteRemainingAmount(creditNote),
    }))
    .filter(isSupplierCreditNoteApplicable)
    .sort(
      (left, right) =>
        (toMillis(left.createdAt) ?? toMillis(left.updatedAt) ?? 0) -
        (toMillis(right.createdAt) ?? toMillis(right.updatedAt) ?? 0),
    );

export const getAvailableSupplierCreditBalance = (
  creditNotes: SupplierCreditNote[] | null | undefined,
): number =>
  roundToTwoDecimals(
    normalizeSupplierCreditNotes(creditNotes).reduce(
      (sum, creditNote) => sum + (creditNote.remainingAmount ?? 0),
      0,
    ),
  );

interface CreateDefaultSupplierPaymentMethodsOptions {
  initialCashValue?: number;
  defaultCashCountId?: string | null;
}

export const createDefaultSupplierPaymentMethods = ({
  initialCashValue = 0,
  defaultCashCountId = null,
}: CreateDefaultSupplierPaymentMethodsOptions = {}): SupplierPaymentMethodDraft[] => {
  const normalizedInitialCashValue = roundToTwoDecimals(
    Math.max(toFiniteNumber(initialCashValue) ?? 0, 0),
  );

  return SUPPLIER_PAYMENT_METHODS.map(({ method }) => ({
    method,
    status: method === 'cash',
    value: method === 'cash' ? normalizedInitialCashValue : 0,
    reference: '',
    bankAccountId: null,
    cashCountId: method === 'cash' ? defaultCashCountId : null,
    supplierCreditNoteId: null,
  }));
};

const getRequestedSupplierCreditAmount = (
  methods: SupplierPaymentMethodDraft[],
): number =>
  roundToTwoDecimals(
    methods.reduce((sum, method) => {
      if (!method.status || method.method !== 'supplierCreditNote') {
        return sum;
      }

      return sum + Math.max(toFiniteNumber(method.value) ?? 0, 0);
    }, 0),
  );

export const getSupplierPaymentMethodsTotal = (
  methods: SupplierPaymentMethodDraft[],
): number =>
  roundToTwoDecimals(
    methods.reduce((sum, method) => {
      if (!method.status) return sum;
      return sum + Math.max(toFiniteNumber(method.value) ?? 0, 0);
    }, 0),
  );

export const buildSupplierCreditNoteAllocations = ({
  requestedAmount,
  creditNotes,
}: {
  requestedAmount: number;
  creditNotes: SupplierCreditNote[] | null | undefined;
}): SupplierCreditNoteAllocation[] => {
  const normalizedRequestedAmount = roundToTwoDecimals(
    Math.max(toFiniteNumber(requestedAmount) ?? 0, 0),
  );
  if (normalizedRequestedAmount <= THRESHOLD) {
    return [];
  }

  const normalizedCreditNotes = normalizeSupplierCreditNotes(creditNotes);
  let remainingToAllocate = normalizedRequestedAmount;
  const allocations: SupplierCreditNoteAllocation[] = [];

  normalizedCreditNotes.forEach((creditNote) => {
    if (remainingToAllocate <= THRESHOLD) {
      return;
    }

    const availableAmount =
      resolveSupplierCreditNoteRemainingAmount(creditNote);
    if (availableAmount <= THRESHOLD || !creditNote.id) {
      return;
    }

    const allocationAmount = roundToTwoDecimals(
      Math.min(remainingToAllocate, availableAmount),
    );
    if (allocationAmount <= THRESHOLD) {
      return;
    }

    allocations.push({
      id: creditNote.id,
      amount: allocationAmount,
    });
    remainingToAllocate = roundToTwoDecimals(
      Math.max(remainingToAllocate - allocationAmount, 0),
    );
  });

  return allocations;
};

export const getSupplierPaymentSubmissionMethods = (
  methods: SupplierPaymentMethodDraft[],
  {
    includeBankAccount = true,
    availableCreditNotes = [],
  }: {
    includeBankAccount?: boolean;
    availableCreditNotes?: SupplierCreditNote[] | null;
  } = {},
): PaymentMethodEntry[] =>
  methods.flatMap<PaymentMethodEntry>((method) => {
    if (!method.status) {
      return [];
    }

    const value = roundToTwoDecimals(
      Math.max(toFiniteNumber(method.value) ?? 0, 0),
    );
    if (value <= THRESHOLD) {
      return [];
    }

    if (method.method === 'supplierCreditNote') {
      return buildSupplierCreditNoteAllocations({
        requestedAmount: value,
        creditNotes: availableCreditNotes,
      }).map(
        (allocation) =>
          ({
            method: 'supplierCreditNote',
            status: true,
            value: allocation.amount,
            reference: null,
            bankAccountId: null,
            cashCountId: null,
            supplierCreditNoteId: allocation.id,
          }) satisfies PaymentMethodEntry,
      );
    }

    return [
      {
        method: method.method,
        status: true,
        value,
        reference: toCleanString(method.reference),
        bankAccountId:
          includeBankAccount && paymentMethodRequiresBankAccount(method.method)
            ? toCleanString(method.bankAccountId)
            : null,
        cashCountId: paymentMethodRequiresCashCount(method.method)
          ? toCleanString(method.cashCountId)
          : null,
        supplierCreditNoteId: null,
      } satisfies PaymentMethodEntry,
    ];
  });

export const validateSupplierPaymentMethods = (
  methods: SupplierPaymentMethodDraft[],
  {
    requireBankAccount = true,
    allowBankMethods = true,
    availableCreditNotes = [],
    balance = null,
    settlementAdjustmentAmount = 0,
  }: {
    requireBankAccount?: boolean;
    allowBankMethods?: boolean;
    availableCreditNotes?: SupplierCreditNote[] | null;
    balance?: number | null;
    settlementAdjustmentAmount?: number;
  } = {},
): string | null => {
  const requestedSupplierCreditAmount =
    getRequestedSupplierCreditAmount(methods);
  const availableSupplierCreditBalance =
    getAvailableSupplierCreditBalance(availableCreditNotes);
  const submissionMethods = getSupplierPaymentSubmissionMethods(methods, {
    includeBankAccount: requireBankAccount,
    availableCreditNotes,
  });
  const totalAmount = roundToTwoDecimals(
    submissionMethods.reduce(
      (sum, method) => sum + Math.max(toFiniteNumber(method.value) ?? 0, 0),
      0,
    ),
  );
  const normalizedSettlementAdjustmentAmount = roundToTwoDecimals(
    Math.max(toFiniteNumber(settlementAdjustmentAmount) ?? 0, 0),
  );
  const settlementAmount = roundToTwoDecimals(
    totalAmount + normalizedSettlementAdjustmentAmount,
  );

  if (
    requestedSupplierCreditAmount > THRESHOLD &&
    availableSupplierCreditBalance <= THRESHOLD
  ) {
    return 'El suplidor no tiene saldo a favor disponible para aplicar.';
  }

  if (
    requestedSupplierCreditAmount - availableSupplierCreditBalance >
    THRESHOLD
  ) {
    return 'El monto aplicado desde saldo a favor supera el crédito disponible.';
  }

  if (!submissionMethods.length) {
    return 'Ingrese al menos un monto válido para registrar el pago.';
  }

  const cashMethodMissingCashCount = submissionMethods.find(
    (method) =>
      paymentMethodRequiresCashCount(method.method) && !method.cashCountId,
  );
  if (cashMethodMissingCashCount) {
    return 'Debe tener un cuadre abierto para registrar pagos en efectivo.';
  }

  if (!allowBankMethods) {
    const bankMethodEnabled = submissionMethods.find((method) =>
      paymentMethodRequiresBankAccount(method.method),
    );
    if (bankMethodEnabled) {
      return 'Los pagos con tarjeta o transferencia no estan habilitados para este negocio.';
    }
  }

  if (requireBankAccount) {
    const bankMethodMissingAccount = submissionMethods.find(
      (method) =>
        paymentMethodRequiresBankAccount(method.method) &&
        !method.bankAccountId,
    );
    if (bankMethodMissingAccount) {
      return 'Seleccione una cuenta bancaria para los métodos de tarjeta o transferencia.';
    }
  }

  const bankMethodMissingReference = submissionMethods.find(
    (method) =>
      paymentMethodRequiresBankAccount(method.method) && !method.reference,
  );
  if (bankMethodMissingReference) {
    return 'Ingrese una referencia o comprobante para tarjeta o transferencia.';
  }

  if (
    typeof balance === 'number' &&
    Number.isFinite(balance) &&
    settlementAmount - roundToTwoDecimals(Math.max(balance, 0)) > THRESHOLD
  ) {
    return 'El monto liquidado no puede superar el balance actual de la compra.';
  }

  return null;
};
