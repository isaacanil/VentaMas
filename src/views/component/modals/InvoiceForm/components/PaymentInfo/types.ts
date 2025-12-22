export type DiscountType = 'percentage' | 'fixed';

export interface PaymentMethod {
  method: string;
  name?: string;
  status: boolean;
  value: number;
  reference?: string;
}

export interface MonetaryValue {
  value?: number | string | null;
}

export interface InvoiceDiscount {
  value?: number | string | null;
  type?: DiscountType;
}

export interface InvoiceState {
  paymentMethod?: PaymentMethod[];
  totalPurchase?: MonetaryValue;
  totalPurchaseWithoutTaxes?: MonetaryValue;
  change?: MonetaryValue;
  discount?: InvoiceDiscount;
}

export interface InvoiceSliceState {
  invoice: InvoiceState;
}

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
