import { createElectronicTaxReceiptCallable } from './callElectronicTaxReceipt';

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

const updateElectronicTaxReceiptConfigCallable =
  createElectronicTaxReceiptCallable<
    UpdateElectronicTaxReceiptConfigInput,
    UpdateElectronicTaxReceiptConfigResult
  >('updateElectronicTaxReceiptConfig');

export const fbUpdateElectronicTaxReceiptConfig = (
  input: UpdateElectronicTaxReceiptConfigInput,
): Promise<UpdateElectronicTaxReceiptConfigResult> =>
  updateElectronicTaxReceiptConfigCallable(input);
