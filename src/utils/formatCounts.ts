export const DEFAULT_COUNT_LOCALE = 'es-DO';

export type CountFormatValue = number | string | null | undefined;

const countFormatter = new Intl.NumberFormat(DEFAULT_COUNT_LOCALE);

export const createCountFormatter = (
  options?: Intl.NumberFormatOptions,
): Intl.NumberFormat => new Intl.NumberFormat(DEFAULT_COUNT_LOCALE, options);

const nullableCountValueFormatter = createCountFormatter({
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

export const toFiniteDisplayNumber = (value: unknown, fallback = 0): number => {
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

export const formatNullableCountValue = (value: CountFormatValue): string => {
  if (value === null || value === undefined || value === '') {
    return '';
  }

  if (typeof value === 'number') {
    return nullableCountValueFormatter.format(value);
  }

  const parsed = parseFloat(value.toString().replace(/,/g, ''));

  if (Number.isNaN(parsed)) {
    return '';
  }

  return nullableCountValueFormatter.format(parsed);
};
