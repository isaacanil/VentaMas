import type { InvoiceData } from '@/types/invoice';
import { InvoiceDocumentHeader } from '@/modules/invoice/components/InvoiceDocumentHeader/InvoiceDocumentHeader';

interface InvoiceHeaderProps {
  invoice: InvoiceData;
}

export const InvoiceHeader = ({ invoice }: InvoiceHeaderProps) => (
  <InvoiceDocumentHeader invoice={invoice} />
);
