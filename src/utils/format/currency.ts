export const formatLocaleCurrency = (
  amount: number,
  currency: string,
  options: Intl.NumberFormatOptions = {},
): string =>
  new Intl.NumberFormat('es-DO', {
    style: 'currency',
    currency,
    ...options,
  }).format(amount);
