import type { TimestampLike } from '@/utils/date/types';

export type { TimestampLike } from '@/utils/date/types';

export type AccountsReceivableStatusFilter = 'active' | 'inactive' | 'all';
export type AccountsReceivableClientType = 'normal' | 'insurance';
export type AccountsReceivablePaymentStatus = 'all' | 'paid' | 'unpaid' | 'partial';
export type AccountsReceivablePaymentFrequency =
  | 'weekly'
  | 'biweekly'
  | 'monthly'
  | 'quarterly'
  | 'annual'
  | 'daily'
  | string;
export type AccountsReceivableSortCriteria =
  | 'defaultCriteria'
  | 'date'
  | 'invoiceNumber'
  | 'client'
  | 'insurance'
  | 'balance'
  | 'initialAmount';
export type SortDirection = 'asc' | 'desc';

export interface AccountsReceivableDateRange {
  startDate: number | null;
  endDate: number | null;
}

export interface ReceivablePaymentMethod {
  status?: boolean;
  value?: number;
}

export interface ReceivableInvoiceData {
  NCF?: string;
  numberID?: string | number;
  number?: string | number;
  emissionDate?: TimestampLike;
  date?: TimestampLike;
  paymentMethod?: ReceivablePaymentMethod[];
  products?: unknown[];
  items?: unknown[];
  itemsCount?: number;
  totalShoppingItems?: number | { value?: number };
  totalPurchase?: { value?: number };
  totalAmount?: number;
  insurance?: { name?: string };
}

export interface ReceivableInvoice {
  id?: string;
  data?: ReceivableInvoiceData;
  error?: boolean;
}

export interface ReceivableClient {
  id?: string;
  name?: string;
  personalID?: string;
  tel?: string;
  tel2?: string;
  address?: string;
  sector?: string;
  error?: boolean;
}

export type ReceivableAccountType = 'insurance' | 'normal' | string;

export interface AccountsReceivableDoc extends Record<string, unknown> {
  id?: string;
  type?: ReceivableAccountType;
  insurance?: { name?: string };
  numberId?: string | number;
  invoiceId?: string;
  clientId?: string;
  paymentFrequency?: AccountsReceivablePaymentFrequency;
  totalInstallments?: number;
  installmentAmount?: number;
  paymentDate?: TimestampLike;
  lastPaymentDate?: TimestampLike;
  lastPayment?: number;
  totalReceivable?: number;
  currentBalance?: number;
  arBalance?: number;
  isClosed?: boolean;
  isActive?: boolean;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  createdBy?: string;
  updatedBy?: string;
  comments?: string;
}

export interface AccountsReceivableInstallment {
  id?: string;
  arId?: string;
  installmentNumber?: number;
  installmentDate?: TimestampLike;
  installmentAmount?: number;
  installmentBalance?: number;
  createdAt?: TimestampLike;
  updatedAt?: TimestampLike;
  createdBy?: string;
  updatedBy?: string;
  isActive?: boolean;
}

export interface AccountsReceivableInstallmentPayment {
  id?: string;
  arId?: string;
  installmentId?: string;
  paymentId?: string;
  createdAt?: TimestampLike;
  paymentAmount?: number;
  createdBy?: string;
  updatedBy?: string;
  isActive?: boolean;
  paymentDetails?: AccountsReceivablePayment | null;
}

export interface AccountsReceivableInstallmentWithPayments
  extends AccountsReceivableInstallment {
  payments?: AccountsReceivableInstallmentPayment[];
}

export interface AccountsReceivablePayment {
  id?: string;
  arId?: string;
  createdAt?: TimestampLike;
  createdUserId?: string;
  totalPaid?: number;
  isActive?: boolean;
  paymentMethods?: Array<{ status?: boolean; method?: string; value?: number }>;
  comments?: string;
}

export interface AccountsReceivableDetail {
  ar: AccountsReceivableDoc;
  installments: AccountsReceivableInstallment[];
  installmentPayments: AccountsReceivableInstallmentPayment[];
  payments: AccountsReceivablePayment[];
}

export interface AccountsReceivableDetailsModal {
  accountReceivable: AccountsReceivableDoc;
  client: ReceivableClient | null;
  invoice: ReceivableInvoice | null;
  installments: AccountsReceivableInstallmentWithPayments[];
}

export interface ReceivableAuditInvoice {
  invoiceId: string;
  number?: number | string | null;
  ncf?: string | null;
  clientName: string;
  totalAmount: number;
  createdAt?: number | null;
  status?: string | null;
}

export type ReceivablesLookup = Record<string, AccountsReceivableDoc>;

export interface AccountsReceivableRecord {
  id: string;
  lastPaymentDate?: TimestampLike;
  balance?: number;
  initialAmountAr?: number;
  createdAt?: TimestampLike;
  account: AccountsReceivableDoc;
  client?: ReceivableClient | null;
  invoice?: ReceivableInvoice | null;
}

export interface AccountReceivableRow {
  id: string;
  ncf: string;
  invoiceNumber: string;
  client: string;
  rnc?: string;
  insurance: string;
  hasInsurance: boolean;
  isInsurance: boolean;
  date?: TimestampLike;
  initialAmount: number;
  lastPaymentDate?: TimestampLike;
  totalPaid: number;
  balance: number;
  products: number;
  total: number;
  ver: { account: AccountsReceivableRecord };
  actions: { account: AccountsReceivableRecord };
  type: ReceivableAccountType;
  dateGroup: string;
}

export type AccountsReceivableSummaryData = AccountsReceivableDetail;
export type AccountsReceivableSummaryView = Omit<
  AccountsReceivableDetail,
  'ar' | 'installments' | 'payments' | 'installmentPayments'
> & {
  ar?: AccountsReceivableDoc | null;
  client?: ReceivableClient | null;
  invoice?: ReceivableInvoiceData | ReceivableInvoice | null;
  installments?: AccountsReceivableInstallment[];
  installmentPayments?: AccountsReceivableInstallmentPayment[];
  payments?: AccountsReceivablePayment[];
};

export interface AccountsReceivablePaymentReceipt {
  account: AccountReceivableRow;
  receiptNumber: string;
  payment: AccountsReceivablePayment;
  installmentsPaid: AccountsReceivableInstallment[];
  client: ReceivableClient;
}

export type ReceivablePaidInstallment = AccountsReceivableInstallment;
export type ReceivablePaymentReceiptAccount = AccountReceivableRow;

export interface CreditLimitConfig {
  enabled: boolean;
  limit: number;
  currentUsage: number;
}
