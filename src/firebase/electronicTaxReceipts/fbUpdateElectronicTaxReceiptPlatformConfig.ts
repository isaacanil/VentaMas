import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

import type { ValidateElectronicTaxReceiptPlatformConfigResult } from './fbValidateElectronicTaxReceiptPlatformConfig';

export interface UpdateElectronicTaxReceiptPlatformConfigInput {
  baseUrl?: string | null;
  integrationInstanceCode?: string | null;
  electronicModelEnabled: boolean;
  mode: 'shadow' | 'pilot' | 'required';
  timeoutMs?: number | null;
  checkRemote?: boolean;
}

export interface UpdateElectronicTaxReceiptPlatformConfigResult {
  ok: boolean;
  checkedAt: string;
  runtime: ValidateElectronicTaxReceiptPlatformConfigResult['runtime'];
  remote: ValidateElectronicTaxReceiptPlatformConfigResult['remote'];
}

export const fbUpdateElectronicTaxReceiptPlatformConfig = async (
  input: UpdateElectronicTaxReceiptPlatformConfigInput,
): Promise<UpdateElectronicTaxReceiptPlatformConfigResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    UpdateElectronicTaxReceiptPlatformConfigInput & { sessionToken?: string },
    UpdateElectronicTaxReceiptPlatformConfigResult
  >(functions, 'updateElectronicTaxReceiptPlatformConfig');

  const response = await callable({
    ...input,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return response.data;
};
