import type { CreditNoteSelection } from '@/types/creditNote';
import type { InvoiceData } from '@/types/invoice';
import type { AccountsReceivablePaymentReceipt as AccountsReceivablePaymentReceiptData } from '@/utils/accountsReceivable/types';

export type AccountsReceivablePaymentMethod = {
  method: string;
  value: number;
  status: boolean;
  reference?: string;
  name?: string;
};

export type PaymentDetails = {
  paymentScope: string;
  paymentOption: string;
  clientId: string;
  arId?: string;
  paymentMethods: AccountsReceivablePaymentMethod[];
  comments: string;
  totalAmount: number;
  totalPaid: number;
  totalAmountDue?: number;
  printReceipt: boolean;
  creditNotePayment?: CreditNoteSelection[];
  originType?: string;
  originId?: string;
  preorderId?: string;
};

export type SubmitPaymentScope = 'balance' | 'account';
export type SubmitPaymentOption = 'installment' | 'balance' | 'partial';
export type SubmitPaymentDetails = Omit<
  PaymentDetails,
  'paymentScope' | 'paymentOption'
> & {
  paymentScope: SubmitPaymentScope;
  paymentOption?: SubmitPaymentOption;
  totalAmount?: number | string;
};

export type AccountsReceivablePaymentStateLike = {
  paymentDetails: PaymentDetails;
};

export type ClientSummary = {
  id?: string;
  name?: string;
  tel?: string;
  address?: string;
  personalID?: string;
  delivery?: {
    status?: boolean;
    value?: number;
  };
} & Record<string, unknown>;

export type FormValidationError = {
  errorFields?: unknown[];
  message?: string;
};

export type ReceiptAccount = {
  arBalance?: number;
  arNumber?: string | number | null;
  documentType?: string | null;
  documentLabel?: string | null;
  documentNumber?: string | number | null;
  invoiceNumber?: string | number | null;
  invoiceId?: string | number | null;
};

export type ProcessedPaymentReceipt =
  | AccountsReceivablePaymentReceiptData
  | {
      accounts?: ReceiptAccount[];
      totalAmount?: number | string;
      [key: string]: unknown;
    };

export type AutoCompleteTarget = {
  preorderId: string;
  arNumber?: string | number | null;
  sourceDocumentLabel?: string;
  sourceDocumentNumber?: string | number | null;
  paidAmount?: number;
};

export type AutoCompleteClient = {
  id?: string | null;
  name?: string | null;
  [key: string]: unknown;
};

export type TaxReceiptOption = {
  value: string;
  label: string;
  remaining: number;
};

export type AutoCompleteModalState = {
  success: boolean;
  errorCode?: string | null;
  preorderId: string;
  arNumber?: string | number | null;
  sourceDocumentLabel?: string;
  sourceDocumentNumber?: string | number | null;
  invoiceId?: string;
  invoiceNumber?: string | number | null;
  invoiceNcf?: string | null;
  paidAmount?: number;
  invoice?: InvoiceData | null;
  error?: string;
};
