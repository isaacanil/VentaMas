import type { InvoiceBusinessInfo, InvoiceData, InvoiceProduct } from '@/types/invoice';
import type { TimestampLike } from '@/utils/date/types';

export type InvoicePdfBusiness = InvoiceBusinessInfo;
export type InvoicePdfData = InvoiceData;
export type InvoicePdfProduct = InvoiceProduct;

export type QuotationData = InvoiceData & {
  createdAt?: TimestampLike | number | string | null;
  expirationDate?: TimestampLike | number | string | null;
  products?: InvoiceProduct[];
};

export type QuotationRequest = {
  data: {
    business: InvoiceBusinessInfo;
    data: QuotationData;
  };
};
