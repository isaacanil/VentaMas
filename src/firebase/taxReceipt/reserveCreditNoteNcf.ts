import { httpsCallable } from 'firebase/functions';

import { functions } from '@/firebase/firebaseconfig';

const callable = httpsCallable(functions, 'reserveCreditNoteNcf');

type ReserveCreditNoteNcfPayload = {
  businessId: string;
};

type ReserveCreditNoteNcfResult = {
  ok: boolean;
  ncfCode: string;
  usageId: string;
  engine: string;
};

export const reserveCreditNoteNcf = async ({
  businessId,
}: ReserveCreditNoteNcfPayload): Promise<ReserveCreditNoteNcfResult> => {
  if (!businessId?.trim()) {
    throw new Error(
      'businessId es requerido para reservar el NCF de nota de crédito.',
    );
  }

  const response = await callable({ businessId: businessId.trim() });
  return response.data as ReserveCreditNoteNcfResult;
};
