import type { AccountsReceivableRecord, ReceivableAccountType, TimestampLike } from '@/utils/accountsReceivable/types';

export interface ProcessedAccountRow {
  ncf: string;
  invoiceNumber: string;
  client: string;
  rnc?: string;
  insurance: string;
  hasInsurance: boolean;
  date?: number | null;
  lastPaymentDate?: TimestampLike | null;
  initialAmount: number;
  totalPaid: number;
  balance: number;
  total: number;
  ver: { account: AccountsReceivableRecord };
  actions: { account: AccountsReceivableRecord };
  type: ReceivableAccountType;
}

export interface InsuranceOption {
  id: string;
  name: string;
}

export type PaymentMethodType = 'cash' | 'card' | 'transfer' | (string & {});   

export type PaymentMethodKey = 'value' | 'status' | 'reference';
export type PaymentMethodValue = number | string;

export type UpdatePaymentMethod = {
  (method: PaymentMethodType, key: 'value', value: PaymentMethodValue): void;
  (method: PaymentMethodType, key: 'reference', value: string): void;
  (method: PaymentMethodType, key: 'status', value: boolean): void;
};

export interface PaymentMethod {
  method: PaymentMethodType;
  value: PaymentMethodValue;
  reference?: string;
  status: boolean;
}

export interface ReceiptInstallment {
  number?: number;
  amount?: number;
}

export interface ReceiptAccount {
  id?: string;
  arId?: string;
  arNumber?: string;
  invoiceNumber?: string;
  totalPaid?: number;
  balance?: number;
  arBalance?: number;
  paidInstallments?: ReceiptInstallment[];
}

export interface PaymentReceiptData {
  createdAt?: { toMillis?: () => number } | number | null;
  date?: number | null;
  paymentId?: string;
  receiptId?: string;
  insurance?: string;
  accounts?: ReceiptAccount[];
  totalAmount?: number;
  total?: number;
  paymentMethod?: PaymentMethod[];
  paymentMethods?: PaymentMethod[];
  change?: number;
}
