export type BillingInvoiceStatus =
  | 'pagado'
  | 'pendiente'
  | 'fallido'
  | 'cancelado'
  | 'desconocido';

export interface BillingInvoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: BillingInvoiceStatus;
  plan: string;
  method: string;
  description: string;
  reference?: string | null;
}
