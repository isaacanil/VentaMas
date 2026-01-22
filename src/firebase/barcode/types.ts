export interface BarcodeSettings {
  companyPrefix?: string | null;
  companyPrefixLength?: number;
  itemReferenceLength?: number;
  name?: string;
  maxProducts?: number;
  createdAt?: string;
  updatedAt?: string;
  [key: string]: unknown;
}
