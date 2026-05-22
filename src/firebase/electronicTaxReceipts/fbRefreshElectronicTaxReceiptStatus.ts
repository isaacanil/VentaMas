import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';
import type { ElectronicTaxReceiptSnapshot } from '@/types/invoice';

export interface RefreshElectronicTaxReceiptStatusInput {
  businessId: string;
  invoiceId: string;
  refreshRemote?: boolean;
}

export interface RefreshElectronicTaxReceiptStatusResult {
  ok: boolean;
  businessId: string;
  invoiceId: string;
  submissionId: string;
  electronicTaxReceipt: ElectronicTaxReceiptSnapshot;
}

export const fbRefreshElectronicTaxReceiptStatus = async (
  input: RefreshElectronicTaxReceiptStatusInput,
): Promise<RefreshElectronicTaxReceiptStatusResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    RefreshElectronicTaxReceiptStatusInput & { sessionToken?: string },
    RefreshElectronicTaxReceiptStatusResult
  >(functions, 'refreshElectronicTaxReceiptStatus');

  const response = await callable({
    ...input,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return response.data;
};
