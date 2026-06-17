import type { InvoiceData, InvoicePaymentMethod } from '@/types/invoice';

export const PAYMENT_METHOD_LABELS = {
  cash: 'Efectivo',
  transfer: 'Transferencia',
  card: 'Tarjeta',
} as const;

const PAYMENT_METHOD_TRANSLATIONS: Record<string, string> = {
  cash: 'efectivo',
  card: 'tarjeta',
  transfer: 'transferencia',
};

const PAYMENT_METHOD_ABBREVIATIONS: Record<string, string> = {
  cash: 'Efectivo',
  card: 'TC',
  transfer: 'Transf',
};

export type PaymentMethodKey = keyof typeof PAYMENT_METHOD_LABELS;

export const resolveInvoicePaymentLabel = (
  method?: InvoicePaymentMethod | null,
): string => {
  const fallback = typeof method?.name === 'string' ? method.name : '';
  const rawMethod =
    typeof method?.method === 'string' ? method.method : fallback;
  if (!rawMethod) return fallback;
  const key = rawMethod.toLowerCase() as PaymentMethodKey;
  return PAYMENT_METHOD_LABELS[key] || rawMethod;
};

export const resolveInvoicePaymentMethods = (
  methods?: InvoicePaymentMethod[] | null,
): InvoicePaymentMethod[] => (Array.isArray(methods) ? methods : []);

export function getActivePaymentMethods(
  invoice: Pick<InvoiceData, 'paymentMethod'> | null | undefined,
): string {
  const activeMethods: string[] = [];
  const paymentMethods = resolveInvoicePaymentMethods(invoice?.paymentMethod);

  paymentMethods.forEach((method) => {
    if (method.status && method.method) {
      activeMethods.push(method.method);
    }
  });

  return activeMethods.join(', ') || '';
}

export function translatePaymentMethods(methodsString: string): string {
  const methodsArray = methodsString.split(', ');

  return methodsArray
    .map((method) => PAYMENT_METHOD_TRANSLATIONS[method] || method)
    .join(', ');
}

export function abbreviatePaymentMethods(methodsArray: string[]): string {
  return methodsArray
    .map((method) => PAYMENT_METHOD_ABBREVIATIONS[method.toLowerCase()] || method)
    .join(', ');
}
