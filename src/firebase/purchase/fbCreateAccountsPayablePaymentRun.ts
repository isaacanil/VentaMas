import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type { UserIdentity } from '@/types/users';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export interface CreateAccountsPayablePaymentRunScope {
  description?: string | null;
  isClientFilteredQuery?: boolean;
  isQueryLimitReached?: boolean;
  label?: string | null;
  queryLimit?: number | null;
  rawDocCount?: number | null;
}

export interface CreateAccountsPayablePaymentRunInput {
  businessId?: string | null;
  scope?: CreateAccountsPayablePaymentRunScope | null;
  vendorBillIds: string[];
}

export interface CreateAccountsPayablePaymentRunResult {
  ok: boolean;
  paymentRunId: string;
  paymentRun?: {
    approvalStatus?: string | null;
    executionStatus?: string | null;
    status?: string | null;
    totals?: {
      eligibleCashRequirementAmount?: number;
      eligibleCount?: number;
      eligibleWithholdingAmount?: number;
      excludedCount?: number;
      requestedCount?: number;
    } | null;
  } | null;
}

type CreateAccountsPayablePaymentRunPayload = {
  businessId: string;
  scope?: CreateAccountsPayablePaymentRunScope | null;
  sessionToken?: string;
  vendorBillIds: string[];
};

const createAccountsPayablePaymentRunCallable = createFirebaseCallable<
  CreateAccountsPayablePaymentRunPayload,
  CreateAccountsPayablePaymentRunResult
>('createAccountsPayablePaymentRun');

export const fbCreateAccountsPayablePaymentRun = async (
  user: UserIdentity | null | undefined,
  input: CreateAccountsPayablePaymentRunInput,
): Promise<CreateAccountsPayablePaymentRunResult> => {
  const businessId =
    toCleanString(input.businessId) ??
    user?.businessID ??
    user?.businessId ??
    user?.activeBusinessId ??
    null;
  const vendorBillIds = [...new Set(input.vendorBillIds.map(toCleanString))]
    .filter(Boolean) as string[];

  if (!businessId) {
    throw new Error('No hay negocio activo para crear la corrida CxP.');
  }
  if (!vendorBillIds.length) {
    throw new Error('Seleccione cuentas por pagar válidas para la corrida.');
  }

  const { sessionToken } = getStoredSession();
  const result = await createAccountsPayablePaymentRunCallable({
    businessId,
    vendorBillIds,
    scope: input.scope ?? null,
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!result?.ok || !result.paymentRunId) {
    throw new Error('No se pudo crear la corrida CxP.');
  }

  return result;
};
