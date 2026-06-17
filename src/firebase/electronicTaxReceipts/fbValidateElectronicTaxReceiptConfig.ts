import { createElectronicTaxReceiptCallable } from './callElectronicTaxReceipt';
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

const validateElectronicTaxReceiptConfigCallable =
  createElectronicTaxReceiptCallable<
    ValidateElectronicTaxReceiptConfigInput,
    ValidateElectronicTaxReceiptConfigResult
  >('validateElectronicTaxReceiptConfig');

export const fbValidateElectronicTaxReceiptConfig = (
  input: ValidateElectronicTaxReceiptConfigInput,
): Promise<ValidateElectronicTaxReceiptConfigResult> =>
  validateElectronicTaxReceiptConfigCallable(input);
