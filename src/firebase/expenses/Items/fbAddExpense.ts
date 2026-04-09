import { Timestamp, doc, runTransaction } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import { fbDeleteImage } from '@/firebase/img/fbDeleteImage';
import { fbUploadFile } from '@/firebase/img/fbUploadFileAndGetURL';
import { getNextID } from '@/firebase/Tools/getNextID';
import type { UserIdentity } from '@/types/users';
import { sanitizeFirebaseData } from '@/utils/firebase/sanitizeFirebaseData';
import { toTimestamp } from '@/utils/firebase/toTimestamp';
import {
  resolveMonetarySnapshotForBusiness,
} from '@/utils/accounting/monetary';
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

const safeNumber = (value: unknown): number | null => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const fbAddExpense = async (
  user: UserIdentity | null | undefined,
  setLoading: SetLoading,
  expense: Expense,
  receiptImage?: ExpenseAttachmentInput[],
): Promise<boolean> => {
  const uploadedAttachmentUrls: string[] = [];

  try {
    setLoading({
      isOpen: true,
      message: 'Iniciando proceso de registro de gasto...',
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
        expenseDate: toTimestamp(expense.dates?.expenseDate),
        createdAt: Timestamp.now(),
      },
      status: 'active',
      id: nanoid(),
    };
    const pilotMonetarySnapshot = await resolveMonetarySnapshotForBusiness({
      businessId: user.businessID,
      monetary: expense.monetary,
      source: expense,
      totals: {
        total: safeNumber(expense.amount),
        paid: safeNumber(expense.amount),
        balance: 0,
      },
      capturedBy: user.uid,
      operationType: 'expense',
    });
    if (pilotMonetarySnapshot) {
      modifiedExpense.monetary = pilotMonetarySnapshot;
    }

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
      const attachments: ExpenseAttachment[] = receiptImage.map(
        (file, index) => ({
          id: file.id,
          name: file.name,
          type: file.type,
          url: urls[index],
        }),
      );

      uploadedAttachmentUrls.push(
        ...urls
          .map((uploadResult) => uploadResult?.url)
          .filter((url): url is string => typeof url === 'string' && url.length > 0),
      );
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

    await runTransaction(db, async (transaction) => {
      await assertExpenseAccountingPeriodOpenInTransaction({
        transaction,
        businessId: user.businessID,
        expense: data,
      });

      const numberId = await getNextID(user, 'lastExpensesId', 1, transaction);
      transaction.set(expenseRef, {
        expense: {
          ...data,
          numberId,
        },
      });
    });

    setLoading({ isOpen: false, message: '' });

    return true; // Indicate success
  } catch (error) {
    console.error('Error adding expense: ', error);

    if (uploadedAttachmentUrls.length > 0) {
      await Promise.allSettled(
        uploadedAttachmentUrls.map((url) => fbDeleteImage(url)),
      );
    }

    setLoading({ isOpen: false, message: '' });
    throw error instanceof Error
      ? error
      : new Error('No se pudo registrar el gasto.');
  }
};
