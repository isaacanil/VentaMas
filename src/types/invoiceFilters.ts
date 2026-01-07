export type PaymentStatusFilter = 'paid' | 'partial' | 'unpaid' | '';

export interface DateRangeSelection {
  startDate: number | null;
  endDate: number | null;
}

export interface InvoiceFilters {
  startDate?: number | null;
  endDate?: number | null;
  clientId?: string | null;
  receivablesOnly?: boolean;
  paymentStatus?: PaymentStatusFilter;
  paymentMethod?: string | null;
  minAmount?: number | null;
  maxAmount?: number | null;
}
