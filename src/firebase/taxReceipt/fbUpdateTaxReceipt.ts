import { collection, doc, writeBatch } from 'firebase/firestore';

import type { TaxReceiptDocument, TaxReceiptUser } from '@/types/taxReceipt';
import { db } from '@/firebase/firebaseconfig';
import {
  getTaxReceiptDocumentId,
  hasMatchingTaxReceiptIdentity,
  isActiveTaxReceiptData,
  normalizeTaxReceiptData,
} from '@/utils/taxReceipt';

export const fbUpdateTaxReceipt = async (
  user: TaxReceiptUser,
  taxReceiptArray: TaxReceiptDocument[],
) => {
  if (!user || !user?.businessID) return;

  try {
    const { businessID } = user;
    const taxReceiptsRef = collection(
      db,
      'businesses',
      businessID,
      'taxReceipts',
    );
    const batch = writeBatch(db);

    const activeReceiptsToWrite: TaxReceiptDocument[] = [];

    // Para cada comprobante en el array
    for (const receipt of taxReceiptArray) {
      if (receipt && receipt.data) {
        const normalizedData = normalizeTaxReceiptData(
          receipt.data,
        ) as TaxReceiptDocument['data'];

        if (
          isActiveTaxReceiptData(normalizedData) &&
          activeReceiptsToWrite.some((existingReceipt) =>
            hasMatchingTaxReceiptIdentity(existingReceipt.data, normalizedData),
          )
        ) {
          throw new Error(
            'Hay comprobantes fiscales activos duplicados. Corrige la configuración antes de guardar.',
          );
        }

        if (isActiveTaxReceiptData(normalizedData)) {
          activeReceiptsToWrite.push({
            ...receipt,
            data: normalizedData,
          });
        }

        const receiptId =
          normalizedData.id ?? getTaxReceiptDocumentId(normalizedData);
        const taxReceiptRef = doc(taxReceiptsRef, receiptId);

        // Establecer los datos del comprobante
        batch.set(taxReceiptRef, {
          data: {
            ...normalizedData,
            id: receiptId, // Asegurar que el ID siempre apunte al documento escrito
          },
        });
      }
    }

    // Confirmar la transacción por lotes
    await batch.commit();
    console.info('Tax receipts updated successfully');
  } catch (error) {
    console.error('Error al actualizar los comprobantes fiscales:', error);
    throw error;
  }
};
