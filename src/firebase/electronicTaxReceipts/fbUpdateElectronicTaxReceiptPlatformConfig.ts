import { createElectronicTaxReceiptCallable } from './callElectronicTaxReceipt';
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

const updateElectronicTaxReceiptPlatformConfigCallable =
  createElectronicTaxReceiptCallable<
    UpdateElectronicTaxReceiptPlatformConfigInput,
    UpdateElectronicTaxReceiptPlatformConfigResult
  >('updateElectronicTaxReceiptPlatformConfig');

export const fbUpdateElectronicTaxReceiptPlatformConfig = (
  input: UpdateElectronicTaxReceiptPlatformConfigInput,
): Promise<UpdateElectronicTaxReceiptPlatformConfigResult> =>
  updateElectronicTaxReceiptPlatformConfigCallable(input);
