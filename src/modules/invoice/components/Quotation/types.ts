import type { QuotationData } from '@/pdf/invoicesAndQuotation/types';

export type QuotationTemplateKey = 'template1' | 'template2';

export interface QuotationTemplateProps {
  data?: QuotationData | null;
  ignoreHidden?: boolean;
}

export interface QuotationProps extends QuotationTemplateProps {
  template?: QuotationTemplateKey;
}
