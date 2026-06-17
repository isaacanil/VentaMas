export const DEFAULT_COUNT_LOCALE = 'es-DO';

export type CountFormatValue = number | string | null | undefined;

const countFormatter = new Intl.NumberFormat(DEFAULT_COUNT_LOCALE);

export const createCountFormatter = (
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat => new Intl.NumberFormat(DEFAULT_COUNT_LOCALE, options);

export const toFiniteDisplayNumber = (
  value: unknown,
  fallback = 0,
): number => {
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : fallback;
};

export const formatCount = (value: number): string =>
  countFormatter.format(value);

export const formatCountValue = (
  value: CountFormatValue,
  options?: Intl.NumberFormatOptions,
): string => {
  const formatter = options ? createCountFormatter(options) : countFormatter;
  return formatter.format(toFiniteDisplayNumber(value));
};
