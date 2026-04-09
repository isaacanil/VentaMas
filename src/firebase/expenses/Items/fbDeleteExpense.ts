import { Timestamp, doc, updateDoc } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { Expense } from '@/utils/expenses/types';

export const fbDeleteExpense = async (
  user: UserIdentity | null | undefined,
  expense: Expense,
): Promise<void> => {
  try {
    if (!user?.businessID) throw new Error('No user or id provided');
    if (!expense?.id) throw new Error('No expense or expense id provided');

    const expenseRef = doc(
      db,
      'businesses',
      user.businessID,
      'expenses',
      expense.id,
    );

    await updateDoc(expenseRef, {
      'expense.dates.deletedAt': Timestamp.now(),
      'expense.dates.updatedAt': Timestamp.now(),
      'expense.status': 'deleted',
    });
  } catch (error) {
    throw new Error(`Error deleting expense: ${error}`);
  }
};
