import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { createFirebaseCallable } from '@/firebase/functions/callable';
import type { UserIdentity } from '@/types/users';

const toCleanString = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length ? trimmed : null;
};

export type ManageAccountsPayablePaymentRunAction =
  | 'submit'
  | 'approve'
  | 'reject'
  | 'cancel';

export interface ManageAccountsPayablePaymentRunInput {
  action: ManageAccountsPayablePaymentRunAction;
  businessId?: string | null;
  evidenceNote?: string | null;
  evidenceUrls?: string[] | null;
  paymentRunId: string;
  reason: string;
}

export interface ManageAccountsPayablePaymentRunResult {
  ok: boolean;
  action: ManageAccountsPayablePaymentRunAction;
  approvalStatus?: string | null;
  businessId: string;
  eventId: string;
  executionStatus?: string | null;
  paymentRunId: string;
  status?: string | null;
}

type ManageAccountsPayablePaymentRunPayload =
  ManageAccountsPayablePaymentRunInput & {
    businessId: string;
    evidenceUrls?: string[];
    sessionToken?: string;
  };

const manageAccountsPayablePaymentRunCallable = createFirebaseCallable<
  ManageAccountsPayablePaymentRunPayload,
  ManageAccountsPayablePaymentRunResult
>('manageAccountsPayablePaymentRun');

export const fbManageAccountsPayablePaymentRun = async (
  user: UserIdentity | null | undefined,
  input: ManageAccountsPayablePaymentRunInput,
): Promise<ManageAccountsPayablePaymentRunResult> => {
  const businessId =
    toCleanString(input.businessId) ??
    user?.businessID ??
    user?.businessId ??
    user?.activeBusinessId ??
    null;
  const paymentRunId = toCleanString(input.paymentRunId);
  const reason = toCleanString(input.reason);
  const evidenceNote = toCleanString(input.evidenceNote);
  const evidenceUrls = (
    Array.isArray(input.evidenceUrls) ? input.evidenceUrls : []
  )
    .map((entry) => toCleanString(entry))
    .filter(Boolean) as string[];

  if (!businessId) {
    throw new Error('No hay negocio activo para actualizar la corrida CxP.');
  }
  if (!paymentRunId) {
    throw new Error('Debe indicar una corrida CxP válida.');
  }
  if (!reason || reason.length < 5) {
    throw new Error('Debe indicar un motivo con al menos 5 caracteres.');
  }
  if (
    ['approve', 'reject', 'cancel'].includes(input.action) &&
    !evidenceNote &&
    evidenceUrls.length === 0
  ) {
    throw new Error(
      'Debe indicar una evidencia o referencia para esta acción de corrida CxP.',
    );
  }

  const { sessionToken } = getStoredSession();
  const result = await manageAccountsPayablePaymentRunCallable({
    action: input.action,
    businessId,
    paymentRunId,
    reason,
    evidenceNote: evidenceNote ?? null,
    evidenceUrls,
    ...(sessionToken ? { sessionToken } : {}),
  });

  if (!result?.ok) {
    throw new Error('No se pudo actualizar la corrida CxP.');
  }

  return result;
};
