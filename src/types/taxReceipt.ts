export interface TaxReceiptUser {
  businessID?: string | null;
  uid?: string | null;
  id?: string | null;
  email?: string | null;
}

export interface TaxReceiptAuthorizationEntry {
  authorizationNumber: string;
  requestNumber: string;
  startSequence: string;
  endSequence: string;
  approvedQuantity: string;
  expirationDate: string;
  authorizationDate: string;
}

export const TAX_RECEIPT_DOCUMENT_FORMATS = [
  'traditional',
  'electronic',
] as const;

export type TaxReceiptDocumentFormat =
  (typeof TAX_RECEIPT_DOCUMENT_FORMATS)[number];

export interface TaxReceiptData {
  id?: string;
  name: string;
  type: string;
  serie?: string;
  series?: string;
  documentFormat?: TaxReceiptDocumentFormat;
  fiscalSeries?: string;
  fiscalType?: string;
  authorityStatus?: string | null;
  trackId?: string | null;
  sequence?: number | string;
  sequenceLength?: number;
  increase?: number;
  quantity?: number | string;
  disabled?: boolean;
  description?: string;
  authorizations?: TaxReceiptAuthorizationEntry[];
  createdAt?: unknown;
}

export interface TaxReceiptDocument {
  id?: string;
  data: TaxReceiptData;
}

export type TaxReceiptItem = TaxReceiptData | TaxReceiptDocument;

export interface TaxReceiptTemplate extends TaxReceiptData {
  sequenceLength: number;
  description?: string;
}

export interface TaxReceiptCountryTemplates {
  countryName: string;
  templates: TaxReceiptTemplate[];
}

export interface TaxReceiptSequenceInput {
  type?: string;
  serie?: string;
  sequence?: number | string;
  sequenceLength?: number;
}

export interface TaxReceiptFormValues extends TaxReceiptData {
  isActive?: boolean;
}

export interface TaxReceiptSequenceValidation {
  ok?: boolean;
  reason?: string;
  prefix?: string;
  nextDigits?: string;
  nextDigitsLength?: number;
  sequenceLength?: number;
  hasImmediateNextConflict?: boolean;
  hasCurrentConflict?: boolean;
  [key: string]: unknown;
}

export const TAX_RECEIPT_NUMERIC_FIELDS = [
  'sequence',
  'sequenceLength',
  'increase',
  'quantity',
] as const;

export type TaxReceiptNumericField =
  (typeof TAX_RECEIPT_NUMERIC_FIELDS)[number];
