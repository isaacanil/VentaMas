import { Timestamp, doc, updateDoc } from 'firebase/firestore';

import { sanitizeFirebaseData } from '@/utils/firebase/sanitizeFirebaseData';
import { toTimestamp } from '@/utils/firebase/toTimestamp';
import { db } from '@/firebase/firebaseconfig';
import { fbDeleteImage } from '@/firebase/img/fbDeleteImage';
import { fbUploadFile } from '@/firebase/img/fbUploadFileAndGetURL';

// Función que se encarga de actualizar un gasto.
export const fbUpdateExpense = async (
  user,
  setLoading,
  expense,
  files,
  removedAttachments = [],
) => {
  try {
    setLoading({
      isOpen: true,
      message: 'Iniciando actualización del gasto...',
    });

    if (!user.businessID) {
      throw new Error('No businessID provided');
    }

    // Delete removed attachments from Firebase Storage if any
    if (removedAttachments.length > 0) {
      setLoading({
        isOpen: true,
        message: 'Eliminando archivos adjuntos...',
      });

      for (const file of removedAttachments) {
        const urlToDelete = file.url; // url es string
        if (urlToDelete) {
          await fbDeleteImage(urlToDelete);
        }
      }
    }

    let modifiedExpense = {
      ...expense,
      dates: {
        ...expense.dates,
        expenseDate: toTimestamp(expense.dates.expenseDate ?? Date.now()),
        createdAt: toTimestamp(expense.dates.createdAt ?? Date.now()),
        updatedAt: Timestamp.now(),
      },
    };

    // Process new file attachments if any
    if (files && files.length > 0) {
      setLoading({
        isOpen: true,
        message: 'Procesando archivos adjuntos...',
      });

      const uploadPromises = files.map((f) =>
        fbUploadFile(user, 'expensesReceiptImg', f.file),
      );

      const urls = await Promise.all(uploadPromises);
      // Create new attachments array with both existing remote files (correctly formatted)
      const existingAttachments = modifiedExpense.attachments || [];

      const newAttachments = files.map((file, index) => ({
        id: file.id,
        name: file.name,
        type: file.type,
        url: urls[index],
      }));

      // Add the newly uploaded files with the correct structure
      modifiedExpense.attachments = [...existingAttachments, ...newAttachments];
    }

    setLoading({
      isOpen: true,
      message: 'Sanitizando y actualizando gasto...',
    });

    // Sanitizar los datos antes de guardarlos
    const sanitizedExpense = sanitizeFirebaseData(modifiedExpense);

    const expenseRef = doc(
      db,
      'businesses',
      user.businessID,
      'expenses',
      sanitizedExpense.id,
    );
    await updateDoc(expenseRef, { expense: sanitizedExpense });

    setLoading({
      isOpen: false,
      message: '',
    });

    return true; // Indicate success
  } catch (error) {
    // Si ocurre algún error, lo arroja para que pueda ser manejado por la función que llama a fbUpdateExpense.
    console.error('Error updating expense:', error);
    setLoading({
      isOpen: false,
      message: '',
    });
    throw new Error('Error updating expense: ' + error);
  }
};
