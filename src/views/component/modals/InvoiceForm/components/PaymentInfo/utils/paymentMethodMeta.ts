import { ReactNode } from 'react';

import { icons } from '@/constants/icons/icons';

export interface PaymentMethodMeta {
  label: string;
  icon: ReactNode;
}

const defaultMeta: PaymentMethodMeta = {
  label: 'Método de pago',
  icon: icons.finances.money,
};

export const PAYMENT_METHOD_META: Record<string, PaymentMethodMeta> = {
  cash: {
    label: 'Efectivo',
    icon: icons.finances.money,
  },
  card: {
    label: 'Tarjeta',
    icon: icons.finances.card,
  },
  transfer: {
    label: 'Transferencia',
    icon: icons.finances.transfer,
  },
  creditNote: {
    label: 'Nota de Crédito',
    icon: icons.finances.money,
  },
};

export const getPaymentMethodMeta = (
  methodKey?: string | null,
  fallbackLabel?: string,
): PaymentMethodMeta => {
  if (!methodKey) {
    return fallbackLabel
      ? { ...defaultMeta, label: fallbackLabel }
      : defaultMeta;
  }

  const meta = PAYMENT_METHOD_META[methodKey];
  if (meta) return meta;

  return {
    ...defaultMeta,
    label: fallbackLabel ?? methodKey,
  };
};
