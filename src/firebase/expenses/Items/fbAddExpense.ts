import { Timestamp, doc, setDoc } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import { fbUploadFile } from '@/firebase/img/fbUploadFileAndGetURL';
import { getNextID } from '@/firebase/Tools/getNextID';
import type { UserIdentity } from '@/types/users';
import { sanitizeFirebaseData } from '@/utils/firebase/sanitizeFirebaseData';
import { toTimestamp } from '@/utils/firebase/toTimestamp';
import type { Expense, ExpenseAttachment, ExpenseAttachmentInput } from '@/utils/expenses/types';

interface LoadingState {
  isOpen: boolean;
  message: string;
}

type SetLoading = (state: LoadingState) => void;

export const fbAddExpense = async (
  user: UserIdentity | null | undefined,
  setLoading: SetLoading,
  expense: Expense,
  receiptImage?: ExpenseAttachmentInput[],
): Promise<boolean> => {
  try {
    setLoading({
      isOpen: true,
      message: 'Iniciando proceso de registro de gasto...',
    });

    if (!user?.businessID) {
      throw new Error('No businessID provided');
    }

    const numberId = await getNextID(user, 'lastExpensesId');
    const modifiedExpense: Expense = {
      ...expense,
      dates: {
        ...expense.dates,
        expenseDate: toTimestamp(expense.dates?.expenseDate),
        createdAt: Timestamp.now(),
      },
      status: 'active',
      numberId,
      id: nanoid(),
    };

    setLoading({
      isOpen: true,
      message: 'Subiendo imagen del recibo al servidor...',
    });

    if (Array.isArray(receiptImage) && receiptImage.length > 0) {
      const uploadPromises = receiptImage.map((file) =>
        fbUploadFile(user, 'expensesReceiptImg', file.file),
      );
      const urls = await Promise.all(uploadPromises);

      // Update attachment URLs in the expense object
      const attachments: ExpenseAttachment[] = receiptImage.map((file, index) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        url: urls[index],
      }));

      modifiedExpense.attachments = attachments;
    }

    setLoading({
      isOpen: true,
      message: 'Sanitizando y registrando detalles del gasto...',
    });

    // Sanitizar los datos antes de guardarlos
    const sanitizedExpense = sanitizeFirebaseData(modifiedExpense) as Expense;

    const data = {
      ...sanitizedExpense,
      createdBy: user.uid,
    };

    const expenseRef = doc(
      db,
      'businesses',
      user.businessID,
      'expenses',
      sanitizedExpense.id,
    );

    await setDoc(expenseRef, { expense: data });

    setLoading({ isOpen: false, message: '' });

    return true; // Indicate success
  } catch (error) {
    console.error('Error adding expense: ', error);
    setLoading({ isOpen: false, message: '' });
    throw error; // Throw the error so it can be caught by the caller
  }
};
