import type { CartSettings } from '@/features/cart/types';

export type BillingMode = 'direct' | 'deferred';
export type InvoiceGenerationTiming = 'first-payment' | 'full-payment';
export type BillingSettings = CartSettings['billing'];

export const BILLING_MODE_OPTIONS: Array<{
  value: BillingMode;
  title: string;
  description: string;
}> = [
  {
    value: 'direct',
    title: 'Venta Directa',
    description: 'Factura inmediata.',
  },
  {
    value: 'deferred',
    title: 'Modo Preventa',
    description: 'Facturacion diferida.',
  },
];

export const normalizeTiming = (
  raw?: string | null,
): InvoiceGenerationTiming =>
  raw === 'full-payment' || raw === 'always-ask' || raw === 'manual'
    ? 'full-payment'
    : 'first-payment';
