import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type {
  AccountsPayablePayment,
  PaymentMethodEntry,
  PaymentState,
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
  occurredAt: number;
  paymentMethods?: PaymentMethodEntry[] | null;
  nextPaymentAt?: number | null;
  idempotencyKey: string;
  note?: string | null;
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
  payment?: AccountsPayablePayment | null;
}

export const fbAddAccountsPayablePayment = async (
  user: UserIdentity | null | undefined,
  input: AddAccountsPayablePaymentInput,
): Promise<AddAccountsPayablePaymentResult> => {
  const businessId =
    user?.businessID ?? user?.businessId ?? user?.activeBusinessId ?? null;
  const purchaseId = toCleanString(input.purchase?.id);

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

  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    {
      businessId: string;
      purchaseId: string;
      vendorBillId?: string | null;
      occurredAt: number;
      nextPaymentAt?: number | null;
      idempotencyKey: string;
      note?: string | null;
      paymentMethods: PaymentMethodEntry[];
      sessionToken?: string;
    },
    AddAccountsPayablePaymentResult
  >(functions, 'addSupplierPayment');

  const response = await callable({
    businessId,
    purchaseId,
    vendorBillId: toCleanString(input.vendorBillId),
    occurredAt: input.occurredAt,
    nextPaymentAt: input.nextPaymentAt ?? null,
    idempotencyKey: input.idempotencyKey,
    note: input.note ?? null,
    paymentMethods: Array.isArray(input.paymentMethods)
      ? input.paymentMethods
      : [],
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!response.data?.ok) {
    throw new Error('No se pudo registrar el pago al proveedor.');
  }

  return response.data;
};
