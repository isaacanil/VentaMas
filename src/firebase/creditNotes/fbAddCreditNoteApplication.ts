import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { db } from '@/firebase/firebaseconfig';
import type {
  CreditNoteApplicationInput,
  CreditNoteApplicationRecord,
  CreditNoteActor,
} from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';

type CreditNoteUser = UserIdentity & {
  displayName?: string | null;
};

/**
 * Registra la aplicación de una nota de crédito en una factura
 * @param {Object} user - Usuario con businessID
 * @param {Object} applicationData - Datos de la aplicación
 * @param {string} applicationData.creditNoteId - ID de la nota de crédito
 * @param {string} applicationData.creditNoteNcf - NCF de la nota de crédito
 * @param {string} applicationData.invoiceId - ID de la factura donde se aplica
 * @param {string} applicationData.invoiceNcf - NCF de la factura donde se aplica
 * @param {string} applicationData.invoiceNumber - Número de la factura donde se aplica
 * @param {string} applicationData.clientId - ID del cliente
 * @param {number} applicationData.amountApplied - Monto aplicado
 * @param {number} applicationData.previousBalance - Saldo anterior de la nota
 * @param {number} applicationData.newBalance - Nuevo saldo de la nota
 * @returns {Promise<Object>} - Los datos de la aplicación guardada
 */
export const fbAddCreditNoteApplication = async (
  user: CreditNoteUser | null | undefined,
  applicationData: CreditNoteApplicationInput,
): Promise<CreditNoteApplicationRecord> => {
  if (!user?.businessID) throw new Error('Usuario sin businessID');

  const id = nanoid();

  const appliedBy: CreditNoteActor = {
    uid: user.uid,
    displayName: user.displayName || user.name || '',
  };

  const data: CreditNoteApplicationRecord = {
    id,
    ...applicationData,
    appliedAt: Timestamp.now(),
    appliedBy,
    createdAt: Timestamp.now(),
  };

  const applicationRef = doc(
    db,
    'businesses',
    user.businessID,
    'creditNoteApplications',
    id,
  );
  await setDoc(applicationRef, data);

  return data;
};
