import type { InvoiceData, InvoiceFirestoreDoc } from '@/types/invoice';

export type PreorderFirestoreDoc = InvoiceFirestoreDoc;
export type PreorderData = InvoiceData;

export type PreorderClientOption = {
  value: string;
  label: string;
};

export type PreorderRowAction = {
  data?: InvoiceData | null;
};

export type PreorderRow = {
  numberID?: string | number;
  ncf?: string | null;
  client?: string;
  date?: number | null;
  itbis?: number;
  products?: number;
  status?: string | null;
  total?: number;
  accion: PreorderRowAction;
  dateGroup?: string;
};
