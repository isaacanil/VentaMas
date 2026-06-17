import { createElectronicTaxReceiptCallable } from './callElectronicTaxReceipt';
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

const validateElectronicTaxReceiptPlatformConfigCallable =
  createElectronicTaxReceiptCallable<
    ValidateElectronicTaxReceiptPlatformConfigInput,
    ValidateElectronicTaxReceiptPlatformConfigResult
  >('validateElectronicTaxReceiptPlatformConfig');

export const fbValidateElectronicTaxReceiptPlatformConfig = (
  input: ValidateElectronicTaxReceiptPlatformConfigInput = {},
): Promise<ValidateElectronicTaxReceiptPlatformConfigResult> =>
  validateElectronicTaxReceiptPlatformConfigCallable(input);
