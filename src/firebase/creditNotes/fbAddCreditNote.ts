import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { nanoid } from 'nanoid';

import { CREDIT_NOTE_STATUS } from '@/constants/creditNoteStatus';
import { db } from '@/firebase/firebaseconfig';
import { reserveCreditNoteNcf } from '@/firebase/taxReceipt/reserveCreditNoteNcf';
import { getNextID } from '@/firebase/Tools/getNextID';
import type {
  CreditNoteActor,
  CreditNoteCreateInput,
  CreditNoteRecord,
} from '@/types/creditNote';
import type { UserIdentity } from '@/types/users';

type CreditNoteUser = UserIdentity & {
  displayName?: string | null;
};

/**
 * Guarda una Nota de Crédito en Firestore bajo el negocio del usuario.
 * @param {Object} user - Objeto de usuario con businessID y uid.
 * @param {Object} creditNoteData - Datos propios de la nota de crédito.
 * @returns {Promise<Object>} - Los datos de la nota de crédito guardada.
 */
export const fbAddCreditNote = async (
  user: CreditNoteUser | null | undefined,
  creditNoteData: CreditNoteCreateInput,
): Promise<CreditNoteRecord> => {
  if (!user?.businessID) throw new Error('El usuario no tiene businessID');

  const ncf = (await reserveCreditNoteNcf({ businessId: user.businessID }))
    .ncfCode;

  if (!ncf) {
    throw new Error(
      'No se pudo generar el Comprobante Fiscal para la Nota de Crédito.',
    );
  }

  // Generar identificadores
  const id = nanoid();
  const numberID = await getNextID(user, 'lastCreditNoteId');

  // Ej: NC-2024-000001
  const year = new Date().getFullYear();
  const number = `NC-${year}-${String(numberID).padStart(6, '0')}`;

  const createdBy: CreditNoteActor = {
    uid: user?.uid,
    displayName: user?.displayName || user?.name || '',
  };

  const data: CreditNoteRecord = {
    ...creditNoteData,
    id,
    numberID,
    number,
    ncf,
    status: CREDIT_NOTE_STATUS.ISSUED,
    createdAt: Timestamp.now(),
    createdBy,
  };

  const creditNoteRef = doc(
    db,
    'businesses',
    user.businessID,
    'creditNotes',
    id,
  );
  await setDoc(creditNoteRef, data);

  return data;
};
