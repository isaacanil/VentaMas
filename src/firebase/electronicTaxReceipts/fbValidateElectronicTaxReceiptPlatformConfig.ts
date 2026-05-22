import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

import type {
  ElectronicTaxReceiptReadinessCheck,
  ElectronicTaxReceiptReadinessStatus,
} from './fbValidateElectronicTaxReceiptConfig';

export interface ValidateElectronicTaxReceiptPlatformConfigInput {
  checkRemote?: boolean;
}

export interface ValidateElectronicTaxReceiptPlatformConfigResult {
  ok: boolean;
  status: ElectronicTaxReceiptReadinessStatus;
  checkedAt: string;
  runtime: {
    providerId: string;
    baseUrl: string | null;
    baseUrlConfigured: boolean;
    integrationInstanceCode: string | null;
    integrationInstanceConfigured: boolean;
    electronicPreparationEnabled: boolean;
    mode: 'shadow' | 'pilot' | 'required';
    configSource: 'firestore' | 'env';
    tokenEnvName: string;
    tokenConfiguredAsSecret: boolean;
    timeoutMs: number;
  };
  checks: ElectronicTaxReceiptReadinessCheck[];
  remote: {
    ok: boolean;
    status: number | null;
    url: string;
    reason: string | null;
  } | null;
}

export const fbValidateElectronicTaxReceiptPlatformConfig = async (
  input: ValidateElectronicTaxReceiptPlatformConfigInput = {},
): Promise<ValidateElectronicTaxReceiptPlatformConfigResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    ValidateElectronicTaxReceiptPlatformConfigInput & { sessionToken?: string },
    ValidateElectronicTaxReceiptPlatformConfigResult
  >(functions, 'validateElectronicTaxReceiptPlatformConfig');

  const response = await callable({
    ...input,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return response.data;
};
