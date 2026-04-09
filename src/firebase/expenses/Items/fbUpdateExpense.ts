import { Timestamp, doc, runTransaction } from 'firebase/firestore';

import { db } from '@/firebase/firebaseconfig';
import { fbDeleteImage } from '@/firebase/img/fbDeleteImage';
import { fbUploadFile } from '@/firebase/img/fbUploadFileAndGetURL';
import type { UserIdentity } from '@/types/users';
import { sanitizeFirebaseData } from '@/utils/firebase/sanitizeFirebaseData';
import { toTimestamp } from '@/utils/firebase/toTimestamp';
import { normalizeExpensePayment } from '@/utils/expenses/payment';
import type {
  Expense,
  ExpenseAttachment,
  ExpenseAttachmentInput,
} from '@/utils/expenses/types';

import {
  assertExpenseAccountingPeriodOpen,
  assertExpenseAccountingPeriodOpenInTransaction,
} from './utils/expenseAccountingPeriod';

interface LoadingState {
  isOpen: boolean;
  message: string;
}

type SetLoading = (state: LoadingState) => void;

// Función que se encarga de actualizar un gasto.
export const fbUpdateExpense = async (
  user: UserIdentity | null | undefined,
  setLoading: SetLoading,
  expense: Expense,
  files: ExpenseAttachmentInput[] = [],
  removedAttachments: ExpenseAttachment[] = [],
): Promise<boolean> => {
  const uploadedAttachmentUrls: string[] = [];

  try {
    setLoading({
      isOpen: true,
      message: 'Iniciando actualización del gasto...',
    });

    if (!user?.businessID) {
      throw new Error('No businessID provided');
    }

    await assertExpenseAccountingPeriodOpen({
      businessId: user.businessID,
      expense,
    });

    const modifiedExpense: Expense = {
      ...expense,
      payment: normalizeExpensePayment(expense.payment),
      dates: {
        ...expense.dates,
        expenseDate: toTimestamp(expense.dates?.expenseDate ?? Date.now()),
        createdAt: toTimestamp(expense.dates?.createdAt ?? Date.now()),
        updatedAt: Timestamp.now(),
      },
    };

    // Process new file attachments if any
    if (files.length > 0) {
      setLoading({
        isOpen: true,
        message: 'Procesando archivos adjuntos...',
      });

      const uploadPromises = files.map((file) =>
        fbUploadFile(user, 'expensesReceiptImg', file.file),
      );

      const urls = await Promise.all(uploadPromises);
      // Create new attachments array with both existing remote files (correctly formatted)
      const existingAttachments = Array.isArray(modifiedExpense.attachments)
        ? modifiedExpense.attachments
        : [];

      const newAttachments: ExpenseAttachment[] = files.map((file, index) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        url: urls[index],
      }));

      uploadedAttachmentUrls.push(
        ...urls
          .map((uploadResult) => uploadResult?.url)
          .filter((url): url is string => typeof url === 'string' && url.length > 0),
      );
      // Add the newly uploaded files with the correct structure
      modifiedExpense.attachments = [...existingAttachments, ...newAttachments];
    }

    setLoading({
      isOpen: true,
      message: 'Sanitizando y actualizando gasto...',
    });

    // Sanitizar los datos antes de guardarlos
    const sanitizedExpense = sanitizeFirebaseData(modifiedExpense) as Expense;

    const expenseRef = doc(
      db,
      'businesses',
      user.businessID,
      'expenses',
      sanitizedExpense.id,
    );
    await runTransaction(db, async (transaction) => {
      await assertExpenseAccountingPeriodOpenInTransaction({
        transaction,
        businessId: user.businessID,
        expense: sanitizedExpense,
      });
      transaction.update(expenseRef, { expense: sanitizedExpense });
    });

    if (removedAttachments.length > 0) {
      setLoading({
        isOpen: true,
        message: 'Eliminando archivos adjuntos...',
      });

      await Promise.allSettled(
        removedAttachments.map(async (file) => {
          const urlToDelete =
            typeof file.url === 'string' ? file.url : file.url?.url;
          if (urlToDelete) {
            await fbDeleteImage(urlToDelete);
          }
        }),
      );
    }

    setLoading({
      isOpen: false,
      message: '',
    });

    return true; // Indicate success
  } catch (error) {
    // Si ocurre algún error, lo arroja para que pueda ser manejado por la función que llama a fbUpdateExpense.
    console.error('Error updating expense:', error);

    if (uploadedAttachmentUrls.length > 0) {
      await Promise.allSettled(
        uploadedAttachmentUrls.map((url) => fbDeleteImage(url)),
      );
    }

    setLoading({
      isOpen: false,
      message: '',
    });
    throw error instanceof Error
      ? error
      : new Error('No se pudo actualizar el gasto.');
  }
};
