import { Timestamp, arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord, CashCountState } from '@/utils/cashCount/types';

export const fbCashCountChangeState = async (
  cashCount: CashCountRecord,
  user: UserIdentity | null | undefined,
  state: CashCountState,
): Promise<'success' | Error | null> => {
  if (!user?.businessID) {
    return null;
  }
  const cashCountRef = doc(
    db,
    'businesses',
    user?.businessID,
    'cashCounts',
    cashCount.id as string,
  );
  try {
    if (
      user?.uid === cashCount?.opening?.employee?.id ||
      user.role === 'admin' ||
      user.role === 'manager'
    ) {
      await updateDoc(cashCountRef, {
        'cashCount.state': state,
        'cashCount.updatedAt': Timestamp.fromMillis(Date.now()),
        'cashCount.stateHistory': arrayUnion({
          state: state,
          timestamp: Timestamp.fromMillis(Date.now()),
          updatedBy: user?.uid,
        }),
      });
      return 'success';
    }
    throw new Error('User is not the employee who opened the cash count');
  } catch (error) {
    console.error('Error writing cash count closing document: ', error);
    return error as Error;
  }
};
