export interface ProviderInfo {
  id?: string;
  name?: string;
  rnc?: string;
  voucherType?: string;
  [key: string]: unknown;
}

export interface ProviderDataItem {
  provider: ProviderInfo;
}
