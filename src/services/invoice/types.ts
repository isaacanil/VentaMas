import type { InvoiceData } from '@/types/invoice';
import type { UserIdentity } from '@/types/users';

export type UnknownRecord = Record<string, unknown>;

export interface UserIdentityLike {
  uid?: string | null;
  id?: string | null;
  userId?: string | null;
  user_id?: string | null;
  uuid?: string | null;
  businessID?: string | null;
  businessId?: string | null;
  business?: { id?: string | null; businessID?: string | null } | null;
}

export interface NormalizedUser {
  uid: string | null;
  businessID: string | null;
}

export interface InvoiceCartProduct extends UnknownRecord {
  productStockId?: string | null;
  batchId?: string | null;
}

export interface InvoiceCart extends UnknownRecord {
  products?: InvoiceCartProduct[];
  isAddedToReceivables?: boolean;
  preorderDetails?: UnknownRecord | null;
}

export interface InvoiceReceivablePayload extends UnknownRecord {
  createdAt?: number;
  updatedAt?: number;
  paymentDate?: number | null;
  lastPaymentDate?: number | null;
}

export interface InvoiceNcfPayload {
  enabled?: boolean;
  type?: string | null;
}

export interface InvoiceRequestParams {
  user?: UserIdentity | UserIdentityLike | null;
  userId?: string | null;
  business?: { id?: string | null; businessID?: string | null } | null;
  businessId?: string | null;
  cart?: InvoiceCart | null;
  client?: UnknownRecord | null;
  accountsReceivable?: InvoiceReceivablePayload | UnknownRecord | null;
  insuranceAR?: InvoiceReceivablePayload | UnknownRecord | null;
  insuranceAuth?: UnknownRecord | null;
  insuranceEnabled?: boolean;
  taxReceiptEnabled?: boolean;
  ncfType?: string | null;
  ncf?: InvoiceNcfPayload | null;
  dueDate?: number | string | null;
  invoiceComment?: string | null;
  insurance?: UnknownRecord | null;
  preorder?: UnknownRecord | null;
  idempotencyKey?: string;
  isTestMode?: boolean;
}

export interface InvoiceRequestPayload extends UnknownRecord {
  idempotencyKey: string;
  businessId: string;
  userId: string;
  cart: InvoiceCart | null;
  client?: UnknownRecord | null;
  accountsReceivable?: InvoiceReceivablePayload | null;
  insuranceAR?: InvoiceReceivablePayload | null;
  insuranceAuth?: UnknownRecord | null;
  insuranceEnabled: boolean;
  taxReceiptEnabled: boolean;
  ncfType?: string | null;
  dueDate?: number | null;
  invoiceComment?: string | null;
  insurance?: UnknownRecord | null;
  preorder?: UnknownRecord | null;
  ncf?: InvoiceNcfPayload;
  isTestMode?: boolean;
  user?: NormalizedUser;
}

export interface InvoiceSubmitResponse extends UnknownRecord {
  invoiceId?: string;
  status?: string;
  reused?: boolean;
}

export interface InvoiceSubmitResult extends InvoiceSubmitResponse {
  idempotencyKey: string;
  businessId: string;
  userId: string;
}

export interface InvoiceWaitResult {
  invoice: InvoiceData | null;
  canonical: UnknownRecord | null;
  invoiceMeta: UnknownRecord | null;
}

export interface InvoiceAttemptResult extends InvoiceWaitResult {
  invoiceId: string;
  status: string;
  reused: boolean;
  idempotencyKey: string | null;
  attempt: string;
}

export interface InvoiceProcessParams extends InvoiceRequestParams {
  signal?: AbortSignal;
}

export type InvoiceServiceError = Error & {
  code?: string;
  invoice?: unknown;
  invoiceId?: string;
  businessId?: string;
  idempotencyKey?: string;
  reused?: boolean;
  failedTask?: UnknownRecord | null;
  invoiceMeta?: UnknownRecord | null;
  originalError?: unknown;
  details?: string;
};
