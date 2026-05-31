import type { StatusTone } from '../subscription.types';

export const CARD_TONE_STYLES: Record<
  StatusTone,
  {
    border: string;
    glow: string;
    badgeBackground: string;
    badgeColor: string;
    accentBackground: string;
    accentColor: string;
  }
> = {
  green: {
    border: 'rgb(13 148 136 / 30%)',
    glow: 'transparent',
    badgeBackground: 'rgb(13 148 136 / 10%)',
    badgeColor: '#0f766e',
    accentBackground: '#0d9488',
    accentColor: '#ffffff',
  },
  orange: {
    border: 'rgb(217 119 6 / 30%)',
    glow: 'transparent',
    badgeBackground: 'rgb(217 119 6 / 10%)',
    badgeColor: '#92400e',
    accentBackground: '#d97706',
    accentColor: '#ffffff',
  },
  red: {
    border: 'rgb(220 38 38 / 25%)',
    glow: 'transparent',
    badgeBackground: 'rgb(220 38 38 / 10%)',
    badgeColor: '#991b1b',
    accentBackground: '#dc2626',
    accentColor: '#ffffff',
  },
};

export const resolveBillingCycleSuffix = (billingCycle: string | null) => {
  const normalized = billingCycle?.trim().toLowerCase();

  if (
    normalized === 'monthly' ||
    normalized === 'month' ||
    normalized === 'mensual'
  ) {
    return '/mes';
  }

  if (
    normalized === 'yearly' ||
    normalized === 'annual' ||
    normalized === 'year' ||
    normalized === 'anual'
  ) {
    return '/ano';
  }

  if (
    normalized === 'weekly' ||
    normalized === 'week' ||
    normalized === 'semanal'
  ) {
    return '/semana';
  }

  if (
    normalized === 'daily' ||
    normalized === 'day' ||
    normalized === 'diario'
  ) {
    return '/dia';
  }

  return normalized ? `/${normalized}` : '';
};

export const formatPlanPrice = (amount: number | null, currency: string) => {
  if (amount == null) return 'No definido';

  return new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency: currency || 'DOP',
    maximumFractionDigits: 0,
  }).format(amount);
};

export const formatShortDate = (value: number | null) => {
  if (!value) return 'No disponible';

  return new Intl.DateTimeFormat('es-DO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
};
