import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { getClientBuildInfo } from '@/firebase/app/getClientBuildInfo';
import { functions } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord } from '@/utils/cashCount/types';
import type { TimestampLike } from '@/utils/date/types';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

type CloseCashCountPayload = Pick<
  CashCountRecord,
  | 'id'
  | 'totalCard'
  | 'totalTransfer'
  | 'totalCharged'
  | 'totalReceivables'
  | 'totalDiscrepancy'
  | 'totalRegister'
  | 'totalSystem'
> & {
  closing?: {
    comments?: string | null;
    banknotes?: Array<{
      ref: string;
      value: number;
      quantity: number | string | null;
    }>;
    banknotesTotal?: number;
    banknotesAmount?: number;
  };
};

const buildCloseCashCountPayload = (
  cashCount: CashCountRecord,
): CloseCashCountPayload => ({
  id: cashCount.id,
  totalCard: cashCount.totalCard,
  totalTransfer: cashCount.totalTransfer,
  totalCharged: cashCount.totalCharged,
  totalReceivables: cashCount.totalReceivables,
  totalDiscrepancy: cashCount.totalDiscrepancy,
  totalRegister: cashCount.totalRegister,
  totalSystem: cashCount.totalSystem,
  closing: {
    comments:
      typeof cashCount.closing?.comments === 'string'
        ? cashCount.closing.comments
        : null,
    banknotes: Array.isArray(cashCount.closing?.banknotes)
      ? cashCount.closing.banknotes.map((banknote) => ({
        ref: String(banknote?.ref ?? ''),
        value: Number(banknote?.value ?? 0),
        quantity: banknote?.quantity ?? 0,
      }))
      : [],
    banknotesTotal:
      typeof cashCount.closing?.banknotesTotal === 'number'
        ? cashCount.closing.banknotesTotal
        : undefined,
    banknotesAmount:
      typeof cashCount.closing?.banknotesAmount === 'number'
        ? cashCount.closing.banknotesAmount
        : undefined,
  },
});

const createSerializationError = (): Error & { code: string } => {
  const error = new Error(
    'Maximum call stack size exceeded (client payload serialization)',
  ) as Error & { code: string };
  error.code = 'client/serialization-error';
  return error;
};

const assertCallablePayloadSerializable = (payload: unknown): void => {
  try {
    JSON.stringify(payload);
  } catch {
    throw createSerializationError();
  }
};

export const fbCashCountClosed = async (
  user: UserIdentity | null | undefined,
  cashCount: CashCountRecord,
  employeeID: string,
  approvalEmployeeID: string,
  closingDate: TimestampLike,
): Promise<'success' | Error | null> => {
  const businessId = resolveUserIdentityBusinessId(user);
  if (!businessId || !cashCount?.id) {
    return null;
  }

  try {
    const { sessionToken } = getStoredSession();
    const clientBuildInfo = await getClientBuildInfo();
    const closeCashCountCallable = httpsCallable<
      {
        businessId: string;
        cashCountId: string;
        cashCount: CloseCashCountPayload;
        employeeID: string;
        approvalEmployeeID: string;
        closingDate: TimestampLike;
        sessionToken?: string;
        clientBuildId?: string;
        clientAppVersion?: string;
      },
      { ok: boolean }
    >(functions, 'closeCashCount');

    const requestPayload = {
      businessId,
      cashCountId: String(cashCount.id),
      cashCount: buildCloseCashCountPayload(cashCount),
      employeeID,
      approvalEmployeeID,
      closingDate,
      ...(sessionToken ? { sessionToken } : {}),
      ...clientBuildInfo,
    };

    assertCallablePayloadSerializable(requestPayload);
    const sanitizedPayload = JSON.parse(JSON.stringify(requestPayload));
    await closeCashCountCallable(sanitizedPayload);
    return 'success';
  } catch (error) {
    console.error('Error writing cash count closing document: ', error);
    return error as Error;
  }
};
