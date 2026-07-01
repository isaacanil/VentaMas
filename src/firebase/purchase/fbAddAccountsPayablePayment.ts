import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type {
  AccountsPayablePayment,
  PaymentMethodEntry,
  PaymentState,
  PaymentWithholdingApplication,
} from '@/types/payments';
import type { UserIdentity } from '@/types/users';
import type { Purchase } from '@/utils/purchase/types';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export interface AddAccountsPayablePaymentInput {
  purchase: Purchase;
  vendorBillId?: string | null;
  paymentRunId?: string | null;
  occurredAt: number;
  paymentMethods?: PaymentMethodEntry[] | null;
  withholdingApplications?: PaymentWithholdingApplication[] | null;
  nextPaymentAt?: number | null;
  idempotencyKey: string;
  note?: string | null;
  evidenceNote?: string | null;
  evidenceUrls?: string[] | null;
}

export interface AddAccountsPayablePaymentResult {
  ok: boolean;
  reused?: boolean;
  paymentId: string;
  purchaseId: string | null;
  vendorBillId?: string | null;
  receiptNumber: string | null;
  paymentState: PaymentState | null;
  appliedCreditNotes?: Array<{
    id: string;
    appliedAmount: number;
    remainingAmount: number;
  }>;
  withholdingApplications?: PaymentWithholdingApplication[];
  payment?: AccountsPayablePayment | null;
}

type AddAccountsPayablePaymentPayload = {
  businessId: string;
  purchaseId: string;
  vendorBillId?: string | null;
  paymentRunId?: string | null;
  occurredAt: number;
  nextPaymentAt?: number | null;
  idempotencyKey: string;
  note?: string | null;
  evidenceNote?: string | null;
  evidenceUrls?: string[];
  paymentMethods: PaymentMethodEntry[];
  withholdingApplications?: PaymentWithholdingApplication[];
  sessionToken?: string;
};

const addSupplierPaymentCallable = createFirebaseCallable<
  AddAccountsPayablePaymentPayload,
  AddAccountsPayablePaymentResult
>('addSupplierPayment');

export const fbAddAccountsPayablePayment = async (
  user: UserIdentity | null | undefined,
  input: AddAccountsPayablePaymentInput,
): Promise<AddAccountsPayablePaymentResult> => {
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const purchaseId = toCleanString(input.purchase?.id);
  const note = toCleanString(input.note);
  const evidenceNote = toCleanString(input.evidenceNote);
  const evidenceUrls = (
    Array.isArray(input.evidenceUrls) ? input.evidenceUrls : []
  )
    .map((entry) => toCleanString(entry))
    .filter(Boolean) as string[];

  if (!businessId) {
    throw new Error(
      'No hay negocio activo para registrar el pago al proveedor.',
    );
  }
  if (!purchaseId) {
    throw new Error('La compra no tiene un id válido.');
  }
  if (!toCleanString(input.idempotencyKey)) {
    throw new Error('Debe indicar una llave de idempotencia válida.');
  }
  if (!evidenceNote && evidenceUrls.length === 0) {
    throw new Error(
      'Debe indicar una evidencia o referencia para registrar el pago al proveedor.',
    );
  }

  const { sessionToken } = getStoredSession();
  const result = await addSupplierPaymentCallable({
    businessId,
    purchaseId,
    vendorBillId: toCleanString(input.vendorBillId),
    paymentRunId: toCleanString(input.paymentRunId),
    occurredAt: input.occurredAt,
    nextPaymentAt: input.nextPaymentAt ?? null,
    idempotencyKey: input.idempotencyKey,
    note: note ?? evidenceNote ?? null,
    evidenceNote: evidenceNote ?? null,
    evidenceUrls,
    paymentMethods: Array.isArray(input.paymentMethods)
      ? input.paymentMethods
      : [],
    withholdingApplications: Array.isArray(input.withholdingApplications)
      ? input.withholdingApplications
      : [],
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!result?.ok) {
    throw new Error('No se pudo registrar el pago al proveedor.');
  }

  return result;
};
