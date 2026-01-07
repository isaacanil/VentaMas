// @ts-nocheck
export const PAYMENT_TERMS = [
  { days: 1, label: '1 día', timeUnit: 'day', value: 1 },
  { days: 7, label: '1 semana', timeUnit: 'week', value: 1 },
  { days: 15, label: '15 días', timeUnit: 'day', value: 15 },
  { days: 30, label: '1 mes', timeUnit: 'month', value: 1 },
  { days: 90, label: '3 meses', timeUnit: 'month', value: 3 },
  { days: 180, label: '6 meses', timeUnit: 'month', value: 6 },
  { days: 365, label: '1 año', timeUnit: 'year', value: 1 },
];

export const TIME_UNITS = [
  { value: 1, label: 'día', pluralLabel: 'días', unit: 'day' },
  { value: 7, label: 'semana', pluralLabel: 'semanas', unit: 'week' },
  { value: 30, label: 'mes', pluralLabel: 'meses', unit: 'month' },
  { value: 365, label: 'año', pluralLabel: 'años', unit: 'year' },
];
