import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

export type ElectronicTaxReceiptMode = 'shadow' | 'pilot' | 'required';
export type ElectronicTaxReceiptConfigScope =
  | 'developer-provisioning'
  | 'business-taxpayer';

export interface UpdateElectronicTaxReceiptConfigInput {
  businessId: string;
  scope?: ElectronicTaxReceiptConfigScope;
  electronicModelEnabled?: boolean;
  electronicTransportEnabled?: boolean;
  mode?: ElectronicTaxReceiptMode;
  integrationInstanceCode?: string | null;
  taxpayerCode?: string | null;
}

export interface UpdateElectronicTaxReceiptConfigResult {
  ok: boolean;
  businessId: string;
  electronicModelEnabled: boolean;
  electronicTransportEnabled: boolean;
  providerConfig: Record<string, unknown>;
}

export const fbUpdateElectronicTaxReceiptConfig = async (
  input: UpdateElectronicTaxReceiptConfigInput,
): Promise<UpdateElectronicTaxReceiptConfigResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    UpdateElectronicTaxReceiptConfigInput & { sessionToken?: string },
    UpdateElectronicTaxReceiptConfigResult
  >(functions, 'updateElectronicTaxReceiptConfig');

  const response = await callable({
    ...input,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return response.data;
};
