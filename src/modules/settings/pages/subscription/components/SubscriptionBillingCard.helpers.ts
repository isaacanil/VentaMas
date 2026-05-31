import type { PaymentRow, SubscriptionViewModel } from '../subscription.types';
import {
  formatDate,
  getProviderLabel,
  isSuccessfulPaymentStatus,
  normalizePaymentStatus,
} from '../subscription.utils';
import type {
  BillingInvoice,
  BillingInvoiceStatus,
} from './SubscriptionBillingCard.types';

export type BillingFilter = BillingInvoiceStatus | 'todos';

export const buildBillingInvoices = (
  paymentRows: PaymentRow[],
  subscription: SubscriptionViewModel,
): BillingInvoice[] =>
  paymentRows.map((item) => ({
    id: item.key,
    number: item.reference || item.key.toUpperCase(),
    date: formatDate(item.createdAt),
    amount: item.amount,
    status: normalizePaymentStatus(item.status),
    plan: subscription.displayName || 'Sin plan asignado',
    method: getProviderLabel(item.provider),
    description:
      item.description !== '-'
        ? item.description
        : 'Movimiento registrado desde el proveedor de pagos.',
    reference: item.reference,
  }));

export const filterBillingInvoices = (
  invoices: BillingInvoice[],
  filter: BillingFilter,
  search: string,
) => {
  const needle = search.trim().toLowerCase();
  return invoices.filter((invoice) => {
    const matchesFilter = filter === 'todos' || invoice.status === filter;
    const matchesSearch =
      !needle ||
      invoice.number.toLowerCase().includes(needle) ||
      invoice.plan.toLowerCase().includes(needle) ||
      invoice.method.toLowerCase().includes(needle);
    return matchesFilter && matchesSearch;
  });
};

export const calculateTotalPaid = (paymentRows: PaymentRow[]) =>
  paymentRows
    .filter((item) => isSuccessfulPaymentStatus(item.status))
    .reduce((sum, item) => sum + item.amount, 0);

export const countPaidInvoices = (paymentRows: PaymentRow[]) =>
  paymentRows.filter((item) => isSuccessfulPaymentStatus(item.status)).length;
