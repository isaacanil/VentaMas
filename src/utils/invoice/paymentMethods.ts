import type { InvoicePaymentMethod } from '@/types/invoice';

export const PAYMENT_METHOD_LABELS = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
} as const;

export type PaymentMethodKey = keyof typeof PAYMENT_METHOD_LABELS;

export const resolveInvoicePaymentLabel = (
  method?: InvoicePaymentMethod | null,
): string => {
  const fallback = typeof method?.name === 'string' ? method.name : '';
  const rawMethod = typeof method?.method === 'string' ? method.method : fallback;
  if (!rawMethod) return fallback;
  const key = rawMethod.toLowerCase() as PaymentMethodKey;
  return PAYMENT_METHOD_LABELS[key] || rawMethod;
};

export const resolveInvoicePaymentMethods = (
  methods?: InvoicePaymentMethod[] | null,
): InvoicePaymentMethod[] => (Array.isArray(methods) ? methods : []);
