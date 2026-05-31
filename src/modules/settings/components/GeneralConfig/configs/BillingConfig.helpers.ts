import type { Business } from '@/features/auth/businessSlice';
import type { CartSettings } from '@/features/cart/types';
import { getInvoiceTemplateSummaryLabel } from '@/utils/invoice/template';

type BillingSettings = CartSettings['billing'];

export type BillingModalKey = 'invoice' | 'quote' | 'commissions' | null;

export const INVOICE_MODAL_BODY_STYLES = {
  padding: 0,
  height:
    'calc(100dvh - var(--modal-viewport-offset) - var(--modal-header-height) - var(--modal-footer-extra-offset))',
  overflow: 'hidden',
};

export const QUOTE_MODAL_BODY_STYLES = {
  padding: '24px',
};

export const getInvoiceSummary = (
  billing: BillingSettings | undefined,
  business: Business | null,
) => {
  const invoiceMessage = business?.invoice?.invoiceMessage;

  return [
    {
      label: 'Plazo Vencimiento',
      value: billing?.hasDueDate ? 'Habilitado' : 'A la fecha',
    },
    {
      label: 'Nota Legal',
      value: invoiceMessage ? 'Configurada' : 'Por defecto',
    },
    {
      label: 'Plantilla',
      value: getInvoiceTemplateSummaryLabel(billing?.invoiceType),
    },
  ];
};

export const getQuoteSummary = (billing: BillingSettings | undefined) => [
  {
    label: 'Servicio',
    value: billing?.quoteEnabled !== false ? 'Habilitado' : 'Deshabilitado',
  },
  {
    label: 'Validez',
    value: `${billing?.quoteValidity || 15} dias`,
  },
];

export const getCommissionsSummary = (billing: BillingSettings | undefined) => {
  const commissionSettings = billing?.serviceCommissions;

  return [
    {
      label: 'Estado',
      value: commissionSettings?.enabled ? 'Habilitado' : 'Deshabilitado',
    },
    {
      label: 'Base',
      value: 'Subtotal sin ITBIS',
    },
    {
      label: 'Tasa',
      value:
        commissionSettings?.defaultType === 'fixed'
          ? `RD$ ${commissionSettings?.defaultRate || 0}`
          : `${commissionSettings?.defaultRate || 0}%`,
    },
  ];
};
