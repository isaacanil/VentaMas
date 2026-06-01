import { createFirebaseCallable } from '@/firebase/functions/callable';

type ReserveCreditNoteNcfPayload = {
  businessId: string;
};

type ReserveCreditNoteNcfResult = {
  ok: boolean;
  ncfCode: string;
  usageId: string;
  engine: string;
};

const reserveCreditNoteNcfCallable = createFirebaseCallable<
  ReserveCreditNoteNcfPayload,
  ReserveCreditNoteNcfResult
>('reserveCreditNoteNcf');

export const reserveCreditNoteNcf = async ({
  businessId,
}: ReserveCreditNoteNcfPayload): Promise<ReserveCreditNoteNcfResult> => {
  if (!businessId?.trim()) {
    throw new Error(
      'businessId es requerido para reservar el NCF de nota de crédito.',
    );
  }

  return reserveCreditNoteNcfCallable({ businessId: businessId.trim() });
};
