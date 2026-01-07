import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';
import { db } from '@/firebase/firebaseconfig';
import { getNextID } from '@/firebase/Tools/getNextID';
import { toMillis } from '@/utils/date/toMillis';
import type { UserIdentity } from '@/types/users';
import type { CashCountRecord } from '@/utils/cashCount/types';
import type { TimestampLike } from '@/utils/date/types';

export const fbCashCountOpening = async (
  user: UserIdentity | null | undefined,
  cashCount: CashCountRecord,
  employeeID: string,
  approvalEmployeeID: string,
  openingDate: TimestampLike,
): Promise<'success' | Error | null> => {
  if (!user?.businessID) {
    return null;
  }

  const userRefPath = doc(db, 'users', employeeID);
  const approvalEmployeeRefPath = doc(db, 'users', approvalEmployeeID);
  const id = nanoid(10);
  const incrementNumber = await getNextID(user, 'lastCashCountId');

  const updatedCashCount: CashCountRecord = {
    ...cashCount,
    id,
    incrementNumber,
  };

  const cashCountRef = doc(
    db,
    'businesses',
    user?.businessID,
    'cashCounts',
    id,
  );

  try {
    const dateMillis = toMillis(openingDate) ?? Date.now();
    await setDoc(cashCountRef, {
      cashCount: {
        ...updatedCashCount,
        createdAt: Timestamp.fromMillis(Date.now()),
        updatedAt: Timestamp.fromMillis(Date.now()),
        state: 'open',
        opening: {
          ...updatedCashCount.opening,
          employee: userRefPath,
          approvalEmployee: approvalEmployeeRefPath,
          initialized: true,
          date: Timestamp.fromMillis(dateMillis),
        },
      },
    });
    return 'success';
  } catch (error) {
    console.error('Error writing cash count opening document: ', error);
    return error as Error;
  }
};
