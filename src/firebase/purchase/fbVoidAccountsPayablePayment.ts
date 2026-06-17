import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type { AccountsPayablePayment, PaymentState } from '@/types/payments';
import type { UserIdentity } from '@/types/users';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export interface VoidAccountsPayablePaymentInput {
  paymentId: string;
  reason?: string | null;
  businessId?: string | null;
}

export interface VoidAccountsPayablePaymentResult {
  ok: boolean;
  alreadyVoided?: boolean;
  paymentId: string;
  purchaseId: string | null;
  vendorBillId?: string | null;
  paymentState: PaymentState | null;
  restoredCreditNotes?: Array<{
    id: string;
    restoredAmount: number;
    remainingAmount: number;
  }>;
  payment?: AccountsPayablePayment | null;
}

type VoidAccountsPayablePaymentPayload = {
  businessId: string;
  paymentId: string;
  reason?: string | null;
  sessionToken?: string;
};

const voidSupplierPaymentCallable = createFirebaseCallable<
  VoidAccountsPayablePaymentPayload,
  VoidAccountsPayablePaymentResult
>('voidSupplierPayment');

export const fbVoidAccountsPayablePayment = async (
  user: UserIdentity | null | undefined,
  input: VoidAccountsPayablePaymentInput,
): Promise<VoidAccountsPayablePaymentResult> => {
  const businessId =
    toCleanString(input.businessId) ??
    user?.businessID ??
    user?.businessId ??
    user?.activeBusinessId ??
    null;
  const paymentId = toCleanString(input.paymentId);

  if (!businessId) {
    throw new Error('No hay negocio activo para anular el pago al proveedor.');
  }
  if (!paymentId) {
    throw new Error('Debe indicar un pago válido para anular.');
  }

  const { sessionToken } = getStoredSession();
  const result = await voidSupplierPaymentCallable({
    businessId,
    paymentId,
    reason: input.reason ?? null,
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!result?.ok) {
    throw new Error('No se pudo anular el pago al proveedor.');
  }

  return result;
};
