import type { DocumentReference } from 'firebase/firestore';

import { createFirebaseCallable } from '@/firebase/functions/callable';
import type { UserIdentity } from '@/types/users';
import { resolveUserIdentityBusinessId } from '@/utils/users/userIdentityAccess';

type AddInvoiceToOpenCashCountPayload = {
  businessId: string;
  invoiceId: string;
  invoicePath: string;
};

type AddInvoiceToOpenCashCountResult = {
  ok: boolean;
  businessId: string;
  cashCountId: string;
  invoiceId: string;
  alreadyLinked?: boolean;
};

const addInvoiceToOpenCashCountCallable = createFirebaseCallable<
  AddInvoiceToOpenCashCountPayload,
  AddInvoiceToOpenCashCountResult
>('addInvoiceToOpenCashCount');

export const fbAddBillToOpenCashCount = async (
  user: UserIdentity | null | undefined,
  invoiceRef: DocumentReference,
): Promise<string | void> => {
  const businessId = resolveUserIdentityBusinessId(user);
  if (!businessId || !invoiceRef?.id || !invoiceRef?.path) {
    return;
  }

  try {
    const result = await addInvoiceToOpenCashCountCallable({
      businessId,
      invoiceId: invoiceRef.id,
      invoicePath: invoiceRef.path,
    });

    if (result?.ok && result.cashCountId) {
      return result.cashCountId;
    }
  } catch (error) {
    console.error('Error al añadir la factura al cuadre: ', error);
  }
};
