import { collection, query, where, getDocs } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';

/**
 * Loads expenses associated with a specific cash count
 * @param {Object} user - The current user object
 * @param {string} cashCountId - The ID of the cash count to load expenses for
 * @returns {Object} - Object containing expenses count, array, and loading state
 */
export const fbLoadExpensesForCashCount = async (user, cashCountId) => {
  if (!user.businessID || !cashCountId) {
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
      user.businessID,
      'expenses',
    );

    // Query expenses that are associated with this cash count
    const q = query(
      expensesRef,
      where('expense.payment.cashRegister', '==', cashCountId),
    );

    const querySnapshot = await getDocs(q);

    // Process the expenses
    const expenses = [];
    querySnapshot.forEach((doc) => expenses.push(doc.data().expense));

    return {
      count: expenses.length,
      data: expenses,
      loading: false,
    };
  } catch (error) {
    console.error('Error loading expenses for cash count:', error);
    return {
      count: 0,
      data: [],
      loading: false,
      error: error.message,
    };
  }
};
