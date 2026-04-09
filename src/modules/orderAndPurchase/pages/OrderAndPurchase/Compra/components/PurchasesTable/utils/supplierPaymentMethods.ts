import type { PaymentMethodEntry, SupplierCreditNote } from '@/types/payments';
import { toMillis } from '@/utils/date/toMillis';
import {
  paymentMethodRequiresBankAccount,
  paymentMethodRequiresCashCount,
} from '@/utils/payments/methods';

export type SupplierPaymentMethodCode =
  | 'cash'
  | 'card'
  | 'transfer'
  | 'supplierCreditNote';

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

const roundToTwoDecimals = (value: number): number =>
  Math.round(value * 100) / 100;

const toFiniteNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
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

export const normalizeSupplierCreditNotes = (
  creditNotes: SupplierCreditNote[] | null | undefined,
): SupplierCreditNote[] =>
  (Array.isArray(creditNotes) ? creditNotes : [])
    .map((creditNote) => ({
      ...creditNote,
      remainingAmount: resolveSupplierCreditNoteRemainingAmount(creditNote),
    }))
    .filter((creditNote) => {
      const status = toCleanString(creditNote.status)?.toLowerCase();
      return status !== 'void' && (creditNote.remainingAmount ?? 0) > THRESHOLD;
    })
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
  methods.flatMap((method) => {
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
            amount: allocation.amount,
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
        amount: value,
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
  }: {
    requireBankAccount?: boolean;
    allowBankMethods?: boolean;
    availableCreditNotes?: SupplierCreditNote[] | null;
    balance?: number | null;
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

  if (!submissionMethods.length) {
    return 'Ingrese al menos un monto válido para registrar el pago.';
  }

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

  if (
    typeof balance === 'number' &&
    Number.isFinite(balance) &&
    totalAmount - roundToTwoDecimals(Math.max(balance, 0)) > THRESHOLD
  ) {
    return 'El pago no puede superar el balance actual de la compra.';
  }

  return null;
};
