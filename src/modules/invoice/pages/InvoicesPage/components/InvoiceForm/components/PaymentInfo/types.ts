import type {
  DiscountType,
  InvoiceData,
  InvoiceFormSliceState,
  InvoicePaymentMethod,
} from '@/types/invoice';

export type { DiscountType };

export interface PaymentMethod extends InvoicePaymentMethod {
  method: string;
  status: boolean;
  value: number;
}

export interface InvoiceState extends InvoiceData {}

export interface InvoiceSliceState extends InvoiceFormSliceState {}

export interface RootState {
  invoiceForm: InvoiceSliceState;
}

export interface PaymentInfoProps {
  isEditLocked?: boolean;
  onContinue?: (() => void) | null;
}

export interface PaymentInfoModalProps {
  isOpen: boolean;
  handleClose: () => void;
  isEditLocked?: boolean;
}
