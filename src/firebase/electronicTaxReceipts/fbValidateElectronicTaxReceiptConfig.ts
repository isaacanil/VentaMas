import { httpsCallable } from 'firebase/functions';

import { getStoredSession } from '@/firebase/Auth/fbAuthV2/sessionClient';
import { functions } from '@/firebase/firebaseconfig';

import type {
  ElectronicTaxReceiptConfigScope,
  ElectronicTaxReceiptMode,
} from './fbUpdateElectronicTaxReceiptConfig';

export type ElectronicTaxReceiptReadinessStatus =
  | 'inactive'
  | 'shadow_ready'
  | 'ready'
  | 'blocked';

export type ElectronicTaxReceiptReadinessCheckStatus =
  | 'passed'
  | 'warning'
  | 'blocked'
  | 'inactive';

export interface ElectronicTaxReceiptReadinessCheck {
  key: string;
  label: string;
  status: ElectronicTaxReceiptReadinessCheckStatus;
  detail: string | null;
}

export interface ValidateElectronicTaxReceiptConfigInput {
  businessId: string;
  scope?: ElectronicTaxReceiptConfigScope;
  checkRemote?: boolean;
  electronicModelEnabled?: boolean;
  electronicTransportEnabled?: boolean;
  mode?: ElectronicTaxReceiptMode;
  integrationInstanceCode?: string | null;
  taxpayerCode?: string | null;
}

export interface ValidateElectronicTaxReceiptConfigResult {
  ok: boolean;
  businessId: string;
  status: ElectronicTaxReceiptReadinessStatus;
  checkedDraft: boolean;
  checkedAt: string;
  electronicModelEnabled: boolean;
  electronicTransportEnabled: boolean;
  issues: string[];
  issueLabels: string[];
  checks: ElectronicTaxReceiptReadinessCheck[];
  providerConfig: Record<string, unknown>;
  remote: {
    ok: boolean;
    status: number | null;
    url?: string | null;
    reason: string | null;
  } | null;
}

export const fbValidateElectronicTaxReceiptConfig = async (
  input: ValidateElectronicTaxReceiptConfigInput,
): Promise<ValidateElectronicTaxReceiptConfigResult> => {
  const { sessionToken } = getStoredSession();
  const callable = httpsCallable<
    ValidateElectronicTaxReceiptConfigInput & { sessionToken?: string },
    ValidateElectronicTaxReceiptConfigResult
  >(functions, 'validateElectronicTaxReceiptConfig');

  const response = await callable({
    ...input,
    ...(sessionToken ? { sessionToken } : {}),
  });

  return response.data;
};
