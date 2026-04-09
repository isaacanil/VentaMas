import type { ProductPricing } from '@/types/products';
import type { PaymentMethodEntry, PaymentState } from '@/types/payments';

export type DiscountType = 'percentage' | 'fixed';

export interface InvoiceMonetaryValue {
  value?: number | string | null;
}

export interface InvoiceDiscount extends InvoiceMonetaryValue {
  type?: DiscountType;
}

export interface InvoicePaymentMethod extends PaymentMethodEntry {}

export interface InvoiceClient {
  id?: string | number;
  name?: string;
  tel?: string;
  tel2?: string;
  personalID?: string;
  address?: string;
  rnc?: string;
  [key: string]: unknown;
}

export interface InvoiceProductAmount {
  total?: number;
  unit?: number;
  [key: string]: unknown;
}

export interface InvoiceProduct {
  id?: string;
  name?: string;
  productName?: string;
  stock?: number;
  pricing?: ProductPricing;
  selectedSaleUnit?: { pricing?: ProductPricing };
  price?: { unit?: number | string; total?: number | string };
  amountToBuy?: number | InvoiceProductAmount;
  barcode?: string;
  sku?: string;
  cid?: string;
  productId?: string;
  weightDetail?: {
    isSoldByWeight?: boolean;
    weight?: number;
    weightUnit?: string;
  };
  measurement?: string;
  footer?: string;
  brand?: string;
  warranty?: { status?: boolean; quantity?: number; unit?: string };
  insurance?: { mode?: string; value?: number };
  discount?: { value?: number; type?: string };
  comment?: string;
  category?: unknown;
  activeIngredients?: unknown;
  [key: string]: unknown;
}

export interface InvoiceCreditNote {
  id?: string | number;
  ncf?: string;
  amountUsed?: number;
  [key: string]: unknown;
}

export interface InvoiceSignatureAssets {
  enabled?: boolean;
  signatureUrl?: string;
  stampUrl?: string;
  signature?: {
    scale?: number;
    offsetX?: number;
    offsetY?: number;
  };
  stamp?: {
    scale?: number;
    offsetX?: number;
    offsetY?: number;
    opacity?: number;
  };
}

export interface InvoicePreorderDetails {
  isOrWasPreorder?: boolean;
  numberID?: string | number;
  date?: InvoiceTimestamp;
  selectedTaxReceiptType?: string | null;
  paymentStatus?: string | null;
  userID?: string | null;
  taxReceipt?: { type?: string | null };
  [key: string]: unknown;
}

type InvoiceTimestamp =
  | number
  | string
  | Date
  | { toMillis?: () => number; seconds?: number }
  | null;

export interface InvoiceData {
  id?: string;
  numberID?: string | number;
  NCF?: string;
  comprobante?: string;
  date?: InvoiceTimestamp;
  client?: InvoiceClient | null;
  products?: InvoiceProduct[];
  paymentMethod?: InvoicePaymentMethod[];
  payment?: InvoiceMonetaryValue;
  payWith?: InvoiceMonetaryValue;
  totalPurchase?: InvoiceMonetaryValue;
  totalPurchaseWithoutTaxes?: InvoiceMonetaryValue;
  totalTaxes?: InvoiceMonetaryValue;
  totalShoppingItems?: InvoiceMonetaryValue;
  change?: InvoiceMonetaryValue;
  discount?: InvoiceDiscount;
  delivery?: { value?: number | string | null; status?: boolean };
  totalInsurance?: InvoiceMonetaryValue;
  insuranceEnabled?: boolean;
  creditNotePayment?: InvoiceCreditNote[];
  seller?: { name?: string };
  history?: Array<Record<string, unknown>>;
  selectedTaxReceiptType?: string | null;
  copyType?: string;
  pendingBalance?: number;
  // Payment tracking (do not confuse with lifecycle status)
  accumulatedPaid?: number;
  balanceDue?: number;
  paymentStatus?: 'unpaid' | 'partial' | 'paid' | string | null;
  paymentState?: PaymentState | null;
  isAddedToReceivables?: boolean;
  collectedViaReceivables?: boolean;
  preorderDetails?: InvoicePreorderDetails;
  dueDate?: InvoiceTimestamp;
  status?: string;
  type?: string;
  sourceOfPurchase?: string;
  cancel?: { reason?: string; cancelledAt?: InvoiceTimestamp; user?: unknown };
  updatedAt?: InvoiceTimestamp;
  userID?: string | null;
  user?: unknown;
  [key: string]: unknown;
}

export interface InvoiceFormModalState {
  isOpen: boolean;
  mode: string;
}

export interface InvoiceFormSliceState {
  invoice: InvoiceData;
  modal: InvoiceFormModalState;
  authorizationRequest?: { id?: string | null } | null;
}

export interface InvoiceTemplateProps {
  data?: InvoiceData | null;
  ignoreHidden?: boolean;
  previewSignatureAssets?: InvoiceSignatureAssets;
}

export interface InvoiceBusinessInfo {
  name?: string;
  address?: string;
  tel?: string;
  rnc?: string;
  email?: string;
  logo?: string;
  logoUrl?: string;
  invoice?: {
    invoiceMessage?: string;
    invoiceType?: string;
    signatureAssets?: InvoiceSignatureAssets;
  };
  [key: string]: unknown;
}

export interface InvoiceFirestoreDoc extends Record<string, unknown> {
  id?: string;
  data?: InvoiceData;
}
