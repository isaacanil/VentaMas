import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/firebase/firebaseconfig';
import type { UserIdentity } from '@/types/users';
import type { CashCountExpense } from '@/utils/cashCount/types';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

interface CashCountExpenseResult {
  count: number;
  data: CashCountExpense[];
  loading: boolean;
  error?: string;
}

/**
 * Loads expenses associated with a specific cash count
 * @param {Object} user - The current user object
 * @param {string} cashCountId - The ID of the cash count to load expenses for
 * @returns {Object} - Object containing expenses count, array, and loading state
 */
export const fbLoadExpensesForCashCount = async (
  user: UserIdentity | null | undefined,
  cashCountId?: string | null,
): Promise<CashCountExpenseResult> => {
  const businessId = resolveUserIdentityBusinessId(user);
  if (!businessId || !cashCountId) {
    console.error('Missing required parameters for loading expenses');
    return {
      count: 0,
      data: [],
      loading: false,
    };
  }

  try {
    // Reference to the expenses collection
    const expensesRef = collection(
      db,
      'businesses',
      businessId,
      'expenses',
    );

    // Query expenses that are associated with this cash count
    const q = query(
      expensesRef,
      where('expense.payment.cashRegister', '==', cashCountId),
    );

    const querySnapshot = await getDocs(q);

    // Process the expenses
    const expenses: CashCountExpense[] = [];
    querySnapshot.forEach((doc) =>
      expenses.push(doc.data().expense as CashCountExpense),
    );

    return {
      count: expenses.length,
      data: expenses,
      loading: false,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('Error loading expenses for cash count:', error);
    return {
      count: 0,
      data: [],
      loading: false,
      error: message,
    };
  }
};
