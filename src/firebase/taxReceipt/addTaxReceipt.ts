import {
  collection,
  doc,
  getDocs,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';

import type { TaxReceiptData, TaxReceiptUser } from '@/types/taxReceipt';
import { db } from '@/firebase/firebaseconfig'; // Asegúrate que la ruta sea correcta
import {
  getTaxReceiptDocumentId,
  getTaxReceiptIdentity,
  hasMatchingTaxReceiptIdentity,
  isActiveTaxReceiptData,
  normalizeTaxReceiptData,
} from '@/utils/taxReceipt';

/**
 * Creates a new tax receipt document in Firestore within a 'data' field.
 *
 * @async
 * @function addTaxReceipt
 * @param {object} user - The user object containing the businessID.
 * @param {object} data - The tax receipt data to add.
 * @throws {Error} Throws an error if the creation operation fails or inputs are invalid.
 * @returns {Promise<DocumentReference>} A promise that resolves with the DocumentReference of the newly created document.
 */
export const addTaxReceipt = async (
  user: TaxReceiptUser,
  data: TaxReceiptData,
) => {
  // Input validation
  if (!user?.businessID || typeof user?.businessID !== 'string') {
    throw new Error('Invalid or missing businessID provided.');
  }
  if (!data || typeof data !== 'object' || Object.keys(data).length === 0) {
    throw new Error('Invalid or empty data provided for creation.');
  }

  try {
    const receiptsCollectionRef = collection(
      db,
      'businesses',
      user.businessID,
      'taxReceipts',
    );
    const normalizedData = normalizeTaxReceiptData(data) as TaxReceiptData;
    const documentId = getTaxReceiptDocumentId(normalizedData);
    const identity = getTaxReceiptIdentity(normalizedData);
    const docRef = doc(receiptsCollectionRef, documentId);
    const receiptsSnapshot = await getDocs(receiptsCollectionRef);
    const duplicate = receiptsSnapshot.docs.find((receiptDoc) => {
      if (receiptDoc.id === documentId) return false;
      const existingData = receiptDoc.data()?.data as
        | Partial<TaxReceiptData>
        | undefined;
      return (
        isActiveTaxReceiptData(existingData) &&
        hasMatchingTaxReceiptIdentity(existingData, normalizedData)
      );
    });

    if (duplicate) {
      const duplicateData = duplicate.data()?.data as
        | Partial<TaxReceiptData>
        | undefined;
      const duplicateIdentity = getTaxReceiptIdentity(duplicateData);
      throw new Error(
        `Ya existe un comprobante activo con la misma identidad fiscal (${duplicateIdentity.fiscalKey || duplicateIdentity.name}).`,
      );
    }

    const result = await runTransaction(db, async (transaction) => {
      const existingTarget = await transaction.get(docRef);

      if (
        existingTarget.exists() &&
        isActiveTaxReceiptData(
          existingTarget.data()?.data as Partial<TaxReceiptData> | undefined,
        )
      ) {
        return docRef;
      }

      transaction.set(docRef, {
        data: {
          ...normalizedData,
          type: identity.type || normalizedData.type,
          serie: identity.serie || normalizedData.serie,
          id: documentId,
          disabled: normalizedData.disabled ?? false,
          createdAt: normalizedData.createdAt ?? serverTimestamp(),
        },
      });

      return docRef;
    });

    console.info(`Tax receipt created successfully`);
    return result; // Return the reference to the new or existing document
  } catch (error) {
    console.error('Error creating tax receipt:', error);
    const errorMessage =
      error instanceof Error ? error.message : 'Failed to create tax receipt.';
    throw new Error(errorMessage);
  }
};
