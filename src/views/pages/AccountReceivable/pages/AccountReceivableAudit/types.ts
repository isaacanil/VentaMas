export interface ReceivableInvoice {
  invoiceId: string;
  number?: number | string | null;
  ncf?: string | null;
  clientName: string;
  totalAmount: number;
  createdAt?: number | null;
  status?: string | null;
}

export interface AccountsReceivableDoc {
  id: string;
  invoiceId?: string | null;
  totalReceivable?: number;
  arBalance?: number;
  createdAt?: number | null;
}

export type ReceivablesLookup = Record<string, AccountsReceivableDoc>;
