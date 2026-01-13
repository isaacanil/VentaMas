import type { QuotationData } from '@/pdf/invoicesAndQuotation/types';

export interface QuotationSettings {
  quoteValidity?: number | null;
  quoteDefaultNote?: string | null;
}

export interface QuotationRecord extends QuotationData {
  id?: string;
  expired?: boolean;
}
