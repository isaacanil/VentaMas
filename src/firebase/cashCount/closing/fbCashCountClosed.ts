import { Timestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import { toMillis } from '@/utils/date/toMillis';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord } from '@/utils/cashCount/types';
import type { TimestampLike } from '@/utils/date/types';

export const fbCashCountClosed = async (
  user: UserIdentity | null | undefined,
  cashCount: CashCountRecord,
  employeeID: string,
  approvalEmployeeID: string,
  closingDate: TimestampLike,
): Promise<'success' | Error | null> => {
  if (!user?.businessID) {
    return null;
  }
  const userRefPath = doc(db, 'users', employeeID);
  const approvalEmployeeRefPath = doc(db, 'users', approvalEmployeeID);
  const cashCountRef = doc(
    db,
    'businesses',
    user?.businessID,
    'cashCounts',
    cashCount.id as string,
  );

  try {
    const closingMillis = toMillis(closingDate) ?? Date.now();
    await updateDoc(cashCountRef, {
      'cashCount.state': 'closed',
      'cashCount.closing': {
        ...cashCount.closing,
        employee: userRefPath,
        approvalEmployee: approvalEmployeeRefPath,
        initialized: true,
        date: Timestamp.fromMillis(closingMillis),
      },
      'cashCount.totalCard': cashCount?.totalCard ?? 0,
      'cashCount.totalTransfer': cashCount?.totalTransfer ?? 0,
      'cashCount.totalCharged': cashCount?.totalCharged ?? 0,
      'cashCount.totalReceivables': cashCount?.totalReceivables ?? 0,
      'cashCount.totalDiscrepancy': cashCount?.totalDiscrepancy ?? 0,
      'cashCount.totalRegister': cashCount?.totalRegister ?? 0,
      'cashCount.totalSystem': cashCount?.totalSystem ?? 0,
    });
    return 'success';
  } catch (error) {
    console.error('Error writing cash count closing document: ', error);
    return error as Error;
  }
};
